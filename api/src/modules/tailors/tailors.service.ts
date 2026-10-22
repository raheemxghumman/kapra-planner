import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, type SelectQueryBuilder } from 'typeorm';
import { paginate, PaginationQueryDto, type Paginated } from '../../common/dto/pagination.dto.js';
import { UserStatus } from '../../common/enums/user-status.enum.js';
import type { TailorQueryDto } from './dto/tailor.dto.js';
import { Review } from './entities/review.entity.js';
import { TailorProfile } from './entities/tailor-profile.entity.js';
import { TailorService } from './entities/tailor-service.entity.js';

export type TailorCard = TailorProfile & { distanceKm: number | null };

export interface PublicReview {
  id: string;
  rating: number;
  comment: string | null;
  sentimentLabel: string | null;
  reply: string | null;
  createdAt: Date;
  customerName: string;
}

/** Haversine distance in km from (:lat, :lng) to the tailor, written in SQL. */
const DISTANCE_SQL = `(2 * 6371 * asin(sqrt(
  power(sin(radians(t.lat - :lat) / 2), 2) +
  cos(radians(:lat)) * cos(radians(t.lat)) * power(sin(radians(t.lng - :lng) / 2), 2)
)))`;

const escapeLike = (value: string) => value.replace(/[\\%_]/g, (char) => `\\${char}`);
const firstName = (name: string) => name.split(' ')[0];

/** Public side: the map, search and tailor pages. Only approved (active) tailors are shown. */
@Injectable()
export class TailorsService {
  constructor(
    @InjectRepository(TailorProfile) private readonly tailors: Repository<TailorProfile>,
    @InjectRepository(TailorService) private readonly services: Repository<TailorService>,
    @InjectRepository(Review) private readonly reviews: Repository<Review>,
  ) {}

  private visible(): SelectQueryBuilder<TailorProfile> {
    return this.tailors
      .createQueryBuilder('t')
      .innerJoin('t.user', 'u')
      .where('u.status = :active', { active: UserStatus.Active });
  }

  async search(query: TailorQueryDto): Promise<Paginated<TailorCard>> {
    const qb = this.visible();
    if (query.q) {
      qb.andWhere('(t.business_name ILIKE :q OR t.address ILIKE :q OR t.city ILIKE :q)', {
        q: `%${escapeLike(query.q)}%`,
      });
    }
    if (query.city) qb.andWhere('lower(t.city) = lower(:city)', { city: query.city });
    if (query.speciality)
      qb.andWhere(':speciality = ANY(t.specialities)', { speciality: query.speciality });
    if (query.minRating) qb.andWhere('t.rating_avg >= :minRating', { minRating: query.minRating });

    const located = query.lat !== undefined && query.lng !== undefined;
    if (located) {
      // A cheap bounding box first (1 degree of latitude is about 111 km), then the exact distance.
      const latDelta = query.radiusKm / 111;
      const lngDelta = query.radiusKm / (111 * Math.cos((query.lat! * Math.PI) / 180));
      qb.andWhere('t.lat BETWEEN :minLat AND :maxLat AND t.lng BETWEEN :minLng AND :maxLng', {
        minLat: query.lat! - latDelta,
        maxLat: query.lat! + latDelta,
        minLng: query.lng! - lngDelta,
        maxLng: query.lng! + lngDelta,
      })
        .andWhere(`${DISTANCE_SQL} <= :radius`, { radius: query.radiusKm })
        .addSelect(DISTANCE_SQL, 'distance_km')
        .setParameters({ lat: query.lat, lng: query.lng });
    }

    switch (query.sort) {
      case 'nearest':
        if (located) qb.orderBy('distance_km', 'ASC');
        else qb.orderBy('t.rank_score', 'DESC');
        break;
      case 'rating':
        qb.orderBy('t.rating_avg', 'DESC').addOrderBy('t.rating_count', 'DESC');
        break;
      case 'price':
        qb.orderBy('t.price_from', 'ASC', 'NULLS LAST');
        break;
      default:
        qb.orderBy('t.rank_score', 'DESC');
    }
    qb.addOrderBy('t.id', 'ASC'); // stable order across pages

    const total = await qb.getCount();
    const { entities, raw } = await qb
      .offset((query.page - 1) * query.limit)
      .limit(query.limit)
      .getRawAndEntities();
    const cards = entities.map((tailor, index) =>
      Object.assign(tailor, {
        distanceKm: located ? Math.round(Number(raw[index].distance_km) * 10) / 10 : null,
      }),
    );
    return paginate(cards, total, query);
  }

  /** Everything the tailor's public page needs. */
  async findBySlug(slug: string) {
    const tailor = await this.visible().andWhere('t.slug = :slug', { slug }).getOne();
    if (!tailor) throw new NotFoundException('Tailor not found');

    const [services, breakdown, reviews] = await Promise.all([
      this.services.find({
        where: { tailorId: tailor.id, isActive: true },
        order: { price: 'ASC' },
      }),
      this.reviews
        .createQueryBuilder('r')
        .select('r.rating', 'stars')
        .addSelect('count(*)::int', 'count')
        .where('r.tailor_id = :id AND r.is_hidden = false', { id: tailor.id })
        .groupBy('r.rating')
        .getRawMany<{ stars: number; count: number }>(),
      this.listReviews(tailor.id, Object.assign(new PaginationQueryDto(), { limit: 6 })),
    ]);

    const ratingBreakdown = [5, 4, 3, 2, 1].map((stars) => ({
      stars,
      count: breakdown.find((row) => Number(row.stars) === stars)?.count ?? 0,
    }));
    return Object.assign(tailor, { services, ratingBreakdown, reviews: reviews.data });
  }

  async reviewsBySlug(slug: string, query: PaginationQueryDto): Promise<Paginated<PublicReview>> {
    const tailor = await this.visible()
      .select('t.id')
      .andWhere('t.slug = :slug', { slug })
      .getOne();
    if (!tailor) throw new NotFoundException('Tailor not found');
    return this.listReviews(tailor.id, query);
  }

  /** Visible reviews, newest first, with only the reviewer's first name (no email or phone). */
  async listReviews(tailorId: string, query: PaginationQueryDto): Promise<Paginated<PublicReview>> {
    const [rows, total] = await this.reviews.findAndCount({
      where: { tailorId, isHidden: false },
      relations: { customer: true },
      order: { createdAt: 'DESC' },
      skip: (query.page - 1) * query.limit,
      take: query.limit,
    });
    const data = rows.map((review) => ({
      id: review.id,
      rating: review.rating,
      comment: review.comment,
      sentimentLabel: review.sentimentLabel,
      reply: review.reply,
      createdAt: review.createdAt,
      customerName: firstName(review.customer.name),
    }));
    return paginate(data, total, query);
  }
}

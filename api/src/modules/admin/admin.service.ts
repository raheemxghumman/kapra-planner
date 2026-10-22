import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { DataSource, ILike, Repository, type FindOptionsWhere } from 'typeorm';
import { paginate, type Paginated } from '../../common/dto/pagination.dto.js';
import { UserRole } from '../../common/enums/user-role.enum.js';
import { UserStatus } from '../../common/enums/user-status.enum.js';
import { Brand } from '../brands/entities/brand.entity.js';
import { NotificationsService } from '../notifications/notifications.service.js';
import { Review } from '../tailors/entities/review.entity.js';
import { TailorRankingService } from '../tailors/ranking/tailor-ranking.service.js';
import { User } from '../users/entities/user.entity.js';
import type { AdminReviewQueryDto, AdminUserQueryDto } from './dto/admin.dto.js';

@Injectable()
export class AdminService {
  constructor(
    @InjectRepository(User) private readonly users: Repository<User>,
    @InjectRepository(Brand) private readonly brands: Repository<Brand>,
    @InjectRepository(Review) private readonly reviews: Repository<Review>,
    @InjectDataSource() private readonly dataSource: DataSource,
    private readonly notifications: NotificationsService,
    private readonly ranking: TailorRankingService,
  ) {}

  /** The admin dashboard numbers, in one round trip of small aggregate queries. */
  async stats() {
    const count = (sql: string) => this.dataSource.query(sql);
    const [users, bookings, orders, revenue, catalogue, ai, pending, daily] = await Promise.all([
      count(`SELECT role, status, count(*)::int AS count FROM users GROUP BY role, status`),
      count(`SELECT status, count(*)::int AS count FROM bookings GROUP BY status`),
      count(`SELECT status, count(*)::int AS count FROM orders GROUP BY status`),
      count(`SELECT purpose, COALESCE(sum(amount), 0)::int AS total, count(*)::int AS count
             FROM payments WHERE status = 'paid' GROUP BY purpose`),
      count(`SELECT
               (SELECT count(*)::int FROM products WHERE is_active AND NOT hidden_by_brand) AS products,
               (SELECT count(*)::int FROM brands WHERE verified) AS brands,
               (SELECT count(*)::int FROM brands WHERE owner_id IS NOT NULL) AS "partnerBrands",
               (SELECT count(*)::int FROM tailor_profiles) AS tailors,
               (SELECT count(*)::int FROM reviews) AS reviews,
               (SELECT max(last_synced_at) FROM brands) AS "lastSync"`),
      count(`SELECT
               (SELECT count(*)::int FROM stylist_requests WHERE engine = 'ai') AS "stylistAi",
               (SELECT count(*)::int FROM stylist_requests WHERE engine = 'rules') AS "stylistRules",
               (SELECT round(avg(duration_ms))::int FROM stylist_requests WHERE status = 'completed') AS "stylistAvgMs",
               (SELECT count(*)::int FROM try_ons WHERE status = 'completed') AS "tryOnsDone",
               (SELECT count(*)::int FROM try_ons WHERE status = 'failed') AS "tryOnsFailed"`),
      count(`SELECT id, name, email, role, created_at AS "createdAt" FROM users
             WHERE status = 'pending' ORDER BY created_at LIMIT 10`),
      count(`SELECT to_char(d.day, 'YYYY-MM-DD') AS day,
               (SELECT count(*)::int FROM users u WHERE u.created_at::date = d.day) AS signups,
               (SELECT COALESCE(sum(amount), 0)::int FROM payments p WHERE p.status = 'paid' AND p.paid_at::date = d.day) AS revenue
             FROM generate_series(current_date - 13, current_date, interval '1 day') AS d(day) ORDER BY d.day`),
    ]);
    return { users, bookings, orders, revenue, catalogue: catalogue[0], ai: ai[0], pending, daily };
  }

  async listUsers(query: AdminUserQueryDto): Promise<Paginated<User>> {
    const base: FindOptionsWhere<User> = {};
    if (query.role) base.role = query.role;
    if (query.status) base.status = query.status;
    const where = query.q
      ? [
          { ...base, name: ILike(`%${query.q}%`) },
          { ...base, email: ILike(`%${query.q}%`) },
        ]
      : base;
    const [rows, total] = await this.users.findAndCount({
      where,
      order: { createdAt: 'DESC' },
      skip: (query.page - 1) * query.limit,
      take: query.limit,
    });
    return paginate(rows, total, query);
  }

  /** Approve (active), hold (pending) or suspend a user. Suspending also signs them out. */
  async setUserStatus(adminId: string, id: string, status: UserStatus): Promise<User> {
    if (id === adminId) throw new BadRequestException('You cannot change your own status');
    const user = await this.users.findOneBy({ id });
    if (!user) throw new NotFoundException('User not found');
    if (user.role === UserRole.Admin)
      throw new BadRequestException('Admin accounts cannot be changed here');
    if (user.status === status) return user;

    if (status === UserStatus.Active && user.status === UserStatus.Pending)
      return this.approve(user);
    await this.users.update(user.id, { status });
    if (status === UserStatus.Suspended) {
      await this.dataSource.query(
        `UPDATE refresh_tokens SET revoked_at = now() WHERE user_id = $1 AND revoked_at IS NULL`,
        [user.id],
      );
    }
    return { ...user, status } as User;
  }

  /** Activates a pending brand or tailor account and tells them. */
  private async approve(user: User): Promise<User> {
    await this.users.update(user.id, { status: UserStatus.Active });
    await this.notifications.notify(user.id, {
      type: 'account.approved',
      title: 'Your account is approved',
      body:
        user.role === UserRole.Tailor
          ? 'Your shop now appears on the Kapra map.'
          : 'You can now sell on Kapra.',
      link: user.role === UserRole.Tailor ? '/tailor' : '/brand',
    });
    return { ...user, status: UserStatus.Active } as User;
  }

  /** Links a brand account to a brand (or unlinks it). Linking also approves the account. */
  async linkBrandOwner(brandId: string, userId: string | null): Promise<Brand> {
    const brand = await this.brands.findOneBy({ id: brandId });
    if (!brand) throw new NotFoundException('Brand not found');

    if (userId) {
      const user = await this.users.findOneBy({ id: userId });
      if (!user || user.role !== UserRole.Brand)
        throw new BadRequestException('Choose a brand account');
      const owned = await this.brands.findOneBy({ ownerId: userId });
      if (owned && owned.id !== brand.id)
        throw new ConflictException(`This account already manages ${owned.name}`);
      if (user.status === UserStatus.Pending) await this.approve(user);
    }
    await this.brands.update(brand.id, { ownerId: userId, verified: true });
    return (await this.brands.findOneBy({ id: brand.id }))!;
  }

  async listReviews(query: AdminReviewQueryDto) {
    const qb = this.reviews
      .createQueryBuilder('r')
      .innerJoin('r.tailor', 't')
      .innerJoin('r.customer', 'c')
      .select(['r', 't.id', 't.businessName', 't.slug', 'c.id', 'c.name'])
      .skip((query.page - 1) * query.limit)
      .take(query.limit);
    if (query.filter === 'hidden') qb.where('r.isHidden = true').orderBy('r.createdAt', 'DESC');
    else if (query.filter === 'negative')
      qb.where("r.sentimentLabel = 'negative'").orderBy('r.sentimentScore', 'ASC');
    else qb.orderBy('r.createdAt', 'DESC');
    const [rows, total] = await qb.getManyAndCount();
    return paginate(rows, total, query);
  }

  /** Hidden reviews stop counting towards the tailor's rating and rank. */
  async setReviewHidden(id: string, hidden: boolean): Promise<Review> {
    const review = await this.reviews.findOneBy({ id });
    if (!review) throw new NotFoundException('Review not found');
    await this.reviews.update(review.id, { isHidden: hidden });
    await this.ranking.recomputeAll();
    return { ...review, isHidden: hidden } as Review;
  }
}

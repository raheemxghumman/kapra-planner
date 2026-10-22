import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import type {
  CreateMeasurementDto,
  UpdateMeasurementDto,
  UpdateStyleProfileDto,
} from './dto/profile.dto.js';
import { MeasurementProfile } from './entities/measurement-profile.entity.js';
import { StyleProfile } from './entities/style-profile.entity.js';

const MAX_MEASUREMENT_PROFILES = 10;

@Injectable()
export class ProfilesService {
  constructor(
    @InjectRepository(StyleProfile) private readonly styleProfiles: Repository<StyleProfile>,
    @InjectRepository(MeasurementProfile)
    private readonly measurements: Repository<MeasurementProfile>,
  ) {}

  /** Returns the customer's style profile, creating one with defaults the first time. */
  async getStyleProfile(userId: string): Promise<StyleProfile> {
    const existing = await this.styleProfiles.findOneBy({ userId });
    return existing ?? this.styleProfiles.save(this.styleProfiles.create({ userId }));
  }

  async updateStyleProfile(userId: string, dto: UpdateStyleProfileDto): Promise<StyleProfile> {
    const profile = await this.getStyleProfile(userId);
    Object.assign(profile, dto);
    if (profile.budgetMin > profile.budgetMax) {
      throw new BadRequestException('Minimum budget cannot be more than the maximum');
    }
    return this.styleProfiles.save(profile);
  }

  listMeasurements(userId: string): Promise<MeasurementProfile[]> {
    return this.measurements.find({ where: { userId }, order: { createdAt: 'ASC' } });
  }

  async createMeasurement(userId: string, dto: CreateMeasurementDto): Promise<MeasurementProfile> {
    if ((await this.measurements.countBy({ userId })) >= MAX_MEASUREMENT_PROFILES) {
      throw new BadRequestException(
        `You can keep up to ${MAX_MEASUREMENT_PROFILES} measurement profiles`,
      );
    }
    return this.measurements.save(this.measurements.create({ ...dto, userId }));
  }

  async updateMeasurement(
    userId: string,
    id: string,
    dto: UpdateMeasurementDto,
  ): Promise<MeasurementProfile> {
    const measurement = await this.findOwnMeasurement(userId, id);
    Object.assign(measurement, dto);
    return this.measurements.save(measurement);
  }

  async deleteMeasurement(userId: string, id: string): Promise<void> {
    await this.measurements.remove(await this.findOwnMeasurement(userId, id));
  }

  /**
   * Ownership check: looking up by id AND user means another customer's id simply is not found
   * (404), so we never reveal that the record exists.
   */
  async findOwnMeasurement(userId: string, id: string): Promise<MeasurementProfile> {
    const measurement = await this.measurements.findOneBy({ id, userId });
    if (!measurement) throw new NotFoundException('Measurement profile not found');
    return measurement;
  }
}

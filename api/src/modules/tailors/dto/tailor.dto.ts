import { PartialType } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsBoolean,
  IsEnum,
  IsIn,
  IsInt,
  IsLatitude,
  IsLongitude,
  IsNumber,
  IsOptional,
  IsString,
  Length,
  Matches,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { PaginationQueryDto } from '../../../common/dto/pagination.dto.js';
import { PHONE_MESSAGE, PHONE_PATTERN } from '../../../common/validation/patterns.js';
import { ServiceType, TAILOR_SORTS, TailorSpeciality, type TailorSort } from '../tailors.enums.js';

const trim = ({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : value);

export class TailorQueryDto extends PaginationQueryDto {
  /** Name or area, e.g. "bridal" or "Gulberg". */
  @IsOptional()
  @Transform(trim)
  @IsString()
  @MaxLength(80)
  q?: string;

  @IsOptional()
  @Transform(trim)
  @IsString()
  @MaxLength(60)
  city?: string;

  @IsOptional()
  @IsEnum(TailorSpeciality)
  speciality?: TailorSpeciality;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(5)
  minRating?: number;

  /** The customer's location; with it, results get distances and a radius filter. */
  @IsOptional()
  @Type(() => Number)
  @IsLatitude()
  lat?: number;

  @IsOptional()
  @Type(() => Number)
  @IsLongitude()
  lng?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  radiusKm = 15;

  @IsOptional()
  @IsIn(TAILOR_SORTS)
  sort: TailorSort = 'best';
}

export class UpsertTailorProfileDto {
  @Transform(trim)
  @IsString()
  @Length(2, 80)
  businessName: string;

  @IsOptional()
  @Transform(trim)
  @IsString()
  @MaxLength(1000)
  bio?: string;

  @Transform(trim)
  @Matches(PHONE_PATTERN, { message: PHONE_MESSAGE })
  phone: string;

  @Transform(trim)
  @IsString()
  @Length(5, 200)
  address: string;

  @Transform(trim)
  @IsString()
  @Length(2, 60)
  city: string;

  /** Pin dropped on the map. Without it, the address is looked up on OpenStreetMap. */
  @IsOptional()
  @IsLatitude()
  lat?: number;

  @IsOptional()
  @IsLongitude()
  lng?: number;

  @IsEnum(TailorSpeciality, { each: true })
  @ArrayMaxSize(6)
  specialities: TailorSpeciality[];

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(60)
  turnaroundDays: number;

  @IsBoolean()
  homeVisits: boolean;
}

export class CreateTailorServiceDto {
  @Transform(trim)
  @IsString()
  @Length(2, 80)
  name: string;

  @IsEnum(ServiceType)
  type: ServiceType;

  @IsOptional()
  @Transform(trim)
  @IsString()
  @MaxLength(300)
  description?: string;

  @IsInt()
  @Min(100)
  @Max(500_000)
  price: number;

  @IsInt()
  @Min(1)
  @Max(90)
  durationDays: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class UpdateTailorServiceDto extends PartialType(CreateTailorServiceDto) {}

export class ReviewReplyDto {
  @Transform(trim)
  @IsString()
  @Length(2, 500)
  reply: string;
}

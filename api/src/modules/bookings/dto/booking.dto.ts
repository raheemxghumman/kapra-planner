import { Transform, Type } from 'class-transformer';
import {
  IsDate,
  IsEnum,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Length,
  Max,
  MaxLength,
  Min,
  ValidateIf,
} from 'class-validator';
import { PaginationQueryDto } from '../../../common/dto/pagination.dto.js';
import { BOOKING_ACTIONS, BookingStatus, type BookingAction } from '../booking-status.js';
import { Handoff } from '../entities/booking.entity.js';

const trim = ({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : value);

export class CreateBookingDto {
  @IsUUID()
  tailorId: string;

  @IsUUID()
  serviceId: string;

  @IsEnum(Handoff)
  handoff: Handoff;

  /** When to drop off the fabric or when the tailor should visit (from tomorrow, within 60 days). */
  @Type(() => Date)
  @IsDate()
  appointmentAt: Date;

  @ValidateIf((dto: CreateBookingDto) => dto.handoff === Handoff.HomeVisit)
  @Transform(trim)
  @IsString()
  @Length(5, 200)
  address?: string;

  @IsOptional()
  @IsUUID()
  measurementId?: string;

  @IsOptional()
  @IsUUID()
  productId?: string;

  @IsOptional()
  @IsUUID()
  outfitId?: string;

  @IsOptional()
  @IsUUID()
  tryOnId?: string;

  @IsOptional()
  @Transform(trim)
  @IsString()
  @MaxLength(500)
  notes?: string;
}

export class BookingQueryDto extends PaginationQueryDto {
  @IsOptional()
  @IsEnum(BookingStatus)
  status?: BookingStatus;
}

export class BookingActionDto {
  @IsIn(BOOKING_ACTIONS.filter((action) => action !== 'pay'))
  action: Exclude<BookingAction, 'pay'>;

  /** Required when declining; optional when cancelling. */
  @ValidateIf((dto: BookingActionDto) => dto.action === 'decline' || dto.reason !== undefined)
  @Transform(trim)
  @IsString()
  @Length(3, 300)
  reason?: string;
}

export class CreateReviewDto {
  @IsInt()
  @Min(1)
  @Max(5)
  rating: number;

  @IsOptional()
  @Transform(trim)
  @IsString()
  @MaxLength(1000)
  comment?: string;
}

export class SendMessageDto {
  @Transform(trim)
  @IsString()
  @Length(1, 1000)
  body: string;
}

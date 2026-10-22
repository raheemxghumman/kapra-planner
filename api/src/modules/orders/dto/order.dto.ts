import { Transform, Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsEnum,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Length,
  Matches,
  Max,
  Min,
  ValidateIf,
  ValidateNested,
} from 'class-validator';
import { PaginationQueryDto } from '../../../common/dto/pagination.dto.js';
import { PHONE_MESSAGE, PHONE_PATTERN } from '../../../common/validation/patterns.js';
import { ORDER_ACTIONS, OrderStatus, type OrderAction } from '../order-status.js';

const trim = ({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : value);

export class OrderLineDto {
  @IsUUID()
  variantId: string;

  @IsInt()
  @Min(1)
  @Max(5)
  quantity: number;
}

export class ShippingDto {
  @Transform(trim)
  @IsString()
  @Length(2, 80)
  name: string;

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
}

/** Checkout for one brand. Only ids and quantities are sent; prices come from the database. */
export class CreateOrderDto {
  @IsUUID()
  brandId: string;

  @ValidateNested({ each: true })
  @Type(() => OrderLineDto)
  @ArrayMinSize(1)
  @ArrayMaxSize(20)
  items: OrderLineDto[];

  @ValidateNested()
  @Type(() => ShippingDto)
  shipping: ShippingDto;
}

export class OrderQueryDto extends PaginationQueryDto {
  @IsOptional()
  @IsEnum(OrderStatus)
  status?: OrderStatus;
}

export class OrderActionDto {
  @IsIn(ORDER_ACTIONS.filter((action) => action !== 'pay'))
  action: Exclude<OrderAction, 'pay'>;

  @ValidateIf((dto: OrderActionDto) => dto.action === 'ship')
  @Transform(trim)
  @IsString()
  @Length(4, 60)
  trackingNumber?: string;

  @IsOptional()
  @Transform(trim)
  @IsString()
  @Length(3, 300)
  reason?: string;
}

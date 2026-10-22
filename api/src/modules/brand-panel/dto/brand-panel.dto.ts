import { OmitType, PartialType } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsBoolean,
  IsEnum,
  IsIn,
  IsInt,
  IsLatitude,
  IsLongitude,
  IsOptional,
  IsString,
  IsUrl,
  Length,
  Max,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import { PaginationQueryDto } from '../../../common/dto/pagination.dto.js';
import {
  COLOURS,
  Gender,
  Occasion,
  ProductCategory,
  WearStyle,
} from '../../catalogue/catalogue.enums.js';

const trim = ({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : value);

export class UpdateBrandProfileDto {
  @IsOptional()
  @Transform(trim)
  @IsString()
  @MaxLength(1000)
  description?: string;

  @IsOptional()
  @IsUrl({ require_protocol: true })
  @MaxLength(200)
  website?: string;
}

export class StoreDto {
  @Transform(trim)
  @IsString()
  @Length(2, 80)
  name: string;

  @Transform(trim)
  @IsString()
  @Length(5, 200)
  address: string;

  @Transform(trim)
  @IsString()
  @Length(2, 60)
  city: string;

  /** Map pin; without it the address is looked up on OpenStreetMap. */
  @IsOptional()
  @IsLatitude()
  lat?: number;

  @IsOptional()
  @IsLongitude()
  lng?: number;
}

export class BrandProductQueryDto extends PaginationQueryDto {
  @IsOptional()
  @Transform(trim)
  @IsString()
  @MaxLength(80)
  q?: string;
}

export class ProductVisibilityDto {
  @IsBoolean()
  hidden: boolean;
}

export class VariantStockDto {
  @IsBoolean()
  inStock: boolean;

  /** Leave empty when the exact count is not tracked. */
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(10_000)
  stockQty?: number | null;
}

export class NewSizeDto {
  @Transform(trim)
  @IsString()
  @Length(1, 40)
  size: string;

  @IsInt()
  @Min(0)
  @Max(10_000)
  stockQty: number;
}

/** A product the brand lists by hand (brands without a Shopify feed). */
export class CreateBrandProductDto {
  @Transform(trim)
  @IsString()
  @Length(3, 200)
  title: string;

  @IsOptional()
  @Transform(trim)
  @IsString()
  @MaxLength(3000)
  description?: string;

  @IsEnum(ProductCategory)
  category: ProductCategory;

  @IsEnum(Gender)
  gender: Gender;

  @IsEnum(WearStyle)
  style: WearStyle;

  @IsIn(COLOURS, { each: true })
  @ArrayMaxSize(4)
  colours: string[];

  @IsEnum(Occasion, { each: true })
  @ArrayMaxSize(6)
  occasions: Occasion[];

  @IsOptional()
  @Transform(trim)
  @IsString()
  @MaxLength(60)
  fabric?: string;

  @IsInt()
  @Min(200)
  @Max(1_000_000)
  price: number;

  @IsOptional()
  @IsInt()
  @Min(200)
  @Max(1_000_000)
  compareAtPrice?: number;

  @ValidateNested({ each: true })
  @Type(() => NewSizeDto)
  @ArrayMinSize(1)
  @ArrayMaxSize(12)
  sizes: NewSizeDto[];
}

/** Sizes are managed one by one with the stock endpoint. */
export class UpdateBrandProductDto extends PartialType(
  OmitType(CreateBrandProductDto, ['sizes'] as const),
) {}

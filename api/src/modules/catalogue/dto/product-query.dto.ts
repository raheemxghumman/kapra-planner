import { Transform, Type } from 'class-transformer';
import {
  IsBoolean,
  IsEnum,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';
import { PaginationQueryDto } from '../../../common/dto/pagination.dto.js';
import { COLOURS, Gender, Occasion, ProductCategory, WearStyle } from '../catalogue.enums.js';

/** "kurta,trousers" -> ["kurta", "trousers"], so several values fit in one query parameter. */
const toArray = ({ value }: { value: unknown }) =>
  typeof value === 'string'
    ? value
        .split(',')
        .map((v) => v.trim())
        .filter(Boolean)
    : value;

export const PRODUCT_SORTS = ['featured', 'newest', 'price_asc', 'price_desc'] as const;
export type ProductSort = (typeof PRODUCT_SORTS)[number];

export class ProductQueryDto extends PaginationQueryDto {
  /** Free-text search in title, brand label and fabric. */
  @IsOptional()
  @IsString()
  @MaxLength(80)
  q?: string;

  /** Brand slugs, comma-separated. */
  @IsOptional()
  @Transform(toArray)
  @IsString({ each: true })
  brand?: string[];

  @IsOptional()
  @Transform(toArray)
  @IsEnum(ProductCategory, { each: true })
  category?: ProductCategory[];

  @IsOptional()
  @IsEnum(Gender)
  gender?: Gender;

  @IsOptional()
  @IsEnum(WearStyle)
  style?: WearStyle;

  @IsOptional()
  @Transform(toArray)
  @IsIn(COLOURS, { each: true })
  colour?: string[];

  @IsOptional()
  @Transform(toArray)
  @IsEnum(Occasion, { each: true })
  occasion?: Occasion[];

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  minPrice?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  maxPrice?: number;

  /** Only products with this size in stock. */
  @IsOptional()
  @IsString()
  @MaxLength(40)
  size?: string;

  @IsOptional()
  @Transform(({ value }) => value === true || value === 'true')
  @IsBoolean()
  inStock = true;

  @IsOptional()
  @IsIn(PRODUCT_SORTS)
  sort: ProductSort = 'featured';
}

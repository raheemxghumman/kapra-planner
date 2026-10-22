import { PartialType } from '@nestjs/swagger';
import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  IsUrl,
  Length,
  Max,
  Min,
} from 'class-validator';
import { BrandTier, Gender, WearStyle } from '../../catalogue/catalogue.enums.js';

export class CreateBrandDto {
  @IsString()
  @Length(2, 80)
  name: string;

  @IsOptional()
  @IsString()
  @Length(0, 1000)
  description?: string;

  @IsOptional()
  @IsUrl()
  website?: string;

  @IsOptional()
  @IsUrl()
  logoUrl?: string;

  /** Public product feed, e.g. https://brand.pk/products.json */
  @IsOptional()
  @IsUrl()
  feedUrl?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(1000)
  priceDivisor?: number;

  @IsOptional()
  @IsEnum(BrandTier)
  tier?: BrandTier;

  @IsOptional()
  @IsEnum(Gender)
  defaultGender?: Gender;

  @IsOptional()
  @IsEnum(WearStyle)
  defaultStyle?: WearStyle;

  @IsOptional()
  @IsBoolean()
  verified?: boolean;
}

/** Every field optional: send only what changes (PATCH). */
export class UpdateBrandDto extends PartialType(CreateBrandDto) {}

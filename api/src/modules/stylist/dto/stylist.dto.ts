import { Transform } from 'class-transformer';
import {
  ArrayMaxSize,
  IsBoolean,
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
} from 'class-validator';
import { COLOURS, Occasion, WearStyle } from '../../catalogue/catalogue.enums.js';

const trim = ({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : value);

export class CreateStylistRequestDto {
  @IsEnum(Occasion)
  occasion: Occasion;

  /** Total for the whole outfit, in rupees. */
  @IsInt()
  @Min(1_000)
  @Max(1_000_000)
  budget: number;

  /** Eastern or western; defaults to the style profile. */
  @IsOptional()
  @IsEnum(WearStyle)
  style?: WearStyle;

  @IsOptional()
  @IsIn(COLOURS, { each: true })
  @ArrayMaxSize(4)
  colours?: string[];

  /** Free text such as "modest, light fabric for summer". */
  @IsOptional()
  @Transform(trim)
  @IsString()
  @MaxLength(300)
  notes?: string;

  /** Build every look around this product (from the product page). */
  @IsOptional()
  @IsUUID()
  anchorProductId?: string;
}

export class SaveSuggestionDto {
  @IsOptional()
  @Transform(trim)
  @IsString()
  @Length(1, 80)
  name?: string;
}

export class SuggestionFeedbackDto {
  @IsBoolean()
  liked: boolean;

  @IsOptional()
  @Transform(trim)
  @IsString()
  @MaxLength(200)
  reason?: string;
}

export class RenameOutfitDto {
  @Transform(trim)
  @IsString()
  @Length(1, 80)
  name: string;
}

export class SwapItemDto {
  @IsUUID()
  productId: string;

  @IsOptional()
  @IsUUID()
  variantId?: string;
}

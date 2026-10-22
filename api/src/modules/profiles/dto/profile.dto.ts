import { PartialType } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsEnum,
  IsIn,
  IsInt,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  Length,
  Max,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import { COLOURS, Gender, WearStyle } from '../../catalogue/catalogue.enums.js';

class SizeMapDto {
  @IsOptional()
  @IsString()
  @MaxLength(10)
  top?: string;

  @IsOptional()
  @IsString()
  @MaxLength(10)
  bottom?: string;

  @IsOptional()
  @IsString()
  @MaxLength(10)
  shoes?: string;
}

export class UpdateStyleProfileDto {
  @IsOptional()
  @IsEnum(Gender)
  gender?: Gender;

  @IsOptional()
  @IsEnum(WearStyle, { each: true })
  @ArrayMaxSize(2)
  styles?: WearStyle[];

  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => SizeMapDto)
  sizes?: SizeMapDto;

  @IsOptional()
  @IsIn(COLOURS, { each: true })
  @ArrayMaxSize(8)
  favouriteColours?: string[];

  @IsOptional()
  @IsIn(COLOURS, { each: true })
  @ArrayMaxSize(8)
  avoidColours?: string[];

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(1_000_000)
  budgetMin?: number;

  @IsOptional()
  @IsInt()
  @Min(500)
  @Max(1_000_000)
  budgetMax?: number;
}

/** Measurements in inches with one decimal; sensible human ranges catch typos like 380. */
const inches = () => [IsOptional(), IsNumber({ maxDecimalPlaces: 1 }), Min(5), Max(80)];
const applyAll =
  (decorators: PropertyDecorator[]): PropertyDecorator =>
  (target, key) =>
    decorators.forEach((decorator) => decorator(target, key));

export class CreateMeasurementDto {
  @Transform(({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @Length(1, 60)
  label: string;

  @applyAll(inches())
  chest?: number;

  @applyAll(inches())
  waist?: number;

  @applyAll(inches())
  hips?: number;

  @applyAll(inches())
  shoulder?: number;

  @applyAll(inches())
  sleeveLength?: number;

  @applyAll(inches())
  shirtLength?: number;

  @applyAll(inches())
  trouserLength?: number;

  @applyAll(inches())
  neck?: number;

  @IsOptional()
  @IsString()
  @MaxLength(300)
  notes?: string;
}

export class UpdateMeasurementDto extends PartialType(CreateMeasurementDto) {}

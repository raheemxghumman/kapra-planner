import { Transform } from 'class-transformer';
import { IsOptional, IsString, Length, Matches } from 'class-validator';
import { PHONE_MESSAGE, PHONE_PATTERN } from '../../../common/validation/patterns.js';

const trim = ({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : value);

/** Fields a user may change about themselves. Role, status and email are deliberately absent. */
export class UpdateMeDto {
  @IsOptional()
  @Transform(trim)
  @IsString()
  @Length(2, 80)
  name?: string;

  @IsOptional()
  @Transform(trim)
  @Matches(PHONE_PATTERN, { message: PHONE_MESSAGE })
  phone?: string;

  @IsOptional()
  @Transform(trim)
  @IsString()
  @Length(2, 60)
  city?: string;
}

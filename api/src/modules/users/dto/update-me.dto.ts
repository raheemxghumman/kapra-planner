import { Transform } from 'class-transformer';
import { IsOptional, IsString, Length, Matches } from 'class-validator';

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
  @Matches(/^(\+92|0)3\d{9}$/, {
    message: 'phone must be a Pakistani mobile number like 03001234567',
  })
  phone?: string;

  @IsOptional()
  @Transform(trim)
  @IsString()
  @Length(2, 60)
  city?: string;
}

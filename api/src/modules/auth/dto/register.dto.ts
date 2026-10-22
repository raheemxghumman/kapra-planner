import { Transform } from 'class-transformer';
import {
  IsEmail,
  IsIn,
  IsOptional,
  IsString,
  Length,
  Matches,
  MaxLength,
  ValidateIf,
} from 'class-validator';
import { SELF_REGISTER_ROLES, UserRole } from '../../../common/enums/user-role.enum.js';
import { PHONE_MESSAGE, PHONE_PATTERN } from '../../../common/validation/patterns.js';

const trim = ({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : value);
const trimLower = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.trim().toLowerCase() : value;

export class RegisterDto {
  /** Full name or business name. */
  @Transform(trim)
  @IsString()
  @Length(2, 80)
  name: string;

  @Transform(trimLower)
  @IsEmail()
  @MaxLength(254)
  email: string;

  /** 8–72 characters (bcrypt only uses the first 72 bytes), at least one letter and one number. */
  @IsString()
  @Length(8, 72)
  @Matches(/(?=.*[A-Za-z])(?=.*\d)/, {
    message: 'password must contain at least one letter and one number',
  })
  password: string;

  /** customer, brand or tailor. Brand and tailor accounts start as pending until an admin approves them. */
  @IsIn(SELF_REGISTER_ROLES)
  role: UserRole;

  /**
   * Pakistani mobile number, e.g. 03001234567 or +923001234567.
   * Required for brands and tailors (customers contact them); optional for customers.
   */
  @ValidateIf((dto: RegisterDto) => dto.role !== UserRole.Customer || dto.phone !== undefined)
  @Transform(trim)
  @Matches(PHONE_PATTERN, { message: PHONE_MESSAGE })
  phone?: string;

  @IsOptional()
  @Transform(trim)
  @IsString()
  @Length(2, 60)
  city?: string;
}

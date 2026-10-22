import { Transform } from 'class-transformer';
import {
  IsBoolean,
  IsEnum,
  IsIn,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  ValidateIf,
} from 'class-validator';
import { PaginationQueryDto } from '../../../common/dto/pagination.dto.js';
import { UserRole } from '../../../common/enums/user-role.enum.js';
import { UserStatus } from '../../../common/enums/user-status.enum.js';

const trim = ({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : value);

export class AdminUserQueryDto extends PaginationQueryDto {
  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;

  @IsOptional()
  @IsEnum(UserStatus)
  status?: UserStatus;

  /** Name or email. */
  @IsOptional()
  @Transform(trim)
  @IsString()
  @MaxLength(80)
  q?: string;
}

export class SetUserStatusDto {
  @IsEnum(UserStatus)
  status: UserStatus;
}

export class LinkBrandOwnerDto {
  /** The brand account to link, or null to unlink. */
  @ValidateIf((dto: LinkBrandOwnerDto) => dto.userId !== null)
  @IsUUID()
  userId: string | null;
}

export class AdminReviewQueryDto extends PaginationQueryDto {
  /** "negative" lists the reviews the model scored negative first; "hidden" lists hidden ones. */
  @IsOptional()
  @IsIn(['all', 'negative', 'hidden'])
  filter: 'all' | 'negative' | 'hidden' = 'all';
}

export class SetReviewHiddenDto {
  @IsBoolean()
  hidden: boolean;
}

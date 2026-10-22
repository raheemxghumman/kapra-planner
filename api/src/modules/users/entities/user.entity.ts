import { Exclude } from 'class-transformer';
import { Column, Entity, Index } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity.js';
import { UserRole } from '../../../common/enums/user-role.enum.js';
import { UserStatus } from '../../../common/enums/user-status.enum.js';

@Entity('users')
export class User extends BaseEntity {
  @Column({ length: 80 })
  name: string;

  /** Always stored in lowercase, so "Ali@Mail.com" and "ali@mail.com" are the same account. */
  @Index({ unique: true })
  @Column({ length: 254 })
  email: string;

  /** bcrypt hash. Never returned in API responses (@Exclude) and not loaded unless asked for. */
  @Exclude()
  @Column({ name: 'password_hash', select: false })
  passwordHash: string;

  @Column({ type: 'varchar', length: 20, nullable: true })
  phone: string | null;

  @Column({ type: 'varchar', length: 60, nullable: true })
  city: string | null;

  @Column({ type: 'enum', enum: UserRole, enumName: 'user_role' })
  role: UserRole;

  @Column({ type: 'enum', enum: UserStatus, enumName: 'user_status', default: UserStatus.Active })
  status: UserStatus;

  @Exclude()
  @Column({ name: 'failed_login_attempts', type: 'smallint', default: 0 })
  failedLoginAttempts: number;

  @Exclude()
  @Column({ name: 'locked_until', type: 'timestamptz', nullable: true })
  lockedUntil: Date | null;
}

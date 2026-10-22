import { ConflictException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserRole } from '../../common/enums/user-role.enum.js';
import { UserStatus } from '../../common/enums/user-status.enum.js';
import { User } from './entities/user.entity.js';

export interface CreateUserData {
  name: string;
  email: string;
  passwordHash: string;
  role: UserRole;
  status: UserStatus;
  phone?: string | null;
  city?: string | null;
}

/** Data access for users. Other modules use this service instead of the repository directly. */
@Injectable()
export class UsersService {
  constructor(@InjectRepository(User) private readonly users: Repository<User>) {}

  findById(id: string): Promise<User | null> {
    return this.users.findOneBy({ id });
  }

  /** Includes the password hash, which is normally not selected. Only for login. */
  findByEmailWithPassword(email: string): Promise<User | null> {
    return this.users
      .createQueryBuilder('user')
      .addSelect('user.passwordHash')
      .where('user.email = :email', { email: email.toLowerCase() })
      .getOne();
  }

  async create(data: CreateUserData): Promise<User> {
    const email = data.email.toLowerCase();
    if (await this.users.existsBy({ email })) {
      throw new ConflictException('An account with this email already exists');
    }
    return this.users.save(this.users.create({ ...data, email }));
  }

  async recordFailedLogin(user: User, maxAttempts: number, lockMinutes: number): Promise<void> {
    const attempts = user.failedLoginAttempts + 1;
    const lockedUntil =
      attempts >= maxAttempts ? new Date(Date.now() + lockMinutes * 60_000) : user.lockedUntil;
    await this.users.update(user.id, {
      failedLoginAttempts: attempts >= maxAttempts ? 0 : attempts,
      lockedUntil,
    });
  }

  async recordSuccessfulLogin(user: User): Promise<void> {
    if (user.failedLoginAttempts > 0 || user.lockedUntil) {
      await this.users.update(user.id, { failedLoginAttempts: 0, lockedUntil: null });
    }
  }
}

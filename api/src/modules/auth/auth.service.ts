import { ForbiddenException, Injectable, UnauthorizedException } from '@nestjs/common';
import bcrypt from 'bcryptjs';
import { UserRole } from '../../common/enums/user-role.enum.js';
import { UserStatus } from '../../common/enums/user-status.enum.js';
import type { User } from '../users/entities/user.entity.js';
import { UsersService } from '../users/users.service.js';
import { BCRYPT_ROUNDS, LOCKOUT_MINUTES, MAX_FAILED_LOGINS } from './auth.constants.js';
import type { AuthResponseDto } from './dto/auth-response.dto.js';
import type { LoginDto } from './dto/login.dto.js';
import type { RegisterDto } from './dto/register.dto.js';
import { TokensService } from './tokens.service.js';

const INVALID_CREDENTIALS = 'Invalid email or password';

@Injectable()
export class AuthService {
  /**
   * Hash compared against when the email does not exist, so a wrong email takes as long as a
   * wrong password. Otherwise response time would reveal which emails are registered.
   */
  private readonly dummyHash = bcrypt.hashSync('timing-equaliser', BCRYPT_ROUNDS);

  constructor(
    private readonly usersService: UsersService,
    private readonly tokensService: TokensService,
  ) {}

  async register(dto: RegisterDto): Promise<AuthResponseDto> {
    // Customers can start immediately; brands and tailors wait for admin verification.
    const status = dto.role === UserRole.Customer ? UserStatus.Active : UserStatus.Pending;
    const user = await this.usersService.create({
      name: dto.name,
      email: dto.email,
      passwordHash: await bcrypt.hash(dto.password, BCRYPT_ROUNDS),
      role: dto.role,
      status,
      phone: dto.phone ?? null,
      city: dto.city ?? null,
    });
    return this.startSession(user);
  }

  async login(dto: LoginDto): Promise<AuthResponseDto> {
    const user = await this.usersService.findByEmailWithPassword(dto.email);
    if (!user) {
      await bcrypt.compare(dto.password, this.dummyHash);
      throw new UnauthorizedException(INVALID_CREDENTIALS);
    }

    if (user.lockedUntil && user.lockedUntil > new Date()) {
      const minutes = Math.ceil((user.lockedUntil.getTime() - Date.now()) / 60_000);
      throw new ForbiddenException(
        `Too many failed attempts. Try again in ${minutes} minute${minutes === 1 ? '' : 's'}.`,
      );
    }

    const passwordMatches = await bcrypt.compare(dto.password, user.passwordHash);
    if (!passwordMatches) {
      await this.usersService.recordFailedLogin(user, MAX_FAILED_LOGINS, LOCKOUT_MINUTES);
      throw new UnauthorizedException(INVALID_CREDENTIALS);
    }

    if (user.status === UserStatus.Suspended) {
      throw new ForbiddenException('This account has been suspended');
    }

    await this.usersService.recordSuccessfulLogin(user);
    return this.startSession(user);
  }

  async refresh(refreshToken: string): Promise<AuthResponseDto> {
    const user = await this.tokensService.consume(refreshToken);
    if (user.status === UserStatus.Suspended) {
      throw new ForbiddenException('This account has been suspended');
    }
    return this.startSession(user);
  }

  logout(refreshToken: string): Promise<void> {
    return this.tokensService.revoke(refreshToken);
  }

  private async startSession(user: User): Promise<AuthResponseDto> {
    const tokens = await this.tokensService.issue(user);
    return { ...tokens, user };
  }
}

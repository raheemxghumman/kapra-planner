import { ForbiddenException, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { UserStatus } from '../../../common/enums/user-status.enum.js';
import type { EnvironmentVariables } from '../../../config/env.validation.js';
import type { User } from '../../users/entities/user.entity.js';
import { UsersService } from '../../users/users.service.js';

export interface JwtPayload {
  /** User ID ("subject" of the token). */
  sub: string;
  role: string;
}

/**
 * Reads the Bearer token, checks its signature and expiry, then loads the user.
 * Loading the user on every request costs one indexed query, but it means a deleted or
 * suspended account is blocked immediately instead of when its token expires.
 */
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    config: ConfigService<EnvironmentVariables, true>,
    private readonly usersService: UsersService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: config.get('JWT_ACCESS_SECRET', { infer: true }),
    });
  }

  /** Whatever this returns becomes request.user. */
  async validate(payload: JwtPayload): Promise<User> {
    const user = await this.usersService.findById(payload.sub);
    if (!user) {
      throw new UnauthorizedException('Account no longer exists');
    }
    if (user.status === UserStatus.Suspended) {
      throw new ForbiddenException('This account has been suspended');
    }
    return user;
  }
}

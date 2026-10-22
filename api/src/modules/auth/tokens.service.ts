import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { createHash, randomBytes } from 'node:crypto';
import { IsNull, Repository } from 'typeorm';
import type { User } from '../users/entities/user.entity.js';
import { ACCESS_TOKEN_TTL_SECONDS, REFRESH_TOKEN_TTL_DAYS } from './auth.constants.js';
import { RefreshToken } from './entities/refresh-token.entity.js';
import type { JwtPayload } from './strategies/jwt.strategy.js';

export interface IssuedTokens {
  accessToken: string;
  expiresIn: number;
  refreshToken: string;
}

/**
 * Refresh tokens are 48 random bytes, so (unlike passwords) a fast SHA-256 hash is enough:
 * nobody can guess them, and a fixed hash lets us look the token up by its hash.
 */
const hashToken = (token: string) => createHash('sha256').update(token).digest('hex');

/** Issues, rotates and revokes tokens. Knows nothing about passwords. */
@Injectable()
export class TokensService {
  private readonly logger = new Logger(TokensService.name);

  constructor(
    private readonly jwtService: JwtService,
    @InjectRepository(RefreshToken) private readonly refreshTokens: Repository<RefreshToken>,
  ) {}

  async issue(user: User): Promise<IssuedTokens> {
    const payload: JwtPayload = { sub: user.id, role: user.role };
    const accessToken = await this.jwtService.signAsync(payload, {
      expiresIn: ACCESS_TOKEN_TTL_SECONDS,
    });

    const refreshToken = randomBytes(48).toString('base64url');
    await this.refreshTokens.insert({
      userId: user.id,
      tokenHash: hashToken(refreshToken),
      expiresAt: new Date(Date.now() + REFRESH_TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000),
    });

    return { accessToken, expiresIn: ACCESS_TOKEN_TTL_SECONDS, refreshToken };
  }

  /**
   * Uses up a refresh token and returns its user, so the caller can issue a new pair.
   * If a token that was already used is presented again, someone may have stolen it:
   * we end every session of that user (reuse detection).
   */
  async consume(rawToken: string): Promise<User> {
    const stored = await this.refreshTokens.findOne({
      where: { tokenHash: hashToken(rawToken) },
      relations: { user: true },
    });
    if (!stored) {
      throw new UnauthorizedException('Invalid refresh token');
    }
    if (stored.revokedAt) {
      await this.revokeAllForUser(stored.userId);
      this.logger.warn(
        `Refresh token reuse detected for user ${stored.userId}; all sessions ended`,
      );
      throw new UnauthorizedException('Session is no longer valid. Please log in again.');
    }
    if (stored.expiresAt <= new Date()) {
      throw new UnauthorizedException('Session expired. Please log in again.');
    }

    // Conditional update makes this atomic: if two requests race with the same token,
    // only one of them can flip revoked_at from NULL.
    const result = await this.refreshTokens.update(
      { id: stored.id, revokedAt: IsNull() },
      { revokedAt: new Date() },
    );
    if (!result.affected) {
      await this.revokeAllForUser(stored.userId);
      throw new UnauthorizedException('Session is no longer valid. Please log in again.');
    }
    return stored.user;
  }

  async revoke(rawToken: string): Promise<void> {
    await this.refreshTokens.update(
      { tokenHash: hashToken(rawToken), revokedAt: IsNull() },
      { revokedAt: new Date() },
    );
  }

  async revokeAllForUser(userId: string): Promise<void> {
    await this.refreshTokens.update({ userId, revokedAt: IsNull() }, { revokedAt: new Date() });
  }
}

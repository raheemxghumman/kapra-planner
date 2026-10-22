import {
  type CanActivate,
  type ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Request } from 'express';
import { timingSafeEqual } from 'node:crypto';
import type { EnvironmentVariables } from '../../config/env.validation.js';

export const JOBS_SECRET_HEADER = 'x-jobs-secret';

/**
 * Protects /jobs/* endpoints called by GitHub Actions. They have no user, so instead of a JWT
 * they send a shared secret. timingSafeEqual compares without leaking how many characters matched.
 */
@Injectable()
export class JobsSecretGuard implements CanActivate {
  constructor(private readonly config: ConfigService<EnvironmentVariables, true>) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    const sent = Buffer.from(request.header(JOBS_SECRET_HEADER) ?? '');
    const expected = Buffer.from(this.config.get('JOBS_SECRET', { infer: true }));
    if (sent.length !== expected.length || !timingSafeEqual(sent, expected)) {
      throw new UnauthorizedException('Invalid job secret');
    }
    return true;
  }
}

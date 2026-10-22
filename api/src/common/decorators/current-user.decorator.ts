import { createParamDecorator, type ExecutionContext } from '@nestjs/common';
import type { Request } from 'express';
import type { User } from '../../modules/users/entities/user.entity.js';

/** Injects the logged-in user (set by JwtStrategy) into a controller method parameter. */
export const CurrentUser = createParamDecorator((_data: unknown, context: ExecutionContext) => {
  const request = context.switchToHttp().getRequest<Request & { user: User }>();
  return request.user;
});

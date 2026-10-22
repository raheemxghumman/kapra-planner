import { type CanActivate, type ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Request } from 'express';
import type { User } from '../../modules/users/entities/user.entity.js';
import { ROLES_KEY } from '../decorators/roles.decorator.js';
import type { UserRole } from '../enums/user-role.enum.js';

/**
 * Runs after JwtAuthGuard. If the route has @Roles(...), the user's role must be one of them.
 * This answers "what kind of user may call this?"; whether a specific record belongs to the
 * user is checked in the service (ownership).
 */
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<UserRole[] | undefined>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }
    const { user } = context.switchToHttp().getRequest<Request & { user?: User }>();
    if (!user || !requiredRoles.includes(user.role)) {
      throw new ForbiddenException('You do not have permission to do this');
    }
    return true;
  }
}

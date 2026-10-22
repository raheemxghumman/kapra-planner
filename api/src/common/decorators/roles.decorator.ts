import { SetMetadata } from '@nestjs/common';
import type { UserRole } from '../enums/user-role.enum.js';

export const ROLES_KEY = 'roles';

/** Limits a route (or a whole controller) to the given roles, e.g. @Roles(UserRole.Admin). */
export const Roles = (...roles: UserRole[]) => SetMetadata(ROLES_KEY, roles);

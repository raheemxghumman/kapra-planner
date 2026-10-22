export enum UserRole {
  Customer = 'customer',
  Brand = 'brand',
  Tailor = 'tailor',
  Admin = 'admin',
}

/** Roles a visitor may pick when registering. Admins are created by a script, never by sign-up. */
export const SELF_REGISTER_ROLES = [UserRole.Customer, UserRole.Brand, UserRole.Tailor] as const;

import type { UserRole } from '../types/auth';

/** Where each role lands after logging in. */
export const DASHBOARD_PATH: Record<UserRole, string> = {
  customer: '/app',
  brand: '/brand',
  tailor: '/tailor',
  admin: '/admin',
};

export const ROLE_LABEL: Record<UserRole, string> = {
  customer: 'Customer',
  brand: 'Brand',
  tailor: 'Tailor',
  admin: 'Admin',
};

export interface NavItem {
  to: string;
  label: string;
}

/** Navigation per role. Items are added here as each feature is built. */
export const NAV_ITEMS: Record<UserRole, NavItem[]> = {
  customer: [{ to: '/app', label: 'Overview' }],
  brand: [{ to: '/brand', label: 'Overview' }],
  tailor: [{ to: '/tailor', label: 'Overview' }],
  admin: [{ to: '/admin', label: 'Overview' }],
};

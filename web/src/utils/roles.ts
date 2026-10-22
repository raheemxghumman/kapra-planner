import {
  BarChart3,
  Heart,
  Home,
  LayoutGrid,
  MapPin,
  MessageSquareQuote,
  Package,
  ScanFace,
  Scissors,
  Shirt,
  Sparkles,
  Star,
  Store,
  Tags,
  UserRound,
  Users,
  type LucideIcon,
} from 'lucide-react';
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
  icon: LucideIcon;
}

/** Navigation per role: each role sees only its own sections. */
export const NAV_ITEMS: Record<UserRole, NavItem[]> = {
  customer: [
    { to: '/app', label: 'Overview', icon: Home },
    { to: '/app/stylist', label: 'AI stylist', icon: Sparkles },
    { to: '/app/outfits', label: 'Outfits', icon: Shirt },
    { to: '/app/try-on', label: 'Try-on', icon: ScanFace },
    { to: '/app/bookings', label: 'Tailor bookings', icon: Scissors },
    { to: '/app/orders', label: 'Orders', icon: Package },
    { to: '/app/saved', label: 'Saved', icon: Heart },
    { to: '/app/profile', label: 'Profile & sizes', icon: UserRound },
  ],
  tailor: [
    { to: '/tailor', label: 'Overview', icon: LayoutGrid },
    { to: '/tailor/bookings', label: 'Bookings', icon: Scissors },
    { to: '/tailor/shop', label: 'My shop', icon: Store },
    { to: '/tailor/reviews', label: 'Reviews', icon: Star },
  ],
  brand: [
    { to: '/brand', label: 'Overview', icon: BarChart3 },
    { to: '/brand/orders', label: 'Orders', icon: Package },
    { to: '/brand/products', label: 'Products', icon: Tags },
    { to: '/brand/stores', label: 'Brand & stores', icon: MapPin },
  ],
  admin: [
    { to: '/admin', label: 'Overview', icon: BarChart3 },
    { to: '/admin/users', label: 'Users', icon: Users },
    { to: '/admin/brands', label: 'Brands & sync', icon: Store },
    { to: '/admin/reviews', label: 'Reviews', icon: MessageSquareQuote },
  ],
};

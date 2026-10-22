import type { UserRole, UserStatus } from './auth';
import type { Product } from './catalogue';
import type { StorePin } from './tailors';

export interface AppNotification {
  id: string;
  type: string;
  title: string;
  body: string | null;
  link: string | null;
  readAt: string | null;
  createdAt: string;
}

export interface BrandStore extends Omit<StorePin, 'brandName' | 'brandSlug' | 'logoUrl'> {
  brandId: string;
}

export interface OwnBrand {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  website: string | null;
  logoUrl: string | null;
  tier: string;
  verified: boolean;
  lastSyncedAt: string | null;
  stores: BrandStore[];
}

export interface BrandAnalytics {
  revenue30d: number;
  orders30d: number;
  daily: { day: string; revenue: number; orders: number }[];
  byStatus: { status: string; count: number }[];
  topProducts: { productId: string; title: string; image: string | null; units: number; revenue: number }[];
  interest: { wishlistSaves: number; tryOns: number; stylistPicks: number };
  catalogue: { total: number; visible: number; manual: number };
}

export type BrandProduct = Product & { hiddenByBrand: boolean; isActive: boolean; externalId: string | null };

export interface AdminStats {
  users: { role: UserRole; status: UserStatus; count: number }[];
  bookings: { status: string; count: number }[];
  orders: { status: string; count: number }[];
  revenue: { purpose: 'booking' | 'order'; total: number; count: number }[];
  catalogue: { products: number; brands: number; partnerBrands: number; tailors: number; reviews: number; lastSync: string | null };
  ai: { stylistAi: number; stylistRules: number; stylistAvgMs: number | null; tryOnsDone: number; tryOnsFailed: number };
  pending: { id: string; name: string; email: string; role: UserRole; createdAt: string }[];
  daily: { day: string; signups: number; revenue: number }[];
}

export interface AdminReview {
  id: string;
  rating: number;
  comment: string | null;
  sentimentScore: number | null;
  sentimentLabel: 'positive' | 'neutral' | 'negative' | null;
  isHidden: boolean;
  createdAt: string;
  tailor: { id: string; businessName: string; slug: string };
  customer: { id: string; name: string };
}

export interface AdminBrand {
  id: string;
  name: string;
  slug: string;
  ownerId: string | null;
  verified: boolean;
  tier: string;
  feedUrl: string | null;
  lastSyncedAt: string | null;
  lastSyncReport: { fetched: number; created: number; updated: number; hidden: number; skipped: number } | null;
}

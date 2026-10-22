export type TailorSpeciality = 'women_eastern' | 'men_eastern' | 'bridal' | 'western' | 'kids' | 'alterations';
export type ServiceType = 'stitching' | 'alteration' | 'embroidery' | 'bridal';
export type TailorSort = 'best' | 'nearest' | 'rating' | 'price';

export const SPECIALITY_LABEL: Record<TailorSpeciality, string> = {
  women_eastern: "Women's eastern",
  men_eastern: "Men's eastern",
  bridal: 'Bridal',
  western: 'Western',
  kids: 'Kids',
  alterations: 'Alterations',
};

export interface GalleryImage {
  url: string;
  publicId: string;
}

export interface TailorService {
  id: string;
  tailorId: string;
  name: string;
  type: ServiceType;
  description: string | null;
  price: number;
  durationDays: number;
  isActive: boolean;
}

export interface Tailor {
  id: string;
  userId: string;
  businessName: string;
  slug: string;
  bio: string | null;
  phone: string;
  address: string;
  city: string;
  lat: number;
  lng: number;
  specialities: TailorSpeciality[];
  priceFrom: number | null;
  turnaroundDays: number;
  homeVisits: boolean;
  gallery: GalleryImage[];
  ratingAvg: number;
  ratingCount: number;
  sentimentAvg: number | null;
  completedOrders: number;
  cancelledOrders: number;
  rankScore: number;
  distanceKm?: number | null;
  services?: TailorService[];
}

export interface PublicReview {
  id: string;
  rating: number;
  comment: string | null;
  sentimentLabel: 'positive' | 'neutral' | 'negative' | null;
  reply: string | null;
  createdAt: string;
  customerName: string;
}

export interface TailorDetail extends Tailor {
  services: TailorService[];
  ratingBreakdown: { stars: number; count: number }[];
  reviews: PublicReview[];
}

export interface TailorQuery {
  q?: string;
  city?: string;
  speciality?: TailorSpeciality;
  minRating?: number;
  lat?: number;
  lng?: number;
  radiusKm?: number;
  sort?: TailorSort;
  page?: number;
  limit?: number;
}

export interface StorePin {
  id: string;
  name: string;
  address: string;
  city: string;
  lat: number;
  lng: number;
  brandName: string;
  brandSlug: string;
  logoUrl: string | null;
}

export interface Place {
  lat: number;
  lng: number;
  label: string;
}

import type { Product } from './catalogue';

export interface PersonPhoto {
  id: string;
  url: string;
  createdAt: string;
}

export type TryOnStatus = 'pending' | 'processing' | 'completed' | 'failed';

export interface TryOn {
  id: string;
  photoId: string;
  productId: string;
  status: TryOnStatus;
  provider: string | null;
  resultUrl: string | null;
  error: string | null;
  durationMs: number | null;
  createdAt: string;
  product?: Product;
  photo?: PersonPhoto;
}

import type { User, UserRole, UserStatus } from '../types/auth';
import type { Gender, Occasion, Paginated, ProductCategory, WearStyle } from '../types/catalogue';
import type {
  AdminBrand,
  AdminReview,
  AdminStats,
  BrandAnalytics,
  BrandProduct,
  BrandStore,
  OwnBrand,
} from '../types/panels';
import { http } from './http';

const upload = (file: File) => {
  const form = new FormData();
  form.append('photo', file);
  return form;
};

// ---- Brand panel ----

export async function getOwnBrand(signal?: AbortSignal) {
  const { data } = await http.get<{ brand: OwnBrand | null; approved: boolean }>('/brand/profile', { signal });
  return data;
}

export async function updateOwnBrand(input: { description?: string; website?: string }) {
  const { data } = await http.put<OwnBrand>('/brand/profile', input);
  return data;
}

export async function uploadBrandLogo(file: File) {
  const { data } = await http.post<OwnBrand>('/brand/profile/logo', upload(file), { timeout: 60_000 });
  return data;
}

export interface StoreInput {
  name: string;
  address: string;
  city: string;
  lat?: number;
  lng?: number;
}

export async function addStore(input: StoreInput) {
  const { data } = await http.post<BrandStore>('/brand/stores', input);
  return data;
}

export async function updateStore(id: string, input: StoreInput) {
  const { data } = await http.put<BrandStore>(`/brand/stores/${id}`, input);
  return data;
}

export async function deleteStore(id: string) {
  await http.delete(`/brand/stores/${id}`);
}

export async function listBrandProducts(params: { q?: string; page?: number; limit?: number }, signal?: AbortSignal) {
  const { data } = await http.get<Paginated<BrandProduct>>('/brand/products', { params, signal });
  return data;
}

export async function setProductHidden(id: string, hidden: boolean) {
  await http.put(`/brand/products/${id}/visibility`, { hidden });
}

export async function setVariantStock(id: string, inStock: boolean, stockQty?: number | null) {
  await http.put(`/brand/variants/${id}/stock`, { inStock, stockQty });
}

export interface NewProductInput {
  title: string;
  description?: string;
  category: ProductCategory;
  gender: Gender;
  style: WearStyle;
  colours: string[];
  occasions: Occasion[];
  fabric?: string;
  price: number;
  compareAtPrice?: number;
  sizes: { size: string; stockQty: number }[];
}

export async function createBrandProduct(input: NewProductInput) {
  const { data } = await http.post<BrandProduct>('/brand/products', input);
  return data;
}

export async function addBrandProductImage(id: string, file: File) {
  const { data } = await http.post<BrandProduct>(`/brand/products/${id}/images`, upload(file), { timeout: 60_000 });
  return data;
}

export async function deleteBrandProduct(id: string) {
  await http.delete(`/brand/products/${id}`);
}

export async function getBrandAnalytics(signal?: AbortSignal) {
  const { data } = await http.get<BrandAnalytics>('/brand/analytics', { signal });
  return data;
}

// ---- Admin ----

export async function getAdminStats(signal?: AbortSignal) {
  const { data } = await http.get<AdminStats>('/admin/stats', { signal });
  return data;
}

export async function listUsers(
  params: { role?: UserRole; status?: UserStatus; q?: string; page?: number },
  signal?: AbortSignal,
) {
  const { data } = await http.get<Paginated<User>>('/admin/users', { params: { ...params, limit: 20 }, signal });
  return data;
}

export async function setUserStatus(id: string, status: UserStatus) {
  const { data } = await http.patch<User>(`/admin/users/${id}/status`, { status });
  return data;
}

export async function listAdminBrands(signal?: AbortSignal) {
  const { data } = await http.get<AdminBrand[]>('/admin/brands', { signal });
  return data;
}

export async function linkBrandOwner(brandId: string, userId: string | null) {
  const { data } = await http.put<AdminBrand>(`/admin/brands/${brandId}/owner`, { userId });
  return data;
}

export async function startCatalogueSync() {
  await http.post('/admin/catalogue/sync');
}

export async function getSyncStatus(signal?: AbortSignal) {
  const { data } = await http.get<{ running: boolean }>('/admin/catalogue/sync', { signal });
  return data;
}

export async function listAdminReviews(params: { filter: 'all' | 'negative' | 'hidden'; page?: number }, signal?: AbortSignal) {
  const { data } = await http.get<Paginated<AdminReview>>('/admin/reviews', { params: { ...params, limit: 20 }, signal });
  return data;
}

export async function setReviewHidden(id: string, hidden: boolean) {
  await http.patch(`/admin/reviews/${id}`, { hidden });
}

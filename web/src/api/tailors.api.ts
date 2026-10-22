import type { Paginated } from '../types/catalogue';
import type {
  Place,
  PublicReview,
  ServiceType,
  StorePin,
  Tailor,
  TailorDetail,
  TailorQuery,
  TailorService,
  TailorSpeciality,
} from '../types/tailors';
import { http } from './http';

const clean = (query: object) =>
  Object.fromEntries(Object.entries(query).filter(([, value]) => value !== undefined && value !== ''));

export async function searchTailors(query: TailorQuery, signal?: AbortSignal) {
  const { data } = await http.get<Paginated<Tailor>>('/tailors', { params: clean(query), signal });
  return data;
}

export async function getTailor(slug: string, signal?: AbortSignal) {
  const { data } = await http.get<TailorDetail>(`/tailors/${slug}`, { signal });
  return data;
}

export async function getTailorReviews(slug: string, page: number, signal?: AbortSignal) {
  const { data } = await http.get<Paginated<PublicReview>>(`/tailors/${slug}/reviews`, {
    params: { page, limit: 10 },
    signal,
  });
  return data;
}

export async function getBrandStores(signal?: AbortSignal) {
  const { data } = await http.get<StorePin[]>('/brands/stores', { signal });
  return data;
}

export async function searchPlaces(q: string, signal?: AbortSignal) {
  const { data } = await http.get<Place[]>('/geo/search', { params: { q }, signal });
  return data;
}

// ---- Tailor panel ----

export interface TailorProfileInput {
  businessName: string;
  bio?: string;
  phone: string;
  address: string;
  city: string;
  lat?: number;
  lng?: number;
  specialities: TailorSpeciality[];
  turnaroundDays: number;
  homeVisits: boolean;
}

export interface ServiceInput {
  name: string;
  type: ServiceType;
  description?: string;
  price: number;
  durationDays: number;
  isActive?: boolean;
}

export async function getOwnTailorProfile(signal?: AbortSignal) {
  const { data } = await http.get<{ profile: (Tailor & { services: TailorService[] }) | null; approved: boolean }>(
    '/tailor/profile',
    { signal },
  );
  return data;
}

export async function saveTailorProfile(input: TailorProfileInput) {
  const { data } = await http.put<Tailor & { services: TailorService[] }>('/tailor/profile', input);
  return data;
}

export async function addGalleryPhoto(file: File) {
  const form = new FormData();
  form.append('photo', file);
  const { data } = await http.post<Tailor>('/tailor/profile/gallery', form, { timeout: 60_000 });
  return data;
}

export async function removeGalleryPhoto(index: number) {
  const { data } = await http.delete<Tailor>(`/tailor/profile/gallery/${index}`);
  return data;
}

export async function addService(input: ServiceInput) {
  const { data } = await http.post<TailorService>('/tailor/services', input);
  return data;
}

export async function updateService(id: string, input: Partial<ServiceInput>) {
  const { data } = await http.patch<TailorService>(`/tailor/services/${id}`, input);
  return data;
}

export async function deleteService(id: string) {
  await http.delete(`/tailor/services/${id}`);
}

export async function listOwnReviews(page: number, signal?: AbortSignal) {
  const { data } = await http.get<Paginated<PublicReview>>('/tailor/reviews', { params: { page, limit: 10 }, signal });
  return data;
}

export async function replyToReview(id: string, reply: string) {
  await http.put(`/tailor/reviews/${id}/reply`, { reply });
}

import type { User } from '../types/auth';
import type { Product } from '../types/catalogue';
import type { Measurement, MeasurementInput, StyleProfile } from '../types/profile';
import type { Outfit, StylistInput, StylistRequest } from '../types/stylist';
import type { PersonPhoto, TryOn } from '../types/tryon';
import { http } from './http';

/** The AI stylist can take up to ~50 s before falling back, so it gets a longer timeout. */
const STYLIST_TIMEOUT_MS = 90_000;

// ---- Me ----

export async function updateMe(input: { name?: string; phone?: string; city?: string }) {
  const { data } = await http.patch<User>('/me', input);
  return data;
}

export async function getStyleProfile(signal?: AbortSignal) {
  const { data } = await http.get<StyleProfile>('/me/style-profile', { signal });
  return data;
}

export async function updateStyleProfile(input: Omit<StyleProfile, 'id'>) {
  const { data } = await http.put<StyleProfile>('/me/style-profile', input);
  return data;
}

export async function listMeasurements(signal?: AbortSignal) {
  const { data } = await http.get<Measurement[]>('/me/measurements', { signal });
  return data;
}

export async function createMeasurement(input: MeasurementInput) {
  const { data } = await http.post<Measurement>('/me/measurements', input);
  return data;
}

export async function updateMeasurement(id: string, input: MeasurementInput) {
  const { data } = await http.patch<Measurement>(`/me/measurements/${id}`, input);
  return data;
}

export async function deleteMeasurement(id: string) {
  await http.delete(`/me/measurements/${id}`);
}

// ---- Wishlist ----

export async function getWishlist(signal?: AbortSignal) {
  const { data } = await http.get<Product[]>('/me/wishlist', { signal });
  return data;
}

export async function getWishlistIds(signal?: AbortSignal) {
  const { data } = await http.get<string[]>('/me/wishlist/ids', { signal });
  return data;
}

export async function saveProduct(productId: string) {
  await http.put(`/me/wishlist/${productId}`);
}

export async function unsaveProduct(productId: string) {
  await http.delete(`/me/wishlist/${productId}`);
}

// ---- Stylist and outfits ----

export async function askStylist(input: StylistInput) {
  const { data } = await http.post<StylistRequest>('/stylist/requests', input, { timeout: STYLIST_TIMEOUT_MS });
  return data;
}

export async function listStylistRequests(signal?: AbortSignal) {
  const { data } = await http.get<StylistRequest[]>('/stylist/requests', { signal });
  return data;
}

export async function getStylistRequest(id: string, signal?: AbortSignal) {
  const { data } = await http.get<StylistRequest>(`/stylist/requests/${id}`, { signal });
  return data;
}

export async function saveSuggestion(suggestionId: string, name?: string) {
  const { data } = await http.post<Outfit>(`/stylist/suggestions/${suggestionId}/save`, name ? { name } : {});
  return data;
}

export async function rateSuggestion(suggestionId: string, liked: boolean) {
  await http.put(`/stylist/suggestions/${suggestionId}/feedback`, { liked });
}

export async function listOutfits(signal?: AbortSignal) {
  const { data } = await http.get<Outfit[]>('/outfits', { signal });
  return data;
}

export async function getOutfit(id: string, signal?: AbortSignal) {
  const { data } = await http.get<Outfit>(`/outfits/${id}`, { signal });
  return data;
}

export async function renameOutfit(id: string, name: string) {
  const { data } = await http.patch<Outfit>(`/outfits/${id}`, { name });
  return data;
}

export async function deleteOutfit(id: string) {
  await http.delete(`/outfits/${id}`);
}

export async function getAlternatives(outfitId: string, itemId: string, signal?: AbortSignal) {
  const { data } = await http.get<Product[]>(`/outfits/${outfitId}/items/${itemId}/alternatives`, { signal });
  return data;
}

export async function swapOutfitItem(outfitId: string, itemId: string, productId: string) {
  const { data } = await http.put<Outfit>(`/outfits/${outfitId}/items/${itemId}`, { productId });
  return data;
}

export async function removeOutfitItem(outfitId: string, itemId: string) {
  const { data } = await http.delete<Outfit>(`/outfits/${outfitId}/items/${itemId}`);
  return data;
}

// ---- Try-on ----

export async function listPhotos(signal?: AbortSignal) {
  const { data } = await http.get<PersonPhoto[]>('/me/photos', { signal });
  return data;
}

export async function uploadPhoto(file: File, onProgress?: (percent: number) => void) {
  const form = new FormData();
  form.append('photo', file);
  const { data } = await http.post<PersonPhoto>('/me/photos', form, {
    timeout: 60_000,
    onUploadProgress: (event) => event.total && onProgress?.(Math.round((event.loaded / event.total) * 100)),
  });
  return data;
}

export async function deletePhoto(id: string) {
  await http.delete(`/me/photos/${id}`);
}

export async function startTryOn(photoId: string, productId: string) {
  const { data } = await http.post<TryOn>('/tryons', { photoId, productId });
  return data;
}

export async function getTryOn(id: string, signal?: AbortSignal) {
  const { data } = await http.get<TryOn>(`/tryons/${id}`, { signal });
  return data;
}

export async function listTryOns(signal?: AbortSignal) {
  const { data } = await http.get<TryOn[]>('/tryons', { signal });
  return data;
}

export async function deleteTryOn(id: string) {
  await http.delete(`/tryons/${id}`);
}

import type { BrandSummary, Facets, Paginated, Product, ProductFilters } from '../types/catalogue';
import { http } from './http';

/** Turns filter arrays into comma-separated query values and drops empty ones. */
function toParams(filters: ProductFilters): Record<string, string | number> {
  const params: Record<string, string | number> = {};
  for (const [key, value] of Object.entries(filters)) {
    if (value === undefined || value === '' || (Array.isArray(value) && value.length === 0)) continue;
    params[key] = Array.isArray(value) ? value.join(',') : value;
  }
  return params;
}

export async function searchProducts(filters: ProductFilters, signal?: AbortSignal) {
  const { data } = await http.get<Paginated<Product>>('/products', { params: toParams(filters), signal });
  return data;
}

export async function getFeaturedProducts(limit: number, signal?: AbortSignal) {
  const { data } = await http.get<Product[]>('/products/featured', { params: { limit }, signal });
  return data;
}

export async function getFacets(signal?: AbortSignal) {
  const { data } = await http.get<Facets>('/products/facets', { signal });
  return data;
}

export async function getProduct(id: string, signal?: AbortSignal) {
  const { data } = await http.get<Product>(`/products/${id}`, { signal });
  return data;
}

export async function getSimilarProducts(id: string, signal?: AbortSignal) {
  const { data } = await http.get<Product[]>(`/products/${id}/similar`, { signal });
  return data;
}

export async function getBrands(signal?: AbortSignal) {
  const { data } = await http.get<BrandSummary[]>('/brands', { signal });
  return data;
}

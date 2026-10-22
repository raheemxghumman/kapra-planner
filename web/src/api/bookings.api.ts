import type { Booking, BookingAction, BookingStatus, ChatMessage, CreateBookingInput } from '../types/bookings';
import type { Paginated } from '../types/catalogue';
import type { Order, OrderAction, OrderStatus, ShippingInput } from '../types/orders';
import type { AppNotification } from '../types/panels';
import { http } from './http';

// ---- Bookings ----

export async function createBooking(input: CreateBookingInput) {
  const { data } = await http.post<{ booking: Booking; checkoutUrl: string }>('/bookings', input, { timeout: 30_000 });
  return data;
}

export async function listBookings(params: { status?: BookingStatus; page?: number; limit?: number }, signal?: AbortSignal) {
  const { data } = await http.get<Paginated<Booking>>('/bookings', { params, signal });
  return data;
}

export async function getBooking(id: string, signal?: AbortSignal) {
  const { data } = await http.get<Booking>(`/bookings/${id}`, { signal });
  return data;
}

export async function payBooking(id: string) {
  const { data } = await http.post<{ checkoutUrl: string }>(`/bookings/${id}/pay`, {}, { timeout: 30_000 });
  return data;
}

export async function bookingAction(id: string, action: BookingAction, reason?: string) {
  const { data } = await http.post<Booking>(`/bookings/${id}/actions`, { action, reason }, { timeout: 30_000 });
  return data;
}

export async function reviewBooking(id: string, rating: number, comment?: string) {
  await http.post(`/bookings/${id}/review`, { rating, comment: comment || undefined });
}

export async function listMessages(bookingId: string, signal?: AbortSignal) {
  const { data } = await http.get<ChatMessage[]>(`/bookings/${bookingId}/messages`, { signal });
  return data;
}

export async function sendMessage(bookingId: string, body: string) {
  const { data } = await http.post<ChatMessage>(`/bookings/${bookingId}/messages`, { body });
  return data;
}

export async function markMessagesRead(bookingId: string) {
  await http.post(`/bookings/${bookingId}/messages/read`);
}

// ---- Payments ----

export async function confirmPayment(sessionId: string) {
  const { data } = await http.post<{ status: string }>('/payments/confirm', { sessionId });
  return data;
}

// ---- Orders ----

export async function createOrder(input: { brandId: string; items: { variantId: string; quantity: number }[]; shipping: ShippingInput }) {
  const { data } = await http.post<{ order: Order; checkoutUrl: string }>('/orders', input, { timeout: 30_000 });
  return data;
}

export async function listOrders(params: { status?: OrderStatus; page?: number; limit?: number }, signal?: AbortSignal) {
  const { data } = await http.get<Paginated<Order>>('/orders', { params, signal });
  return data;
}

export async function getOrder(id: string, signal?: AbortSignal) {
  const { data } = await http.get<Order>(`/orders/${id}`, { signal });
  return data;
}

export async function payOrder(id: string) {
  const { data } = await http.post<{ checkoutUrl: string }>(`/orders/${id}/pay`, {}, { timeout: 30_000 });
  return data;
}

export async function orderAction(id: string, action: OrderAction, extra: { trackingNumber?: string; reason?: string } = {}) {
  const { data } = await http.post<Order>(`/orders/${id}/actions`, { action, ...extra }, { timeout: 30_000 });
  return data;
}

// ---- Notifications ----

export async function listNotifications(signal?: AbortSignal) {
  const { data } = await http.get<Paginated<AppNotification> & { unread: number }>('/notifications', {
    params: { limit: 20 },
    signal,
  });
  return data;
}

export async function markNotificationRead(id: string) {
  await http.post(`/notifications/${id}/read`);
}

export async function markAllNotificationsRead() {
  await http.post('/notifications/read-all');
}

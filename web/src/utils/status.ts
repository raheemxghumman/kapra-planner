import type { Tone } from '../components/ui/StatusPill';
import type { BookingStatus, PaymentStatus } from '../types/bookings';
import type { OrderStatus } from '../types/orders';

/** Colour of each status pill, so a status looks the same on every page. */
export function bookingTone(status: BookingStatus): Tone {
  switch (status) {
    case 'pending_payment':
      return 'stone';
    case 'requested':
      return 'blush';
    case 'accepted':
    case 'in_progress':
      return 'sand';
    case 'ready':
      return 'olive';
    case 'completed':
      return 'ink';
    default:
      return 'henna';
  }
}

export function orderTone(status: OrderStatus): Tone {
  switch (status) {
    case 'pending_payment':
      return 'stone';
    case 'paid':
      return 'blush';
    case 'shipped':
      return 'olive';
    case 'delivered':
      return 'ink';
    default:
      return 'henna';
  }
}

export const PAYMENT_LABEL: Record<PaymentStatus, string> = {
  pending: 'Not paid yet',
  paid: 'Paid',
  refund_pending: 'Refund being processed',
  refunded: 'Refunded',
  failed: 'Payment cancelled',
};

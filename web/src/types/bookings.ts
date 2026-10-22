import type { Product } from './catalogue';
import type { Outfit } from './stylist';
import type { TryOn } from './tryon';

export type BookingStatus =
  | 'pending_payment'
  | 'requested'
  | 'accepted'
  | 'in_progress'
  | 'ready'
  | 'completed'
  | 'cancelled'
  | 'declined';

export type BookingAction = 'accept' | 'decline' | 'start' | 'ready' | 'complete' | 'cancel';
export type Handoff = 'drop_off' | 'home_visit';
export type PaymentStatus = 'pending' | 'paid' | 'refund_pending' | 'refunded' | 'failed';

export interface BookingEvent {
  id: string;
  status: BookingStatus;
  actor: 'customer' | 'tailor' | 'system';
  note: string | null;
  createdAt: string;
}

export interface Booking {
  id: string;
  code: string;
  status: BookingStatus;
  serviceName: string;
  price: number;
  handoff: Handoff;
  appointmentAt: string;
  address: string | null;
  notes: string | null;
  dueDate: string | null;
  closingReason: string | null;
  paidAt: string | null;
  completedAt: string | null;
  createdAt: string;
  measurements: { label: string; notes: string | null; values: Record<string, number | null> } | null;
  customer: { id: string; name: string; phone: string | null };
  tailor: {
    id: string;
    businessName: string;
    slug: string;
    phone: string;
    address: string;
    city: string;
    lat: number;
    lng: number;
    userId: string;
  };
  product: Product | null;
  tryOn: TryOn | null;
  outfit?: Outfit | null;
  events?: BookingEvent[];
  viewerRole: 'customer' | 'tailor' | 'admin';
  actions: BookingAction[];
  review?: { id: string; rating: number; comment: string | null; reply: string | null } | null;
  payment?: { status: PaymentStatus; amount: number; paidAt: string | null; refundedAt: string | null } | null;
}

export interface CreateBookingInput {
  tailorId: string;
  serviceId: string;
  handoff: Handoff;
  appointmentAt: string;
  address?: string;
  measurementId?: string;
  productId?: string;
  outfitId?: string;
  tryOnId?: string;
  notes?: string;
}

export interface ChatMessage {
  id: string;
  bookingId: string;
  senderId: string;
  body: string;
  readAt: string | null;
  createdAt: string;
}

export const BOOKING_STEPS: { status: BookingStatus; label: string; hint: string }[] = [
  { status: 'requested', label: 'Paid & requested', hint: 'Waiting for the tailor to accept' },
  { status: 'accepted', label: 'Accepted', hint: 'Drop off your fabric or wait for the visit' },
  { status: 'in_progress', label: 'Stitching', hint: 'Your outfit is being made' },
  { status: 'ready', label: 'Ready', hint: 'Collect it from the shop' },
  { status: 'completed', label: 'Completed', hint: 'Enjoy, and leave a review' },
];

export const BOOKING_STATUS_LABEL: Record<BookingStatus, string> = {
  pending_payment: 'Awaiting payment',
  requested: 'Requested',
  accepted: 'Accepted',
  in_progress: 'Stitching',
  ready: 'Ready',
  completed: 'Completed',
  cancelled: 'Cancelled',
  declined: 'Declined',
};

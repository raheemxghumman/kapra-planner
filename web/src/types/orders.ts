import type { BrandRef } from './catalogue';
import type { PaymentStatus } from './bookings';

export type OrderStatus = 'pending_payment' | 'paid' | 'shipped' | 'delivered' | 'cancelled';
export type OrderAction = 'ship' | 'deliver' | 'cancel';

export interface OrderItem {
  id: string;
  productId: string | null;
  variantId: string | null;
  title: string;
  size: string;
  image: string | null;
  unitPrice: number;
  quantity: number;
}

export interface Order {
  id: string;
  code: string;
  status: OrderStatus;
  subtotal: number;
  shippingFee: number;
  total: number;
  shipName: string;
  shipPhone: string;
  shipAddress: string;
  shipCity: string;
  trackingNumber: string | null;
  cancelReason: string | null;
  paidAt: string | null;
  shippedAt: string | null;
  deliveredAt: string | null;
  createdAt: string;
  brand: BrandRef & { logoUrl?: string | null };
  items: OrderItem[];
  actions: OrderAction[];
  viewerRole?: 'customer' | 'brand' | 'admin';
  customer?: { id: string; name: string };
  payment?: { status: PaymentStatus; amount: number; paidAt: string | null } | null;
}

export interface ShippingInput {
  name: string;
  phone: string;
  address: string;
  city: string;
}

export const ORDER_STATUS_LABEL: Record<OrderStatus, string> = {
  pending_payment: 'Awaiting payment',
  paid: 'Paid',
  shipped: 'Shipped',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
};

export const SHIPPING_FEE = 250;
export const FREE_SHIPPING_FROM = 5_000;

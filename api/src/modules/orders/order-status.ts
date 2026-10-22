/**
 * Product order states (one order = one brand):
 *
 *   pending_payment --pay(system)--> paid --ship(brand)--> shipped --deliver(brand or customer)--> delivered
 *   pending_payment --cancel(customer)--> cancelled               (nothing was paid)
 *   paid            --cancel(customer or brand)--> cancelled      (full refund)
 */

export enum OrderStatus {
  PendingPayment = 'pending_payment',
  Paid = 'paid',
  Shipped = 'shipped',
  Delivered = 'delivered',
  Cancelled = 'cancelled',
}

export type OrderActor = 'customer' | 'brand' | 'system';

export const ORDER_ACTIONS = ['pay', 'ship', 'deliver', 'cancel'] as const;
export type OrderAction = (typeof ORDER_ACTIONS)[number];

const TRANSITIONS: Record<OrderAction, { from: OrderStatus[]; to: OrderStatus; by: OrderActor[] }> =
  {
    pay: { from: [OrderStatus.PendingPayment], to: OrderStatus.Paid, by: ['system'] },
    ship: { from: [OrderStatus.Paid], to: OrderStatus.Shipped, by: ['brand'] },
    deliver: { from: [OrderStatus.Shipped], to: OrderStatus.Delivered, by: ['brand', 'customer'] },
    cancel: {
      from: [OrderStatus.PendingPayment, OrderStatus.Paid],
      to: OrderStatus.Cancelled,
      by: ['customer', 'brand'],
    },
  };

const DONE: Record<OrderAction, string> = {
  pay: 'paid',
  ship: 'shipped',
  deliver: 'delivered',
  cancel: 'cancelled',
};

export class OrderTransitionError extends Error {}

export function nextOrderStatus(
  current: OrderStatus,
  action: OrderAction,
  actor: OrderActor,
): OrderStatus {
  const transition = TRANSITIONS[action];
  if (!transition.by.includes(actor))
    throw new OrderTransitionError(`You cannot ${action} this order`);
  if (!transition.from.includes(current)) {
    throw new OrderTransitionError(
      `This order is ${current.replace('_', ' ')}; it cannot be ${DONE[action]}`,
    );
  }
  // A brand cannot cancel an order it has not been paid for yet: only the customer can.
  if (action === 'cancel' && actor === 'brand' && current === OrderStatus.PendingPayment) {
    throw new OrderTransitionError('Only the customer can cancel an unpaid order');
  }
  return transition.to;
}

export function availableOrderActions(current: OrderStatus, actor: OrderActor): OrderAction[] {
  return ORDER_ACTIONS.filter((action) => {
    try {
      nextOrderStatus(current, action, actor);
      return true;
    } catch {
      return false;
    }
  });
}

/** Flat shipping fee per order, free above the threshold (both in rupees). */
export const SHIPPING_FEE = 250;
export const FREE_SHIPPING_FROM = 5_000;
export const shippingFor = (subtotal: number) =>
  subtotal >= FREE_SHIPPING_FROM ? 0 : SHIPPING_FEE;

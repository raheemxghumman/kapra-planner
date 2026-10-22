import {
  availableOrderActions,
  nextOrderStatus,
  OrderStatus,
  shippingFor,
} from './order-status.js';

describe('order state machine', () => {
  it('goes from payment to delivery', () => {
    let status = nextOrderStatus(OrderStatus.PendingPayment, 'pay', 'system');
    status = nextOrderStatus(status, 'ship', 'brand');
    expect(nextOrderStatus(status, 'deliver', 'customer')).toBe(OrderStatus.Delivered);
  });

  it('lets only the brand ship', () => {
    expect(() => nextOrderStatus(OrderStatus.Paid, 'ship', 'customer')).toThrow('You cannot ship');
  });

  it('does not cancel shipped orders', () => {
    expect(() => nextOrderStatus(OrderStatus.Shipped, 'cancel', 'customer')).toThrow(
      'cannot be cancelled',
    );
  });

  it('lets only the customer cancel an unpaid order', () => {
    expect(availableOrderActions(OrderStatus.PendingPayment, 'customer')).toEqual(['cancel']);
    expect(availableOrderActions(OrderStatus.PendingPayment, 'brand')).toEqual([]);
    expect(availableOrderActions(OrderStatus.Paid, 'brand')).toEqual(['ship', 'cancel']);
  });

  it('charges shipping below Rs 5,000 only', () => {
    expect(shippingFor(4_999)).toBe(250);
    expect(shippingFor(5_000)).toBe(0);
  });
});

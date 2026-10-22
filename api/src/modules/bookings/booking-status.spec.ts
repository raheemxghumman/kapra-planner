import {
  availableActions,
  BookingStatus,
  BookingTransitionError,
  nextStatus,
} from './booking-status.js';

describe('booking state machine', () => {
  it('follows the happy path from payment to completion', () => {
    let status = nextStatus(BookingStatus.PendingPayment, 'pay', 'system');
    status = nextStatus(status, 'accept', 'tailor');
    status = nextStatus(status, 'start', 'tailor');
    status = nextStatus(status, 'ready', 'tailor');
    status = nextStatus(status, 'complete', 'customer');
    expect(status).toBe(BookingStatus.Completed);
  });

  it('does not let a customer accept their own booking', () => {
    expect(() => nextStatus(BookingStatus.Requested, 'accept', 'customer')).toThrow(
      'Only the tailor can accept',
    );
  });

  it('does not let the browser mark a booking paid', () => {
    expect(() => nextStatus(BookingStatus.PendingPayment, 'pay', 'customer')).toThrow(
      BookingTransitionError,
    );
  });

  it('allows cancelling only before the tailor accepts', () => {
    expect(nextStatus(BookingStatus.Requested, 'cancel', 'customer')).toBe(BookingStatus.Cancelled);
    expect(() => nextStatus(BookingStatus.InProgress, 'cancel', 'customer')).toThrow(
      'in progress cannot be cancelled',
    );
  });

  it('cannot skip steps', () => {
    expect(() => nextStatus(BookingStatus.Accepted, 'ready', 'tailor')).toThrow(
      'cannot be marked ready',
    );
  });

  it('lists the buttons each person sees', () => {
    expect(availableActions(BookingStatus.Requested, 'tailor')).toEqual(['accept', 'decline']);
    expect(availableActions(BookingStatus.Requested, 'customer')).toEqual(['cancel']);
    expect(availableActions(BookingStatus.Ready, 'customer')).toEqual(['complete']);
    expect(availableActions(BookingStatus.Completed, 'tailor')).toEqual([]);
  });
});

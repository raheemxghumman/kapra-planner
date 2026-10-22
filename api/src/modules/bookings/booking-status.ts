/**
 * The life of a tailor booking as a state machine. Every change goes through nextStatus(), so
 * an action is only possible from the right status and by the right person:
 *
 *   pending_payment --pay(system)--> requested --accept(tailor)--> accepted --start(tailor)-->
 *   in_progress --ready(tailor)--> ready --complete(customer or tailor)--> completed
 *
 *   pending_payment --cancel(customer)--> cancelled          (nothing was paid)
 *   requested       --cancel(customer)--> cancelled          (full refund)
 *   requested       --decline(tailor)---> declined           (full refund)
 */

export enum BookingStatus {
  PendingPayment = 'pending_payment',
  Requested = 'requested',
  Accepted = 'accepted',
  InProgress = 'in_progress',
  Ready = 'ready',
  Completed = 'completed',
  Cancelled = 'cancelled',
  Declined = 'declined',
}

export type BookingActor = 'customer' | 'tailor' | 'system';

export const BOOKING_ACTIONS = [
  'pay',
  'accept',
  'decline',
  'start',
  'ready',
  'complete',
  'cancel',
] as const;
export type BookingAction = (typeof BOOKING_ACTIONS)[number];

interface Transition {
  from: BookingStatus[];
  to: BookingStatus;
  by: BookingActor[];
}

const TRANSITIONS: Record<BookingAction, Transition> = {
  pay: { from: [BookingStatus.PendingPayment], to: BookingStatus.Requested, by: ['system'] },
  accept: { from: [BookingStatus.Requested], to: BookingStatus.Accepted, by: ['tailor'] },
  decline: { from: [BookingStatus.Requested], to: BookingStatus.Declined, by: ['tailor'] },
  start: { from: [BookingStatus.Accepted], to: BookingStatus.InProgress, by: ['tailor'] },
  ready: { from: [BookingStatus.InProgress], to: BookingStatus.Ready, by: ['tailor'] },
  complete: {
    from: [BookingStatus.Ready],
    to: BookingStatus.Completed,
    by: ['customer', 'tailor'],
  },
  cancel: {
    from: [BookingStatus.PendingPayment, BookingStatus.Requested],
    to: BookingStatus.Cancelled,
    by: ['customer'],
  },
};

/** For error messages: "cannot be accepted", "cannot be marked ready". */
const DONE: Record<BookingAction, string> = {
  pay: 'paid',
  accept: 'accepted',
  decline: 'declined',
  start: 'started',
  ready: 'marked ready',
  complete: 'completed',
  cancel: 'cancelled',
};

export class BookingTransitionError extends Error {}

/** Returns the new status, or throws BookingTransitionError with a message for the user. */
export function nextStatus(
  current: BookingStatus,
  action: BookingAction,
  actor: BookingActor,
): BookingStatus {
  const transition = TRANSITIONS[action];
  if (!transition.by.includes(actor)) {
    throw new BookingTransitionError(
      `Only the ${transition.by.join(' or ')} can ${action} this booking`,
    );
  }
  if (!transition.from.includes(current)) {
    throw new BookingTransitionError(
      `A booking that is ${current.replace('_', ' ')} cannot be ${DONE[action]}`,
    );
  }
  return transition.to;
}

/** Actions this person can take now (the UI shows these as buttons). */
export function availableActions(current: BookingStatus, actor: BookingActor): BookingAction[] {
  return BOOKING_ACTIONS.filter((action) => {
    const transition = TRANSITIONS[action];
    return transition.by.includes(actor) && transition.from.includes(current);
  });
}

/** Statuses where the customer and tailor can chat. */
export const CHAT_OPEN = [
  BookingStatus.Requested,
  BookingStatus.Accepted,
  BookingStatus.InProgress,
  BookingStatus.Ready,
  BookingStatus.Completed,
];

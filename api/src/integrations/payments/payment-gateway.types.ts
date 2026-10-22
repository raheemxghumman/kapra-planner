export const PAYMENT_GATEWAY = Symbol('PAYMENT_GATEWAY');

export interface CheckoutRequest {
  /** Our payments.id, echoed back by the gateway so a result can be matched to it. */
  paymentId: string;
  amount: number;
  description: string;
  customerEmail: string;
  successUrl: string;
  cancelUrl: string;
}

export interface CheckoutSession {
  id: string;
  url: string;
  expiresAt: Date;
}

export interface SessionResult {
  paymentId: string | null;
  paid: boolean;
  amount: number;
  paymentIntentId: string | null;
}

export interface RefundResult {
  /** Stripe refund id, or the approval request id while pending. */
  id: string;
  pending: boolean;
}

export interface WebhookEvent {
  id: string;
  type: string;
  /** For checkout events: the session id. */
  sessionId: string | null;
}

/** Card payments. Bound to Stripe (test mode, PKR). */
export interface PaymentGateway {
  createCheckout(request: CheckoutRequest): Promise<CheckoutSession>;
  getSession(sessionId: string): Promise<SessionResult>;
  expireSession(sessionId: string): Promise<void>;
  /** pending = Stripe accepted the request but it waits for approval in the dashboard. */
  refund(paymentIntentId: string, amount?: number): Promise<RefundResult>;
  /** Verifies the signature of a webhook call and parses it; throws if it is forged. */
  parseWebhook(rawBody: Buffer, signature: string): WebhookEvent;
  readonly webhooksEnabled: boolean;
}

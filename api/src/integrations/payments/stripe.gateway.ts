import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';
import type { EnvironmentVariables } from '../../config/env.validation.js';
import type {
  CheckoutRequest,
  CheckoutSession,
  PaymentGateway,
  RefundResult,
  SessionResult,
  WebhookEvent,
} from './payment-gateway.types.js';

/** Stripe's shortest allowed Checkout lifetime. */
const SESSION_MINUTES = 30;
/** Stripe amounts are in the smallest unit: 1 rupee = 100 paisa. */
const toPaisa = (rupees: number) => Math.round(rupees * 100);

/**
 * Stripe Checkout in test mode (currency PKR). The customer pays on Stripe's hosted page, so
 * card numbers never reach our server (PCI scope stays with Stripe).
 */
@Injectable()
export class StripeGateway implements PaymentGateway {
  private readonly stripe: Stripe;
  private readonly webhookSecret: string;

  constructor(config: ConfigService<EnvironmentVariables, true>) {
    this.stripe = new Stripe(config.get('STRIPE_SECRET_KEY', { infer: true }), {
      maxNetworkRetries: 2,
    });
    this.webhookSecret = config.get('STRIPE_WEBHOOK_SECRET', { infer: true });
  }

  get webhooksEnabled(): boolean {
    return Boolean(this.webhookSecret);
  }

  async createCheckout(request: CheckoutRequest): Promise<CheckoutSession> {
    const expiresAt = new Date(Date.now() + SESSION_MINUTES * 60_000 + 30_000);
    try {
      const session = await this.stripe.checkout.sessions.create(
        {
          mode: 'payment',
          customer_email: request.customerEmail,
          line_items: [
            {
              quantity: 1,
              price_data: {
                currency: 'pkr',
                unit_amount: toPaisa(request.amount),
                product_data: { name: request.description },
              },
            },
          ],
          metadata: { paymentId: request.paymentId },
          payment_intent_data: { metadata: { paymentId: request.paymentId } },
          success_url: request.successUrl,
          cancel_url: request.cancelUrl,
          expires_at: Math.floor(expiresAt.getTime() / 1000),
        },
        // Retrying the same payment never creates two sessions.
        { idempotencyKey: `checkout-${request.paymentId}-${Math.floor(Date.now() / 60_000)}` },
      );
      return { id: session.id, url: session.url!, expiresAt };
    } catch (error) {
      throw new ServiceUnavailableException(
        `Payments are unavailable right now (${(error as Error).message})`,
      );
    }
  }

  async getSession(sessionId: string): Promise<SessionResult> {
    const session = await this.stripe.checkout.sessions.retrieve(sessionId);
    return {
      paymentId: session.metadata?.paymentId ?? null,
      paid: session.payment_status === 'paid',
      amount: (session.amount_total ?? 0) / 100,
      paymentIntentId:
        typeof session.payment_intent === 'string'
          ? session.payment_intent
          : (session.payment_intent?.id ?? null),
    };
  }

  async expireSession(sessionId: string): Promise<void> {
    await this.stripe.checkout.sessions.expire(sessionId).catch(() => undefined); // already paid or expired
  }

  async refund(paymentIntentId: string, amount?: number): Promise<RefundResult> {
    try {
      const refund = await this.stripe.refunds.create({
        payment_intent: paymentIntentId,
        ...(amount ? { amount: toPaisa(amount) } : {}),
      });
      return { id: refund.id, pending: refund.status === 'pending' };
    } catch (error) {
      // Restricted keys can be set to need a person's approval in the Stripe dashboard for
      // refunds. Stripe then queues the refund and runs it once approved.
      const approval = /approval_requests\/(apreq_[A-Za-z0-9_]+)/.exec((error as Error).message);
      if (approval) return { id: approval[1], pending: true };
      throw error;
    }
  }

  parseWebhook(rawBody: Buffer, signature: string): WebhookEvent {
    const event = this.stripe.webhooks.constructEvent(rawBody, signature, this.webhookSecret);
    const object = event.data.object as { object?: string; id?: string };
    return {
      id: event.id,
      type: event.type,
      sessionId: object.object === 'checkout.session' ? (object.id ?? null) : null,
    };
  }
}

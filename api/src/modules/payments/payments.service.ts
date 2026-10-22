import {
  BadRequestException,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import type { EnvironmentVariables } from '../../config/env.validation.js';
import {
  PAYMENT_GATEWAY,
  type PaymentGateway,
} from '../../integrations/payments/payment-gateway.types.js';
import type { User } from '../users/entities/user.entity.js';
import { Payment, PaymentPurpose, PaymentStatus } from './entities/payment.entity.js';
import { StripeEvent } from './entities/stripe-event.entity.js';

export const PAYMENT_PAID = 'payment.paid';
export const PAYMENT_REFUNDED = 'payment.refunded';

export interface PaymentEvent {
  payment: Payment;
}

export interface StartPayment {
  purpose: PaymentPurpose;
  referenceId: string;
  amount: number;
  description: string;
  /** Page the customer returns to, e.g. "/app/bookings/123". */
  returnPath: string;
}

/**
 * Stripe Checkout for bookings and orders. A payment becomes "paid" in one of two ways, both
 * of which ask Stripe directly instead of trusting the browser:
 *  1. the customer returns from Stripe and the page calls POST /payments/confirm, or
 *  2. Stripe calls POST /payments/webhook (once a webhook secret is configured).
 * markPaid() is a conditional update, so whichever comes first wins and the other does nothing.
 */
@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);
  private readonly webOrigin: string;

  constructor(
    @Inject(PAYMENT_GATEWAY) private readonly gateway: PaymentGateway,
    @InjectRepository(Payment) private readonly payments: Repository<Payment>,
    @InjectRepository(StripeEvent) private readonly stripeEvents: Repository<StripeEvent>,
    private readonly events: EventEmitter2,
    config: ConfigService<EnvironmentVariables, true>,
  ) {
    this.webOrigin = config.get('WEB_ORIGIN', { infer: true });
  }

  /** Creates (or reuses) the pending payment and a fresh Stripe Checkout page for it. */
  async start(
    user: User,
    request: StartPayment,
  ): Promise<{ paymentId: string; checkoutUrl: string }> {
    let payment = await this.payments.findOneBy({
      purpose: request.purpose,
      referenceId: request.referenceId,
      status: PaymentStatus.Pending,
    });
    if (payment?.stripeSessionId) await this.gateway.expireSession(payment.stripeSessionId);
    payment ??= this.payments.create({
      userId: user.id,
      purpose: request.purpose,
      referenceId: request.referenceId,
    });
    payment.amount = request.amount;
    payment = await this.payments.save(payment);

    const returnUrl = `${this.webOrigin}${request.returnPath}`;
    const session = await this.gateway.createCheckout({
      paymentId: payment.id,
      amount: request.amount,
      description: request.description,
      customerEmail: user.email,
      successUrl: `${returnUrl}?session_id={CHECKOUT_SESSION_ID}`,
      cancelUrl: `${returnUrl}?payment=cancelled`,
    });
    await this.payments.update(payment.id, { stripeSessionId: session.id });
    return { paymentId: payment.id, checkoutUrl: session.url };
  }

  /** Called by the return page. Only the customer who paid can confirm their own session. */
  async confirm(userId: string, sessionId: string): Promise<Payment> {
    const payment = await this.payments.findOneBy({ stripeSessionId: sessionId, userId });
    if (!payment) throw new NotFoundException('Payment not found');
    return this.confirmSession(payment);
  }

  private async confirmSession(payment: Payment): Promise<Payment> {
    if (payment.status !== PaymentStatus.Pending) return payment;
    const session = await this.gateway.getSession(payment.stripeSessionId!);
    if (!session.paid) return payment;
    if (session.paymentId !== payment.id || session.amount !== payment.amount) {
      this.logger.error(
        `Stripe session ${payment.stripeSessionId} does not match payment ${payment.id}`,
      );
      throw new BadRequestException('Payment details do not match');
    }
    return this.markPaid(payment, session.paymentIntentId);
  }

  private async markPaid(payment: Payment, paymentIntentId: string | null): Promise<Payment> {
    const result = await this.payments.update(
      { id: payment.id, status: PaymentStatus.Pending },
      { status: PaymentStatus.Paid, paidAt: new Date(), stripePaymentIntentId: paymentIntentId },
    );
    const updated = (await this.payments.findOneBy({ id: payment.id }))!;
    if (result.affected) {
      this.logger.log(`Payment ${payment.id} paid (${payment.purpose} ${payment.referenceId})`);
      await this.events.emitAsync(PAYMENT_PAID, { payment: updated } satisfies PaymentEvent);
    }
    return updated;
  }

  /** Stripe -> us. The signature check proves the call really came from Stripe. */
  async handleWebhook(rawBody: Buffer | undefined, signature: string | undefined): Promise<void> {
    if (!this.gateway.webhooksEnabled)
      throw new ServiceUnavailableException('Webhooks are not configured');
    if (!rawBody || !signature) throw new BadRequestException('Missing signature');

    let event;
    try {
      event = this.gateway.parseWebhook(rawBody, signature);
    } catch {
      throw new BadRequestException('Invalid signature');
    }

    // Record the event first; if it was already recorded, Stripe is retrying and we stop.
    const inserted = await this.stripeEvents
      .createQueryBuilder()
      .insert()
      .values({ eventId: event.id, type: event.type.slice(0, 60) })
      .orIgnore()
      .execute();
    // ON CONFLICT DO NOTHING returns no row when the event id is already there.
    if (!inserted.raw?.length) return;

    if (
      event.sessionId &&
      ['checkout.session.completed', 'checkout.session.async_payment_succeeded'].includes(
        event.type,
      )
    ) {
      const payment = await this.payments.findOneBy({ stripeSessionId: event.sessionId });
      if (payment) await this.confirmSession(payment);
    }
  }

  /** Full refund (or part, with amount) of a paid payment. */
  async refund(
    purpose: PaymentPurpose,
    referenceId: string,
    amount?: number,
  ): Promise<Payment | null> {
    const payment = await this.payments.findOneBy({
      purpose,
      referenceId,
      status: PaymentStatus.Paid,
    });
    if (!payment?.stripePaymentIntentId) return null;
    const refund = await this.gateway.refund(payment.stripePaymentIntentId, amount);
    await this.payments.update(payment.id, {
      status: refund.pending ? PaymentStatus.RefundPending : PaymentStatus.Refunded,
      stripeRefundId: refund.id,
      refundedAt: refund.pending ? null : new Date(),
    });
    const updated = (await this.payments.findOneBy({ id: payment.id }))!;
    await this.events.emitAsync(PAYMENT_REFUNDED, { payment: updated } satisfies PaymentEvent);
    return updated;
  }

  /** Cancels the checkout page of an unpaid booking/order so it can no longer be paid. */
  async cancelPending(purpose: PaymentPurpose, referenceId: string): Promise<void> {
    const pending = await this.payments.findOneBy({
      purpose,
      referenceId,
      status: PaymentStatus.Pending,
    });
    if (!pending) return;
    if (pending.stripeSessionId) await this.gateway.expireSession(pending.stripeSessionId);
    await this.payments.update(pending.id, { status: PaymentStatus.Failed });
  }

  findFor(purpose: PaymentPurpose, referenceId: string): Promise<Payment[]> {
    return this.payments.find({ where: { purpose, referenceId }, order: { createdAt: 'DESC' } });
  }
}

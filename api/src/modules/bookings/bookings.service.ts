import { randomBytes } from 'node:crypto';
import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { paginate, type Paginated } from '../../common/dto/pagination.dto.js';
import { UserRole } from '../../common/enums/user-role.enum.js';
import { UserStatus } from '../../common/enums/user-status.enum.js';
import { EMAIL_SENDER, type EmailSender } from '../../integrations/email/email.types.js';
import { ProductsService } from '../catalogue/products.service.js';
import { NotificationsService } from '../notifications/notifications.service.js';
import { PaymentPurpose } from '../payments/entities/payment.entity.js';
import { PAYMENT_PAID, PaymentsService, type PaymentEvent } from '../payments/payments.service.js';
import { ProfilesService } from '../profiles/profiles.service.js';
import { RealtimeGateway } from '../realtime/realtime.gateway.js';
import { OutfitsService } from '../stylist/outfits.service.js';
import { Review } from '../tailors/entities/review.entity.js';
import { TailorProfile } from '../tailors/entities/tailor-profile.entity.js';
import { TailorService } from '../tailors/entities/tailor-service.entity.js';
import { TailorRankingService } from '../tailors/ranking/tailor-ranking.service.js';
import { TryOn, TryOnStatus } from '../tryon/entities/try-on.entity.js';
import type { User } from '../users/entities/user.entity.js';
import { UsersService } from '../users/users.service.js';
import {
  availableActions,
  BookingStatus,
  BookingTransitionError,
  nextStatus,
  type BookingAction,
  type BookingActor,
} from './booking-status.js';
import type {
  BookingActionDto,
  BookingQueryDto,
  CreateBookingDto,
  CreateReviewDto,
} from './dto/booking.dto.js';
import { BookingEvent } from './entities/booking-event.entity.js';
import { Booking, Handoff, type MeasurementSnapshot } from './entities/booking.entity.js';

const DAY_MS = 86_400_000;
const MAX_DAYS_AHEAD = 60;

const formatRs = (amount: number) => `Rs ${amount.toLocaleString('en-PK')}`;
const newCode = () => `KP-${randomBytes(3).toString('hex').toUpperCase()}`;

/** What each person is told when a booking moves to a status. */
const STATUS_MESSAGES: Partial<
  Record<BookingStatus, { title: string; to: 'customer' | 'tailor' }>
> = {
  [BookingStatus.Requested]: { title: 'New booking request', to: 'tailor' },
  [BookingStatus.Accepted]: { title: 'Your booking was accepted', to: 'customer' },
  [BookingStatus.InProgress]: { title: 'Stitching has started', to: 'customer' },
  [BookingStatus.Ready]: { title: 'Your order is ready', to: 'customer' },
  [BookingStatus.Declined]: { title: 'Your booking was declined', to: 'customer' },
  [BookingStatus.Cancelled]: { title: 'A booking was cancelled', to: 'tailor' },
};

@Injectable()
export class BookingsService {
  private readonly logger = new Logger(BookingsService.name);

  constructor(
    @InjectRepository(Booking) private readonly bookings: Repository<Booking>,
    @InjectRepository(TailorProfile) private readonly tailors: Repository<TailorProfile>,
    @InjectRepository(TailorService) private readonly services: Repository<TailorService>,
    @InjectRepository(Review) private readonly reviews: Repository<Review>,
    @InjectRepository(TryOn) private readonly tryOns: Repository<TryOn>,
    @InjectDataSource() private readonly dataSource: DataSource,
    @Inject(EMAIL_SENDER) private readonly email: EmailSender,
    private readonly payments: PaymentsService,
    private readonly profiles: ProfilesService,
    private readonly outfits: OutfitsService,
    private readonly products: ProductsService,
    private readonly notifications: NotificationsService,
    private readonly realtime: RealtimeGateway,
    private readonly ranking: TailorRankingService,
    private readonly users: UsersService,
  ) {}

  // ---- Creating and paying ----

  /** Saves the booking as "pending payment" and returns the Stripe Checkout link. */
  async create(customer: User, dto: CreateBookingDto) {
    const tailor = await this.tailors.findOne({
      where: { id: dto.tailorId },
      relations: { user: true },
    });
    if (!tailor || tailor.user.status !== UserStatus.Active)
      throw new NotFoundException('Tailor not found');
    const service = await this.services.findOneBy({
      id: dto.serviceId,
      tailorId: tailor.id,
      isActive: true,
    });
    if (!service) throw new BadRequestException('This tailor does not offer that service');

    const appointment = dto.appointmentAt.getTime();
    if (
      appointment < Date.now() + DAY_MS / 2 ||
      appointment > Date.now() + MAX_DAYS_AHEAD * DAY_MS
    ) {
      throw new BadRequestException(
        `Pick a date between tomorrow and ${MAX_DAYS_AHEAD} days from now`,
      );
    }
    if (dto.handoff === Handoff.HomeVisit && !tailor.homeVisits) {
      throw new BadRequestException('This tailor does not make home visits; choose drop-off');
    }

    const booking = this.bookings.create({
      code: newCode(),
      customerId: customer.id,
      tailorId: tailor.id,
      serviceId: service.id,
      serviceName: service.name,
      price: service.price,
      handoff: dto.handoff,
      appointmentAt: dto.appointmentAt,
      address: dto.handoff === Handoff.HomeVisit ? dto.address! : null,
      notes: dto.notes ?? null,
      measurements: dto.measurementId
        ? await this.snapshotMeasurements(customer.id, dto.measurementId)
        : null,
      productId: dto.productId ? (await this.products.findById(dto.productId)).id : null,
      outfitId: dto.outfitId ? (await this.outfits.findOwn(customer.id, dto.outfitId)).id : null,
      tryOnId: dto.tryOnId ? await this.ownCompletedTryOn(customer.id, dto.tryOnId) : null,
    });

    await this.dataSource.transaction(async (manager) => {
      await manager.save(booking);
      await manager.insert(BookingEvent, {
        bookingId: booking.id,
        status: booking.status,
        actor: 'customer',
        note: null,
      });
    });

    const { checkoutUrl } = await this.startPayment(customer, booking, tailor.businessName);
    return { booking: await this.findOneFor(customer, booking.id), checkoutUrl };
  }

  /** A new checkout link for a booking that has not been paid yet. */
  async pay(customer: User, id: string) {
    const booking = await this.bookings.findOne({
      where: { id, customerId: customer.id },
      relations: { tailor: true },
    });
    if (!booking) throw new NotFoundException('Booking not found');
    if (booking.status !== BookingStatus.PendingPayment)
      throw new BadRequestException('This booking is already paid or closed');
    return this.startPayment(customer, booking, booking.tailor.businessName);
  }

  private startPayment(customer: User, booking: Booking, tailorName: string) {
    return this.payments.start(customer, {
      purpose: PaymentPurpose.Booking,
      referenceId: booking.id,
      amount: booking.price,
      description: `${booking.serviceName} by ${tailorName} (${booking.code})`,
      returnPath: `/app/bookings/${booking.id}`,
    });
  }

  private async snapshotMeasurements(
    userId: string,
    measurementId: string,
  ): Promise<MeasurementSnapshot> {
    const m = await this.profiles.findOwnMeasurement(userId, measurementId);
    return {
      label: m.label,
      notes: m.notes,
      values: {
        chest: m.chest,
        waist: m.waist,
        hips: m.hips,
        shoulder: m.shoulder,
        sleeveLength: m.sleeveLength,
        shirtLength: m.shirtLength,
        trouserLength: m.trouserLength,
        neck: m.neck,
      },
    };
  }

  private async ownCompletedTryOn(userId: string, tryOnId: string): Promise<string> {
    const tryOn = await this.tryOns.findOneBy({
      id: tryOnId,
      userId,
      status: TryOnStatus.Completed,
    });
    if (!tryOn) throw new BadRequestException('Try-on not found');
    return tryOn.id;
  }

  /** Stripe confirmed the payment (return page or webhook): the tailor now gets the request. */
  @OnEvent(PAYMENT_PAID)
  async onPaymentPaid({ payment }: PaymentEvent): Promise<void> {
    if (payment.purpose !== PaymentPurpose.Booking) return;
    const booking = await this.bookings.findOneBy({ id: payment.referenceId });
    if (!booking || booking.status !== BookingStatus.PendingPayment) return;
    await this.transition(booking, 'pay', 'system', null, { paidAt: payment.paidAt });
    await this.afterChange(booking.id, BookingStatus.Requested);

    const customer = await this.users.findById(booking.customerId);
    if (customer) {
      await this.email.send({
        to: customer.email,
        subject: `Receipt for booking ${booking.code}`,
        text: [
          `Thank you, ${customer.name.split(' ')[0]}.`,
          `We received ${formatRs(payment.amount)} for "${booking.serviceName}" (booking ${booking.code}).`,
          'The tailor will accept your request soon; you can follow every step in Kapra.',
        ].join('\n'),
      });
    }
  }

  // ---- Reading ----

  async list(
    user: User,
    query: BookingQueryDto,
  ): Promise<Paginated<ReturnType<BookingsService['toView']>>> {
    const qb = this.bookings
      .createQueryBuilder('b')
      .innerJoinAndSelect('b.tailor', 't')
      .innerJoinAndSelect('b.customer', 'c')
      .leftJoinAndSelect('b.product', 'p')
      .leftJoinAndSelect('b.tryOn', 'tr')
      .orderBy('b.createdAt', 'DESC')
      .skip((query.page - 1) * query.limit)
      .take(query.limit);

    if (user.role === UserRole.Tailor) qb.where('t.user_id = :userId', { userId: user.id });
    else if (user.role === UserRole.Customer)
      qb.where('b.customer_id = :userId', { userId: user.id });
    else if (user.role !== UserRole.Admin) throw new ForbiddenException();
    if (query.status) qb.andWhere('b.status = :status', { status: query.status });

    const [rows, total] = await qb.getManyAndCount();
    return paginate(
      rows.map((booking) => this.toView(booking, this.actorFor(user, booking))),
      total,
      query,
    );
  }

  async findOneFor(user: User, id: string) {
    const booking = await this.bookings.findOne({
      where: { id },
      relations: {
        tailor: true,
        customer: true,
        product: { brand: true },
        tryOn: true,
        outfit: { items: { product: true } },
        events: true,
      },
      order: { events: { createdAt: 'ASC' } },
    });
    if (!booking) throw new NotFoundException('Booking not found');
    const actor = this.actorFor(user, booking);
    const [review, [payment]] = await Promise.all([
      this.reviews.findOneBy({ bookingId: booking.id }),
      this.payments.findFor(PaymentPurpose.Booking, booking.id),
    ]);
    const paymentSummary = payment
      ? {
          status: payment.status,
          amount: payment.amount,
          paidAt: payment.paidAt,
          refundedAt: payment.refundedAt,
        }
      : null;
    return { ...this.toView(booking, actor), review, payment: paymentSummary };
  }

  /** "customer", "tailor" or "admin" (read-only); anyone else gets 404. */
  private actorFor(user: User, booking: Booking): BookingActor | 'admin' {
    if (booking.customerId === user.id) return 'customer';
    if (booking.tailor.userId === user.id) return 'tailor';
    if (user.role === UserRole.Admin) return 'admin';
    throw new NotFoundException('Booking not found');
  }

  /** The API shape of a booking: only the contact details each side needs. */
  private toView(booking: Booking, actor: BookingActor | 'admin') {
    const { customer, tailor, ...rest } = booking;
    return {
      ...rest,
      customer: { id: customer.id, name: customer.name, phone: customer.phone },
      tailor: {
        id: tailor.id,
        businessName: tailor.businessName,
        slug: tailor.slug,
        phone: tailor.phone,
        address: tailor.address,
        city: tailor.city,
        lat: tailor.lat,
        lng: tailor.lng,
        userId: tailor.userId,
      },
      viewerRole: actor,
      actions: actor === 'admin' ? [] : availableActions(booking.status, actor),
    };
  }

  // ---- Changing status ----

  async act(user: User, id: string, dto: BookingActionDto) {
    const booking = await this.bookings.findOne({ where: { id }, relations: { tailor: true } });
    if (!booking) throw new NotFoundException('Booking not found');
    const actor = this.actorFor(user, booking);
    if (actor === 'admin')
      throw new ForbiddenException('Admins can view bookings but not change them');

    const to = this.check(booking.status, dto.action, actor);
    const wasPaid = booking.status !== BookingStatus.PendingPayment;

    // Money first: refund before closing a paid booking, so a failed refund leaves it open.
    if ((to === BookingStatus.Cancelled || to === BookingStatus.Declined) && wasPaid) {
      await this.payments.refund(PaymentPurpose.Booking, booking.id);
    } else if (to === BookingStatus.Cancelled) {
      await this.payments.cancelPending(PaymentPurpose.Booking, booking.id);
    }

    const extra: Partial<Booking> = {};
    if (to === BookingStatus.Accepted) {
      const days =
        (await this.services.findOneBy({ id: booking.serviceId ?? '' }))?.durationDays ??
        booking.tailor.turnaroundDays;
      extra.dueDate = new Date(Date.now() + days * DAY_MS).toISOString().slice(0, 10);
    }
    if (to === BookingStatus.Completed) extra.completedAt = new Date();
    if (dto.reason) extra.closingReason = dto.reason;

    await this.transition(booking, dto.action, actor, dto.reason ?? null, extra);

    if (to === BookingStatus.Completed)
      await this.tailors.increment({ id: booking.tailorId }, 'completedOrders', 1);
    if (to === BookingStatus.Declined)
      await this.tailors.increment({ id: booking.tailorId }, 'cancelledOrders', 1);
    if (to === BookingStatus.Completed || to === BookingStatus.Declined)
      await this.ranking.recomputeAll();

    await this.afterChange(booking.id, to);
    return this.findOneFor(user, booking.id);
  }

  private check(current: BookingStatus, action: BookingAction, actor: BookingActor): BookingStatus {
    try {
      return nextStatus(current, action, actor);
    } catch (error) {
      if (error instanceof BookingTransitionError) throw new BadRequestException(error.message);
      throw error;
    }
  }

  /**
   * Status change + timeline entry in one transaction. The update only matches the status we
   * read, so two clicks at the same time cannot both succeed.
   */
  private async transition(
    booking: Booking,
    action: BookingAction,
    actor: BookingActor,
    note: string | null,
    extra: Partial<Booking> = {},
  ): Promise<void> {
    const to = this.check(booking.status, action, actor);
    await this.dataSource.transaction(async (manager) => {
      const result = await manager.update(
        Booking,
        { id: booking.id, status: booking.status },
        { ...extra, status: to },
      );
      if (!result.affected)
        throw new ConflictException('This booking was just updated; refresh and try again');
      await manager.insert(BookingEvent, { bookingId: booking.id, status: to, actor, note });
    });
  }

  /** Tells both people: live update to open pages, a notification and (for "ready") an email. */
  private async afterChange(bookingId: string, status: BookingStatus): Promise<void> {
    const booking = await this.bookings.findOne({
      where: { id: bookingId },
      relations: { tailor: true, customer: true },
    });
    if (!booking) return;
    this.realtime.emitToUsers([booking.customerId, booking.tailor.userId], 'booking.updated', {
      id: booking.id,
      status: booking.status,
    });

    const message = STATUS_MESSAGES[status];
    if (!message) return;
    const toCustomer = message.to === 'customer';
    await this.notifications.notify(toCustomer ? booking.customerId : booking.tailor.userId, {
      type: `booking.${status}`,
      title: message.title,
      body: `${booking.serviceName} - ${booking.code}`,
      link: toCustomer ? `/app/bookings/${booking.id}` : `/tailor/bookings/${booking.id}`,
    });
    if (status === BookingStatus.Ready) {
      await this.email.send({
        to: booking.customer.email,
        subject: `Your order ${booking.code} is ready`,
        text: `${booking.tailor.businessName} has finished "${booking.serviceName}". Collect it from ${booking.tailor.address}, ${booking.tailor.city}, then mark it received in Kapra.`,
      });
    }
  }

  // ---- Review ----

  /** One review per completed booking; it updates the tailor's ranking straight away. */
  async review(customer: User, id: string, dto: CreateReviewDto): Promise<Review> {
    const booking = await this.bookings.findOne({
      where: { id, customerId: customer.id },
      relations: { tailor: true },
    });
    if (!booking) throw new NotFoundException('Booking not found');
    if (booking.status !== BookingStatus.Completed)
      throw new BadRequestException('You can review a booking once it is completed');
    if (await this.reviews.existsBy({ bookingId: booking.id }))
      throw new ConflictException('You already reviewed this booking');

    const review = await this.reviews.save(
      this.reviews.create({
        tailorId: booking.tailorId,
        customerId: customer.id,
        bookingId: booking.id,
        rating: dto.rating,
        comment: dto.comment || null,
      }),
    );
    await this.ranking.recomputeAll();
    await this.notifications.notify(booking.tailor.userId, {
      type: 'review.new',
      title: `New ${dto.rating}-star review`,
      body: dto.comment?.slice(0, 120),
      link: '/tailor/reviews',
    });
    return review;
  }

  /** Used by the chat service: the booking, if this user takes part in it. */
  async findParticipantBooking(
    user: User,
    id: string,
  ): Promise<{ booking: Booking; actor: BookingActor | 'admin' }> {
    const booking = await this.bookings.findOne({ where: { id }, relations: { tailor: true } });
    if (!booking) throw new NotFoundException('Booking not found');
    return { booking, actor: this.actorFor(user, booking) };
  }
}

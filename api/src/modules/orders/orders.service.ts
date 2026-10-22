import { randomBytes } from 'node:crypto';
import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { paginate, type Paginated } from '../../common/dto/pagination.dto.js';
import { UserRole } from '../../common/enums/user-role.enum.js';
import { EMAIL_SENDER, type EmailSender } from '../../integrations/email/email.types.js';
import { Brand } from '../brands/entities/brand.entity.js';
import { ProductVariant } from '../catalogue/entities/product-variant.entity.js';
import { NotificationsService } from '../notifications/notifications.service.js';
import { PaymentPurpose } from '../payments/entities/payment.entity.js';
import { PAYMENT_PAID, PaymentsService, type PaymentEvent } from '../payments/payments.service.js';
import { RealtimeGateway } from '../realtime/realtime.gateway.js';
import type { User } from '../users/entities/user.entity.js';
import { UsersService } from '../users/users.service.js';
import type { CreateOrderDto, OrderActionDto, OrderQueryDto } from './dto/order.dto.js';
import { OrderItem } from './entities/order-item.entity.js';
import { Order } from './entities/order.entity.js';
import {
  availableOrderActions,
  nextOrderStatus,
  OrderStatus,
  OrderTransitionError,
  shippingFor,
  type OrderAction,
  type OrderActor,
} from './order-status.js';

const newCode = () => `KO-${randomBytes(3).toString('hex').toUpperCase()}`;
const formatRs = (amount: number) => `Rs ${amount.toLocaleString('en-PK')}`;

@Injectable()
export class OrdersService {
  constructor(
    @InjectRepository(Order) private readonly orders: Repository<Order>,
    @InjectRepository(Brand) private readonly brands: Repository<Brand>,
    @InjectRepository(ProductVariant) private readonly variants: Repository<ProductVariant>,
    @Inject(EMAIL_SENDER) private readonly email: EmailSender,
    private readonly payments: PaymentsService,
    private readonly notifications: NotificationsService,
    private readonly realtime: RealtimeGateway,
    private readonly users: UsersService,
  ) {}

  /** Checkout for one partner brand. Every price and stock level is read from the database. */
  async create(customer: User, dto: CreateOrderDto) {
    const brand = await this.brands.findOneBy({ id: dto.brandId, verified: true });
    if (!brand) throw new NotFoundException('Brand not found');
    if (!brand.ownerId)
      throw new BadRequestException(
        `${brand.name} is not selling on Kapra yet; buy on their website`,
      );

    const ids = dto.items.map((item) => item.variantId);
    if (new Set(ids).size !== ids.length)
      throw new BadRequestException('Each size may appear only once');
    const variants = await this.variants.find({
      where: { id: In(ids) },
      relations: { product: true },
    });

    const items = dto.items.map((line) => {
      const variant = variants.find((candidate) => candidate.id === line.variantId);
      if (!variant || variant.product.brandId !== brand.id || !variant.product.isActive) {
        throw new BadRequestException('One of the items is no longer available');
      }
      if (!variant.inStock || (variant.stockQty !== null && variant.stockQty < line.quantity)) {
        throw new BadRequestException(
          `"${variant.product.title}" in ${variant.size} is out of stock`,
        );
      }
      return Object.assign(new OrderItem(), {
        productId: variant.productId,
        variantId: variant.id,
        title: variant.product.title,
        size: variant.size,
        image: variant.product.images[0] ?? null,
        unitPrice: variant.product.price,
        quantity: line.quantity,
      });
    });

    const subtotal = items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
    const shippingFee = shippingFor(subtotal);
    const order = await this.orders.save(
      this.orders.create({
        code: newCode(),
        customerId: customer.id,
        brandId: brand.id,
        subtotal,
        shippingFee,
        total: subtotal + shippingFee,
        shipName: dto.shipping.name,
        shipPhone: dto.shipping.phone,
        shipAddress: dto.shipping.address,
        shipCity: dto.shipping.city,
        items,
      }),
    );

    const { checkoutUrl } = await this.startPayment(customer, order, brand.name);
    return { order: await this.findOneFor(customer, order.id), checkoutUrl };
  }

  async pay(customer: User, id: string) {
    const order = await this.orders.findOne({
      where: { id, customerId: customer.id },
      relations: { brand: true },
    });
    if (!order) throw new NotFoundException('Order not found');
    if (order.status !== OrderStatus.PendingPayment)
      throw new BadRequestException('This order is already paid or closed');
    return this.startPayment(customer, order, order.brand.name);
  }

  private startPayment(customer: User, order: Order, brandName: string) {
    return this.payments.start(customer, {
      purpose: PaymentPurpose.Order,
      referenceId: order.id,
      amount: order.total,
      description: `${brandName} order ${order.code}`,
      returnPath: `/app/orders/${order.id}`,
    });
  }

  @OnEvent(PAYMENT_PAID)
  async onPaymentPaid({ payment }: PaymentEvent): Promise<void> {
    if (payment.purpose !== PaymentPurpose.Order) return;
    const order = await this.orders.findOne({
      where: { id: payment.referenceId },
      relations: { items: true, brand: true },
    });
    if (!order || order.status !== OrderStatus.PendingPayment) return;
    await this.transition(order, 'pay', 'system', { paidAt: payment.paidAt });

    // Reduce known stock counts (feeds that only say "in stock" have no count).
    for (const item of order.items) {
      if (item.variantId) {
        await this.variants
          .createQueryBuilder()
          .update()
          .set({ stockQty: () => `GREATEST(stock_qty - ${Number(item.quantity)}, 0)` })
          .where('id = :id AND stock_qty IS NOT NULL', { id: item.variantId })
          .execute();
      }
    }

    if (order.brand.ownerId) {
      await this.notifications.notify(order.brand.ownerId, {
        type: 'order.paid',
        title: 'New order to ship',
        body: `${order.code} - ${formatRs(order.total)}`,
        link: `/brand/orders/${order.id}`,
      });
    }
    const customer = await this.users.findById(order.customerId);
    if (customer) {
      await this.email.send({
        to: customer.email,
        subject: `Receipt for order ${order.code}`,
        text: [
          `Thank you for your order from ${order.brand.name}.`,
          ...order.items.map(
            (item) =>
              `- ${item.title} (${item.size}) x${item.quantity}: ${formatRs(item.unitPrice * item.quantity)}`,
          ),
          `Shipping: ${formatRs(order.shippingFee)}`,
          `Total paid: ${formatRs(order.total)}`,
        ].join('\n'),
      });
    }
    this.realtime.emitToUsers([order.customerId], 'order.updated', {
      id: order.id,
      status: OrderStatus.Paid,
    });
  }

  // ---- Reading ----

  async list(
    user: User,
    query: OrderQueryDto,
  ): Promise<Paginated<Order & { actions: OrderAction[] }>> {
    const where: Record<string, unknown> = query.status ? { status: query.status } : {};
    if (user.role === UserRole.Customer) where.customerId = user.id;
    else if (user.role === UserRole.Brand) where.brand = { ownerId: user.id };
    else if (user.role !== UserRole.Admin) throw new ForbiddenException();

    const [rows, total] = await this.orders.findAndCount({
      where,
      relations: { items: true, brand: true },
      order: { createdAt: 'DESC' },
      skip: (query.page - 1) * query.limit,
      take: query.limit,
    });
    const data = rows.map((order) =>
      Object.assign(order, { actions: this.actionsFor(user, order) }),
    );
    return paginate(data, total, query);
  }

  async findOneFor(user: User, id: string) {
    const order = await this.orders.findOne({
      where: { id },
      relations: { items: true, brand: true, customer: true },
    });
    if (!order) throw new NotFoundException('Order not found');
    const actor = this.actorFor(user, order);
    const [payment] = await this.payments.findFor(PaymentPurpose.Order, order.id);
    const { customer, ...rest } = order;
    return {
      ...rest,
      customer: { id: customer.id, name: customer.name },
      viewerRole: actor,
      actions: actor === 'admin' ? [] : availableOrderActions(order.status, actor),
      payment: payment
        ? { status: payment.status, amount: payment.amount, paidAt: payment.paidAt }
        : null,
    };
  }

  private actorFor(user: User, order: Order): OrderActor | 'admin' {
    if (order.customerId === user.id) return 'customer';
    if (order.brand.ownerId === user.id) return 'brand';
    if (user.role === UserRole.Admin) return 'admin';
    throw new NotFoundException('Order not found');
  }

  private actionsFor(user: User, order: Order): OrderAction[] {
    const actor = this.actorFor(user, order);
    return actor === 'admin' ? [] : availableOrderActions(order.status, actor);
  }

  // ---- Changing status ----

  async act(user: User, id: string, dto: OrderActionDto) {
    const order = await this.orders.findOne({ where: { id }, relations: { brand: true } });
    if (!order) throw new NotFoundException('Order not found');
    const actor = this.actorFor(user, order);
    if (actor === 'admin')
      throw new ForbiddenException('Admins can view orders but not change them');

    const to = this.check(order.status, dto.action, actor);
    const extra: Partial<Order> = {};
    if (to === OrderStatus.Cancelled) {
      if (order.status === OrderStatus.Paid)
        await this.payments.refund(PaymentPurpose.Order, order.id);
      else await this.payments.cancelPending(PaymentPurpose.Order, order.id);
      extra.cancelReason = dto.reason ?? null;
    }
    if (to === OrderStatus.Shipped) {
      extra.trackingNumber = dto.trackingNumber!;
      extra.shippedAt = new Date();
    }
    if (to === OrderStatus.Delivered) extra.deliveredAt = new Date();

    await this.transition(order, dto.action, actor, extra);

    const notifyCustomer = actor === 'brand';
    const recipient = notifyCustomer ? order.customerId : order.brand.ownerId;
    if (recipient) {
      const titles: Record<string, string> = {
        [OrderStatus.Shipped]: `Your order ${order.code} is on its way`,
        [OrderStatus.Delivered]: `Order ${order.code} delivered`,
        [OrderStatus.Cancelled]: `Order ${order.code} was cancelled`,
      };
      await this.notifications.notify(recipient, {
        type: `order.${to}`,
        title: titles[to] ?? `Order ${order.code} updated`,
        body: to === OrderStatus.Shipped ? `Tracking number ${dto.trackingNumber}` : dto.reason,
        link: notifyCustomer ? `/app/orders/${order.id}` : `/brand/orders/${order.id}`,
      });
    }
    this.realtime.emitToUsers(
      [order.customerId, ...(order.brand.ownerId ? [order.brand.ownerId] : [])],
      'order.updated',
      {
        id: order.id,
        status: to,
      },
    );
    return this.findOneFor(user, order.id);
  }

  private check(current: OrderStatus, action: OrderAction, actor: OrderActor): OrderStatus {
    try {
      return nextOrderStatus(current, action, actor);
    } catch (error) {
      if (error instanceof OrderTransitionError) throw new BadRequestException(error.message);
      throw error;
    }
  }

  private async transition(
    order: Order,
    action: OrderAction,
    actor: OrderActor,
    extra: Partial<Order>,
  ): Promise<void> {
    const to = this.check(order.status, action, actor);
    // Only matches if nobody changed the order since we read it (no double processing).
    const result = await this.orders.update(
      { id: order.id, status: order.status },
      { ...extra, status: to },
    );
    if (!result.affected)
      throw new ConflictException('This order was just updated; refresh and try again');
  }
}

import { BadRequestException, ForbiddenException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, LessThan, Not, Repository } from 'typeorm';
import { NotificationsService } from '../notifications/notifications.service.js';
import { RealtimeGateway } from '../realtime/realtime.gateway.js';
import type { User } from '../users/entities/user.entity.js';
import { CHAT_OPEN } from './booking-status.js';
import { BookingsService } from './bookings.service.js';
import { Message } from './entities/message.entity.js';

const PAGE_SIZE = 50;

/** Chat between a customer and a tailor, one thread per booking. */
@Injectable()
export class MessagesService {
  constructor(
    @InjectRepository(Message) private readonly messages: Repository<Message>,
    private readonly bookings: BookingsService,
    private readonly realtime: RealtimeGateway,
    private readonly notifications: NotificationsService,
  ) {}

  /** Newest 50 messages (or the 50 before `before`), returned oldest first for display. */
  async list(user: User, bookingId: string, before?: Date): Promise<Message[]> {
    await this.bookings.findParticipantBooking(user, bookingId);
    const rows = await this.messages.find({
      where: { bookingId, ...(before ? { createdAt: LessThan(before) } : {}) },
      order: { createdAt: 'DESC' },
      take: PAGE_SIZE,
    });
    return rows.reverse();
  }

  async send(user: User, bookingId: string, body: string): Promise<Message> {
    const { booking, actor } = await this.bookings.findParticipantBooking(user, bookingId);
    if (actor === 'admin') throw new ForbiddenException('Admins cannot post in a booking chat');
    if (!CHAT_OPEN.includes(booking.status))
      throw new BadRequestException('Chat opens once the booking is paid');

    const message = await this.messages.save(
      this.messages.create({ bookingId, senderId: user.id, body }),
    );
    const recipientId = actor === 'customer' ? booking.tailor.userId : booking.customerId;
    this.realtime.emitToUsers([booking.customerId, booking.tailor.userId], 'message', message);

    await this.notifications.notify(recipientId, {
      type: 'message.new',
      title: `New message from ${actor === 'customer' ? user.name.split(' ')[0] : booking.tailor.businessName}`,
      body: body.slice(0, 120),
      link: actor === 'customer' ? `/tailor/bookings/${bookingId}` : `/app/bookings/${bookingId}`,
    });
    return message;
  }

  /** Marks the other person's messages as read (for the "seen" ticks). */
  async markRead(user: User, bookingId: string): Promise<void> {
    const { booking } = await this.bookings.findParticipantBooking(user, bookingId);
    const result = await this.messages.update(
      { bookingId, senderId: Not(user.id), readAt: IsNull() },
      { readAt: new Date() },
    );
    if (result.affected) {
      this.realtime.emitToUsers([booking.customerId, booking.tailor.userId], 'messages.read', {
        bookingId,
        readerId: user.id,
      });
    }
  }
}

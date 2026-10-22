import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';
import {
  paginate,
  type PaginationQueryDto,
  type Paginated,
} from '../../common/dto/pagination.dto.js';
import { RealtimeGateway } from '../realtime/realtime.gateway.js';
import { Notification } from './entities/notification.entity.js';

export interface NewNotification {
  type: string;
  title: string;
  body?: string;
  link?: string;
}

@Injectable()
export class NotificationsService {
  constructor(
    @InjectRepository(Notification) private readonly notifications: Repository<Notification>,
    private readonly realtime: RealtimeGateway,
  ) {}

  /** Saves the notification and pushes it to the user's open tabs at once. */
  async notify(userId: string, notification: NewNotification): Promise<void> {
    const saved = await this.notifications.save(
      this.notifications.create({
        userId,
        type: notification.type,
        title: notification.title.slice(0, 120),
        body: notification.body?.slice(0, 300) ?? null,
        link: notification.link ?? null,
      }),
    );
    this.realtime.emitToUsers([userId], 'notification', saved);
  }

  async list(
    userId: string,
    query: PaginationQueryDto,
  ): Promise<Paginated<Notification> & { unread: number }> {
    const [rows, total] = await this.notifications.findAndCount({
      where: { userId },
      order: { createdAt: 'DESC' },
      skip: (query.page - 1) * query.limit,
      take: query.limit,
    });
    const unread = await this.notifications.countBy({ userId, readAt: IsNull() });
    return { ...paginate(rows, total, query), unread };
  }

  async markRead(userId: string, id: string): Promise<void> {
    await this.notifications.update({ id, userId, readAt: IsNull() }, { readAt: new Date() });
  }

  async markAllRead(userId: string): Promise<void> {
    await this.notifications.update({ userId, readAt: IsNull() }, { readAt: new Date() });
  }
}

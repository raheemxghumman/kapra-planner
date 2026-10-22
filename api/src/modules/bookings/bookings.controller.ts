import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { Type } from 'class-transformer';
import { IsDate, IsOptional } from 'class-validator';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import { Roles } from '../../common/decorators/roles.decorator.js';
import { UserRole } from '../../common/enums/user-role.enum.js';
import type { User } from '../users/entities/user.entity.js';
import { BookingsService } from './bookings.service.js';
import {
  BookingActionDto,
  BookingQueryDto,
  CreateBookingDto,
  CreateReviewDto,
  SendMessageDto,
} from './dto/booking.dto.js';
import type { Message } from './entities/message.entity.js';
import { MessagesService } from './messages.service.js';

class MessagesQueryDto {
  /** Load messages older than this time (for scrolling up). */
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  before?: Date;
}

/**
 * Bookings for customers and tailors. Most routes are shared: the service works out whether the
 * signed-in user is this booking's customer or its tailor, and only allows their actions.
 */
@ApiTags('bookings')
@ApiBearerAuth()
@Controller('bookings')
export class BookingsController {
  constructor(
    private readonly bookingsService: BookingsService,
    private readonly messagesService: MessagesService,
  ) {}

  /** Creates the booking and returns { booking, checkoutUrl } for Stripe. */
  @Post()
  @Roles(UserRole.Customer)
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  create(@CurrentUser() user: User, @Body() dto: CreateBookingDto) {
    return this.bookingsService.create(user, dto);
  }

  /** Customers see their bookings, tailors the bookings made with them, admins all. */
  @Get()
  list(@CurrentUser() user: User, @Query() query: BookingQueryDto) {
    return this.bookingsService.list(user, query);
  }

  @Get(':id')
  findOne(@CurrentUser() user: User, @Param('id', ParseUUIDPipe) id: string) {
    return this.bookingsService.findOneFor(user, id);
  }

  @Post(':id/pay')
  @Roles(UserRole.Customer)
  pay(@CurrentUser() user: User, @Param('id', ParseUUIDPipe) id: string) {
    return this.bookingsService.pay(user, id);
  }

  /** accept, decline, start, ready (tailor); cancel, complete (customer). */
  @Post(':id/actions')
  @HttpCode(HttpStatus.OK)
  act(
    @CurrentUser() user: User,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: BookingActionDto,
  ) {
    return this.bookingsService.act(user, id, dto);
  }

  @Post(':id/review')
  @Roles(UserRole.Customer)
  review(
    @CurrentUser() user: User,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CreateReviewDto,
  ) {
    return this.bookingsService.review(user, id, dto);
  }

  @Get(':id/messages')
  messages(
    @CurrentUser() user: User,
    @Param('id', ParseUUIDPipe) id: string,
    @Query() query: MessagesQueryDto,
  ): Promise<Message[]> {
    return this.messagesService.list(user, id, query.before);
  }

  @Post(':id/messages')
  @Throttle({ default: { limit: 30, ttl: 60_000 } })
  send(
    @CurrentUser() user: User,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: SendMessageDto,
  ): Promise<Message> {
    return this.messagesService.send(user, id, dto.body);
  }

  @Post(':id/messages/read')
  @HttpCode(HttpStatus.NO_CONTENT)
  read(@CurrentUser() user: User, @Param('id', ParseUUIDPipe) id: string): Promise<void> {
    return this.messagesService.markRead(user, id);
  }
}

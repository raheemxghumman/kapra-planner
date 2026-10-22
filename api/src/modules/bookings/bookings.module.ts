import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CatalogueModule } from '../catalogue/catalogue.module.js';
import { PaymentsModule } from '../payments/payments.module.js';
import { ProfilesModule } from '../profiles/profiles.module.js';
import { StylistModule } from '../stylist/stylist.module.js';
import { TailorsModule } from '../tailors/tailors.module.js';
import { TryOn } from '../tryon/entities/try-on.entity.js';
import { UsersModule } from '../users/users.module.js';
import { BookingsController } from './bookings.controller.js';
import { BookingsService } from './bookings.service.js';
import { BookingEvent } from './entities/booking-event.entity.js';
import { Booking } from './entities/booking.entity.js';
import { Message } from './entities/message.entity.js';
import { MessagesService } from './messages.service.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([Booking, BookingEvent, Message, TryOn]),
    TailorsModule,
    PaymentsModule,
    ProfilesModule,
    StylistModule,
    CatalogueModule,
    UsersModule,
  ],
  controllers: [BookingsController],
  providers: [BookingsService, MessagesService],
})
export class BookingsModule {}

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PAYMENT_GATEWAY } from '../../integrations/payments/payment-gateway.types.js';
import { StripeGateway } from '../../integrations/payments/stripe.gateway.js';
import { Payment } from './entities/payment.entity.js';
import { StripeEvent } from './entities/stripe-event.entity.js';
import { PaymentsController } from './payments.controller.js';
import { PaymentsService } from './payments.service.js';

@Module({
  imports: [TypeOrmModule.forFeature([Payment, StripeEvent])],
  controllers: [PaymentsController],
  providers: [PaymentsService, { provide: PAYMENT_GATEWAY, useClass: StripeGateway }],
  exports: [PaymentsService],
})
export class PaymentsModule {}

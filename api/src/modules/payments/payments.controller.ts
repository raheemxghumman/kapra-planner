import {
  Body,
  Controller,
  Headers,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  type RawBodyRequest,
} from '@nestjs/common';
import { ApiBearerAuth, ApiExcludeEndpoint, ApiTags } from '@nestjs/swagger';
import { SkipThrottle } from '@nestjs/throttler';
import { IsString, Matches } from 'class-validator';
import type { Request } from 'express';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import { Public } from '../../common/decorators/public.decorator.js';
import type { User } from '../users/entities/user.entity.js';
import type { Payment } from './entities/payment.entity.js';
import { PaymentsService } from './payments.service.js';

class ConfirmPaymentDto {
  @IsString()
  @Matches(/^cs_(test|live)_[A-Za-z0-9]+$/, {
    message: 'sessionId is not a Stripe Checkout session id',
  })
  sessionId: string;
}

@ApiTags('payments')
@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  /** The return page sends the session id; the server asks Stripe whether it was paid. */
  @ApiBearerAuth()
  @Post('confirm')
  @HttpCode(HttpStatus.OK)
  confirm(@CurrentUser() user: User, @Body() dto: ConfirmPaymentDto): Promise<Payment> {
    return this.paymentsService.confirm(user.id, dto.sessionId);
  }

  /** Stripe webhook. Uses the raw request body, because the signature is computed over it. */
  @Public()
  @SkipThrottle()
  @ApiExcludeEndpoint()
  @Post('webhook')
  @HttpCode(HttpStatus.OK)
  async webhook(
    @Req() request: RawBodyRequest<Request>,
    @Headers('stripe-signature') signature: string | undefined,
  ): Promise<{ received: true }> {
    await this.paymentsService.handleWebhook(request.rawBody, signature);
    return { received: true };
  }
}

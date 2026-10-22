import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Module,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import { Roles } from '../../common/decorators/roles.decorator.js';
import { UserRole } from '../../common/enums/user-role.enum.js';
import { Brand } from '../brands/entities/brand.entity.js';
import { ProductVariant } from '../catalogue/entities/product-variant.entity.js';
import { PaymentsModule } from '../payments/payments.module.js';
import type { User } from '../users/entities/user.entity.js';
import { UsersModule } from '../users/users.module.js';
import { CreateOrderDto, OrderActionDto, OrderQueryDto } from './dto/order.dto.js';
import { OrderItem } from './entities/order-item.entity.js';
import { Order } from './entities/order.entity.js';
import { OrdersService } from './orders.service.js';

/** Customers see their orders, brands the orders for their products, admins everything. */
@ApiTags('orders')
@ApiBearerAuth()
@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  /** Returns { order, checkoutUrl } for Stripe. */
  @Post()
  @Roles(UserRole.Customer)
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  create(@CurrentUser() user: User, @Body() dto: CreateOrderDto) {
    return this.ordersService.create(user, dto);
  }

  @Get()
  list(@CurrentUser() user: User, @Query() query: OrderQueryDto) {
    return this.ordersService.list(user, query);
  }

  @Get(':id')
  findOne(@CurrentUser() user: User, @Param('id', ParseUUIDPipe) id: string) {
    return this.ordersService.findOneFor(user, id);
  }

  @Post(':id/pay')
  @Roles(UserRole.Customer)
  pay(@CurrentUser() user: User, @Param('id', ParseUUIDPipe) id: string) {
    return this.ordersService.pay(user, id);
  }

  /** ship (brand, with tracking number), deliver (brand or customer), cancel. */
  @Post(':id/actions')
  @HttpCode(HttpStatus.OK)
  act(
    @CurrentUser() user: User,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: OrderActionDto,
  ) {
    return this.ordersService.act(user, id, dto);
  }
}

@Module({
  imports: [
    TypeOrmModule.forFeature([Order, OrderItem, Brand, ProductVariant]),
    PaymentsModule,
    UsersModule,
  ],
  controllers: [OrdersController],
  providers: [OrdersService],
  exports: [TypeOrmModule],
})
export class OrdersModule {}

import {
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Put,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import { Roles } from '../../common/decorators/roles.decorator.js';
import { UserRole } from '../../common/enums/user-role.enum.js';
import type { Product } from '../catalogue/entities/product.entity.js';
import type { User } from '../users/entities/user.entity.js';
import { WishlistService } from './wishlist.service.js';

@ApiTags('wishlist')
@ApiBearerAuth()
@Roles(UserRole.Customer)
@Controller('me/wishlist')
export class WishlistController {
  constructor(private readonly wishlistService: WishlistService) {}

  @Get()
  list(@CurrentUser() user: User): Promise<Product[]> {
    return this.wishlistService.list(user.id);
  }

  @Get('ids')
  ids(@CurrentUser() user: User): Promise<string[]> {
    return this.wishlistService.ids(user.id);
  }

  /** PUT because saving is idempotent: doing it twice has the same effect as once. */
  @Put(':productId')
  @HttpCode(HttpStatus.NO_CONTENT)
  add(
    @CurrentUser() user: User,
    @Param('productId', ParseUUIDPipe) productId: string,
  ): Promise<void> {
    return this.wishlistService.add(user.id, productId);
  }

  @Delete(':productId')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(
    @CurrentUser() user: User,
    @Param('productId', ParseUUIDPipe) productId: string,
  ): Promise<void> {
    return this.wishlistService.remove(user.id, productId);
  }
}

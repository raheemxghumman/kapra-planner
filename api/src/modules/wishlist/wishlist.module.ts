import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CatalogueModule } from '../catalogue/catalogue.module.js';
import { SavedProduct } from './entities/saved-product.entity.js';
import { WishlistController } from './wishlist.controller.js';
import { WishlistService } from './wishlist.service.js';

@Module({
  imports: [TypeOrmModule.forFeature([SavedProduct]), CatalogueModule],
  controllers: [WishlistController],
  providers: [WishlistService],
})
export class WishlistModule {}

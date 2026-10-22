import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ShopifyFeedClient } from '../../integrations/brand-feeds/shopify-feed.client.js';
import { BrandsModule } from '../brands/brands.module.js';
import { AdminCatalogueController, CatalogueJobsController } from './catalogue-jobs.controller.js';
import { ProductVariant } from './entities/product-variant.entity.js';
import { Product } from './entities/product.entity.js';
import { ProductsController } from './products.controller.js';
import { ProductsService } from './products.service.js';
import { AiTaggerService } from './sync/ai-tagger.service.js';
import { CatalogueSyncService } from './sync/catalogue-sync.service.js';

@Module({
  imports: [TypeOrmModule.forFeature([Product, ProductVariant]), BrandsModule],
  controllers: [ProductsController, CatalogueJobsController, AdminCatalogueController],
  providers: [ProductsService, CatalogueSyncService, AiTaggerService, ShopifyFeedClient],
  exports: [ProductsService, CatalogueSyncService, TypeOrmModule],
})
export class CatalogueModule {}

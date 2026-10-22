import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdminBrandsController, BrandsController } from './brands.controller.js';
import { BrandsService } from './brands.service.js';
import { BrandStore } from './entities/brand-store.entity.js';
import { Brand } from './entities/brand.entity.js';

@Module({
  imports: [TypeOrmModule.forFeature([Brand, BrandStore])],
  controllers: [BrandsController, AdminBrandsController],
  providers: [BrandsService],
  exports: [BrandsService, TypeOrmModule],
})
export class BrandsModule {}

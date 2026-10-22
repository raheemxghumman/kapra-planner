import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import type { Product } from '../catalogue/entities/product.entity.js';
import { ProductsService } from '../catalogue/products.service.js';
import { SavedProduct } from './entities/saved-product.entity.js';

@Injectable()
export class WishlistService {
  constructor(
    @InjectRepository(SavedProduct) private readonly saved: Repository<SavedProduct>,
    private readonly productsService: ProductsService,
  ) {}

  /** Saved products, newest first, as catalogue cards. */
  async list(userId: string): Promise<Product[]> {
    const rows = await this.saved.find({
      where: { userId },
      relations: { product: { brand: true } },
      order: { createdAt: 'DESC' },
    });
    return rows.map((row) => row.product);
  }

  /** Only the ids, so the frontend can show filled hearts on any page cheaply. */
  async ids(userId: string): Promise<string[]> {
    const rows = await this.saved.find({ where: { userId }, select: { productId: true } });
    return rows.map((row) => row.productId);
  }

  /** Idempotent: saving an already saved product does nothing (ON CONFLICT DO NOTHING). */
  async add(userId: string, productId: string): Promise<void> {
    await this.productsService.findById(productId); // 404 if it does not exist
    await this.saved
      .createQueryBuilder()
      .insert()
      .values({ userId, productId })
      .orIgnore()
      .execute();
  }

  async remove(userId: string, productId: string): Promise<void> {
    await this.saved.delete({ userId, productId });
  }
}

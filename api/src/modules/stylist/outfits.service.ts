import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SLOT_FOR_CATEGORY } from '../catalogue/catalogue.enums.js';
import type { Product } from '../catalogue/entities/product.entity.js';
import { ProductsService } from '../catalogue/products.service.js';
import { pickVariant } from './agent/stylist.types.js';
import type { SwapItemDto } from './dto/stylist.dto.js';
import { OutfitItem } from './entities/outfit-item.entity.js';
import { Outfit } from './entities/outfit.entity.js';

/** The customer's saved looks. Every method checks ownership (outfit.userId = current user). */
@Injectable()
export class OutfitsService {
  constructor(
    @InjectRepository(Outfit) private readonly outfits: Repository<Outfit>,
    @InjectRepository(OutfitItem) private readonly items: Repository<OutfitItem>,
    private readonly productsService: ProductsService,
  ) {}

  list(userId: string): Promise<Outfit[]> {
    return this.outfits.find({
      where: { userId },
      relations: { items: { product: { brand: true }, variant: true } },
      order: { createdAt: 'DESC', items: { position: 'ASC' } },
    });
  }

  async findOwn(userId: string, id: string): Promise<Outfit> {
    const outfit = await this.outfits.findOne({
      where: { id, userId },
      relations: { items: { product: { brand: true }, variant: true } },
      order: { items: { position: 'ASC' } },
    });
    if (!outfit) throw new NotFoundException('Outfit not found');
    return outfit;
  }

  async rename(userId: string, id: string, name: string): Promise<Outfit> {
    const outfit = await this.findOwn(userId, id);
    outfit.name = name;
    await this.outfits.update(outfit.id, { name });
    return outfit;
  }

  async remove(userId: string, id: string): Promise<void> {
    const outfit = await this.findOwn(userId, id);
    await this.outfits.delete(outfit.id);
  }

  /** Pieces that could replace this one: same kind of piece, similar colour and price. */
  async alternatives(userId: string, outfitId: string, itemId: string): Promise<Product[]> {
    const item = this.findItem(await this.findOwn(userId, outfitId), itemId);
    const similar = await this.productsService.findSimilar(item.productId, 12);
    return similar.filter((product) => SLOT_FOR_CATEGORY[product.category] === item.slot);
  }

  /** Replaces one piece with another product that fills the same slot. */
  async swapItem(
    userId: string,
    outfitId: string,
    itemId: string,
    dto: SwapItemDto,
  ): Promise<Outfit> {
    const outfit = await this.findOwn(userId, outfitId);
    const item = this.findItem(outfit, itemId);
    const product = await this.productsService.findStockedById(dto.productId);
    if (SLOT_FOR_CATEGORY[product.category] !== item.slot) {
      throw new BadRequestException(
        `Choose a piece that can be worn as the ${item.slot.replace('_', ' ')}`,
      );
    }
    if (dto.variantId && !product.stock.some((variant) => variant.variantId === dto.variantId)) {
      throw new BadRequestException('That size is out of stock');
    }
    await this.items.update(item.id, {
      productId: product.id,
      variantId: dto.variantId ?? pickVariant(product, item.slot, {}),
      reason: null,
    });
    return this.findOwn(userId, outfitId);
  }

  async removeItem(userId: string, outfitId: string, itemId: string): Promise<Outfit> {
    const outfit = await this.findOwn(userId, outfitId);
    const item = this.findItem(outfit, itemId);
    if (outfit.items.length <= 1) {
      throw new BadRequestException(
        'An outfit needs at least one piece; delete the outfit instead',
      );
    }
    await this.items.delete(item.id);
    return this.findOwn(userId, outfitId);
  }

  private findItem(outfit: Outfit, itemId: string): OutfitItem {
    const item = outfit.items.find((candidate) => candidate.id === itemId);
    if (!item) throw new NotFoundException('Piece not found in this outfit');
    return item;
  }
}

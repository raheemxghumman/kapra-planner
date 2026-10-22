import { ConflictException, Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, IsNull, Not, Repository } from 'typeorm';
import {
  ShopifyFeedClient,
  type FeedProduct,
} from '../../../integrations/brand-feeds/shopify-feed.client.js';
import { Brand, type SyncReport } from '../../brands/entities/brand.entity.js';
import { ProductCategory } from '../catalogue.enums.js';
import { ProductVariant } from '../entities/product-variant.entity.js';
import { Product } from '../entities/product.entity.js';
import { AiTaggerService } from './ai-tagger.service.js';
import { cleanTitle } from './clean-title.js';
import { shouldImport, tagByRules } from './rule-tagger.js';

/** Enough variety for the stylist while staying well inside the free 500 MB database. */
const MAX_PRODUCTS_PER_BRAND = 500;
/** How many products the AI tagger refines per sync run (free API limits). */
const AI_TAGS_PER_RUN = 300;
const CHUNK = 100;
const MIN_PRICE = 100;
const MAX_PRICE = 2_000_000;

const stripHtml = (html: string | null) =>
  html
    ?.replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 1_000) || null;

const sizeOf = (feed: FeedProduct, variant: FeedProduct['variants'][number]): string => {
  const sizeIndex = feed.options.findIndex((option) => /size/i.test(option.name));
  // Variants that differ only by colour or design are not sizes: the piece is one size.
  const onlyColours =
    sizeIndex < 0 && feed.options.some((option) => /colou?r|shade|design|print/i.test(option.name));
  if (onlyColours) return 'Free size';
  const value =
    sizeIndex >= 0 ? [variant.option1, variant.option2, variant.option3][sizeIndex] : variant.title;
  return !value || value === 'Default Title' ? 'Free size' : value.slice(0, 40);
};

/**
 * Imports products from brands' public feeds:
 * fetch -> filter (adult clothing with images) -> tag by rules -> upsert in chunks ->
 * hide products that disappeared -> refine some tags with AI -> save a report per brand.
 */
@Injectable()
export class CatalogueSyncService {
  private readonly logger = new Logger(CatalogueSyncService.name);
  private running = false;

  constructor(
    private readonly feedClient: ShopifyFeedClient,
    private readonly aiTagger: AiTaggerService,
    @InjectRepository(Brand) private readonly brands: Repository<Brand>,
    @InjectRepository(Product) private readonly products: Repository<Product>,
    @InjectRepository(ProductVariant) private readonly variants: Repository<ProductVariant>,
  ) {}

  get isRunning(): boolean {
    return this.running;
  }

  /** Syncs every verified brand that has a feed. Only one sync may run at a time. */
  async syncAll(): Promise<SyncReport[]> {
    if (this.running) {
      throw new ConflictException('A catalogue sync is already running');
    }
    this.running = true;
    try {
      const brands = await this.brands.find({ where: { verified: true, feedUrl: Not(IsNull()) } });
      const reports: SyncReport[] = [];
      for (const brand of brands) {
        reports.push(await this.syncBrand(brand));
      }
      const tagged = await this.aiTagger.tagPending(AI_TAGS_PER_RUN);
      this.logger.log(`Sync finished for ${brands.length} brands; AI refined ${tagged} products`);
      return reports;
    } finally {
      this.running = false;
    }
  }

  async syncBrand(brand: Brand): Promise<SyncReport> {
    const report: SyncReport = {
      startedAt: new Date().toISOString(),
      finishedAt: '',
      fetched: 0,
      created: 0,
      updated: 0,
      hidden: 0,
      skipped: 0,
    };

    try {
      const feed = await this.feedClient.fetchProducts(brand.feedUrl!, MAX_PRODUCTS_PER_BRAND);
      report.fetched = feed.length;

      const existing = await this.products.find({
        where: { brandId: brand.id, externalId: Not(IsNull()) },
      });
      const existingByExternalId = new Map(
        existing.map((product) => [product.externalId!, product]),
      );

      // A Map de-duplicates products that appear on two feed pages; a bulk upsert cannot
      // touch the same row twice.
      const rowsById = new Map<string, { product: Partial<Product>; feed: FeedProduct }>();
      for (const item of feed) {
        const row = this.toProductRow(brand, item, existingByExternalId.get(String(item.id)));
        if (row) rowsById.set(row.externalId!, { product: row, feed: item });
        else report.skipped++;
      }
      const rows = [...rowsById.values()];

      for (let i = 0; i < rows.length; i += CHUNK) {
        await this.saveChunk(rows.slice(i, i + CHUNK));
      }
      report.created = rows.filter(
        (row) => !existingByExternalId.has(row.product.externalId!),
      ).length;
      report.updated = rows.length - report.created;

      // Products no longer in the feed are hidden, not deleted (saved outfits may use them).
      const seen = rows.map((row) => row.product.externalId!);
      const hidden = await this.products.update(
        {
          brandId: brand.id,
          isActive: true,
          externalId: seen.length ? Not(In(seen)) : Not(IsNull()),
        },
        { isActive: false },
      );
      report.hidden = hidden.affected ?? 0;
    } catch (error) {
      report.error = (error as Error).message;
      this.logger.error(`Sync failed for ${brand.name}: ${report.error}`);
    }

    report.finishedAt = new Date().toISOString();
    await this.brands.update(brand.id, { lastSyncedAt: new Date(), lastSyncReport: report });
    this.logger.log(`${brand.name}: ${JSON.stringify(report)}`);
    return report;
  }

  /** Builds the product row, or returns null if the item should not be imported. */
  private toProductRow(
    brand: Brand,
    item: FeedProduct,
    existing?: Product,
  ): Partial<Product> | null {
    if (!shouldImport(item)) return null;

    const rules = tagByRules(item, { gender: brand.defaultGender, style: brand.defaultStyle });
    if (rules.category === ProductCategory.Other) return null;

    const prices = item.variants.map((variant) => Number(variant.price)).filter((p) => p > 0);
    const price = prices.length ? Math.round(Math.min(...prices) / brand.priceDivisor) : 0;
    if (price < MIN_PRICE || price > MAX_PRICE) return null;
    const compareAt = Number(item.variants[0]?.compare_at_price) / brand.priceDivisor;

    // Tags already refined by the AI are kept; only facts from the feed are refreshed.
    const tags = existing?.aiTagged
      ? {
          category: existing.category,
          gender: existing.gender,
          style: existing.style,
          colours: existing.colours,
          occasions: existing.occasions,
          fabric: existing.fabric,
        }
      : rules;

    return {
      brandId: brand.id,
      externalId: String(item.id),
      title: cleanTitle(item.title),
      description: stripHtml(item.body_html),
      brandCategory: item.product_type?.slice(0, 80) || null,
      ...tags,
      price,
      compareAtPrice: compareAt > price ? Math.round(compareAt) : null,
      images: item.images.slice(0, 6).map((image) => image.src.split('?')[0]),
      productUrl: brand.website
        ? `${brand.website.replace(/\/$/, '')}/products/${item.handle}`
        : null,
      isActive: true,
      aiTagged: existing?.aiTagged ?? false,
    };
  }

  /** Upserts products and their sizes with a few queries per chunk instead of one per row. */
  private async saveChunk(rows: { product: Partial<Product>; feed: FeedProduct }[]): Promise<void> {
    const result = await this.products.upsert(
      rows.map((row) => row.product),
      { conflictPaths: ['brandId', 'externalId'] },
    );
    const variantRows = rows.flatMap((row, index) => {
      const productId = result.identifiers[index].id as string;
      return row.feed.variants.map((variant) => ({
        productId,
        externalId: String(variant.id),
        size: sizeOf(row.feed, variant),
        sku: variant.sku?.slice(0, 80) || null,
        inStock: variant.available,
        stockQty: null,
      }));
    });
    if (variantRows.length) {
      await this.variants.upsert(variantRows, { conflictPaths: ['productId', 'externalId'] });
    }
  }
}

import { Injectable, Logger } from '@nestjs/common';

/** The parts of a public Shopify product we use. */
export interface FeedProduct {
  id: number;
  title: string;
  handle: string;
  body_html: string | null;
  product_type: string;
  tags: string[] | string;
  options: { name: string; values: string[] }[];
  variants: {
    id: number;
    title: string;
    option1: string | null;
    option2: string | null;
    option3: string | null;
    sku: string | null;
    available: boolean;
    price: string;
    compare_at_price: string | null;
  }[];
  images: { src: string }[];
}

const PAGE_SIZE = 250;
const PAUSE_BETWEEN_PAGES_MS = 2_500;
const RETRY_DELAYS_MS = [5_000, 15_000, 45_000];

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Reads a brand's public product list (/products.json, offered by Shopify stores).
 * Shopify limits requests per IP, so we fetch one page at a time with a pause between pages
 * and back off (5 s, 15 s, 45 s) when it answers 429 Too Many Requests.
 */
@Injectable()
export class ShopifyFeedClient {
  private readonly logger = new Logger(ShopifyFeedClient.name);

  async fetchProducts(feedUrl: string, maxProducts: number): Promise<FeedProduct[]> {
    const products: FeedProduct[] = [];
    for (let page = 1; products.length < maxProducts; page++) {
      const batch = await this.fetchPage(feedUrl, page);
      products.push(...batch);
      if (batch.length < PAGE_SIZE) break;
      await sleep(PAUSE_BETWEEN_PAGES_MS);
    }
    return products.slice(0, maxProducts);
  }

  private async fetchPage(feedUrl: string, page: number): Promise<FeedProduct[]> {
    const url = new URL(feedUrl);
    url.searchParams.set('limit', String(PAGE_SIZE));
    url.searchParams.set('page', String(page));

    for (let attempt = 0; ; attempt++) {
      const response = await fetch(url, {
        headers: { 'User-Agent': 'KapraPlanner/1.0 (catalogue sync)', Accept: 'application/json' },
        signal: AbortSignal.timeout(30_000),
      });
      if (response.ok) {
        const body = (await response.json()) as { products?: FeedProduct[] };
        return body.products ?? [];
      }
      const canRetry = (response.status === 429 || response.status >= 500) && attempt < RETRY_DELAYS_MS.length;
      if (!canRetry) {
        throw new Error(`Feed ${url.host} answered ${response.status} on page ${page}`);
      }
      this.logger.warn(`${url.host} answered ${response.status}; retrying page ${page} shortly`);
      await sleep(RETRY_DELAYS_MS[attempt]);
    }
  }
}

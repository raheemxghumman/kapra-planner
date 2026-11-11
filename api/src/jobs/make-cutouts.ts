/**
 * Live try-on cut-out job. For Western products that have no cut-out yet, it runs the pre-trained
 * clothes-segmentation model segformer_b2_clothes (ONNX build, CPU, free) over the product
 * photos, keeps the best transparent cut-out of the garment, uploads it to Cloudinary and saves
 * where the garment's shoulders (or waistband) are, so the website can pin it to the camera.
 *
 * Like the review job it runs outside the web server (GitHub Actions, or
 * `npm run job:cutouts -w api -- 200` for 200 products), so the model never uses its memory.
 */
import { ConfigService } from '@nestjs/config';
import { pipeline, RawImage, type ImageSegmentationOutput } from '@huggingface/transformers';
import dataSource from '../database/data-source.js';
import { CloudinaryStorage } from '../integrations/storage/cloudinary.storage.js';
import type { ProductCategory } from '../modules/catalogue/catalogue.enums.js';
import {
  makeCutout,
  type CutoutResult,
  type Segmenter,
} from '../modules/catalogue/cutouts/cutout-maker.js';
import { LIVE_TRY_ON } from '../modules/catalogue/cutouts/garment-geometry.js';
import {
  CutoutSource,
  CutoutStatus,
  GarmentCutout,
} from '../modules/catalogue/entities/garment-cutout.entity.js';

const MODEL = 'Xenova/segformer_b2_clothes';
const MAX_PRODUCTS = Number(process.argv[2] ?? 300);
const PHOTOS_PER_PRODUCT = 5;
/** Cut-outs below this score look broken on a body, so the product keeps photo try-on only. */
const MIN_QUALITY = 0.8;

/**
 * Photos to try, in the shop's own order (front views come before back views), plus the last
 * photo, where many shops put the garment on its own (flat-lay).
 */
export function photoOrder(images: string[]): string[] {
  return [...new Set([...images.slice(0, PHOTOS_PER_PRODUCT), ...images.slice(-1)])];
}

/** Shopify's image CDN resizes on request; 2048 px is enough for a sharp cut-out. */
function sizedUrl(url: string): string {
  if (!/cdn\.shopify\.com|\/cdn\/shop\//.test(url)) return url;
  const sized = new URL(url);
  sized.searchParams.set('width', '2048');
  return sized.toString();
}

async function download(url: string): Promise<Buffer> {
  const response = await fetch(sizedUrl(url), { signal: AbortSignal.timeout(30_000) });
  if (!response.ok) throw new Error(`photo answered ${response.status}`);
  return Buffer.from(await response.arrayBuffer());
}

async function main(): Promise<void> {
  await dataSource.initialize();
  try {
    const categories = Object.keys(LIVE_TRY_ON);
    // Round-robin over brands (newest first within each), so every brand gets cut-outs early.
    const products: { id: string; category: ProductCategory; images: string[] }[] =
      await dataSource.query(
        `SELECT id, category, images FROM (
           SELECT p.id, p.category, p.images,
                  row_number() OVER (PARTITION BY p.brand_id ORDER BY p.created_at DESC) AS turn
           FROM products p JOIN brands b ON b.id = p.brand_id
           WHERE p.is_active AND NOT p.hidden_by_brand AND b.verified
             AND p.style = 'western' AND p.category = ANY($1::product_category[]) AND cardinality(p.images) > 0
             AND EXISTS (SELECT 1 FROM product_variants v WHERE v.product_id = p.id AND v.in_stock)
             AND NOT EXISTS (SELECT 1 FROM garment_cutouts g WHERE g.product_id = p.id)
         ) candidates
         ORDER BY turn, id LIMIT $2`,
        [categories, MAX_PRODUCTS],
      );
    console.log(`${products.length} products to cut out`);
    if (products.length === 0) return;

    const segmenter = await pipeline('image-segmentation', MODEL);
    const segment: Segmenter = async (png) => {
      const output = (await segmenter(
        await RawImage.fromBlob(new Blob([new Uint8Array(png)])),
      )) as ImageSegmentationOutput;
      return output.map(({ label, mask }) => ({
        label: label ?? '',
        mask: Uint8Array.from(mask.data),
      }));
    };
    const storage = new CloudinaryStorage(new ConfigService(process.env) as never);
    const cutouts = dataSource.getRepository(GarmentCutout);
    const tally = { flat_lay: 0, on_model: 0, rejected: 0 };

    for (const [index, product] of products.entries()) {
      const rule = LIVE_TRY_ON[product.category]!;
      let best: (CutoutResult & { photo: string }) | null = null;
      let problem = 'no usable photo';

      for (const photo of photoOrder(product.images)) {
        try {
          const result = await makeCutout(await download(photo), rule, segment);
          if (result.quality < MIN_QUALITY) {
            problem = result.problems[0] ?? 'cut-out quality too low';
            continue;
          }
          // The first clean flat-lay wins (the cleanest kind, and the first is usually the
          // front); otherwise the best photo of a model.
          if (result.kind === 'flat_lay') {
            best = { ...result, photo };
            break;
          }
          if (!best || result.quality > best.quality) best = { ...result, photo };
        } catch (error) {
          problem = (error as Error).message.slice(0, 200);
        }
      }

      if (best?.image && best.fit) {
        const stored = await storage.upload(best.image, { folder: 'cutouts' });
        await cutouts.save(
          cutouts.create({
            productId: product.id,
            status: CutoutStatus.Ready,
            source: best.kind === 'flat_lay' ? CutoutSource.FlatLay : CutoutSource.OnModel,
            sourceImage: best.photo,
            cutoutUrl: stored.url,
            cutoutPublicId: stored.publicId,
            fit: best.fit,
            quality: best.quality,
          }),
        );
        tally[best.kind === 'flat_lay' ? 'flat_lay' : 'on_model']++;
      } else {
        await cutouts.save(
          cutouts.create({ productId: product.id, status: CutoutStatus.Rejected, problem }),
        );
        tally.rejected++;
      }
      if ((index + 1) % 10 === 0) console.log(`${index + 1}/${products.length}`, tally);
    }
    console.log('Done', tally);
  } finally {
    await dataSource.destroy();
  }
}

await main();

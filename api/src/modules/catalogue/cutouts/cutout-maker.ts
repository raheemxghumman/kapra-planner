import sharp from 'sharp';
import {
  classifyPhoto,
  keepMainRegions,
  measureGarment,
  scaleFit,
  type GarmentAnchor,
  type GarmentFit,
  type PhotoKind,
} from './garment-geometry.js';

/** One label of the clothes-segmentation model with its mask (255 = this label). */
export interface LabelMask {
  label: string;
  mask: Uint8Array;
}

/**
 * Runs a clothes-segmentation model on a PNG and returns one mask per label, each the size of
 * the PNG. The job binds it to segformer_b2_clothes through Transformers.js; tests can pass a fake.
 */
export type Segmenter = (png: Buffer) => Promise<LabelMask[]>;

export interface CutoutResult {
  kind: PhotoKind;
  quality: number;
  problems: string[];
  /** Transparent WebP of the garment alone, cropped to it (only when quality > 0). */
  image?: Buffer;
  fit?: GarmentFit;
}

/** Photos are cut out at up to this size; the model itself looks at a smaller copy. */
const OUTPUT_SIZE = 1024;
const MODEL_SIZE = 512;

/**
 * Turns one product photo into a transparent cut-out of the garment.
 * 1. The model labels every pixel (background, face, arms, upper clothes, pants...).
 * 2. The labels for this kind of product form the garment mask; specks are removed.
 * 3. The mask is measured (shoulder line, body width) and scored.
 * 4. The mask becomes the alpha channel of the full-size photo, cropped to the garment.
 */
export async function makeCutout(
  photo: Buffer,
  rule: { labels: string[]; anchor: GarmentAnchor },
  segment: Segmenter,
): Promise<CutoutResult> {
  // Full-size RGB copy (EXIF rotation applied, transparency flattened onto white).
  const full = await sharp(photo)
    .rotate()
    .flatten({ background: '#ffffff' })
    .resize(OUTPUT_SIZE, OUTPUT_SIZE, { fit: 'inside', withoutEnlargement: true })
    .removeAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const { width: fullWidth, height: fullHeight } = full.info;

  const small = await sharp(full.data, { raw: full.info })
    .resize(MODEL_SIZE, MODEL_SIZE, { fit: 'inside' })
    .png()
    .toBuffer({ resolveWithObject: true });
  const { width, height } = small.info;
  const labels = await segment(small.data);

  // Share of the image covered by each label decides what kind of photo this is.
  const total = width * height;
  const areas: Record<string, number> = {};
  for (const { label, mask } of labels) {
    areas[label] = mask.reduce((sum, value) => sum + (value > 127 ? 1 : 0), 0) / total;
  }
  const kind = classifyPhoto(areas, rule.labels);
  if (kind === 'unusable')
    return { kind, quality: 0, problems: ['no front view of the whole garment'] };

  const union = new Uint8Array(total);
  for (const { label, mask } of labels) {
    if (!rule.labels.includes(label)) continue;
    for (let i = 0; i < total; i++) if (mask[i] > 127) union[i] = 255;
  }
  const garment = keepMainRegions({ data: union, width, height });
  const measured = measureGarment(garment, rule.anchor);
  if (!measured) return { kind, quality: 0, problems: ['garment too small'] };
  if (measured.quality === 0) return { kind, quality: 0, problems: measured.problems };

  // Scale the small mask up to the photo and soften its edge by a pixel, so the garment does
  // not look cut out with scissors.
  const alpha = await sharp(garment.data, { raw: { width, height, channels: 1 } })
    .resize(fullWidth, fullHeight, { kernel: 'cubic' })
    .blur(0.8)
    .extractChannel(0) // keep it one channel; sharp would otherwise widen it to RGB
    .raw()
    .toBuffer();

  const factor = fullWidth / width;
  const left = Math.floor(measured.box.left * factor);
  const top = Math.floor(measured.box.top * factor);
  const right = Math.min(fullWidth, Math.ceil((measured.box.right + 1) * factor));
  const bottom = Math.min(fullHeight, Math.ceil((measured.box.bottom + 1) * factor));

  // Two steps: sharp runs extract before joinChannel within one pipeline, whatever the call order.
  const withAlpha = await sharp(full.data, { raw: full.info })
    .joinChannel(alpha, { raw: { width: fullWidth, height: fullHeight, channels: 1 } })
    .raw()
    .toBuffer();
  const image = await sharp(withAlpha, {
    raw: { width: fullWidth, height: fullHeight, channels: 4 },
  })
    .extract({ left, top, width: right - left, height: bottom - top })
    .webp({ quality: 82, alphaQuality: 90 })
    .toBuffer();

  // A photo of a model leaves small gaps where arms crossed the garment, so a flat-lay of the
  // same quality is preferred.
  const quality = kind === 'on_model' ? Math.round(measured.quality * 95) / 100 : measured.quality;
  // Width and height come from the crop itself; scaling can be a pixel off after rounding.
  const fit = { ...scaleFit(measured.fit, factor), width: right - left, height: bottom - top };
  return { kind, quality, problems: [], image, fit };
}

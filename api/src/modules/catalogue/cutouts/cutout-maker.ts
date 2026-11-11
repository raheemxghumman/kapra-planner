import sharp from 'sharp';
import {
  classifyPhoto,
  erode,
  keepMainRegions,
  measureGarment,
  scaleFit,
  type GarmentAnchor,
  type GarmentFit,
  type Mask,
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

/** Photos are decoded at up to SOURCE_SIZE; cut-outs are saved at up to OUTPUT_SIZE. */
const SOURCE_SIZE = 2048;
const OUTPUT_SIZE = 1024;
/** The segmentation model looks at images of about this size. */
const MODEL_SIZE = 512;

interface RawImage {
  data: Buffer;
  info: { width: number; height: number; channels: 1 | 2 | 3 | 4 };
}

/** Runs the model on an RGB image (shrunk to MODEL_SIZE) and returns the label masks and their sizes. */
async function labelPixels(image: RawImage, segment: Segmenter) {
  const small = await sharp(image.data, { raw: image.info })
    .resize(MODEL_SIZE, MODEL_SIZE, { fit: 'inside' })
    .png()
    .toBuffer({ resolveWithObject: true });
  const { width, height } = small.info;
  const labels = await segment(small.data);
  const total = width * height;
  const areas: Record<string, number> = {};
  for (const { label, mask } of labels) {
    areas[label] = mask.reduce((sum, value) => sum + (value > 127 ? 1 : 0), 0) / total;
  }
  return { labels, areas, width, height };
}

/** The garment mask: every pixel with one of the garment's labels, specks removed. */
function garmentMask(
  { labels, width, height }: Awaited<ReturnType<typeof labelPixels>>,
  garmentLabels: string[],
): Mask {
  const union = new Uint8Array(width * height);
  for (const { label, mask } of labels) {
    if (!garmentLabels.includes(label)) continue;
    for (let i = 0; i < union.length; i++) if (mask[i] > 127) union[i] = 255;
  }
  return keepMainRegions({ data: union, width, height });
}

/**
 * Turns one product photo into a transparent cut-out of the garment, in two passes.
 * 1. Overview: the model labels every pixel of the whole photo (background, face, arms, upper
 *    clothes...). This decides whether the photo is usable and where the garment is.
 * 2. Detail: the garment's area is cut from the full-resolution photo and labelled again, so a
 *    shirt that filled only a quarter of a full-length photo still gets a sharp, clean edge.
 * 3. The detailed mask is trimmed by a pixel (no background halo), measured (collar, body
 *    width), scored, and becomes the alpha channel of the cut-out.
 */
export async function makeCutout(
  photo: Buffer,
  rule: { labels: string[]; anchor: GarmentAnchor },
  segment: Segmenter,
): Promise<CutoutResult> {
  // Full-resolution RGB copy (EXIF rotation applied, transparency flattened onto white).
  const full = (await sharp(photo)
    .rotate()
    .flatten({ background: '#ffffff' })
    .resize(SOURCE_SIZE, SOURCE_SIZE, { fit: 'inside', withoutEnlargement: true })
    .removeAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true })) as RawImage;

  // Pass 1: overview of the whole photo.
  const overview = await labelPixels(full, segment);
  const kind = classifyPhoto(overview.areas, rule.labels);
  if (kind === 'unusable')
    return { kind, quality: 0, problems: ['no front view of the whole garment'] };
  const rough = measureGarment(garmentMask(overview, rule.labels), rule.anchor);
  if (!rough) return { kind, quality: 0, problems: ['garment too small'] };
  if (rough.quality === 0) return { kind, quality: 0, problems: rough.problems };

  // Pass 2: the garment's area (plus a margin) at full resolution.
  const toFull = full.info.width / overview.width;
  const margin =
    0.12 * Math.max(rough.box.right - rough.box.left, rough.box.bottom - rough.box.top);
  const left = Math.max(0, Math.floor((rough.box.left - margin) * toFull));
  const top = Math.max(0, Math.floor((rough.box.top - margin) * toFull));
  const right = Math.min(full.info.width, Math.ceil((rough.box.right + 1 + margin) * toFull));
  const bottom = Math.min(full.info.height, Math.ceil((rough.box.bottom + 1 + margin) * toFull));
  const area = (await sharp(full.data, { raw: full.info })
    .extract({ left, top, width: right - left, height: bottom - top })
    .resize(OUTPUT_SIZE, OUTPUT_SIZE, { fit: 'inside', withoutEnlargement: true })
    .raw()
    .toBuffer({ resolveWithObject: true })) as RawImage;

  const detail = await labelPixels(area, segment);
  const mask = erode(garmentMask(detail, rule.labels), 1);
  const measured = measureGarment(mask, rule.anchor);
  if (!measured) return { kind, quality: 0, problems: ['garment too small'] };
  if (measured.quality === 0) return { kind, quality: 0, problems: measured.problems };

  // Scale the mask up to the area's resolution and soften its edge slightly, so the garment
  // does not look cut out with scissors.
  const { width, height } = area.info;
  const alpha = await sharp(mask.data, {
    raw: { width: mask.width, height: mask.height, channels: 1 },
  })
    .resize(width, height, { kernel: 'cubic' })
    .blur(0.7)
    .extractChannel(0) // keep it one channel; sharp would otherwise widen it to RGB
    .raw()
    .toBuffer();

  const factor = width / mask.width;
  const cropLeft = Math.floor(measured.box.left * factor);
  const cropTop = Math.floor(measured.box.top * factor);
  const cropRight = Math.min(width, Math.ceil((measured.box.right + 1) * factor));
  const cropBottom = Math.min(height, Math.ceil((measured.box.bottom + 1) * factor));

  // Two steps: sharp runs extract before joinChannel within one pipeline, whatever the call order.
  const withAlpha = await sharp(area.data, { raw: area.info })
    .joinChannel(alpha, { raw: { width, height, channels: 1 } })
    .raw()
    .toBuffer();
  const image = await sharp(withAlpha, { raw: { width, height, channels: 4 } })
    .extract({
      left: cropLeft,
      top: cropTop,
      width: cropRight - cropLeft,
      height: cropBottom - cropTop,
    })
    .webp({ quality: 85, alphaQuality: 90 })
    .toBuffer();

  // A photo of a model leaves small gaps where arms crossed the garment, so a flat-lay of the
  // same quality is preferred.
  const quality = kind === 'on_model' ? Math.round(measured.quality * 95) / 100 : measured.quality;
  // Width and height come from the crop itself; scaling can be a pixel off after rounding.
  // Where the cut-out lies in the whole photo (area pixels -> photo pixels -> shares).
  const toPhoto = (right - left) / width;
  const share = (value: number) => Math.round(value * 10_000) / 10_000;
  const fit: GarmentFit = {
    ...scaleFit(measured.fit, factor),
    width: cropRight - cropLeft,
    height: cropBottom - cropTop,
    source: {
      x: share((left + cropLeft * toPhoto) / full.info.width),
      y: share((top + cropTop * toPhoto) / full.info.height),
      width: share(((cropRight - cropLeft) * toPhoto) / full.info.width),
      height: share(((cropBottom - cropTop) * toPhoto) / full.info.height),
    },
  };
  return { kind, quality, problems: [], image, fit };
}

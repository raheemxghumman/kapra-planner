/**
 * Pure geometry for live (AR) try-on cut-outs. Everything here works on a garment mask:
 * one byte per pixel, 255 where the garment is and 0 elsewhere. No model, database or file
 * access, so every rule is unit-tested in garment-geometry.spec.ts.
 */
import { ProductCategory } from '../catalogue.enums.js';

/** Which body points the garment is pinned to in the camera view. */
export type GarmentAnchor = 'shoulders' | 'hips';

/**
 * How a cut-out sits on a body, in the cut-out image's own pixels. The website pins the
 * anchor line (centerX, anchorY) to the user's shoulders or hips and scales the image so that
 * bodyWidth matches their body.
 */
export interface GarmentFit {
  anchor: GarmentAnchor;
  width: number;
  height: number;
  /** Centre line of the garment (the placket or the middle of the waistband). */
  centerX: number;
  /** Shoulder line for tops, kurtas and dresses; waistband for trousers. */
  anchorY: number;
  /** Flat width of the garment's body (chest for tops, waist for trousers), sleeves excluded. */
  bodyWidth: number;
}

export interface Mask {
  data: Uint8Array;
  width: number;
  height: number;
}

/** What the clothes-segmentation model must find for each kind of product, and where it is pinned. */
export const LIVE_TRY_ON: Partial<
  Record<ProductCategory, { labels: string[]; anchor: GarmentAnchor }>
> = {
  [ProductCategory.Top]: { labels: ['Upper-clothes', 'Dress'], anchor: 'shoulders' },
  [ProductCategory.Kurta]: { labels: ['Upper-clothes', 'Dress'], anchor: 'shoulders' },
  [ProductCategory.Outerwear]: { labels: ['Upper-clothes', 'Dress'], anchor: 'shoulders' },
  [ProductCategory.Dress]: {
    labels: ['Upper-clothes', 'Dress', 'Skirt', 'Pants', 'Belt'],
    anchor: 'shoulders',
  },
  [ProductCategory.Suit]: {
    labels: ['Upper-clothes', 'Dress', 'Skirt', 'Pants', 'Belt'],
    anchor: 'shoulders',
  },
  [ProductCategory.Trousers]: { labels: ['Pants', 'Skirt'], anchor: 'hips' },
};

/** Labels of the segmentation model that mean a person is in the photo. */
const PERSON_LABELS = ['Face', 'Hair', 'Left-arm', 'Right-arm', 'Left-leg', 'Right-leg'];

export type PhotoKind = 'flat_lay' | 'on_model' | 'unusable';

/**
 * Sorts a product photo by what the model found in it (share of the image per label).
 * A flat-lay (the garment alone) gives the cleanest cut-out; a photo of a model works when the
 * whole garment is visible from the front; a back view, a detail shot or a photo without the
 * garment is unusable.
 */
export function classifyPhoto(areas: Record<string, number>, garmentLabels: string[]): PhotoKind {
  const share = (labels: string[]) => labels.reduce((sum, label) => sum + (areas[label] ?? 0), 0);
  const garment = share(garmentLabels);
  if (garment < 0.06) return 'unusable';
  if (share(PERSON_LABELS) < 0.004) return 'flat_lay';
  // A model without a visible face is photographed from behind (or cropped at the neck):
  // a back view would put the back of the garment on the user's front.
  if ((areas.Face ?? 0) < 0.002) return 'unusable';
  return 'on_model';
}

/**
 * Keeps the garment and drops specks: every connected region at least 15% the size of the
 * largest one survives (so both legs of trousers or a separate dupatta stay).
 */
export function keepMainRegions(mask: Mask): Mask {
  const { data, width, height } = mask;
  const region = new Int32Array(width * height).fill(-1);
  const sizes: number[] = [];
  const stack: number[] = [];

  for (let start = 0; start < data.length; start++) {
    if (data[start] === 0 || region[start] !== -1) continue;
    const id = sizes.length;
    let size = 0;
    region[start] = id;
    stack.push(start);
    // Flood fill (4-neighbours) with an explicit stack; recursion would overflow on big masks.
    while (stack.length) {
      const index = stack.pop()!;
      size++;
      const x = index % width;
      const neighbours = [
        x > 0 ? index - 1 : -1,
        x < width - 1 ? index + 1 : -1,
        index - width,
        index + width,
      ];
      for (const next of neighbours) {
        if (next < 0 || next >= data.length || data[next] === 0 || region[next] !== -1) continue;
        region[next] = id;
        stack.push(next);
      }
    }
    sizes.push(size);
  }

  const largest = Math.max(0, ...sizes);
  const kept = new Uint8Array(data.length);
  for (let i = 0; i < data.length; i++) {
    if (region[i] >= 0 && sizes[region[i]] >= largest * 0.15) kept[i] = 255;
  }
  return { data: kept, width, height };
}

export interface Box {
  left: number;
  top: number;
  right: number;
  bottom: number;
}

export function boundingBox({ data, width, height }: Mask): Box | null {
  let left = width;
  let top = height;
  let right = -1;
  let bottom = -1;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (data[y * width + x] === 0) continue;
      if (x < left) left = x;
      if (x > right) right = x;
      if (y < top) top = y;
      bottom = y;
    }
  }
  return right < 0 ? null : { left, top, right, bottom };
}

/**
 * Width of the unbroken run of garment pixels through x on row y. Long sleeves lying beside
 * the body are separated from it by a gap, so they are not counted.
 */
export function runWidth({ data, width }: Mask, y: number, x: number): number {
  const row = y * width;
  const cx = Math.round(x);
  if (data[row + cx] === 0) return 0;
  let left = cx;
  let right = cx;
  while (left > 0 && data[row + left - 1] !== 0) left--;
  while (right < width - 1 && data[row + right + 1] !== 0) right++;
  return right - left + 1;
}

const percentile = (values: number[], p: number) => {
  const sorted = [...values].sort((a, b) => a - b);
  return sorted[Math.min(sorted.length - 1, Math.floor(p * sorted.length))] ?? 0;
};

export interface Measurement {
  fit: GarmentFit;
  box: Box;
  /** 0 (unusable) to 1 (clean, symmetric, complete). */
  quality: number;
  problems: string[];
}

/**
 * Finds where a garment's shoulders (or waistband) are and how wide its body is, and scores how
 * usable the cut-out is. Coordinates in the result are relative to the bounding box, i.e. to the
 * cut-out image after cropping.
 */
export function measureGarment(mask: Mask, anchor: GarmentAnchor): Measurement | null {
  const box = boundingBox(mask);
  if (!box) return null;
  const boxWidth = box.right - box.left + 1;
  const boxHeight = box.bottom - box.top + 1;
  const problems: string[] = [];

  // A garment touching the photo's edge was cropped by the photographer: part of it is missing.
  const margin = 2;
  if (
    box.left < margin ||
    box.top < margin ||
    box.right > mask.width - 1 - margin ||
    box.bottom > mask.height - 1 - margin
  ) {
    problems.push('garment is cut off by the photo edge');
  }

  // Centre line: the middle of the garment near the top (collar or waistband), which is
  // symmetric even when sleeves or legs are not.
  const topRows = Math.max(1, Math.round(boxHeight * (anchor === 'shoulders' ? 0.25 : 0.1)));
  let sumX = 0;
  let count = 0;
  for (let y = box.top; y < box.top + topRows; y++) {
    for (let x = box.left; x <= box.right; x++) {
      if (mask.data[y * mask.width + x] !== 0) {
        sumX += x;
        count++;
      }
    }
  }
  const centerX = count ? sumX / count : (box.left + box.right) / 2;

  const widths = (from: number, to: number) => {
    const values: number[] = [];
    for (let y = Math.round(box.top + from * boxHeight); y <= box.top + to * boxHeight; y++) {
      values.push(runWidth(mask, y, centerX));
    }
    return values;
  };

  let bodyWidth: number;
  let anchorY: number;
  if (anchor === 'shoulders') {
    // Narrowest part of the upper body (below the sleeves, around the waist), ignoring noise.
    bodyWidth = percentile(
      widths(0.2, 0.6).filter((w) => w > 0),
      0.2,
    );
    // The shoulder line is where the garment first gets close to its full body width.
    anchorY = box.top;
    for (let y = box.top; y <= box.bottom; y++) {
      if (runWidth(mask, y, centerX) >= bodyWidth * 0.85) {
        anchorY = y;
        break;
      }
    }
  } else {
    bodyWidth = percentile(widths(0, 0.06), 0.5);
    anchorY = box.top;
  }

  if (bodyWidth < 8) return null;

  // Mirror symmetry around the centre line: a flat-lay scores about 0.95, a draped saree 0.5.
  let both = 0;
  let either = 0;
  for (let y = box.top; y <= box.bottom; y++) {
    for (let x = box.left; x <= box.right; x++) {
      const mirrored = Math.round(2 * centerX - x);
      const a = mask.data[y * mask.width + x] !== 0;
      const b =
        mirrored >= 0 && mirrored < mask.width && mask.data[y * mask.width + mirrored] !== 0;
      if (a && b) both++;
      if (a || b) either++;
    }
  }
  const symmetry = either ? both / either : 0;
  if (symmetry < 0.75) problems.push('garment shape is not symmetric');

  const ratio = boxHeight / bodyWidth;
  const [minRatio, maxRatio] = anchor === 'shoulders' ? [0.8, 5] : [1.2, 5];
  if (ratio < minRatio || ratio > maxRatio) problems.push('garment proportions look wrong');

  const quality = problems.length ? 0 : Math.round(symmetry * 100) / 100;
  return {
    box,
    quality,
    problems,
    fit: {
      anchor,
      width: boxWidth,
      height: boxHeight,
      centerX: centerX - box.left,
      anchorY: anchorY - box.top,
      bodyWidth,
    },
  };
}

/** Scales a fit measured on a small mask to the full-size cut-out image. */
export function scaleFit(fit: GarmentFit, factor: number): GarmentFit {
  const round = (value: number) => Math.round(value * factor);
  return {
    anchor: fit.anchor,
    width: round(fit.width),
    height: round(fit.height),
    centerX: round(fit.centerX),
    anchorY: round(fit.anchorY),
    bodyWidth: round(fit.bodyWidth),
  };
}

import { describe, expect, it } from 'vitest';
import {
  classifyPhoto,
  keepMainRegions,
  measureGarment,
  scaleFit,
  type Mask,
} from './garment-geometry.js';

/** Builds a mask from filled rectangles [left, top, right, bottom] (inclusive). */
function maskOf(width: number, height: number, rects: [number, number, number, number][]): Mask {
  const data = new Uint8Array(width * height);
  for (const [left, top, right, bottom] of rects) {
    for (let y = top; y <= bottom; y++)
      for (let x = left; x <= right; x++) data[y * width + x] = 255;
  }
  return { data, width, height };
}

// A flat-lay T-shirt: collar, sleeves across the top, then the body.
const tShirt = () =>
  maskOf(200, 200, [
    [90, 30, 110, 39], // collar
    [40, 40, 160, 70], // shoulders and sleeves
    [70, 71, 130, 170], // body
  ]);

describe('measureGarment', () => {
  it('finds the centre, shoulder line and body width of a T-shirt', () => {
    const result = measureGarment(tShirt(), 'shoulders')!;
    expect(result.problems).toEqual([]);
    expect(result.fit.centerX).toBeCloseTo(60, 0); // 100 in the photo, minus the box's left edge (40)
    expect(result.fit.anchorY).toBe(10); // the first full-width row (y 40) minus the box top (30)
    expect(result.fit.bodyWidth).toBe(61); // body only, sleeves excluded
    expect(result.quality).toBeGreaterThan(0.95);
  });

  it('ignores long sleeves that lie beside the body', () => {
    const shirt = maskOf(200, 200, [
      [70, 40, 130, 170], // body
      [45, 45, 62, 160], // left sleeve, separated by a gap
      [138, 45, 155, 160], // right sleeve
    ]);
    expect(measureGarment(shirt, 'shoulders')!.fit.bodyWidth).toBe(61);
  });

  it('measures trousers at the waistband', () => {
    const trousers = maskOf(200, 200, [
      [60, 20, 140, 40], // waistband and seat
      [60, 41, 95, 190], // left leg
      [105, 41, 140, 190], // right leg
    ]);
    const result = measureGarment(trousers, 'hips')!;
    expect(result.fit.anchorY).toBe(0);
    expect(result.fit.bodyWidth).toBe(81);
    expect(result.problems).toEqual([]);
  });

  it('rejects a garment cut off by the photo edge', () => {
    const cropped = maskOf(200, 200, [[50, 20, 150, 199]]);
    expect(measureGarment(cropped, 'shoulders')!.problems).toContain(
      'garment is cut off by the photo edge',
    );
    expect(measureGarment(cropped, 'shoulders')!.quality).toBe(0);
  });

  it('rejects a lopsided shape such as a draped saree', () => {
    const draped = maskOf(200, 200, [
      [60, 20, 80, 180],
      [80, 120, 180, 180],
    ]);
    const result = measureGarment(draped, 'shoulders')!;
    expect(result.problems).toContain('garment shape is not symmetric');
  });

  it('returns null for an empty mask', () => {
    expect(measureGarment(maskOf(50, 50, []), 'shoulders')).toBeNull();
  });
});

describe('keepMainRegions', () => {
  it('drops small specks but keeps large separate parts', () => {
    const mask = maskOf(100, 100, [
      [10, 10, 40, 80], // left leg
      [60, 10, 90, 80], // right leg
      [50, 95, 51, 96], // speck
    ]);
    const kept = keepMainRegions(mask);
    expect(kept.data[95 * 100 + 50]).toBe(0);
    expect(kept.data[20 * 100 + 20]).toBe(255);
    expect(kept.data[20 * 100 + 70]).toBe(255);
  });
});

describe('classifyPhoto', () => {
  const tops = ['Upper-clothes', 'Dress'];

  it('spots a flat-lay: garment but no person', () => {
    expect(classifyPhoto({ Background: 0.74, 'Upper-clothes': 0.19, Dress: 0.07 }, tops)).toBe(
      'flat_lay',
    );
  });

  it('spots a photo of a model', () => {
    expect(
      classifyPhoto({ 'Upper-clothes': 0.18, Pants: 0.1, Face: 0.014, Hair: 0.012 }, tops),
    ).toBe('on_model');
  });

  it('rejects a model photographed from behind (hair but no face)', () => {
    expect(classifyPhoto({ 'Upper-clothes': 0.3, Hair: 0.03, 'Left-arm': 0.01 }, tops)).toBe(
      'unusable',
    );
  });

  it('rejects photos where the garment is barely visible', () => {
    expect(classifyPhoto({ Background: 0.9, Face: 0.05, 'Upper-clothes': 0.02 }, tops)).toBe(
      'unusable',
    );
  });
});

describe('scaleFit', () => {
  it('scales every measurement to the full-size image', () => {
    const fit = {
      anchor: 'shoulders' as const,
      width: 100,
      height: 150,
      centerX: 50,
      anchorY: 10,
      bodyWidth: 60,
    };
    expect(scaleFit(fit, 2)).toEqual({
      ...fit,
      width: 200,
      height: 300,
      centerX: 100,
      anchorY: 20,
      bodyWidth: 120,
    });
  });
});

import { describe, expect, it } from 'vitest';
import type { GarmentFit } from '../../types/catalogue';
import {
  applyMatrix,
  averageLuma,
  bodyMatrix,
  BODY,
  checkFraming,
  garmentBrightness,
  garmentMatrix,
  mirrorGarment,
  occluderMask,
  POSE,
  SEGMENT,
  smoothLandmarks,
  type Landmark,
  upperBodyCrop,
  AI_ASPECT,
} from './fit';

const shirt: GarmentFit = {
  anchor: 'shoulders',
  width: 400,
  height: 450,
  centerX: 200,
  anchorY: 40,
  bodyWidth: 250,
};

/** A person facing the camera, as normalised MediaPipe points. */
function person(overrides: Partial<Record<number, Landmark>> = {}): Landmark[] {
  const points: Landmark[] = Array.from({ length: 33 }, () => ({
    x: 0.5,
    y: 0.5,
    visibility: 0.9,
  }));
  points[POSE.nose] = { x: 0.5, y: 0.2, visibility: 0.99 };
  points[POSE.leftShoulder] = { x: 0.6, y: 0.35, visibility: 0.99 };
  points[POSE.rightShoulder] = { x: 0.4, y: 0.35, visibility: 0.99 };
  points[POSE.leftHip] = { x: 0.57, y: 0.65, visibility: 0.9 };
  points[POSE.rightHip] = { x: 0.43, y: 0.65, visibility: 0.9 };
  points[POSE.leftKnee] = { x: 0.57, y: 0.85, visibility: 0.8 };
  points[POSE.rightKnee] = { x: 0.43, y: 0.85, visibility: 0.8 };
  return Object.assign(points, overrides);
}

describe('checkFraming', () => {
  it('is ready when shoulders and hips are in view', () => {
    expect(checkFraming(person(), 'shoulders', 16 / 9)).toBe('ready');
  });

  it('asks for a person when nobody is found', () => {
    expect(checkFraming([], 'shoulders', 1)).toBe('no-person');
  });

  it('asks the user to step back when the hips are out of frame', () => {
    const close = person({ [POSE.leftHip]: { x: 0.6, y: 1.1, visibility: 0.2 } });
    expect(checkFraming(close, 'shoulders', 16 / 9)).toBe('step-back');
  });

  it('asks the user to come closer when they are tiny', () => {
    const far = person({
      [POSE.leftShoulder]: { x: 0.52, y: 0.35, visibility: 0.99 },
      [POSE.rightShoulder]: { x: 0.48, y: 0.35, visibility: 0.99 },
    });
    expect(checkFraming(far, 'shoulders', 16 / 9)).toBe('come-closer');
  });

  it('needs the knees for trousers', () => {
    const noKnees = person({ [POSE.leftKnee]: { x: 0.57, y: 1.05, visibility: 0.1 } });
    expect(checkFraming(noKnees, 'hips', 16 / 9)).toBe('show-legs');
    expect(checkFraming(noKnees, 'shoulders', 16 / 9)).toBe('ready');
  });

  it('asks the user to move to the middle', () => {
    const shift = (point: Landmark) => ({ ...point, x: point.x - 0.35 });
    const points = person().map(shift);
    expect(checkFraming(points, 'shoulders', 16 / 9)).toBe('move-centre');
  });
});

describe('garmentMatrix', () => {
  const upright = {
    left: { x: 400, y: 300 },
    right: { x: 600, y: 300 },
    lowerLeft: { x: 420, y: 660 },
    lowerRight: { x: 580, y: 660 },
  };

  it('puts the shoulder line just above the shoulders, centred', () => {
    const matrix = garmentMatrix(upright, shirt);
    const anchor = applyMatrix(matrix, { x: shirt.centerX, y: shirt.anchorY });
    expect(anchor.x).toBeCloseTo(500);
    expect(anchor.y).toBeCloseTo(300 - BODY.shoulders.lift * 200);
  });

  it('makes the garment body as wide as the shoulders plus ease', () => {
    const matrix = garmentMatrix(upright, shirt);
    const leftEdge = applyMatrix(matrix, {
      x: shirt.centerX - shirt.bodyWidth / 2,
      y: shirt.anchorY,
    });
    const rightEdge = applyMatrix(matrix, {
      x: shirt.centerX + shirt.bodyWidth / 2,
      y: shirt.anchorY,
    });
    expect(rightEdge.x - leftEdge.x).toBeCloseTo(200 * BODY.shoulders.ease);
  });

  it('tilts with the body', () => {
    const leaning = { ...upright, right: { x: 600, y: 400 } }; // right shoulder dropped
    const matrix = garmentMatrix(leaning, shirt);
    const leftEdge = applyMatrix(matrix, { x: 0, y: shirt.anchorY });
    const rightEdge = applyMatrix(matrix, { x: shirt.width, y: shirt.anchorY });
    expect(rightEdge.y).toBeGreaterThan(leftEdge.y);
  });

  it('keeps the length when the user turns sideways', () => {
    const turned = { ...upright, left: { x: 460, y: 300 }, right: { x: 540, y: 300 } };
    const front = garmentMatrix(upright, shirt);
    const side = garmentMatrix(turned, shirt);
    expect(side[3]).toBeCloseTo(front[3]); // same vertical scale
    expect(side[0]).toBeLessThan(front[0]); // narrower
  });

  it('scales with the Fit control', () => {
    expect(garmentMatrix(upright, shirt, 1.1)[0]).toBeCloseTo(
      garmentMatrix(upright, shirt)[0] * 1.1,
    );
  });
});

describe('smoothLandmarks', () => {
  it('moves part of the way for small changes', () => {
    const [point] = smoothLandmarks([{ x: 0.5, y: 0.5 }], [{ x: 0.52, y: 0.5 }]);
    expect(point.x).toBeCloseTo(0.51);
  });

  it('jumps straight to the new place after a big move', () => {
    const [point] = smoothLandmarks([{ x: 0.2, y: 0.5 }], [{ x: 0.6, y: 0.5 }]);
    expect(point.x).toBe(0.6);
  });
});

describe('occluderMask', () => {
  it('keeps face, hair and low skin in front, but not the neck', () => {
    // A 1x4 column: hair, face, neck skin (row 2), hand skin (row 3).
    const categories = Uint8Array.from([
      SEGMENT.hair,
      SEGMENT.faceSkin,
      SEGMENT.bodySkin,
      SEGMENT.bodySkin,
    ]);
    const alpha = occluderMask(categories, 1, 4, 3).filter((_, i) => i % 4 === 3);
    expect([...alpha]).toEqual([255, 255, 0, 255]);
  });

  it('leaves clothes and background behind the garment', () => {
    const categories = Uint8Array.from([SEGMENT.clothes, SEGMENT.background]);
    expect([...occluderMask(categories, 2, 1, 0).filter((_, i) => i % 4 === 3)]).toEqual([0, 0]);
  });
});

describe('lighting', () => {
  it('measures brightness', () => {
    expect(averageLuma(Uint8ClampedArray.from([255, 255, 255, 255, 0, 0, 0, 255]))).toBeCloseTo(
      0.5,
    );
  });

  it('darkens the garment in a dim room but never brightens it', () => {
    expect(garmentBrightness(0.2)).toBeLessThan(0.6);
    expect(garmentBrightness(0.9)).toBe(1);
    expect(garmentBrightness(0)).toBe(0.55);
  });
});

describe('bodyMatrix', () => {
  const model = {
    left: { x: 100, y: 50 },
    right: { x: 200, y: 50 },
    lowerLeft: { x: 110, y: 200 },
    lowerRight: { x: 190, y: 200 },
  };

  it('moves the model joints exactly onto the user joints', () => {
    const user = {
      left: { x: 400, y: 300 },
      right: { x: 600, y: 300 },
      lowerLeft: { x: 420, y: 600 },
      lowerRight: { x: 580, y: 600 },
    };
    const matrix = bodyMatrix(model, user);
    expect(applyMatrix(matrix, model.left)).toEqual({ x: 400, y: 300 });
    expect(applyMatrix(matrix, model.right)).toEqual({ x: 600, y: 300 });
    const hips = applyMatrix(matrix, { x: 150, y: 200 });
    expect(hips.x).toBeCloseTo(500);
    expect(hips.y).toBeCloseTo(600);
  });

  it('is the identity when the bodies match', () => {
    const matrix = bodyMatrix(model, model);
    [1, 0, 0, 1, 0, 0].forEach((value, i) => expect(matrix[i]).toBeCloseTo(value));
  });
});

describe('mirrorGarment', () => {
  const matrix = garmentMatrix(
    {
      left: { x: 400, y: 300 },
      right: { x: 600, y: 300 },
      lowerLeft: { x: 420, y: 660 },
      lowerRight: { x: 580, y: 660 },
    },
    { ...shirt, centerX: 150 }, // an off-centre garment: centre line at x 150 of 400
  );

  it('keeps the centre line in place', () => {
    const before = applyMatrix(matrix, { x: 150, y: 100 });
    const after = applyMatrix(mirrorGarment(matrix, 150), { x: 150, y: 100 });
    expect(after.x).toBeCloseTo(before.x);
    expect(after.y).toBeCloseTo(before.y);
  });

  it('swaps the two sides around the centre line', () => {
    const left = applyMatrix(matrix, { x: 100, y: 100 });
    const mirroredRight = applyMatrix(mirrorGarment(matrix, 150), { x: 200, y: 100 });
    expect(mirroredRight.x).toBeCloseTo(left.x);
  });
});

describe('upperBodyCrop', () => {
  it('frames the upper body at 3:4 inside the picture', () => {
    const points = person({
      [POSE.leftEye]: { x: 0.52, y: 0.2, visibility: 0.99 },
      [POSE.rightEye]: { x: 0.48, y: 0.2, visibility: 0.99 },
    });
    const crop = upperBodyCrop(points, 1280, 720)!;
    expect(crop.width / crop.height).toBeCloseTo(AI_ASPECT, 1);
    expect(crop.x).toBeGreaterThanOrEqual(0);
    expect(crop.y).toBeGreaterThanOrEqual(0);
    expect(crop.x + crop.width).toBeLessThanOrEqual(1280);
    expect(crop.y + crop.height).toBeLessThanOrEqual(720);
    // The shoulders are inside the crop.
    expect(crop.x).toBeLessThan(0.4 * 1280);
    expect(crop.x + crop.width).toBeGreaterThan(0.6 * 1280);
  });

  it('needs the eyes and hips', () => {
    const noHips = person({ [POSE.leftHip]: { x: 0.57, y: 0.65, visibility: 0.1 } });
    expect(upperBodyCrop(noHips, 1280, 720)).toBeNull();
  });
});

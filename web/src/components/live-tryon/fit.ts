/**
 * The maths of live (AR) try-on, kept free of React and the camera so it is unit-tested.
 *
 * MediaPipe Pose gives 33 body points per camera frame. We use the shoulders, hips and knees to
 * (1) coach the user into the frame and (2) work out an affine transform (move, rotate, scale)
 * that pins the garment cut-out's shoulder line onto their shoulders.
 */
import type { GarmentFit } from '../../types/catalogue';

/** A body point from MediaPipe: x and y from 0 to 1 across the frame, visibility from 0 to 1. */
export interface Landmark {
  x: number;
  y: number;
  visibility?: number;
}

export interface Point {
  x: number;
  y: number;
}

/** Indices of the MediaPipe Pose points we use ("left" is the person's own left). */
export const POSE = {
  nose: 0,
  leftShoulder: 11,
  rightShoulder: 12,
  leftHip: 23,
  rightHip: 24,
  leftKnee: 25,
  rightKnee: 26,
} as const;

export type Framing =
  'no-person' | 'step-back' | 'show-legs' | 'come-closer' | 'move-centre' | 'ready';

export const FRAMING_HINTS: Record<Framing, string> = {
  'no-person': 'Stand in front of the camera',
  'step-back': 'Step back so your shoulders and hips are in the frame',
  'show-legs': 'Step back a little more so your knees are in the frame',
  'come-closer': 'Come a little closer',
  'move-centre': 'Move to the middle of the frame',
  ready: 'Hold still…',
};

const isVisible = (point: Landmark | undefined, min = 0.5): point is Landmark =>
  !!point &&
  (point.visibility ?? 1) >= min &&
  point.x >= 0 &&
  point.x <= 1 &&
  point.y >= 0 &&
  point.y <= 1;

/**
 * Is the user standing where the garment can be fitted? Tops need both shoulders and hips in
 * view (hips give the body's direction and length); trousers also need the knees.
 * `aspect` is the frame's width divided by its height.
 */
export function checkFraming(
  landmarks: Landmark[] | undefined,
  anchor: GarmentFit['anchor'],
  aspect: number,
): Framing {
  if (!landmarks?.length) return 'no-person';
  const left = landmarks[POSE.leftShoulder];
  const right = landmarks[POSE.rightShoulder];
  if (!isVisible(left) || !isVisible(right)) {
    // A face without shoulders means the user is too close to the camera.
    return isVisible(landmarks[POSE.nose]) ? 'step-back' : 'no-person';
  }

  // Shoulder width as a share of the frame's width.
  const shoulderWidth = Math.hypot(left.x - right.x, (left.y - right.y) / aspect);
  if (shoulderWidth > 0.5) return 'step-back';
  if (!isVisible(landmarks[POSE.leftHip]) || !isVisible(landmarks[POSE.rightHip]))
    return 'step-back';
  if (
    anchor === 'hips' &&
    (!isVisible(landmarks[POSE.leftKnee]) || !isVisible(landmarks[POSE.rightKnee]))
  ) {
    return 'show-legs';
  }
  if (shoulderWidth < 0.06) return 'come-closer';
  const middle = (left.x + right.x) / 2;
  if (middle < 0.25 || middle > 0.75) return 'move-centre';
  return 'ready';
}

/**
 * Body proportions used to size the garment (measured on adults; the user can fine-tune the
 * size with the Fit buttons).
 * - ease: a garment lying flat is wider than the distance between the shoulder (or hip) joints.
 * - ratio: torso length (shoulders to hips) or thigh length (hips to knees) divided by that
 *   joint distance when facing the camera. It keeps the garment's length right when the user
 *   turns sideways and their shoulders look narrower.
 * - lift: how far the garment's anchor line sits above the joints, as a share of the body
 *   width: shoulder seams lie on top of the shoulder joints; a waistband sits above the hips.
 * ease and lift were measured on product photos of models, by comparing the garment's outline
 * with the model's own shoulder joints (a polo: flat width 1.39x the joint distance, shoulder
 * line 0.13x above the joints).
 */
export const BODY = {
  shoulders: { ease: 1.4, ratio: 1.8, lift: 0.13 },
  hips: { ease: 1.35, ratio: 1.8, lift: 0.5 },
} as const;

/** Canvas transform [a, b, c, d, e, f]: screen = (a·x + c·y + e, b·x + d·y + f). */
export type Matrix = [number, number, number, number, number, number];

/**
 * The transform that draws the cut-out on the body. All points are in camera pixels.
 * `left`/`right` are the anchor joints as they appear in the (unmirrored) camera picture,
 * `lowerLeft`/`lowerRight` the joints below them (hips for tops, knees for trousers).
 */
export function garmentMatrix(
  body: { left: Point; right: Point; lowerLeft: Point; lowerRight: Point },
  fit: GarmentFit,
  sizeScale = 1,
): Matrix {
  const { ease, ratio, lift } = BODY[fit.anchor];

  // Across the body: from the left anchor joint to the right one.
  const acrossX = body.right.x - body.left.x;
  const acrossY = body.right.y - body.left.y;
  const width = Math.hypot(acrossX, acrossY) || 1;
  const ux = { x: acrossX / width, y: acrossY / width };

  // Down the body: from the middle of the anchor joints to the middle of the lower joints.
  const top = { x: (body.left.x + body.right.x) / 2, y: (body.left.y + body.right.y) / 2 };
  const downX = (body.lowerLeft.x + body.lowerRight.x) / 2 - top.x;
  const downY = (body.lowerLeft.y + body.lowerRight.y) / 2 - top.y;
  const length = Math.hypot(downX, downY);
  const uy = length > 1 ? { x: downX / length, y: downY / length } : { x: -ux.y, y: ux.x };

  // Horizontal scale follows the visible width; vertical scale never shrinks below what the
  // body's length implies, so turning sideways narrows the garment without shortening it.
  const frontalWidth = Math.max(width, length / ratio);
  const sx = (width * ease * sizeScale) / fit.bodyWidth;
  const sy = (frontalWidth * ease * sizeScale) / fit.bodyWidth;

  const origin = { x: top.x - uy.x * lift * frontalWidth, y: top.y - uy.y * lift * frontalWidth };
  const a = sx * ux.x;
  const b = sx * ux.y;
  const c = sy * uy.x;
  const d = sy * uy.y;
  return [
    a,
    b,
    c,
    d,
    origin.x - a * fit.centerX - c * fit.anchorY,
    origin.y - b * fit.centerX - d * fit.anchorY,
  ];
}

/** Anchor joints and the joints below them, as they appear in an (unmirrored) picture. */
export interface BodyPoints {
  left: Point;
  right: Point;
  lowerLeft: Point;
  lowerRight: Point;
}

/**
 * Joint-to-joint fit, used when the cut-out comes from a photo of a model: the transform that
 * moves the model's shoulders (or hips) onto the user's, and the middle of the model's hips
 * (or knees) onto the user's. It is built from two axes per body (across and down):
 *   matrix = userAxes × inverse(modelAxes)
 * so it follows the user's leaning and turning with no guessed body proportions.
 */
export function bodyMatrix(model: BodyPoints, user: BodyPoints, sizeScale = 1): Matrix {
  const axes = (body: BodyPoints) => {
    const top = { x: (body.left.x + body.right.x) / 2, y: (body.left.y + body.right.y) / 2 };
    const bottom = {
      x: (body.lowerLeft.x + body.lowerRight.x) / 2,
      y: (body.lowerLeft.y + body.lowerRight.y) / 2,
    };
    return {
      top,
      across: { x: body.right.x - body.left.x, y: body.right.y - body.left.y },
      down: { x: bottom.x - top.x, y: bottom.y - top.y },
    };
  };
  const m = axes(model);
  const u = axes(user);
  // Inverse of the 2x2 matrix whose columns are the model's across and down axes.
  const det = m.across.x * m.down.y - m.down.x * m.across.y;
  const inv = { a: m.down.y / det, b: -m.across.y / det, c: -m.down.x / det, d: m.across.x / det };
  // userAxes × inverse(modelAxes), scaled by the Fit control around the user's anchor point.
  const a = sizeScale * (u.across.x * inv.a + u.down.x * inv.b);
  const b = sizeScale * (u.across.y * inv.a + u.down.y * inv.b);
  const c = sizeScale * (u.across.x * inv.c + u.down.x * inv.d);
  const d = sizeScale * (u.across.y * inv.c + u.down.y * inv.d);
  return [a, b, c, d, u.top.x - a * m.top.x - c * m.top.y, u.top.y - b * m.top.x - d * m.top.y];
}

/**
 * Mirrors the garment left-to-right inside its own image. The front-camera view is shown
 * mirrored (like a mirror); drawing the garment pre-mirrored keeps its printed text readable.
 */
export function mirrorGarment([a, b, c, d, e, f]: Matrix, garmentWidth: number): Matrix {
  // matrix × flip, where flip maps x -> garmentWidth - x.
  return [-a, -b, c, d, a * garmentWidth + e, b * garmentWidth + f];
}

/** Applies a canvas transform to a point (used by the tests and the debug view). */
export const applyMatrix = ([a, b, c, d, e, f]: Matrix, { x, y }: Point): Point => ({
  x: a * x + c * y + e,
  y: b * x + d * y + f,
});

/**
 * Smooths jitter between frames: each point moves part of the way towards its new position.
 * A big jump (the user moved fast) is taken at once so the garment does not trail behind.
 */
export function smoothLandmarks(
  previous: Landmark[] | null,
  next: Landmark[],
  follow = 0.5,
): Landmark[] {
  if (!previous || previous.length !== next.length) return next;
  return next.map((point, index) => {
    const before = previous[index];
    if (Math.hypot(point.x - before.x, point.y - before.y) > 0.15) return point;
    return {
      x: before.x + (point.x - before.x) * follow,
      y: before.y + (point.y - before.y) * follow,
      visibility: point.visibility,
    };
  });
}

/** Camera-pixel anchor points for a garment, from normalised landmarks. */
export function bodyPoints(
  landmarks: Landmark[],
  anchor: GarmentFit['anchor'],
  width: number,
  height: number,
) {
  const px = (index: number): Point => ({
    x: landmarks[index].x * width,
    y: landmarks[index].y * height,
  });
  // In the unmirrored camera picture the person's right side appears on the left.
  return anchor === 'shoulders'
    ? {
        left: px(POSE.rightShoulder),
        right: px(POSE.leftShoulder),
        lowerLeft: px(POSE.rightHip),
        lowerRight: px(POSE.leftHip),
      }
    : {
        left: px(POSE.rightHip),
        right: px(POSE.leftHip),
        lowerLeft: px(POSE.rightKnee),
        lowerRight: px(POSE.leftKnee),
      };
}

/** Classes of MediaPipe's multiclass selfie segmenter (selfie_multiclass_256x256). */
export const SEGMENT = {
  background: 0,
  hair: 1,
  bodySkin: 2,
  faceSkin: 3,
  clothes: 4,
  others: 5,
} as const;

/**
 * Which camera pixels belong in front of the garment, as an RGBA alpha mask (255 = in front):
 * face and hair always, and skin (arms, hands) below `skinFromRow`, so a hand crossing the
 * body covers the garment as it would in real life. The neck stays behind, or it would cut
 * through the collar.
 */
export function occluderMask(
  categories: Uint8Array,
  width: number,
  height: number,
  skinFromRow: number,
  out = new Uint8ClampedArray(width * height * 4),
): Uint8ClampedArray {
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = y * width + x;
      const category = categories[i];
      const inFront =
        category === SEGMENT.hair ||
        category === SEGMENT.faceSkin ||
        (category === SEGMENT.bodySkin && y >= skinFromRow);
      out[i * 4 + 3] = inFront ? 255 : 0;
    }
  }
  return out;
}

/** Average brightness (0 to 1) of RGBA pixels, weighted like the human eye sees colour. */
export function averageLuma(rgba: Uint8ClampedArray): number {
  let sum = 0;
  for (let i = 0; i < rgba.length; i += 4)
    sum += 0.2126 * rgba[i] + 0.7152 * rgba[i + 1] + 0.0722 * rgba[i + 2];
  return rgba.length ? sum / (rgba.length / 4) / 255 : 0.5;
}

/**
 * How bright to draw the garment so it matches the room: product photos are lit like a studio,
 * so in a dim room the garment is darkened (never brightened beyond the photo).
 */
export const garmentBrightness = (sceneLuma: number) =>
  Math.min(1, Math.max(0.55, (sceneLuma / 0.5) ** 0.7));

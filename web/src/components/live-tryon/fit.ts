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
 * - lift: how far the garment's anchor line sits above the joints (shoulder seams sit on top
 *   of the shoulders; a waistband sits above the hip joints), as a share of the body width.
 */
export const BODY = {
  shoulders: { ease: 1.4, ratio: 1.45, lift: 0.05 },
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

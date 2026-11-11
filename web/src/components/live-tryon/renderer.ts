import type { ImageSegmenter } from '@mediapipe/tasks-vision';
import type { GarmentFit } from '../../types/catalogue';
import {
  averageLuma,
  bodyMatrix,
  bodyPoints,
  garmentBrightness,
  garmentMatrix,
  mirrorGarment,
  occluderMask,
  POSE,
  type BodyPoints,
  type Landmark,
} from './fit';

/** The segmenter works on 256x256 images, so a small copy of the frame is enough (and fast). */
const SMALL_WIDTH = 256;
/** Room brightness changes slowly; measuring it twice a second is plenty. */
const LIGHT_EVERY_FRAMES = 15;
/** Hands are found every other frame; in between the last mask is reused. */
const SEGMENT_EVERY_FRAMES = 2;

export interface GarmentOverlay {
  garment: HTMLImageElement;
  fit: GarmentFit;
  landmarks: Landmark[];
  size: number;
  /** The model's joints in the cut-out (see findModelBody); null means use the shoulder line. */
  modelBody: BodyPoints | null;
  /** The view is shown mirrored (front camera): mirror the garment so its text reads correctly. */
  mirrored: boolean;
}

/**
 * Draws one frame of live try-on in three layers:
 * 1. the camera picture;
 * 2. the garment, pinned to the body (joint to joint when the product photo shows a model) and
 *    darkened to match the room's light;
 * 3. the user's own face, hair and hands, cut out of the camera picture with the segmenter,
 *    so they appear in front of the garment (a hand on the chest covers the shirt).
 */
export class LiveRenderer {
  private readonly small = document.createElement('canvas');
  private readonly smallContext = this.small.getContext('2d', { willReadFrequently: true })!;
  private readonly mask = document.createElement('canvas');
  private readonly occluder = document.createElement('canvas');
  private categories: { data: Uint8Array; width: number; height: number } | null = null;
  private brightness = 1;
  private frame = 0;

  private readonly segmenter: ImageSegmenter | null;

  constructor(segmenter: ImageSegmenter | null) {
    this.segmenter = segmenter;
  }

  draw(
    context: CanvasRenderingContext2D,
    video: HTMLVideoElement,
    overlay: GarmentOverlay | null,
  ): void {
    const { videoWidth: width, videoHeight: height } = video;
    context.setTransform(1, 0, 0, 1, 0, 0);
    context.drawImage(video, 0, 0, width, height);
    if (!overlay) return;

    this.frame++;
    this.small.width = SMALL_WIDTH;
    this.small.height = Math.round((SMALL_WIDTH * height) / width);
    this.smallContext.drawImage(video, 0, 0, this.small.width, this.small.height);
    if (this.frame % LIGHT_EVERY_FRAMES === 1) {
      const pixels = this.smallContext.getImageData(0, 0, this.small.width, this.small.height).data;
      this.brightness = garmentBrightness(averageLuma(pixels));
    }
    if (this.segmenter && this.frame % SEGMENT_EVERY_FRAMES === 1) this.segment();

    // Layer 2: the garment.
    const { garment, fit, landmarks, size, modelBody, mirrored } = overlay;
    const user = bodyPoints(landmarks, fit.anchor, width, height);
    // Joint to joint when the model's joints are known; otherwise the shoulder line (flat-lays).
    const matrix = modelBody ? bodyMatrix(modelBody, user, size) : garmentMatrix(user, fit, size);
    const axis = modelBody ? (modelBody.left.x + modelBody.right.x) / 2 : fit.centerX;
    context.setTransform(...(mirrored ? mirrorGarment(matrix, axis) : matrix));
    context.filter = `brightness(${this.brightness})`;
    context.drawImage(garment, 0, 0, fit.width, fit.height);
    context.filter = 'none';
    context.setTransform(1, 0, 0, 1, 0, 0);

    // Layer 3: face, hair and hands back on top.
    if (this.categories) this.drawOccluders(context, video, landmarks);
  }

  private segment(): void {
    const result = this.segmenter!.segmentForVideo(this.small, performance.now());
    const mask = result.categoryMask;
    if (mask) {
      // Copy before closing: the mask's memory belongs to MediaPipe.
      this.categories = {
        data: mask.getAsUint8Array().slice(),
        width: mask.width,
        height: mask.height,
      };
      mask.close();
    }
  }

  private drawOccluders(
    context: CanvasRenderingContext2D,
    video: HTMLVideoElement,
    landmarks: Landmark[],
  ): void {
    const { data, width, height } = this.categories!;
    // Skin counts as "in front" from a little below the shoulders, so the neck stays behind
    // the collar.
    const left = landmarks[POSE.leftShoulder];
    const right = landmarks[POSE.rightShoulder];
    const shoulderRow = ((left.y + right.y) / 2) * height;
    const shoulderWidth = Math.hypot((left.x - right.x) * width, (left.y - right.y) * height);
    const skinFromRow = shoulderRow + 0.35 * shoulderWidth;

    this.mask.width = width;
    this.mask.height = height;
    const maskContext = this.mask.getContext('2d')!;
    const image = maskContext.createImageData(width, height);
    occluderMask(data, width, height, skinFromRow, image.data);
    maskContext.putImageData(image, 0, 0);

    // Keep only the camera pixels the mask allows; scaling the small mask up softens its edge.
    const { videoWidth, videoHeight } = video;
    this.occluder.width = videoWidth;
    this.occluder.height = videoHeight;
    const occluderContext = this.occluder.getContext('2d')!;
    occluderContext.drawImage(video, 0, 0, videoWidth, videoHeight);
    occluderContext.globalCompositeOperation = 'destination-in';
    occluderContext.drawImage(this.mask, 0, 0, videoWidth, videoHeight);
    occluderContext.globalCompositeOperation = 'source-over';
    context.drawImage(this.occluder, 0, 0);
  }
}

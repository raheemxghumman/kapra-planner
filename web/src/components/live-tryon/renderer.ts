import type { ImageSegmenter } from '@mediapipe/tasks-vision';
import type { GarmentFit } from '../../types/catalogue';
import type { AiFrame } from './ai-stream';
import {
  averageLuma,
  bodyMatrix,
  bodyPoints,
  garmentBrightness,
  garmentMatrix,
  mirrorGarment,
  occluderMask,
  personMask,
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
 * 2. the garment: either the AI try-on picture from the GPU server (pasted onto the person), or
 *    the cut-out pinned to the body (joint to joint when the product photo shows a model) and
 *    darkened to match the room's light;
 * 3. the user's own face, hair and hands, cut out of the camera picture with the segmenter,
 *    so they appear in front of the garment (a hand on the chest covers the shirt).
 */
export class LiveRenderer {
  private readonly small = document.createElement('canvas');
  private readonly smallContext = this.small.getContext('2d', { willReadFrequently: true })!;
  private readonly mask = document.createElement('canvas');
  private readonly occluder = document.createElement('canvas');
  private readonly person = document.createElement('canvas');
  private readonly aiLayer = document.createElement('canvas');
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
    ai: AiFrame | null = null,
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
    if (ai && this.categories) {
      this.drawAiFrame(context, video, ai);
      // The AI repaints the arms itself, so only the face and hair go back on top.
      this.drawOccluders(context, video, landmarks, false);
      return;
    }
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

  /**
   * A small canvas of the whole picture whose opaque pixels are the person (from the last
   * segmentation), or null before the first one.
   */
  personMask(): HTMLCanvasElement | null {
    if (!this.categories) return null;
    const { data, width, height } = this.categories;
    this.person.width = width;
    this.person.height = height;
    const context = this.person.getContext('2d')!;
    const image = context.createImageData(width, height);
    personMask(data, width, height, image.data);
    context.putImageData(image, 0, 0);
    return this.person;
  }

  /** The AI picture, placed where its crop came from and trimmed to the person's outline. */
  private drawAiFrame(
    context: CanvasRenderingContext2D,
    video: HTMLVideoElement,
    ai: AiFrame,
  ): void {
    const { videoWidth, videoHeight } = video;
    const mask = this.personMask()!;
    this.aiLayer.width = videoWidth;
    this.aiLayer.height = videoHeight;
    const layer = this.aiLayer.getContext('2d')!;
    layer.drawImage(ai.image, ai.crop.x, ai.crop.y, ai.crop.width, ai.crop.height);
    layer.globalCompositeOperation = 'destination-in';
    layer.filter = `blur(${this.edgeSoftness(videoWidth)}px)`; // the mask is small: soften its steps
    layer.drawImage(mask, 0, 0, videoWidth, videoHeight);
    layer.filter = 'none';
    layer.globalCompositeOperation = 'source-over';
    context.drawImage(this.aiLayer, 0, 0);
  }

  /** Blur radius that hides the steps of a small mask scaled up to the video's width. */
  private edgeSoftness(videoWidth: number): number {
    return Math.max(1, (videoWidth / (this.categories?.width ?? videoWidth)) * 0.8);
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
    withHands = true,
  ): void {
    const { data, width, height } = this.categories!;
    // Skin counts as "in front" from a little below the shoulders, so the neck stays behind
    // the collar.
    const left = landmarks[POSE.leftShoulder];
    const right = landmarks[POSE.rightShoulder];
    const shoulderRow = ((left.y + right.y) / 2) * height;
    const shoulderWidth = Math.hypot((left.x - right.x) * width, (left.y - right.y) * height);
    const skinFromRow = withHands ? shoulderRow + 0.35 * shoulderWidth : height;

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
    occluderContext.filter = `blur(${this.edgeSoftness(videoWidth)}px)`;
    occluderContext.drawImage(this.mask, 0, 0, videoWidth, videoHeight);
    occluderContext.filter = 'none';
    occluderContext.globalCompositeOperation = 'source-over';
    context.drawImage(this.occluder, 0, 0);
  }
}

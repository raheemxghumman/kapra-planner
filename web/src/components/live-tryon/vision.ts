import { FilesetResolver, ImageSegmenter, PoseLandmarker } from '@mediapipe/tasks-vision';
import type { GarmentFit } from '../../types/catalogue';
import { bodyPoints, POSE, type BodyPoints } from './fit';

/**
 * Google's pre-trained MediaPipe models. Both run entirely in the browser, so camera frames
 * never leave the device.
 * - Pose ("lite", about 6 MB): 33 body points, 30+ frames a second on a phone.
 * - Multiclass selfie segmenter: labels every pixel as hair, face, body skin, clothes or
 *   background, which lets the user's hands and face appear in front of the garment.
 */
const POSE_MODEL =
  'https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task';
const SEGMENTER_MODEL =
  'https://storage.googleapis.com/mediapipe-models/image_segmenter/selfie_multiclass_256x256/float32/latest/selfie_multiclass_256x256.tflite';

/**
 * MediaPipe's WebAssembly runtime is served from our own site (copied into public/mediapipe by
 * scripts/copy-mediapipe.mjs), so the Content Security Policy need not trust another host.
 */
async function runtime() {
  const name = (await FilesetResolver.isSimdSupported())
    ? 'vision_wasm_internal'
    : 'vision_wasm_nosimd_internal';
  return { wasmLoaderPath: `/mediapipe/${name}.js`, wasmBinaryPath: `/mediapipe/${name}.wasm` };
}

/** Uses the GPU when the browser allows it, otherwise the CPU. */
async function withDelegate<T>(create: (delegate: 'GPU' | 'CPU') => Promise<T>): Promise<T> {
  try {
    return await create('GPU');
  } catch {
    return create('CPU');
  }
}

export interface Vision {
  pose: PoseLandmarker;
  /** Null when the segmenter could not load; try-on still works, just without hands in front. */
  segmenter: ImageSegmenter | null;
  close: () => void;
}

export async function loadVision(): Promise<Vision> {
  const fileset = await runtime();
  const [pose, segmenter] = await Promise.all([
    withDelegate((delegate) =>
      PoseLandmarker.createFromOptions(fileset, {
        baseOptions: { modelAssetPath: POSE_MODEL, delegate },
        runningMode: 'VIDEO',
        numPoses: 1,
      }),
    ),
    withDelegate((delegate) =>
      ImageSegmenter.createFromOptions(fileset, {
        baseOptions: { modelAssetPath: SEGMENTER_MODEL, delegate },
        runningMode: 'VIDEO',
        outputCategoryMask: true,
        outputConfidenceMasks: false,
      }),
    ).catch(() => null),
  ]);
  return {
    pose,
    segmenter,
    close: () => {
      pose.close();
      segmenter?.close();
    },
  };
}

let photoPose: Promise<PoseLandmarker> | null = null;

/**
 * Finds the model's shoulders and hips (or hips and knees for trousers) in the product photo the
 * cut-out came from, in the cut-out's own pixels, so live try-on can pin the garment joint to
 * joint. Returns null if the joints are not clearly visible (the collar rule is used instead).
 */
export async function findModelBody(photoUrl: string, fit: GarmentFit): Promise<BodyPoints | null> {
  if (!fit.source) return null;
  // A separate pose model in IMAGE mode (the live one runs in VIDEO mode), loaded once.
  photoPose ??= runtime().then((fileset) =>
    withDelegate((delegate) =>
      PoseLandmarker.createFromOptions(fileset, {
        baseOptions: { modelAssetPath: POSE_MODEL, delegate },
        runningMode: 'IMAGE',
        numPoses: 1,
      }),
    ),
  );
  const photo = new Image();
  photo.crossOrigin = 'anonymous';
  photo.src = photoUrl;
  await photo.decode();

  const [landmarks] = (await photoPose).detect(photo).landmarks;
  const needed =
    fit.anchor === 'shoulders'
      ? [POSE.leftShoulder, POSE.rightShoulder, POSE.leftHip, POSE.rightHip]
      : [POSE.leftHip, POSE.rightHip, POSE.leftKnee, POSE.rightKnee];
  if (!landmarks || needed.some((index) => (landmarks[index].visibility ?? 1) < 0.5)) return null;

  // Photo shares -> cut-out shares, then cut-out pixels.
  const { x, y, width, height } = fit.source;
  const inCutout = landmarks.map((point) => ({
    x: (point.x - x) / width,
    y: (point.y - y) / height,
  }));
  return bodyPoints(inCutout, fit.anchor, fit.width, fit.height);
}

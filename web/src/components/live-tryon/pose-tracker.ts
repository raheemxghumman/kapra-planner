import { FilesetResolver, PoseLandmarker } from '@mediapipe/tasks-vision';

/**
 * Google's pre-trained pose model ("lite": about 6 MB, 30+ frames a second on a phone).
 * It runs entirely in the browser; camera frames never leave the device.
 */
const MODEL_URL =
  'https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task';

/**
 * Loads MediaPipe Pose. Its WebAssembly runtime is served from our own site (copied into
 * public/mediapipe by scripts/copy-mediapipe.mjs), so the Content Security Policy does not have
 * to trust another script host. The GPU is used when the browser allows it, otherwise the CPU.
 */
export async function createPoseTracker(): Promise<PoseLandmarker> {
  const simd = await FilesetResolver.isSimdSupported();
  const runtime = simd ? 'vision_wasm_internal' : 'vision_wasm_nosimd_internal';
  const fileset = {
    wasmLoaderPath: `/mediapipe/${runtime}.js`,
    wasmBinaryPath: `/mediapipe/${runtime}.wasm`,
  };
  const create = (delegate: 'GPU' | 'CPU') =>
    PoseLandmarker.createFromOptions(fileset, {
      baseOptions: { modelAssetPath: MODEL_URL, delegate },
      runningMode: 'VIDEO',
      numPoses: 1,
    });
  try {
    return await create('GPU');
  } catch {
    return create('CPU');
  }
}

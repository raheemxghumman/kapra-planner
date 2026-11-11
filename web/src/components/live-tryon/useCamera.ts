import { useEffect, useState, type RefObject } from 'react';

export type CameraState =
  { status: 'starting' } | { status: 'ready' } | { status: 'error'; message: string };

/** Turns the browser's camera errors into something a shopper can act on. */
function cameraError(error: unknown): string {
  const name = error instanceof DOMException ? error.name : '';
  if (name === 'NotAllowedError')
    return 'Camera access was blocked. Allow the camera from the address bar, then try again.';
  if (name === 'NotFoundError' || name === 'OverconstrainedError')
    return 'No camera was found on this device.';
  if (name === 'NotReadableError')
    return 'Another app is using the camera. Close it and try again.';
  return 'The camera could not be started.';
}

/**
 * Streams the camera into a <video> element. `facing` picks the front ("user") or back
 * ("environment") camera; changing it restarts the stream. The camera is switched off when the
 * component unmounts, so the light goes off as soon as the user leaves the page.
 */
export function useCamera(
  videoRef: RefObject<HTMLVideoElement | null>,
  facing: 'user' | 'environment',
): CameraState {
  // The state remembers which camera it belongs to, so switching cameras reads as "starting"
  // until the new stream is ready, without resetting state inside the effect.
  const [current, setCurrent] = useState<{ facing: string; state: CameraState } | null>(null);
  const supported = Boolean(navigator.mediaDevices?.getUserMedia);

  useEffect(() => {
    if (!supported) return;
    let stream: MediaStream | null = null;
    let cancelled = false;
    const report = (state: CameraState) => !cancelled && setCurrent({ facing, state });

    navigator.mediaDevices
      .getUserMedia({
        video: { facingMode: facing, width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      })
      .then(async (opened) => {
        if (cancelled) return opened.getTracks().forEach((track) => track.stop());
        stream = opened;
        const video = videoRef.current;
        if (!video) return;
        video.srcObject = opened;
        await video.play();
        report({ status: 'ready' });
      })
      .catch((error: unknown) => report({ status: 'error', message: cameraError(error) }));

    return () => {
      cancelled = true;
      stream?.getTracks().forEach((track) => track.stop());
    };
  }, [videoRef, facing, supported]);

  if (!supported) {
    return {
      status: 'error',
      message: 'This browser cannot open the camera here. Use a recent Chrome, Safari or Edge.',
    };
  }
  return current?.facing === facing ? current.state : { status: 'starting' };
}

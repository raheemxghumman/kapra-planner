import type { Rect } from './fit';

/** The real-time try-on server (realtime-tryon/server.py: DM-VTON on a GPU). */
export const AI_SERVER_URL: string =
  import.meta.env.VITE_REALTIME_TRYON_URL ?? 'ws://localhost:8765';

/** DM-VTON's picture size. */
const INPUT_WIDTH = 192;
const INPUT_HEIGHT = 256;

export type AiStatus = 'connecting' | 'ready' | 'unavailable';

/** A try-on picture from the server and where it belongs in the camera picture. */
export interface AiFrame {
  image: ImageBitmap;
  crop: Rect;
  /** performance.now() when it arrived. */
  receivedAt: number;
}

/** Frames sent but not yet answered; two keep the GPU busy without adding lag. */
const MAX_IN_FLIGHT = 2;

/** An AI picture older than this no longer matches the moving person, so it is not shown. */
export const AI_FRAME_MAX_AGE_MS = 400;

/**
 * Streams the user's upper body to the real-time try-on server and keeps the latest result.
 * At most two frames are "in flight": while the GPU works on one, the next is already on its
 * way, so the GPU never waits; a slower GPU lowers the frame rate instead of building up a delay.
 *
 * Frames travel as raw RGB pixels (192 x 256 x 3 = 147 KB), not JPEG: Chrome's canvas JPEG
 * encoder (toBlob) took about a second per frame while the GPU was busy, and decoding the reply
 * another 100 ms, against 45 ms for the AI itself. Raw pixels are read and drawn in about 1 ms.
 */
export class AiTryOnStream {
  latest: AiFrame | null = null;
  /** Results per second, measured over the last second. */
  fps = 0;

  private readonly socket: WebSocket;
  private readonly input = document.createElement('canvas');
  // CPU-backed, so reading its pixels back is cheap.
  private readonly inputContext = this.input.getContext('2d', { willReadFrequently: true })!;
  private readonly person = document.createElement('canvas');
  private garmentUrl: string;
  private garmentReady = false;
  /** Crops of the frames sent and not yet answered, oldest first (answers come back in order). */
  private inFlight: Rect[] = [];
  private resultTimes: number[] = [];

  constructor(garmentUrl: string, onStatus: (status: AiStatus) => void) {
    this.garmentUrl = garmentUrl;
    this.input.width = this.person.width = INPUT_WIDTH;
    this.input.height = this.person.height = INPUT_HEIGHT;

    onStatus('connecting');
    this.socket = new WebSocket(AI_SERVER_URL);
    this.socket.binaryType = 'arraybuffer';
    this.socket.onopen = () => this.sendGarment();
    this.socket.onerror = () => onStatus('unavailable');
    this.socket.onclose = () => onStatus('unavailable');
    this.socket.onmessage = (event: MessageEvent<string | ArrayBuffer>) => {
      if (typeof event.data === 'string') {
        const reply = JSON.parse(event.data) as { ready: boolean };
        this.garmentReady = reply.ready;
        onStatus(reply.ready ? 'ready' : 'unavailable');
        return;
      }
      const crop = this.inFlight.shift();
      if (!crop) return;
      void createImageBitmap(rgbToImageData(new Uint8Array(event.data))).then((image) => {
        const now = performance.now();
        this.latest?.image.close();
        this.latest = { image, crop, receivedAt: now };
        this.resultTimes = [...this.resultTimes.filter((time) => now - time < 1_000), now];
        this.fps = this.resultTimes.length;
      });
    };
  }

  /** The latest AI picture if it is fresh enough to show, otherwise null. */
  fresh(): AiFrame | null {
    return this.latest && performance.now() - this.latest.receivedAt < AI_FRAME_MAX_AGE_MS
      ? this.latest
      : null;
  }

  setGarment(url: string): void {
    if (url === this.garmentUrl) return;
    this.garmentUrl = url;
    this.garmentReady = false;
    this.latest = null;
    this.inFlight = [];
    this.sendGarment();
  }

  /**
   * Sends the crop of the camera picture, with everything but the person painted white (the
   * model learned from studio photos on white). `personMask` is a small canvas of the whole
   * picture whose opaque pixels are the person.
   */
  send(video: HTMLVideoElement, crop: Rect, personMask: HTMLCanvasElement | null): void {
    if (
      !this.garmentReady ||
      this.inFlight.length >= MAX_IN_FLIGHT ||
      this.socket.readyState !== WebSocket.OPEN
    )
      return;
    this.inFlight.push(crop);

    const person = this.person.getContext('2d')!;
    person.globalCompositeOperation = 'source-over';
    person.clearRect(0, 0, INPUT_WIDTH, INPUT_HEIGHT);
    person.drawImage(
      video,
      crop.x,
      crop.y,
      crop.width,
      crop.height,
      0,
      0,
      INPUT_WIDTH,
      INPUT_HEIGHT,
    );
    if (personMask) {
      const scale = personMask.width / video.videoWidth;
      person.globalCompositeOperation = 'destination-in';
      person.drawImage(
        personMask,
        crop.x * scale,
        crop.y * scale,
        crop.width * scale,
        crop.height * scale,
        0,
        0,
        INPUT_WIDTH,
        INPUT_HEIGHT,
      );
    }

    const input = this.inputContext;
    input.fillStyle = '#ffffff';
    input.fillRect(0, 0, INPUT_WIDTH, INPUT_HEIGHT);
    input.drawImage(this.person, 0, 0);
    const rgba = input.getImageData(0, 0, INPUT_WIDTH, INPUT_HEIGHT).data;
    this.socket.send(rgbaToRgb(rgba));
  }

  close(): void {
    this.socket.onclose = null;
    this.socket.close();
    this.latest?.image.close();
  }

  private sendGarment(): void {
    if (this.socket.readyState === WebSocket.OPEN)
      this.socket.send(JSON.stringify({ garment: this.garmentUrl }));
  }
}

/** Drops the alpha channel: RGBA (canvas) -> RGB (what the server expects). */
function rgbaToRgb(rgba: Uint8ClampedArray): Uint8Array<ArrayBuffer> {
  const rgb = new Uint8Array((rgba.length / 4) * 3);
  for (let i = 0, j = 0; i < rgba.length; i += 4, j += 3) {
    rgb[j] = rgba[i];
    rgb[j + 1] = rgba[i + 1];
    rgb[j + 2] = rgba[i + 2];
  }
  return rgb;
}

/** RGB from the server -> an opaque ImageData of DM-VTON's size. */
function rgbToImageData(rgb: Uint8Array): ImageData {
  const rgba = new Uint8ClampedArray(INPUT_WIDTH * INPUT_HEIGHT * 4);
  for (let i = 0, j = 0; j < rgb.length; i += 4, j += 3) {
    rgba[i] = rgb[j];
    rgba[i + 1] = rgb[j + 1];
    rgba[i + 2] = rgb[j + 2];
    rgba[i + 3] = 255;
  }
  return new ImageData(rgba, INPUT_WIDTH, INPUT_HEIGHT);
}

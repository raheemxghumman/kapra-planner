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
}

/**
 * Streams the user's upper body to the real-time try-on server and keeps the latest result.
 * Only one frame is "in flight" at a time: the next is sent when the previous comes back, so a
 * slower GPU lowers the frame rate instead of building up a delay.
 */
export class AiTryOnStream {
  latest: AiFrame | null = null;
  /** Results per second, measured over the last second. */
  fps = 0;

  private readonly socket: WebSocket;
  private readonly input = document.createElement('canvas');
  private readonly person = document.createElement('canvas');
  private garmentUrl: string;
  private garmentReady = false;
  private inFlight: Rect | null = null;
  private resultTimes: number[] = [];

  constructor(garmentUrl: string, onStatus: (status: AiStatus) => void) {
    this.garmentUrl = garmentUrl;
    this.input.width = this.person.width = INPUT_WIDTH;
    this.input.height = this.person.height = INPUT_HEIGHT;

    onStatus('connecting');
    this.socket = new WebSocket(AI_SERVER_URL);
    this.socket.binaryType = 'blob';
    this.socket.onopen = () => this.sendGarment();
    this.socket.onerror = () => onStatus('unavailable');
    this.socket.onclose = () => onStatus('unavailable');
    this.socket.onmessage = (event: MessageEvent<string | Blob>) => {
      if (typeof event.data === 'string') {
        const reply = JSON.parse(event.data) as { ready: boolean };
        this.garmentReady = reply.ready;
        onStatus(reply.ready ? 'ready' : 'unavailable');
        return;
      }
      const crop = this.inFlight;
      this.inFlight = null;
      if (!crop) return;
      void createImageBitmap(event.data).then((image) => {
        this.latest?.image.close();
        this.latest = { image, crop };
        const now = performance.now();
        this.resultTimes = [...this.resultTimes.filter((time) => now - time < 1_000), now];
        this.fps = this.resultTimes.length;
      });
    };
  }

  setGarment(url: string): void {
    if (url === this.garmentUrl) return;
    this.garmentUrl = url;
    this.garmentReady = false;
    this.latest = null;
    this.sendGarment();
  }

  /**
   * Sends the crop of the camera picture, with everything but the person painted white (the
   * model learned from studio photos on white). `personMask` is a small canvas of the whole
   * picture whose opaque pixels are the person.
   */
  send(video: HTMLVideoElement, crop: Rect, personMask: HTMLCanvasElement | null): void {
    if (!this.garmentReady || this.inFlight || this.socket.readyState !== WebSocket.OPEN) return;
    this.inFlight = crop;

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

    const input = this.input.getContext('2d')!;
    input.fillStyle = '#ffffff';
    input.fillRect(0, 0, INPUT_WIDTH, INPUT_HEIGHT);
    input.drawImage(this.person, 0, 0);
    this.input.toBlob(
      (blob) => {
        if (blob && this.socket.readyState === WebSocket.OPEN) this.socket.send(blob);
        else this.inFlight = null;
      },
      'image/jpeg',
      0.85,
    );
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

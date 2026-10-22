import { CanvasTexture, RepeatWrapping, SRGBColorSpace } from 'three';

const TILE = 256;

/**
 * Draws a block-print motif (like Pakistani lawn prints) on a canvas and turns it into a
 * repeating texture. Generating it in code means no image download and a crisp result
 * at any size.
 */
export function createPrintTexture(): CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = TILE;
  canvas.height = TILE;
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('2D canvas is not supported');
  }

  // Base cloth colour.
  ctx.fillStyle = '#efe4d6';
  ctx.fillRect(0, 0, TILE, TILE);

  // Four-petal flower in the middle and on the corners, so the tile repeats seamlessly.
  const flower = (cx: number, cy: number, size: number) => {
    ctx.fillStyle = '#4f5a3a';
    for (let petal = 0; petal < 4; petal++) {
      const angle = (petal * Math.PI) / 2;
      ctx.beginPath();
      ctx.ellipse(
        cx + Math.cos(angle) * size,
        cy + Math.sin(angle) * size,
        size * 0.9,
        size * 0.45,
        angle,
        0,
        Math.PI * 2,
      );
      ctx.fill();
    }
    ctx.fillStyle = '#c98f7f';
    ctx.beginPath();
    ctx.arc(cx, cy, size * 0.55, 0, Math.PI * 2);
    ctx.fill();
  };
  flower(TILE / 2, TILE / 2, 22);
  for (const [x, y] of [
    [0, 0],
    [TILE, 0],
    [0, TILE],
    [TILE, TILE],
  ]) {
    flower(x, y, 22);
  }

  // Small dots between the flowers.
  ctx.fillStyle = '#7a8a5c';
  for (const [x, y] of [
    [TILE / 2, 0],
    [0, TILE / 2],
    [TILE / 2, TILE],
    [TILE, TILE / 2],
  ]) {
    ctx.beginPath();
    ctx.arc(x, y, 6, 0, Math.PI * 2);
    ctx.fill();
  }

  const texture = new CanvasTexture(canvas);
  texture.wrapS = RepeatWrapping;
  texture.wrapT = RepeatWrapping;
  texture.repeat.set(3, 4);
  texture.colorSpace = SRGBColorSpace;
  texture.anisotropy = 8;
  return texture;
}

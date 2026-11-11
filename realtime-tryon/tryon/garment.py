"""Turns a Kapra garment cut-out (transparent WebP/PNG) into DM-VTON's garment inputs.

DM-VTON learned from VITON product photos: the garment alone, centred on a white 192x256
background and filling most of it, plus an "edge" mask marking the garment's pixels. A Kapra
cut-out already is the garment alone, so we only place it like a VITON photo.
"""

import io
import urllib.request

import numpy as np
from PIL import Image

from .model import HEIGHT, WIDTH

# VITON garments fill about 85% of the frame's width or 90% of its height.
FILL_WIDTH, FILL_HEIGHT = 0.85, 0.9


def load_cutout(url: str) -> Image.Image:
    request = urllib.request.Request(url, headers={"User-Agent": "KapraPlanner/1.0 (realtime try-on)"})
    with urllib.request.urlopen(request, timeout=30) as response:
        return Image.open(io.BytesIO(response.read())).convert("RGBA")


def prepare(cutout: Image.Image) -> tuple[np.ndarray, np.ndarray]:
    """Returns (garment 256x192x3 uint8 on white, edge 256x192 uint8 with 255 = garment)."""
    scale = min(FILL_WIDTH * WIDTH / cutout.width, FILL_HEIGHT * HEIGHT / cutout.height)
    size = (max(1, round(cutout.width * scale)), max(1, round(cutout.height * scale)))
    garment = cutout.resize(size, Image.LANCZOS)

    canvas = Image.new("RGBA", (WIDTH, HEIGHT), (255, 255, 255, 0))
    canvas.paste(garment, ((WIDTH - size[0]) // 2, (HEIGHT - size[1]) // 2), garment)

    rgba = np.asarray(canvas)
    alpha = rgba[:, :, 3]
    rgb = np.where(alpha[:, :, None] > 127, rgba[:, :, :3], 255).astype(np.uint8)
    edge = np.where(alpha > 127, 255, 0).astype(np.uint8)
    return rgb, edge

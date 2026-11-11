"""Real-time try-on server: the Kapra website streams camera frames here and gets back frames
with the garment drawn onto the person by DM-VTON, running on this computer's GPU.

Protocol (one WebSocket per shopper):
  text   {"garment": "<cut-out URL>"}        -> text {"ready": true} once the garment is prepared
  binary raw RGB, 192x256 person crop (147 KB) -> binary raw RGB, 192x256 try-on result
Raw pixels, not JPEG: the browser's JPEG encoder was far slower than the AI itself.
The website sends the next frame only after receiving a result, so a slow GPU lowers the frame
rate instead of building up a queue.

Run:  .venv\\Scripts\\python server.py      (listens on ws://localhost:8765)
"""

import asyncio
import json
import logging
import os
import time

import numpy as np
import torch
import websockets

from tryon import garment as garments
from tryon.model import HEIGHT, WIDTH, TryOnModel

PORT = int(os.environ.get("PORT", "8765"))
# Only the Kapra website may connect (a browser sends its page's origin with every WebSocket).
ALLOWED_ORIGINS = os.environ.get(
    "ALLOWED_ORIGINS",
    "http://localhost:3000,http://localhost:5173,https://kapra-planner-app.alternatefutures.ai",
).split(",")

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(message)s")
log = logging.getLogger("tryon")

model = TryOnModel()
log.info("DM-VTON loaded on %s", model.device)


FRAME_BYTES = HEIGHT * WIDTH * 3


async def session(websocket) -> None:
    garment_tensor = edge_tensor = None
    frames, started = 0, time.perf_counter()

    async for message in websocket:
        if isinstance(message, str):
            # A new garment: download the cut-out and prepare it once for every frame after.
            url = json.loads(message).get("garment", "")
            try:
                rgb, edge = await asyncio.to_thread(lambda: garments.prepare(garments.load_cutout(url)))
                garment_tensor = TryOnModel.to_tensor(rgb).to(model.device)
                edge_tensor = torch.from_numpy(edge).float().div(255).view(1, 1, HEIGHT, WIDTH).to(model.device)
                await websocket.send(json.dumps({"ready": True}))
            except Exception as error:  # a bad URL must not stop the server
                log.warning("Could not load garment %s: %s", url, error)
                await websocket.send(json.dumps({"ready": False, "error": "Could not load this garment"}))
            continue

        if garment_tensor is None or len(message) != FRAME_BYTES:
            continue
        person = TryOnModel.to_tensor(np.frombuffer(message, dtype=np.uint8).reshape(HEIGHT, WIDTH, 3).copy())
        result = await asyncio.to_thread(model, person, garment_tensor, edge_tensor)
        await websocket.send(result.tobytes())

        frames += 1
        if frames % 100 == 0:
            log.info("%.1f frames a second", frames / (time.perf_counter() - started))


async def main() -> None:
    async with websockets.serve(session, "localhost", PORT, origins=ALLOWED_ORIGINS, max_size=FRAME_BYTES + 1024):
        log.info("Listening on ws://localhost:%d", PORT)
        await asyncio.Future()  # run until stopped


if __name__ == "__main__":
    asyncio.run(main())

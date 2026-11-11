"""Loads DM-VTON (Distilled Mobile Real-time Virtual Try-On, ISMAR 2023) for inference.

The model has two parts:
1. a warping module that predicts how to bend the flat garment so it follows the person's body
   (an "appearance flow": for every output pixel, where to take the garment pixel from);
2. a small generator (MobileNetV2 U-Net) that blends the warped garment into the person's
   photo and repaints the arms and neck around it.

DM-VTON's code is cloned into vendor/DM-VTON by setup.py (CC BY-NC-SA 4.0: academic use only).
"""

import sys
import threading
import types
from pathlib import Path

import numpy as np
import torch

from . import correlation

ROOT = Path(__file__).resolve().parent.parent
VENDOR = ROOT / "vendor" / "DM-VTON"
CHECKPOINTS = ROOT / "checkpoints"

# DM-VTON works on 256x192 (height x width) images, the size of the VITON dataset it learned from.
HEIGHT, WIDTH = 256, 192


def _import_pipeline():
    """Imports DM-VTON's pipeline with our PyTorch correlation in place of its cupy kernel."""
    sys.path.insert(0, str(VENDOR))
    swap = types.ModuleType("models.common.correlation")
    swap.FunctionCorrelation = correlation.FunctionCorrelation
    sys.modules["models.common.correlation"] = swap
    from pipelines import DMVTONPipeline  # noqa: E402  (needs the path set above)

    return DMVTONPipeline


def _allow_checkpoint_metadata() -> None:
    """The checkpoints store a few numpy numbers (training metadata). PyTorch only unpickles
    types it is told are safe, so we allow exactly those instead of turning the check off."""
    # The checkpoints were saved with numpy 1, whose module was numpy.core (numpy 2: numpy._core).
    torch.serialization.add_safe_globals(
        [
            (np._core.multiarray.scalar, "numpy.core.multiarray.scalar"),
            np.dtype,
            type(np.dtype(np.float64)),
        ]
    )


class TryOnModel:
    """DM-VTON ready for video: on a GPU the whole network is recorded once as a CUDA graph and
    replayed for every frame. Launching its hundreds of small GPU operations one by one from
    Python took twice as long as the maths itself (66 ms -> 33 ms per frame on an RTX 2070)."""

    def __init__(self, device: str | None = None) -> None:
        self.device = device or ("cuda" if torch.cuda.is_available() else "cpu")
        _allow_checkpoint_metadata()
        pipeline = _import_pipeline()
        self.pipeline = pipeline(
            align_corners=True,
            checkpoints={
                "warp": str(CHECKPOINTS / "dmvton_pf_warp.pt"),
                "gen": str(CHECKPOINTS / "dmvton_pf_gen.pt"),
            },
        ).to(self.device)
        self.pipeline.eval()
        # One graph and one set of input buffers, so one frame at a time.
        self._lock = threading.Lock()
        self._graph: torch.cuda.CUDAGraph | None = None
        self._inputs = [
            torch.zeros(1, 3, HEIGHT, WIDTH, device=self.device),
            torch.zeros(1, 3, HEIGHT, WIDTH, device=self.device),
            torch.zeros(1, 1, HEIGHT, WIDTH, device=self.device),
        ]
        self._output: torch.Tensor | None = None

    @staticmethod
    def to_tensor(rgb: np.ndarray) -> torch.Tensor:
        """HxWx3 uint8 -> 1x3xHxW float in [-1, 1], the range the model was trained on."""
        return torch.from_numpy(rgb).permute(2, 0, 1).float().div(127.5).sub(1).unsqueeze(0)

    def _run(self) -> torch.Tensor:
        person, garment, edge = self._inputs
        return self.pipeline(person, garment, edge, phase="test")[0]

    def _record_graph(self) -> None:
        # Warm up on a side stream (as PyTorch requires), then record one run.
        stream = torch.cuda.Stream()
        stream.wait_stream(torch.cuda.current_stream())
        with torch.cuda.stream(stream):
            for _ in range(3):
                self._run()
        torch.cuda.current_stream().wait_stream(stream)
        self._graph = torch.cuda.CUDAGraph()
        with torch.cuda.graph(self._graph):
            self._output = self._run()

    @torch.inference_mode()
    def __call__(self, person: torch.Tensor, garment: torch.Tensor, edge: torch.Tensor) -> np.ndarray:
        """person and garment: 1x3x256x192 in [-1, 1]; edge: 1x1x256x192 in [0, 1].
        Returns the try-on picture as 256x192x3 uint8."""
        with self._lock:
            for buffer, value in zip(self._inputs, (person, garment, edge)):
                buffer.copy_(value)
            if self.device == "cuda":
                if self._graph is None:
                    self._record_graph()
                self._graph.replay()
                result = self._output
            else:
                result = self._run()
            image = result[0].clamp(-1, 1).add(1).mul(127.5).permute(1, 2, 0)
            return image.byte().cpu().numpy()

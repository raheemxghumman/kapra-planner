"""Cost volume (correlation) used by DM-VTON's warping module, in plain PyTorch.

DM-VTON ships this as a hand-written CUDA kernel run through `cupy`, which needs the full CUDA
toolkit. The maths is simple, so we compute it with ordinary tensor operations instead: for
every offset (dx, dy) in a 7x7 window, multiply the first feature map by the second one shifted
by that offset and average over the channels. The result has 49 channels, one per offset,
ordered (dy + 3) * 7 + (dx + 3), exactly like the original kernel.
"""

import torch
import torch.nn.functional as F

RADIUS = 3  # offsets from -3 to +3 in each direction


def correlation(first: torch.Tensor, second: torch.Tensor, stride: int = 1) -> torch.Tensor:
    pad = RADIUS * stride
    padded = F.pad(second, (pad, pad, pad, pad))
    height, width = first.shape[2], first.shape[3]
    anchor = first[:, :, ::stride, ::stride]

    volumes = []
    for dy in range(-RADIUS, RADIUS + 1):
        for dx in range(-RADIUS, RADIUS + 1):
            top = pad + dy * stride
            left = pad + dx * stride
            shifted = padded[:, :, top : top + height : stride, left : left + width : stride]
            volumes.append((anchor * shifted).mean(dim=1, keepdim=True))
    return torch.cat(volumes, dim=1)


def FunctionCorrelation(tenFirst: torch.Tensor, tenSecond: torch.Tensor, intStride: int) -> torch.Tensor:  # noqa: N802, N803
    """Same name and arguments as DM-VTON's cupy version, so it can be swapped in."""
    return correlation(tenFirst, tenSecond, intStride)

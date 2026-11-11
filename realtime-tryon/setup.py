"""One-time setup: fetches DM-VTON's code (pinned to a known commit) and its pretrained weights.

Run:  .venv\\Scripts\\python setup.py
Nothing here is committed to Kapra's repository: vendor/ and checkpoints/ are git-ignored.
"""

import subprocess
from pathlib import Path

import gdown

ROOT = Path(__file__).resolve().parent
VENDOR = ROOT / "vendor" / "DM-VTON"
CHECKPOINTS = ROOT / "checkpoints"

REPOSITORY = "https://github.com/KiseKloset/DM-VTON.git"
COMMIT = "5dcd04ee3f5b1fb392df1184c887c1a7e910c72e"
# The authors' Google Drive folder with the pretrained checkpoints (see DM-VTON's README).
WEIGHTS_FOLDER = "https://drive.google.com/drive/folders/1wfWGsR0vWC5LrA26xhj92ec_GoCKV80A"
NEEDED = ["dmvton_pf_warp.pt", "dmvton_pf_gen.pt"]


def main() -> None:
    if not VENDOR.exists():
        subprocess.run(["git", "clone", REPOSITORY, str(VENDOR)], check=True)
    subprocess.run(["git", "-C", str(VENDOR), "checkout", "--quiet", COMMIT], check=True)

    if not all((CHECKPOINTS / name).exists() for name in NEEDED):
        downloaded = gdown.download_folder(WEIGHTS_FOLDER, output=str(CHECKPOINTS / "_download"), quiet=False)
        for path in map(Path, downloaded or []):
            if path.name in NEEDED:
                path.replace(CHECKPOINTS / path.name)
    missing = [name for name in NEEDED if not (CHECKPOINTS / name).exists()]
    if missing:
        raise SystemExit(f"Missing checkpoints: {missing}. Download them from {WEIGHTS_FOLDER}")
    print("Ready: DM-VTON code and weights are in place.")


if __name__ == "__main__":
    main()

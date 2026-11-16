import sys
import numpy as np
from PIL import Image

def cells(path, grid=4, size=(256, 256)):
    img = Image.open(path).convert("RGB").resize(size, Image.Resampling.LANCZOS).convert("HSV")
    hsv = np.asarray(img).astype(float) / 255.0
    h, w = hsv.shape[:2]
    out = []
    for y in range(grid):
        for x in range(grid):
            c = hsv[y * h // grid:(y + 1) * h // grid, x * w // grid:(x + 1) * w // grid]
            out.append((c[..., 1].mean(), c[..., 2].mean()))
    return np.array(out)

if __name__ == "__main__":
    ref_path, ren_path = sys.argv[1], sys.argv[2]
    ref_img = Image.open(ref_path)
    w, h = ref_img.size
    scale = 256 / max(w, h)
    target_size = (max(32, int(w * scale)), max(32, int(h * scale)))
    d = cells(ren_path, grid=4, size=target_size) - cells(ref_path, grid=4, size=target_size)
    for name, col in (("saturation", 0), ("brightness", 1)):
        worst = d[np.abs(d[:, col]).argmax(), col]
        print(f"{name}: mean delta {d[:, col].mean():+.3f}, worst cell {worst:+.3f}")

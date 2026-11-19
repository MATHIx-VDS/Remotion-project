"""Background plates for the textile spot: computed in float, +-1 LSB TPDF dither, quantised once
(no CSS gradients: they band at 8 bits). python3 tools/plates.py -> public/fx/*.png"""
import cv2, numpy as np
rng = np.random.default_rng(7)
W, H = 1300, 2300  # overscan for the camera's parallax
y, x = np.mgrid[0:H, 0:W].astype(np.float32)
u, v = x / W, y / H
ORANGE = np.array([238, 106, 58], np.float32) / 255  # brand orange (RGB)
def save(name, rgb, a=None):
    rgb = np.clip(rgb * 255 + rng.triangular(-1, 0, 1, rgb.shape), 0, 255).astype(np.uint8)
    out = cv2.cvtColor(rgb, cv2.COLOR_RGB2BGR)
    if a is not None:
        aa = np.clip(a * 255 + rng.triangular(-1, 0, 1, a.shape), 0, 255).astype(np.uint8)
        out = np.dstack([out, aa])
    cv2.imwrite(f'public/fx/{name}.png', out)
def blob(cx, cy, rx, ry):
    return np.exp(-(((u - cx) / rx) ** 2 + ((v - cy) / ry) ** 2))
# the room: black walls, a warm orange pool of light behind the garment, a warm floor
base = np.full((H, W, 3), 0.03, np.float32) * np.array([1.0, 0.96, 0.95])
base *= (0.75 + 0.35 * (1 - v))[..., None]
base += ORANGE * (0.17 * blob(0.5, 0.46, 0.36, 0.22) + 0.05 * blob(0.15, 0.30, 0.22, 0.28))[..., None]
base += ORANGE * (0.09 * blob(0.5, 1.02, 0.6, 0.12))[..., None]
save('room', base)
# a spotlight cone from above, slightly right: soft beam (alpha plate, warm white)
ang = np.arctan2(u - 0.62, v + 0.05)
beam = np.exp(-((ang + 0.05) / 0.16) ** 2) * np.clip(1.15 - v, 0, 1) ** 1.5
save('beam', np.ones((H, W, 3), np.float32) * np.array([1.0, 0.92, 0.82]), 0.20 * beam)
# haze: smooth noise at two scales, as alpha
def smooth(scale):
    n = rng.random((H // scale + 2, W // scale + 2)).astype(np.float32)
    return cv2.resize(cv2.GaussianBlur(n, (0, 0), 1.5), (W, H), interpolation=cv2.INTER_CUBIC)
haze = 0.6 * smooth(160) + 0.4 * smooth(60)
haze = np.clip((haze - haze.min()) / (haze.max() - haze.min()), 0, 1) ** 2
save('haze', np.ones((H, W, 3), np.float32) * np.array([1.0, 0.85, 0.75]), 0.11 * haze * (0.4 + 0.6 * blob(0.55, 0.45, 0.6, 0.5)))
print('plates ok')

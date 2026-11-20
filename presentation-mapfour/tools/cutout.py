"""Cut out MAP FOUR studio shots (light grey background) into transparent PNGs.
python3 tools/cutout.py <in> <out> [max_width]"""
import cv2, numpy as np, sys
src, dst = sys.argv[1], sys.argv[2]
maxw = int(sys.argv[3]) if len(sys.argv) > 3 else 1800
im = cv2.imread(src, cv2.IMREAD_UNCHANGED)
if im.ndim == 3 and im.shape[2] == 4 and (im[..., 3] < 10).mean() > 0.3:
    out = im  # already transparent
else:
    c = im[..., :3].astype(np.float32)
    border = np.r_[c[:8].reshape(-1, 3), c[-8:].reshape(-1, 3), c[:, :8].reshape(-1, 3), c[:, -8:].reshape(-1, 3)]
    bg = np.median(border, 0)
    d = np.where(c < bg, (bg - c) / np.maximum(bg, 1), (c - bg) / np.maximum(255 - bg, 1))
    a2 = np.clip(d.max(2) * 1.35 - 0.04, 0, 1)
    solid = (np.abs(c - bg).max(2) > 45).astype(np.uint8)
    nl, lab, st, _ = cv2.connectedComponentsWithStats(solid)
    keep = [i for i in range(1, nl) if st[i, cv2.CC_STAT_AREA] >= 400]
    obj = np.isin(lab, keep).astype(np.uint8)
    core = cv2.erode(obj, np.ones((3, 3), np.uint8))
    near = cv2.dilate(obj, np.ones((25, 25), np.uint8))
    a = np.maximum(a2, core.astype(np.float32)) * near
    aa = np.maximum(a, 1e-3)[..., None]
    col = np.where(a[..., None] > 0.98, c, np.clip((c - bg * (1 - aa)) / aa, 0, 255))
    out = np.dstack([col, a * 255]).astype(np.uint8)
ys, xs = np.where(out[..., 3] > 12)
out = out[max(0, ys.min() - 4):ys.max() + 5, max(0, xs.min() - 4):xs.max() + 5]
if out.shape[1] > maxw:
    s = maxw / out.shape[1]
    out = cv2.resize(out, (maxw, int(out.shape[0] * s)), interpolation=cv2.INTER_AREA)
cv2.imwrite(dst, out)
print(dst, out.shape)

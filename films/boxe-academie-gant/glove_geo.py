"""Boxing glove geometry from a signed distance field, modelled on the client's reference photo
(classic 16 oz: knuckle padding curled over the palm, thumb stitched along the side, deep grip
opening, straight cuff band; laced on the palm side). Metres, Z up = cuff opening, -Y = palm.

Writes glove.npz: leather shell (marching cubes, with real wrinkles in the geometry), welts,
stitch lines (as polylines + normals), eyelets. Pure numpy/scikit-image.
"""
import sys

import numpy as np
from skimage import measure

VOX = 0.0016


def smin(a, b, k):
    h = np.clip(0.5 + 0.5 * (b - a) / k, 0, 1)
    return b * (1 - h) + a * h - k * h * (1 - h)


def smax(a, b, k):
    return -smin(-a, -b, k)


def ellipsoid(p, c, r):
    q = (p - c) / r
    k0 = np.linalg.norm(q, axis=-1)
    k1 = np.linalg.norm(q / r, axis=-1)
    return k0 * (k0 - 1) / np.maximum(k1, 1e-9)


def capsule(p, a, b, ra, rb):
    pa, ba = p - a, b - a
    h = np.clip((pa @ ba) / (ba @ ba), 0, 1)
    return np.linalg.norm(pa - h[..., None] * ba, axis=-1) - (ra + (rb - ra) * h)


CUFF_Z = (0.030, 0.205)


def cuff_r(z):
    t = np.clip((z - CUFF_Z[0]) / (CUFF_Z[1] - CUFF_Z[0]), 0, 1)
    return 0.059 + 0.003 * t, 0.053 + 0.002 * t


def cuff(p):
    x, y, z = p[..., 0], p[..., 1], p[..., 2]
    rx, ry = cuff_r(z)
    e = 2.7  # a squarish band, like the reference
    d = ((np.abs(x / rx) ** e + np.abs(y / ry) ** e) ** (1 / e) - 1) * np.minimum(rx, ry)
    cap = np.maximum(z - CUFF_Z[1], CUFF_Z[0] - 0.06 - z)
    return smax(d, cap, 0.006)


THUMB = (np.array([0.060, -0.036, 0.040]), np.array([0.052, -0.058, -0.056]), 0.025, 0.023)


def thumb(p):
    a, b, ra, rb = THUMB
    return capsule(p, a, b, ra, rb)


def hand_shell(p):
    back = ellipsoid(p, np.array([0.0, 0.012, -0.045]), np.array([0.082, 0.064, 0.118]))
    lid = ellipsoid(p, np.array([0.0, -0.028, -0.104]), np.array([0.080, 0.066, 0.066]))
    d = smin(back, lid, 0.02)
    # the palm pocket under the curled padding
    pocket = ellipsoid(p, np.array([0.004, -0.098, 0.002]), np.array([0.060, 0.050, 0.056]))
    d = smax(d, -pocket, 0.012)
    return d


def body(p):
    return smin(hand_shell(p), cuff(p), 0.028)


def wrinkle(p):
    """Leather creases: sharp, irregular folds on the palm side and the sides, soft bulges between."""
    x, y, z = p[..., 0], p[..., 1], p[..., 2]
    ph = 0.006 * np.sin(x * 70 + 1.3) + 0.003 * np.sin(x * 190 + z * 50) + 0.0015 * np.sin(x * 420 - z * 90)
    u = (z + ph) * 2 * np.pi / 0.0125
    crease = (1 - np.abs(np.sin(u))) ** 5
    u2 = (z * 0.8 + 0.3 * x + ph * 1.7) * 2 * np.pi / 0.0078
    crease2 = (1 - np.abs(np.sin(u2))) ** 6
    env = np.clip(0.55 + 0.45 * np.sin(x * 61 + z * 37) * np.sin(x * 33 - z * 71 + 1.0), 0, 1)
    palm = np.clip((-y - 0.012) / 0.02, 0, 1) * np.clip((z + 0.048) / 0.012, 0, 1) * np.clip((0.04 - z) / 0.02, 0, 1)
    sides = np.clip((np.abs(x) - 0.045) / 0.02, 0, 1) * np.clip((z + 0.04) / 0.025, 0, 1) * np.clip((0.028 - z) / 0.015, 0, 1)
    back = np.clip((y - 0.02) / 0.02, 0, 1) * np.clip((z - 0.0) / 0.01, 0, 1) * np.clip((0.03 - z) / 0.01, 0, 1)
    return 0.0011 * env * (crease + 0.5 * crease2) * palm + 0.0009 * env * crease2 * sides + 0.0006 * crease * back


def glove(p):
    d = smin(body(p), thumb(p), 0.010)
    d = d + wrinkle(p) * (np.abs(d) < 0.006)
    x, y, z = p[..., 0], p[..., 1], p[..., 2]
    # cuff opening: a shallow hollow at the top
    rx, ry = cuff_r(z)
    hole = (np.sqrt((x / (rx - 0.009)) ** 2 + (y / (ry - 0.009)) ** 2) - 1) * (ry - 0.009)
    hole = smax(hole, CUFF_Z[1] - 0.05 - z, 0.004)
    d = smax(d, -hole, 0.004)
    # the grip opening in the palm, running on up the cuff as the lace slit
    slit = np.maximum(np.maximum(np.abs(x - 0.004) - 0.0055, np.abs(z - 0.08) - 0.12), y + 0.028)
    d = smax(d, -slit, 0.0025)
    return d


def grid(fn, lo, hi):
    xs = [np.arange(lo[i], hi[i], VOX) for i in range(3)]
    P = np.stack(np.meshgrid(*xs, indexing='ij'), -1)
    out = np.empty(P.shape[:3], np.float32)
    for i in range(P.shape[0]):  # slab by slab: bounded memory
        out[i] = fn(P[i])
    return out


def normal(fn, Q):
    e = 2e-4
    n = np.stack([(fn(Q + np.eye(3)[i] * e) - fn(Q - np.eye(3)[i] * e)) / (2 * e) for i in range(3)], -1)
    return n / np.linalg.norm(n, axis=-1, keepdims=True)


def project(fn, P, direction):
    """March each point along `direction` until it hits the surface."""
    P = np.asarray(P, float)
    d = np.asarray(direction, float)
    d = d / np.linalg.norm(d)
    ts = np.linspace(0, 0.3, 3000)
    out = []
    for p in P:
        Q = p[None, :] + ts[:, None] * d[None, :]
        v = fn(Q)
        i = int(np.argmax(v < 0))
        out.append(Q[max(i - 1, 0)])
    return np.array(out)


def contour_plane(fn, axis, value, lo, hi, step=0.001):
    ax = [a for a in range(3) if a != axis]
    u = np.arange(lo[ax[0]], hi[ax[0]], step)
    v = np.arange(lo[ax[1]], hi[ax[1]], step)
    U, V = np.meshgrid(u, v, indexing='ij')
    P = np.zeros(U.shape + (3,))
    P[..., ax[0]], P[..., ax[1]], P[..., axis] = U, V, value
    cs = measure.find_contours(fn(P), 0)
    out = []
    for c in cs:
        Q = np.zeros((len(c), 3))
        Q[:, ax[0]] = lo[ax[0]] + c[:, 0] * step
        Q[:, ax[1]] = lo[ax[1]] + c[:, 1] * step
        Q[:, axis] = value
        out.append(Q)
    return max(out, key=len)


def resample(P, step):
    seg = np.linalg.norm(np.diff(P, axis=0), axis=1)
    s = np.concatenate([[0], np.cumsum(seg)])
    t = np.arange(0, s[-1], step)
    return np.stack([np.interp(t, s, P[:, i]) for i in range(3)], -1)


def split_runs(P, mask):
    """Keep the points where mask is True, as separate runs (no stitch jumping a gap)."""
    runs, cur = [], []
    for p, m in zip(P, mask):
        if m:
            cur.append(p)
        elif cur:
            runs.append(np.array(cur)); cur = []
    if cur:
        runs.append(np.array(cur))
    return [r for r in runs if len(r) > 3]


def main(out):
    lo, hi = np.array([-0.115, -0.115, -0.185]), np.array([0.125, 0.095, 0.215])
    D = grid(glove, lo, hi)
    v, f, _, _ = measure.marching_cubes(D, 0, spacing=(VOX,) * 3)
    v += lo
    res = {'v': v.astype(np.float32), 'f': f.astype(np.int32)}

    def off_slit(c):
        return ~((np.abs(c[:, 0] - 0.004) < 0.012) & (c[:, 1] < -0.02))

    # welts: side seam around the fist, the two edges of the cuff band
    side = contour_plane(lambda P: smax(body(P), -thumb(P) + 0.004, 0.004), 1, 0.006, lo, hi)
    side = side[side[:, 2] < CUFF_Z[0] + 0.004]
    welts = [side]
    for z in (CUFF_Z[0] + 0.002, CUFF_Z[1] - 0.003):
        welts += split_runs(*(lambda c: (c, off_slit(c)))(contour_plane(glove, 2, z, lo, hi)))
    res['n_welts'] = len(welts)
    for i, w in enumerate(welts):
        res[f'welt{i}'] = w + normal(glove, w) * 0.0012

    # stitch lines (beige thread): inside each band edge, the padding's edge, the thumb, the palm, the side seam
    st = []
    for z in (CUFF_Z[0] + 0.007, CUFF_Z[1] - 0.008):
        c = contour_plane(glove, 2, z, lo, hi)
        st += split_runs(c, off_slit(c))
    xs = np.linspace(-0.072, 0.045, 60)
    st.append(project(glove, np.stack([xs, np.full_like(xs, -0.2), -0.050 - 0.018 * (xs / 0.075) ** 2], -1), [0, 1, 0]))
    zs = np.linspace(0.028, -0.040, 30)
    st.append(project(glove, np.stack([0.040 - 0.004 * (0.028 - zs) / 0.07, np.full_like(zs, -0.2), zs], -1), [0, 1, 0]))
    for x0 in (-0.024, 0.030):
        zs = np.linspace(0.024, -0.036, 30)
        st.append(project(glove, np.stack([np.full_like(zs, x0), np.full_like(zs, -0.2), zs], -1), [0, 1, 0]))
    sd = resample(side, 0.001)
    tg = np.gradient(sd, axis=0)
    tg /= np.linalg.norm(tg, axis=1, keepdims=True) + 1e-9
    n = normal(glove, sd)
    for sgn in (1, -1):
        q = sd + np.cross(n, tg) * 0.0045 * sgn
        st.append(project(glove, q + n * 0.02, -n.mean(0)) if False else q - n * (glove(q)[:, None]))
    res['n_stitch'] = len(st)
    for i, s in enumerate(st):
        s = resample(s, 0.0011)
        # snap onto the surface
        s = s - normal(glove, s) * glove(s)[:, None]
        res[f'stitch{i}'] = s
        res[f'stitchn{i}'] = normal(glove, s)

    # eyelets: 5 pairs either side of the slit on the cuff
    eyes = []
    for z in np.linspace(0.060, 0.185, 5):
        for x in (0.004 - 0.016, 0.004 + 0.016):
            eyes.append(project(glove, [[x, -0.2, z]], [0, 1, 0])[0])
    res['eyes'] = np.array(eyes)
    res['eyen'] = normal(glove, res['eyes'])
    np.savez(out, **res)
    print('verts', len(v), 'faces', len(f), 'welts', len(welts), 'stitch lines', len(st))


if __name__ == '__main__':
    main(sys.argv[1])

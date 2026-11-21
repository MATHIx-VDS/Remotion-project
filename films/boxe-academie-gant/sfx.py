"""Sound design for the glove intro (synthesised, no samples): hangar room tone, the lace creaking
as the glove spins, the hand's swish, the leather grab, the yank whoosh into the lens.

python sfx.py out.wav [fps=30] [T_REACH=78] [T_GRAB=100] [T_END=122]
"""
import sys

import numpy as np
import pyloudnorm as pyln
import soundfile as sf
from scipy import signal

SR = 48000
out = sys.argv[1]
FPS, T_REACH, T_GRAB, T_END = (int(x) for x in (sys.argv[2:6] if len(sys.argv) > 5 else (30, 78, 100, 122)))
sec = lambda fr: (fr - 1) / FPS
DUR = T_END / FPS
N = int(DUR * SR)
rng = np.random.default_rng(7)
t = np.arange(N) / SR


def bp(x, lo, hi, order=2):
    sos = signal.butter(order, [lo, hi], 'bandpass', fs=SR, output='sos')
    return signal.sosfilt(sos, x)


def lp(x, f, order=2):
    return signal.sosfilt(signal.butter(order, f, 'lowpass', fs=SR, output='sos'), x)


def place(buf, x, at):
    i = int(at * SR)
    j = min(len(buf), i + len(x))
    if j > i:
        buf[i:j] += x[: j - i]


L = np.zeros(N)
R = np.zeros(N)

# room tone: a big empty hangar - low rumble, air, a distant hum
brown = np.cumsum(rng.normal(size=N)); brown -= lp(brown, 8); brown /= np.abs(brown).max()
air = bp(rng.normal(size=N), 2000, 9000) * 0.02
hum = 0.004 * np.sin(2 * np.pi * 50 * t) + 0.002 * np.sin(2 * np.pi * 100 * t + 0.4)
fade_in = np.clip(t / 0.4, 0, 1)
room = (lp(brown, 180) * 0.09 + air + hum) * fade_in
L += room
R += np.roll(room, 377)

# reverb impulse (≈1.6 s, dark) for everything that happens "in" the hangar
ir_n = int(1.6 * SR)
ir = rng.normal(size=ir_n) * np.exp(-np.arange(ir_n) / SR / 0.38)
ir = lp(ir, 3500)
ir /= np.sqrt((ir ** 2).sum())


def creak(dur, f0, seed):
    r = np.random.default_rng(seed)
    n = int(dur * SR)
    x = np.zeros(n)
    pos, rate = 0, f0
    while pos < n:
        x[pos] = r.uniform(0.6, 1.0)
        rate *= r.uniform(0.97, 1.035)
        pos += int(SR / rate)
    x = bp(x, 500, 2600) + 0.4 * bp(x, 2600, 5000)
    env = np.sin(np.pi * np.linspace(0, 1, n)) ** 0.7
    return x * env


def whoosh(dur, f_lo, f_hi, seed, shape=2.0):
    r = np.random.default_rng(seed)
    n = int(dur * SR)
    x = r.normal(size=n)
    out_ = np.zeros(n)
    # a sweeping band: chunks filtered at a rising centre
    k = 24
    edges = np.linspace(0, n, k + 1).astype(int)
    for i in range(k):
        f = f_lo * (f_hi / f_lo) ** ((i + 0.5) / k)
        seg = bp(x, f * 0.6, min(f * 1.7, SR / 2 - 100))[edges[i]:edges[i + 1]]
        out_[edges[i]:edges[i + 1]] = seg
    env = np.linspace(0, 1, n) ** shape
    return out_ * env


dry_l = np.zeros(N)
dry_r = np.zeros(N)
# the lace twisting on its hook while the glove turns
for at, d, f0, pan in ((0.35, 0.55, 55, -0.3), (1.25, 0.45, 70, 0.2), (2.05, 0.6, 48, -0.1), (2.85, 0.35, 80, 0.3)):
    c = creak(d, f0, int(at * 100)) * 0.05
    place(dry_l, c * (1 - pan), at)
    place(dry_r, c * (1 + pan), at)
# the hand coming in from the right: a cloth swish
sw = whoosh(sec(T_GRAB) - sec(T_REACH), 250, 1400, 3, shape=1.6) * 0.10
place(dry_l, sw * 0.6, sec(T_REACH))
place(dry_r, sw * 1.2, sec(T_REACH))
# the grab: a leather slap, the fist closing (thump), a squeak of leather, a lace creak
g = sec(T_GRAB) - 0.02
n = int(0.25 * SR)
tt = np.arange(n) / SR
thump = np.sin(2 * np.pi * (85 - 30 * tt) * tt) * np.exp(-tt / 0.05) * 0.5
slap = bp(rng.normal(size=n), 700, 4500) * np.exp(-tt / 0.012) * 0.35
squeak = bp(rng.normal(size=int(0.09 * SR)), 1500, 3200, 3) * np.hanning(int(0.09 * SR)) * 0.10
for b, k in ((dry_l, 0.9), (dry_r, 1.1)):
    place(b, (thump + slap) * k, g)
    place(b, squeak * k, g + 0.05)
    place(b, creak(0.25, 90, 11) * 0.06 * k, g + 0.03)
# the yank: a hard whoosh into the lens, cut on the impact
y0 = sec(T_GRAB + 4)
yd = DUR - y0
yw = whoosh(yd, 180, 3800, 5, shape=2.6) * 0.55
place(dry_l, yw, y0)
place(dry_r, yw, y0)
nb = int(0.06 * SR)
hit = lp(rng.normal(size=nb), 300) * np.exp(-np.arange(nb) / SR / 0.02) * 0.9
place(dry_l, hit, DUR - 0.05)
place(dry_r, hit, DUR - 0.05)

wet_l = signal.fftconvolve(dry_l, ir)[:N] * 0.35
wet_r = signal.fftconvolve(dry_r, np.roll(ir, 211))[:N] * 0.35
L += dry_l + wet_l
R += dry_r + wet_r
# the room breathes in just before the cut (a short swell)
mix = np.stack([L, R], -1)
meter = pyln.Meter(SR)
loud = meter.integrated_loudness(mix)
mix = pyln.normalize.loudness(mix, loud, -15.5)
mix = 0.89 * np.tanh(mix / 0.89)  # soft limiter: the whoosh and the hit stay punchy, no clipping
sf.write(out, mix.astype(np.float32), SR, subtype='PCM_24')
print(f'{out}: {DUR:.2f}s, {meter.integrated_loudness(mix):.1f} LUFS, peak {20*np.log10(np.abs(mix).max()):.1f} dBFS')

"""Monte les vidéos Instagram à partir des frames de render-frames.js.

python assemble.py <dossier_frames> <dossier_sortie>

- Carrousel : 5 visuels enchaînés par des « whip pans » de 0,28 s avec flou de mouvement horizontal.
- Rendu interne à 60 i/s, sortie à 30 i/s en fusionnant 2 images : flou de mouvement naturel, sans saccade.
- Habillage sonore synthétisé (whooshs, impacts, pops), à -16 LUFS. H.264 + AAC, compatible Photos et Instagram.
"""
import os
import subprocess
import sys

import cv2
import numpy as np
import pyloudnorm as pyln
import soundfile as sf
from scipy import signal

FR, OUT = sys.argv[1], sys.argv[2]
os.makedirs(OUT, exist_ok=True)
FPS_IN, FPS_OUT, W = 60, 30, 1080
TR = 0.28
SLIDES = ['01-couverture', '02-comment-ca-marche', '03-enchaine-les-coups', '04-tente-ta-chance', '05-a-toi-de-jouer']
DUR = [2.9, 3.1, 3.0, 3.0, 3.4]
START = np.concatenate([[0], np.cumsum(DUR)[:-1]])

SR = 48000
rng = np.random.default_rng(11)


def frame(name, i):
    d = os.path.join(FR, name)
    n = len(os.listdir(d))
    return cv2.imread(os.path.join(d, f'f_{min(max(i, 0), n - 1):04d}.jpg'), cv2.IMREAD_COLOR).astype(np.float32)


def ease(p):  # whip : démarre et freine fort
    p = min(max(p, 0.0), 1.0)
    return 8 * p ** 4 if p < 0.5 else 1 - (-2 * p + 2) ** 4 / 2


def carousel_frame(g):
    t = g / FPS_IN
    i = int(np.searchsorted(START, t, side='right') - 1)
    local = t - START[i]
    cur = frame(SLIDES[i], round(local * FPS_IN))
    if i == 0 or local >= TR:
        return cur
    prev = frame(SLIDES[i - 1], round((t - START[i - 1]) * FPS_IN))
    p = local / TR
    off = -W * ease(p)
    v = W * abs(ease(p + 0.5 / (TR * FPS_IN)) - ease(p - 0.5 / (TR * FPS_IN)))  # px par image à 60 i/s
    o = int(round(off))
    img = np.empty_like(cur)
    # le visuel sortant part à gauche, l'entrant arrive de la droite, collés l'un à l'autre
    if o > -W:
        img[:, :W + o] = prev[:, -o:]
    img[:, W + o:] = cur[:, :-o] if o < 0 else cur[:, :0]
    L = int(v * 1.6)
    if L > 2:
        img = cv2.blur(img, (L, 1))
    return img


def encode(get, n60, h, wav, path):
    cmd = ['ffmpeg', '-y', '-hide_banner', '-loglevel', 'error',
           '-f', 'rawvideo', '-pix_fmt', 'bgr24', '-s', f'{W}x{h}', '-r', str(FPS_OUT), '-i', '-',
           '-i', wav, '-map', '0:v', '-map', '1:a', '-shortest',
           '-c:v', 'libx264', '-preset', 'slow', '-crf', '16', '-profile:v', 'high', '-pix_fmt', 'yuv420p',
           '-color_primaries', 'bt709', '-color_trc', 'bt709', '-colorspace', 'bt709',
           '-c:a', 'aac', '-b:a', '192k', '-movflags', '+faststart', path]
    pr = subprocess.Popen(cmd, stdin=subprocess.PIPE)
    for g in range(0, n60 - 1, 2):
        img = (get(g) + get(g + 1)) * 0.5  # obturateur : 2 images à 60 i/s → 1 image à 30 i/s
        pr.stdin.write(np.clip(img + 0.5, 0, 255).astype(np.uint8).tobytes())
    pr.stdin.close()
    pr.wait()
    print('écrit', path)


# ---------------- son ----------------
def bp(x, lo, hi, o=2):
    return signal.sosfilt(signal.butter(o, [lo, hi], 'bandpass', fs=SR, output='sos'), x)


def lp(x, f, o=2):
    return signal.sosfilt(signal.butter(o, f, 'lowpass', fs=SR, output='sos'), x)


def whoosh(d=0.34, lo=300, hi=3500, gain=0.5):
    n = int(d * SR)
    x = rng.normal(size=n)
    out = np.zeros(n)
    k = 16
    ed = np.linspace(0, n, k + 1).astype(int)
    for i in range(k):
        f = lo * (hi / lo) ** (np.sin(np.pi * (i + 0.5) / k) * 0.5 + 0.5 * (i + 0.5) / k)
        out[ed[i]:ed[i + 1]] = bp(x, f * 0.6, min(f * 1.6, SR / 2 - 100))[ed[i]:ed[i + 1]]
    env = np.sin(np.pi * np.linspace(0, 1, n)) ** 1.5
    return out * env * gain


def punch(gain=1.0, low=1.0):
    n = int(0.35 * SR)
    tt = np.arange(n) / SR
    f = 120 * np.exp(-tt * 9) + 42
    body = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-tt / 0.09) * 0.9 * low
    thud = lp(rng.normal(size=n), 900) * np.exp(-tt / 0.03) * 0.8
    slap = bp(rng.normal(size=n), 1800, 6000) * np.exp(-tt / 0.008) * 0.5
    return (body + thud + slap) * gain


def pop(gain=0.25, f0=900):
    n = int(0.09 * SR)
    tt = np.arange(n) / SR
    return np.sin(2 * np.pi * f0 * tt * (1 + 0.6 * np.exp(-tt * 60))) * np.exp(-tt / 0.025) * gain


def shimmer(d=0.6, gain=0.12):
    n = int(d * SR)
    tt = np.arange(n) / SR
    x = sum(np.sin(2 * np.pi * f * tt + i) for i, f in enumerate((2093, 2637, 3136, 4186)))
    return x * np.sin(np.pi * tt / d) ** 2 * gain / 4


def mix(events, dur, path):
    L = np.zeros(int(dur * SR) + SR)
    R = np.zeros_like(L)
    for at, x, pan in events:
        i = int(at * SR)
        j = min(len(L), i + len(x))
        L[i:j] += x[:j - i] * (1 - pan) ** 0.5
        R[i:j] += x[:j - i] * (1 + pan) ** 0.5
    # petite réverbération de salle
    ir = rng.normal(size=int(0.7 * SR)) * np.exp(-np.arange(int(0.7 * SR)) / SR / 0.16)
    ir = lp(ir, 4000)
    ir /= np.sqrt((ir ** 2).sum())
    L = L + signal.fftconvolve(L, ir)[:len(L)] * 0.18
    R = R + signal.fftconvolve(R, np.roll(ir, 97))[:len(R)] * 0.18
    m = np.stack([L, R], -1)[: int(dur * SR)]
    fade = int(0.35 * SR)
    m[-fade:] *= np.linspace(1, 0, fade)[:, None]
    meter = pyln.Meter(SR)
    m = pyln.normalize.loudness(m, meter.integrated_loudness(m), -16.0)
    m = 0.9 * np.tanh(m / 0.9)
    sf.write(path, m.astype(np.float32), SR, subtype='PCM_24')


if __name__ == '__main__':
    total = float(sum(DUR))
    S = START
    ev = [
        (0.12, whoosh(0.5, 200, 1500, 0.25), 0.2),               # le sac descend
        (1.13, punch(1.0), -0.15),                               # BAM
        (S[1] + 0.25, whoosh(0.5, 250, 1800, 0.22), 0.3),        # le téléphone monte
        (S[3] + 0.42, whoosh(0.55, 300, 2400, 0.3), 0.4),        # la carte cadeau arrive
        (S[3] + 1.15, shimmer(0.7), 0.0),                        # reflet sur la carte
        (S[3] + 1.3, pop(0.22, 700), 0.0),
        (S[2] + 0.84, punch(1.1, 1.3), 0.0),                     # COMBO
        (S[2] + 0.88, bp(rng.normal(size=int(0.5 * SR)), 2500, 8000) * np.exp(-np.arange(int(0.5 * SR)) / SR / 0.12) * 0.12, 0.0),
        (S[4] + 0.85, punch(0.7, 1.4), 0.0),                     # LIEN EN BIO
    ]
    for i in range(1, 5):                                        # transitions
        ev.append((S[i] - 0.06, whoosh(0.34, 400, 4200, 0.55), 0.5))
    for k in range(3):
        ev.append((S[1] + 0.35 + 0.2 * k, pop(0.2, 800 + 120 * k), -0.2))
        ev.append((S[2] + 1.0 + 0.16 * k, punch(0.28, 1.6), 0.0))
        ev.append((S[4] + 0.55 + 0.1 * k, pop(0.18, 900 + 150 * k), 0.1))
    wav = os.path.join(FR, 'carrousel.wav')
    mix(ev, total, wav)
    n60 = int(round(total * FPS_IN))
    encode(carousel_frame, n60, 1350, wav, os.path.join(OUT, 'carrousel.mp4'))

    # story
    sd = 6.0
    ev = [(0.5, whoosh(0.5, 200, 1500, 0.25), 0.1), (1.38, punch(1.0), -0.1), (1.65, pop(0.2, 760), 0.3), (1.95, pop(0.16, 980), 0.0)]
    wav = os.path.join(FR, 'story.wav')
    mix(ev, sd, wav)
    encode(lambda g: frame('story', g), int(sd * FPS_IN), 1920, wav, os.path.join(OUT, 'story.mp4'))

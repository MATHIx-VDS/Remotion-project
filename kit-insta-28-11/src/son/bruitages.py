"""Bruitages du kit (Reel), synthétisés (originaux, libres de droits) : chacun est écrit en .wav séparé
pour pouvoir être remplacé par un fichier Pixabay du même nom dans le dossier.

python bruitages.py <dossier_sortie>
  cloche.wav    cloche de ring (début)
  whoosh.wav    changement de slide
  coup.wav      coup de poing (BAM, COMBO X2)
  grelots.wav   clochettes / grelots (« 1 mois offert »)
"""
import os
import sys

import numpy as np
import soundfile as sf
from scipy import signal

SR = 48000
OUT = sys.argv[1]
os.makedirs(OUT, exist_ok=True)
rng = np.random.default_rng(5)


def bp(x, lo, hi, o=2):
    return signal.sosfilt(signal.butter(o, [lo, hi], 'bandpass', fs=SR, output='sos'), x)


def lp(x, f, o=2):
    return signal.sosfilt(signal.butter(o, f, 'lowpass', fs=SR, output='sos'), x)


def stereo(x, w=0.0):
    return np.stack([x * (1 - w), x * (1 + w)], -1)


def cloche():
    """Cloche de ring : 2 coups rapides, partiels inharmoniques, longue résonance métallique."""
    n = int(2.6 * SR)
    t = np.arange(n) / SR
    out = np.zeros(n)
    for k, at in enumerate((0.0, 0.17)):
        tt = np.clip(t - at, 0, None)
        on = t >= at
        for r, a, d in ((1, 1, 1.6), (2.0, .5, 1.0), (2.76, .6, .9), (4.07, .35, .6), (5.4, .25, .45), (6.8, .15, .3), (8.9, .1, .2)):
            out += on * a * np.sin(2 * np.pi * 735 * r * tt + k) * np.exp(-tt / d)
        click = bp(rng.normal(size=n), 2500, 7000) * np.exp(-tt / 0.006) * on
        out += click * 0.8
    return out / np.abs(out).max() * 0.9


def whoosh(d=0.42):
    n = int(d * SR)
    x = rng.normal(size=n)
    out = np.zeros(n)
    k = 20
    ed = np.linspace(0, n, k + 1).astype(int)
    for i in range(k):
        f = 250 * (5000 / 250) ** ((i + 0.5) / k)
        out[ed[i]:ed[i + 1]] = bp(x, f * 0.55, min(f * 1.7, SR / 2 - 100))[ed[i]:ed[i + 1]]
    env = np.linspace(0, 1, n) ** 2.2 * np.exp(-np.clip(np.linspace(-3, 3, n), 0, None) * 1.8)
    env /= env.max()
    w = out * env
    return w / np.abs(w).max() * 0.9


def coup():
    """Coup de poing dans un sac : sous-grave, claquement du cuir, souffle."""
    n = int(0.45 * SR)
    t = np.arange(n) / SR
    f = 115 * np.exp(-t * 10) + 40
    body = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t / 0.11)
    thud = lp(rng.normal(size=n), 800) * np.exp(-t / 0.035) * 1.2
    slap = bp(rng.normal(size=n), 1500, 7000) * np.exp(-t / 0.007) * 0.9
    x = body + thud + slap
    return x / np.abs(x).max() * 0.95


def grelots(d=1.1):
    """Clochettes / grelots : petites frappes métalliques aiguës, en grappe."""
    n = int(d * SR)
    t = np.arange(n) / SR
    out = np.zeros(n)
    hits = np.sort(np.concatenate([rng.uniform(0, 0.55, 22), rng.uniform(0.55, 0.8, 6)]))
    for h in hits:
        tt = np.clip(t - h, 0, None)
        on = t >= h
        f0 = rng.uniform(2600, 4200)
        tone = sum(a * np.sin(2 * np.pi * f0 * r * tt + rng.uniform(0, 6)) for r, a in ((1, 1), (1.47, .6), (2.09, .4), (2.76, .25)))
        out += on * tone * np.exp(-tt / rng.uniform(0.05, 0.12)) * rng.uniform(0.4, 1)
    shake = bp(rng.normal(size=n), 5000, 11000) * np.exp(-t / 0.35) * 0.25
    x = out + shake
    x *= np.minimum(1, t / 0.01)
    return x / np.abs(x).max() * 0.8


for name, x, w in (('cloche', cloche(), 0), ('whoosh', whoosh(), 0), ('coup', coup(), 0), ('grelots', grelots(), 0.15)):
    sf.write(os.path.join(OUT, name + '.wav'), stereo(x, w).astype(np.float32), SR, subtype='PCM_24')
    print(name, f'{len(x) / SR:.2f}s')

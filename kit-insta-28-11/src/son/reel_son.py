"""Bande-son du Reel : musique ACE-Step calée sur les coupes, bruitages, master -14 LUFS.

python reel_son.py <musique.wav> <dossier_bruitages> <sortie.wav>

- La musique est décalée pour qu'un temps fort tombe pile sur chaque coupe : à 100 BPM, un temps
  dure 0,6 s, et les coupes du Reel sont à 1,0 / 4,0 / 7,0 / 8,2 / 9,4 s, soit 1,0 s + un nombre entier de temps.
- Bruitages (bruitages.py, synthétisés, libres de droits) : cloche de ring au début, impact sur chaque titre,
  whoosh avant chaque coupe.
"""
import json
import subprocess
import sys

import numpy as np
import soundfile as sf
from scipy import signal

MUS, SFX, OUT = sys.argv[1:4]
SR = 48000
DUR = 12.0
BEAT = 60 / 100
CUTS = [1.0, 4.0, 7.0, 8.2, 9.4]
# (instant, gain) des impacts : gros titres forts, sous-titres plus discrets
HITS = [(0.04, 0), (0.16, -5), (0.30, -2), (1.18, 0), (1.60, -3), (4.18, 0), (4.60, -3),
        (7.04, 0), (7.40, -2), (7.76, -2), (8.24, 0), (8.55, -2), (8.86, -2), (9.44, 0), (9.90, -4)]


def load(path):
    x, sr = sf.read(path, always_2d=True)
    if sr != SR:
        x = signal.resample_poly(x, SR, sr, axis=0)
    return x[:, :2] if x.shape[1] >= 2 else np.repeat(x, 2, 1)


def beat_phase(x):
    """Phase des temps (en s) : là où les attaques graves (grosse caisse) tombent toutes les 0,6 s."""
    m = x.mean(1)
    f, t, S = signal.stft(m, SR, nperseg=2048, noverlap=1536)
    low = np.abs(S[(f > 30) & (f < 180)]).sum(0)
    flux = np.maximum(0, np.diff(np.log1p(low)))
    tt = t[1:]
    best, score = 0, -1
    for ph in np.arange(0, BEAT, 0.005):
        idx = np.searchsorted(tt, np.arange(ph, tt[-1] - 0.1, BEAT))
        s = flux[np.clip(idx, 0, len(flux) - 1)].sum()
        if s > score:
            best, score = ph, s
    return best


def lufs(x):
    import pyloudnorm as pyln
    return pyln.Meter(SR).integrated_loudness(x)


mus = load(MUS)
ph = beat_phase(mus)
skip = (ph - CUTS[0]) % BEAT  # on saute ce bout de musique : ses temps tombent alors à 1,0 s + k × 0,6 s
N = int(DUR * SR)
seg = mus[int(skip * SR):][:N]
seg = np.pad(seg, ((0, N - len(seg)), (0, 0)))
fade = int(0.8 * SR)
seg[-fade:] *= np.linspace(1, 0, fade)[:, None] ** 1.5
seg[:int(0.03 * SR)] *= np.linspace(0, 1, int(0.03 * SR))[:, None]
seg *= 10 ** ((-17 - lufs(seg)) / 20)

fx = np.zeros((int(DUR * SR), 2))


def put(name, at, gain_db=0.0):
    s = load(f'{SFX}/{name}.wav') * 10 ** (gain_db / 20)
    i = int(at * SR)
    j = min(len(fx), i + len(s))
    fx[i:j] += s[:j - i]


put('cloche', 0.0, -2)
for at, g in HITS:
    put('coup', at, g)
for c in CUTS:
    put('whoosh', c - 0.3, -4)
fx *= 10 ** ((-18 - lufs(fx)) / 20)

mix = seg + fx
sf.write(OUT.replace('.wav', '_musique.wav'), seg.astype(np.float32), SR, subtype='PCM_24')
sf.write(OUT.replace('.wav', '_bruitages.wav'), fx.astype(np.float32), SR, subtype='PCM_24')
tmp = OUT.replace('.wav', '_brut.wav')
sf.write(tmp, mix.astype(np.float32), SR, subtype='FLOAT')
# master : -14 LUFS, crête vraie -1 dBTP (loudnorm 2 passes)
err = subprocess.run(['ffmpeg', '-hide_banner', '-i', tmp, '-af', 'loudnorm=I=-14:TP=-1:LRA=11:print_format=json', '-f', 'null', '-'],
                     capture_output=True, text=True).stderr
m = json.loads(err[err.rindex('{'):])
ln = (f"loudnorm=I=-14:TP=-1:LRA=11:measured_I={m['input_i']}:measured_TP={m['input_tp']}:measured_LRA={m['input_lra']}:"
      f"measured_thresh={m['input_thresh']}:offset={m['target_offset']}:linear=true,aresample=48000")
subprocess.run(['ffmpeg', '-y', '-hide_banner', '-loglevel', 'error', '-i', tmp, '-af', ln, '-c:a', 'pcm_s24le', OUT], check=True)
print(f'temps de la musique à {ph:.3f} s → décalage {skip:.3f} s ; écrit {OUT}')

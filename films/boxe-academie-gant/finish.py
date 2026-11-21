"""Finish the glove intro and join it to the planning Reel.

python finish.py <seq_dir> <out_dir> <planning.mp4> <intro_sfx.wav> <final.mp4>

Per frame: glove/hand pass (straight alpha) over the hangar plate, upscale to 1080x1920, film grade
(warmer blacks, red pushed, soft halation, vignette, gentle lens breathing of the grain), then the
last frames go dark as the glove covers the lens. The 30 i/s intro is doubled to 60 i/s and cut
onto the planning film (which starts on black), audio crossfaded at the cut.
"""
import os
import subprocess
import sys

import cv2
import numpy as np

SEQ, OUT, PLAN, SFX, FINAL = sys.argv[1:6]
W, H = 1080, 1920
frames = sorted(f for f in os.listdir(SEQ) if f.startswith('f_'))
n = len(frames)
os.makedirs(OUT, exist_ok=True)
rng = np.random.default_rng(3)

yy, xx = np.mgrid[0:H, 0:W].astype(np.float32)
r = np.sqrt(((xx - W / 2) / (W / 2)) ** 2 * 0.8 + ((yy - H * 0.47) / (H / 2)) ** 2)
vignette = (1 - 0.38 * np.clip(r - 0.35, 0, 1) ** 1.6)[..., None]


def read(p):
    a = cv2.imread(p, cv2.IMREAD_UNCHANGED).astype(np.float32) / 65535.0
    return a


def grade(img):
    # img: BGR float 0..1 (display-referred, AgX)
    lum = img @ np.array([0.0722, 0.7152, 0.2126], np.float32)
    lum = lum[..., None]
    # push the reds, keep everything else close
    redness = np.clip((img[..., 2:3] - np.maximum(img[..., 0:1], img[..., 1:2])) * 3.0, 0, 1)
    sat = 1.10 + 0.22 * redness
    img = lum + (img - lum) * sat
    # contrast: gentle S around mid grey, lifted, warm blacks
    img = np.clip(img, 0, 1)
    img = img + 0.10 * (img - 0.5) * (1 - np.abs(img - 0.5) * 2)
    img = img * 0.97 + np.array([0.010, 0.012, 0.018], np.float32)  # B, G, R: warm, slightly milky blacks
    # halation: the hot highlights bleed a little red-orange
    hi = np.clip(lum - 0.62, 0, 1) * 2.0
    glow = cv2.GaussianBlur(hi, (0, 0), 14)[..., None] * np.array([0.10, 0.22, 0.55], np.float32)
    img = img + glow * 0.35
    return img * vignette


def grain(img, k):
    g = rng.normal(0, 1, (H // 2, W // 2)).astype(np.float32)
    g = cv2.resize(g, (W, H), interpolation=cv2.INTER_CUBIC)
    lum = img.mean(-1, keepdims=True)
    amt = 0.022 * (0.4 + 0.6 * (1 - np.abs(lum - 0.45) * 1.6).clip(0, 1))
    return img + g[..., None] * amt


for i, f in enumerate(frames):
    fg = read(os.path.join(SEQ, f))
    bg = read(os.path.join(SEQ, 'bg_' + f[2:]))
    a = fg[..., 3:4]
    comp = fg[..., :3] * a + bg[..., :3] * (1 - a)
    comp = cv2.resize(comp, (W, H), interpolation=cv2.INTER_LANCZOS4)
    # a touch of sharpening to sell the upscale
    blur = cv2.GaussianBlur(comp, (0, 0), 1.2)
    comp = comp + 0.35 * (comp - blur)
    img = grade(comp)
    img = grain(img, i)
    # the glove covers the lens: the last 5 frames fall to black
    k = -1 if os.environ.get('NO_FADE') else (i - (n - 6)) / 5
    if k > 0:
        img = img * (1 - min(1, k) ** 1.5)
    if i < 6 and not os.environ.get('NO_FADE'):  # fade up from black on the first frames
        img = img * (i / 6) ** 1.2
    cv2.imwrite(os.path.join(OUT, f'i_{i + 1:04d}.png'), (np.clip(img, 0, 1) * 255 + 0.5).astype(np.uint8))
    if i % 20 == 0:
        print('graded', i + 1, '/', n, flush=True)

if os.environ.get('NO_ENCODE'):
    sys.exit()
intro_dur = n / 30
cmd = [
    'ffmpeg', '-y', '-hide_banner', '-loglevel', 'error',
    '-framerate', '30', '-i', os.path.join(OUT, 'i_%04d.png'),
    '-i', PLAN, '-i', SFX,
    '-filter_complex',
    (
        '[0:v]fps=60,format=yuv420p,setsar=1[iv];'
        '[1:v]format=yuv420p,setsar=1[pv];'
        '[iv][pv]concat=n=2:v=1:a=0[v];'
        f'[2:a]aformat=sample_rates=48000:channel_layouts=stereo,apad,atrim=0:{intro_dur:.4f}[ia];'
        '[1:a]aformat=sample_rates=48000:channel_layouts=stereo[pa];'
        '[ia][pa]acrossfade=d=0.04:c1=tri:c2=tri[a]'
    ),
    '-map', '[v]', '-map', '[a]',
    '-c:v', 'libx264', '-preset', 'slow', '-crf', '16', '-profile:v', 'high', '-pix_fmt', 'yuv420p',
    '-color_primaries', 'bt709', '-color_trc', 'bt709', '-colorspace', 'bt709',
    '-c:a', 'aac', '-b:a', '256k', '-movflags', '+faststart', FINAL,
]
subprocess.run(cmd, check=True)
print('wrote', FINAL)

"""Monte le Reel : images 60 i/s fusionnées 2 par 2 (flou de mouvement) → 30 i/s, + bande-son.
Les coupes tombent sur des multiples de 1/30 s : aucune image ne mélange deux plans.

python reel-assemble.py <dossier_frames> <son.wav> <sortie.mp4>
"""
import os
import subprocess
import sys

import cv2
import numpy as np

FR, WAV, OUT = sys.argv[1:4]
files = sorted(f for f in os.listdir(FR) if f.endswith('.jpg'))
cmd = ['ffmpeg', '-y', '-hide_banner', '-loglevel', 'error',
       '-f', 'rawvideo', '-pix_fmt', 'bgr24', '-s', '1080x1920', '-r', '30', '-i', '-', '-i', WAV,
       '-map', '0:v', '-map', '1:a', '-shortest',
       '-c:v', 'libx264', '-preset', 'slow', '-crf', '17', '-profile:v', 'high', '-pix_fmt', 'yuv420p',
       '-color_primaries', 'bt709', '-color_trc', 'bt709', '-colorspace', 'bt709',
       '-c:a', 'aac', '-b:a', '192k', '-ar', '48000', '-movflags', '+faststart', OUT]
pr = subprocess.Popen(cmd, stdin=subprocess.PIPE)
for k in range(0, len(files) - 1, 2):
    a = cv2.imread(os.path.join(FR, files[k])).astype(np.float32)
    b = cv2.imread(os.path.join(FR, files[k + 1])).astype(np.float32)
    pr.stdin.write(np.clip((a + b) * 0.5 + 0.5, 0, 255).astype(np.uint8).tobytes())
pr.stdin.close()
pr.wait()
print('écrit', OUT)

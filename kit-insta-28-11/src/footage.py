"""Prépare les extraits vidéo du Reel : découpe, recadrage vertical 9:16 sur l'action, ralenti,
étalonnage noir et blanc contrasté, puis images JPEG à 60 i/s (lues image par image par reel.js).

python footage.py <dossier_videos> <dossier_sortie>

Sources : enregistrements d'écran des retransmissions Sportmag TV (finale Elite A 2019 de Kévin Albertus,
son entrée sur le ring, combat de Chloé Nandi contre Gil). Images © Sportmag TV : crédit affiché à l'écran,
accord à obtenir avant publication.
"""
import os
import subprocess
import sys

SRC, OUT = sys.argv[1:3]
FILES = {
    'kevin_combat': 'aca21572-ScreenRecording_11-26-2026_18-40-59_1.mov',   # 1286×712, 60 i/s
    'kevin_entree': 'a0803dab-ScreenRecording_11-26-2026_18-40-27_1.mov',   # 1278×720, 60 i/s
    'chloe_combat': 'd13790ba-ScreenRecording_11-26-2026_18-46-30_1.mov',   # 2150×1202, 120 i/s
}
# nom : (fichier, début source en s, durée à l'écran en s, vitesse, centre x (0-1), hauteur de recadrage (0-1), haut (0-1), éclaircir)
# Chloé est la combattante de droite (tenue sombre, tresses). Hauteur < 1 : on évite sous-titres et bandeau des scores.
SEG = {
    'hook_chloe':   ('chloe_combat', 1.15, 0.40, 1.0, 0.79, 1.00, 0.00, True),
    'hook_kevin':   ('kevin_combat', 7.90, 0.60, 1.0, 0.47, 1.00, 0.00, False),
    'k_entree':     ('kevin_entree', 3.30, 1.20, 1.0, 0.47, 1.00, 0.00, False),
    'k_echange':    ('kevin_combat', 3.30, 0.60, 1.0, 0.45, 1.00, 0.00, False),
    'k_garde':      ('kevin_combat', 5.00, 0.60, 1.0, 0.38, 1.00, 0.00, False),
    'c_echange':    ('chloe_combat', 4.15, 0.60, 1.0, 0.57, 0.84, 0.00, True),
    'c_ralenti':    ('chloe_combat', 5.45, 1.20, 0.5, 0.62, 0.84, 0.00, True),
    'c_frappe':     ('chloe_combat', 2.05, 0.60, 1.0, 0.70, 0.84, 0.00, True),
    'fond_date':    ('kevin_combat', 6.40, 1.20, 1.0, 0.55, 1.00, 0.00, False),
    'fond_public':  ('chloe_combat', 7.40, 1.20, 1.0, 0.50, 0.84, 0.00, True),
}


def size(path):
    out = subprocess.run(['ffprobe', '-v', 'error', '-select_streams', 'v:0', '-show_entries', 'stream=width,height',
                          '-of', 'csv=p=0', path], capture_output=True, text=True).stdout.strip()
    return [int(v) for v in out.split(',')]


for name, (src, start, dur, speed, cx, hf, top, lift) in SEG.items():
    path = os.path.join(SRC, FILES[src])
    W, H = size(path)
    ch = int(H * hf) // 2 * 2
    cw = int(ch * 9 / 16) // 2 * 2
    x = min(max(0, int(W * cx - cw / 2)), W - cw)
    y = int(H * top)
    d = os.path.join(OUT, name)
    os.makedirs(d, exist_ok=True)
    for f in os.listdir(d):
        os.remove(os.path.join(d, f))
    n = round(dur * 60)
    vf = (f'setpts=PTS/{speed},fps=60,crop={cw}:{ch}:{x}:{y},scale=1080:1920:flags=lanczos,'
          # noir et blanc « filtre rouge » (peaux éclaircies, lumières bleues de la salle assombries)
          + 'colorchannelmixer=.62:.32:.06:0:.62:.32:.06:0:.62:.32:.06,'
          + ('eq=contrast=1.3:brightness=0.02:gamma=1.8' if lift else 'eq=contrast=1.3:brightness=-0.03:gamma=1.0')
          + ',unsharp=5:5:0.6')
    subprocess.run(['ffmpeg', '-v', 'error', '-y', '-ss', f'{start}', '-i', path, '-an', '-vf', vf,
                    '-frames:v', str(n), '-q:v', '3', os.path.join(d, 'f_%04d.jpg')], check=True)
    print(f'{name}: {len(os.listdir(d))} images, recadrage {cw}×{ch} → 1080×1920 (×{1920 / ch:.2f})')

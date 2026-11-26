"""Voix off Kokoro (hexgrad/Kokoro-82M, Apache 2.0), voix française ff_siwis, phrase par phrase.
python voix.py <dossier_sortie> [vitesse]"""
import sys, os
import numpy as np
import soundfile as sf
from kokoro import KPipeline

OUT = sys.argv[1]
SPEED = float(sys.argv[2]) if len(sys.argv) > 2 else 1.1
os.makedirs(OUT, exist_ok=True)
PHRASES = [
    ('p1', "Le défi du sac de Noël !"),
    ('p2', "Quinze secondes, un mois offert à gagner."),
    ('p3', "Lien en bio, entre sur le ring et frappe vite."),
    ('p4', "Enchaîne pour le combo fois deux !"),
    ('p5', "Tirage le vingt-quatre décembre."),
    ('p6', "À toi de jouer !"),
]
pipe = KPipeline(lang_code='f', repo_id='hexgrad/Kokoro-82M')
for name, text in PHRASES:
    audio = np.concatenate([np.asarray(a) for _, _, a in pipe(text, voice='ff_siwis', speed=SPEED)])
    # on retire le silence en début et fin
    thr = 0.01 * np.abs(audio).max()
    idx = np.where(np.abs(audio) > thr)[0]
    audio = audio[max(0, idx[0] - 240): idx[-1] + 1200]
    sf.write(os.path.join(OUT, name + '.wav'), audio, 24000)
    print(f'{name} {len(audio) / 24000:.2f}s  {text}')

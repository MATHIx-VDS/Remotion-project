"""Musique originale avec ACE-Step 1.5 (modèle turbo, sans le modèle de langage), sur CPU.
La musique générée est utilisable commercialement sans attribution.

python musique.py <dossier_ace (contient checkpoints/)> <dossier_sortie> [graines…]
"""
import os
import sys
import time

from acestep.handler import AceStepHandler
from acestep.inference import GenerationConfig, GenerationParams, generate_music

ACE, OUT = sys.argv[1], sys.argv[2]
SEEDS = [int(s) for s in sys.argv[3:]] or [42]
os.makedirs(OUT, exist_ok=True)

CAPTION = (
    'Energetic hip hop trap instrumental for a sports ad, 98 bpm. Heavy punchy drums, hard kick and snare, '
    'deep 808 bass, crisp rolling hi-hats, dark cinematic synth stabs, small Christmas sleigh bells and '
    'glockenspiel accents, motivational, powerful, boxing gym energy, no vocals.'
)

dit = AceStepHandler()
msg, ok = dit.initialize_service(project_root=ACE, config_path='acestep-v15-turbo', device='cpu')
print(msg)
if not ok:
    sys.exit(1)

params = GenerationParams(
    caption=CAPTION, lyrics='[Instrumental]', instrumental=True,
    bpm=98, keyscale='D minor', timesignature='4', duration=18,
    inference_steps=8, thinking=False, use_cot_metas=False, use_cot_caption=False, use_cot_language=False,
)
config = GenerationConfig(batch_size=len(SEEDS), use_random_seed=False, seeds=SEEDS, audio_format='wav')
t0 = time.time()
res = generate_music(dit, None, params, config, save_dir=OUT)
print('durée de génération', round(time.time() - t0), 's')
if not res.success:
    sys.exit(res.error if hasattr(res, 'error') else 'échec')
for a in res.audios:
    print(a['path'], a['params'].get('seed'))

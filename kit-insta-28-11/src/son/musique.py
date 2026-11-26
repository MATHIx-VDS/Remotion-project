"""Musique du Reel (entraînement BF du 28.11) avec ACE-Step 1.5 (modèle turbo, sans le modèle de langage), sur CPU.
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
    'Hard-hitting trap hip hop instrumental for a boxing event promo, 100 bpm. Heavy 808 bass, hard kick and '
    'punchy snare, fast rolling hi-hats, aggressive dark brass and synth stabs, intense, motivational, '
    'fight night energy, no vocals.'
)

dit = AceStepHandler()
msg, ok = dit.initialize_service(project_root=ACE, config_path='acestep-v15-turbo', device='cpu')
print(msg)
if not ok:
    sys.exit(1)

# CPU avec 15 Go de RAM : avant le décodage audio (VAE), on libère le modèle de diffusion et l'encodeur
# de texte, puis on décode par petits morceaux, sinon la mémoire déborde.
import gc
_orig_tiled = dit.tiled_decode
def _tiled_low_mem(latents, *a, **k):
    for name in ('model', 'text_encoder'):
        if getattr(dit, name, None) is not None:
            setattr(dit, name, None)
    gc.collect()
    k['chunk_size'] = 64
    return _orig_tiled(latents, *a, **k)
dit.tiled_decode = _tiled_low_mem

params = GenerationParams(
    caption=CAPTION, lyrics='[Instrumental]', instrumental=True,
    bpm=100, keyscale='E minor', timesignature='4', duration=17,
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

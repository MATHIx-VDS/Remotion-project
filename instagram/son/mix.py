"""Mixage de la bande-son du carrousel avec ffmpeg.

python mix.py <video.mp4> <dossier_son> <dossier_sortie>

<dossier_son> contient :
  voix/p1.wav … p6.wav         voix off Kokoro (voix.py)
  bruitages/*.wav              bruitages synthétisés (bruitages.py)
  musique.wav                  musique (ACE-Step 1.5)
  pixabay/                     facultatif : un fichier Pixabay nommé cloche.*, whoosh.*, coup.*, grelots.*
                               ou musique.* remplace automatiquement la version par défaut

Sortie : carrousel_son.mp4 (vidéo copiée, AAC 192 kbps, -14 LUFS) + voix.wav, musique.wav, bruitages.wav.
Repères vérifiés sur la vidéo (détection de scène ffmpeg) : changements de slide à 2,93 / 6,03 / 9,03 / 12,03 s
(transitions de 0,28 s), COMBO X2 à 6,87 s, BAM à 1,15 s, bouton « Lien en bio » à 12,88 s.
"""
import glob
import json
import os
import subprocess
import sys

VIDEO, SON, OUT = sys.argv[1:4]
os.makedirs(OUT, exist_ok=True)
DUR = 15.4
TMP = os.path.join(SON, 'tmp')
os.makedirs(TMP, exist_ok=True)

# voix : chaque phrase sur sa slide
VOIX = [('p1', 0.12), ('p2', 1.52),      # slide 1 (0 – 2,93)
        ('p3', 3.45),                     # slide 2 (3,21 – 6,03)
        ('p4', 6.40),                     # slide 3 (6,31 – 9,03) : « combo » juste après le COMBO X2
        ('p5', 9.45),                     # slide 4 (9,31 – 12,03)
        ('p6', 12.85)]                    # slide 5 : sur l'arrivée du bouton « Lien en bio »
# bruitages : (fichier, début en s, gain en dB)
SFX = [('cloche', 0.00, -1),
       ('coup', 1.13, -4),                # BAM !
       ('grelots', 2.15, -5),             # « un mois offert »
       ('whoosh', 2.86, -3), ('whoosh', 5.96, -3), ('whoosh', 8.96, -3), ('whoosh', 11.96, -3),
       ('coup', 6.80, 0), ('coup', 6.93, -3)]  # COMBO X2 : double impact


def run(cmd):
    r = subprocess.run(cmd, capture_output=True, text=True)
    if r.returncode:
        sys.exit(r.stderr[-2000:])
    return r.stderr


def src(name, default):
    found = sorted(glob.glob(os.path.join(SON, 'pixabay', name + '.*')))
    return found[0] if found else default


def loudness(path):
    err = run(['ffmpeg', '-hide_banner', '-i', path, '-af', 'loudnorm=print_format=json', '-f', 'null', '-'])
    return json.loads(err[err.rindex('{'):])


def place(items, out, base):
    """Pose chaque son à son instant (adelay) et additionne le tout, sur 15,4 s."""
    cmd = ['ffmpeg', '-y', '-hide_banner']
    parts = []
    for k, (path, at, gain) in enumerate(items):
        cmd += ['-i', path]
        ms = int(round(at * 1000))
        parts.append(f'[{k}:a]aformat=sample_rates=48000:channel_layouts=stereo,volume={gain}dB,adelay={ms}|{ms}[a{k}]')
    graph = ';'.join(parts) + ';' + ''.join(f'[a{k}]' for k in range(len(items))) + \
        f'amix=inputs={len(items)}:normalize=0,apad,atrim=0:{DUR}[o]'
    run(cmd + ['-filter_complex', graph, '-map', '[o]', '-c:a', 'pcm_s24le', out])


# 1. pistes posées
voix_raw = os.path.join(TMP, 'voix_raw.wav')
place([(os.path.join(SON, 'voix', p + '.wav'), at, 0) for p, at in VOIX], voix_raw, SON)
sfx_raw = os.path.join(TMP, 'sfx_raw.wav')
place([(src(n, os.path.join(SON, 'bruitages', n + '.wav')), at, g) for n, at, g in SFX], sfx_raw, SON)
mus_src = src('musique', os.path.join(SON, 'musique.wav'))

# 2. niveaux : voix -16 LUFS, musique 7 dB dessous, puis ducking ≈ -8 dB pendant la voix → ≈ -15 dB sous la voix, bruitages présents
gv = -16 - float(loudness(voix_raw)['input_i'])
gs = -19 - float(loudness(sfx_raw)['input_i'])
mus_trim = os.path.join(TMP, 'mus_trim.wav')
run(['ffmpeg', '-y', '-hide_banner', '-i', mus_src, '-af',
     f'aformat=sample_rates=48000:channel_layouts=stereo,atrim=0:{DUR},apad,atrim=0:{DUR}', '-c:a', 'pcm_s24le', mus_trim])
gm = -23 - float(loudness(mus_trim)['input_i'])

voix = os.path.join(OUT, 'voix.wav')
musique = os.path.join(OUT, 'musique.wav')
bruitages = os.path.join(OUT, 'bruitages.wav')
run(['ffmpeg', '-y', '-hide_banner', '-i', voix_raw, '-i', mus_trim, '-i', sfx_raw, '-filter_complex',
     f'[0:a]volume={gv:.2f}dB,asplit=2[v][sc];'
     f'[1:a]volume={gm:.2f}dB,afade=t=in:d=0.08,afade=t=out:st={DUR - 1:.2f}:d=1[m];'
     # ducking : la musique baisse quand la voix parle
     '[m][sc]sidechaincompress=threshold=0.03:ratio=4:attack=30:release=300:makeup=1[md];'
     f'[2:a]volume={gs:.2f}dB[s]',
     '-map', '[v]', '-c:a', 'pcm_s24le', voix,
     '-map', '[md]', '-c:a', 'pcm_s24le', musique,
     '-map', '[s]', '-c:a', 'pcm_s24le', bruitages])

# 3. mix final, normalisé à -14 LUFS (2 passes), true peak -1 dBTP
mix = os.path.join(TMP, 'mix.wav')
run(['ffmpeg', '-y', '-hide_banner', '-i', voix, '-i', musique, '-i', bruitages, '-filter_complex',
     '[0:a][1:a][2:a]amix=inputs=3:normalize=0[o]', '-map', '[o]', '-c:a', 'pcm_s24le', mix])
m = loudness(mix)
ln = (f"loudnorm=I=-14:TP=-1:LRA=11:measured_I={m['input_i']}:measured_TP={m['input_tp']}:"
      f"measured_LRA={m['input_lra']}:measured_thresh={m['input_thresh']}:offset={m['target_offset']}:linear=true")
final = os.path.join(OUT, 'carrousel_son.mp4')
run(['ffmpeg', '-y', '-hide_banner', '-i', VIDEO, '-i', mix, '-map', '0:v', '-map', '1:a',
     '-af', ln + ',aresample=48000', '-c:v', 'copy', '-c:a', 'aac', '-b:a', '192k', '-ar', '48000',
     '-t', str(DUR), '-movflags', '+faststart', final])
f = loudness(final)
print(f"carrousel_son.mp4 : {f['input_i']} LUFS, true peak {f['input_tp']} dBTP")

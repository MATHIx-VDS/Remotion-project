# Boxe Académie Brive — « Le gant » (intro 3D + planning)

Reel Instagram 1080×1920, 60 i/s : un grand gant de boxe rouge à lacets, accroché par ses lacets dans un hangar,
tourne sur lui-même ; une main bandée (bandes de boxe grises) le saisit et l'arrache vers l'objectif, l'écran passe
au noir et le film du planning de la semaine (`films/boxe-academie`) démarre.

Rendu en 3D réelle (Blender / Cycles, éclairage physique, flou de bougé et profondeur de champ optiques), sans IA générative.

## Fichiers
| Fichier | Rôle |
|---|---|
| `glove_geo.py` | le gant, modélisé par champ de distance d'après la photo de référence du client : coque des doigts repliée sur la paume, pouce cousu, ouverture de la poigne, bande de poignet, plis du cuir dans la géométrie, coutures, œillets |
| `scene.py` | la scène Blender : hangar (HDRI Poly Haven `small_hangar_01`, CC0), cuir rouge (textures Poly Haven `leather_red_02`, CC0), impression BOXE / ACADÉMIE, lacets, main riggée (WebXR generic hand, MIT) posée en cinématique directe, bandes, avant-bras, ongles, caméra 50 mm f/4, lumières, animation |
| `sfx.py` | son de l'intro, synthétisé : ambiance de hangar, grincement du lacet, frottement de la main, claquement du cuir, arrachage |
| `finish.py` | composition (gant + main sur la plaque du hangar), mise à l'échelle 1080×1920, étalonnage ciné (rouge, halation, vignettage, grain), fondu au noir, montage avec le Reel du planning |

## Refaire le film
```bash
pip install bpy scikit-image opencv-python-headless scipy soundfile pyloudnorm   # Blender 5.3 en module Python
python glove_geo.py assets/glove.npz
# assets/ : glove.npz, logo.png, small_hangar_01_4k.hdr, hangar_blur.hdr, leather_*.jpg, right.glb
python scene.py assets seq anim 1 122 --res 67 --spp 256 --bg            # plaque du hangar
python scene.py assets seq anim 1 122 --res 67 --spp 32 --thr 0.03 --fg  # gant + main (≈ 65 s / image sur 4 cœurs)
python sfx.py intro.wav
python finish.py seq graded ../boxe-academie/deliver/boxe-academie-planning-9x16.mp4 intro.wav deliver/boxe-academie-gant-9x16.mp4
```
Aperçus : `scene.py assets out still 100 --res 40 --spp 24` (une image), `--angle 0` (gant seul, vue fixe), `--top` (vue de dessus de la prise).

# Boxe Académie Brive — film du planning

Film de lancement de 27 s (1920×1080, 60 i/s) et sa variante Reel 9:16 (1080×1920). Il montre le vrai planning
hebdomadaire du club, recréé en code (Remotion) à partir d'une seule source de données (`src/data.ts`, 29 cours).
L'image et le son sont générés par le code : pas de capture d'écran, pas de musique samplée.

## L'idée
**Un cours pour toi.** La ligne orange « maintenant » du site compte les heures (10h → 21h), entre dans le planning,
saute de jour en jour et se pose à chaque fois sur un cours : midi le lundi, MMA le mardi, puis le mercredi de 4 ans
aux adultes, jusqu'au dimanche matin. Elle finit en soulignement d'ACADÉMIE, au-dessus de `boxe-academie.fr` et du
bouton APPELER. Le planning prouve l'idée, pas un slogan : 17 mots de copy en tout.

Détails : `BRIEF.md` (brief client et hypothèses), `TREATMENT.md` (concept, découpage, copy).

## Livrables (`deliver/`)
| Fichier | Contenu |
|---|---|
| `boxe-academie-planning-16x9.mp4` | master 1920×1080 @ 60 i/s, H.264 BT.709, AAC 48 kHz, −14 LUFS, flou de mouvement réel |
| `boxe-academie-planning-9x16.mp4` | Reel Instagram 1080×1920, re-mise en page de la même timeline (jour par jour), pas un recadrage |
| `poster.png` / `poster.jpg` | dernière image : wordmark, boxe-academie.fr, APPELER |
| `qa/` | rapports de contrôle (spec, synchro, forensics, audit son) |

## À fournir par le club avant diffusion
1. **Le logo** : déposer le fichier dans `public/brand/logo.svg` (ou `.png` / `.webp`). Il se place automatiquement à
   gauche du wordmark, dans l'en-tête du planning et sur la carte finale. Aucun logo n'a été dessiné à sa place.
2. **Polices exactes du site** (Oswald et Archivo les remplacent pour l'instant) et **couleurs vérifiées à la pipette**
   (`src/brand/tokens.ts`).
3. Les heures de fin sont estimées et ne s'affichent jamais ; seules les heures de début (celles du site) sont à l'écran.

## Grille
120 BPM, 60 i/s : 1 temps = 30 images, 1 mesure = 2 s. Toutes les images-clés viennent de `src/timeline.ts`
(`b(mesure, temps, double-croche)`), et les points de synchro du son sont calculés depuis le code de l'image (`src/sync.ts`).

| Acte | Mesures | Contenu |
|---|---|---|
| Accroche | 1–2 | 10h → 21h, « Quand tu veux. » |
| Semaine | 3 | le planning se construit (drop), plongée vers lundi |
| Jours | 4–11 | un jour par mesure, mercredi sur deux (l'échelle des âges) |
| Fin | 12–13 + traîne | « Un cours pour toi. », wordmark, URL, APPELER |

## Rendre
Prérequis : Node 22+, ffmpeg 6+, Python 3.11+ (`numpy scipy soundfile pyloudnorm opencv-python librosa`), Chromium headless.
```bash
npm install
npm run check                 # tsc + lint + grille
npm run cues && npm run audio # points de synchro -> public/audio/soundtrack.wav (synthèse, -14 LUFS)
npm run render:preview        # aperçu rapide -> out/preview.mp4
bash scripts/render.sh Film out/film.mp4 --blur --budget 6            # master 16:9 avec flou de mouvement
bash scripts/render.sh Film9x16 out/film-9x16.mp4                      # Reel 9:16
npm run studio                # itérer acte par acte (dossier Acts)
```
Pour corriger un cours : modifier `src/data.ts` (les contrôles — 29 cours, 5/4/7/4/4/4/1 par jour, ≤ 2 cours qui se
chevauchent, horaires au quart d'heure dans 10h–21h30 — bloquent le rendu si une donnée est fausse), puis relancer
`npm run cues && npm run audio` et le rendu.

Méthode : [cinetic](https://github.com/Leonxlnx/cinetic) (MIT), d'après l'exemple Tessel.

# Sources du kit Instagram · 28.11

- `infos.js` : **[LIEU]**, **[INSCRIPTION]**, **[TARIF]**. Remplis-les une fois ici, puis relance l'export.
- `decoupe.py` : découpe Kevin et Chloé dans l'affiche (`assets/affiche-capture.png`, extraite de la capture du post Facebook).
  Avec le fichier original de l'affiche, relance `python decoupe.py affiche.png assets` : meilleure qualité, même cadrage.
- `kit.css` / `kit.js` : charte (orange de l'affiche #F5710A relevé à la pipette, Anton + Inter, béton/grunge générés, bandes déchirées).
- `carrousel-*.html`, `story-*.html` → `node export.js` (PNG + contrôle des marges et des zones de sécurité Instagram).
- Reel : `reel.html` + `reel.js` (animation image par image) → `node reel-frames.js <frames> 12`,
  puis `python son/reel_son.py <musique.wav> <bruitages> <son.wav>`, puis `python reel-assemble.py <frames> <son.wav> ../reel/reel-teaser-28-11.mp4`.
- Son :
  - musique ACE-Step 1.5 (`son/musique.py`, graine 11, 100 BPM, usage commercial libre), décalée pour que ses temps tombent sur les coupes ;
  - bruitages synthétisés (`son/bruitages.py`) ;
  - master à -14 LUFS.

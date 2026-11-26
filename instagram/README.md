# Visuels Instagram · Le Défi du Sac de Noël

Carrousel de 5 slides (1080×1350) et une story (1080×1920), même direction artistique que le jeu.
Le sac de frappe est le SVG du jeu (`common.js` le reprend de `jeu-noel/index.html`).

- `export/` : les PNG prêts à publier, plus `boxe-academie-instagram.zip`
- `01-…05-*.html`, `story.html` : chaque visuel en HTML/CSS (`common.css` + `common.js` pour la guirlande, la neige, l'en-tête, la pagination et la flèche)
- `assets/` : photos du club, logo, captures réelles du jeu en ligne (`tools/capture.js`, viewport 390×844)
- `tools/export.js` : export PNG avec Playwright, avec un contrôle des textes qui sortent de la marge de 80 px

Story : 250 px libres en haut et en bas. La zone de 600×200 px pour les stickers Lien + Sondage est au milieu en bas
(x 240 → 840, y 1440 → 1640), sous « Touche le lien ↓ ».

```bash
node tools/capture.js assets   # nouvelle capture du jeu en ligne
node tools/export.js           # tous les PNG (ou : node tools/export.js 03 story)
```

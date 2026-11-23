# Climatek × Fromagerie des Monédières : revue de compte (vidéo)

Vidéo de 5 minutes (16:9, 1920×1080, en français) en style jeu vidéo en monde ouvert, réalisée avec HyperFrames (HTML + GSAP rendus en MP4).

- `script.json` : texte de chaque réplique, voix (étudiant), noms du générique, école et cours.
- `assets/voix/<code>.<ext>` : enregistrements des étudiants (voir `ENREGISTREMENTS.md`).
- `compositions/s1…s7.html` : les 7 scènes ; `hud.html` : mini-carte, horloge, argent ; `captions.html` : sous-titres (généré).
- `tools/build.mjs` : normalise les voix, cale les animations et les sous-titres sur la durée réelle des répliques, régénère `index.html`.

## Reconstruire et rendre

```bash
npm run build                      # après tout changement de voix ou de texte
npx hyperframes@0.9.84 preview     # aperçu dans le navigateur
npx hyperframes@0.9.84 render --quality delivery -o renders/climatek.mp4
```

Pour changer les noms du générique : modifier `speakers` et `credits` dans `script.json`, puis `npm run build`.

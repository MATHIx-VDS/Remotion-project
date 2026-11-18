# BRIEF — Boxe Académie Brive · planning des cours

**Spec :** `1920x1080@60, 27s, 120BPM, audio: synthesized` · variante `1080x1920@60` (Reel 9:16, re-layout de la même timeline) · poster = dernière image.
**Format :** Launch film / teaser (cinetic §1), énergie high. **Moteur :** Remotion 4.0.529.

## Brief client (recopié tel quel)

Le film met en scène le VRAI planning hebdomadaire du club Boxe Académie Brive (boxe-academie.fr, Brive-la-Gaillarde),
recréé en code à l'identique du site : mêmes cours, mêmes jours, mêmes horaires, mêmes publics, même look noir et orange.
En cas de conflit entre ce brief et une règle de cinetic (hard bans compris), CE BRIEF GAGNE : c'est la marque du client
(« brand-supplied »).

### 1. Le client
- Nom : **Boxe Académie Brive** (wordmark du site : « BOXE » blanc, « ACADÉMIE » orange, « BRIVE » blanc).
- Site : boxe-academie.fr. Club multi-disciplines à Brive-la-Gaillarde.
- Disciplines : boxe anglaise, boxe française, boxe thaï · K1, kick boxing, MMA, cross boxing, BodyBoxe, Lady Boxe,
  boxe éducative, Baby Boxe, Open Mat.
- Ton : sportif, dur, jeune. Énergie « launch film » (énergie high), pas une ambiance calme.
- Logo : utiliser le VRAI logo du club (fichier fourni par le client). Ne pas inventer de logo, ne pas redessiner de
  mark : l'étape « Explore the mark » (Step 2) est SUPPRIMÉE. On ne fait que poser le logo + le wordmark.
- Pas de prix, pas de numéro de téléphone, pas d'adresse inventés. Si une info manque : la laisser hors du film.

### 2. Identité visuelle (brand-supplied — exceptions aux hard bans)

| Token | Hex | Rôle |
|---|---|---|
| `ink` | `#141415` | fond général |
| `surface` | `#1C1C1E` | colonnes du calendrier |
| `card` | `#232326` | fond des cartes de cours |
| `line` | `#2C2C30` | lignes horaires et séparateurs (hairline 1 px) |
| `text` | `#FFFFFF` | titres de cours, jours |
| `mute` | `#9A9AA0` | public du cours, heures de la grille |
| `orange` (ACCENT) | `#EE6A3A` | accent unique : barre d'en-tête, APPELER, « ACADÉMIE », heure des cours, ligne « maintenant », « AUJOURD'HUI » |
| `peach` | `#F4A66A` | barre latérale des cours « autres sports de combat » |
| `todayTint` | orange ~6 % sur `surface` | colonne du jour |

- Orange = brand-supplied ; sens de l'accent : « maintenant / ton cours » ; sobre ailleurs (≤ 8 % des pixels hors flood).
- Typo brand-supplied : display condensée en capitales (logo, jours, APPELER) + sans moderne pour le contenu des cartes ; chiffres tabulaires.
- Langue : français.

### 3. Le calendrier
En-tête (barre orange, logo + wordmark, menu `LE CLUB ▾` actif · `AFFILIATIONS` · `OPEN MAT` · `E-SHOP` · `CONTACT`, bouton `APPELER` à coin biseauté) ;
colonnes `LUN … DIM`, jour courant en blanc + `AUJOURD'HUI` orange, colonne teintée ; axe `10h`–`21h` (grille jusqu'à 21h30) ;
ligne « maintenant » orange avec point ; cartes : barre latérale 3–4 px, hauteur = durée, 3 lignes (heure [· âge], nom, public) ;
deux cours au même créneau côte à côte. Données : `src/data.ts` (29 cours, asserts). Fin estimée jamais affichée.

### 4–6. Ce que le film montre, pistes, formats
Planning complet lisible jour par jour ; plan large ≤ 1,7 s puis push ×2–×5 ; idée : un créneau pour chaque profil (4 ans → adulte,
midi → soir, 7 j/7), prouvée par le planning. Fin : logo + wordmark, `boxe-academie.fr`, bouton `APPELER`.
Device : la ligne « maintenant ». Copy française ≤ 5 mots par ligne. Son énergique synthétisé. 16:9 master 20–30 s + 9:16 Reel re-layouté + poster.

## Hard bans (cinetic) et exceptions

Bans maintenus : pas d'eyebrow / tagline empilée / « Introducing », pas de texte de remplissage, pas de serif, pas d'italique,
pas de néon / glow / bloom, pas de violet ni de dégradé multi-teintes, pas de glassmorphism, pas d'emoji ni d'icônes stock,
pas de particules / confettis / lens flare, pas d'overshoot hors atterrissage (≤ 2).

**Exceptions brand-supplied (Boxe Académie Brive) :**
1. L'orange `#EE6A3A` (accent) et le peach `#F4A66A` (barres latérales) — marqués `cinetic:brand-supplied` dans `src/brand/tokens.ts`.
2. La display condensée en capitales (Oswald, faute de pouvoir identifier la police exacte du site — voir hypothèses).

## Hypothèses (à valider par le client)
- **Logo :** le fichier du vrai logo n'a pas été fourni dans le dépôt et boxe-academie.fr n'est pas joignable depuis l'environnement de
  production. Aucun logo n'est inventé : le film pose le wordmark typographique, et charge automatiquement `public/brand/logo.png`
  (ou `.svg`) dès que le fichier est déposé — puis re-render.
- **Polices :** Oswald (display condensée capitales, proche du site) + Archivo (sans du contenu). À remplacer par les polices exactes du site.
- **Couleurs :** valeurs du brief (non vérifiées à la pipette).
- **Heures de fin :** estimées (hauteur des cartes), jamais affichées à l'écran.
- **Jour « aujourd'hui » :** la surbrillance du jour courant avance avec la ligne « maintenant » (la semaine passe en accéléré).

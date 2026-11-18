# TREATMENT : Boxe Académie Brive — « Un cours pour toi »

**Spec :** `1920x1080@60, 27.2s, 120BPM, audio: synthesized` · **Format :** launch film / teaser · **Moteur :** Remotion 4.0.529
**Produit :** le planning hebdomadaire du club (29 cours, 7 jours) · **Public :** Brive et alentours, fil Instagram / site, d'abord muet.
**Hypothèses :** voir `BRIEF.md` (logo absent → slot, polices proches, fins de cours estimées jamais affichées).

## 1. Inventaire
| Liste | Contenu |
|---|---|
| Nom | « Académie » : on apprend, à tout âge ; le wordmark pose ACADÉMIE en orange — la ligne finit en dessous |
| Comportement non évident | Contrairement à un club « du soir pour adultes », le planning couvre 4 ans → adultes, midi → soir, 7 j/7 |
| Valeur | Avant : « pas de créneau pour moi ». Après : un cours précis, à une heure précise, pour mon âge |
| Objets du produit | la ligne « maintenant » + point, la carte de cours (barre, heure, nom, public), la colonne AUJOURD'HUI |
| Le nombre | 29 cours, 7 jours, dès 4 ans |
| Clichés interdits ici | gants qui se percutent, sac de frappe, sueur au ralenti, ring enfumé, compte à rebours |
| Son du monde | cloche de ring → interdite (cliché) ; on garde le tic de l'horloge du planning |

## 2. Trois concepts
| Lentille | Logline | Device | Propriété | Spécificité | Score /15 |
|---|---|---|---|---|---|
| (a) verbe littéral | La ligne « maintenant » traverse la semaine et trouve un cours à chaque profil. | la ligne orange | ✔ objet du vrai site | ✔ montre 4 ans → adultes, midi, dimanche | 13 |
| (b) douleur visible | « Trop tard pour la boxe » : un réveil, un bureau, un horaire raté. | une horloge | ✘ tout club de sport | ✘ | 6 |
| (c) device formel | Un seul plan-séquence qui descend la colonne du mercredi, de 4 ans aux adultes. | la caméra | ✔ | ✔ | 11 |

**Choisi :** (a). **Greffe :** de (c), l'échelle du mercredi (deux mesures : 4 à 6 ans → 7 à 10 → 11 à 14 → adultes) ; de (b), l'accroche par l'heure (10h → 21h).

## 3. Concept
- **Idée :** il y a un créneau pour toi.
- **Device :** la ligne « maintenant » orange avec son point (déjà sur le site). Elle compte les heures, entre dans le planning, saute de jour en jour, se pose sur un cours, puis devient le soulignement d'ACADÉMIE.
- **Grammaire :** la ligne ne quitte jamais l'écran ; le temps descend (vertical), les jours avancent (horizontal).
- **Personnalité :** dur, jeune, direct → display condensée en capitales (brand), sans Archivo pour les cartes, fond noir, accent orange = « maintenant / ton cours », mouvements secs (whips sur le temps, landings sur la double-croche).
- **Logo :** fourni par le client (Step 2 sauté). Slot `public/brand/logo.*`.
- **Signature sonore :** le tic du point (keep-time) ; une note par jour qui monte la gamme, résolue sur la promesse.

## 3b. Techniques tirées
`<!-- pick.py --seed 2910628843 --format launch --energy high --seconds 26 -->`

| Pick | Où | Adaptation |
|---|---|---|
| `tr-subtract-reveal` | fin | le planning s'écarte colonne par colonne (vecteur depuis le centre, E.contact 30 f) et révèle le wordmark déjà posé derrière |
| `ty-reading-order-exit` | accroche, chaque phrase | les mots partent dans l'ordre de lecture (4 f d'écart), seule la ligne reste |
| `cam-push-dutch-roll` | semaine → lundi | plongée 60 f sur E.smooth, roulis 0 → −4° → 0 |
| `mi-focus-ring-pop-or-trim` | chaque cours trouvé + APPELER | anneau orange qui s'écarte (4 → 14 px) et s'éteint en 20 f |
| `oh-live-grid-cold-open` | — | **abandonné** : une grille 2×2 casserait l'idée « une ligne, un temps » |
| `tr-defocus-cut` | — | **abandonné** : aucune coupe entre plans sans rapport, tout est un seul monde |
| `pd-fast-prompt-true-scale` | — | **abandonné** : le produit n'a pas de saisie |
| `ui-push-aside-reflow` | — | **abandonné** : le planning n'a pas de panneau qui entre |
| `le-mark-glint-turn` | — | **abandonné** : reflet = effet gabarit sur un logo plat fourni |
| `dn-answer-card-bars` | — | **abandonné** : pas de réponse chiffrée, la preuve est le planning lui-même |

## 4. Arc et chemin du device
Accroche (m. 1–2) → semaine (m. 3, drop) → jours (m. 4–11 ; mercredi = payoff, m. 6–7) → promesse (m. 12, ré-entrée) → lockup (m. 13 + traîne).
Ligne : dessinée depuis son point → descend d'heure en heure → se réduit dans la colonne LUN à 12:15 → glisse de colonne en colonne → descend l'échelle du mercredi → dimanche 10:00 → devient le soulignement d'ACADÉMIE.

## 5. Beat sheet (120 BPM, 1 mesure = 2 s)
| # | Mesures | Temps | Image | Copy | Son |
|---|---|---|---|---|---|
| 1 | 1 | 0:00–0:02 | la ligne se dessine, 10h · 12h · 15h · 18h · 21h sur des croches | — | pops qui montent |
| 2 | 2 | 0:02–0:04 | « QUAND TU VEUX. » sous la ligne, le point bat la mesure | Quand tu veux. | build, tics |
| 3 | 3 | 0:04–0:06 | drop : le planning se construit autour de la ligne, plan large 1,5 s, plongée vers lundi | — | drop 1, whoosh |
| 4 | 4 | 0:06–0:08 | Lundi 12:15 Cross Boxing | Même à midi. | note 1 |
| 5 | 5 | 0:08–0:10 | Mardi · MMA · 19:00 | — | note 2 |
| 6 | 6–7 | 0:10–0:14 | Mercredi 15:30 Baby Boxe, puis 7 à 10 · 11 à 14 · adultes | Dès 4 ans. | drop 2 (le plus fort), notes |
| 7 | 8–9 | 0:14–0:18 | Jeudi MMA Ados 17:30 ; Vendredi Lady Boxe 20:00 | — | groove |
| 8 | 10–11 | 0:18–0:22 | Samedi Open Mat 15:30 · 16 ans et plus ; Dimanche BodyBoxe 10:00 | 7 jours sur 7. | breakdown |
| 9 | 12 | 0:22–0:24 | recul sur la semaine, les 29 cours s'allument | Un cours pour toi. | ré-entrée, résolution de la gamme |
| 10 | 13 + traîne | 0:24–0:27 | le planning s'écarte, wordmark, ligne sous ACADÉMIE, boxe-academie.fr, APPELER | — | musique coupée, cloche douce, clic |

## 6. Copy
| Ligne | Mots |
|---|---|
| Quand tu veux. | 3 |
| Même à midi. | 3 |
| Dès 4 ans. | 3 |
| 7 jours sur 7. | 4 |
| Un cours pour toi. | 4 |
| **Total** | **17 / 35** (libellés du planning, wordmark et URL comptés à part, tous dérivés de `data.ts`) |

## 7. Dernière image (poster)
Fond noir, « BOXE ACADÉMIE BRIVE » centré (ACADÉMIE orange, souligné par la ligne), dessous `boxe-academie.fr` et le bouton orange APPELER biseauté. Le logo réel se place à gauche du wordmark dès que le fichier est déposé.

## 8. Gate
- [x] logline ≤ 15 mots · [x] spécificité : 4 ans → adultes, midi, dimanche (beats 4, 6, 8)
- [x] 17 mots, ≤ 5 par ligne · [x] device dans chaque beat · [x] chaque tirage placé ou abandonné avec raison
- [x] dernière image = wordmark + nom · [x] hard bans respectés hors exceptions brand-supplied listées dans BRIEF.md

# Le Défi du Sac de Noël · Boxe Académie Brive

Mini-jeu web de Noël : 15 secondes pour frapper le sac le plus de fois possible, puis inscription au tirage au sort
(1 mois d'abonnement offert, tirage le 24 décembre 2026).
Site statique en HTML, CSS et JavaScript (sans framework), environ 350 Ko avec les polices. Hébergé sur Netlify et formulaire géré par Netlify Forms.

## Les fichiers
| Fichier | Rôle |
|---|---|
| `config.js` | **Toutes les infos à personnaliser** : e-mail du club, URL de la boutique, dates, lot, liste des photos |
| `index.html` | le jeu : accueil, compte à rebours, jeu, résultat, formulaire du tirage |
| `reglement.html` | le règlement (⚠️ à faire relire par le président du club) |
| `tirage.html` | outil du 24 décembre : charge l'export CSV de Netlify, supprime les doublons, tire au sort (page non liée et non indexée) |
| `merci.html` | confirmation affichée seulement si le formulaire est envoyé sans JavaScript |
| `photos/` | photos du club (fond de l'accueil et galerie « Le club ») |
| `og-image.jpg` | image affichée quand on partage le lien (WhatsApp, Instagram, SMS) |
| `assets/` | styles, logique du jeu (`app.js`), sons synthétisés (`sfx.js`), logo |

## Mise en ligne depuis un iPad (Safari, sans rien installer)

### 1. Créer le site sur Netlify (environ 5 min)
1. Va sur **app.netlify.com** et choisis **Sign up → GitHub** (ou connecte-toi).
2. **Add new site → Import an existing project → GitHub**, autorise Netlify, puis choisis le dépôt **Remotion-project**.
3. Réglages du déploiement :
   - **Branch to deploy** : `claude/wizardly-ramanujan-bxmabw` (ou `main` une fois la branche fusionnée)
   - **Base directory** : `jeu-noel`
   - **Build command** : laisse vide
   - **Publish directory** : `jeu-noel`
4. Touche **Deploy**. Au bout d'environ 30 secondes, le site est en ligne sur une adresse du type `xxx.netlify.app`.
5. **Site configuration → Change site name** : mets `defi-noel-boxe-academie`.
   L'adresse devient `https://defi-noel-boxe-academie.netlify.app`, celle déjà prévue pour l'aperçu du lien.
   Si ce nom est pris, choisis-en un autre et remplace l'adresse dans les lignes `og:url` et `og:image` de `index.html`.

### 2. Activer les formulaires (indispensable)
1. **Site configuration → Forms → Enable form detection**.
2. **Deploys → Trigger deploy → Deploy site**. Netlify ne repère le formulaire qu'au déploiement, d'où ce nouveau déploiement.
3. Vérifie : **Forms** doit afficher un formulaire nommé **tirage-noel**.
4. Facultatif : **Forms → Form notifications → Add notification → Email notification** pour recevoir un e-mail à chaque inscription.
5. Teste : joue une partie, inscris-toi, puis vérifie que l'inscription apparaît dans **Forms → tirage-noel**.

> Le plan gratuit de Netlify a un quota de soumissions de formulaire. Vérifie-le dans **Usage / Billing** si tu attends
> beaucoup de participants.

### 3. Personnaliser (sur github.com, dans Safari)
1. Ouvre le dépôt, choisis la bonne branche, puis ouvre `jeu-noel/config.js`.
2. Touche le crayon ✏️ et remplace les valeurs entre `[CROCHETS]` : e-mail du club, URL de la boutique, date de lancement, adresse, statut et valeur du lot.
3. **Commit changes**. Netlify remet le site à jour tout seul en 1 minute environ.

Tant qu'une valeur reste entre crochets :
- le bouton « Découvrir la boutique du club » reste caché ;
- le règlement affiche l'info manquante surlignée en orange.

### 4. Ajouter des photos
1. Dans `jeu-noel/photos`, utilise **Add file → Upload files** (JPG d'environ 1000 px de large, de préférence moins de 150 Ko chacune).
2. Ajoute leur nom dans la liste `PHOTOS` de `config.js`, par exemple `'photos/entrainement.jpg',`.

S'il n'y a aucune photo, l'accueil affiche un fond rayé orange et la galerie montre les disciplines du club.

### 5. Le 24 décembre : le tirage
1. Sur Netlify, va dans **Forms → tirage-noel** et touche le bouton de téléchargement en CSV.
2. Ouvre `https://<ton-site>/tirage.html`, choisis le fichier, puis touche **Tirer au sort**.
   - L'outil garde une participation par e-mail (la première reçue) et seulement les règlements acceptés.
   - Il affiche le gagnant et 2 suppléants, ainsi que la liste des inscrits à la newsletter.
   - Le fichier ne quitte pas l'iPad.
3. Fais une capture d'écran du résultat pour garder une trace.

## Le jeu
- **Score** = nombre de coups comptés en 15 s. Titres : Échauffement (moins de 30), Bon boxeur (30 à 59), Guerrier (60 à 89), Champion du ring (90 et plus).
- **Combo x2** : au-delà de 5 coups par seconde, le sac devient incandescent et lance des étincelles. C'est un effet visuel : le score compte les vrais coups.
- **Anti-triche** :
  - au plus 20 coups comptés par seconde ;
  - plusieurs doigts posés en même temps comptent pour un seul coup ;
  - une touche maintenue ne compte qu'une fois ;
  - les clics simulés par script sont ignorés.
- **Commandes** : tap, clic ou barre Espace.
- **Son et vibrations** : les sons sont synthétisés (Web Audio) et un bouton permet de les couper. La vibration fonctionne sur Android ; l'iPhone ne permet pas aux sites web de faire vibrer.
- **Une participation par e-mail** : bloquée sur le téléphone du joueur, et les doublons venant d'autres appareils sont retirés par `tirage.html`.

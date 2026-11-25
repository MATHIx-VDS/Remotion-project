/* =====================================================================
   LE DÉFI DU SAC DE NOËL — RÉGLAGES DU JEU
   ---------------------------------------------------------------------
   C'est le SEUL fichier à modifier pour personnaliser le jeu.
   Sur iPad : ouvre ce fichier sur github.com, touche le crayon ✏️,
   modifie le texte ENTRE LES GUILLEMETS, puis « Commit changes ».
   Netlify remet le site à jour tout seul en 1 minute.

   Une valeur qui contient encore des [CROCHETS] est considérée
   comme « pas encore remplie » :
   - le bouton de la boutique reste caché tant que SHOP_URL n'est pas remplie ;
   - dans le règlement, les infos manquantes s'affichent surlignées en orange.
   ===================================================================== */
window.CONFIG = {
  // --- Le club --------------------------------------------------------
  CLUB_NAME: 'Boxe Académie Brive',
  CLUB_EMAIL: '[E-MAIL DU CLUB]',                 // ex. 'contact@boxeacademiebrive.fr'
  CLUB_ADDRESS: '[ADRESSE DU CLUB]',              // ex. '12 rue …, 19100 Brive-la-Gaillarde'
  CLUB_STATUS: '[STATUT JURIDIQUE]',              // ex. 'association loi 1901, SIRET …'
  SHOP_URL: '[URL DE L\'E-SHOP À COMPLÉTER]',     // ex. 'https://boutique.boxeacademiebrive.fr'

  // Adresse publique du jeu, une fois en ligne (sert au lien de partage).
  // Laisse vide : le jeu utilise automatiquement l'adresse de la page.
  SITE_URL: '',

  // --- Le jeu-concours ------------------------------------------------
  LAUNCH_DATE: '[DATE DE LANCEMENT]',             // texte affiché, ex. '1er décembre 2026'
  END_DATE_TEXT: '23 décembre 2026 à minuit',
  // Fin des participations (heure de Paris). Après cette date, le formulaire est fermé.
  END_DATETIME: '2026-12-23T23:59:59+01:00',
  DRAW_DATE_TEXT: '24 décembre 2026',
  RESULT_TEXT: 'Résultat le 24 décembre.',
  PRIZE_SHORT: '1 mois offert',
  PRIZE_TEXT: '1 mois d\'abonnement offert au club',
  PRIZE_VALUE: '[VALEUR DU LOT EN €]',            // ex. '45 €' (valeur commerciale, indiquée au règlement)
  CLAIM_DAYS: 15,                                 // jours laissés au gagnant pour répondre

  // --- Photos du club -------------------------------------------------
  // Dépose les photos dans le dossier /photos puis ajoute leur nom ici.
  // Conseil : JPG de 1000 px de large maximum (≈ 100 Ko) pour un chargement rapide.
  PHOTOS: [
    'photos/club-01.jpg',
    'photos/club-02.jpg',
  ],

  // --- Jeu --------------------------------------------------------------
  GAME_SECONDS: 15,
  MAX_HITS_PER_SECOND: 20, // anti-triche : coups comptés au maximum par seconde
  COMBO_HITS_PER_SECOND: 5, // au-delà : COMBO x2
  TITLES: [
    // du plus haut au plus bas : le premier seuil atteint donne le titre
    { min: 90, title: 'Champion du ring' },
    { min: 60, title: 'Guerrier' },
    { min: 30, title: 'Bon boxeur' },
    { min: 0, title: 'Échauffement' },
  ],
  SHARE_TEXT: 'J\'ai mis {score} coups au sac de la Boxe Académie Brive 🥊 Viens me battre : {lien}',
};

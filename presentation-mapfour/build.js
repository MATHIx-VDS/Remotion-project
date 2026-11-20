// Boxe Académie Brive × MAP FOUR — présentation partenaires (PowerPoint).
// node build.js  ->  Boxe-Academie-Brive-x-MAP-FOUR.pptx
// Style : bleu nuit « tech », grille de points, halo turquoise sous les produits, coins biseautés
// (le bouton APPELER du club) comme motif. Toutes les images viennent du dossier d'origine.
const path = require('path');
const NM = process.env.DECK_NODE_MODULES || path.join(__dirname, 'node_modules');
const req = (m) => require(require.resolve(m, { paths: [NM, __dirname] }));
const pptxgen = req('pptxgenjs');
const React = req('react');
const { renderToStaticMarkup } = req('react-dom/server');
const sharp = req('sharp');
const Fi = req('react-icons/fi');

const A = (f) => path.join(__dirname, 'assets', f);
const OUT = path.join(__dirname, 'Boxe-Academie-Brive-x-MAP-FOUR.pptx');

// ---------------------------------------------------------------- palette
const K = {
  bg: '0B0B0D', // le noir du club
  panel: '161618', // cartes
  panel2: '1D1D20',
  line: '2C2C30', // filets
  teal: 'FF5A1F', // accent principal : l'orange du club (nom historique de la clé)
  tealDim: '7A2C10',
  orange: 'F4A66A', // second ton (formule B) : le peach du site
  white: 'F4F1EC', // le blanc cassé du wordmark
  text: 'E9E6E1',
  mute: '9A9AA0',
};
const TITLE = 'Arial Narrow'; // condensé, comme le wordmark du site
const HEAD = 'Arial';
const BODY = 'Calibri';
const W = 13.333;
const H = 7.5;
const M = 0.6; // marge

async function icon(Comp, color, size = 256) {
  const svg = renderToStaticMarkup(React.createElement(Comp, { color: '#' + color, size: String(size), strokeWidth: 1.8 }));
  const buf = await sharp(Buffer.from(svg)).png().toBuffer();
  return 'image/png;base64,' + buf.toString('base64');
}

(async () => {
  const pres = new pptxgen();
  pres.layout = 'LAYOUT_WIDE';
  pres.title = 'Boxe Académie Brive × MAP FOUR — Le vélo électrique pour vos salariés';
  pres.author = 'Boxe Académie Brive';
  pres.company = 'Boxe Académie Brive';
  pres.theme = { headFontFace: HEAD, bodyFontFace: BODY };

  // ------------------------------------------------------------ layouts
  const footer = (bg) => ({
    background: { path: A(bg) },
    objects: [
      { text: { text: 'BOXE ACADÉMIE BRIVE  ×  MAP FOUR', options: { x: M, y: H - 0.48, w: 6, h: 0.3, fontFace: HEAD, fontSize: 9, bold: true, color: K.mute, charSpacing: 3, margin: 0 } } },
    ],
    slideNumber: { x: W - M - 0.6, y: H - 0.48, w: 0.6, h: 0.3, fontFace: HEAD, fontSize: 9, color: K.teal, align: 'right' },
  });
  for (const [name, bg] of [['TECH_A', 'bg-a.png'], ['TECH_B', 'bg-b.png'], ['TECH_C', 'bg-c.png']]) {
    pres.defineSlideMaster({
      title: name,
      ...footer(bg),
      objects: [
        ...footer(bg).objects,
        { placeholder: { options: { name: 'title', type: 'title', x: M, y: 0.78, w: W - 2 * M, h: 0.8, fontFace: TITLE, fontSize: 36, bold: true, color: K.white, valign: 'top', align: 'left', margin: 0 }, text: '' } },
      ],
    });
  }
  pres.defineSlideMaster({ title: 'FULL', background: { color: K.bg }, objects: [] });

  // ------------------------------------------------------------ helpers
  const kicker = (s, t, x = M, y = 0.45, color = K.teal) =>
    s.addText(t, { x, y, w: 9, h: 0.3, fontFace: HEAD, fontSize: 12, bold: true, color, charSpacing: 5, margin: 0, isTextBox: true });
  const title = (s, t) => s.addText(t, { placeholder: 'title' });
  const card = (s, x, y, w, h, fill = K.panel, name) =>
    s.addShape(pres.shapes.SNIP_1_RECTANGLE ?? 'snip1Rect', { x, y, w, h, fill: { color: fill }, line: { color: K.line, width: 0.75 }, adjustPoint: 0.12, objectName: name });
  const txt = (s, t, o) => s.addText(t, { margin: 0, isTextBox: true, fontFace: BODY, color: K.text, valign: 'top', ...o });
  /** Photo with the motif: its top-right corner cut on a bevel. */
  const photo = (s, file, x, y, w, h, cut = 0.45, sizing) => {
    s.addImage({ path: A(file), x, y, w, h, sizing: sizing ?? { type: 'cover', w, h } });
    s.addShape('rtTriangle', { x: x + w - cut, y, w: cut, h: cut, rotate: 180, fill: { color: K.bg }, line: { color: K.bg, width: 0 } });
  };
  const glow = (s, x, y, w, h) => s.addImage({ path: A('glow.png'), x, y, w, h });
  /** Product cut-out fitted in a box, sitting on its glow. */
  const product = (s, file, ratio, x, y, w, h) => {
    glow(s, x - w * 0.12, y + h * 0.15, w * 1.24, h * 0.95);
    let pw = w, ph = w / ratio;
    if (ph > h) { ph = h; pw = h * ratio; }
    s.addImage({ path: A(file), x: x + (w - pw) / 2, y: y + (h - ph), w: pw, h: ph });
  };
  const stat = (s, big, label, x, y, w, bigSize = 40, color = K.teal) => {
    txt(s, big, { x, y, w, h: bigSize / 50, fontFace: HEAD, fontSize: bigSize, bold: true, color });
    txt(s, label, { x, y: y + bigSize / 50 + 0.05, w, h: 0.6, fontSize: 14, color: K.mute });
  };
  const iconRow = async (s, Comp, head, body, x, y, w) => {
    s.addShape(pres.shapes.OVAL ?? 'ellipse', { x, y, w: 0.62, h: 0.62, fill: { color: K.panel2 }, line: { color: K.tealDim, width: 1 } });
    s.addImage({ data: await icon(Comp, K.teal), x: x + 0.14, y: y + 0.14, w: 0.34, h: 0.34 });
    txt(s, head, { x: x + 0.85, y: y - 0.02, w: w - 0.85, h: 0.36, fontFace: HEAD, fontSize: 15, bold: true, color: K.white });
    txt(s, body, { x: x + 0.85, y: y + 0.34, w: w - 0.85, h: 0.5, fontSize: 14, color: K.mute });
  };
  const tableStyle = (rows, widths) => rows.map((r, i) =>
    r.map((c, j) => ({
      text: c,
      options: {
        fontFace: i === 0 ? HEAD : BODY,
        fontSize: i === 0 ? 11 : 13,
        bold: i === 0 || j === 0,
        color: i === 0 ? K.teal : j === widths.length - 1 ? K.mute : K.text,
        fill: { color: i === 0 ? K.panel2 : i % 2 ? K.panel : '0F1727' },
        border: [{ type: 'none' }, { type: 'none' }, { type: 'solid', color: K.line, pt: 0.75 }, { type: 'none' }],
        margin: [6, 10, 6, 10],
        charSpacing: i === 0 ? 2 : 0,
        valign: 'middle',
      },
    })));
  const R = { roam: 628 / 375, roamSt: 622 / 371, loopPro: 488 / 370, loop: 484 / 370, dash: 485 / 369, rayPro: 614 / 364, rayAir: 596 / 366, rayAirSt: 601 / 366 };
  const sizeOf = async (f) => { const m = await sharp(A(f)).metadata(); return m.width / m.height; };

  // ============================================================ 1. COUVERTURE
  pres.addSection({ title: 'Ouverture' });
  {
    const s = pres.addSlide({ masterName: 'FULL', sectionTitle: 'Ouverture' });
    s.addImage({ path: A('bg-cover.png'), x: 0, y: 0, w: W, h: H });
    // le wordmark du club, tel que sur boxe-academie.fr
    txt(s, [
      { text: 'BOXE ', options: { color: K.white } },
      { text: 'ACADÉMIE', options: { color: K.teal } },
      { text: ' BRIVE', options: { color: K.white } },
    ], { x: 0.4, y: 1.95, w: W - 0.8, h: 1.3, fontFace: TITLE, fontSize: 66, bold: true, align: 'center', valign: 'middle', charSpacing: 1, fit: 'shrink' });
    s.addShape('line', { x: W / 2 - 1.55, y: 3.45, w: 3.1, h: 0, line: { color: K.teal, width: 2.25 } });
    txt(s, '×  MAP FOUR', { x: 0.5, y: 3.7, w: W - 1.0, h: 0.5, fontFace: HEAD, fontSize: 18, bold: true, color: K.mute, align: 'center', charSpacing: 6 });
    txt(s, 'LE VÉLO ÉLECTRIQUE POUR LES SALARIÉS DE NOS ENTREPRISES PARTENAIRES', { x: 1.2, y: 4.5, w: W - 2.4, h: 0.95, fontFace: TITLE, fontSize: 22, bold: true, color: K.white, align: 'center', valign: 'middle', charSpacing: 1 });
    txt(s, 'OFFRE PARTENAIRES  ·  2026–2027', { x: 0.5, y: 5.65, w: W - 1.0, h: 0.4, fontFace: HEAD, fontSize: 12, bold: true, color: K.teal, align: 'center', charSpacing: 5 });
    s.addNotes('Couverture : offre vélo électrique du club pour les salariés des entreprises partenaires, avec MAP FOUR.');
  }

  // ============================================================ 2. INTRO
  {
    const s = pres.addSlide({ masterName: 'TECH_C', sectionTitle: 'Ouverture' });
    kicker(s, 'VOUS FAITES PARTIE DE LA FAMILLE DU CLUB');
    title(s, 'MERCI À NOS PARTENAIRES');
    txt(s, 'Le club s’associe à MAP FOUR pour équiper les salariés de ses entreprises partenaires en vélo électrique : 8 modèles, deux formules au choix, des aides qui se cumulent et un accompagnement de bout en bout par le club.', { x: M, y: 1.75, w: 6.0, h: 1.4, fontSize: 17, color: K.text, lineSpacingMultiple: 1.1 });
    stat(s, '8', 'vélos dans la gamme', M, 3.55, 1.9);
    stat(s, '25 %', 'du prix récupéré\n(formule A)', M + 2.05, 3.55, 2.1);
    stat(s, '600 €', 'par an et par salarié\n(formule B)', M + 4.25, 3.55, 2.1);
    product(s, 'roam-st.png', R.roamSt, 7.1, 1.9, 3.3, 2.0);
    product(s, 'loop.png', R.loop, 9.9, 3.2, 2.6, 2.0);
    product(s, 'ray-air.png', R.rayAir, 7.4, 4.25, 3.0, 1.8);
  }

  // ============================================================ 3. DEUX FORMULES
  pres.addSection({ title: "L'offre" });
  {
    const s = pres.addSlide({ masterName: 'TECH_A', sectionTitle: "L'offre" });
    kicker(s, 'L’OFFRE');
    title(s, 'DEUX FORMULES AU CHOIX');
    const cols = [
      { L: 'A', head: 'L’entreprise équipe ses salariés', items: ['L’entreprise achète les vélos et les prête à ses salariés', 'Jusqu’à 25 % du prix récupéré en réduction d’impôt', 'Aucun avantage en nature pour le salarié'], color: K.teal },
      { L: 'B', head: 'Le salarié achète, l’entreprise aide', items: ['Forfait mobilités durables : jusqu’à 600 € par an', 'Sans charges sociales ni impôt sur le revenu', 'Le vélo est remboursé en 3 ans'], color: K.orange },
    ];
    cols.forEach((c, i) => {
      const x = M + i * 6.2;
      card(s, x, 1.85, 5.9, 4.7, K.panel, `formule-${c.L}`);
      txt(s, c.L, { x: x + 0.45, y: 2.05, w: 1.2, h: 1.3, fontFace: TITLE, fontSize: 80, bold: true, color: c.color });
      txt(s, 'FORMULE ' + c.L, { x: x + 1.7, y: 2.35, w: 3.8, h: 0.3, fontFace: HEAD, fontSize: 12, bold: true, color: c.color, charSpacing: 4 });
      txt(s, c.head, { x: x + 1.7, y: 2.68, w: 3.9, h: 0.75, fontFace: HEAD, fontSize: 19, bold: true, color: K.white });
      txt(s, c.items.map((t, k) => ({ text: t, options: { bullet: { code: '25B8' }, breakLine: k < c.items.length - 1, paraSpaceAfter: 12 } })), { x: x + 0.5, y: 3.8, w: 5.0, h: 2.4, fontSize: 16, color: K.text });
    });
  }

  // ============================================================ 4. GAMME
  pres.addSection({ title: 'Les vélos' });
  {
    const s = pres.addSlide({ masterName: 'TECH_C', sectionTitle: 'Les vélos' });
    kicker(s, 'LA GAMME MAP FOUR');
    title(s, '8 VÉLOS POUR TOUS LES TRAJETS');
    const bikes = [
      ['roam.png', R.roam, 'ROAM', 'Trekking · 150 km · 100 Nm'],
      ['roam-st.png', R.roamSt, 'ROAM ST', 'Cadre bas · 150 km · 100 Nm'],
      ['loop-pro.png', R.loopPro, 'LOOP PRO', 'Compact · 160 km · 100 Nm'],
      ['loop.png', R.loop, 'LOOP', 'Compact · 120 km · 75 Nm'],
      ['dash.png', R.dash, 'DASH', 'Pliant · 130 km · 25 kg'],
      ['ray-pro.png', R.rayPro, 'RAY PRO', 'Carbone · 100 km · 80 Nm'],
      ['ray-air.png', R.rayAir, 'RAY AIR', 'Carbone · 100 km · GPS'],
      ['ray-air-st.png', R.rayAirSt, 'RAY AIR ST', 'Carbone · 100 km · 19 kg'],
    ];
    const cw = (W - 2 * M) / 4;
    bikes.forEach(([f, r, n, spec], i) => {
      const x = M + (i % 4) * cw;
      const y = 1.75 + Math.floor(i / 4) * 2.55;
      product(s, f, r, x + 0.2, y, cw - 0.4, 1.55);
      txt(s, n, { x: x + 0.2, y: y + 1.68, w: cw - 0.4, h: 0.32, fontFace: HEAD, fontSize: 15, bold: true, color: K.white, charSpacing: 2 });
      txt(s, spec, { x: x + 0.2, y: y + 2.0, w: cw - 0.4, h: 0.3, fontSize: 13, color: K.teal });
    });
  }

  // ============================================================ 5. QUALITÉ
  {
    const s = pres.addSlide({ masterName: 'TECH_B', sectionTitle: 'Les vélos' });
    kicker(s, 'QUALITÉ');
    title(s, 'QUE DES COMPOSANTS DE GRANDES MARQUES');
    const rows = [
      ['PIÈCE', 'MARQUES'],
      ['Moteurs', 'Mivice et Ananda, jusqu’à 100 Nm'],
      ['Batteries', 'Cellules Samsung et LG, jusqu’à 720 Wh'],
      ['Transmission', 'Shimano (Nexus, CUES, Tiagra, Acera) ou courroie Michelin'],
      ['Freins', 'Tektro hydrauliques à disque, 160 à 180 mm'],
      ['Pneus', 'Anti-crevaison sur toute la gamme'],
    ];
    s.addTable(tableStyle(rows, [1.7, 4.3]).map((r) => r.map((c, j) => (j === 1 ? { ...c, options: { ...c.options, color: K.text } } : c))), { x: M, y: 1.9, w: 6.2, colW: [1.7, 4.5], rowH: 0.62 });
    product(s, 'roam-big.png', 1217 / 723, 7.25, 1.7, 5.4, 3.4);
    s.addImage({ path: A('award.png'), x: 7.55, y: 5.55, w: 1.65, h: 0.69 });
    txt(s, [
      { text: 'Roam : French Design Award 2025', options: { bold: true, color: K.white, breakLine: true } },
      { text: 'Cadre garanti à vie', options: { color: K.teal } },
    ], { x: 9.45, y: 5.55, w: 3.3, h: 0.8, fontSize: 15, fontFace: HEAD });
  }

  // ============================================================ 6. ACCESSOIRES
  {
    const s = pres.addSlide({ masterName: 'TECH_A', sectionTitle: 'Les vélos' });
    kicker(s, 'ACCESSOIRES MAP FOUR  ·  COMPRIS DANS LES 600 €');
    title(s, 'ÉQUIPEZ LE VÉLO DÈS L’ACHAT');
    const cw = (W - 2 * M) / 3;
    const items = [
      ['porte-bagages.png', 'PORTE-BAGAGES AVANT ROAM', '39,90 € TTC'],
      ['sacoche-laterale.png', 'SACOCHE LATÉRALE ROAM', '59,99 € TTC'],
      [null, 'SACOCHE AVANT ROAM', '69,90 € TTC'],
    ];
    for (const [i, [f, n, p]] of items.entries()) {
      const x = M + i * cw;
      if (f) product(s, f, await sizeOf(f), x + 0.35, 1.85, cw - 0.7, 2.75);
      else photo(s, 'sac-avant.jpg', x + 0.3, 1.85, cw - 0.6, 2.75, 0.4);
      txt(s, n, { x: x + 0.3, y: 4.85, w: cw - 0.4, h: 0.35, fontFace: HEAD, fontSize: 14, bold: true, color: K.white, charSpacing: 0, fit: 'shrink' });
      txt(s, p, { x: x + 0.3, y: 5.3, w: cw - 0.5, h: 0.55, fontFace: HEAD, fontSize: 26, bold: true, color: K.teal });
    }
    txt(s, 'Prix publics conseillés. Achetés avec le vélo et sur la même facture, les accessoires entrent dans le forfait mobilités durables, comme le casque, l’antivol ou l’éclairage.', { x: M, y: 6.15, w: W - 2 * M, h: 0.5, fontSize: 12, color: K.mute });
  }

  // ============================================================ 7. TECHNOLOGIE
  {
    const s = pres.addSlide({ masterName: 'TECH_B', sectionTitle: 'Les vélos' });
    s.addImage({ path: A('city.jpg'), x: 0, y: 0, w: 5.3, h: H, sizing: { type: 'cover', w: 5.3, h: H } });
    s.addImage({ path: A('fade-r.png'), x: 3.2, y: 0, w: 2.15, h: H });
    kicker(s, 'TECHNOLOGIE', 5.75, 0.45);
    txt(s, 'CONNECTÉ ET PROTÉGÉ', { x: 5.75, y: 0.78, w: 7, h: 0.8, fontFace: TITLE, fontSize: 32, bold: true, color: K.white });
    const feats = [
      [Fi.FiMapPin, 'Suivi GPS', 'Le vélo se localise depuis l’appli'],
      [Fi.FiShield, 'Antivol IA', 'Déverrouillage sans clé sur le Roam'],
      [Fi.FiLock, 'Verrouillage à distance', 'Depuis le smartphone du salarié'],
      [Fi.FiNavigation, 'Navigation à l’écran', 'Écran couleur intégré au guidon'],
      [Fi.FiZap, 'Charge rapide', 'De 1 h 30 à 3 h selon le modèle'],
      [Fi.FiDroplet, 'Étanche', 'IPX5 à IPX7 : pluie et lavage sans souci'],
    ];
    for (const [i, [ic, h, b]] of feats.entries()) {
      await iconRow(s, ic, h, b, 5.75 + (i % 2) * 3.55, 2.05 + Math.floor(i / 2) * 1.5, 3.4);
    }
  }

  // ============================================================ 8. ÉQUIPES
  {
    const s = pres.addSlide({ masterName: 'TECH_C', sectionTitle: 'Les vélos' });
    s.addImage({ path: A('woman.jpg'), x: 7.0, y: 0, w: W - 7.0, h: H, sizing: { type: 'cover', w: W - 7.0, h: H } });
    s.addImage({ path: A('fade-l.png'), x: 7.0, y: 0, w: 2.2, h: H });
    kicker(s, 'POUR VOS ÉQUIPES');
    txt(s, 'CE QUE VOS SALARIÉS\nY GAGNENT', { x: M, y: 0.78, w: 6.4, h: 1.5, fontFace: TITLE, fontSize: 32, bold: true, color: K.white });
    const gains = [
      [Fi.FiActivity, 'Du sport chaque jour', 'Le trajet devient une séance, sans arriver en sueur'],
      [Fi.FiSmile, 'Moins de stress', 'Ni bouchons ni recherche de place de parking'],
      [Fi.FiTrendingDown, 'Moins de dépenses', 'Le plein de carburant laisse place à une recharge'],
    ];
    for (const [i, [ic, h, b]] of gains.entries()) await iconRow(s, ic, h, b, M, 2.75 + i * 1.3, 6.0);
  }

  // ============================================================ 9. FORMULE A
  pres.addSection({ title: 'Formules' });
  {
    const s = pres.addSlide({ masterName: 'TECH_A', sectionTitle: 'Formules' });
    kicker(s, 'FORMULE A  ·  POUR L’ENTREPRISE');
    title(s, 'L’ENTREPRISE ACHÈTE ET PRÊTE LES VÉLOS');
    txt(s, '25 %', { x: M, y: 1.75, w: 3.6, h: 1.35, fontFace: TITLE, fontSize: 88, bold: true, color: K.teal });
    txt(s, 'du prix des vélos récupérés en réduction d’impôt sur les sociétés', { x: 4.3, y: 2.05, w: 5.5, h: 0.9, fontSize: 20, color: K.text });
    const rows = [
      ['AVANTAGE', 'CE QUE ÇA DONNE', 'TEXTE DE LOI'],
      ['Réduction d’impôt « flotte de vélos »', 'Réduction d’IS égale aux frais de la flotte (achat, entretien, assurance, parking), dans la limite de 25 % du prix TTC. Valable jusqu’au 31/12/2027.', 'Art. 220 undecies A du CGI · art. 46 quater-0 YZE ann. III CGI · BOI-IS-RICI-20-30'],
      ['Amortissement', 'Le vélo s’amortit sur 3 à 5 ans : une charge déductible du résultat.', 'Art. 39 du CGI'],
      ['Zéro avantage en nature', 'Vélo prêté pour le trajet domicile-travail : ni cotisations, ni impôt pour le salarié.', 'Tolérance Urssaf (BOSS)'],
    ];
    s.addTable(tableStyle(rows, [2.6, 6, 3.5]), { x: M, y: 3.35, w: W - 2 * M, colW: [2.6, 6.0, 3.53], rowH: [0.45, 0.85, 0.6, 0.6] });
    txt(s, 'Réduction réservée aux entreprises à l’IS. Récupération de la TVA : à valider avec votre expert-comptable.', { x: M, y: 6.35, w: W - 2 * M, h: 0.35, fontSize: 12, color: K.mute });
  }

  // ============================================================ 10. FORMULE B — SALARIÉ
  {
    const s = pres.addSlide({ masterName: 'TECH_B', sectionTitle: 'Formules' });
    kicker(s, 'FORMULE B  ·  POUR LE SALARIÉ', M, 0.45, K.orange);
    title(s, 'LE FORFAIT MOBILITÉS DURABLES');
    txt(s, '600 €', { x: M, y: 1.7, w: 3.6, h: 1.3, fontFace: TITLE, fontSize: 80, bold: true, color: K.orange });
    txt(s, 'par an et par salarié,\nsans charges sociales ni impôt sur le revenu', { x: 4.3, y: 1.95, w: 6, h: 0.9, fontSize: 20, color: K.text });
    const rows = [
      ['DISPOSITIF', 'MONTANT', 'TEXTE DE LOI'],
      ['Forfait mobilités durables', '600 € par an exonérés, 900 € avec un abonnement de transport', 'Art. L. 3261-3-1 Code du travail · art. 81, 19° ter b du CGI'],
      ['Bonus fin 2026', '1 000 € exonérés de cotisations pour les sommes versées avant le 31/12/2026', 'Décrets n° 2026-973 et 2026-974 du 20 octobre 2026'],
    ];
    s.addTable(tableStyle(rows, [2.6, 5.5, 4]), { x: M, y: 3.15, w: W - 2 * M, colW: [2.6, 5.6, 3.93], rowH: [0.45, 0.68, 0.68] });
    const pts = [
      ['RENOUVELÉ CHAQUE ANNÉE', '600 € chaque 1er janvier, tant que le salarié vient à vélo. Non pris dans l’année : perdu.'],
      ['COÛT POUR L’EMPLOYEUR', '600 €, sans charges : environ 450 € après impôt. En salaire, il faudrait environ 1 100 €.'],
      ['UN VÉLO PAYÉ EN 3 ANS', '1 800 € accessoires compris, remboursés en 3 ans. + 200 € de l’Agglo de Brive.'],
    ];
    const cw = (W - 2 * M - 0.6) / 3;
    pts.forEach(([h, b], i) => {
      const x = M + i * (cw + 0.3);
      card(s, x, 5.2, cw, 1.6, K.panel, 'point-' + i);
      txt(s, h, { x: x + 0.3, y: 5.38, w: cw - 0.6, h: 0.3, fontFace: HEAD, fontSize: 13, bold: true, color: K.orange, charSpacing: 2 });
      txt(s, b, { x: x + 0.3, y: 5.72, w: cw - 0.6, h: 0.95, fontSize: 14, color: K.text });
    });
  }

  // ============================================================ 11. LES 600 € MODE D'EMPLOI
  {
    const s = pres.addSlide({ masterName: 'TECH_C', sectionTitle: 'Formules' });
    kicker(s, 'FORMULE B  ·  QUESTIONS FRÉQUENTES', M, 0.45, K.orange);
    title(s, 'LES 600 € : MODE D’EMPLOI');
    await iconRow(s, Fi.FiPackage, 'Accessoires compris', 'Casque, antivol, éclairage : oui, s’ils servent au trajet et figurent sur la facture du vélo et dans la décision de l’employeur.', M, 2.1, 6.2);
    await iconRow(s, Fi.FiCreditCard, 'Comment c’est versé', 'Sur la fiche de paie ou par titre-mobilité, contre une attestation sur l’honneur au moins une fois par an.', M, 3.65, 6.2);
    await iconRow(s, Fi.FiRefreshCw, 'Chaque année', 'Le montant se renouvelle au 1er janvier, tant que le salarié vient à vélo.', M, 5.2, 6.2);
    product(s, 'roam-st.png', R.roamSt, 7.4, 2.0, 4.6, 2.7);
    product(s, 'sacoche-laterale.png', await sizeOf('sacoche-laterale.png'), 7.6, 4.95, 1.7, 1.5);
    product(s, 'porte-bagages.png', await sizeOf('porte-bagages.png'), 9.9, 5.15, 2.0, 1.3);
  }

  // ============================================================ 12. DIRIGEANT 4 ÉTAPES
  {
    const s = pres.addSlide({ masterName: 'TECH_A', sectionTitle: 'Formules' });
    kicker(s, 'FORMULE B  ·  POUR LE DIRIGEANT', M, 0.45, K.orange);
    title(s, 'METTRE EN PLACE LE FORFAIT EN 4 ÉTAPES');
    const steps = [
      ['Fixer le montant', 'Jusqu’à 600 € par an et par salarié, mêmes critères pour tous'],
      ['Écrire la décision', 'Accord d’entreprise ou décision du dirigeant, après avis du CSE s’il existe. Modèle fourni'],
      ['Informer les salariés', 'Message prêt à envoyer et journée d’essai au club'],
      ['Verser sur la paie', 'Ligne exonérée sur le bulletin, contre une attestation par an'],
    ];
    steps.forEach(([h, b], i) => {
      const y = 1.85 + i * 1.18;
      card(s, M, y, 7.4, 1.0, K.panel, 'etape-' + (i + 1));
      txt(s, String(i + 1).padStart(2, '0'), { x: M + 0.3, y: y + 0.18, w: 0.9, h: 0.65, fontFace: HEAD, fontSize: 30, bold: true, color: K.orange });
      txt(s, h, { x: M + 1.3, y: y + 0.13, w: 5.9, h: 0.35, fontFace: HEAD, fontSize: 16, bold: true, color: K.white });
      txt(s, b, { x: M + 1.3, y: y + 0.48, w: 5.9, h: 0.45, fontSize: 14, color: K.mute });
    });
    photo(s, 'business.jpg', 8.45, 1.85, 4.28, 4.55, 0.5);
  }

  // ============================================================ 13. SIMULATION
  {
    const s = pres.addSlide({ masterName: 'TECH_B', sectionTitle: 'Formules' });
    kicker(s, 'SIMULATION');
    title(s, 'CE QUE ÇA COÛTE VRAIMENT');
    // A
    card(s, M, 1.8, 5.95, 4.55, K.panel, 'simulation-A');
    txt(s, 'FORMULE A  ·  L’ENTREPRISE ACHÈTE', { x: M + 0.4, y: 2.05, w: 5.2, h: 0.3, fontFace: HEAD, fontSize: 12, bold: true, color: K.teal, charSpacing: 3 });
    txt(s, '≈ 900 €', { x: M + 0.4, y: 2.45, w: 5.2, h: 1.0, fontFace: TITLE, fontSize: 60, bold: true, color: K.white });
    txt(s, 'net par vélo pour l’entreprise, au lieu de 1 800 €', { x: M + 0.4, y: 3.5, w: 5.2, h: 0.4, fontSize: 16, color: K.text });
    s.addChart(pres.charts.BAR, [
      { name: 'Coût net', labels: ['10 vélos', 'Réduction d’IS', 'IS sur amortissement', 'Coût net'], values: [18000, 4500, 4500, 9000] },
    ], {
      x: M + 0.3, y: 4.0, w: 5.35, h: 2.2, barDir: 'bar', chartColors: [K.teal], showValue: true, dataLabelPosition: 'outEnd', dataLabelColor: K.text, dataLabelFontSize: 11, dataLabelFormatCode: '# ##0" €"',
      catAxisLabelColor: K.mute, catAxisLabelFontSize: 11, valAxisHidden: true, valGridLine: { style: 'none' }, catGridLine: { style: 'none' }, showLegend: false, catAxisLineShow: false, catAxisOrientation: 'maxMin',
      catAxisLabelFontFace: '+mn-lt', dataLabelFontFace: '+mn-lt', barGapWidthPct: 45,
    });
    // B
    const x = M + 6.25;
    card(s, x, 1.8, 5.95, 4.55, K.panel, 'simulation-B');
    txt(s, 'FORMULE B  ·  LE SALARIÉ ACHÈTE', { x: x + 0.4, y: 2.05, w: 5.2, h: 0.3, fontFace: HEAD, fontSize: 12, bold: true, color: K.orange, charSpacing: 3 });
    txt(s, '0 €', { x: x + 0.4, y: 2.45, w: 5.2, h: 1.0, fontFace: TITLE, fontSize: 60, bold: true, color: K.white });
    txt(s, 'reste à charge du salarié au bout de 3 ans', { x: x + 0.4, y: 3.5, w: 5.2, h: 0.4, fontSize: 16, color: K.text });
    txt(s, [
      { text: 'Vélo : 1 800 €', options: { breakLine: true } },
      { text: '− 600 € de FMD par an pendant 3 ans', options: { breakLine: true } },
      { text: 'Coût employeur : 1 800 € sans charges, contre ≈ 3 300 € versés en salaire' },
    ], { x: x + 0.4, y: 4.25, w: 5.2, h: 1.6, fontSize: 15, color: K.mute, paraSpaceAfter: 8 });
    txt(s, 'Hypothèse : vélo à 1 800 € TTC, IS à 25 %. Prix partenaires MAP FOUR à confirmer.', { x: M, y: 6.5, w: W - 2 * M, h: 0.3, fontSize: 12, color: K.mute });
  }

  // ============================================================ 14. AIDES LOCALES
  pres.addSection({ title: 'Aides et impact' });
  {
    const s = pres.addSlide({ masterName: 'TECH_C', sectionTitle: 'Aides et impact' });
    kicker(s, 'AIDES LOCALES  ·  BRIVE ET ALENTOURS');
    title(s, 'JUSQU’À 300 € DE PLUS SELON LA COMMUNE');
    s.addChart(pres.charts.BAR, [
      { name: 'Aide maximale', labels: ['Limoges Métropole', 'Grand Périgueux', 'Agglo de Brive', 'Tulle Agglo', 'Grand Cahors', 'Région et État'], values: [300, 250, 200, 200, 200, 0] },
    ], {
      x: M - 0.1, y: 1.8, w: 5.6, h: 4.3, barDir: 'bar', chartColors: [K.teal], showValue: true, dataLabelPosition: 'outEnd', dataLabelColor: K.white, dataLabelFontSize: 12, dataLabelFormatCode: '0" €"',
      catAxisLabelColor: K.text, catAxisLabelFontSize: 12, valAxisHidden: true, valGridLine: { style: 'none' }, catGridLine: { style: 'none' }, showLegend: false, catAxisLineShow: false, catAxisOrientation: 'maxMin',
      catAxisLabelFontFace: '+mn-lt', dataLabelFontFace: '+mn-lt', barGapWidthPct: 55, showTitle: true, title: 'Aide maximale pour un vélo électrique', titleColor: K.mute, titleFontSize: 12, titleFontFace: '+mn-lt',
    });
    const rows = [
      ['COLLECTIVITÉ', 'MONTANT', 'À SAVOIR'],
      ['Agglo de Brive', '30 % du prix, jusqu’à 200 €', 'Chèque à retirer avant l’achat'],
      ['Tulle Agglo', 'Jusqu’à 200 €, + 100 € pour la commune de Corrèze', 'Chez un vélociste partenaire, hors accessoires'],
      ['Grand Périgueux', '250 € (neuf)', 'Chèque vélo 2026, vélociste conventionné'],
      ['Grand Cahors', '25 % du prix, jusqu’à 200 €', 'Chez un vendeur partenaire'],
      ['Limoges Métropole', 'Jusqu’à 300 €', 'Depuis octobre 2026'],
      ['Région et État', 'Aucune aide à l’achat en 2026', 'Bonus vélo supprimé en 2025'],
    ];
    s.addTable(tableStyle(rows, [1.8, 2.6, 2.6]).map((r) => r.map((c) => ({ ...c, options: { ...c.options, fontSize: c.options.fontSize === 13 ? 12 : 10 } }))), { x: 6.1, y: 1.85, w: 6.63, colW: [1.65, 2.5, 2.48], rowH: 0.56 });
    txt(s, 'Toutes se cumulent avec le forfait mobilités durables de l’employeur. Montants de Tulle Agglo de 2024, à vérifier pour 2026.', { x: M, y: 6.35, w: W - 2 * M, h: 0.35, fontSize: 12, color: K.mute });
  }

  // ============================================================ 15. CO2
  {
    const s = pres.addSlide({ masterName: 'TECH_A', sectionTitle: 'Aides et impact' });
    kicker(s, 'IMPACT CO2');
    txt(s, '840 kg', { x: M, y: 0.95, w: 7.2, h: 1.9, fontFace: TITLE, fontSize: 120, bold: true, color: K.teal });
    txt(s, 'DE CO2 ÉVITÉS PAR SALARIÉ ET PAR AN', { x: M, y: 2.95, w: 7.5, h: 0.5, fontFace: HEAD, fontSize: 22, bold: true, color: K.white });
    txt(s, 'Vélo électrique au lieu de la voiture, 10 km aller, 200 jours par an', { x: M, y: 3.5, w: 7.5, h: 0.4, fontSize: 16, color: K.mute });
    const st = [['420 kg', 'pour 5 km aller'], ['1,3 t', 'pour 15 km aller'], ['8,4 t', 'pour 10 salariés à 10 km']];
    st.forEach(([b, l], i) => {
      const x = M + i * 2.6;
      card(s, x, 4.45, 2.4, 1.55, K.panel, 'co2-' + i);
      txt(s, b, { x: x + 0.3, y: 4.6, w: 1.9, h: 0.7, fontFace: HEAD, fontSize: 30, bold: true, color: K.white });
      txt(s, l, { x: x + 0.3, y: 5.3, w: 1.9, h: 0.6, fontSize: 13, color: K.mute });
    });
    s.addChart(pres.charts.BAR, [
      { name: 'g CO2 / km', labels: ['Voiture en ville', 'Vélo électrique'], values: [213, 2] },
    ], {
      x: 8.75, y: 1.2, w: 4.0, h: 4.9, barDir: 'col', chartColors: [K.mute, K.teal], showValue: true, dataLabelPosition: 'outEnd', dataLabelColor: K.white, dataLabelFontSize: 14, dataLabelFormatCode: '0" g"',
      catAxisLabelColor: K.text, catAxisLabelFontSize: 12, valAxisHidden: true, valGridLine: { style: 'none' }, catGridLine: { style: 'none' }, showLegend: false, catAxisLineShow: false,
      catAxisLabelFontFace: '+mn-lt', dataLabelFontFace: '+mn-lt', barGapWidthPct: 40, showTitle: true, title: 'Émissions par km (g CO2)', titleColor: K.mute, titleFontSize: 12, titleFontFace: '+mn-lt',
    });
    txt(s, 'Source : ADEME, voiture en ville 213 g CO2/km contre 2 g pour un vélo électrique', { x: M, y: 6.35, w: W - 2 * M, h: 0.35, fontSize: 12, color: K.mute });
  }

  // ============================================================ 16. CAS PRATIQUE (nouveau)
  pres.addSection({ title: 'Partenariat' });
  {
    const s = pres.addSlide({ masterName: 'TECH_B', sectionTitle: 'Partenariat' });
    kicker(s, 'EXEMPLE DE PARTENARIAT  ·  CAS ILLUSTRATIF');
    title(s, 'UNE PME BRIVOISE DE 30 SALARIÉS');
    // profil
    card(s, M, 1.8, 3.6, 4.5, K.panel, 'profil');
    txt(s, 'LE PROFIL', { x: M + 0.3, y: 2.0, w: 3, h: 0.3, fontFace: HEAD, fontSize: 12, bold: true, color: K.teal, charSpacing: 3 });
    txt(s, [
      { text: '30 salariés à Brive', options: { bullet: { code: '25B8' }, breakLine: true } },
      { text: '10 viennent de 5 à 15 km, en voiture', options: { bullet: { code: '25B8' }, breakLine: true } },
      { text: 'Entreprise à l’IS', options: { bullet: { code: '25B8' }, breakLine: true } },
      { text: 'Objectif : bien-être et image RSE', options: { bullet: { code: '25B8' } } },
    ], { x: M + 0.3, y: 2.45, w: 3.1, h: 2.6, fontSize: 15, color: K.text, paraSpaceAfter: 10 });
    // déroulé
    const tl = [
      ['S1', 'Présentation au club', 'Besoins recensés, choix de la formule'],
      ['S2', 'Journée d’essai au club', 'Les salariés testent la gamme'],
      ['S4', 'Commande', '10 vélos en formule A, forfait B ouvert aux 20 autres'],
      ['S6', 'Remise au club', 'Vélos livrés, SAV Repair and Run'],
    ];
    const tx = M + 3.9;
    s.addShape('line', { x: tx + 0.28, y: 2.1, w: 0, h: 3.9, line: { color: K.line, width: 1.5 } });
    tl.forEach(([w_, h, b], i) => {
      const y = 1.85 + i * 1.08;
      s.addShape(pres.shapes.OVAL ?? 'ellipse', { x: tx, y: y + 0.05, w: 0.56, h: 0.56, fill: { color: K.bg }, line: { color: K.teal, width: 1.5 } });
      txt(s, w_, { x: tx, y: y + 0.17, w: 0.56, h: 0.3, fontFace: HEAD, fontSize: 11, bold: true, color: K.teal, align: 'center' });
      txt(s, h, { x: tx + 0.8, y: y, w: 3.4, h: 0.33, fontFace: HEAD, fontSize: 15, bold: true, color: K.white });
      txt(s, b, { x: tx + 0.8, y: y + 0.35, w: 3.4, h: 0.5, fontSize: 13, color: K.mute });
    });
    // résultats
    const rx = M + 8.35;
    card(s, rx, 1.8, W - M - rx, 4.5, K.panel2, 'resultats');
    txt(s, 'LE RÉSULTAT', { x: rx + 0.3, y: 2.0, w: 3, h: 0.3, fontFace: HEAD, fontSize: 12, bold: true, color: K.teal, charSpacing: 3 });
    const kp = [['≈ 9 000 €', 'coût net des 10 vélos, au lieu de 18 000 €'], ['8,4 t', 'de CO2 évitées chaque année'], ['600 €', 'par an possibles pour les 20 autres salariés']];
    kp.forEach(([b, l], i) => {
      txt(s, b, { x: rx + 0.3, y: 2.45 + i * 1.25, w: 3.4, h: 0.6, fontFace: HEAD, fontSize: 30, bold: true, color: i === 2 ? K.orange : K.white });
      txt(s, l, { x: rx + 0.3, y: 3.02 + i * 1.25, w: 3.4, h: 0.5, fontSize: 13, color: K.mute });
    });
    txt(s, 'Exemple illustratif construit avec les hypothèses du dossier : vélo à 1 800 € TTC, IS à 25 %, trajets de 10 km. Prix partenaires MAP FOUR à confirmer.', { x: M, y: 6.45, w: W - 2 * M, h: 0.35, fontSize: 12, color: K.mute });
  }

  // ============================================================ 17. GAGNANT-GAGNANT (nouveau)
  {
    const s = pres.addSlide({ masterName: 'TECH_C', sectionTitle: 'Partenariat' });
    kicker(s, 'LE PARTENARIAT');
    title(s, 'CE QUE CHACUN Y GAGNE');
    const cols = [
      [Fi.FiBriefcase, 'L’ENTREPRISE', K.teal, ['Jusqu’à 25 % du prix récupéré (formule A)', 'Un avantage salarié sans charges (formule B)', 'Un geste RSE concret et mesurable']],
      [Fi.FiUsers, 'LES SALARIÉS', K.teal, ['Un vélo haut de gamme, connecté et protégé', 'Du sport chaque jour sur le trajet', 'Jusqu’à 600 € par an, et les aides locales en plus']],
      [Fi.FiAward, 'LE CLUB', K.orange, ['Un lien renforcé avec ses entreprises partenaires', 'La journée d’essai et la remise des vélos au club', 'Contreparties de visibilité à définir ensemble']],
    ];
    const cw = (W - 2 * M - 0.6) / 3;
    for (const [i, [ic, h, col, items]] of cols.entries()) {
      const x = M + i * (cw + 0.3);
      card(s, x, 1.85, cw, 4.6, K.panel, 'gain-' + i);
      s.addShape(pres.shapes.OVAL ?? 'ellipse', { x: x + 0.35, y: 2.15, w: 0.8, h: 0.8, fill: { color: K.panel2 }, line: { color: col, width: 1.25 } });
      s.addImage({ data: await icon(ic, col), x: x + 0.55, y: 2.35, w: 0.4, h: 0.4 });
      txt(s, h, { x: x + 0.35, y: 3.2, w: cw - 0.7, h: 0.4, fontFace: HEAD, fontSize: 17, bold: true, color: K.white, charSpacing: 2 });
      txt(s, items.map((t, k) => ({ text: t, options: { bullet: { code: '25B8' }, breakLine: k < items.length - 1 } })), { x: x + 0.35, y: 3.75, w: cw - 0.7, h: 2.5, fontSize: 15, color: K.text, paraSpaceAfter: 12 });
    }
  }

  // ============================================================ 18. COMMENT ÇA MARCHE
  {
    const s = pres.addSlide({ masterName: 'TECH_A', sectionTitle: 'Partenariat' });
    kicker(s, 'MISE EN PLACE');
    title(s, 'COMMENT ÇA MARCHE');
    const st = [
      [Fi.FiMessageCircle, 'Présentation', 'Le club vous présente l’offre et vos besoins sont recensés'],
      [Fi.FiTarget, 'Essai', 'Journée d’essai au club ou dans vos locaux'],
      [Fi.FiFileText, 'Commande', 'Formule A ou B, devis et facture émis par le club'],
      [Fi.FiPackage, 'Remise au club', 'Vélos livrés au club, vos salariés viennent les chercher'],
      [Fi.FiTool, 'Service', 'Entretien et SAV en France avec Repair and Run'],
    ];
    for (const [i, [ic, h, b]] of st.entries()) await iconRow(s, ic, `${i + 1}.  ${h}`, b, M, 1.85 + i * 0.92, 6.9);
    photo(s, 'couple.jpg', 8.05, 1.85, 4.68, 4.45, 0.5);
  }

  // ============================================================ 19. CONTACT
  pres.addSection({ title: 'Contact' });
  {
    const s = pres.addSlide({ masterName: 'FULL', sectionTitle: 'Contact' });
    s.addImage({ path: A('bg-b.png'), x: 0, y: 0, w: W, h: H });
    s.addImage({ path: A('forest.jpg'), x: 0, y: 0, w: 5.6, h: H, sizing: { type: 'cover', w: 5.6, h: H } });
    s.addImage({ path: A('fade-r.png'), x: 3.4, y: 0, w: 2.25, h: H });
    kicker(s, 'ON EN PARLE ?', 6.1, 0.75);
    txt(s, 'ÉQUIPEZ VOS SALARIÉS\nDÈS CET HIVER', { x: 6.1, y: 1.1, w: 6.7, h: 1.5, fontFace: TITLE, fontSize: 34, bold: true, color: K.white });
    card(s, 6.1, 2.95, 6.63, 1.75, K.panel, 'contact-club');
    txt(s, [
      { text: 'BOXE ', options: { color: K.white } },
      { text: 'ACADÉMIE', options: { color: K.teal } },
      { text: ' BRIVE', options: { color: K.white } },
    ], { x: 6.45, y: 3.1, w: 6, h: 0.45, fontFace: TITLE, fontSize: 22, bold: true });
    txt(s, [
      { text: '39 bis avenue Ribot, 19100 Brive-la-Gaillarde', options: { breakLine: true } },
      { text: '06 77 87 46 25  ·  06 70 27 57 97', options: { breakLine: true } },
      { text: 'boxeacademiebrive@gmail.com' },
    ], { x: 6.45, y: 3.6, w: 6.1, h: 1.05, fontSize: 14, color: K.text });
    card(s, 6.1, 4.95, 6.63, 1.75, K.panel, 'contact-conseiller');
    txt(s, 'VOTRE CONSEILLER VÉLO', { x: 6.45, y: 5.15, w: 6, h: 0.3, fontFace: HEAD, fontSize: 13, bold: true, color: K.teal, charSpacing: 3 });
    txt(s, [
      { text: 'Fernando De Oliveira Salgueiro', options: { bold: true, color: K.white, fontSize: 17, breakLine: true } },
      { text: 'MPIE Group, agent MAP FOUR en France', options: { breakLine: true } },
      { text: '06 74 76 18 19  ·  f.deoliveira@mpiegroup.com' },
    ], { x: 6.45, y: 5.5, w: 6.1, h: 1.1, fontSize: 14, color: K.text });
  }

  await pres.writeFile({ fileName: OUT });
  console.log('wrote', OUT);
})().catch((e) => { console.error(e); process.exit(1); });

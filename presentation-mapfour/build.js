// Boxe Académie Brive × MAP FOUR — présentation partenaires (PowerPoint).
// node build.js  ->  Boxe-Academie-Brive-x-MAP-FOUR.pptx
// Identité du club (boxe-academie.fr) : noir #0B0B0D, orange #FF5A1F, blanc cassé #F4F1EC,
// wordmark en Big Shoulders Display. Visuels produits et photos : mapfour.com (HD) ; contenu :
// le dossier « Le vélo électrique pour vos salariés ». Motif : coins biseautés (bouton APPELER).
const path = require('path');
const NM = process.env.DECK_NODE_MODULES || path.join(__dirname, 'node_modules');
const req = (m) => require(require.resolve(m, { paths: [NM, __dirname] }));
const pptxgen = req('pptxgenjs');
const React = req('react');
const { renderToStaticMarkup } = req('react-dom/server');
const sharp = req('sharp');
const Fi = req('react-icons/fi');

const A = (f) => path.join(__dirname, 'assets', f);
const HD = (f) => path.join(__dirname, 'assets', 'hd', f);
const OUT = path.join(__dirname, 'Boxe-Academie-Brive-x-MAP-FOUR.pptx');

// ---------------------------------------------------------------- identité du club
const K = {
  bg: '0B0B0D',
  panel: '151518',
  panel2: '1C1C20',
  line: '2C2C31',
  orange: 'FF5A1F', // accent
  orangeDeep: 'C93C0A',
  peach: 'FFB36B', // second ton (formule B), --cat-kick du site
  white: 'F4F1EC',
  text: 'E7E3DD',
  mute: 'A7A29A', // --ink-dim du site
};
const TITLE = 'Arial Narrow'; // condensé, au plus près de Big Shoulders Display
const HEAD = 'Arial';
const BODY = 'Calibri';
const W = 13.333;
const H = 7.5;
const M = 0.6;
const nb = ' ';
const eur = (n) => `${n.toLocaleString('fr-FR').replace(/ |\s/g, nb)}${nb}€`;

async function icon(Comp, color, size = 256) {
  const svg = renderToStaticMarkup(React.createElement(Comp, { color: '#' + color, size: String(size), strokeWidth: 1.8 }));
  return 'image/png;base64,' + (await sharp(Buffer.from(svg)).png().toBuffer()).toString('base64');
}
const ratio = async (f) => { const m = await sharp(f).metadata(); return m.width / m.height; };

(async () => {
  const pres = new pptxgen();
  pres.layout = 'LAYOUT_WIDE';
  pres.title = 'Boxe Académie Brive × MAP FOUR — Le vélo électrique pour vos salariés';
  pres.author = 'Boxe Académie Brive';
  pres.company = 'Boxe Académie Brive';
  pres.theme = { headFontFace: TITLE, bodyFontFace: BODY };

  // ------------------------------------------------------------ layouts
  const foot = [
    { text: { text: 'BOXE ACADÉMIE BRIVE  ×  MAP FOUR', options: { x: M, y: H - 0.47, w: 6, h: 0.3, fontFace: HEAD, fontSize: 8, bold: true, color: K.mute, charSpacing: 3, margin: 0 } } },
  ];
  for (const [name, bg] of [['CLUB_A', 'bg-a.jpg'], ['CLUB_B', 'bg-b.jpg'], ['CLUB_C', 'bg-c.jpg']]) {
    pres.defineSlideMaster({
      title: name,
      background: { path: A(bg) },
      objects: [
        ...foot,
        { placeholder: { options: { name: 'title', type: 'title', x: M, y: 0.74, w: W - 2 * M, h: 0.85, fontFace: TITLE, fontSize: 38, bold: true, color: K.white, valign: 'top', align: 'left', margin: 0 }, text: '' } },
      ],
      slideNumber: { x: W - M - 0.6, y: H - 0.47, w: 0.6, h: 0.3, fontFace: HEAD, fontSize: 9, bold: true, color: K.orange, align: 'right' },
    });
  }
  pres.defineSlideMaster({ title: 'PHOTO', background: { color: K.bg }, objects: [], slideNumber: { x: W - M - 0.6, y: H - 0.47, w: 0.6, h: 0.3, fontFace: HEAD, fontSize: 9, bold: true, color: K.orange, align: 'right' } });

  // ------------------------------------------------------------ helpers
  const txt = (s, t, o) => s.addText(t, { margin: 0, isTextBox: true, fontFace: BODY, color: K.text, valign: 'top', ...o });
  const kicker = (s, t, x = M, y = 0.42, color = K.orange, w = 9) =>
    txt(s, t, { x, y, w, h: 0.3, fontFace: HEAD, fontSize: 11, bold: true, color, charSpacing: 5 });
  const title = (s, t) => s.addText(t, { placeholder: 'title' });
  const snip = (s, x, y, w, h, fill = K.panel, name, line = K.line) =>
    s.addShape('snip1Rect', { x, y, w, h, fill: { color: fill }, line: { color: line, width: 0.75 }, objectName: name });
  const cut = (s, x, y, size, color = K.bg) =>
    s.addShape('rtTriangle', { x: x - size, y, w: size, h: size, rotate: 180, fill: { color }, line: { color, width: 0 } });
  const photo = (s, f, x, y, w, h, c = 0.45) => {
    s.addImage({ path: f, x, y, w, h, sizing: { type: 'cover', w, h } });
    if (c) cut(s, x + w, y, c);
  };
  const glow = (s, x, y, w, h) => s.addImage({ path: A('glow.png'), x, y, w, h });
  /** Product cut-out fitted (bottom-centred) in a box, standing on its orange glow. */
  const product = async (s, f, x, y, w, h, withGlow = true) => {
    const r = await ratio(f);
    let pw = w, ph = w / r;
    if (ph > h) { ph = h; pw = h * r; }
    if (withGlow) glow(s, x + (w - pw * 1.3) / 2, y + h - ph * 0.85, pw * 1.3, ph * 0.95);
    s.addImage({ path: f, x: x + (w - pw) / 2, y: y + (h - ph), w: pw, h: ph });
  };
  const badge = (s, t, x, y, w, color = K.orange) => {
    s.addShape('snip1Rect', { x, y, w, h: 0.36, fill: { color: K.bg, transparency: 100 }, line: { color, width: 1 } });
    txt(s, t, { x, y: y + 0.07, w, h: 0.24, fontFace: HEAD, fontSize: 10, bold: true, color, align: 'center', charSpacing: 2 });
  };
  const bigStat = (s, n, l, x, y, w, size = 40, color = K.orange) => {
    txt(s, n, { x, y, w, h: size / 52, fontFace: TITLE, fontSize: size, bold: true, color });
    txt(s, l, { x, y: y + size / 52 + 0.04, w, h: 0.55, fontSize: 13, color: K.mute });
  };
  const iconRow = async (s, Comp, head, body, x, y, w, color = K.orange) => {
    s.addShape('ellipse', { x, y, w: 0.62, h: 0.62, fill: { color: K.panel2 }, line: { color, width: 1 } });
    s.addImage({ data: await icon(Comp, color), x: x + 0.15, y: y + 0.15, w: 0.32, h: 0.32 });
    txt(s, head, { x: x + 0.85, y: y - 0.02, w: w - 0.85, h: 0.36, fontFace: HEAD, fontSize: 15, bold: true, color: K.white });
    txt(s, body, { x: x + 0.85, y: y + 0.34, w: w - 0.85, h: 0.55, fontSize: 14, color: K.mute });
  };
  const bullets = (items, color = K.orange) => items.map((t, k) => ({ text: t, options: { bullet: { code: '25A0', color }, breakLine: k < items.length - 1 } }));
  const table = (rows, colW, o = {}) => rows.map((r, i) => r.map((c, j) => ({
    text: c,
    options: {
      fontFace: i === 0 ? HEAD : BODY, fontSize: i === 0 ? 10 : (o.size ?? 13), bold: i === 0 || j === 0,
      color: i === 0 ? K.orange : j === colW.length - 1 && o.lastMute !== false ? K.mute : K.text,
      fill: { color: i === 0 ? K.panel2 : i % 2 ? K.panel : '101013' },
      border: [{ type: 'none' }, { type: 'none' }, { type: 'solid', color: K.line, pt: 0.75 }, { type: 'none' }],
      margin: [5, 10, 5, 10], charSpacing: i === 0 ? 3 : 0, valign: 'middle',
    },
  })));
  /** Full-bleed photo slide frame with darkening from the left. */
  const photoSlide = (s, f, darken = 40) => {
    s.addImage({ path: f, x: 0, y: 0, w: W, h: H, sizing: { type: 'cover', w: W, h: H } });
    s.addShape('rect', { x: 0, y: 0, w: W, h: H, fill: { color: K.bg, transparency: darken }, line: { color: K.bg, width: 0 } });
    s.addImage({ path: A('shade-left.png'), x: 0, y: 0, w: W * 0.75, h: H });
  };
  const divider = (sec, num, name, sub, f) => {
    const s = pres.addSlide({ masterName: 'PHOTO', sectionTitle: sec });
    photoSlide(s, f, 35);
    txt(s, num, { x: M, y: 2.0, w: 3, h: 1.2, fontFace: TITLE, fontSize: 96, bold: true, color: K.orange });
    s.addShape('line', { x: M + 0.05, y: 3.45, w: 0.9, h: 0, line: { color: K.orange, width: 3 } });
    txt(s, name, { x: M, y: 3.7, w: W - 2 * M, h: 1.0, fontFace: TITLE, fontSize: 54, bold: true, color: K.white });
    txt(s, sub, { x: M, y: 4.85, w: 6.5, h: 0.9, fontSize: 18, color: K.text });
    return s;
  };

  const BIKES = [
    { f: 'roam.png', n: 'ROAM', t: 'Trekking', s: ['150 km', '100 Nm'], p: 2799 },
    { f: 'roam-st.png', n: 'ROAM ST', t: 'Cadre bas', s: ['150 km', '100 Nm'], p: 2799 },
    { f: 'loop-pro.png', n: 'LOOP PRO', t: 'Compact', s: ['140 km', '100 Nm'], p: 2099 },
    { f: 'loop.png', n: 'LOOP', t: 'Compact', s: ['120 km', '75 Nm'], p: 1699 },
    { f: null, old: 'dash.png', n: 'DASH', t: 'Pliant', s: ['130 km', '25 kg'], p: null },
    { f: 'ray-pro.png', n: 'RAY PRO', t: 'Carbone', s: ['80 Nm', '21,2 kg'], p: 1549 },
    { f: 'ray-air.png', n: 'RAY AIR', t: 'Carbone', s: ['100 km', '17,2 kg'], p: 1449 },
    { f: 'ray-air-st.png', n: 'RAY AIR ST', t: 'Carbone', s: ['100 km', '17,5 kg'], p: 1449 },
  ];

  // ============================================================ 1. COUVERTURE
  pres.addSection({ title: 'Ouverture' });
  {
    const s = pres.addSlide({ masterName: 'PHOTO', sectionTitle: 'Ouverture' });
    s.addImage({ path: HD('ph-roam-duo.jpg'), x: 0, y: 0, w: W, h: H, sizing: { type: 'cover', w: W, h: H } });
    s.addShape('rect', { x: 0, y: 0, w: W, h: H, fill: { color: K.bg, transparency: 45 }, line: { color: K.bg, width: 0 } });
    s.addImage({ path: A('shade-left.png'), x: 0, y: 0, w: 10.5, h: H });
    s.addImage({ path: A('shade-bottom.png'), x: 0, y: 3.2, w: W, h: 4.3 });
    s.addImage({ path: HD('wordmark.png'), x: M, y: 0.75, w: 6.2, h: 6.2 * 275 / 2063 });
    txt(s, '×', { x: M, y: 1.72, w: 0.4, h: 0.45, fontFace: HEAD, fontSize: 20, bold: true, color: K.orange });
    s.addImage({ path: HD('mapfour-logo-white.png'), x: M + 0.45, y: 1.77, w: 2.3, h: 2.3 * 109 / 720 });
    kicker(s, 'OFFRE PARTENAIRES  ·  2026–2027', M, 3.55);
    txt(s, 'LE VÉLO ÉLECTRIQUE\nPOUR VOS SALARIÉS', { x: M, y: 3.9, w: 9, h: 2.0, fontFace: TITLE, fontSize: 64, bold: true, color: K.white, lineSpacingMultiple: 0.9 });
    txt(s, 'Une offre réservée aux entreprises partenaires du club', { x: M, y: 6.0, w: 8, h: 0.45, fontSize: 18, color: K.text });
    s.addNotes('Couverture. Boxe Académie Brive et MAP FOUR : le vélo électrique pour les salariés des entreprises partenaires du club.');
  }

  // ============================================================ 2. MERCI
  {
    const s = pres.addSlide({ masterName: 'CLUB_C', sectionTitle: 'Ouverture' });
    kicker(s, 'VOUS FAITES PARTIE DE LA FAMILLE DU CLUB');
    title(s, 'MERCI À NOS PARTENAIRES');
    txt(s, 'Le club s’associe à MAP FOUR pour équiper les salariés de ses entreprises partenaires en vélo électrique : une gamme complète, deux formules au choix, des aides qui se cumulent et un accompagnement de bout en bout, au club.', { x: M, y: 1.8, w: 6.1, h: 1.6, fontSize: 18, color: K.text, lineSpacingMultiple: 1.12 });
    bigStat(s, '8', 'vélos dans la gamme', M, 3.75, 1.7, 52);
    bigStat(s, '25 %', 'du prix récupéré\n(formule A)', M + 1.85, 3.75, 2.2, 52);
    bigStat(s, `600${nb}€`, 'par an et par salarié\n(formule B)', M + 4.15, 3.75, 2.2, 52);
    photo(s, HD('club-salle-1.jpg'), 7.2, 1.75, 5.53, 4.6, 0.55);
    txt(s, 'Boxe Académie Brive · 39 bis avenue Ribot', { x: 7.2, y: 6.45, w: 5.5, h: 0.3, fontSize: 11, color: K.mute, align: 'right' });
  }

  // ============================================================ 3. L'OFFRE EN UN COUP D'ŒIL
  {
    const s = pres.addSlide({ masterName: 'CLUB_A', sectionTitle: 'Ouverture' });
    kicker(s, 'L’OFFRE EN UN COUP D’ŒIL');
    title(s, 'UN PARTENARIAT, TROIS GAGNANTS');
    const cols = [
      [Fi.FiBriefcase, 'L’ENTREPRISE', 'Jusqu’à 25 % du prix récupéré en réduction d’impôt, ou un avantage salarié sans charges.'],
      [Fi.FiUsers, 'LES SALARIÉS', 'Un vélo haut de gamme, connecté et protégé, et du sport chaque jour sur le trajet.'],
      [Fi.FiMapPin, 'LE TERRITOIRE', 'Jusqu’à 840 kg de CO2 évités par salarié et par an, à Brive et alentours.'],
    ];
    const cw = (W - 2 * M - 0.6) / 3;
    for (const [i, [ic, h, b]] of cols.entries()) {
      const x = M + i * (cw + 0.3);
      snip(s, x, 1.9, cw, 3.4, K.panel, 'offre-' + i);
      s.addShape('ellipse', { x: x + 0.4, y: 2.25, w: 0.85, h: 0.85, fill: { color: K.panel2 }, line: { color: K.orange, width: 1.25 } });
      s.addImage({ data: await icon(ic, K.orange), x: x + 0.62, y: 2.47, w: 0.41, h: 0.41 });
      txt(s, h, { x: x + 0.4, y: 3.35, w: cw - 0.8, h: 0.4, fontFace: TITLE, fontSize: 24, bold: true, color: K.white, charSpacing: 1 });
      txt(s, b, { x: x + 0.4, y: 3.85, w: cw - 0.8, h: 1.3, fontSize: 15, color: K.text });
    }
    txt(s, [
      { text: 'Le club', options: { bold: true, color: K.white } },
      { text: ' présente l’offre, organise la journée d’essai, émet devis et factures et remet les vélos.   ', options: {} },
      { text: 'MAP FOUR', options: { bold: true, color: K.white } },
      { text: ' fournit les vélos et assure l’entretien et le SAV en France.', options: {} },
    ], { x: M, y: 5.65, w: W - 2 * M, h: 0.8, fontSize: 15, color: K.mute });
  }

  // ============================================================ 4. DEUX FORMULES
  pres.addSection({ title: "L'offre" });
  divider("L'offre", '01', 'L’OFFRE', 'Deux formules au choix, selon que l’entreprise achète les vélos ou aide ses salariés à les acheter.', HD('club-salle-2.jpg'));
  {
    const s = pres.addSlide({ masterName: 'CLUB_B', sectionTitle: "L'offre" });
    kicker(s, 'L’OFFRE');
    title(s, 'DEUX FORMULES AU CHOIX');
    const cols = [
      { L: 'A', head: 'L’entreprise équipe ses salariés', items: ['L’entreprise achète les vélos et les prête à ses salariés', 'Jusqu’à 25 % du prix récupéré en réduction d’impôt', 'Aucun avantage en nature pour le salarié'], color: K.orange },
      { L: 'B', head: 'Le salarié achète, l’entreprise aide', items: ['Forfait mobilités durables : jusqu’à 600 € par an', 'Sans charges sociales ni impôt sur le revenu', 'Le vélo est remboursé en 3 ans'], color: K.peach },
    ];
    cols.forEach((c, i) => {
      const x = M + i * 6.2;
      snip(s, x, 1.85, 5.9, 4.75, K.panel, `formule-${c.L}`);
      txt(s, c.L, { x: x + 0.45, y: 1.95, w: 1.3, h: 1.6, fontFace: TITLE, fontSize: 110, bold: true, color: c.color });
      txt(s, 'FORMULE ' + c.L, { x: x + 1.8, y: 2.35, w: 3.8, h: 0.3, fontFace: HEAD, fontSize: 11, bold: true, color: c.color, charSpacing: 4 });
      txt(s, c.head, { x: x + 1.8, y: 2.68, w: 3.9, h: 0.85, fontFace: TITLE, fontSize: 26, bold: true, color: K.white });
      txt(s, bullets(c.items, c.color), { x: x + 0.5, y: 3.9, w: 5.0, h: 2.4, fontSize: 16, color: K.text, paraSpaceAfter: 14 });
    });
  }

  // ============================================================ 6. GAMME
  pres.addSection({ title: 'Les vélos' });
  divider('Les vélos', '02', 'LA GAMME MAP FOUR', 'Trekking, compact ou carbone : un vélo pour chaque trajet, chaque salarié et chaque budget.', HD('ph-amsterdam.jpg'));
  {
    const s = pres.addSlide({ masterName: 'CLUB_C', sectionTitle: 'Les vélos' });
    kicker(s, 'LA GAMME MAP FOUR');
    title(s, '8 VÉLOS POUR TOUS LES TRAJETS');
    const cw = (W - 2 * M) / 4;
    for (const [i, b] of BIKES.entries()) {
      const x = M + (i % 4) * cw;
      const y = 1.72 + Math.floor(i / 4) * 2.62;
      await product(s, b.f ? HD(b.f) : A(b.old), x + 0.15, y, cw - 0.3, 1.6);
      txt(s, b.n, { x: x + 0.15, y: y + 1.72, w: cw - 1.3, h: 0.36, fontFace: TITLE, fontSize: 19, bold: true, color: K.white, charSpacing: 1 });
      txt(s, b.p ? `dès ${eur(b.p)}` : 'prix à confirmer', { x: x + cw - 1.55, y: y + 1.76, w: 1.4, h: 0.3, fontFace: HEAD, fontSize: 11, bold: true, color: b.p ? K.orange : K.mute, align: 'right' });
      txt(s, [b.t, ...b.s].join('  ·  '), { x: x + 0.15, y: y + 2.1, w: cw - 0.3, h: 0.3, fontSize: 13, color: K.mute });
    }
    txt(s, 'Prix publics constatés sur mapfour.com (novembre 2026). Prix partenaires à confirmer.', { x: M, y: 6.85, w: 8, h: 0.25, fontSize: 10, color: K.mute });
  }

  // ============================================================ 8. ROAM
  {
    const s = pres.addSlide({ masterName: 'CLUB_A', sectionTitle: 'Les vélos' });
    await product(s, HD('roam-34.png'), 0.3, 0.55, 6.9, 6.2);
    kicker(s, 'LE MODÈLE PHARE  ·  TREKKING', 7.45, 0.6);
    txt(s, 'ROAM', { x: 7.45, y: 0.9, w: 5.3, h: 1.2, fontFace: TITLE, fontSize: 80, bold: true, color: K.white });
    txt(s, `dès ${eur(2799)}  ·  Roam et Roam ST`, { x: 7.45, y: 2.1, w: 5.3, h: 0.35, fontFace: HEAD, fontSize: 14, bold: true, color: K.orange });
    const st = [['100 Nm', 'moteur central Mivice X700'], ['150 km', 'd’autonomie (mode Éco)'], ['720 Wh', 'batterie LG'], ['2 h', 'de charge (8 A)']];
    st.forEach(([n, l], i) => bigStat(s, n, l, 7.45 + (i % 2) * 2.7, 2.75 + Math.floor(i / 2) * 1.3, 2.5, 34));
    txt(s, bullets(['Suspension intégrale (fourche 100 mm + 60 mm à l’arrière)', 'Courroie carbone + moyeu Shimano Nexus 5', 'RideGuard : GPS, alarme de mouvement, géorepérage, verrouillage par l’appli']), { x: 7.45, y: 5.4, w: 5.3, h: 1.4, fontSize: 13, color: K.text, paraSpaceAfter: 5 });
    s.addImage({ path: HD('award.png'), x: 0.7, y: 6.05, w: 1.6, h: 1.6 * 224 / 516 });
    txt(s, 'French Design Award 2025  ·  cadre garanti à vie', { x: 2.45, y: 6.18, w: 4.5, h: 0.4, fontFace: HEAD, fontSize: 12, bold: true, color: K.white });
  }

  // ============================================================ 9. LOOP
  {
    const s = pres.addSlide({ masterName: 'CLUB_B', sectionTitle: 'Les vélos' });
    kicker(s, 'COMPACT ET PLIANT');
    txt(s, 'LOOP & LOOP PRO', { x: M, y: 0.72, w: 7, h: 1.1, fontFace: TITLE, fontSize: 60, bold: true, color: K.white });
    txt(s, `Loop dès ${eur(1699)}  ·  Loop Pro dès ${eur(2099)}`, { x: M, y: 1.85, w: 6.5, h: 0.35, fontFace: HEAD, fontSize: 14, bold: true, color: K.orange });
    const st = [['720 Wh', 'batterie amovible, charge 8 A'], ['jusqu’à 140 km', 'en conditions réelles (Loop Pro)'], ['100 Nm', 'moteur central (Loop Pro), 75 Nm (Loop)'], ['100 × 51 × 75', 'cm une fois plié (Loop)']];
    st.forEach(([n, l], i) => bigStat(s, n, l, M + (i % 2) * 3.2, 2.55 + Math.floor(i / 2) * 1.35, 3.0, 32));
    txt(s, bullets(['Suspension intégrale (fourche hydraulique + 30 mm à l’arrière)', 'Loop Pro : GPS, 4G et Bluetooth, Shimano 10 vitesses', 'Porte-bagages inclus : prêt pour le trajet quotidien']), { x: M, y: 5.25, w: 6.4, h: 1.5, fontSize: 14, color: K.text, paraSpaceAfter: 5 });
    await product(s, HD('loop-pro-34.png'), 7.0, 0.7, 3.4, 4.5);
    await product(s, HD('loop.png'), 9.5, 2.4, 3.4, 4.3);
  }

  // ============================================================ 10. RAY
  {
    const s = pres.addSlide({ masterName: 'CLUB_C', sectionTitle: 'Les vélos' });
    s.addImage({ path: HD('ph-ray-city.jpg'), x: W - 5.6, y: 0, w: 5.6, h: H, sizing: { type: 'cover', w: 5.6, h: H } });
    s.addImage({ path: A('fade-l.png'), x: W - 5.6, y: 0, w: 2.6, h: H });
    kicker(s, 'CARBONE ET LÉGÈRETÉ');
    txt(s, 'LA SÉRIE RAY', { x: M, y: 0.72, w: 7, h: 1.1, fontFace: TITLE, fontSize: 60, bold: true, color: K.white });
    txt(s, `Ray Air et Ray Air ST dès ${eur(1449)}  ·  Ray Pro dès ${eur(1549)}`, { x: M, y: 1.85, w: 7, h: 0.35, fontFace: HEAD, fontSize: 14, bold: true, color: K.orange });
    await product(s, HD('ray-air-34.png'), M, 2.35, 3.6, 2.5);
    const st = [['17,2 kg', 'Ray Air, cadre carbone'], ['100 km', 'd’autonomie (Ray Air)'], ['80 Nm', 'moteur central (Ray Pro)'], ['1 h 30', 'à 2 h de charge (Ray Pro)']];
    st.forEach(([n, l], i) => bigStat(s, n, l, 4.45 + (i % 2) * 1.75, 2.45 + Math.floor(i / 2) * 1.25, 1.7, 26));
    txt(s, bullets(['Suivi GPS et détection de mouvement', 'Batterie Samsung amovible (Ray Air)', 'Ray Pro : Shimano CUES 10 vitesses, freins à disque hydrauliques']), { x: M, y: 5.2, w: 6.9, h: 1.5, fontSize: 14, color: K.text, paraSpaceAfter: 5 });
  }

  // ============================================================ 11. QUALITÉ
  {
    const s = pres.addSlide({ masterName: 'CLUB_A', sectionTitle: 'Les vélos' });
    kicker(s, 'QUALITÉ');
    title(s, 'QUE DES COMPOSANTS DE GRANDES MARQUES');
    const rows = [['PIÈCE', 'MARQUES'], ['Moteurs', 'Mivice et Ananda, jusqu’à 100 Nm'], ['Batteries', 'Cellules Samsung et LG, jusqu’à 720 Wh'], ['Transmission', 'Shimano (Nexus, CUES, Tiagra, Acera) ou courroie carbone'], ['Freins', 'Tektro hydrauliques à disque, 160 à 180 mm'], ['Pneus', 'Anti-crevaison sur toute la gamme']];
    s.addTable(table(rows, [1.8, 4.6], { lastMute: false, size: 14 }), { x: M, y: 1.95, w: 6.4, colW: [1.8, 4.6], rowH: 0.64 });
    await product(s, HD('roam-st.png'), 7.35, 1.9, 5.4, 3.6);
    s.addImage({ path: HD('award.png'), x: 7.6, y: 5.75, w: 1.7, h: 1.7 * 224 / 516 });
    txt(s, [{ text: 'Roam : French Design Award 2025', options: { bold: true, color: K.white, breakLine: true } }, { text: 'Cadre garanti à vie', options: { color: K.orange } }], { x: 9.5, y: 5.78, w: 3.3, h: 0.7, fontSize: 14, fontFace: HEAD });
  }

  // ============================================================ 12. ACCESSOIRES
  {
    const s = pres.addSlide({ masterName: 'CLUB_B', sectionTitle: 'Les vélos' });
    kicker(s, 'ACCESSOIRES MAP FOUR  ·  COMPRIS DANS LES 600 €');
    title(s, 'ÉQUIPEZ LE VÉLO DÈS L’ACHAT');
    const items = [
      ['acc-rack.png', 'PORTE-BAGAGES AVANT', 'Roam et Loop · jusqu’à 13 kg', 39],
      ['acc-sidebag.png', 'SACOCHE LATÉRALE', 'Étanche, grande contenance', 59],
      ['acc-frontbag.png', 'SACOCHE DE GUIDON', 'Étanche, 10 litres', 59],
    ];
    const cw = 2.95;
    for (const [i, [f, n, d, p]] of items.entries()) {
      const x = M + i * (cw + 0.25);
      await product(s, HD(f), x + 0.2, 1.9, cw - 0.4, 2.55);
      txt(s, n, { x, y: 4.65, w: cw, h: 0.35, fontFace: TITLE, fontSize: 18, bold: true, color: K.white, charSpacing: 1 });
      txt(s, d, { x, y: 5.0, w: cw, h: 0.3, fontSize: 13, color: K.mute });
      txt(s, eur(p), { x, y: 5.35, w: cw, h: 0.5, fontFace: TITLE, fontSize: 28, bold: true, color: K.orange });
    }
    photo(s, HD('ph-bags-set.jpg'), 10.3, 1.85, 2.43, 4.0, 0.4);
    txt(s, [{ text: 'Set de 2 sacoches', options: { bold: true, color: K.white, breakLine: true } }, { text: eur(99), options: { bold: true, color: K.orange } }], { x: 10.3, y: 5.95, w: 2.43, h: 0.6, fontSize: 14 });
    txt(s, 'Prix publics constatés sur mapfour.com. Achetés avec le vélo et sur la même facture, les accessoires entrent dans le forfait mobilités durables, comme le casque, l’antivol ou l’éclairage.', { x: M, y: 6.35, w: 9.4, h: 0.5, fontSize: 11, color: K.mute });
  }

  // ============================================================ 13. TECHNOLOGIE
  {
    const s = pres.addSlide({ masterName: 'CLUB_C', sectionTitle: 'Les vélos' });
    s.addImage({ path: HD('ph-battery.jpg'), x: 0, y: 0, w: 5.2, h: H, sizing: { type: 'cover', w: 5.2, h: H } });
    s.addImage({ path: A('fade-r.png'), x: 3.0, y: 0, w: 2.25, h: H });
    kicker(s, 'TECHNOLOGIE', 5.7, 0.42);
    txt(s, 'CONNECTÉ ET PROTÉGÉ', { x: 5.7, y: 0.74, w: 7, h: 0.85, fontFace: TITLE, fontSize: 38, bold: true, color: K.white });
    const feats = [
      [Fi.FiMapPin, 'Suivi GPS', 'Le vélo se localise depuis l’appli'],
      [Fi.FiShield, 'Antivol intelligent', 'Déverrouillage sans clé sur le Roam'],
      [Fi.FiLock, 'Verrouillage à distance', 'Depuis le smartphone du salarié'],
      [Fi.FiNavigation, 'Navigation à l’écran', 'Écran couleur intégré au guidon'],
      [Fi.FiZap, 'Charge rapide', 'De 1 h 30 à 3 h selon le modèle'],
      [Fi.FiDroplet, 'Étanche', 'IPX5 à IPX7 : pluie et lavage sans souci'],
    ];
    for (const [i, [ic, h, b]] of feats.entries()) await iconRow(s, ic, h, b, 5.7 + (i % 2) * 3.55, 2.0 + Math.floor(i / 2) * 1.5, 3.4);
  }

  // ============================================================ 14. ÉQUIPES
  {
    const s = pres.addSlide({ masterName: 'CLUB_A', sectionTitle: 'Les vélos' });
    s.addImage({ path: HD('ph-loop-woman.jpg'), x: 7.0, y: 0, w: W - 7.0, h: H, sizing: { type: 'cover', w: W - 7.0, h: H } });
    s.addImage({ path: A('fade-l.png'), x: 7.0, y: 0, w: 2.2, h: H });
    kicker(s, 'POUR VOS ÉQUIPES');
    txt(s, 'CE QUE VOS SALARIÉS\nY GAGNENT', { x: M, y: 0.74, w: 6.4, h: 1.6, fontFace: TITLE, fontSize: 38, bold: true, color: K.white });
    const gains = [
      [Fi.FiActivity, 'Du sport chaque jour', 'Le trajet devient une séance, sans arriver en sueur'],
      [Fi.FiSmile, 'Moins de stress', 'Ni bouchons ni recherche de place de parking'],
      [Fi.FiTrendingDown, 'Moins de dépenses', 'Le plein de carburant laisse place à une recharge'],
    ];
    for (const [i, [ic, h, b]] of gains.entries()) await iconRow(s, ic, h, b, M, 2.8 + i * 1.3, 6.0);
  }

  // ============================================================ 15. FORMULE A
  pres.addSection({ title: 'Les formules' });
  divider('Les formules', '03', 'LES FORMULES EN DÉTAIL', 'Réduction d’impôt, forfait mobilités durables, mise en place et simulation chiffrée.', HD('ph-roam-vertical.jpg'));
  {
    const s = pres.addSlide({ masterName: 'CLUB_B', sectionTitle: 'Les formules' });
    kicker(s, 'FORMULE A  ·  POUR L’ENTREPRISE');
    title(s, 'L’ENTREPRISE ACHÈTE ET PRÊTE LES VÉLOS');
    txt(s, '25 %', { x: M, y: 1.65, w: 3.9, h: 1.5, fontFace: TITLE, fontSize: 110, bold: true, color: K.orange });
    txt(s, 'du prix des vélos récupérés en réduction d’impôt sur les sociétés', { x: 4.6, y: 2.0, w: 5.5, h: 0.9, fontSize: 20, color: K.text });
    const rows = [
      ['AVANTAGE', 'CE QUE ÇA DONNE', 'TEXTE DE LOI'],
      ['Réduction d’impôt « flotte de vélos »', 'Réduction d’IS égale aux frais de la flotte (achat, entretien, assurance, parking), dans la limite de 25 % du prix TTC. Valable jusqu’au 31/12/2027.', 'Art. 220 undecies A du CGI · art. 46 quater-0 YZE ann. III CGI · BOI-IS-RICI-20-30'],
      ['Amortissement', 'Le vélo s’amortit sur 3 à 5 ans : une charge déductible du résultat.', 'Art. 39 du CGI'],
      ['Zéro avantage en nature', 'Vélo prêté pour le trajet domicile-travail : ni cotisations, ni impôt pour le salarié.', 'Tolérance Urssaf (BOSS)'],
    ];
    s.addTable(table(rows, [2.6, 6.0, 3.53]), { x: M, y: 3.3, w: W - 2 * M, colW: [2.6, 6.0, 3.53], rowH: [0.42, 0.85, 0.6, 0.6] });
    txt(s, 'Réduction réservée aux entreprises à l’IS. Récupération de la TVA : à valider avec votre expert-comptable.', { x: M, y: 6.35, w: W - 2 * M, h: 0.3, fontSize: 11, color: K.mute });
  }

  // ============================================================ 17. FORMULE B
  {
    const s = pres.addSlide({ masterName: 'CLUB_C', sectionTitle: 'Les formules' });
    kicker(s, 'FORMULE B  ·  POUR LE SALARIÉ', M, 0.42, K.peach);
    title(s, 'LE FORFAIT MOBILITÉS DURABLES');
    txt(s, `600${nb}€`, { x: M, y: 1.6, w: 4.4, h: 1.45, fontFace: TITLE, fontSize: 100, bold: true, color: K.peach });
    txt(s, 'par an et par salarié,\nsans charges sociales ni impôt sur le revenu', { x: 5.1, y: 1.95, w: 6, h: 0.9, fontSize: 20, color: K.text });
    const rows = [
      ['DISPOSITIF', 'MONTANT', 'TEXTE DE LOI'],
      ['Forfait mobilités durables', '600 € par an exonérés, 900 € avec un abonnement de transport', 'Art. L. 3261-3-1 Code du travail · art. 81, 19° ter b du CGI'],
      ['Bonus fin 2026', '1 000 € exonérés de cotisations pour les sommes versées avant le 31/12/2026', 'Décrets n° 2026-973 et 2026-974 du 20 octobre 2026'],
    ];
    s.addTable(table(rows, [2.6, 5.6, 3.93]).map((r, i) => r.map((c) => (i === 0 ? { ...c, options: { ...c.options, color: K.peach } } : c))), { x: M, y: 3.15, w: W - 2 * M, colW: [2.6, 5.6, 3.93], rowH: [0.42, 0.66, 0.66] });
    const pts = [
      ['RENOUVELÉ CHAQUE ANNÉE', '600 € chaque 1er janvier, tant que le salarié vient à vélo. Non pris dans l’année : perdu.'],
      ['COÛT POUR L’EMPLOYEUR', '600 €, sans charges : environ 450 € après impôt. En salaire, il faudrait environ 1 100 €.'],
      ['UN VÉLO PAYÉ EN 3 ANS', '1 800 € accessoires compris, remboursés en 3 ans. + 200 € de l’Agglo de Brive.'],
    ];
    const cw = (W - 2 * M - 0.6) / 3;
    pts.forEach(([h, b], i) => {
      const x = M + i * (cw + 0.3);
      snip(s, x, 5.15, cw, 1.6, K.panel, 'point-' + i);
      txt(s, h, { x: x + 0.3, y: 5.32, w: cw - 0.6, h: 0.3, fontFace: HEAD, fontSize: 11, bold: true, color: K.peach, charSpacing: 2 });
      txt(s, b, { x: x + 0.3, y: 5.66, w: cw - 0.6, h: 0.95, fontSize: 14, color: K.text });
    });
  }

  // ============================================================ 18. MODE D'EMPLOI
  {
    const s = pres.addSlide({ masterName: 'CLUB_A', sectionTitle: 'Les formules' });
    kicker(s, 'FORMULE B  ·  QUESTIONS FRÉQUENTES', M, 0.42, K.peach);
    title(s, 'LES 600 € : MODE D’EMPLOI');
    await iconRow(s, Fi.FiPackage, 'Accessoires compris', 'Casque, antivol, éclairage : oui, s’ils servent au trajet et figurent sur la facture du vélo et dans la décision de l’employeur.', M, 2.05, 6.3, K.peach);
    await iconRow(s, Fi.FiCreditCard, 'Comment c’est versé', 'Sur la fiche de paie ou par titre-mobilité, contre une attestation sur l’honneur au moins une fois par an.', M, 3.55, 6.3, K.peach);
    await iconRow(s, Fi.FiRefreshCw, 'Chaque année', 'Le montant se renouvelle au 1er janvier, tant que le salarié vient à vélo.', M, 5.05, 6.3, K.peach);
    photo(s, HD('ph-sidebag.jpg'), 7.5, 1.85, 2.55, 4.8, 0.4);
    photo(s, HD('ph-rack.jpg'), 10.25, 1.85, 2.48, 2.3, 0.35);
    photo(s, HD('ph-frontbag.jpg'), 10.25, 4.35, 2.48, 2.3, 0);
  }

  // ============================================================ 19. DIRIGEANT
  {
    const s = pres.addSlide({ masterName: 'CLUB_B', sectionTitle: 'Les formules' });
    kicker(s, 'FORMULE B  ·  POUR LE DIRIGEANT', M, 0.42, K.peach);
    title(s, 'METTRE EN PLACE LE FORFAIT EN 4 ÉTAPES');
    const steps = [
      ['Fixer le montant', 'Jusqu’à 600 € par an et par salarié, mêmes critères pour tous'],
      ['Écrire la décision', 'Accord d’entreprise ou décision du dirigeant, après avis du CSE s’il existe. Modèle fourni'],
      ['Informer les salariés', 'Message prêt à envoyer et journée d’essai au club'],
      ['Verser sur la paie', 'Ligne exonérée sur le bulletin, contre une attestation par an'],
    ];
    steps.forEach(([h, b], i) => {
      const y = 1.85 + i * 1.18;
      snip(s, M, y, 7.4, 1.0, K.panel, 'etape-' + (i + 1));
      txt(s, String(i + 1).padStart(2, '0'), { x: M + 0.3, y: y + 0.12, w: 0.95, h: 0.8, fontFace: TITLE, fontSize: 40, bold: true, color: K.peach });
      txt(s, h, { x: M + 1.35, y: y + 0.13, w: 5.9, h: 0.35, fontFace: HEAD, fontSize: 16, bold: true, color: K.white });
      txt(s, b, { x: M + 1.35, y: y + 0.48, w: 5.9, h: 0.45, fontSize: 14, color: K.mute });
    });
    photo(s, A('business.jpg'), 8.45, 1.85, 4.28, 4.55, 0.5);
  }

  // ============================================================ 20. SIMULATION
  {
    const s = pres.addSlide({ masterName: 'CLUB_C', sectionTitle: 'Les formules' });
    kicker(s, 'SIMULATION');
    title(s, 'CE QUE ÇA COÛTE VRAIMENT');
    snip(s, M, 1.8, 5.95, 4.6, K.panel, 'simulation-A');
    txt(s, 'FORMULE A  ·  L’ENTREPRISE ACHÈTE', { x: M + 0.4, y: 2.02, w: 5.2, h: 0.3, fontFace: HEAD, fontSize: 11, bold: true, color: K.orange, charSpacing: 3 });
    txt(s, `≈ 900${nb}€`, { x: M + 0.4, y: 2.35, w: 5.2, h: 1.1, fontFace: TITLE, fontSize: 70, bold: true, color: K.white });
    txt(s, `net par vélo pour l’entreprise, au lieu de 1${nb}800${nb}€`, { x: M + 0.4, y: 3.5, w: 5.2, h: 0.4, fontSize: 16, color: K.text });
    s.addChart(pres.charts.BAR, [{ name: 'Montant', labels: ['10 vélos', 'Réduction d’IS', 'IS sur amortissement', 'Coût net'], values: [18000, 4500, 4500, 9000] }], {
      x: M + 0.3, y: 4.0, w: 5.35, h: 2.25, barDir: 'bar', chartColors: [K.orange], showValue: true, dataLabelPosition: 'outEnd', dataLabelColor: K.text, dataLabelFontSize: 11, dataLabelFormatCode: '# ##0" €"',
      catAxisLabelColor: K.mute, catAxisLabelFontSize: 11, valAxisHidden: true, valGridLine: { style: 'none' }, catGridLine: { style: 'none' }, showLegend: false, catAxisLineShow: false, catAxisOrientation: 'maxMin',
      catAxisLabelFontFace: '+mn-lt', dataLabelFontFace: '+mn-lt', barGapWidthPct: 45,
    });
    const x = M + 6.25;
    snip(s, x, 1.8, 5.95, 4.6, K.panel, 'simulation-B');
    txt(s, 'FORMULE B  ·  LE SALARIÉ ACHÈTE', { x: x + 0.4, y: 2.02, w: 5.2, h: 0.3, fontFace: HEAD, fontSize: 11, bold: true, color: K.peach, charSpacing: 3 });
    txt(s, `0${nb}€`, { x: x + 0.4, y: 2.35, w: 5.2, h: 1.1, fontFace: TITLE, fontSize: 70, bold: true, color: K.white });
    txt(s, 'reste à charge du salarié au bout de 3 ans', { x: x + 0.4, y: 3.5, w: 5.2, h: 0.4, fontSize: 16, color: K.text });
    s.addChart(pres.charts.BAR, [{ name: 'Reste à payer', labels: ['Achat', 'Après 1 an', 'Après 2 ans', 'Après 3 ans'], values: [1800, 1200, 600, 0] }], {
      x: x + 0.3, y: 4.0, w: 5.35, h: 2.25, barDir: 'col', chartColors: [K.peach], showValue: true, dataLabelPosition: 'outEnd', dataLabelColor: K.text, dataLabelFontSize: 11, dataLabelFormatCode: '# ##0" €"',
      catAxisLabelColor: K.mute, catAxisLabelFontSize: 11, valAxisHidden: true, valGridLine: { style: 'none' }, catGridLine: { style: 'none' }, showLegend: false, catAxisLineShow: false,
      catAxisLabelFontFace: '+mn-lt', dataLabelFontFace: '+mn-lt', barGapWidthPct: 60,
    });
    txt(s, `Hypothèses : vélo à 1${nb}800${nb}€ TTC (la gamme va de 1${nb}449 à 2${nb}799${nb}€), IS à 25 %, 600${nb}€ de FMD par an. Coût employeur formule B : 1${nb}800${nb}€ sans charges, contre ≈ 3${nb}300${nb}€ versés en salaire. Prix partenaires MAP FOUR à confirmer.`, { x: M, y: 6.5, w: W - 2 * M, h: 0.4, fontSize: 10, color: K.mute });
  }

  // ============================================================ 21. AIDES LOCALES
  pres.addSection({ title: 'Aides et impact' });
  {
    const s = pres.addSlide({ masterName: 'CLUB_A', sectionTitle: 'Aides et impact' });
    kicker(s, 'AIDES LOCALES  ·  BRIVE ET ALENTOURS');
    title(s, 'JUSQU’À 300 € DE PLUS SELON LA COMMUNE');
    s.addChart(pres.charts.BAR, [{ name: 'Aide maximale', labels: ['Limoges Métropole', 'Grand Périgueux', 'Agglo de Brive', 'Tulle Agglo', 'Grand Cahors', 'Région et État'], values: [300, 250, 200, 200, 200, 0] }], {
      x: M - 0.1, y: 1.8, w: 5.6, h: 4.3, barDir: 'bar', chartColors: [K.orange], showValue: true, dataLabelPosition: 'outEnd', dataLabelColor: K.white, dataLabelFontSize: 12, dataLabelFormatCode: '0" €"',
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
    s.addTable(table(rows, [1.85, 2.4, 2.38], { size: 12 }), { x: 6.1, y: 1.85, w: 6.63, colW: [1.85, 2.4, 2.38], rowH: 0.56 });
    txt(s, 'Toutes se cumulent avec le forfait mobilités durables de l’employeur. Montants de Tulle Agglo de 2024, à vérifier pour 2026.', { x: M, y: 6.35, w: W - 2 * M, h: 0.3, fontSize: 11, color: K.mute });
  }

  // ============================================================ 22. CO2
  {
    const s = pres.addSlide({ masterName: 'CLUB_B', sectionTitle: 'Aides et impact' });
    kicker(s, 'IMPACT CO2');
    txt(s, '840 kg', { x: M, y: 0.75, w: 8, h: 2.0, fontFace: TITLE, fontSize: 128, bold: true, color: K.orange });
    txt(s, 'DE CO2 ÉVITÉS PAR SALARIÉ ET PAR AN', { x: M, y: 3.3, w: 7.8, h: 0.55, fontFace: TITLE, fontSize: 28, bold: true, color: K.white });
    txt(s, 'Vélo électrique au lieu de la voiture, 10 km aller, 200 jours par an', { x: M, y: 3.85, w: 7.8, h: 0.4, fontSize: 16, color: K.mute });
    [['420 kg', 'pour 5 km aller'], ['1,3 t', 'pour 15 km aller'], ['8,4 t', 'pour 10 salariés à 10 km']].forEach(([b, l], i) => {
      const x = M + i * 2.6;
      snip(s, x, 4.55, 2.4, 1.55, K.panel, 'co2-' + i);
      txt(s, b, { x: x + 0.3, y: 4.68, w: 1.9, h: 0.75, fontFace: TITLE, fontSize: 36, bold: true, color: K.white });
      txt(s, l, { x: x + 0.3, y: 5.42, w: 1.9, h: 0.6, fontSize: 13, color: K.mute });
    });
    s.addChart(pres.charts.BAR, [{ name: 'g CO2 / km', labels: ['Voiture en ville', 'Vélo électrique'], values: [213, 2] }], {
      x: 8.75, y: 1.2, w: 4.0, h: 4.9, barDir: 'col', chartColors: [K.mute, K.orange], showValue: true, dataLabelPosition: 'outEnd', dataLabelColor: K.white, dataLabelFontSize: 14, dataLabelFormatCode: '0" g"',
      catAxisLabelColor: K.text, catAxisLabelFontSize: 12, valAxisHidden: true, valGridLine: { style: 'none' }, catGridLine: { style: 'none' }, showLegend: false, catAxisLineShow: false,
      catAxisLabelFontFace: '+mn-lt', dataLabelFontFace: '+mn-lt', barGapWidthPct: 40, showTitle: true, title: 'Émissions par km (g CO2)', titleColor: K.mute, titleFontSize: 12, titleFontFace: '+mn-lt',
    });
    txt(s, 'Source : ADEME, voiture en ville 213 g CO2/km contre 2 g pour un vélo électrique', { x: M, y: 6.35, w: W - 2 * M, h: 0.3, fontSize: 11, color: K.mute });
  }

  // ============================================================ 23. CAS PRATIQUE
  pres.addSection({ title: 'Partenariat' });
  divider('Partenariat', '04', 'LE PARTENARIAT EN PRATIQUE', 'Un exemple chiffré, les étapes de mise en place et vos contacts.', A('forest.jpg'));
  {
    const s = pres.addSlide({ masterName: 'CLUB_C', sectionTitle: 'Partenariat' });
    kicker(s, 'EXEMPLE DE PARTENARIAT  ·  CAS ILLUSTRATIF');
    title(s, 'UNE PME BRIVOISE DE 30 SALARIÉS');
    snip(s, M, 1.8, 3.6, 4.5, K.panel, 'profil');
    txt(s, 'LE PROFIL', { x: M + 0.3, y: 2.0, w: 3, h: 0.3, fontFace: HEAD, fontSize: 11, bold: true, color: K.orange, charSpacing: 3 });
    txt(s, bullets(['30 salariés à Brive', '10 viennent de 5 à 15 km, en voiture', 'Entreprise à l’IS', 'Objectif : bien-être et image RSE']), { x: M + 0.3, y: 2.45, w: 3.1, h: 2.6, fontSize: 15, color: K.text, paraSpaceAfter: 10 });
    await product(s, HD('roam.png'), M + 0.3, 4.75, 3.0, 1.35);
    const tl = [['S1', 'Présentation au club', 'Besoins recensés, choix de la formule'], ['S2', 'Journée d’essai au club', 'Les salariés testent la gamme'], ['S4', 'Commande', '10 vélos en formule A, forfait B ouvert aux 20 autres'], ['S6', 'Remise au club', 'Vélos livrés, entretien et SAV Repair and Run']];
    const tx = M + 3.9;
    s.addShape('line', { x: tx + 0.28, y: 2.1, w: 0, h: 3.9, line: { color: K.line, width: 1.5 } });
    tl.forEach(([w_, h, b], i) => {
      const y = 1.85 + i * 1.08;
      s.addShape('ellipse', { x: tx, y: y + 0.05, w: 0.56, h: 0.56, fill: { color: K.bg }, line: { color: K.orange, width: 1.5 } });
      txt(s, w_, { x: tx, y: y + 0.18, w: 0.56, h: 0.3, fontFace: HEAD, fontSize: 11, bold: true, color: K.orange, align: 'center' });
      txt(s, h, { x: tx + 0.8, y, w: 3.4, h: 0.33, fontFace: HEAD, fontSize: 15, bold: true, color: K.white });
      txt(s, b, { x: tx + 0.8, y: y + 0.35, w: 3.4, h: 0.55, fontSize: 13, color: K.mute });
    });
    const rx = M + 8.35;
    snip(s, rx, 1.8, W - M - rx, 4.5, K.panel2, 'resultats', K.orangeDeep);
    txt(s, 'LE RÉSULTAT', { x: rx + 0.3, y: 2.0, w: 3, h: 0.3, fontFace: HEAD, fontSize: 11, bold: true, color: K.orange, charSpacing: 3 });
    [[`≈ 9${nb}000${nb}€`, `coût net des 10 vélos, au lieu de 18${nb}000${nb}€`], ['8,4 t', 'de CO2 évitées chaque année'], [`600${nb}€`, 'par an possibles pour les 20 autres salariés']].forEach(([b, l], i) => {
      txt(s, b, { x: rx + 0.3, y: 2.42 + i * 1.25, w: 3.4, h: 0.65, fontFace: TITLE, fontSize: 36, bold: true, color: i === 2 ? K.peach : K.white });
      txt(s, l, { x: rx + 0.3, y: 3.05 + i * 1.25, w: 3.4, h: 0.5, fontSize: 13, color: K.mute });
    });
    txt(s, `Exemple illustratif construit avec les hypothèses du dossier : vélo à 1${nb}800${nb}€ TTC, IS à 25 %, trajets de 10 km. Prix partenaires MAP FOUR à confirmer.`, { x: M, y: 6.45, w: W - 2 * M, h: 0.3, fontSize: 11, color: K.mute });
  }

  // ============================================================ 25. GAGNANT-GAGNANT
  {
    const s = pres.addSlide({ masterName: 'CLUB_A', sectionTitle: 'Partenariat' });
    kicker(s, 'LE PARTENARIAT');
    title(s, 'CE QUE CHACUN Y GAGNE');
    const cols = [
      [Fi.FiBriefcase, 'L’ENTREPRISE', K.orange, ['Jusqu’à 25 % du prix récupéré (formule A)', 'Un avantage salarié sans charges (formule B)', 'Un geste RSE concret et mesurable']],
      [Fi.FiUsers, 'LES SALARIÉS', K.orange, ['Un vélo haut de gamme, connecté et protégé', 'Du sport chaque jour sur le trajet', 'Jusqu’à 600 € par an, et les aides locales en plus']],
      [Fi.FiAward, 'LE CLUB', K.peach, ['Un lien renforcé avec ses entreprises partenaires', 'La journée d’essai et la remise des vélos au club', 'Contreparties de visibilité à définir ensemble']],
    ];
    const cw = (W - 2 * M - 0.6) / 3;
    for (const [i, [ic, h, col, items]] of cols.entries()) {
      const x = M + i * (cw + 0.3);
      snip(s, x, 1.85, cw, 4.65, K.panel, 'gain-' + i);
      s.addShape('ellipse', { x: x + 0.35, y: 2.15, w: 0.8, h: 0.8, fill: { color: K.panel2 }, line: { color: col, width: 1.25 } });
      s.addImage({ data: await icon(ic, col), x: x + 0.55, y: 2.35, w: 0.4, h: 0.4 });
      txt(s, h, { x: x + 0.35, y: 3.2, w: cw - 0.7, h: 0.45, fontFace: TITLE, fontSize: 24, bold: true, color: K.white, charSpacing: 1 });
      txt(s, bullets(items, col), { x: x + 0.35, y: 3.8, w: cw - 0.7, h: 2.5, fontSize: 15, color: K.text, paraSpaceAfter: 12 });
    }
  }

  // ============================================================ 26. COMMENT ÇA MARCHE
  {
    const s = pres.addSlide({ masterName: 'CLUB_B', sectionTitle: 'Partenariat' });
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
    photo(s, A('couple.jpg'), 8.05, 1.85, 4.68, 4.45, 0.5);
  }

  // ============================================================ 27. CONTACT
  pres.addSection({ title: 'Contact' });
  {
    const s = pres.addSlide({ masterName: 'PHOTO', sectionTitle: 'Contact' });
    s.addImage({ path: A('bg-b.jpg'), x: 0, y: 0, w: W, h: H });
    s.addImage({ path: HD('ph-roam-vertical.jpg'), x: 0, y: 0, w: 5.4, h: H, sizing: { type: 'cover', w: 5.4, h: H } });
    s.addImage({ path: A('fade-r.png'), x: 3.2, y: 0, w: 2.25, h: H });
    kicker(s, 'ON EN PARLE ?', 6.0, 0.7);
    txt(s, 'ÉQUIPEZ VOS SALARIÉS\nDÈS CET HIVER', { x: 6.0, y: 1.0, w: 6.8, h: 1.7, fontFace: TITLE, fontSize: 46, bold: true, color: K.white, lineSpacingMultiple: 0.92 });
    snip(s, 6.0, 2.95, 6.73, 1.85, K.panel, 'contact-club');
    s.addImage({ path: HD('club-logo.jpg'), x: 6.25, y: 3.15, w: 1.6, h: 1.6 * 1068 / 1200 });
    s.addImage({ path: HD('wordmark.png'), x: 8.1, y: 3.2, w: 3.5, h: 3.5 * 275 / 2063 });
    txt(s, ['39 bis avenue Ribot, 19100 Brive-la-Gaillarde', '06 77 87 46 25  ·  06 70 27 57 97', 'boxeacademiebrive@gmail.com  ·  boxe-academie.fr'].join('\n'), { x: 8.1, y: 3.78, w: 4.5, h: 0.95, fontSize: 13, color: K.text });
    snip(s, 6.0, 5.0, 6.73, 1.75, K.panel, 'contact-conseiller');
    s.addImage({ path: HD('mapfour-logo-white.png'), x: 6.3, y: 5.22, w: 1.8, h: 1.8 * 109 / 720 });
    txt(s, 'VOTRE CONSEILLER VÉLO', { x: 8.4, y: 5.22, w: 4.2, h: 0.3, fontFace: HEAD, fontSize: 11, bold: true, color: K.orange, charSpacing: 3 });
    txt(s, [
      { text: 'Fernando De Oliveira Salgueiro', options: { bold: true, color: K.white, fontSize: 16, breakLine: true } },
      { text: 'MPIE Group, agent MAP FOUR en France', options: { breakLine: true } },
      { text: '06 74 76 18 19  ·  f.deoliveira@mpiegroup.com' },
    ], { x: 6.3, y: 5.62, w: 6.3, h: 1.05, fontSize: 13, color: K.text });
  }

  await pres.writeFile({ fileName: OUT });
  console.log('wrote', OUT);
})().catch((e) => { console.error(e); process.exit(1); });

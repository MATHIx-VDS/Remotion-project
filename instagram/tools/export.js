// Exporte chaque slide HTML en PNG à la taille exacte (1080×1350, story 1080×1920).
// node tools/export.js            → toutes les slides
// node tools/export.js 01 story   → seulement celles dont le nom commence par 01 ou story
const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const DIR = path.resolve(__dirname, '..');
const SLIDES = [
  ['01-couverture.html', '01-couverture.png', 1350],
  ['02-comment-ca-marche.html', '02-comment-ca-marche.png', 1350],
  ['03-enchaine-les-coups.html', '03-enchaine-les-coups.png', 1350],
  ['04-tente-ta-chance.html', '04-tente-ta-chance.png', 1350],
  ['05-a-toi-de-jouer.html', '05-a-toi-de-jouer.png', 1350],
  ['story.html', 'story.png', 1920],
];
const only = process.argv.slice(2);

(async () => {
  fs.mkdirSync(path.join(DIR, 'export'), { recursive: true });
  const b = await chromium.launch();
  for (const [html, png, h] of SLIDES) {
    if (only.length && !only.some((o) => html.startsWith(o))) continue;
    const p = await b.newPage({ viewport: { width: 1080, height: h }, deviceScaleFactor: 1 });
    await p.goto('file://' + path.join(DIR, html), { waitUntil: 'networkidle' });
    await p.evaluate(async () => {
      await document.fonts.ready;
      await Promise.all([...document.images].map((i) => (i.complete ? 0 : new Promise((r) => { i.onload = i.onerror = r; }))));
    });
    // texte qui déborde de la zone de sécurité (80 px) : signalé
    const issues = await p.evaluate(() => {
      const out = [];
      const W = 1080, H = document.querySelector('.slide').offsetHeight;
      document.querySelectorAll('.slide h1, .slide h2, .slide p, .slide li, .slide b, .slide span.txt').forEach((el) => {
        const r = el.getBoundingClientRect();
        if (!r.width) return;
        if (r.left < 79 || r.right > W - 79 || r.top < 60 || r.bottom > H - 60) out.push(`${el.tagName}.${el.className} «${el.textContent.trim().slice(0, 30)}» ${Math.round(r.left)},${Math.round(r.top)}→${Math.round(r.right)},${Math.round(r.bottom)}`);
        if (el.scrollWidth > el.clientWidth + 1 && getComputedStyle(el).overflow !== 'visible') out.push('coupé : ' + el.textContent.trim().slice(0, 30));
      });
      return out;
    });
    await p.locator('.slide').screenshot({ path: path.join(DIR, 'export', png) });
    console.log(png, issues.length ? '\n  ⚠ ' + issues.join('\n  ⚠ ') : 'ok');
    await p.close();
  }
  await b.close();
})();

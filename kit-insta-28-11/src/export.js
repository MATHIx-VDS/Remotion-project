// Exporte les visuels du kit en PNG à la taille exacte, avec contrôle des zones de sécurité.
// node export.js            → tout
// node export.js carrousel  → seulement les fichiers dont le nom commence par « carrousel »
const { chromium } = require('playwright');
const path = require('path');

const SRC = __dirname;
const KIT = path.resolve(__dirname, '..');
// [html, png, hauteur, marge haute, marge basse] : marges = zones où aucun texte ne doit se trouver
const JOBS = [
  ['carrousel-1.html', 'carrousel/01-accroche.png', 1350, 60, 60],
  ['carrousel-2.html', 'carrousel/02-kevin-albertus.png', 1350, 60, 60],
  ['carrousel-3.html', 'carrousel/03-chloe-nandi.png', 1350, 60, 60],
  ['carrousel-4.html', 'carrousel/04-infos.png', 1350, 60, 60],
  ['story-1.html', 'stories/story-1-annonce.png', 1920, 250, 340],
  ['story-2.html', 'stories/story-2-demain-10h.png', 1920, 250, 340],
  ['story-3.html', 'stories/story-3-c-est-aujourd-hui.png', 1920, 250, 340],
];
const only = process.argv.slice(2);

(async () => {
  const b = await chromium.launch();
  for (const [html, png, h, top, bottom] of JOBS) {
    if (only.length && !only.some((o) => html.startsWith(o))) continue;
    const p = await b.newPage({ viewport: { width: 1080, height: h }, deviceScaleFactor: 1 });
    await p.goto('file://' + path.join(SRC, html), { waitUntil: 'networkidle' });
    await p.evaluate(async () => {
      await document.fonts.ready;
      await Promise.all([...document.images].map((i) => (i.complete ? 0 : new Promise((r) => { i.onload = i.onerror = r; }))));
    });
    const issues = await p.evaluate(([H, top, bottom]) => {
      const out = [];
      document.querySelectorAll('.frame h1, .frame h2, .frame p, .frame dd, .frame dt, .frame .chip').forEach((el) => {
        if (el.closest('[data-allow-edge]')) return;
        const r = el.getBoundingClientRect();
        if (!r.width) return;
        const t = el.textContent.trim().slice(0, 28);
        if (r.left < 40 || r.right > 1040) out.push(`hors marge latérale « ${t} » ${Math.round(r.left)}→${Math.round(r.right)}`);
        if (r.top < top || r.bottom > H - bottom) out.push(`zone de sécurité « ${t} » ${Math.round(r.top)}→${Math.round(r.bottom)}`);
        if (el.scrollWidth > el.clientWidth + 2 && getComputedStyle(el).overflow !== 'visible') out.push(`coupé « ${t} »`);
      });
      return out;
    }, [h, top, bottom]);
    await p.screenshot({ path: path.join(KIT, png), clip: { x: 0, y: 0, width: 1080, height: h } });
    console.log(png, issues.length ? '\n  ⚠ ' + issues.join('\n  ⚠ ') : 'ok');
    await p.close();
  }
  await b.close();
})();

// Rend chaque visuel animé image par image à 60 i/s (motion/motion.js) dans un dossier de frames JPEG.
// node tools/render-frames.js <dossier_frames> [01 02 … story]
const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const DIR = path.resolve(__dirname, '..');
const FPS = 60;
const TR = 0.28; // durée des transitions (le visuel sortant continue de jouer pendant ce temps)
// [fichier, hauteur, durée à l'écran en s]
const SHOTS = [
  ['01-couverture.html', 1350, 2.9],
  ['02-comment-ca-marche.html', 1350, 3.1],
  ['03-enchaine-les-coups.html', 1350, 3.0],
  ['04-tente-ta-chance.html', 1350, 3.0],
  ['05-a-toi-de-jouer.html', 1350, 3.4],
  ['story.html', 1920, 6.0],
];
const OUT = path.resolve(process.argv[2]);
const only = process.argv.slice(3);

(async () => {
  const b = await chromium.launch();
  for (let n = 0; n < SHOTS.length; n++) {
    const [html, h, dur] = SHOTS[n];
    const name = html.replace('.html', '');
    if (only.length && !only.some((o) => html.startsWith(o))) continue;
    const isLastSlide = n === 4 || html === 'story.html';
    const frames = Math.round((dur + (isLastSlide ? 0 : TR)) * FPS);
    const dir = path.join(OUT, name);
    fs.mkdirSync(dir, { recursive: true });
    const p = await b.newPage({ viewport: { width: 1080, height: h }, deviceScaleFactor: 1 });
    await p.goto('file://' + path.join(DIR, html), { waitUntil: 'networkidle' });
    await p.evaluate(async () => {
      await document.fonts.ready;
      await Promise.all([...document.images].map((i) => (i.complete ? 0 : new Promise((r) => { i.onload = i.onerror = r; }))));
    });
    await p.addScriptTag({ path: path.join(DIR, 'motion', 'motion.js') });
    for (let f = 0; f < frames; f++) {
      await p.evaluate((t) => window.seek(t), f / FPS);
      await p.screenshot({ path: path.join(dir, `f_${String(f).padStart(4, '0')}.jpg`), type: 'jpeg', quality: 94, clip: { x: 0, y: 0, width: 1080, height: h } });
    }
    console.log(name, frames, 'frames');
    await p.close();
  }
  await b.close();
})();

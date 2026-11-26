// Rend le Reel image par image à 60 i/s (reel.html + reel.js) dans un dossier de JPEG.
// node reel-frames.js <dossier_frames> [durée=12]
const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const OUT = path.resolve(process.argv[2]);
const DUR = +(process.argv[3] || 12);
const FPS = 60;
fs.mkdirSync(OUT, { recursive: true });

(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 1080, height: 1920 }, deviceScaleFactor: 1 });
  await p.goto('file://' + path.join(__dirname, 'reel.html'), { waitUntil: 'networkidle' });
  await p.evaluate(async () => {
    await document.fonts.ready;
    await Promise.all([...document.images].map((i) => (i.complete ? 0 : new Promise((r) => { i.onload = i.onerror = r; }))));
  });
  console.log(JSON.stringify(await p.evaluate(() => window.TIMELINE)));
  const n = Math.round(DUR * FPS);
  for (let f = 0; f < n; f++) {
    await p.evaluate((t) => window.seek(t), f / FPS);
    await p.screenshot({ path: path.join(OUT, `f_${String(f).padStart(4, '0')}.jpg`), type: 'jpeg', quality: 93, clip: { x: 0, y: 0, width: 1080, height: 1920 } });
  }
  console.log(n, 'images');
  await b.close();
})();

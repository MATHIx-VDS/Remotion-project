// Capture réelle du jeu en ligne, en viewport mobile 390×844 (partie en cours, combo déclenché).
// node tools/capture.js <dossier de sortie>
const { chromium } = require('playwright');
const OUT = process.argv[2] || 'assets';
(async () => {
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, hasTouch: true, isMobile: true });
  const p = await ctx.newPage();
  await p.goto('https://defi-noel-boxe-academie.netlify.app/', { waitUntil: 'networkidle' });
  await p.waitForTimeout(1500);
  await p.screenshot({ path: OUT + '/capture-accueil.png' });
  await p.tap('#startBtn', { force: true });
  await p.waitForSelector('#screen-game.is-active', { timeout: 8000 });
  const box = await p.locator('#bagHit').boundingBox();
  const t0 = Date.now();
  let i = 0;
  while (Date.now() - t0 < 4200) {
    await p.touchscreen.tap(box.x + box.width * (i % 2 ? 0.3 : 0.7), box.y + box.height * (0.4 + 0.2 * Math.random()));
    i++;
    await p.waitForTimeout(75);
  }
  await p.screenshot({ path: OUT + '/capture-jeu.png' });
  await b.close();
})();

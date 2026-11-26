/* Animation du Reel, image par image : window.seek(t) (en secondes) place tout à l'instant t.
   Coupes sèches (calées sur les temps de la musique à 100 BPM) avec flash orange,
   Ken Burns lent sur les photos, textes qui claquent (scale + secousse). */
(function () {
  'use strict';
  const $$ = (s) => [...document.querySelectorAll(s)];
  const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
  const outBack = (p, s = 1.6) => 1 + (s + 1) * Math.pow(p - 1, 3) + s * Math.pow(p - 1, 2);
  const shots = $$('.shot').map((el) => ({ el, a: +el.dataset.in, b: +el.dataset.out }));
  const cuts = shots.map((s) => s.a);
  const slams = $$('[data-slam]').map((el) => ({
    el, t0: +el.dataset.slam,
    skew: el.classList.contains('t') || el.classList.contains('band-txt') ? 'skewX(-7deg) ' : '',
  }));
  const slamTimes = [...new Set(slams.map((s) => s.t0))];
  const stage = document.getElementById('stage');
  const flash = document.getElementById('flash');
  const grain = document.querySelector('.grain');

  window.TIMELINE = { cuts, slams: slamTimes }; // lu par le mixage pour caler les bruitages

  window.seek = function (t) {
    // plan visible
    let cur = null;
    shots.forEach((s) => {
      const on = t >= s.a && t < s.b;
      s.el.style.display = on ? 'block' : 'none';
      if (on) cur = s;
    });
    // Ken Burns : zoom lent et léger glissement
    if (cur) {
      cur.el.querySelectorAll('[data-kb]').forEach((img) => {
        const d = t - cur.a;
        img.style.transform = `scale(${(1.04 + 0.028 * d).toFixed(5)}) translate(${(-6 * d).toFixed(2)}px, ${(4 * d).toFixed(2)}px)`;
      });
    }
    // textes qui claquent
    slams.forEach(({ el, t0, skew }) => {
      const d = t - t0;
      if (d < 0) { el.style.opacity = 0; return; }
      const p = clamp(d / 0.16);
      const s = 1.7 - 0.7 * outBack(p, 2.2);
      el.style.opacity = clamp(d / 0.03);
      el.style.transform = `${skew}scale(${s.toFixed(4)})`;
    });
    // secousse de l'image à chaque impact
    let e = 0;
    slamTimes.forEach((t0) => { const d = t - t0; if (d >= 0 && d < 0.3) e = Math.max(e, 16 * Math.exp(-14 * d)); });
    stage.style.transform = `translate(${(e * Math.sin(t * 97)).toFixed(2)}px, ${(e * 0.7 * Math.cos(t * 83)).toFixed(2)}px) scale(1.02)`;
    // flash orange sur les coupes
    let f = 0;
    cuts.forEach((c) => { const d = t - c; if (d >= 0 && d < 0.2) f = Math.max(f, 0.85 * Math.pow(1 - d / 0.2, 2)); });
    flash.style.opacity = f.toFixed(3);
    // grain vivant
    const k = Math.floor(t * 30);
    grain.style.transform = `translate(${((k * 37) % 60) - 30}px, ${((k * 53) % 60) - 30}px) scale(1.08)`;
  };
  window.seek(0);
})();

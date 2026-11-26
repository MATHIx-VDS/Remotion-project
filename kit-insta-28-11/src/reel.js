/* Animation du Reel, image par image : await window.seek(t) place tout à l'instant t.
   Extraits vidéo lus image par image (assets/footage/<extrait>/f_0001.jpg… à 60 i/s), coupes sèches sur le temps,
   léger « punch-in » à chaque coupe, textes qui montent derrière un masque, filets orange qui se tracent. */
(function () {
  'use strict';
  const $$ = (s) => [...document.querySelectorAll(s)];
  const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
  const expo = (p) => (p >= 1 ? 1 : 1 - Math.pow(2, -10 * p));
  const shots = $$('.shot').map((el) => ({ el, a: +el.dataset.in, b: +el.dataset.out }));
  const clips = $$('.media img').map((el) => ({ el, a: +el.dataset.in, b: +el.dataset.out, seq: el.dataset.seq, n: +el.dataset.n || 0 }));
  const revs = $$('[data-rev]').map((el) => ({ span: el.firstElementChild, t0: +el.dataset.rev }));
  const draws = $$('[data-draw]').map((el) => ({ el, t0: +el.dataset.draw }));
  const fades = $$('[data-fade]').map((el) => ({ el, t0: +el.dataset.fade }));
  const pops = $$('[data-pop]').map((el) => ({ el, t0: +el.dataset.pop }));
  const grain = document.querySelector('.grain');
  const credit = document.getElementById('credit');
  window.TIMELINE = { cuts: [...new Set(clips.map((c) => c.a).concat(shots.map((s) => s.a)))].sort((x, y) => x - y) };

  window.seek = async function (t) {
    shots.forEach((s) => { s.el.style.display = t >= s.a && t < s.b ? 'block' : 'none'; });
    const loading = [];
    clips.forEach((c) => {
      const on = t >= c.a && t < c.b;
      c.el.style.display = on ? 'block' : 'none';
      if (!on) return;
      const d = t - c.a;
      if (c.seq) {
        const i = clamp(Math.floor(d * 60 + 1e-6), 0, c.n - 1) + 1;
        const src = `assets/footage/${c.seq}/f_${String(i).padStart(4, '0')}.jpg`;
        if (!c.el.src.endsWith(src)) { c.el.src = src; loading.push(c.el.decode().catch(() => {})); }
      }
      // punch-in à la coupe (1,08 → 1,0 en 0,35 s) puis zoom lent
      const punch = 0.08 * (1 - expo(clamp(d / 0.35)));
      c.el.style.transform = `scale(${(1 + punch + 0.02 * d).toFixed(5)})`;
    });
    revs.forEach(({ span, t0 }) => { span.style.transform = `translateY(${((1 - expo(clamp((t - t0) / 0.55))) * 105).toFixed(3)}%)`; });
    draws.forEach(({ el, t0 }) => { el.style.transform = `scaleX(${expo(clamp((t - t0) / 0.5)).toFixed(4)})`; });
    fades.forEach(({ el, t0 }) => {
      const p = expo(clamp((t - t0) / 0.45));
      el.style.opacity = p.toFixed(3);
      el.style.transform = `translateY(${((1 - p) * 18).toFixed(2)}px)`;
    });
    pops.forEach(({ el, t0 }) => {
      el.style.opacity = clamp((t - t0) / 0.25).toFixed(3);
      el.style.transform = `scale(${(0.86 + 0.14 * expo(clamp((t - t0) / 0.6))).toFixed(4)})`;
    });
    credit.style.display = t < 9.4 ? 'block' : 'none';
    const k = Math.floor(t * 30);
    grain.style.transform = `translate(${((k * 37) % 40) - 20}px, ${((k * 53) % 40) - 20}px)`;
    await Promise.all(loading);
  };
})();

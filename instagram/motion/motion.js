/* Animation des visuels Instagram, image par image : window.seek(t) place chaque élément
   à l'instant t (en secondes). Injecté par tools/render-video.js après le chargement d'une slide.
   Tout est déterministe : la même valeur de t donne toujours la même image. */
(function () {
  'use strict';
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const slide = $('.slide');
  const H = slide.offsetHeight;
  const id = slide.classList.contains('story') ? 'story' : slide.dataset.page;

  // --- outils ------------------------------------------------------------
  const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
  const k = (t, a, d) => clamp((t - a) / d);
  const outCubic = (p) => 1 - Math.pow(1 - p, 3);
  const outQuint = (p) => 1 - Math.pow(1 - p, 5);
  const outBack = (p, s = 1.7) => 1 + (s + 1) * Math.pow(p - 1, 3) + s * Math.pow(p - 1, 2);
  const inOut = (p) => (p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2);

  // transformation d'origine de chaque élément (posée dans le HTML), gardée sous l'animation
  const base = new Map();
  const baseOf = (el) => { if (!base.has(el)) base.set(el, el.style.transform || ''); return base.get(el); };
  function put(el, { x = 0, y = 0, r = 0, s = 1, sx = 1, sy = 1, o = 1 } = {}) {
    if (!el) return;
    el.style.transform = `translate(${x}px, ${y}px) ${baseOf(el)} rotate(${r}deg) scale(${s * sx}, ${s * sy})`;
    el.style.opacity = o;
  }
  const baseDeg = (el) => { const m = /rotate\((-?[\d.]+)deg\)/.exec(baseOf(el)); return m ? +m[1] : 0; };

  // titre : révélé de bas en haut, la partie orange arrive juste après
  function title(el, t, t0) {
    if (!el) return;
    const p = outQuint(k(t, t0, 0.55));
    el.style.clipPath = p >= 1 ? 'none' : `inset(-80px -80px ${((1 - p) * 100).toFixed(2)}% -80px)`;
    put(el, { y: (1 - p) * 70 });
    const em = $('em', el);
    if (em) { em.style.display = 'inline-block'; const q = outQuint(k(t, t0 + 0.14, 0.55)); put(em, { y: (1 - q) * 90, o: q }); }
  }
  const fadeUp = (el, t, t0, d = 0.45, dy = 36) => { const p = outCubic(k(t, t0, d)); put(el, { y: (1 - p) * dy, o: p }); };
  const pop = (el, t, t0, d = 0.4, from = 0.4) => { const p = k(t, t0, d); put(el, { s: from + (1 - from) * outBack(p), o: clamp(p * 4) }); };

  // sac : tombe au bout de sa chaîne, se balance ; un coup à tHit le fait partir du côté opposé
  function bag(el, t, { drop = 0, hit = null, force = 9, sway = 1.6 } = {}) {
    if (!el) return;
    const p = outBack(k(t, drop, 0.6), 1.2);
    let a = sway * Math.sin(t * 2.1);
    let sq = 0;
    if (hit !== null && t >= hit) {
      const d = t - hit;
      a += -force * Math.exp(-2.4 * d) * Math.sin(7.2 * d);
      sq = Math.exp(-14 * d);
    }
    el.style.transformOrigin = '50% 0';
    el.style.transform = `translate(${(sq * 4 * Math.sin(t * 90)).toFixed(2)}px, ${((1 - p) * -260).toFixed(1)}px) rotate(${(baseDeg(el) + a).toFixed(3)}deg) scale(${1 + 0.04 * sq}, ${1 - 0.03 * sq})`;
    el.style.opacity = clamp(k(t, drop, 0.15));
  }

  // impact : anneaux qui s'ouvrent, étincelles projetées, onomatopée qui claque
  const sparkDir = new Map();
  function impact(t, tHit) {
    const d = t - tHit;
    $$('.ring').forEach((el, i) => {
      if (d < 0) { put(el, { o: 0 }); return; }
      const p = k(d, i * 0.06, 0.5);
      put(el, { s: 0.35 + 0.95 * outCubic(p), o: (1 - p) * (p > 0 ? 1 : 0) });
    });
    $$('.spark').forEach((el) => {
      if (!sparkDir.has(el)) { const m = /rotate\((-?[\d.]+)deg\)/.exec(el.style.transform); sparkDir.set(el, ((m ? +m[1] : 0) - 90) * Math.PI / 180); }
      if (d < 0) { put(el, { o: 0 }); return; }
      const p = outCubic(k(d, 0, 0.45)), a = sparkDir.get(el);
      put(el, { x: Math.cos(a) * 70 * p, y: Math.sin(a) * 70 * p, o: 1 - k(d, 0.2, 0.3) });
    });
    const b = $('.burst');
    if (b) { const p = k(d, 0, 0.32); put(b, { s: d < 0 ? 0 : 0.2 + 0.8 * outBack(p, 2.4), r: (1 - outCubic(p)) * -24, o: d < 0 ? 0 : clamp(p * 5) }); }
  }
  // secousse de caméra
  function shake(t, tHit, amp = 12) {
    const d = t - tHit;
    const e = d >= 0 ? amp * Math.exp(-16 * d) : 0;
    slide.style.transform = `translate(${(e * Math.sin(d * 95)).toFixed(2)}px, ${(e * 0.6 * Math.cos(d * 77)).toFixed(2)}px)`;
  }

  // --- ambiance commune ----------------------------------------------------
  const flakes = $$('.snow i').map((el, i) => ({ el, y0: parseFloat(el.style.top), v: 22 + (i * 37) % 40, dx: ((i * 53) % 30) - 15 }));
  const bulbs = $$('.garland svg circle');
  function ambient(t) {
    flakes.forEach((f) => {
      const y = ((f.y0 + f.v * t) % (H + 20)) - f.y0;
      f.el.style.transform = `translate(${(f.dx * Math.sin(t * 0.8 + f.y0)).toFixed(2)}px, ${y.toFixed(2)}px)`;
    });
    bulbs.forEach((c, i) => {
      if (c.getAttribute('r') !== '6') return;
      c.style.opacity = (0.55 + 0.45 * Math.sin(t * (2 + (i % 5) * 0.4) + i)).toFixed(3);
    });
    const img = $('.photo img');
    if (img) img.style.transform = `scale(${(1.04 + 0.012 * t).toFixed(5)})`;
    put($('.brand'), { o: outCubic(k(t, 0, 0.35)) });
    const pg = $('.page');
    if (pg) fadeUp(pg, t, 0.55, 0.4, 20);
    const nx = $('.next');
    if (nx) { const p = outBack(k(t, 0.7, 0.4)); put(nx, { s: 0.3 + 0.7 * p, o: clamp(p * 3), x: t > 1.2 ? 7 * Math.max(0, Math.sin((t - 1.2) * 5)) : 0 }); }
  }

  // --- chaque visuel ---------------------------------------------------------
  const T = {
    1(t) {
      title($('h1'), t, 0.05);
      fadeUp($('.lead'), t, 0.45);
      bag($('.bag'), t, { drop: 0.15, hit: 1.15, force: 10 });
      impact(t, 1.15);
      shake(t, 1.15);
    },
    2(t) {
      title($('h2'), t, 0.05);
      const rail = $('.rail');
      rail.style.transformOrigin = '50% 0';
      put(rail, { sy: outCubic(k(t, 0.4, 0.9)) });
      $$('.step').forEach((el, i) => {
        const p = outCubic(k(t, 0.35 + 0.2 * i, 0.4));
        put(el, { x: (1 - p) * -70, o: p });
        pop($('.num', el), t, 0.35 + 0.2 * i, 0.45, 0.2);
      });
      const ph = outQuint(k(t, 0.25, 0.8));
      put($('.phone'), { y: (1 - ph) * 700, r: (1 - ph) * 10 });
      pop($('.tag'), t, 1.15, 0.4, 0.3);
    },
    3(t) {
      title($('h2'), t, 0.05);
      fadeUp($('.lead'), t, 0.3);
      bag($('.bag'), t, { drop: 0.2, hit: 0.85, force: 8 });
      impact(t, 0.85);
      const c = k(t, 0.85, 0.28);
      put($('.combo'), { s: t < 0.85 ? 0 : 2.3 - 1.3 * outCubic(c), o: t < 0.85 ? 0 : clamp(c * 4) });
      fadeUp($('.combo-sub'), t, 1.1, 0.4, 20);
      shake(t, 0.85, 9);
      $$('.stair').forEach((el, i) => {
        const p = outQuint(k(t, 1.0 + 0.16 * i, 0.5));
        el.style.clipPath = `inset(${((1 - p) * 100).toFixed(2)}% -100px -100px -100px)`;
        put(el, { y: (1 - p) * 60 });
      });
    },
    4(t) {
      title($('h2'), t, 0.05);
      fadeUp($('.lead'), t, 0.3);
      const p = outBack(k(t, 0.45, 0.65), 1.1);
      put($('.card'), { x: (1 - p) * 900, y: (1 - p) * -120, r: (1 - p) * 22, s: 0.85 + 0.15 * p });
      bag($('.card .bag'), t, { drop: 0.7, sway: 2.5 });
      const sh = $('.shine');
      const q = inOut(k(t, 1.15, 0.7));
      sh.style.transform = `translateX(${(-300 + q * 1300).toFixed(1)}px) skewX(-20deg)`;
      sh.style.opacity = q > 0 && q < 1 ? 1 : 0;
      const l = outBack(k(t, 1.3, 0.45));
      put($('.luck'), { y: (1 - l) * 80, s: 0.92 + 0.08 * l, o: clamp(k(t, 1.3, 0.15)) });
    },
    5(t) {
      bag($('.bag'), t, { drop: 0.05, sway: 2 });
      title($('h2'), t, 0.1);
      $$('.chips span').forEach((el, i) => pop(el, t, 0.55 + 0.1 * i, 0.35, 0.3));
      const c = outBack(k(t, 0.85, 0.5), 2);
      const pulse = t > 1.5 ? 0.035 * Math.pow(Math.sin((t - 1.5) * 3.2), 2) : 0;
      put($('.cta'), { s: (0.5 + 0.5 * c) * (1 + pulse), o: clamp(k(t, 0.85, 0.12)) });
      const ar = $('.cta svg');
      put(ar, { y: t > 1.4 ? -8 * Math.abs(Math.sin((t - 1.4) * 4)) : 0 });
      fadeUp($('.end'), t, 1.2);
      fadeUp($('.rules'), t, 1.4, 0.4, 12);
    },
    story(t) {
      fadeUp($('.kick'), t, 0.05, 0.4, 20);
      title($('h1'), t, 0.12);
      bag($('.bag'), t, { drop: 0.55, hit: 1.4, force: 10 });
      impact(t, 1.4);
      shake(t, 1.4);
      pop($$('.t')[1], t, 1.65, 0.4, 0.3);
      fadeUp($('.hint'), t, 1.95, 0.4, 20);
      const sp = $('.hint span');
      sp.style.display = 'inline-block';
      put(sp, { y: t > 2.3 ? 10 * Math.abs(Math.sin((t - 2.3) * 3.5)) : 0 });
    },
  };

  // reflet qui traverse la carte cadeau (slide 4)
  const card = $('.card');
  if (card) {
    const s = document.createElement('div');
    s.className = 'shine';
    s.style.cssText = 'position:absolute;top:-40px;bottom:-40px;left:0;width:140px;background:linear-gradient(90deg,transparent,rgba(255,255,255,.28),transparent);pointer-events:none;z-index:9;opacity:0';
    card.appendChild(s);
  }

  window.seek = function (t) { ambient(t); T[id](t); };
  window.seek(0);
})();

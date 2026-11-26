/* Éléments générés du kit : texture béton/grunge, grain, bandes orange déchirées, éclaboussures.
   Aléatoire reproductible : chaque export donne la même image. */
(function () {
  'use strict';
  let seed = 11;
  const rnd = () => { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; };
  const frame = document.querySelector('.frame');
  const W = frame.offsetWidth, H = frame.offsetHeight;

  // béton : grandes taches + grain fin, en niveaux de gris
  const tex = document.createElement('div');
  tex.className = 'texture';
  tex.innerHTML = `<svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="none">
    <filter id="beton" x="0" y="0" width="100%" height="100%">
      <feTurbulence type="fractalNoise" baseFrequency="0.0035 0.006" numOctaves="4" seed="4"/>
      <feColorMatrix type="saturate" values="0"/>
      <feComponentTransfer><feFuncA type="table" tableValues="0 0.3"/></feComponentTransfer>
    </filter>
    <filter id="pores" x="0" y="0" width="100%" height="100%">
      <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed="8"/>
      <feColorMatrix type="saturate" values="0"/>
      <feComponentTransfer><feFuncA type="table" tableValues="0 0.1"/></feComponentTransfer>
    </filter>
    <rect width="100%" height="100%" filter="url(#beton)" style="mix-blend-mode:soft-light"/>
    <rect width="100%" height="100%" filter="url(#pores)" style="mix-blend-mode:overlay"/>
  </svg>`;
  frame.prepend(tex);
  const vig = document.createElement('div');
  vig.className = 'vignette';
  frame.appendChild(vig);
  const grain = document.createElement('div');
  grain.className = 'grain';
  grain.innerHTML = `<svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="none"><filter id="g"><feTurbulence type="fractalNoise" baseFrequency="1.1" numOctaves="1" seed="3"/><feColorMatrix type="saturate" values="0"/></filter><rect width="100%" height="100%" filter="url(#g)" opacity=".35"/></svg>`;
  frame.appendChild(grain);

  // bandes orange aux bords déchirés
  document.querySelectorAll('.band').forEach((b) => {
    const pts = [];
    const n = 26;
    for (let i = 0; i <= n; i++) pts.push(`${(i / n * 100).toFixed(2)}% ${(rnd() * 9).toFixed(2)}%`);
    pts.push(`${(100 - rnd() * 1.5).toFixed(2)}% 50%`);
    for (let i = n; i >= 0; i--) pts.push(`${(i / n * 100).toFixed(2)}% ${(100 - rnd() * 9).toFixed(2)}%`);
    pts.push(`${(rnd() * 1.5).toFixed(2)}% 50%`);
    b.style.clipPath = `polygon(${pts.join(',')})`;
  });

  // éclaboussures de peinture orange
  document.querySelectorAll('[data-splat]').forEach((el) => {
    const w = el.offsetWidth, h = el.offsetHeight;
    let s = '';
    for (let i = 0; i < 46; i++) {
      const x = rnd() * w, y = rnd() * h, r = Math.pow(rnd(), 3) * 16 + 1.5;
      s += `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${r.toFixed(1)}" fill="#F5710A" opacity="${(0.5 + rnd() * 0.5).toFixed(2)}"/>`;
    }
    for (let i = 0; i < 5; i++) {
      const x = rnd() * w, y = rnd() * h, l = 40 + rnd() * 140, a = rnd() * Math.PI;
      s += `<line x1="${x}" y1="${y}" x2="${x + Math.cos(a) * l}" y2="${y + Math.sin(a) * l}" stroke="#F5710A" stroke-width="${(2 + rnd() * 5).toFixed(1)}" stroke-linecap="round" opacity=".8"/>`;
    }
    el.innerHTML = `<svg width="${w}" height="${h}">${s}</svg>`;
  });
})();

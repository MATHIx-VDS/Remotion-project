/* Éléments communs du carrousel : sac du jeu (même SVG que le site), guirlande, neige,
   en-tête « BOXE ACADÉMIE BRIVE », pagination et flèche. Lu par chaque slide. */
(function () {
  'use strict';
  // Le sac de frappe : copie exacte du SVG du jeu (jeu-noel/index.html)
  var BAG = "<svg viewBox=\"0 0 200 470\" aria-hidden=\"true\"> <defs> <linearGradient id=\"gLeather\" x1=\"0\" x2=\"1\"> <stop offset=\"0\" stop-color=\"#050505\"/> <stop offset=\".18\" stop-color=\"#232323\"/> <stop offset=\".34\" stop-color=\"#3b3b3b\"/> <stop offset=\".5\" stop-color=\"#1f1f1f\"/> <stop offset=\".82\" stop-color=\"#0d0d0d\"/> <stop offset=\"1\" stop-color=\"#020202\"/> </linearGradient> <linearGradient id=\"gBand\" x1=\"0\" x2=\"1\"> <stop offset=\"0\" stop-color=\"#7a3d06\"/> <stop offset=\".3\" stop-color=\"#F08A24\"/> <stop offset=\".42\" stop-color=\"#ffb066\"/> <stop offset=\".6\" stop-color=\"#d9761a\"/> <stop offset=\"1\" stop-color=\"#5e2e04\"/> </linearGradient> <linearGradient id=\"gChain\" x1=\"0\" x2=\"1\"> <stop offset=\"0\" stop-color=\"#5a5a5a\"/> <stop offset=\".45\" stop-color=\"#d8d8d8\"/> <stop offset=\"1\" stop-color=\"#3a3a3a\"/> </linearGradient> <linearGradient id=\"gHat\" x1=\"0\" x2=\"1\"> <stop offset=\"0\" stop-color=\"#5c0a12\"/> <stop offset=\".4\" stop-color=\"#a5162a\"/> <stop offset=\"1\" stop-color=\"#4a0710\"/> </linearGradient> <linearGradient id=\"gHot\" x1=\"0\" x2=\"1\"> <stop offset=\"0\" stop-color=\"#ff6a00\" stop-opacity=\"0\"/> <stop offset=\".22\" stop-color=\"#ff7a10\" stop-opacity=\".55\"/> <stop offset=\".36\" stop-color=\"#ffc070\" stop-opacity=\".9\"/> <stop offset=\".55\" stop-color=\"#ff8a1e\" stop-opacity=\".6\"/> <stop offset=\"1\" stop-color=\"#ff5a00\" stop-opacity=\"0\"/> </linearGradient> <clipPath id=\"clipBag\"><rect x=\"38\" y=\"150\" width=\"124\" height=\"300\" rx=\"26\"/></clipPath> </defs> <!-- chaîne --> <g fill=\"none\" stroke=\"url(#gChain)\" stroke-width=\"5\"> <rect x=\"93\" y=\"-6\" width=\"14\" height=\"26\" rx=\"7\"/> <rect x=\"97.5\" y=\"14\" width=\"5\" height=\"26\" rx=\"2.5\" stroke-width=\"4\"/> <rect x=\"93\" y=\"34\" width=\"14\" height=\"26\" rx=\"7\"/> <rect x=\"97.5\" y=\"54\" width=\"5\" height=\"26\" rx=\"2.5\" stroke-width=\"4\"/> <rect x=\"93\" y=\"74\" width=\"14\" height=\"26\" rx=\"7\"/> </g> <circle cx=\"100\" cy=\"104\" r=\"8\" fill=\"none\" stroke=\"url(#gChain)\" stroke-width=\"5\"/> <!-- sangles --> <g stroke=\"#1b1b1b\" stroke-width=\"5\" stroke-linecap=\"round\"> <path d=\"M100 110 L52 156\"/><path d=\"M100 110 L80 154\"/><path d=\"M100 110 L120 154\"/><path d=\"M100 110 L148 156\"/> </g> <g stroke=\"#9a9a9a\" stroke-width=\"1.2\" opacity=\".55\"><path d=\"M100 110 L52 156\"/><path d=\"M100 110 L148 156\"/></g> <!-- corps du sac --> <rect x=\"38\" y=\"150\" width=\"124\" height=\"300\" rx=\"26\" fill=\"url(#gLeather)\"/> <g clip-path=\"url(#clipBag)\"> <rect class=\"bag-hot\" x=\"38\" y=\"150\" width=\"124\" height=\"300\" fill=\"url(#gHot)\"/> <!-- coutures --> <g stroke=\"#6b6b6b\" stroke-width=\"1.4\" stroke-dasharray=\"5 4\" fill=\"none\" opacity=\".55\"> <path d=\"M60 158 V444\"/><path d=\"M140 158 V444\"/> <path d=\"M40 178 H160\"/><path d=\"M40 424 H160\"/> </g> <!-- bande orange --> <rect x=\"38\" y=\"262\" width=\"124\" height=\"58\" fill=\"url(#gBand)\"/> <path d=\"M38 264 H162 M38 318 H162\" stroke=\"#0d0d0d\" stroke-opacity=\".35\" stroke-width=\"2\"/> <text x=\"100\" y=\"288\" text-anchor=\"middle\" class=\"bag-t1\">BOXE</text> <text x=\"100\" y=\"311\" text-anchor=\"middle\" class=\"bag-t2\">ACADÉMIE</text> <!-- reflet --> <rect x=\"64\" y=\"150\" width=\"16\" height=\"300\" fill=\"#fff\" opacity=\".05\"/> <!-- ombre du bas --> <rect x=\"38\" y=\"400\" width=\"124\" height=\"50\" fill=\"#000\" opacity=\".35\"/> </g> <ellipse cx=\"100\" cy=\"151\" rx=\"62\" ry=\"9\" fill=\"#2a2a2a\"/> <ellipse cx=\"100\" cy=\"150\" rx=\"58\" ry=\"6\" fill=\"#111\"/> <!-- bonnet de Noël --> <g class=\"hat\"> <path d=\"M44 150 C 52 108, 92 86, 128 92 C 150 96, 170 112, 176 132 C 170 128, 158 120, 150 122 C 152 132, 156 142, 156 150 Z\" fill=\"url(#gHat)\"/> <path d=\"M128 92 C 150 96, 170 112, 176 132\" stroke=\"#000\" stroke-opacity=\".25\" stroke-width=\"2\" fill=\"none\"/> <rect x=\"38\" y=\"140\" width=\"124\" height=\"18\" rx=\"9\" fill=\"#efe9e1\"/> <rect x=\"38\" y=\"140\" width=\"124\" height=\"7\" rx=\"3.5\" fill=\"#fff\" opacity=\".7\"/> <circle cx=\"176\" cy=\"136\" r=\"11\" fill=\"#f4efe8\"/> <circle cx=\"173\" cy=\"132\" r=\"4\" fill=\"#fff\"/> </g> </svg>";

  // aléatoire reproductible : chaque export donne la même image
  var seed = 7;
  function rnd() { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; }

  var root = document.querySelector('.slide');
  var W = root.offsetWidth, H = root.offsetHeight;

  document.querySelectorAll('[data-bag]').forEach(function (el) { el.innerHTML = BAG; });

  // neige légère
  var snow = document.createElement('div');
  snow.className = 'snow';
  var n = Math.round(W * H / 26000);
  for (var i = 0; i < n; i++) {
    var f = document.createElement('i');
    var s = 3 + rnd() * 6;
    f.style.cssText = 'left:' + (rnd() * W) + 'px;top:' + (rnd() * H) + 'px;width:' + s + 'px;height:' + s + 'px;opacity:' + (0.25 + rnd() * 0.55).toFixed(2);
    snow.appendChild(f);
  }
  root.appendChild(snow);

  // guirlande lumineuse discrète
  var step = 90, k = Math.ceil(W / step), path = 'M0 4', bulbs = '';
  for (var j = 0; j < k; j++) {
    var x0 = j * step, bx = x0 + step / 2, col = j % 3 === 1 ? '#F08A24' : '#ffe6c2', on = rnd() > 0.25;
    path += ' Q' + bx + ' 34 ' + (x0 + step) + ' 4';
    bulbs += '<circle cx="' + bx + '" cy="28" r="15" fill="' + col + '" opacity="' + (on ? 0.2 : 0.06) + '"/>' +
      '<rect x="' + (bx - 3) + '" y="16" width="6" height="6" rx="1.5" fill="#3a3a3a"/>' +
      '<circle cx="' + bx + '" cy="28" r="6" fill="' + col + '" opacity="' + (on ? 1 : 0.45) + '"/>';
  }
  var g = document.createElement('div');
  g.className = 'garland';
  g.innerHTML = '<svg width="' + W + '" height="50" viewBox="0 0 ' + (k * step) + ' 50"><path d="' + path + '" fill="none" stroke="#2c2c2c" stroke-width="2.2"/>' + bulbs + '</svg>';
  root.appendChild(g);

  // en-tête
  var brand = document.createElement('p');
  brand.className = 'brand';
  brand.innerHTML = '<span></span>BOXE ACADÉMIE BRIVE';
  root.appendChild(brand);

  // pagination et flèche
  var page = root.dataset.page;
  if (page) {
    var pg = document.createElement('p');
    pg.className = 'page';
    pg.innerHTML = page + '<span>/' + (root.dataset.total || 5) + '</span>';
    root.appendChild(pg);
  }
  if (root.hasAttribute('data-arrow')) {
    var ar = document.createElement('p');
    ar.className = 'next';
    ar.textContent = '→';
    root.appendChild(ar);
  }
})();

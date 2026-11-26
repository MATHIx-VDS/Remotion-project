/* Le Défi du Sac de Noël — logique du jeu, des écrans, du partage et du formulaire. */
(function () {
  'use strict';

  const C = Object.assign({
    GAME_SECONDS: 15, MAX_HITS_PER_SECOND: 20, COMBO_HITS_PER_SECOND: 5, PHOTOS: [], TITLES: [],
  }, window.CONFIG || {});
  const $ = (s) => document.querySelector(s);
  const rnd = (a, b) => a + Math.random() * (b - a);
  const isSet = (v) => typeof v === 'string' && v.trim() !== '' && !/\[[^\]]*\]/.test(v);
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const store = {
    get(k, d) { try { const v = localStorage.getItem(k); return v === null ? d : JSON.parse(v); } catch (e) { return d; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* navigation privée */ } },
  };

  // Textes repris de config.js
  document.querySelectorAll('[data-cfg]').forEach((el) => {
    const v = C[el.dataset.cfg];
    if (isSet(v)) el.textContent = v;
  });

  /* =================== Ambiance =================== */
  function buildSnow() {
    if (reduced) return;
    const box = $('#snow');
    const n = window.innerWidth < 600 ? 28 : 50;
    const frag = document.createDocumentFragment();
    for (let i = 0; i < n; i++) {
      const f = document.createElement('i');
      f.className = 'flake';
      const s = rnd(2, 5.5);
      f.style.cssText = `left:${rnd(0, 100)}%;--s:${s}px;--o:${rnd(0.3, 0.8).toFixed(2)};--d:${rnd(9, 18).toFixed(1)}s;--delay:${-rnd(0, 18).toFixed(1)}s;--drift:${rnd(-40, 40).toFixed(0)}px`;
      frag.appendChild(f);
    }
    box.appendChild(frag);
  }

  function buildGarland() {
    const w = Math.max(320, window.innerWidth);
    const step = 64;
    const n = Math.ceil(w / step);
    let path = 'M0 3';
    let bulbs = '';
    for (let i = 0; i < n; i++) {
      const x0 = i * step;
      path += ` Q${x0 + step / 2} 24 ${x0 + step} 3`;
      const bx = x0 + step / 2;
      const col = i % 3 === 1 ? '#F08A24' : '#ffe6c2';
      const t = rnd(1.8, 3.4).toFixed(2);
      const d = (-rnd(0, 3)).toFixed(2);
      bulbs += `<g class="bulb" style="--t:${t}s;--delay:${d}s"><circle cx="${bx}" cy="20" r="10" fill="${col}" opacity=".18"/><rect x="${bx - 2}" y="12" width="4" height="4" rx="1" fill="#3a3a3a"/><circle cx="${bx}" cy="20" r="4" fill="${col}"/></g>`;
    }
    $('#garland').innerHTML = `<svg viewBox="0 0 ${n * step} 34" preserveAspectRatio="xMinYMin slice"><path d="${path}" fill="none" stroke="#2c2c2c" stroke-width="1.6"/>${bulbs}</svg>`;
  }

  // Photos : on ne garde que celles qui se chargent vraiment
  const photosReady = Promise.all((C.PHOTOS || []).map((src) => new Promise((res) => {
    const img = new Image();
    img.decoding = 'async';
    img.onload = () => res(src);
    img.onerror = () => res(null);
    img.src = src;
  }))).then((list) => list.filter(Boolean));

  let slideTimer = null;
  function startSlideshow(photos) {
    const box = $('#bgPhotos');
    if (!photos.length) { box.classList.add('is-empty'); return; }
    const imgs = photos.map((src) => {
      const im = document.createElement('img');
      im.className = 'bg-photo'; im.src = src; im.alt = '';
      box.appendChild(im);
      return im;
    });
    let i = 0;
    imgs[0].classList.add('is-on');
    if (imgs.length < 2) return;
    slideTimer = setInterval(() => {
      if (box.classList.contains('is-off')) return;
      imgs[i].classList.remove('is-on');
      i = (i + 1) % imgs.length;
      imgs[i].classList.add('is-on');
    }, 5500);
  }

  function buildGallery(photos) {
    const g = $('#gallery');
    if (photos.length) {
      g.innerHTML = photos.map((src, i) =>
        `<figure class="tile" style="margin:0"><img src="${src}" alt="Le club ${C.CLUB_NAME || ''}, photo ${i + 1}" loading="lazy" decoding="async"></figure>`).join('');
    } else {
      const d = [['Boxe anglaise', 'Tous niveaux'], ['Boxe française', 'Savate'], ['Thaï', 'Muay thaï'], ['MMA', 'Arts martiaux mixtes']];
      g.innerHTML = d.map(([a, b]) => `<div class="tile tile-ph"><span>${a}</span><small>${b}</small></div>`).join('');
    }
  }

  /* =================== Écrans =================== */
  const screens = ['home', 'count', 'game', 'result'];
  function show(name) {
    screens.forEach((s) => $('#screen-' + s).classList.toggle('is-active', s === name));
    $('#bgPhotos').classList.toggle('is-off', name !== 'home');
    document.body.classList.toggle('is-playing', name === 'count' || name === 'game');
    document.body.classList.toggle('on-result', name === 'result');
    if (name === 'result') $('#screen-result').scrollTop = 0;
  }

  /* =================== Son =================== */
  const muteBtn = $('#muteBtn');
  function syncMute() {
    const m = window.Sfx.isMuted();
    muteBtn.setAttribute('aria-pressed', String(m));
    muteBtn.setAttribute('aria-label', m ? 'Remettre le son' : 'Couper le son');
  }
  muteBtn.addEventListener('click', () => { window.Sfx.init(); window.Sfx.setMuted(!window.Sfx.isMuted()); syncMute(); });
  syncMute();

  /* =================== Compte à rebours =================== */
  function countdown() {
    show('count');
    const el = $('#countNum');
    const ring = $('.count-ring');
    const steps = ['3', '2', '1', 'FIGHT !'];
    let k = 0;
    const next = () => {
      const last = k === steps.length - 1;
      el.textContent = steps[k];
      el.classList.toggle('is-fight', last);
      if (last) window.Sfx.bell(1); else window.Sfx.tick(false);
      el.animate([
        { transform: 'scale(1.7)', opacity: 0 },
        { transform: 'scale(1)', opacity: 1, offset: 0.25 },
        { transform: 'scale(.94)', opacity: 1, offset: 0.8 },
        { transform: 'scale(.9)', opacity: last ? 1 : 0 },
      ], { duration: last ? 650 : 760, easing: 'cubic-bezier(.2,.9,.3,1)', fill: 'forwards' });
      ring.animate([{ transform: 'scale(.4)', opacity: 0.9 }, { transform: 'scale(1.5)', opacity: 0 }], { duration: 700, easing: 'ease-out' });
      k++;
      if (k < steps.length) setTimeout(next, 760);
      else setTimeout(startGame, 650);
    };
    next();
  }

  /* =================== Le jeu =================== */
  const stage = $('#stage');
  const rig = $('#rig');
  const bag = $('#bag');
  const bagHit = $('#bagHit');
  const fx = $('#fx');
  const hitsEl = $('#hits');
  const timeEl = $('#time');
  const timeBox = $('#timeBox');
  const WORDS = ['BAM', 'POW', 'PAF', 'BOUM'];

  const G = {
    running: false, start: 0, hits: 0, times: [], pointers: new Set(), combo: false,
    lastCounted: 0, lastOno: 0, lastWord: '', shownTime: '',
    // physique : le sac (rig) pend à sa chaîne, le corps du sac oscille un peu en plus (bag)
    th: 0, om: 0, ph: 0, phv: 0, sq: 0, raf: 0, last: 0,
  };

  function startGame() {
    Object.assign(G, { running: true, hits: 0, times: [], combo: false, lastCounted: 0, shownTime: '', th: rnd(-2, 2), om: 0, ph: 0, phv: 0, sq: 0 });
    G.pointers.clear();
    hitsEl.textContent = '0';
    timeEl.textContent = C.GAME_SECONDS.toFixed(1);
    timeBox.classList.remove('is-hurry');
    stage.classList.remove('is-combo');
    fx.textContent = '';
    show('game');
    G.start = performance.now();
    G.last = G.start;
    cancelAnimationFrame(G.raf);
    G.raf = requestAnimationFrame(frame);
  }

  function frame(now) {
    const dt = Math.min(0.033, (now - G.last) / 1000);
    G.last = now;

    // pendule (degrés) : ressort + amortissement
    const a = -26 * G.th - 1.2 * G.om;
    G.om += a * dt; G.th += G.om * dt;
    if (G.th > 15) { G.th = 15; G.om *= -0.3; }
    if (G.th < -15) { G.th = -15; G.om *= -0.3; }
    const b = -320 * G.ph - 9 * G.phv - a * 0.12;
    G.phv += b * dt; G.ph += G.phv * dt;
    G.sq *= Math.exp(-dt * 16);
    const shake = reduced ? 0 : G.sq * 4 * Math.sin(now * 0.09);
    rig.style.transform = `rotate(${G.th.toFixed(3)}deg)`;
    bag.style.transform = `translate3d(${shake.toFixed(2)}px,0,0) rotate(${G.ph.toFixed(3)}deg) scale(${(1 + 0.04 * G.sq).toFixed(4)},${(1 - 0.03 * G.sq).toFixed(4)})`;

    if (G.running) {
      while (G.times.length && G.times[0] < now - 1000) G.times.shift();
      const rate = G.times.length;
      if (!G.combo && rate > C.COMBO_HITS_PER_SECOND) setCombo(true);
      else if (G.combo && rate < C.COMBO_HITS_PER_SECOND) setCombo(false);

      const left = Math.max(0, C.GAME_SECONDS - (now - G.start) / 1000);
      const txt = left.toFixed(1);
      if (txt !== G.shownTime) {
        G.shownTime = txt;
        timeEl.textContent = txt;
        if (left <= 3) timeBox.classList.add('is-hurry');
      }
      if (left <= 0) endGame();
    }

    const moving = Math.abs(G.th) + Math.abs(G.om) + Math.abs(G.ph) + Math.abs(G.phv) > 0.02;
    if (G.running || ($('#screen-game').classList.contains('is-active') && moving)) G.raf = requestAnimationFrame(frame);
  }

  function setCombo(on) {
    G.combo = on;
    stage.classList.toggle('is-combo', on);
    if (on) window.Sfx.combo();
  }

  /** Un coup : x, y en pixels dans la scène ; side = -1 frappé par la gauche, +1 par la droite. */
  function hit(x, y, side, rect) {
    const now = performance.now();
    // anti-triche : au plus 20 coups comptés par seconde, et 25 ms minimum entre deux coups
    while (G.times.length && G.times[0] < now - 1000) G.times.shift();
    if (G.times.length >= C.MAX_HITS_PER_SECOND || now - G.lastCounted < 25) return;
    G.times.push(now);
    G.lastCounted = now;
    G.hits++;

    hitsEl.textContent = String(G.hits);
    hitsEl.animate([{ transform: 'scale(1.35)' }, { transform: 'scale(1)' }], { duration: 160, easing: 'ease-out' });

    // le sac part du côté opposé à l'impact ; plus on tape bas, plus il bouge
    const low = rect ? Math.min(1.4, Math.max(0.6, (y - rect.top) / rect.height + 0.4)) : 1;
    const push = rnd(24, 34) * low * (G.combo ? 1.15 : 1);
    G.om += side * push;
    G.phv -= side * push * 2.6;
    G.sq = 1;

    window.Sfx.punch(G.combo ? 1.15 : 1);
    if (navigator.vibrate) { try { navigator.vibrate(G.combo ? 18 : 10); } catch (e) { /* rien */ } }

    spawnRing(x, y);
    if (now - G.lastOno > 90) { spawnOno(x, y); G.lastOno = now; }
    if (G.combo) spawnSparks(x, y);
  }

  function addFx(el) {
    while (fx.childElementCount > 40) fx.firstChild.remove();
    fx.appendChild(el);
    return el;
  }

  function spawnOno(x, y) {
    let w;
    do { w = WORDS[Math.floor(Math.random() * WORDS.length)]; } while (w === G.lastWord);
    G.lastWord = w;
    const el = document.createElement('span');
    el.className = 'ono' + (G.combo ? ' is-hot' : '');
    el.textContent = w;
    addFx(el);
    const r = rnd(-16, 16);
    const dx = rnd(-36, 36);
    const dy = -rnd(50, 95);
    const at = (px, py, s, o) => ({ transform: `translate(${px}px,${py}px) translate(-50%,-50%) rotate(${r}deg) scale(${s})`, opacity: o });
    el.animate([
      at(x, y, 0.3, 0),
      Object.assign(at(x + dx * 0.15, y + dy * 0.15, 1.18, 1), { offset: 0.16 }),
      Object.assign(at(x + dx * 0.5, y + dy * 0.5, 1, 1), { offset: 0.55 }),
      at(x + dx, y + dy, 0.92, 0),
    ], { duration: 680, easing: 'cubic-bezier(.2,.8,.3,1)' }).onfinish = () => el.remove();
  }

  function spawnRing(x, y) {
    const el = addFx(document.createElement('span'));
    el.className = 'ring';
    el.animate([
      { transform: `translate(${x}px,${y}px) scale(.2)`, opacity: 0.95 },
      { transform: `translate(${x}px,${y}px) scale(1.5)`, opacity: 0 },
    ], { duration: 320, easing: 'ease-out' }).onfinish = () => el.remove();
  }

  function spawnSparks(x, y) {
    const n = reduced ? 3 : 7;
    for (let i = 0; i < n; i++) {
      const el = addFx(document.createElement('span'));
      el.className = 'spark';
      const ang = rnd(0, Math.PI * 2);
      const dist = rnd(45, 120);
      const tx = x + Math.cos(ang) * dist;
      const ty = y + Math.sin(ang) * dist + 30;
      const deg = (ang * 180) / Math.PI + 90;
      el.animate([
        { transform: `translate(${x}px,${y}px) rotate(${deg}deg) scale(1)`, opacity: 1 },
        { transform: `translate(${tx}px,${ty}px) rotate(${deg}deg) scale(.3)`, opacity: 0 },
      ], { duration: rnd(320, 520), easing: 'cubic-bezier(.1,.7,.3,1)' }).onfinish = () => el.remove();
    }
  }

  // Tactile / souris
  stage.addEventListener('pointerdown', (e) => {
    if (!G.running || !e.isTrusted) return;
    e.preventDefault();
    G.pointers.add(e.pointerId);
    if (G.pointers.size > 1) return; // plusieurs doigts en même temps : ignoré
    if (!e.target.closest || !e.target.closest('#bagHit')) return; // à côté du sac
    const s = stage.getBoundingClientRect();
    const b = bagHit.getBoundingClientRect();
    const x = e.clientX - s.left;
    const y = e.clientY - s.top;
    hit(x, y, e.clientX < b.left + b.width / 2 ? -1 : 1, { top: b.top - s.top, height: b.height });
  }, { passive: false });
  const release = (e) => G.pointers.delete(e.pointerId);
  ['pointerup', 'pointercancel', 'pointerleave'].forEach((t) => stage.addEventListener(t, release));
  stage.addEventListener('contextmenu', (e) => e.preventDefault());

  // Clavier : barre espace (la touche maintenue ne compte pas)
  document.addEventListener('keydown', (e) => {
    const playing = document.body.classList.contains('is-playing');
    if (!playing || (e.code !== 'Space' && e.key !== ' ')) return;
    e.preventDefault();
    if (!G.running || e.repeat || !e.isTrusted) return;
    const s = stage.getBoundingClientRect();
    const b = bagHit.getBoundingClientRect();
    const side = Math.random() < 0.5 ? -1 : 1;
    const x = b.left - s.left + b.width * (0.5 - side * rnd(0.12, 0.3));
    const y = b.top - s.top + b.height * rnd(0.3, 0.7);
    hit(x, y, side, { top: b.top - s.top, height: b.height });
  });

  function endGame() {
    G.running = false;
    setCombo(false);
    window.Sfx.bell(3);
    $('#srStatus').textContent = `Temps écoulé : ${G.hits} coups.`;
    const stop = addFx(document.createElement('span'));
    stop.className = 'ono';
    stop.textContent = 'STOP !';
    stop.style.fontSize = '84px';
    const r = stage.getBoundingClientRect();
    const at = (s, o) => ({ transform: `translate(${r.width / 2}px,${r.height * 0.42}px) translate(-50%,-50%) rotate(-6deg) scale(${s})`, opacity: o });
    stop.animate([at(2, 0), Object.assign(at(1, 1), { offset: 0.2 }), at(1, 1)], { duration: 1100, easing: 'cubic-bezier(.2,.9,.3,1)', fill: 'forwards' });
    setTimeout(() => showResult(G.hits), 1150);
  }

  /* =================== Résultat =================== */
  let lastScore = 0;
  function titleFor(score) {
    const t = (C.TITLES || []).find((x) => score >= x.min);
    return t ? t.title : '';
  }

  function showResult(score) {
    lastScore = score;
    const prevBest = store.get('bab-noel-best', 0);
    const best = Math.max(prevBest, score);
    store.set('bab-noel-best', best);
    const title = titleFor(score);

    $('#fScore').value = String(score);
    $('#fBest').value = String(best);
    $('#fTitle').value = title;

    const num = $('#scoreNum');
    const rank = $('#scoreTitle');
    rank.textContent = title;
    rank.style.opacity = '0';
    num.textContent = '0';
    $('#bestLine').innerHTML = score > prevBest && prevBest > 0
      ? '<b>Nouveau record !</b>'
      : (prevBest > 0 ? `Ton record : <b>${best}</b> coups` : '');
    show('result');
    setupDrawCard();

    const t0 = performance.now();
    const dur = reduced ? 1 : Math.min(1300, 400 + score * 12);
    const step = (now) => {
      const k = Math.min(1, (now - t0) / dur);
      num.textContent = String(Math.round(score * (1 - Math.pow(1 - k, 3))));
      if (k < 1) requestAnimationFrame(step);
      else {
        window.Sfx.punch(1.2);
        rank.animate([
          { transform: 'scale(1.8) rotate(-4deg)', opacity: 0 },
          { transform: 'scale(1) rotate(-2deg)', opacity: 1 },
        ], { duration: 360, easing: 'cubic-bezier(.2,.9,.3,1.2)', fill: 'forwards' });
      }
    };
    requestAnimationFrame(step);
    updateHomeBest();
  }

  function updateHomeBest() {
    const best = store.get('bab-noel-best', 0);
    const el = $('#homeBest');
    if (best > 0) { el.hidden = false; el.innerHTML = `Ton record : <b>${best}</b> coups`; }
  }

  $('#startBtn').addEventListener('click', () => { window.Sfx.init(); countdown(); });
  $('#replayBtn').addEventListener('click', () => { window.Sfx.init(); countdown(); });

  /* =================== Partage =================== */
  function siteUrl() {
    if (isSet(C.SITE_URL)) return C.SITE_URL;
    return location.origin + location.pathname.replace(/index\.html$/, '');
  }

  function toast(msg) {
    const t = $('#toast');
    t.textContent = msg;
    t.classList.add('is-on');
    clearTimeout(toast.timer);
    toast.timer = setTimeout(() => t.classList.remove('is-on'), 2600);
  }

  $('#shareBtn').addEventListener('click', async () => {
    const text = (C.SHARE_TEXT || '{score} coups ! {lien}').replace('{score}', lastScore).replace('{lien}', siteUrl());
    if (navigator.share) {
      try { await navigator.share({ text }); return; } catch (e) { if (e && e.name === 'AbortError') return; }
    }
    try {
      await navigator.clipboard.writeText(text);
      toast('Message copié ! Colle-le où tu veux.');
    } catch (e) {
      const dlg = $('#shareDialog');
      $('#shareText').value = text;
      if (dlg.showModal) { dlg.showModal(); $('#shareText').select(); } else { window.prompt('Copie ce message :', text); }
    }
  });

  /* =================== Tirage au sort (Netlify Forms) =================== */
  const form = $('#drawForm');
  const msg = $('#formMsg');
  const EMAILS_KEY = 'bab-noel-emails';
  const closed = () => {
    const end = Date.parse(C.END_DATETIME || '');
    return !isNaN(end) && Date.now() > end;
  };
  // avant la date de début (heure de Paris) : le formulaire n'est pas encore ouvert
  const notStarted = () => {
    const start = Date.parse((C.START_DATE || '') + 'T00:00:00+01:00');
    return !isNaN(start) && Date.now() < start;
  };

  function setupDrawCard() {
    const isClosed = closed() || notStarted();
    if (notStarted()) {
      const d = new Date(C.START_DATE + 'T12:00:00').toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' });
      $('#drawClosed').innerHTML = `<p class="done-big">Bientôt !</p><p>Les participations ouvrent le ${d}.</p>`;
    }
    const done = store.get(EMAILS_KEY, []).length > 0 && !form.dataset.another;
    form.hidden = isClosed || done;
    $('#drawSub').hidden = isClosed;
    $('#drawDone').hidden = isClosed || !done;
    $('#drawClosed').hidden = !isClosed;
  }

  form.addEventListener('input', (e) => { e.target.removeAttribute('aria-invalid'); msg.textContent = ''; });

  $('#anotherBtn').addEventListener('click', () => {
    form.dataset.another = '1';
    form.reset();
    setupDrawCard();
    $('#fFirst').focus();
  });

  function invalid(el, text) {
    el.setAttribute('aria-invalid', 'true');
    msg.textContent = text;
    el.focus();
    return false;
  }

  function validate() {
    form.querySelectorAll('[aria-invalid]').forEach((el) => el.removeAttribute('aria-invalid'));
    msg.textContent = '';
    const first = $('#fFirst'); const last = $('#fLast'); const email = $('#fEmail'); const phone = $('#fPhone');
    if (!first.value.trim()) return invalid(first, 'Indique ton prénom.');
    if (!last.value.trim()) return invalid(last, 'Indique ton nom.');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.value.trim())) return invalid(email, 'Ton e-mail ne semble pas valide.');
    if (phone.value.trim() && !/^[+0-9 ().-]{6,20}$/.test(phone.value.trim())) return invalid(phone, 'Ton numéro de téléphone ne semble pas valide.');
    if (!$('#fRules').checked) return invalid($('#fRules'), 'Tu dois accepter le règlement pour participer.');
    return true;
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (closed() || notStarted()) { setupDrawCard(); return; }
    if (!validate()) return;
    const email = $('#fEmail').value.trim().toLowerCase();
    const known = store.get(EMAILS_KEY, []);
    if (known.includes(email)) {
      invalid($('#fEmail'), 'Cet e-mail participe déjà au tirage : une seule participation par personne.');
      return;
    }
    const btn = $('#submitBtn');
    btn.disabled = true;
    btn.textContent = 'Envoi…';
    const data = new FormData(form);
    data.set('email', email);
    ['prenom', 'nom', 'telephone'].forEach((k) => data.set(k, String(data.get(k) || '').trim()));
    try {
      const res = await fetch('/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams(data).toString(),
      });
      if (!res.ok) throw new Error('HTTP ' + res.status);
      known.push(email);
      store.set(EMAILS_KEY, known);
      delete form.dataset.another;
      form.reset();
      setupDrawCard();
      $('#drawDone').animate([{ transform: 'scale(.9)', opacity: 0 }, { transform: 'scale(1)', opacity: 1 }], { duration: 300, easing: 'ease-out' });
      window.Sfx.bell(1);
    } catch (err) {
      msg.textContent = 'Oups, l\'envoi n\'a pas marché. Vérifie ta connexion et réessaie.';
    } finally {
      btn.disabled = false;
      btn.textContent = 'Je tente ma chance';
    }
  });

  /* =================== Boutique =================== */
  if (isSet(C.SHOP_URL)) {
    const shop = $('#shopBtn');
    shop.href = C.SHOP_URL;
    shop.hidden = false;
  }

  /* =================== Démarrage =================== */
  buildSnow();
  buildGarland();
  let rz;
  window.addEventListener('resize', () => { clearTimeout(rz); rz = setTimeout(buildGarland, 200); });
  photosReady.then((p) => { startSlideshow(p); buildGallery(p); });
  updateHomeBest();

  const missing = ['SHOP_URL', 'CLUB_EMAIL', 'CLUB_ADDRESS', 'CLUB_STATUS', 'PRIZE_VALUE'].filter((k) => !isSet(C[k]));
  if (missing.length) console.info('[Défi du Sac] À compléter dans config.js :', missing.join(', '));
})();

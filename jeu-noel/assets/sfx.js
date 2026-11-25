/* Sons du jeu, synthétisés avec la Web Audio API (aucun fichier audio à charger). */
(function () {
  'use strict';
  const KEY = 'bab-noel-muted';
  let ctx = null;
  let master = null;
  let noise = null;
  let muted = false;
  try { muted = localStorage.getItem(KEY) === '1'; } catch (e) { /* navigation privée */ }

  function init() {
    if (ctx) { if (ctx.state === 'suspended') ctx.resume(); return; }
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    // iPhone : jouer le son même quand le bouton silencieux est activé (le bouton du jeu reste là pour couper)
    try { if (navigator.audioSession) navigator.audioSession.type = 'playback'; } catch (e) { /* non pris en charge */ }
    ctx = new AC();
    const comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -14; comp.knee.value = 10; comp.ratio.value = 6;
    comp.attack.value = 0.002; comp.release.value = 0.12;
    master = ctx.createGain();
    master.gain.value = muted ? 0 : 0.9;
    master.connect(comp).connect(ctx.destination);
    // 1 s de bruit blanc, réutilisé par tous les sons
    noise = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
    const d = noise.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    if (ctx.state === 'suspended') ctx.resume();
  }

  const ready = () => ctx && master && ctx.state !== 'closed';
  const rnd = (a, b) => a + Math.random() * (b - a);

  function env(g, t, peak, decay, attack = 0.003) {
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(peak, t + attack);
    g.gain.exponentialRampToValueAtTime(0.0001, t + attack + decay);
  }

  function noiseSrc(t, dur) {
    const s = ctx.createBufferSource();
    s.buffer = noise;
    s.start(t, Math.random() * 0.5, dur);
    return s;
  }

  /** Coup dans le sac : le « boum » grave du cuir + le claquement du gant. */
  function punch(power = 1) {
    if (!ready() || muted) return;
    const t = ctx.currentTime + 0.001;
    const p = Math.min(1.3, power);
    // corps grave
    const o = ctx.createOscillator();
    const og = ctx.createGain();
    const f0 = rnd(125, 165);
    o.frequency.setValueAtTime(f0, t);
    o.frequency.exponentialRampToValueAtTime(f0 * 0.34, t + 0.13);
    env(og, t, 0.85 * p, 0.17);
    o.connect(og).connect(master);
    o.start(t); o.stop(t + 0.22);
    // cuir étouffé
    const n = noiseSrc(t, 0.14);
    const lp = ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.setValueAtTime(rnd(1100, 1600), t);
    lp.frequency.exponentialRampToValueAtTime(260, t + 0.1);
    const ng = ctx.createGain();
    env(ng, t, 0.7 * p, 0.1, 0.002);
    n.connect(lp).connect(ng).connect(master);
    // claquement du gant
    const s = noiseSrc(t, 0.05);
    const hp = ctx.createBiquadFilter();
    hp.type = 'highpass'; hp.frequency.value = rnd(1800, 2800);
    const sg = ctx.createGain();
    env(sg, t, 0.32 * p, 0.03, 0.001);
    s.connect(hp).connect(sg).connect(master);
  }

  /** Cloche du ring : partiels inharmoniques, longue résonance. */
  function bell(strikes = 1, gap = 0.34) {
    if (!ready() || muted) return;
    const partials = [[1, 1], [2.0, 0.45], [2.76, 0.55], [4.07, 0.28], [5.4, 0.2], [6.8, 0.1]];
    for (let k = 0; k < strikes; k++) {
      const t = ctx.currentTime + 0.01 + k * gap;
      const f0 = 690;
      partials.forEach(([r, a]) => {
        const o = ctx.createOscillator();
        const g = ctx.createGain();
        o.type = 'sine';
        o.frequency.value = f0 * r * rnd(0.998, 1.002);
        env(g, t, 0.22 * a, (strikes > 1 && k < strikes - 1 ? 0.9 : 2.2) / Math.sqrt(r), 0.002);
        o.connect(g).connect(master);
        o.start(t); o.stop(t + 2.4);
      });
      // le marteau
      const n = noiseSrc(t, 0.03);
      const hp = ctx.createBiquadFilter();
      hp.type = 'bandpass'; hp.frequency.value = 3200; hp.Q.value = 1.2;
      const g = ctx.createGain();
      env(g, t, 0.35, 0.025, 0.001);
      n.connect(hp).connect(g).connect(master);
    }
  }

  /** Bip du compte à rebours. */
  function tick(high = false) {
    if (!ready() || muted) return;
    const t = ctx.currentTime + 0.005;
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = 'triangle';
    o.frequency.value = high ? 880 : 520;
    env(g, t, 0.28, 0.16);
    o.connect(g).connect(master);
    o.start(t); o.stop(t + 0.2);
  }

  /** Montée en combo : souffle qui monte. */
  function combo() {
    if (!ready() || muted) return;
    const t = ctx.currentTime + 0.005;
    const n = noiseSrc(t, 0.4);
    const bp = ctx.createBiquadFilter();
    bp.type = 'bandpass'; bp.Q.value = 2.5;
    bp.frequency.setValueAtTime(400, t);
    bp.frequency.exponentialRampToValueAtTime(3200, t + 0.32);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.4, t + 0.25);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.38);
    n.connect(bp).connect(g).connect(master);
  }

  function setMuted(m) {
    muted = !!m;
    try { localStorage.setItem(KEY, muted ? '1' : '0'); } catch (e) { /* rien */ }
    if (master) master.gain.setTargetAtTime(muted ? 0 : 0.9, ctx.currentTime, 0.02);
  }

  window.Sfx = { init, punch, bell, tick, combo, setMuted, isMuted: () => muted };
})();

    // Outils communs (injectés par tools/build.mjs)
    const T = (id, f = 0) => L[id].s + f * (L[id].e - L[id].s);
    const W = (id, kw) => { const t = L[id].t, i = t.indexOf(kw); return T(id, i < 0 ? 0 : i / t.length); };
    const LAST = Math.max(...Object.values(L).map((x) => x.e));
    const tl = gsap.timeline({ paused: true });
    const IN = (sel, at, from = { y: 30 }, d = 0.5, ease = "back.out(1.5)") =>
      tl.fromTo(sel, { opacity: 0, ...from }, { opacity: 1, x: 0, y: 0, scale: 1, rotation: 0, duration: d, ease }, at);
    const OUT = (sel, at, d = 0.3) => tl.to(sel, { opacity: 0, duration: d, ease: "power2.in" }, at);
    const fr = (n, dec = 0) => n.toLocaleString("fr-FR", { minimumFractionDigits: dec, maximumFractionDigits: dec }).replace(/ | /g, " ");
    const count = (sel, from, to, at, d, fmt) => {
      const o = { v: from };
      tl.fromTo(o, { v: from }, { v: to, duration: d, ease: "power2.out", onUpdate: () => { document.querySelector(sel).textContent = fmt(o.v); } }, at);
    };
    // décor qui défile doucement
    const drift = (p) => {
      if (document.querySelector("#" + p + "-far")) tl.fromTo(`#${p}-far`, { x: 0 }, { x: -50, duration: D, ease: "none" }, 0);
      if (document.querySelector("#" + p + "-mid")) tl.fromTo(`#${p}-mid`, { x: 0 }, { x: -110, duration: D, ease: "none" }, 0);
    };
    // carton « MISSION X » avec bandes noires
    const missionCard = (p) => {
      tl.fromTo(`#${p}-lt`, { yPercent: -100 }, { yPercent: 0, duration: 0.35, ease: "power3.out" }, 0);
      tl.fromTo(`#${p}-lb`, { yPercent: 100 }, { yPercent: 0, duration: 0.35, ease: "power3.out" }, 0);
      tl.fromTo(`#${p}-cd`, { opacity: 1 }, { opacity: 1, duration: 0.01 }, 0);
      tl.fromTo(`#${p}-mk`, { opacity: 0, x: -90 }, { opacity: 1, x: 0, duration: 0.4, ease: "power3.out" }, 0.15);
      tl.fromTo(`#${p}-mt`, { opacity: 0, scale: 1.5 }, { opacity: 1, scale: 1, duration: 0.32, ease: "power4.out" }, 0.3);
      tl.fromTo(`#${p}-mb`, { scaleX: 0 }, { scaleX: 1, duration: 0.6, ease: "power2.out" }, 0.45);
      tl.to(`#${p}-cm`, { opacity: 0, y: -20, duration: 0.3, ease: "power2.in" }, 1.95);
      tl.to(`#${p}-cd`, { opacity: 0, duration: 0.4, ease: "power2.inOut" }, 2.0);
      tl.to(`#${p}-lt`, { yPercent: -100, duration: 0.4, ease: "power2.inOut" }, 2.0);
      tl.to(`#${p}-lb`, { yPercent: 100, duration: 0.4, ease: "power2.inOut" }, 2.0);
    };
    // « MISSION ACCOMPLIE » après la dernière réplique, puis fondu au noir
    const missionDone = (p, hide = []) => {
      const at = LAST + 0.15;
      if (hide.length) OUT(hide, at, 0.25);
      tl.fromTo(`#${p}-df`, { opacity: 0 }, { opacity: 1, duration: 0.25 }, at);
      tl.fromTo(`#${p}-dt`, { opacity: 0, scale: 1.7 }, { opacity: 1, scale: 1, duration: 0.3, ease: "power4.out" }, at + 0.05);
      tl.fromTo(`#${p}-ds`, { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.35, ease: "power2.out" }, at + 0.35);
    };
    const sceneEnd = (p) => {
      tl.to(`#${p}-stage`, { opacity: 0, duration: 0.3, ease: "power2.in" }, D - 0.32);
      tl.set({}, {}, D);
    };

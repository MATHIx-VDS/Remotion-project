// Construit le montage à partir de script.json et des enregistrements de assets/voix/.
//  - Normalise chaque enregistrement trouvé (assets/voix/<id>.<ext>) vers assets/voix-mix/<id>.wav
//  - Sans enregistrement, estime la durée de la réplique (vidéo de travail muette)
//  - Place chaque réplique dans sa scène, en tenant le total sous 5:00 si possible
//  - Écrit timings.json, met à jour la ligne « // @cues » de chaque composition,
//    injecte le kit graphique commun (tools/kit.css) et les décors (monde),
//    et régénère index.html + compositions/captions.html
// Usage : node tools/build.mjs
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const P = (...a) => path.join(ROOT, ...a);
const script = JSON.parse(fs.readFileSync(P("script.json"), "utf8"));
const EXTS = ["wav", "mp3", "m4a", "aac", "ogg", "opus", "webm", "flac", "mp4", "mov", "3gp", "amr", "caf"];
const BUDGET = 300;

fs.mkdirSync(P("assets/voix-mix"), { recursive: true });

const words = (t) => t.split(/\s+/).filter(Boolean);
const probe = (f) =>
  parseFloat(execFileSync("ffprobe", ["-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", f]).toString());

function prepareAudio(id) {
  const src = EXTS.flatMap((e) => [e, e.toUpperCase()])
    .map((e) => P("assets/voix", `${id}.${e}`))
    .find((f) => fs.existsSync(f));
  if (!src) return null;
  const out = P("assets/voix-mix", `${id}.wav`);
  const fresh = fs.existsSync(out) && fs.statSync(out).mtimeMs > fs.statSync(src).mtimeMs;
  if (!fresh) {
    // coupe les silences de début et de fin, filtre les graves parasites, normalise à -16 LUFS
    const trim = "silenceremove=start_periods=1:start_threshold=-45dB:start_silence=0.08";
    const af = ["highpass=f=80", trim, "areverse", trim, "areverse", "loudnorm=I=-16:TP=-1.5:LRA=11"].join(",");
    execFileSync("ffmpeg", ["-y", "-v", "error", "-i", src, "-vn", "-ac", "1", "-ar", "48000", "-af", af, out]);
  }
  return { file: `assets/voix-mix/${id}.wav`, dur: probe(out) };
}

// ---------- placement des répliques
const GAP = 0.4;
const leadOf = (id) => (id === "s1" ? 2.6 : 2.4); // écran de chargement / carton de mission
const tailOf = (id) => (id === "s7" ? 6 : 1.8); // « mission accomplie » / générique
const report = [];
const prepared = script.scenes.map((sc) => {
  const lines = sc.lines.map((l) => {
    const a = prepareAudio(l.id);
    const dur = a ? a.dur : Math.max(1.4, words(l.text).length / 2.6);
    report.push(`${l.id.padEnd(3)} ${a ? "voix  " : "estimé"} ${dur.toFixed(2)} s`);
    return { ...l, audio: a?.file ?? null, dur };
  });
  const lead = leadOf(sc.id), tail = tailOf(sc.id);
  const needed = lead + tail + lines.reduce((s, l) => s + l.dur, 0) + GAP * (lines.length - 1);
  return { ...sc, lines, lead, tail, needed, D: Math.max(sc.planned, needed) };
});
// si le total dépasse 5:00, on retire d'abord le « mou » prévu dans les scènes
let over = prepared.reduce((s, sc) => s + sc.D, 0) - BUDGET;
if (over > 0) {
  const slackTotal = prepared.reduce((s, sc) => s + (sc.D - sc.needed), 0);
  if (slackTotal > 0) {
    const k = Math.min(1, over / slackTotal);
    for (const sc of prepared) sc.D -= (sc.D - sc.needed) * k;
  }
}
let cursor = 0;
const scenes = prepared.map((sc) => {
  const slack = (sc.D - sc.needed) / (sc.lines.length + 1);
  let t = sc.lead + slack;
  const L = {};
  for (const l of sc.lines) {
    l.start = t;
    l.end = t + l.dur;
    L[l.id] = { s: +l.start.toFixed(3), e: +l.end.toFixed(3), t: l.text };
    t = l.end + GAP + slack;
  }
  const out = { ...sc, D: +sc.D.toFixed(3), start: +cursor.toFixed(3), L };
  cursor += sc.D;
  return out;
});
const TOTAL = +cursor.toFixed(3);

// ---------- décors (monde du jeu)
function rng(seed) {
  let s = seed >>> 0;
  return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);
}
function pines(r, n, y0, y1, x0, x1, fill, hmin, hmax) {
  let d = "";
  for (let i = 0; i < n; i++) {
    const x = x0 + r() * (x1 - x0), y = y0 + r() * (y1 - y0), h = hmin + r() * (hmax - hmin), w = h * 0.32;
    d += `M${x.toFixed(0)} ${y.toFixed(0)}l${(w / 2).toFixed(0)} ${(-h).toFixed(0)}l${(w / 2).toFixed(0)} ${h.toFixed(0)}z`;
  }
  return `<path d="${d}" fill="${fill}"/>`;
}
function world(p, variant) {
  const night = variant === "night";
  const r = rng(night ? 7 : 3);
  const sky = night
    ? [["0", "#05081A"], [".45", "#121A44"], [".7", "#2B2E63"], [".82", "#4A3C72"]]
    : [["0", "#1E1540"], [".4", "#6E356E"], [".6", "#E06A4E"], [".74", "#FFBE6A"]];
  const c = night
    ? { far: "#22264F", mid: "#171A3A", near: "#0C0E22", road: "#1A1B30", pine1: "#1C2046", pine2: "#10132C" }
    : { far: "#8A4475", mid: "#55285A", near: "#2A1431", road: "#3A2440", pine1: "#4A2252", pine2: "#2E1636" };
  let stars = "";
  if (night) for (let i = 0; i < 90; i++) stars += `<circle cx="${(r() * 1920).toFixed(0)}" cy="${(r() * 560).toFixed(0)}" r="${(0.8 + r() * 1.8).toFixed(1)}" fill="#fff" opacity="${(0.3 + r() * 0.7).toFixed(2)}"/>`;
  return `<div class="world" id="${p}-world">
      <svg viewBox="0 0 1920 1080" preserveAspectRatio="xMidYMid slice">
        <defs>
          <linearGradient id="${p}-sky" x1="0" y1="0" x2="0" y2="1">${sky.map(([o, s]) => `<stop offset="${o}" stop-color="${s}"/>`).join("")}</linearGradient>
          <radialGradient id="${p}-sun"><stop offset="0" stop-color="${night ? "#F4F1FF" : "#FFF3C9"}"/><stop offset=".35" stop-color="${night ? "#C9C6F2" : "#FFD27A"}" stop-opacity=".85"/><stop offset="1" stop-color="${night ? "#8C88D0" : "#FFA24F"}" stop-opacity="0"/></radialGradient>
        </defs>
        <rect width="1920" height="1080" fill="url(#${p}-sky)"/>
        ${stars}
        <circle cx="${night ? 1660 : 1380}" cy="${night ? 340 : 650}" r="${night ? 120 : 280}" fill="url(#${p}-sun)"/>
        ${night ? `<circle cx="1660" cy="340" r="46" fill="#ECEAFF"/>` : ""}
        <g id="${p}-far"><path d="M-240 700 C-40 620 180 660 380 610 S 760 560 980 625 S 1420 600 1640 555 S 2000 610 2160 590 L2160 1080 L-240 1080Z" fill="${c.far}"/></g>
        <g id="${p}-mid"><path d="M-240 790 C 60 705 300 765 600 722 S 1020 690 1320 742 S 1760 700 2160 762 L2160 1080 L-240 1080Z" fill="${c.mid}"/>
          ${pines(r, 70, 735, 800, -200, 2120, c.pine1, 40, 90)}</g>
        <g id="${p}-near"><path d="M-240 868 C 260 832 700 852 960 846 S 1640 834 2160 866 L2160 1080 L-240 1080Z" fill="${c.near}"/>
          <path d="M915 848 L1005 848 L1560 1080 L360 1080Z" fill="${c.road}"/>
          <path d="M960 852 L960 1080" stroke="#FFD23F" stroke-width="10" stroke-dasharray="26 30" opacity=".8"/>
          ${pines(r, 26, 880, 1060, -200, 380, c.pine2, 90, 170)}${pines(r, 26, 880, 1060, 1560, 2120, c.pine2, 90, 170)}</g>
      </svg>
    </div>`;
}

const kit = fs.readFileSync(P("tools/kit.css"), "utf8").trim();
const kitjs = fs.readFileSync(P("tools/kit.js"), "utf8").trim();
for (const sc of scenes) {
  const f = P("compositions", `${sc.id}.html`);
  if (!fs.existsSync(f)) continue;
  let src = fs.readFileSync(f, "utf8");
  src = src.replace(/^.*\/\/ @cues$/m, () => `    const D = ${sc.D}, L = ${JSON.stringify(sc.L)}; // @cues`);
  src = src.replace(/\/\* @kit \*\/[\s\S]*?\/\* @\/kit \*\//, () => `/* @kit */\n${kit}\n    /* @/kit */`);
  src = src.replace(/\/\* @kitjs \*\/[\s\S]*?\/\* @\/kitjs \*\//, () => `/* @kitjs */\n    ${kitjs}\n    /* @/kitjs */`);
  src = src.replace(/<!-- @credits -->[\s\S]*?<!-- @\/credits -->/, () => {
    const names = Object.values(script.speakers).map((s) => `<span style="color:${s.color}">${s.name}</span>`).join("");
    const cr = script.credits;
    return `<!-- @credits -->\n        <div class="h">Une revue de compte réalisée par</div>\n        <div class="n ol2">${names}</div>\n        <div class="s">${cr.school} · ${cr.course}</div>\n        <!-- @/credits -->`;
  });
  src = src.replace(/<!-- @world:(\w+) -->[\s\S]*?<!-- @\/world -->/, (_, v) => `<!-- @world:${v} -->\n    ${world(sc.id, v)}\n    <!-- @/world -->`);
  fs.writeFileSync(f, src);
}

// ---------- HUD (mini-carte, horloge, argent) : reçoit les temps absolus
{
  const f = P("compositions/hud.html");
  if (fs.existsSync(f)) {
    const S = Object.fromEntries(scenes.map((s) => [s.id, { s: s.start, d: s.D }]));
    const A = Object.fromEntries(scenes.flatMap((s) => s.lines.map((l) => [l.id, [+(s.start + l.start).toFixed(3), +(s.start + l.end).toFixed(3)]])));
    let src = fs.readFileSync(f, "utf8");
    src = src.replace(/^.*\/\/ @cues$/m, () => `    const D = ${TOTAL}, S = ${JSON.stringify(S)}, A = ${JSON.stringify(A)}; // @cues`);
    fs.writeFileSync(f, src);
  }
}

// ---------- sous-titres (style sous-titres de jeu)
function groupsOf(line) {
  const ws = words(line.text);
  const groups = [];
  let cur = [];
  for (const w of ws) {
    cur.push(w);
    const punct = /[,:;.?!…]$/.test(w);
    if (cur.length >= 9 || (punct && cur.length >= 4)) {
      groups.push(cur);
      cur = [];
    }
  }
  if (cur.length) {
    if (cur.length <= 2 && groups.length) groups[groups.length - 1].push(...cur);
    else groups.push(cur);
  }
  const total = line.text.length;
  let acc = 0;
  return groups.map((g) => {
    const txt = g.join(" ");
    const s = line.start + (acc / total) * line.dur;
    acc += txt.length + 1;
    return { txt, s };
  });
}
const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const capItems = [];
for (const sc of scenes) {
  for (const l of sc.lines) {
    const gs = groupsOf(l);
    gs.forEach((g, i) => {
      const next = gs[i + 1];
      capItems.push({ id: `cap-${l.id}-${i}`, txt: g.txt, s: sc.start + g.s, e: sc.start + (next ? next.s : l.end + 0.2), spk: l.speaker });
    });
  }
}
const spk = script.speakers;
fs.writeFileSync(
  P("compositions/captions.html"),
  `<template>
  <style>
    #root { position: absolute; inset: 0; pointer-events: none; }
    .cap { position: absolute; left: 0; right: 0; bottom: 46px; text-align: center; opacity: 0; visibility: hidden; }
    .cap-in { display: inline-block; max-width: 1120px; font-family: "Inter", sans-serif; font-weight: 700; font-size: 40px; line-height: 1.18;
      color: #FFFFFF; text-shadow: -2px -2px 0 #000, 2px -2px 0 #000, -2px 2px 0 #000, 2px 2px 0 #000, 0 3px 0 #000, 0 -3px 0 #000, 3px 0 0 #000, -3px 0 0 #000, 0 6px 14px rgba(0,0,0,.6); }
    .cap-who { font-weight: 900; text-transform: uppercase; letter-spacing: .03em; margin-right: 12px; }
  </style>
  <div id="root" data-composition-id="captions" data-width="1920" data-height="1080">
${capItems
  .map((c) => `    <div id="${c.id}" class="cap"><span class="cap-in"><span class="cap-who" style="color:${spk[c.spk].color}">${esc(spk[c.spk].name)} :</span>${esc(c.txt)}</span></div>`)
  .join("\n")}
  </div>
  <script>
    const tl = gsap.timeline({ paused: true });
    const C = ${JSON.stringify(capItems.map((c) => [c.id, +c.s.toFixed(3), +c.e.toFixed(3)]))};
    for (const [id, s, e] of C) {
      const el = "#" + id;
      tl.set(el, { visibility: "visible" }, s);
      tl.fromTo(el, { opacity: 0 }, { opacity: 1, duration: 0.1, ease: "none" }, s);
      tl.set(el, { opacity: 0, visibility: "hidden" }, e);
    }
    tl.set({}, {}, ${TOTAL});
    window.__timelines["captions"] = tl;
  </script>
</template>
`,
);

// ---------- index.html
const host = (id, start, dur, track, kind, z) =>
  `      <div id="${id}" data-composition-id="${id}" data-composition-src="compositions/${id}.html"
        data-start="${start}" data-duration="${dur}" data-track-index="${track}" data-track-kind="${kind}"
        data-width="1920" data-height="1080"${z ? ` style="z-index: ${z}"` : ""}></div>`;
const audios = scenes
  .flatMap((sc) => sc.lines.filter((l) => l.audio).map((l) => ({ l, at: sc.start + l.start })))
  .map(({ l, at }) => `      <audio id="voix-${l.id}" src="${l.audio}" data-start="${at.toFixed(3)}" data-duration="${l.dur.toFixed(3)}" data-track-index="4" data-volume="1"></audio>`)
  .join("\n");
fs.writeFileSync(
  P("index.html"),
  `<!doctype html>
<html lang="fr">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=1920, height=1080" />
    <title>Climatek × Fromagerie des Monédières – Revue de compte</title>
    <script src="assets/vendor/gsap.min.js"></script>
    <style>
      * { margin: 0; padding: 0; box-sizing: border-box; }
      html, body { margin: 0; width: 1920px; height: 1080px; overflow: hidden; background: #0B0816; }
      #root { position: relative; width: 100%; height: 100%; }
      #fond { position: absolute; inset: 0; background: #0B0816; }
    </style>
  </head>
  <body>
    <!-- Généré par tools/build.mjs à partir de script.json : ne pas modifier à la main -->
    <div id="root" data-composition-id="main" data-start="0" data-duration="${TOTAL}" data-width="1920" data-height="1080">
      <div id="fond"></div>
${scenes.map((sc) => host(sc.id, sc.start, sc.D, 1, "graphics", 0)).join("\n")}
${host("hud", 0, TOTAL, 2, "graphics", 40)}
${host("captions", 0, TOTAL, 3, "captions", 50)}
${audios}
    </div>
    <script>
      window.__timelines = window.__timelines || {};
      const tl = gsap.timeline({ paused: true });
      tl.set({}, {}, ${TOTAL});
      window.__timelines["main"] = tl;
    </script>
  </body>
</html>
`,
);
fs.writeFileSync(
  P("timings.json"),
  JSON.stringify({ total: TOTAL, scenes: scenes.map((s) => ({ id: s.id, start: s.start, duration: s.D, lines: s.L })) }, null, 1),
);
console.log(report.join("\n"));
console.log(scenes.map((s) => `${s.id}: ${s.start.toFixed(1)} → ${(s.start + s.D).toFixed(1)} (${s.D.toFixed(1)} s, parole+marges ${s.needed.toFixed(1)} s)`).join("\n"));
console.log(`TOTAL ${TOTAL.toFixed(1)} s${TOTAL > BUDGET + 0.01 ? "  ⚠ dépasse 5:00 : parler un peu plus vite ou raccourcir le texte" : ""}`);

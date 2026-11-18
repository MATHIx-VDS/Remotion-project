// ACT 4 - the promise and the lockup. The camera pulls back from Sunday to the whole week and
// every course lights up in the orange of "ton cours", left to right. "Un cours pour toi." holds
// over the dimmed planning; then the planning clears outward (each column along its own vector)
// and leaves the club's wordmark, which was waiting behind it. The now-line flies in and becomes
// the underline of ACADÉMIE. boxe-academie.fr and the APPELER button land; the lockup keeps
// building to the last frame (the poster).
import React from 'react';
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from 'remotion';
import { colC, layoutFor, WORLD_H, WORLD_W } from '../app/geo';
import { CallButton, Logo, LOGO_FILE, Planning, Wordmark } from '../app/Planning';
import { Statement } from '../app/Statement';
import { C, FONT, TYPE, typeStyle } from '../brand/tokens';
import { hours, type Course } from '../data';
import { arrive, clamp, E, hitPulse, lmix, mix, prog } from '../lib/anim';
import { camera, lc, toScreen, type Shot } from '../lib/camera';
import { measureTracked } from '../lib/measure';
import { ACT, CUE, f60, KEEP } from '../timeline';
import { daysState } from './Days';

const L = (abs: number) => abs - ACT.end.from;
const PULL = { from: 0, to: f60(54) };
const SCATTER = { from: L(CUE.scatter), to: L(CUE.scatter) + f60(30) };
export const SCATTER_ABS = { from: CUE.scatter, to: CUE.scatter + f60(30), ease: E.contact };

export const End: React.FC = () => {
  const f = useCurrentFrame();
  const { width: w, height: h } = useVideoConfig();
  const Ly = layoutFor(w, h);
  const start = daysState(ACT.end.from - 1, Ly);
  const full: Shot = { ax: WORLD_W / 2, ay: WORLD_H / 2, sx: w / 2, sy: h / 2, k: Math.min(w / WORLD_W, h / WORLD_H) * 0.985 };
  const pull = prog(f, PULL.from, PULL.to, E.cam);
  const base = lc(start.cam, full, pull);
  const cam = { ...base, k: base.k * (1 + 0.035 * prog(f, PULL.to - f60(20), SCATTER.from, E.smooth)) * (1 + 0.025 * hitPulse(f, 2, 7)) };

  // every course lights up, left to right, earliest first
  const lit = (c: Course) => {
    const s = L(CUE.lit) + c.day * f60(3) + (hours(c.start) - 10) * f60(0.8);
    return prog(f, s, s + f60(8), E.out);
  };
  const sc = prog(f, SCATTER.from, SCATTER.to, E.contact);
  const colMove = (d: number) => {
    const p = toScreen(cam, { x: colC(d), y: WORLD_H / 2 });
    const vx = p.x - w / 2;
    const vy = Ly.vertical ? (d % 2 ? 1 : -1) * h * 0.25 : h * 0.12;
    const n = Math.hypot(vx, vy) || 1;
    const dist = (Ly.vertical ? h : w) * 1.1;
    return { dx: ((vx / n) * dist * sc) / cam.k, dy: ((vy / n) * dist * sc) / cam.k };
  };
  const veil = prog(f, f60(34), f60(54), E.smooth) * (1 - prog(f, SCATTER.from, SCATTER.from + f60(16), E.smooth));

  // the lockup, measured from the real font
  const wmSize = Ly.vertical ? 104 : TYPE.wordmark.size;
  const wm = TYPE.wordmark;
  const mw = (s: string) => measureTracked(s, wmSize, wm.weight, wm.track, FONT.display);
  const logoSize = LOGO_FILE ? wmSize * 1.5 : 0;
  const logoGap = LOGO_FILE ? wmSize * 0.35 : 0;
  const wmW = mw('BOXE ACADÉMIE BRIVE') - wm.track * wmSize;
  const lockW = logoSize + logoGap + wmW;
  const lx = (w - lockW) / 2;
  const tx = lx + logoSize + logoGap; // wordmark left
  const top = Ly.end.cy - wmSize / 2;
  const acaX0 = tx + mw('BOXE ');
  const acaX1 = acaX0 + mw('ACADÉMIE') - wm.track * wmSize;
  const underY = top + wmSize * 1.06;
  const reveal = f >= SCATTER.from - 1 ? 1 : 0;
  const build = lmix(1, 1.06, prog(f, L(CUE.lockup) - f60(10), L(CUE.lockup) + f60(80), E.outSoft)); // builds, then rests for the poster

  // the line: in the planning at Sunday 10:00, then flies to under ACADÉMIE
  const a0 = toScreen(cam, { x: start.line.x0, y: start.line.y });
  const a1 = toScreen(cam, { x: start.line.x1, y: start.line.y });
  const m = prog(f, SCATTER.from - f60(2), SCATTER.from + f60(30), E.inOut);
  const cx = w / 2;
  const cy = Ly.end.cy;
  const B = (x: number, y: number) => ({ x: cx + (x - cx) * build, y: cy + (y - cy) * build });
  const u0 = B(acaX0, underY);
  const u1 = B(acaX1, underY);
  const line = {
    x0: mix(a0.x, u0.x, m),
    x1: mix(a1.x, u1.x, m),
    y: mix(a0.y, u0.y, m),
    t: mix(Math.max(2, 4 * cam.k), 7 * build, m),
  };

  const urlP = prog(f, L(CUE.url) - 1, L(CUE.url) + f60(20), E.out);
  const callP = prog(f, L(CUE.call) - 1, L(CUE.call) + f60(18), E.out);
  const ring = f - L(CUE.call) - f60(14);
  const rowY = top + wmSize * 1.5;
  const urlSize = TYPE.url.size;

  return (
    <AbsoluteFill style={{ background: C.ink, overflow: 'hidden' }}>
      {/* the lockup waits behind the planning */}
      <div style={{ position: 'absolute', left: 0, top: 0, width: w, height: h, opacity: reveal, transformOrigin: `${cx}px ${cy}px`, transform: `scale(${build})` }}>
        {LOGO_FILE && <Logo size={logoSize} style={{ position: 'absolute', left: 0, top: 0, transform: `translate(${lx}px, ${cy - logoSize / 2}px)` }} />}
        <div style={{ position: 'absolute', left: 0, top: 0, transform: `translate(${tx}px, ${top}px)` }}>
          <Wordmark size={wmSize} />
        </div>
        <div style={{ position: 'absolute', left: 0, top: 0, width: w, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: Ly.vertical ? 0 : 56, flexDirection: Ly.vertical ? 'column' : 'row', transform: `translate(0px, ${rowY}px)` }}>
          <div data-text="url" style={{ ...typeStyle('url', urlSize), color: C.white, opacity: urlP, transform: `translateY(${(1 - arrive(urlP)) * 24}px)`, marginBottom: Ly.vertical ? 48 : 0 }}>
            boxe-academie.fr
          </div>
          <div style={{ position: 'relative', opacity: callP, transform: `translateY(${(1 - arrive(callP)) * 24}px)` }}>
            <CallButton size={40} />
            {ring >= 0 && ring < 20 && (
              <div style={{ position: 'absolute', left: 0, top: 0, right: 0, bottom: 0, transform: `scale(${1 + 0.18 * clamp(ring / 8) ** 0.5})`, border: `3px solid ${C.orange}`, opacity: 0.9 * (1 - ring / 20) }} />
            )}
          </div>
        </div>
      </div>

      {/* the planning, pulled back, lit, then cleared */}
      {sc < 1 && (
        <div style={camera(cam)}>
          <Planning
            today={f < f60(14) ? start.today : -1}
            colDim={(d) => 1 - 0.6 * (1 - pull) * (1 - clamp(1 - Math.abs(d - start.colF)))}
            colMove={colMove}
            card={(c) => ({ lit: lit(c) })}
            header={1 - prog(f, SCATTER.from, SCATTER.from + f60(12), E.smooth)}
            axis={1 - prog(f, SCATTER.from, SCATTER.from + f60(12), E.smooth)}
            line={null}
          />
        </div>
      )}
      <div style={{ position: 'absolute', left: 0, top: 0, width: w, height: h, background: C.ink, opacity: 0.74 * veil }} />
      <div style={{ position: 'absolute', left: 0, top: 0, width: w, height: h, transformOrigin: `${w / 2}px ${h / 2}px`, transform: `scale(${1 + 0.05 * prog(f, f60(40), SCATTER.from, E.dolly)})`, willChange: 'transform' }}>
        <Statement id="promise" f={f} offset={ACT.end.from} x={Ly.vertical ? 64 : 160} y={h / 2 - TYPE.statement.size / 2} w={w - (Ly.vertical ? 128 : 320)} align="center" />
      </div>

      {/* the device */}
      <div style={{ position: 'absolute', left: 0, top: 0, width: Math.max(0, line.x1 - line.x0), height: line.t, background: C.orange, transform: `translate(${line.x0}px, ${line.y - line.t / 2}px)` }} />
      <div
        style={{
          position: 'absolute', left: 0, top: 0, width: line.t * 4, height: line.t * 4, borderRadius: '50%', background: C.orange,
          opacity: 1 - prog(f, SCATTER.from + f60(10), SCATTER.from + f60(28), E.smooth),
          transform: `translate(${line.x0 - line.t * 2}px, ${line.y - line.t * 2}px) scale(${1 + 0.3 * Math.max(...KEEP.map((k) => hitPulse(f - L(k))))})`,
        }}
      />
    </AbsoluteFill>
  );
};


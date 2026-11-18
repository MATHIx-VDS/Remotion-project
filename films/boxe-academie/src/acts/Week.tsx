// ACT 2 - the line lands in the real planning. On the drop the club's week builds around it:
// columns rise left to right on 16ths, cards drop in by start time; the line, still on screen,
// shrinks into Monday's column at 12:15 (the first course of the film). The wide look lasts
// < 1.7 s, then the camera dives into Monday with a hand-steered roll that comes back level.
import React from 'react';
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from 'remotion';
import { colX, COLW, dayShot, layoutFor, yOf } from '../app/geo';
import { Planning } from '../app/Planning';
import { C } from '../brand/tokens';
import { hours } from '../data';
import { E, mix, prog } from '../lib/anim';
import { camera, lc } from '../lib/camera';
import { ACT, CUE, f60, VISITS } from '../timeline';
import { hookLine } from './Hook';

const L = (abs: number) => abs - ACT.week.from;
export const PUSH = { from: L(CUE.push), to: ACT.week.dur }; // act-local
const MON = VISITS[0];

/** The camera of this act at local frame f (Days opens on the last pose). */
export const weekCam = (f: number, w: number, h: number) => {
  const Ly = layoutFor(w, h);
  const t = prog(f, PUSH.from, PUSH.to, E.smooth);
  const shot = lc(Ly.wide, dayShot(Ly, 0, hours(MON.course.start)), t);
  // roll swing: 0 -> -4 deg by 57% of the push, back to level on landing
  const roll = t < 0.57 ? mix(0, -4, E.smooth(t / 0.57)) : mix(-4, 0, E.smooth((t - 0.57) / 0.43));
  return { ...shot, roll };
};

export const Week: React.FC = () => {
  const f = useCurrentFrame();
  const { width: w, height: h } = useVideoConfig();
  const Ly = layoutFor(w, h);
  const cam = weekCam(f, w, h);

  // the line: from the hook's last screen pose (inverse of the wide camera) into Monday 12:15
  const hl = hookLine(ACT.hook.dur - 1, w, h);
  const inv = (sx: number, sy: number) => ({ x: (sx - Ly.wide.sx) / Ly.wide.k + Ly.wide.ax, y: (sy - Ly.wide.sy) / Ly.wide.k + Ly.wide.ay });
  const a = inv(hl.x0, hl.y);
  const b2 = inv(hl.x1, hl.y);
  const m = prog(f, -1, f60(26), E.inOut);
  const line = {
    x0: mix(a.x, colX(0), m),
    x1: mix(b2.x, colX(0) + COLW, m),
    y: mix(a.y, yOf(hours(MON.course.start)), m),
    thick: mix(hl.thick / Ly.wide.k, 4, m),
  };

  // build: columns rise left to right one 16th apart, cards follow by start time
  const colIn = (d: number) => prog(f, -1 + d * f60(4), d * f60(4) + f60(22), E.out);
  const card = (c: { day: number; start: string }) => {
    const s = c.day * f60(4) + f60(6) + (hours(c.start) - 10) * f60(1.6);
    return { p: prog(f, s, s + f60(20), E.out) };
  };

  return (
    <AbsoluteFill style={{ background: C.ink, overflow: 'hidden' }}>
      <div style={camera(cam)}>
        <Planning today={0} colIn={colIn} card={card} header={prog(f, -1, f60(16), E.out)} line={line} />
      </div>
    </AbsoluteFill>
  );
};

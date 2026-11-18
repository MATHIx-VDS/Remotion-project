// ACT 1 - the now-line counts the club's day. Frame 0 is already moving: the orange line draws
// out of its dot while the grid's own hour labels step 10h -> 21h, one per 8th, the line stepping
// down with each hour. "Quand tu veux." lands under it, then leaves in reading order; the line
// stays, and Act 2 lands it inside the real planning.
import React from 'react';
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from 'remotion';
import { layoutFor } from '../app/geo';
import { C, TYPE, typeStyle } from '../brand/tokens';
import { arrive, blurIn, blurOut, depart, E, hitPulse, mix, prog } from '../lib/anim';
import { fitSize, measureTracked } from '../lib/measure';
import { FONT } from '../brand/tokens';
import { ACT, copy, CUE, f60, HOURS } from '../timeline';

const L = (abs: number) => abs - ACT.hook.from;
const STEPS = [CUE.h1, CUE.h2, CUE.h3, CUE.h4, CUE.h5].map(L);
export const LINE_STEP = 16; // px the line drops per hour step

/** The line's screen pose at a local hook frame (Act 2 reads the last one). */
export const hookLine = (f: number, w: number, h: number) => {
  const Ly = layoutFor(w, h);
  const draw = prog(f, -6, f60(20), E.out); // already drawing on frame 0
  const steps = STEPS.slice(1).reduce((a, s) => a + prog(f, s - 1, s + f60(12), E.out), 0);
  return { x0: Ly.hook.x, x1: mix(Ly.hook.x, w, draw), y: Ly.hook.lineY + steps * LINE_STEP, thick: 5 };
};

export const Hook: React.FC = () => {
  const f = useCurrentFrame();
  const { width: w, height: h } = useVideoConfig();
  const Ly = layoutFor(w, h);
  const line = hookLine(f, w, h);
  const hookCopy = copy('hook');
  const words = hookCopy.text.toUpperCase().split(' ');
  const st = TYPE.statement;
  const size = fitSize(hookCopy.text.toUpperCase(), w - 2 * Ly.hook.x, st.size, st.weight, st.track, FONT.display);
  const outAt = L(hookCopy.out);
  const hourOut = prog(f, outAt - f60(4), outAt + f60(10), E.smooth);
  const hourSize = Ly.hook.size;
  const grow = 1 + 0.05 * prog(f, L(CUE.h5), ACT.hook.dur, E.dolly);
  const boxH = hourSize * 1.2;
  const boxTop = line.y - 34 - boxH;
  const roll = STEPS.slice(1).reduce((a, st) => a + prog(f, st - 4, st + f60(12), E.smooth), 0); // under ~45 px/f: reads as rolling digits, not a smear
  const tick = Math.max(...[...STEPS, L(CUE.beat1), L(CUE.beat2)].map((s) => hitPulse(f - s)));

  return (
    <AbsoluteFill style={{ background: C.ink, overflow: 'hidden' }}>
      <div style={{ position: 'absolute', left: 0, top: 0, width: w, height: h, transformOrigin: `${Ly.hook.x}px ${line.y}px`, transform: `scale(${grow})` }}>
      {/* hour readout: each label rises in from under the line's top edge, the last one out */}
      <div style={{ position: 'absolute', left: 0, top: 0, width: w, height: boxH, overflow: 'hidden', opacity: 1 - hourOut, transform: `translate(0px, ${boxTop}px)` }}>
        {HOURS.map((hr, i) => {
          // an odometer: one box tall, each step moves every label exactly one box up, so two never overlap
          const y = (i - roll) * boxH + boxH * 0.1;
          if (y <= -boxH || y >= boxH) return null;
          return (
            <div
              key={hr}
              data-text={`hour${i + 1}`}
              style={{
                ...typeStyle('statement', hourSize),
                textTransform: 'none',
                color: C.white,
                position: 'absolute',
                left: 0,
                top: 0,
                transform: `translate(${Ly.hook.x - hourSize * 0.04}px, ${y}px)`,
              }}
            >
              {hr}
            </div>
          );
        })}
      </div>

      </div>
      {/* the device */}
      <div style={{ position: 'absolute', left: 0, top: 0, width: Math.max(0, line.x1 - line.x0), height: line.thick, background: C.orange, transform: `translate(${line.x0}px, ${line.y - line.thick / 2}px)` }} />
      <div
        style={{
          position: 'absolute',
          left: 0,
          top: 0,
          width: 24,
          height: 24,
          borderRadius: '50%',
          background: C.orange,
          transform: `translate(${line.x0 - 12}px, ${line.y - 12}px) scale(${1 + 0.3 * tick})`,
        }}
      />

      <div style={{ position: 'absolute', left: 0, top: 0, width: w, height: h, transformOrigin: `${Ly.hook.x}px ${line.y}px`, transform: `scale(${grow})` }}>
      {/* "Quand tu veux." under the line, word by word, out in reading order */}
      {words.map((wd, i) => {
        const s = L(hookCopy.in) + i * f60(6);
        const p = prog(f, s, s + f60(26), E.out);
        const o = outAt + i * f60(4);
        const q = prog(f, o, o + f60(10), E.in);
        const fade = prog(f, o, o + f60(10), E.smooth);
        const before = words.slice(0, i).join(' ');
        const x = Ly.hook.x + (i ? fitWidth(before + ' ', size) : 0);
        const blur = blurIn(p, 8) + blurOut(q, 4);
        return (
          <span
            key={i}
            data-text={`hook.${i}`}
            style={{
              ...typeStyle('statement', size),
              position: 'absolute',
              left: 0,
              top: 0,
              color: C.white,
              opacity: p * (1 - fade),
              filter: blur > 0.05 ? `blur(${blur.toFixed(2)}px)` : undefined,
              transform: `translate(${x}px, ${line.y + 34 + ((1 - arrive(p)) * 0.3 - depart(q) * 0.12) * size}px)`,
            }}
          >
            {wd}
          </span>
        );
      })}
      </div>
    </AbsoluteFill>
  );
};

const fitWidth = (s: string, size: number) => measureTracked(s, size, TYPE.statement.weight, TYPE.statement.track, FONT.display);

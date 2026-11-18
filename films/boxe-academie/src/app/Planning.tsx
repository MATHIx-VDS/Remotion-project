// The club's planning page, rebuilt from data.ts: header, day row, hour grid, course cards and the
// orange "maintenant" line. Laid out once in world px; acts move it with one camera transform.
import React from 'react';
import { getStaticFiles, Img, staticFile } from 'remotion';
import { COURSES, DAY_SHORT, GRID, cardTimeLine, type Course } from '../data';
import { C, FONT, typeStyle } from '../brand/tokens';
import { clamp } from '../lib/anim';
import { mixColor } from '../lib/color';
import { AXIS, cardRect, colX, COLW, DAYROW, GRID_BOTTOM, HEADER_H, HOUR, WORLD_W, Y0, yOf } from './geo';

const BAR_COLOR: Record<Course['bar'], string> = { orange: C.orange, peach: C.peach, white: C.white, grey: C.grey };

/** The real club logo, if the client's file is in public/brand/. Never drawn by us (BRIEF.md). */
export const LOGO_FILE = ['brand/logo.svg', 'brand/logo.png', 'brand/logo.webp'].find((p) => getStaticFiles().some((s) => s.name === p)) ?? null;
export const Logo: React.FC<{ size: number; style?: React.CSSProperties }> = ({ size, style }) =>
  LOGO_FILE ? <Img src={staticFile(LOGO_FILE)} style={{ width: size, height: size, objectFit: 'contain', ...style }} /> : null;

/** The wordmark as the site sets it: BOXE white, ACADÉMIE orange, BRIVE white. */
export const Wordmark: React.FC<{ size: number; academieRef?: React.Ref<HTMLSpanElement>; color?: string }> = ({ size, academieRef }) => (
  <span data-text="wordmark" style={{ ...typeStyle('wordmark', size), color: C.white, display: 'inline-block' }}>
    BOXE <span ref={academieRef} style={{ color: C.orange }}>ACADÉMIE</span> BRIVE
  </span>
);

/** The APPELER button: orange, one corner cut on a bevel. */
export const CallButton: React.FC<{ size: number; style?: React.CSSProperties }> = ({ size, style }) => {
  const h = size * 1.9;
  const cut = h * 0.34;
  return (
    <div
      data-text="call"
      style={{
        ...typeStyle('button', size),
        color: C.white,
        background: C.orange,
        height: h,
        padding: `0 ${size * 1.1}px`,
        display: 'inline-flex',
        alignItems: 'center',
        clipPath: `polygon(0 0, 100% 0, 100% calc(100% - ${cut}px), calc(100% - ${cut}px) 100%, 0 100%)`,
        ...style,
      }}
    >
      APPELER
    </div>
  );
};

export type LineState = { x0: number; x1: number; y: number; thick?: number; alpha?: number; pulse?: number };
export type CardFx = { p?: number; ring?: number; lit?: number; dx?: number; dy?: number };
export type PlanningProps = {
  today: number; // day index whose column is tinted with AUJOURD'HUI, -1 for none
  colDim?: (d: number) => number; // 1 = full, lower = dimmed neighbour
  colIn?: (d: number) => number; // 0..1 column entrance
  colMove?: (d: number) => { dx: number; dy: number };
  card?: (c: Course, i: number) => CardFx;
  header?: number; // 0..1 header visibility
  axis?: number; // 0..1 hour labels and hairlines
  line?: LineState | null;
};

const Card: React.FC<{ c: Course; fx: CardFx }> = ({ c, fx }) => {
  const r = cardRect(c);
  const p = fx.p ?? 1;
  const lit = clamp(fx.lit ?? 0);
  const bar = BAR_COLOR[c.bar];
  const timeColor = c.bar === 'orange' || c.bar === 'peach' ? C.orange : C.white;
  const pad = r.half ? 14 : 18;
  const ring = fx.ring ?? -1; // frames since the ring popped, -1 = none
  const ringT = ring >= 0 ? clamp(ring / 20) : 1;
  const outset = 4 + 10 * clamp(ring / 8) ** 0.5;
  return (
    <div
      style={{
        position: 'absolute',
        left: 0,
        top: 0,
        width: r.w,
        height: r.h,
        transform: `translate(${r.x + (fx.dx ?? 0)}px, ${r.y + (1 - p) * 40 + (fx.dy ?? 0)}px)`,
        opacity: p,
        background: lit > 0 ? mixColor(C.card, C.litCard, lit) : C.card,
        overflow: 'visible',
      }}
    >
      <div style={{ position: 'absolute', left: 0, top: 0, width: 4 + 6 * lit, height: r.h, background: lit > 0.5 ? C.orange : bar }} />
      <div style={{ position: 'absolute', left: 4 + pad, top: 14, width: r.w - 4 - 2 * pad, overflow: 'hidden', height: r.h - 18 }}>
        <div style={{ ...typeStyle('cardTime', r.half ? 25 : 28), color: timeColor, whiteSpace: 'nowrap' }}>{cardTimeLine(c)}</div>
        <div style={{ ...typeStyle('cardTitle', r.half ? 32 : 36), color: C.white, whiteSpace: 'normal', marginTop: 4 }}>{c.name}</div>
        <div style={{ ...typeStyle('cardAud', r.half ? 24 : 26), color: C.mute, whiteSpace: 'nowrap', marginTop: 4 }}>{c.audience}</div>
      </div>
      {ring >= 0 && ringT < 1 && (
        <svg style={{ position: 'absolute', left: -outset, top: -outset, overflow: 'visible' }} width={r.w + 2 * outset} height={r.h + 2 * outset}>
          <rect x={1.5} y={1.5} width={r.w + 2 * outset - 3} height={r.h + 2 * outset - 3} fill="none" stroke={C.orange} strokeWidth={3} opacity={0.9 * (1 - ringT)} />
        </svg>
      )}
    </div>
  );
};

export const Planning: React.FC<PlanningProps> = ({ today, colDim = () => 1, colIn = () => 1, colMove = () => ({ dx: 0, dy: 0 }), card = () => ({}), header = 1, axis = 1, line = null }) => {
  const hoursList = Array.from({ length: GRID.to - GRID.from + 1 }, (_, i) => GRID.from + i).filter((h) => h <= 21);
  return (
    <div style={{ position: 'absolute', left: 0, top: 0, width: WORLD_W, height: GRID_BOTTOM + 40 }}>
      {/* site header */}
      <div style={{ position: 'absolute', left: 0, top: 0, width: WORLD_W, height: HEADER_H, opacity: header }}>
        <div style={{ position: 'absolute', left: 0, top: 0, width: WORLD_W, height: 8, background: C.orange }} />
        <div style={{ position: 'absolute', left: 0, top: 0, transform: `translate(${AXIS - 60}px, 30px)`, display: 'flex', alignItems: 'center', gap: 18 }}>
          <Logo size={72} />
          <Wordmark size={60} />
        </div>
        <div style={{ position: 'absolute', left: 0, top: 0, transform: `translate(${WORLD_W - 1640}px, 50px)`, display: 'flex', gap: 56 }}>
          {['LE CLUB ▾', 'AFFILIATIONS', 'OPEN MAT', 'E-SHOP', 'CONTACT'].map((m, i) => (
            <div key={m} style={{ ...typeStyle('label', 28), color: C.white, paddingBottom: 8, borderBottom: i === 0 ? `3px solid ${C.orange}` : '3px solid transparent' }}>
              {m}
            </div>
          ))}
        </div>
        <div style={{ position: 'absolute', left: 0, top: 0, transform: `translate(${WORLD_W - 330}px, 26px)` }}>
          <CallButton size={34} />
        </div>
      </div>

      {/* hour axis and hairlines */}
      {hoursList.map((h) => (
        <div key={h} style={{ opacity: axis }}>
          <div style={{ position: 'absolute', left: 0, top: 0, transform: `translate(${AXIS - 96}px, ${yOf(h) - 13}px)`, ...typeStyle('hour', 26), color: C.mute }}>{`${h}h`}</div>
          <div style={{ position: 'absolute', left: 0, top: 0, width: 7 * (COLW + 6), height: 1, background: C.line, transform: `translate(${AXIS}px, ${yOf(h)}px)` }} />
        </div>
      ))}

      {/* columns, day labels and cards */}
      {Array.from({ length: 7 }, (_, d) => {
        const dim = colDim(d);
        const p = clamp(colIn(d));
        const mv = colMove(d);
        const isToday = d === today;
        return (
          <div key={d} style={{ position: 'absolute', left: 0, top: 0, opacity: dim * p, transform: `translate(${mv.dx}px, ${mv.dy + (1 - p) * 60}px)` }}>
            <div style={{ position: 'absolute', left: 0, top: 0, width: COLW, height: GRID_BOTTOM - Y0, background: isToday ? C.todayTint : C.surface, transform: `translate(${colX(d)}px, ${Y0}px)` }} />
            {hoursList.map((h) => (
              <div key={h} style={{ position: 'absolute', left: 0, top: 0, width: COLW, height: 1, background: C.line, transform: `translate(${colX(d)}px, ${yOf(h)}px)` }} />
            ))}
            <div style={{ position: 'absolute', left: 0, top: 0, width: COLW, transform: `translate(${colX(d)}px, ${DAYROW.top}px)`, textAlign: 'center' }}>
              <div style={{ ...typeStyle('day', 44), color: isToday ? C.white : C.mute }}>{DAY_SHORT[d]}</div>
              {isToday && <div style={{ ...typeStyle('label', 20), color: C.orange, marginTop: 12 }}>AUJOURD'HUI</div>}
            </div>
            {COURSES.map((c, i) => (c.day === d ? <Card key={c.id} c={c} fx={card(c, i)} /> : null))}
          </div>
        );
      })}

      {/* the now-line: orange, a dot at its left end */}
      {line && (line.alpha ?? 1) > 0 && (
        <div style={{ position: 'absolute', left: 0, top: 0, opacity: line.alpha ?? 1 }}>
          <div
            style={{
              position: 'absolute',
              left: 0,
              top: 0,
              width: Math.max(0, line.x1 - line.x0),
              height: line.thick ?? 3,
              background: C.orange,
              transform: `translate(${line.x0}px, ${line.y - (line.thick ?? 3) / 2}px)`,
            }}
          />
          <div
            style={{
              position: 'absolute',
              left: 0,
              top: 0,
              width: (line.thick ?? 3) * 4.6,
              height: (line.thick ?? 3) * 4.6,
              borderRadius: '50%',
              background: C.orange,
              transform: `translate(${line.x0 - (line.thick ?? 3) * 2.3}px, ${line.y - (line.thick ?? 3) * 2.3}px) scale(${1 + 0.35 * (line.pulse ?? 0)})`,
            }}
          />
        </div>
      )}
    </div>
  );
};

export { HOUR, FONT };

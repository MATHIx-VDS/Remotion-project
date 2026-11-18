// A statement in the brand's condensed capitals, revealed word by word (rise + short entry blur,
// landing sharp) and cleared in reading order. Screen space; reads its text and frames from COPY.
import React from 'react';
import { C, FONT, TYPE, typeStyle } from '../brand/tokens';
import { arrive, blurIn, blurOut, depart, E, prog } from '../lib/anim';
import { fitSize, measureTracked } from '../lib/measure';
import { copy, f60 } from '../timeline';

export const Statement: React.FC<{ id: string; f: number; offset: number; x: number; y: number; w: number; align?: 'left' | 'center'; max?: number; band?: number }> = ({
  id, f, offset, x, y, w, align = 'left', max = TYPE.statement.size, band = 0,
}) => {
  const c = copy(id);
  const st = TYPE.statement;
  const text = c.text.toUpperCase();
  const size = fitSize(text, w, max, st.weight, st.track, FONT.display);
  const words = text.split(' ');
  const total = measureTracked(text, size, st.weight, st.track, FONT.display);
  const left = align === 'center' ? x + (w - total) / 2 : x;
  const at = (abs: number) => abs - offset;
  // optional flat ink band behind the line (9:16, where the column fills the frame under it)
  const bandP = band ? prog(f, at(c.in) - 1, at(c.in) + f60(12), E.out) * (1 - prog(f, at(c.out) + f60(8), at(c.out) + f60(20), E.smooth)) : 0;
  return (
    <>
      {bandP > 0 && (
        <div style={{ position: 'absolute', left: 0, top: 0, width: band, height: size * 1.5, background: C.ink, opacity: 0.92 * bandP, transform: `translate(0px, ${y - size * 0.25}px)` }} />
      )}
      {words.map((wd, i) => {
        const s = at(c.in) + i * f60(6);
        const p = prog(f, s, s + f60(26), E.out);
        const o = at(c.out) + i * f60(4);
        const q = prog(f, o, o + f60(10), E.in);
        const fade = prog(f, o, o + f60(10), E.smooth);
        if (p <= 0 || fade >= 1) return null;
        const dx = i ? measureTracked(words.slice(0, i).join(' ') + ' ', size, st.weight, st.track, FONT.display) : 0;
        const blur = blurIn(p, 8) + blurOut(q, 4);
        return (
          <span
            key={i}
            data-text={`${id}.${i}`}
            style={{
              ...typeStyle('statement', size),
              position: 'absolute',
              left: 0,
              top: 0,
              color: C.white,
              opacity: p * (1 - fade),
              filter: blur > 0.05 ? `blur(${blur.toFixed(2)}px)` : undefined,
              transform: `translate(${left + dx}px, ${y + ((1 - arrive(p)) * 0.3 - depart(q) * 0.12) * size}px)`,
            }}
          >
            {wd}
          </span>
        );
      })}
    </>
  );
};

/** The course detail chip: "Mercredi · Baby Boxe · 15:30 · 4 à 6 ans", orange side bar, rises in. */
export const Caption: React.FC<{ id: string; f: number; offset: number; x: number; y: number; w: number }> = ({ id, f, offset, x, y, w }) => {
  const c = copy(id);
  const p = prog(f, c.in - offset - 1, c.resolved - offset, E.out);
  const q = prog(f, c.out - offset, c.out - offset + f60(10), E.smooth);
  if (p <= 0 || q >= 1) return null;
  const size = TYPE.caption.size * (w < 1200 ? 1.0 : 1);
  return (
    <div
      style={{
        position: 'absolute',
        left: 0,
        top: 0,
        maxWidth: w,
        transform: `translate(${x}px, ${y + (1 - arrive(p)) * 28}px)`,
        opacity: p * (1 - q),
        background: C.card,
        borderLeft: `6px solid ${C.orange}`,
        padding: '18px 28px 20px 26px',
      }}
    >
      <div data-text={id} style={{ ...typeStyle('caption', size), color: C.white, whiteSpace: 'normal' }}>
        {c.text}
      </div>
    </div>
  );
};

// ACT 3 - the week, one day per bar. The camera whips column to column; the now-line travels
// with it, then drops down the day to one course (contact on the 16th), the card's ring pops and
// the course detail rises in. Wednesday gets two bars: the line steps down from Baby Boxe (4 à 6
// ans) to the adults' class, one card per beat - the proof that every age has a slot.
import React from 'react';
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from 'remotion';
import { colC, colX, COLW, layoutFor, yOf, type Layout } from '../app/geo';
import { Planning } from '../app/Planning';
import { Caption, Statement } from '../app/Statement';
import { C, TYPE, typeStyle } from '../brand/tokens';
import { hours, type Course } from '../data';
import { arrive, clamp, E, hitPulse, mix, prog } from '../lib/anim';
import { camera, dip, type Shot } from '../lib/camera';
import { ACT, copy, DAYS_CAP, KEEP, SLIDE, VISITS, WHIP } from '../timeline';

/** Every point the line lands on, in order: one per day, plus Wednesday's ladder. */
export const TARGETS: { f: number; from: number; course: Course; visit: number }[] = VISITS.flatMap((v, i) => [
  { f: v.hit, from: v.at - 15, course: v.course, visit: i }, // the drop starts mid-whip: the frame is never an empty column
  ...(v.ladder ?? []).map((s) => ({ f: s.f, from: s.f - SLIDE, course: s.course, visit: i })),
]);

/** Line, camera and column state at an absolute frame (End reads its first pose from here). */
export const daysState = (A: number, Ly: Layout) => {
  // horizontal: which column, mid-whip
  let colF = 0;
  let wp = 0;
  for (let i = 1; i < VISITS.length; i++) {
    const p = prog(A, VISITS[i].at - WHIP, VISITS[i].at, E.whip);
    if (p > 0) {
      colF = mix(VISITS[i - 1].day, VISITS[i].day, p);
      wp = p < 1 ? p : 0;
    }
  }
  // vertical: the line slides to each target on E.contact; the camera follows on E.cam, a little behind
  let lt = hours(TARGETS[0].course.start);
  let ct = lt;
  for (let k = 1; k < TARGETS.length; k++) {
    const t = hours(TARGETS[k].course.start);
    const fk = TARGETS[k].f;
    lt = mix(lt, t, prog(A, TARGETS[k].from, fk, E.contact));
    ct = mix(ct, t, prog(A, TARGETS[k].from - 2, fk + 16, E.cam));
  }
  // a slow push through each hold, released by the next whip
  let push = 0;
  for (let i = 0; i < VISITS.length; i++) {
    const next = VISITS[i + 1];
    const endF = next ? next.at - WHIP : ACT.days.from + ACT.days.dur;
    const rel = next ? 1 - prog(A, next.at - WHIP, next.at, E.whip) : 1;
    push += 0.04 * prog(A, VISITS[i].hit, endF, E.smooth) * rel;
  }
  const xC = mix(colC(Math.floor(colF)), colC(Math.ceil(colF)), colF - Math.floor(colF));
  const cam: Shot = { ax: xC, ay: yOf(ct), sx: Ly.daySx, sy: Ly.lineSy, k: Ly.dayK * (1 + push) * dip(wp, 0.12) };
  const x0 = colX(0) + (xC - colC(0));
  const pulse = Math.max(...KEEP.map((k) => hitPulse(A - k)), ...TARGETS.map((t) => hitPulse(A - t.f)));
  const line = { x0, x1: x0 + COLW, y: yOf(lt), thick: 4, pulse };
  const today = Math.round(colF);
  return { cam, line, colF, today };
};

export const Days: React.FC = () => {
  const f = useCurrentFrame();
  const A = ACT.days.from + f;
  const { width: w, height: h } = useVideoConfig();
  const Ly = layoutFor(w, h);
  const s = daysState(A, Ly);
  const dimIn = prog(f, 0, 24, E.smooth);
  const colDim = (d: number) => 1 - 0.72 * dimIn * (1 - clamp(1 - Math.abs(d - s.colF)));
  const card = (c: Course) => {
    const hits = TARGETS.filter((t) => t.course.id === c.id && A >= t.f);
    return { ring: hits.length ? A - hits[hits.length - 1].f : -1 };
  };

  // Wednesday's chip keeps its place and changes its text on each step of the ladder
  const wed = VISITS[2];
  const wedCaps = DAYS_CAP.filter((c) => c.day === 2);
  const wedOn = A >= wed.hit - 1 && A < wedCaps[wedCaps.length - 1].out + 12;
  const wedCur = [...wedCaps].reverse().find((c) => A >= c.in) ?? wedCaps[0];
  const wedP = prog(A, wed.hit - 1, wed.hit + 18, E.out) * (1 - prog(A, wedCaps[wedCaps.length - 1].out, wedCaps[wedCaps.length - 1].out + 10, E.smooth));
  const stepP = prog(A, wedCur.in - 1, wedCur.in + 8, E.out);

  const stmtY = (id: string) => (Ly.vertical && id === 'week7' ? 1140 : Ly.stmt.y);
  return (
    <AbsoluteFill style={{ background: C.ink, overflow: 'hidden' }}>
      <div style={camera(s.cam)}>
        <Planning today={s.today} colDim={colDim} card={card} line={s.line} />
      </div>
      {['midi', 'age', 'week7'].map((id) => (
        <Statement key={id} id={id} f={f} offset={ACT.days.from} x={Ly.stmt.x} y={stmtY(id)} w={Ly.stmt.w} band={Ly.vertical ? w : 0} />
      ))}
      {DAYS_CAP.filter((c) => c.day !== 2).map((c) => (
        <Caption key={c.id} id={c.id} f={f} offset={ACT.days.from} x={Ly.cap.x} y={Ly.cap.y} w={Ly.cap.w} />
      ))}
      {wedOn && wedP > 0 && (
        <div
          style={{
            position: 'absolute', left: 0, top: 0, maxWidth: Ly.cap.w,
            transform: `translate(${Ly.cap.x}px, ${Ly.cap.y + (1 - arrive(wedP)) * 28}px)`,
            opacity: wedP, background: C.card, borderLeft: `6px solid ${C.orange}`, padding: '18px 28px 20px 26px',
          }}
        >
          <div data-text={wedCur.id} style={{ ...typeStyle('caption', TYPE.caption.size), color: C.white, whiteSpace: 'normal', opacity: wedCur === wedCaps[0] ? 1 : 0.4 + 0.6 * stepP }}>
            {copy(wedCur.id).text}
          </div>
        </div>
      )}
    </AbsoluteFill>
  );
};

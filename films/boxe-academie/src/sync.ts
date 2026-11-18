// The film's sound events, computed from the picture code (scripts/export-cues.ts -> out/cues.json
// -> scripts/audio/score.py). Discrete state changes get a sound; continuous motion (the whips,
// the slides, the ripple) is carried by the music. Every class that is sounded is sounded every time.
import { PUSH } from './acts/Week';
import { SCATTER_ABS } from './acts/End';
import { E } from './lib/anim';
import { peak } from './lib/sync';
import { ACT, CUE, FPS, KEEP, TOTAL, VISITS } from './timeline';

export type Kind = 'tick' | 'tock' | 'hit' | 'land' | 'pop' | 'whoosh' | 'riser' | 'drop' | 'key' | 'click' | 'snap' | 'swell' | 'bell' | 'suck';
export type SoundEvent = { f: number; kind: Kind; weight?: number; pan?: number; pitch?: number | string; apexFrac?: number; dur?: number; variant?: string; id?: string };

const sec = (s: number) => Math.round(s * FPS);
const actOf = (f: number) => Object.entries(ACT).find(([, a]) => f >= a.from && f < a.from + a.dur)?.[0] ?? 'tail';
const move = (m: { from: number; to: number; ease: (t: number) => number }, weight: number, pan: number, id: string): SoundEvent => {
  const apex = peak(m.from, m.to, m.ease);
  return { f: apex, kind: 'whoosh', weight, pan, dur: Math.max(sec(0.3), m.to - m.from), apexFrac: Math.min(0.95, Math.max(0.05, (apex - m.from) / (m.to - m.from))), id };
};

export default function cues(): SoundEvent[] {
  const ev: SoundEvent[] = [];
  // Hook: each hour label lands on its 8th; the pops climb.
  [CUE.h1, CUE.h2, CUE.h3, CUE.h4, CUE.h5].forEach((f, i) => ev.push({ f, kind: 'pop', weight: 0.8, id: `hour${i + 1}` }));
  // The dot keeps time once in each hold: a soft tick, the same every time.
  KEEP.forEach((f, i) => ev.push({ f, kind: 'tick', weight: 0.45, id: `keep${i + 1}` }));
  // The planning builds around the line: the music drops.
  ev.push({ f: CUE.grid, kind: 'drop', weight: 1, id: 'grid' });
  // The dive into Monday: the film's first camera-scale move.
  ev.push(move({ from: ACT.week.from + PUSH.from, to: ACT.week.from + PUSH.to, ease: E.smooth }, 0.7, 0, 'push'));
  // The line lands on one course a day: one tuned note per day, climbing (progress motif).
  VISITS.forEach((v, i) => {
    ev.push({ f: v.hit, kind: 'pop', weight: 0.9, id: `day${i + 1}` });
    (v.ladder ?? []).forEach((s, k) => ev.push({ f: s.f, kind: 'pop', weight: 1.2, id: `ladder${k + 1}` }));
  });
  // Re-entry: the whole week lights up.
  ev.push({ f: CUE.promise, kind: 'hit', weight: 0.9, id: 'promise' });
  // The planning clears, the line lands under ACADÉMIE: one soft resolved bell when it is readable.
  ev.push(move(SCATTER_ABS, 0.6, 0, 'scatter'));
  ev.push({ f: SCATTER_ABS.from + 16, kind: 'bell', weight: 0.7, id: 'underline' });
  // APPELER: the ring pops on the button.
  ev.push({ f: CUE.call + 14, kind: 'click', variant: 'confirm', weight: 0.8, id: 'call' });

  for (const e of ev) {
    if (!(e.f >= 0 && e.f < TOTAL)) throw new Error(`sync: ${e.id} at f=${e.f} is outside the film`);
    e.id = `${actOf(e.f)}:${e.id}`;
  }
  return ev;
}

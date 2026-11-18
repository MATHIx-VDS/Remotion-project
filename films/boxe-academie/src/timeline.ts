// The single source of truth for time. Picture (src/acts), sound (src/sync.ts -> out/cues.json)
// and QA (scripts/grid-check.ts) all import this file. Bars and beats, never seconds.
// Keep it free of React and CSS imports: Node scripts load it directly.
import { course, DAYS, detail } from './data';

export const FPS = 60;
export const BPM = 120;
export const W = 1920;
export const H = 1080;

export const BEAT = (60 / BPM) * FPS; // 30 f
export const BAR = BEAT * 4; // 120 f = 2 s
/** Absolute frame of bar (1-based), beat (0-3), 16th (0-3). */
export const b = (bar: number, beat = 0, sub = 0) => Math.round(((bar - 1) * 4 + beat) * BEAT + sub * (BEAT / 4));
/** A choreography length in 60 fps frames, converted to this film's fps. */
export const f60 = (frames: number) => Math.round((frames * FPS) / 60);

export const TAIL = 72; // the URL reads >= 1.7 s, then the audio decays to zero

// Acts: contiguous and bar-aligned.
export const ACT = {
  hook: { from: b(1), dur: b(3) - b(1) }, // 0-4 s: the now-line counts the day 10h -> 21h; "Quand tu veux."
  week: { from: b(3), dur: b(4) - b(3) }, // 4-6 s: the line lands in the real planning; wide week, push to Monday
  days: { from: b(4), dur: b(12) - b(4) }, // 6-22 s: one day per bar (Wednesday two): the line finds a course for each profile
  end: { from: b(12), dur: b(14) + TAIL - b(12) }, // 22-27 s: pull back, "Un cours pour toi.", wordmark, URL, APPELER
};
export const TOTAL = b(14) + TAIL; // 1620 f = 27 s

/** The hook's hour steps: the grid's own axis labels, one per 8th. */
export const HOURS = ['10h', '12h', '15h', '18h', '21h'];

// One visit per day. `at` is the bar the camera lands on the day; `hit` is where the now-line
// lands on the day's course (contact frame, on the 16th grid); `ladder` steps the line down
// Wednesday's column from 4 years old to adults, one card per beat.
export type Visit = { day: number; at: number; hit: number; course: ReturnType<typeof course>; ladder?: { f: number; course: ReturnType<typeof course> }[] };
export const VISITS: Visit[] = [
  { day: 0, at: b(4), hit: b(4, 0, 3), course: course(0, '12:15', 'Cross Boxing') },
  { day: 1, at: b(5), hit: b(5, 0, 3), course: course(1, '19:00', 'MMA') },
  {
    day: 2,
    at: b(6),
    hit: b(6, 0, 3),
    course: course(2, '15:30', 'Baby Boxe'),
    ladder: [
      { f: b(7, 0), course: course(2, '16:30', 'Kick Boxing') },
      { f: b(7, 1), course: course(2, '17:30', 'Kick Boxing') },
      { f: b(7, 2), course: course(2, '18:30', 'Kick Boxing') },
    ],
  },
  { day: 3, at: b(8), hit: b(8, 0, 3), course: course(3, '17:30', 'MMA') },
  { day: 4, at: b(9), hit: b(9, 0, 3), course: course(4, '20:00', 'Lady Boxe') },
  { day: 5, at: b(10), hit: b(10, 0, 3), course: course(5, '15:30', 'Open Mat') },
  { day: 6, at: b(11), hit: b(11, 0, 3), course: course(6, '10:00', 'BodyBoxe') },
];
/** Camera whip into a day: lands on the day's bar line. */
export const WHIP = f60(30);
/** The line's slide to a course: ends on its contact frame. */
export const SLIDE = f60(22);

export const CUE = {
  h1: b(1, 0), // hour readout steps, one per 8th
  h2: b(1, 0, 2),
  h3: b(1, 1),
  h4: b(1, 1, 2),
  h5: b(1, 2),
  beat1: b(2, 1), // the dot keeps time while "Quand tu veux." is read
  beat2: b(2, 2),
  grid: b(3), // the planning appears around the line: drop 1
  built: b(3, 1), // the last column lands
  push: b(3, 2), // push-in with a roll swing toward Monday
  roll: b(3, 3), // the roll swing peaks
  mon: b(4),
  whipTue: b(4, 3), // each whip starts a beat before its day
  tue: b(5),
  whipWed: b(5, 3),
  wed: b(6), // payoff: the ladder from 4 years old (drop 2, the loudest moment)
  ladder: b(7),
  whipThu: b(7, 3),
  thu: b(8),
  whipFri: b(8, 3),
  fri: b(9),
  whipSat: b(9, 3),
  sat: b(10), // breakdown: Saturday and Sunday
  whipSun: b(10, 3),
  sun: b(11),
  sunTick: b(11, 3), // the dot keeps time once more before the pull-back
  promise: b(12), // re-entry: pull back, every course lights up
  lit: b(12, 0, 2), // every course lights up, left to right
  scatter: b(13, 1), // the planning clears and leaves the wordmark
  lockup: b(13, 1, 2), // the wordmark is clear
  url: b(13, 2),
  call: b(13, 2, 2), // APPELER lands
  end: b(14),
  // the dot keeps time once in each hold (a visible pulse and a soft tick)
  keep4: b(4, 2),
  keep5: b(5, 2),
  keep6: b(6, 3),
  keep8: b(8, 2),
  keep9: b(9, 2),
  keep10: b(10, 2),
  keep12: b(12, 3),
  keep13: b(13),
};
/** Every frame the dot keeps time on, outside the landings. */
export const KEEP = [CUE.beat1, CUE.beat2, CUE.keep4, CUE.keep5, CUE.keep6, CUE.keep8, CUE.keep9, CUE.keep10, CUE.sunTick, CUE.keep12, CUE.keep13];

export type Copy = {
  id: string;
  text: string;
  in: number;
  resolved: number;
  out: number;
  kind?: 'copy' | 'ui';
};

const line = (id: string, text: string, inF: number, out: number, stagger = 6, dur = 26): Copy => ({
  id,
  text,
  in: inF,
  resolved: inF + (text.split(' ').length - 1) * stagger + dur,
  out,
});
const ui = (id: string, text: string, inF: number, resolved: number, out: number): Copy => ({ id, text, in: inF, resolved, out, kind: 'ui' });

const V = VISITS;
/** Course-detail chips, one per landing (Wednesday's ladder included), with their day. */
export const DAYS_CAP: (Copy & { day: number })[] = V.flatMap((v) => {
  const first = { ...ui(`cap-${DAYS[v.day]}`, detail(v.course), v.hit, v.hit + 18, v.ladder ? v.ladder[0].f - 2 : v.at + 100), day: v.day };
  const steps = (v.ladder ?? []).map((s, i, a) => ({ ...ui(`cap-ladder${i + 1}`, detail(s.course), s.f, s.f + 12, i < a.length - 1 ? a[i + 1].f - 2 : v.at + 210), day: v.day }));
  return [first, ...steps];
});

// Every on-screen word. The statements are the film's voice (budgeted); course details, hour
// labels, the wordmark and the URL are the club's own strings (kind 'ui').
export const COPY: Copy[] = [
  ...HOURS.map((h, i) => ui(`hour${i + 1}`, h, [CUE.h1, CUE.h2, CUE.h3, CUE.h4, CUE.h5][i], [CUE.h1, CUE.h2, CUE.h3, CUE.h4, CUE.h5][i] + 8, i < 4 ? [CUE.h2, CUE.h3, CUE.h4, CUE.h5][i] : b(2, 3, 1))),
  line('hook', 'Quand tu veux.', b(1, 3), b(2, 2, 2)),
  line('midi', 'Même à midi.', V[0].at + 6, V[0].at + 100),
  line('age', 'Dès 4 ans.', V[2].hit + 7, V[2].at + 210),
  line('week7', '7 jours sur 7.', V[6].at + 6, V[6].at + 110),
  ...DAYS_CAP,
  line('promise', 'Un cours pour toi.', b(12, 1), b(13, 0, 2)),
  ui('wordmark', 'BOXE ACADÉMIE BRIVE', CUE.scatter, CUE.lockup + 8, TOTAL),
  ui('url', 'boxe-academie.fr', CUE.url, CUE.url + 20, TOTAL),
  ui('call', 'APPELER', CUE.call, CUE.call + 18, TOTAL),
];

export const copy = (id: string): Copy => {
  const c = COPY.find((x) => x.id === id);
  if (!c) throw new Error(`timeline: no COPY entry "${id}"`);
  return c;
};

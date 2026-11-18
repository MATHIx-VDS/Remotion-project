// The club's real weekly schedule (boxe-academie.fr planning page), the single source of every
// label in the film: day, time, course name, audience. Start times are the site's; end times are
// estimated from the card heights on the capture and are NEVER shown on screen (they only size cards).
// Asserts run at module load, so wrong data fails the render and the cue export.

export type Bar = 'orange' | 'peach' | 'white' | 'grey';
export type Course = {
  id: string;
  day: number; // 0 = lundi .. 6 = dimanche
  start: string; // "HH:MM" as on the site
  end: string; // estimated, sizes the card only
  name: string;
  audience: string;
  bar: Bar;
};

export const DAYS = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'];
export const DAY_SHORT = ['LUN', 'MAR', 'MER', 'JEU', 'VEN', 'SAM', 'DIM'];

const row = (day: number, start: string, end: string, name: string, audience: string, bar: Bar): Omit<Course, 'id'> => ({
  day, start, end, name, audience, bar,
});

const RAW = [
  row(0, '12:15', '13:00', 'Cross Boxing', 'Tous niveaux', 'grey'),
  row(0, '18:00', '19:30', 'Boxe Anglaise', 'Ados & adultes', 'orange'),
  row(0, '18:00', '19:00', 'BodyBoxe', 'Tous niveaux', 'white'),
  row(0, '19:00', '20:30', 'MMA Global', 'Adultes', 'peach'),
  row(0, '19:30', '21:00', 'Boxe Thaï · K1', 'Adultes', 'peach'),
  row(1, '18:00', '19:00', 'BodyBoxe', 'Tous niveaux', 'white'),
  row(1, '19:00', '20:30', 'Boxe Anglaise', 'Adultes', 'orange'),
  row(1, '19:00', '20:30', 'MMA', 'Adultes', 'peach'),
  row(1, '20:30', '21:30', 'Lady Boxe', 'Femmes', 'orange'),
  row(2, '15:30', '16:15', 'Baby Boxe', '4 à 6 ans', 'orange'),
  row(2, '16:30', '17:30', 'Kick Boxing', '7 à 10 ans', 'peach'),
  row(2, '17:30', '18:30', 'Boxe Éducative', 'Enfants / ados', 'orange'),
  row(2, '17:30', '18:30', 'Kick Boxing', '11 à 14 ans', 'peach'),
  row(2, '18:30', '20:00', 'Boxe Anglaise', 'Ados & adultes', 'orange'),
  row(2, '18:30', '20:00', 'Kick Boxing', 'Adultes', 'peach'),
  row(2, '20:00', '21:30', 'Boxe Française', 'Ados & adultes', 'peach'),
  row(3, '17:30', '19:00', 'MMA', 'Ados', 'peach'),
  row(3, '18:30', '19:30', 'BodyBoxe', 'Tous niveaux', 'white'),
  row(3, '19:00', '20:30', 'MMA', 'Adultes', 'peach'),
  row(3, '19:30', '21:00', 'Boxe Anglaise', 'Adultes', 'orange'),
  row(4, '17:30', '18:30', 'Boxe Éducative', 'Enfants / ados', 'orange'),
  row(4, '18:30', '20:00', 'Boxe Anglaise', 'Ados & adultes', 'orange'),
  row(4, '19:00', '20:30', 'MMA', 'Adultes', 'peach'),
  row(4, '20:00', '21:00', 'Lady Boxe', 'Femmes', 'orange'),
  row(5, '10:30', '12:00', 'Kick Boxing', 'Tout âge', 'peach'),
  row(5, '10:30', '12:00', 'Boxe Française', 'Ados & adultes', 'peach'),
  row(5, '14:00', '15:30', 'MMA', 'Ados', 'peach'),
  row(5, '15:30', '17:30', 'Open Mat', '16 ans et plus', 'grey'),
  row(6, '10:00', '11:30', 'BodyBoxe', 'Tous niveaux', 'white'),
];

const slug = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-');
export const COURSES: Course[] = RAW.map((c) => ({ ...c, id: `${DAY_SHORT[c.day].toLowerCase()}-${c.start.replace(':', '')}-${slug(c.name)}` }));

/** "HH:MM" -> hours as a number (18:30 -> 18.5). */
export const hours = (hhmm: string) => {
  const [h, m] = hhmm.split(':').map(Number);
  return h + m / 60;
};
export const GRID = { from: 10, to: 21.5 }; // the site's grid: 10h .. 21h30

/** Is the audience an age range? Then it joins the time line on the card, as on the site. */
export const isAge = (aud: string) => /\bans\b/.test(aud);
/** Card first line: "15:30 · 4 à 6 ans" when the audience is an age, else the time alone. */
export const cardTimeLine = (c: Course) => (isAge(c.audience) ? `${c.start} · ${c.audience}` : c.start);
/** The detail line the film reads out: "Mercredi · Baby Boxe · 15:30 · 4 à 6 ans". */
export const detail = (c: Course) => [DAYS[c.day], c.name, c.start, ...(isAge(c.audience) ? [c.audience] : [])].join(' · ');

export const byDay = (d: number) => COURSES.filter((c) => c.day === d).sort((a, b) => hours(a.start) - hours(b.start));
export const course = (day: number, start: string, name: string) => {
  const c = COURSES.find((x) => x.day === day && x.start === start && x.name === name);
  if (!c) throw new Error(`data.ts: no course ${DAYS[day]} ${start} ${name}`);
  return c;
};

/**
 * Side-by-side layout for overlapping cards: each course gets a lane (0 or 1) and the number of
 * lanes in its overlap group (1 or 2), exactly as the site splits a column.
 */
export const lanes = (d: number) => {
  const list = byDay(d);
  const out = new Map<string, { lane: number; of: number }>();
  const overlaps = (a: Course, b: Course) => hours(a.start) < hours(b.end) && hours(b.start) < hours(a.end);
  for (const c of list) {
    const busy = list.filter((o) => o !== c && out.has(o.id) && overlaps(o, c)).map((o) => out.get(o.id)!.lane);
    out.set(c.id, { lane: busy.includes(0) ? 1 : 0, of: 1 });
  }
  for (const c of list) if (list.some((o) => o !== c && overlaps(o, c))) out.get(c.id)!.of = 2;
  return out;
};

// ---------------------------------------------------------------- asserts
const assert = (ok: boolean, msg: string) => {
  if (!ok) throw new Error(`data.ts: ${msg}`);
};
assert(COURSES.length === 29, `29 courses expected, got ${COURSES.length}`);
const PER_DAY = [5, 4, 7, 4, 4, 4, 1];
PER_DAY.forEach((n, d) => assert(byDay(d).length === n, `${DAYS[d]}: ${n} courses expected, got ${byDay(d).length}`));
assert(new Set(COURSES.map((c) => c.id)).size === COURSES.length, 'duplicate course ids');
for (const c of COURSES) {
  const s = hours(c.start);
  const e = hours(c.end);
  assert(s >= GRID.from && s <= 21, `${c.id}: starts outside 10h-21h`);
  assert(Math.abs(s * 4 - Math.round(s * 4)) < 1e-9, `${c.id}: start not on a quarter hour`);
  assert(e > s && e <= GRID.to, `${c.id}: ends after 21h30 or before it starts`);
}
for (let d = 0; d < 7; d++) {
  const list = byDay(d);
  for (const c of list) {
    const t = hours(c.start) + 1e-6;
    const live = list.filter((o) => hours(o.start) <= t && t < hours(o.end)).length;
    assert(live <= 2, `${DAYS[d]} ${c.start}: more than 2 overlapping courses`);
  }
}
// the film's examples must be real rows (BRIEF §4)
assert(detail(course(1, '19:00', 'MMA')) === 'Mardi · MMA · 19:00', 'Mardi MMA example');
assert(detail(course(2, '15:30', 'Baby Boxe')) === 'Mercredi · Baby Boxe · 15:30 · 4 à 6 ans', 'Baby Boxe example');
assert(detail(course(5, '15:30', 'Open Mat')) === 'Samedi · Open Mat · 15:30 · 16 ans et plus', 'Open Mat example');
assert(detail(course(6, '10:00', 'BodyBoxe')) === 'Dimanche · BodyBoxe · 10:00', 'Dimanche example');
// the story's facts: youngest is 4, the earliest course is at midday or before, every day has a course
assert(COURSES.some((c) => c.audience === '4 à 6 ans'), '"Dès 4 ans" needs a 4-6 course');
assert(COURSES.some((c) => c.day === 0 && c.start === '12:15'), '"Même à midi" needs the Monday 12:15 course');
assert(PER_DAY.every((n) => n > 0), '"7 jours sur 7" needs a course every day');

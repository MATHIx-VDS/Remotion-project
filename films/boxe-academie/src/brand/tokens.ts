// Brand tokens for Boxe Académie Brive: the only place a colour, face or type size is written.
// cinetic:brand-supplied orange and peach accents (Boxe Académie Brive): the club's own colours,
// recorded in BRIEF.md as exceptions to the orange ban. Values from the client brief (site look).
import type React from 'react';
import { safeInsets } from '../lib/safe';
import { H, W } from '../timeline';

export const C = {
  ink: '#141415', // the stage: the site's warm-free near-black
  surface: '#1C1C1E', // calendar columns
  card: '#232326', // course cards
  line: '#2C2C30', // hour lines and separators (1 px hairlines)
  white: '#FFFFFF', // course titles, days
  mute: '#9A9AA0', // the audience line, grid hours
  // The one accent and its meaning: "maintenant / ton cours". Header bar, APPELER, ACADÉMIE,
  // course times, the now-line, AUJOURD'HUI. Sparse except one designed flood.
  orange: '#EE6A3A', // cinetic:brand-supplied orange (Boxe Académie Brive)
  peach: '#F4A66A', // cinetic:brand-supplied peach: side bar of the other combat sports
  grey: '#6E6E75', // side bar of Cross Boxing and Open Mat
  todayTint: '#292120', // orange at ~6% over surface: today's column
  litCard: '#6A3C2D', // cinetic:brand-supplied orange at 35% over card: "ton cours" (the promise's one flood)
};

export const FONT = {
  display: '"Oswald Variable", system-ui, sans-serif', // condensed caps: wordmark, days, statements, APPELER
  text: '"Archivo Variable", system-ui, sans-serif', // card content: time, title, audience
};

/** Faces the FontGate waits for (one per weight in use). */
export const FACES = ['500 16px "Oswald Variable"', '600 16px "Oswald Variable"', '700 16px "Oswald Variable"', '400 16px "Archivo Variable"', '500 16px "Archivo Variable"', '700 16px "Archivo Variable"'];

/** Layout unit: 1 at 1080p on the short side. */
export const U = Math.min(W, H) / 1080;

// One token per role (px at 1080p). Display roles are condensed caps (Oswald), content is Archivo.
export const TYPE = {
  statement: { size: 150, weight: 600, track: 0.0, lead: 0.95, family: 'display' as const, caps: true },
  wordmark: { size: 132, weight: 600, track: 0.02, lead: 1.0, family: 'display' as const, caps: true },
  day: { size: 40, weight: 500, track: 0.06, lead: 1.0, family: 'display' as const, caps: true },
  label: { size: 20, weight: 600, track: 0.18, lead: 1.0, family: 'display' as const, caps: true }, // AUJOURD'HUI, menu
  button: { size: 34, weight: 600, track: 0.08, lead: 1.0, family: 'display' as const, caps: true },
  caption: { size: 46, weight: 500, track: 0.0, lead: 1.1, family: 'text' as const, caps: false },
  url: { size: 50, weight: 500, track: 0.0, lead: 1.1, family: 'text' as const, caps: false },
  cardTime: { size: 28, weight: 700, track: 0.0, lead: 1.15, family: 'text' as const, caps: false },
  cardTitle: { size: 34, weight: 700, track: -0.01, lead: 1.08, family: 'text' as const, caps: false },
  cardAud: { size: 26, weight: 400, track: 0.0, lead: 1.15, family: 'text' as const, caps: false },
  hour: { size: 26, weight: 500, track: 0.0, lead: 1.0, family: 'text' as const, caps: false },
};

/** CSS for a type role. Tabular figures always. */
export const typeStyle = (role: keyof typeof TYPE, size = TYPE[role].size * U): React.CSSProperties => ({
  fontFamily: FONT[TYPE[role].family],
  fontSize: size,
  fontWeight: TYPE[role].weight,
  letterSpacing: `${TYPE[role].track}em`,
  lineHeight: TYPE[role].lead,
  textTransform: TYPE[role].caps ? 'uppercase' : 'none',
  fontVariantNumeric: 'tabular-nums',
  whiteSpace: 'pre',
});

export const safeArea = (w: number, h: number) => {
  const i = safeInsets(undefined, w, h);
  return { x: Math.max(i.left, i.right), y: Math.max(i.top, i.bottom) };
};
export const SAFE = safeArea(W, H);

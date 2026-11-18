// World geometry of the planning page (world px), and the framing for each aspect. Node-safe.
import { GRID, hours, lanes, type Course } from '../data';
import type { Shot } from '../lib/camera';

export const AXIS = 120; // hour labels column
export const COLW = 640;
export const GAP = 6;
export const HOUR = 170; // 1 hour = 170 world px, constant
export const HEADER_H = 124;
export const DAYROW = { top: 150, h: 104 };
export const Y0 = 272; // 10h
export const WORLD_W = AXIS + 7 * COLW + 6 * GAP + 40;
export const GRID_BOTTOM = Y0 + (GRID.to - GRID.from) * HOUR;
export const WORLD_H = GRID_BOTTOM + 30;

export const colX = (d: number) => AXIS + d * (COLW + GAP);
export const colC = (d: number) => colX(d) + COLW / 2;
export const yOf = (h: number) => Y0 + (h - GRID.from) * HOUR;

const LANES = Array.from({ length: 7 }, (_, d) => lanes(d));
/** A course's card rectangle in world px (side by side when two courses overlap, as on the site). */
export const cardRect = (c: Course) => {
  const l = LANES[c.day].get(c.id)!;
  const inner = COLW - 12;
  const w = inner / l.of - (l.of > 1 ? 3 : 0);
  return {
    x: colX(c.day) + 6 + l.lane * (inner / l.of + (l.of > 1 ? 1.5 : 0)),
    y: yOf(hours(c.start)) + 3,
    w,
    h: (hours(c.end) - hours(c.start)) * HOUR - 6,
    half: l.of > 1,
  };
};

export type Layout = {
  w: number;
  h: number;
  vertical: boolean;
  wide: Shot; // the whole planning (or what fits) in one look
  dayK: number; // camera scale on a day
  daySx: number; // screen x of the day column's centre
  lineSy: number; // screen y the now-line rests on in day view
  stmt: { x: number; y: number; w: number; align: 'left' | 'center' }; // statement box (top-left corner, width)
  cap: { x: number; y: number; w: number }; // caption chip
  hook: { x: number; lineY: number; size: number };
  end: { cy: number };
};

export const layoutFor = (w: number, h: number): Layout => {
  const vertical = h > w;
  if (!vertical) {
    const k = Math.min(w / WORLD_W, h / WORLD_H) * 0.985;
    return {
      w, h, vertical,
      wide: { ax: WORLD_W / 2, ay: WORLD_H / 2, sx: w / 2, sy: h / 2, k },
      dayK: 1.0,
      daySx: 600,
      lineSy: 400,
      stmt: { x: 1010, y: 300, w: 820, align: 'left' },
      cap: { x: 96, y: 908, w: 1728 },
      hook: { x: 96, lineY: 560, size: 300 },
      end: { cy: 470 },
    };
  }
  // 9:16 Reel: day by day. The "wide" look is the first two days, readable; the feed's caption
  // and button zones (bottom 420 px, right 120 px) carry only the planning's own surface.
  const k = w / (AXIS + 2 * COLW + GAP + 30);
  return {
    w, h, vertical,
    wide: { ax: (AXIS + 2 * COLW + GAP + 30) / 2, ay: Y0 + 4.2 * HOUR, sx: w / 2, sy: h * 0.47, k },
    dayK: 1.42,
    daySx: w / 2,
    lineSy: 760,
    stmt: { x: 64, y: 300, w: w - 128, align: 'left' },
    cap: { x: 64, y: 1330, w: w - 184 },
    hook: { x: 64, lineY: 980, size: 300 },
    end: { cy: 780 },
  };
};

/** The day-view shot: column `d` centred at daySx, world time `t` (hours) on the line's rest y. */
export const dayShot = (L: Layout, d: number, t: number): Shot => ({ ax: colC(d), ay: yOf(t), sx: L.daySx, sy: L.lineSy, k: L.dayK });

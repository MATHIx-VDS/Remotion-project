// Time for the textile spot: 120 BPM, 60 fps, 4 bars + tail = 8.5 s. Node-safe.
export const FPS = 60;
export const BPM = 120;
export const W = 1080;
export const H = 1920;
export const BEAT = (60 / BPM) * FPS; // 30 f
export const BAR = BEAT * 4;
export const b = (bar: number, beat = 0, sub = 0) => Math.round(((bar - 1) * 4 + beat) * BEAT + sub * (BEAT / 4));
export const f60 = (frames: number) => Math.round((frames * FPS) / 60);
export const TAIL = 30;

export const ACT = {
  tee: { from: b(1), dur: b(3) - b(1) }, // the technical tee turns in the light, dolly in
  hood: { from: b(3), dur: b(5) + TAIL - b(3) }, // the hoodie arrives on the drop, orbit to the front hero
};
export const TOTAL = b(5) + TAIL; // 510 f = 8.5 s

export const CUE = {
  open: b(1), // frame 0 is already moving: dolly and turn
  beam: b(1, 2), // the spotlight finds the tee
  swing: b(2), // the tee swings through its turn
  exit: b(2, 3), // the tee whips out left (accelerating)
  drop: b(3), // the hoodie arrives from the right on the drop
  turn: b(3, 2),
  front: b(4), // the hoodie faces front: orbit ends
  hero: b(4, 2), // rim light flares, the push lands on the chest logo
  end: b(5),
};

export type Copy = { id: string; text: string; in: number; resolved: number; out: number; kind?: 'copy' | 'ui' };
export const COPY: Copy[] = []; // brief: no text
export const copy = (id: string): Copy => {
  const c = COPY.find((x) => x.id === id);
  if (!c) throw new Error(`timeline: no COPY entry "${id}"`);
  return c;
};

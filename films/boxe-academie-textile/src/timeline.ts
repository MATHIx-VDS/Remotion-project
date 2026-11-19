// Time for the textile spot: 120 BPM, 60 fps, 8 bars + tail = 16.5 s. Node-safe.
export const FPS = 60;
export const BPM = 120;
export const W = 1080;
export const H = 1920;
export const BEAT = (60 / BPM) * FPS; // 30 f
export const BAR = BEAT * 4;
export const b = (bar: number, beat = 0, sub = 0) => Math.round(((bar - 1) * 4 + beat) * BEAT + sub * (BEAT / 4));
export const f60 = (frames: number) => Math.round((frames * FPS) / 60);
export const TAIL = 30;

// One product per shot, each arriving from the right on a downbeat at the previous one's exit speed.
export const ACT = {
  tee: { from: b(1), dur: b(3) - b(1) }, // technical tee: opening, dolly in through the beam
  coco: { from: b(3), dur: b(4) - b(3) }, // tee-shirt Coconut Milk
  noir: { from: b(4), dur: b(5) - b(4) }, // tee-shirt noir
  bonnet: { from: b(5), dur: b(6) - b(5) },
  sac: { from: b(6), dur: b(7) - b(6) }, // sac de sport
  hood: { from: b(7), dur: b(9) + TAIL - b(7) }, // the hoodie: orbit to the front, push onto the BA logo
};
export const TOTAL = b(9) + TAIL; // 990 f = 16.5 s

export const CUE = {
  beam: b(1, 2), // the spotlight finds the first tee
  coco: b(3),
  noir: b(4),
  bonnet: b(5),
  sac: b(6),
  drop: b(7), // the hoodie arrives on the drop
  turn: b(7, 2),
  front: b(8), // the hoodie faces front
  hero: b(8, 2), // rim light flares, the push lands on the chest logo
  end: b(9),
};

export type Copy = { id: string; text: string; in: number; resolved: number; out: number; kind?: 'copy' | 'ui' };
export const COPY: Copy[] = []; // brief: no text
export const copy = (id: string): Copy => {
  const c = COPY.find((x) => x.id === id);
  if (!c) throw new Error(`timeline: no COPY entry "${id}"`);
  return c;
};

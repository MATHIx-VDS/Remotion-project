// The shots. Every product floats in the gym, turns in the light and leaves left, accelerating;
// the next one arrives from the right already moving at that speed (the cut hides in the motion).
// The hoodie closes: it orbits to face front, the rim light flares, the camera pushes onto BA.
import React from 'react';
import { useCurrentFrame, useVideoConfig } from 'remotion';
import { Garment, PRODUCTS } from '../Garment';
import { Gym } from '../Gym';
import { E, hitPulse, lmix, mix, prog } from '../lib/anim';
import { ACT, CUE, f60 } from '../timeline';

const EXIT = f60(24);
const EXIT_PX = 520;
const ENTER_PX = 640;
type Act = { from: number; dur: number };
type ShotSpec = {
  which: keyof typeof PRODUCTS;
  act: Act;
  width: number; // fraction of the frame's width
  first?: boolean; // opens the film: no entrance, frame 0 already turning
  rot: [number, number]; // rotateY start -> end through the shot
  ripple: number; // breeze in the fabric (px); 0 for rigid things
  beam?: number; // absolute frame the spotlight flares on it
};

/** A product shot: enters from the right (unless first), turns, exits left into the cut. */
export const makeShot = (s: ShotSpec) => {
  const Shot: React.FC = () => {
    const f = useCurrentFrame();
    const { width: W, height: H } = useVideoConfig();
    const q = prog(f, s.act.dur - EXIT, s.act.dur, E.exit);
    const enter = s.first ? 1 : prog(f, -1, f60(64), E.out);
    const turn = prog(f, -10, s.act.dur - EXIT, E.smooth);
    const flare = s.beam !== undefined ? hitPulse(f - (s.beam - s.act.from), 3, 18) : hitPulse(f, 2, 14);
    const cam = {
      k: lmix(s.first ? 0.9 : 0.95, 1.05, prog(f, -20, s.act.dur, E.dolly)),
      o: mix(s.first ? -0.55 : 0.5, 0.3, turn) + 0.5 * q,
      flare: 0.4 * flare,
    };
    return (
      <Gym f={f + s.act.from} cam={cam}>
        <div style={{ position: 'absolute', left: 0, top: 0, width: W, height: H, transformOrigin: `${W / 2}px ${H * 0.46}px`, transform: `scale(${cam.k})` }}>
          <Garment
            id={`rip-${s.which}`} which={s.which} f={f + s.act.from}
            x={W / 2 + ENTER_PX * (1 - enter) - EXIT_PX * q}
            y={H * 0.46 + 12 * Math.sin((2 * Math.PI * (f + s.act.from)) / 150)}
            width={W * s.width}
            rotY={mix(s.rot[0], s.rot[1], turn) + 10 * (1 - enter) - 18 * q}
            rotZ={1.2 * Math.sin((2 * Math.PI * (f + s.act.from)) / 210) - 3 * q}
            ripple={s.ripple} rim={0.4 + 0.6 * flare}
          />
        </div>
      </Gym>
    );
  };
  return Shot;
};

export const Tee = makeShot({ which: 'tee', act: ACT.tee, width: 0.86, first: true, rot: [-24, 10], ripple: 5, beam: CUE.beam });
export const Coco = makeShot({ which: 'teeCoco', act: ACT.coco, width: 0.84, rot: [26, -8], ripple: 5 });
export const Noir = makeShot({ which: 'teeNoir', act: ACT.noir, width: 0.84, rot: [26, -8], ripple: 5 });
export const Bonnet = makeShot({ which: 'bonnet', act: ACT.bonnet, width: 0.7, rot: [28, -12], ripple: 1.5 });
export const Sac = makeShot({ which: 'sac', act: ACT.sac, width: 0.84, rot: [24, -10], ripple: 1 });

export const Hood: React.FC = () => {
  const f = useCurrentFrame();
  const { width: W, height: H } = useVideoConfig();
  const L = (a: number) => a - ACT.hood.from;
  const enter = prog(f, -1, f60(70), E.out); // already moving on the cut, at the previous exit speed
  const orbit = prog(f, -1, L(CUE.front), E.cam);
  const hero = prog(f, L(CUE.front) + f60(10), ACT.hood.dur, E.dolly);
  const flare = hitPulse(f - L(CUE.hero), 3, 22);
  const cam = { k: lmix(0.92, 1.0, orbit), o: mix(0.6, 0, orbit), flare: 0.5 * hitPulse(f, 2, 14) + 0.8 * flare };
  const gw = W * 0.84;
  const gx = W / 2 + ENTER_PX * (1 - enter);
  const gy = H * 0.46 + mix(10, 3, orbit) * Math.sin((2 * Math.PI * (f + 40)) / 150);
  const p = PRODUCTS.hood;
  const gh = (gw * p.h) / p.w;
  const ax = gx + (p.logo.x - 0.5) * gw; // the hero push lands on the BA chest logo
  const ay = gy + (p.logo.y - 0.5) * gh;
  const push = lmix(1, 1.12, hero);
  return (
    <div style={{ position: 'absolute', inset: 0, transformOrigin: `${ax}px ${ay}px`, transform: `scale(${push})` }}>
      <Gym f={f + ACT.hood.from} cam={cam}>
        <div style={{ position: 'absolute', left: 0, top: 0, width: W, height: H, transformOrigin: `${W / 2}px ${H * 0.46}px`, transform: `scale(${cam.k})` }}>
          <Garment
            id="rip-hood" which="hood" f={f}
            x={gx} y={gy} width={gw}
            rotY={mix(30, 0, orbit) + 10 * (1 - enter)} rotZ={mix(2.5, 0, orbit) * Math.sin((2 * Math.PI * f) / 200)}
            ripple={mix(5, 0, prog(f, L(CUE.turn), L(CUE.front) + f60(10), E.smooth))} rim={0.5 + 0.5 * flare}
          />
        </div>
      </Gym>
    </div>
  );
};

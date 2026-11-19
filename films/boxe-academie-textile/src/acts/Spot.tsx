// The two shots. Tee: frame 0 already turning, dolly in through the beam, then it whips out left,
// accelerating. Hoodie: arrives from the right on the drop at the tee's exit speed, orbits to face
// front on bar 4, the rim light flares and the camera pushes onto the BA chest logo.
import React from 'react';
import { useCurrentFrame, useVideoConfig } from 'remotion';
import { Garment, PRODUCTS } from '../Garment';
import { Gym } from '../Gym';
import { E, hitPulse, lmix, mix, prog } from '../lib/anim';
import { ACT, CUE, f60 } from '../timeline';

const EXIT = f60(24);
export const TEE_EXIT = { from: ACT.tee.from + ACT.tee.dur - EXIT, to: ACT.tee.from + ACT.tee.dur, ease: E.exit };
const EXIT_PX = 520;

export const Tee: React.FC = () => {
  const f = useCurrentFrame();
  const { width: W, height: H } = useVideoConfig();
  const L = (a: number) => a - ACT.tee.from;
  const q = prog(f, L(TEE_EXIT.from), L(TEE_EXIT.to), E.exit);
  const turn = prog(f, -10, L(CUE.exit), E.smooth);
  const cam = { k: lmix(0.9, 1.06, prog(f, -20, ACT.tee.dur, E.dolly)), o: mix(-0.55, 0.35, turn) + 0.5 * q, flare: 0.35 * hitPulse(f - L(CUE.beam), 3, 18) };
  return (
    <Gym f={f} cam={cam}>
      <div style={{ position: 'absolute', left: 0, top: 0, width: W, height: H, transformOrigin: `${W / 2}px ${H * 0.46}px`, transform: `scale(${cam.k})` }}>
        <Garment
          id="rip-tee" which="tee" f={f}
          x={W / 2 - EXIT_PX * q} y={H * 0.46 + 12 * Math.sin((2 * Math.PI * f) / 150)}
          width={W * 0.86}
          rotY={mix(-24, 10, turn) - 18 * q} rotZ={1.2 * Math.sin((2 * Math.PI * f) / 210) - 3 * q}
          ripple={5} rim={0.4 + 0.6 * hitPulse(f - L(CUE.beam), 3, 18)}
        />
      </div>
    </Gym>
  );
};

export const Hood: React.FC = () => {
  const f = useCurrentFrame();
  const { width: W, height: H } = useVideoConfig();
  const L = (a: number) => a - ACT.hood.from;
  const enter = prog(f, -1, f60(70), E.out); // already moving on the cut, at the tee's exit speed
  const orbit = prog(f, -1, L(CUE.front), E.cam);
  const hero = prog(f, L(CUE.front) + f60(10), ACT.hood.dur, E.dolly);
  const flare = hitPulse(f - L(CUE.hero), 3, 22);
  const cam = { k: lmix(0.92, 1.0, orbit), o: mix(0.6, 0, orbit), flare: 0.5 * hitPulse(f, 2, 14) + 0.8 * flare };
  const gw = W * 0.84;
  const gx = W / 2 + 640 * (1 - enter);
  const gy = H * 0.46 + mix(10, 3, orbit) * Math.sin((2 * Math.PI * (f + 40)) / 150);
  const p = PRODUCTS.hood;
  const gh = (gw * p.h) / p.w;
  // the hero push lands on the BA chest logo
  const ax = gx + (p.logo.x - 0.5) * gw;
  const ay = gy + (p.logo.y - 0.5) * gh;
  const push = lmix(1, 1.18, hero);
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

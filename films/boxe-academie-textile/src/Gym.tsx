// The set: a dark boxing gym at night. Every layer is a pure function of the frame and of a
// camera (dolly k, orbit o in -1..1). Plates are dithered PNGs (tools/plates.py); ropes, bags and
// dust are drawn here so they can move. Depth: room 0.25, ring/bags 0.6, dust 0.9, garment 1.
import React from 'react';
import { AbsoluteFill, Img, staticFile } from 'remotion';
import { C } from './brand/tokens';
import { rand } from './lib/anim';
import { FPS, H, W } from './timeline';

export type Cam = { k: number; o: number; flare: number };
const PW = 1300;
const PH = 2300;

/** A layer at depth d: dollies by k^d around the frame centre, orbits sideways by -o * shift * d. */
const layer = (cam: Cam, d: number, shift = 260): React.CSSProperties => ({
  position: 'absolute', left: 0, top: 0, width: W, height: H,
  transformOrigin: `${W / 2}px ${H * 0.46}px`,
  transform: `translate(${-cam.o * shift * d}px, 0px) scale(${cam.k ** d})`,
});

const Bag: React.FC<{ x: number; top: number; len: number; w: number; angle: number; rim: number }> = ({ x, top, len, w, angle, rim }) => (
  <div style={{ position: 'absolute', left: 0, top: 0, transformOrigin: '0 0', transform: `translate(${x}px, ${top}px) rotate(${angle}deg)` }}>
    <div style={{ position: 'absolute', left: -1.5, top: 0, width: 3, height: len * 0.32, background: '#3A3533' }} />
    <div style={{ position: 'absolute', left: -w / 2, top: len * 0.32, width: w, height: len, borderRadius: w * 0.22, background: C.bag, boxShadow: `inset ${-w * 0.08}px 0 0 ${C.orange}`, opacity: 1 }} />
    <div style={{ position: 'absolute', left: -w / 2, top: len * 0.32, width: w, height: len, borderRadius: w * 0.22, boxShadow: `inset ${-w * 0.05}px 0 ${w * 0.08}px rgba(238,106,58,${0.35 * rim})` }} />
  </div>
);

export const Gym: React.FC<{ f: number; cam: Cam; children?: React.ReactNode }> = ({ f, cam, children }) => {
  const t = f / FPS;
  const swing = 3.2 * Math.sin((2 * Math.PI * t) / 2.3 + 0.6); // the left bag swings gently
  const sway = 0.8 * Math.sin((2 * Math.PI * t) / 3.1);
  const beamBreath = 0.85 + 0.15 * Math.sin((2 * Math.PI * t) / 3.7);
  return (
    <AbsoluteFill style={{ background: C.ink, overflow: 'hidden' }}>
      {/* the room and its orange pool of light */}
      <div style={layer(cam, 0.25, 120)}>
        <Img src={staticFile('fx/room.png')} style={{ position: 'absolute', left: (W - PW) / 2, top: (H - PH) / 2, width: PW, height: PH, opacity: 1 }} />
        <Img src={staticFile('fx/room.png')} style={{ position: 'absolute', left: (W - PW) / 2, top: (H - PH) / 2, width: PW, height: PH, opacity: 0.55 * cam.flare, mixBlendMode: 'screen' }} />
      </div>
      {/* ring: corner post and three ropes, out of focus behind the garment */}
      <div style={{ ...layer(cam, 0.6), filter: 'blur(5px)' }}>
        <div style={{ position: 'absolute', left: 0, top: 0, width: 46, height: 820, background: '#201C1B', transform: `translate(${W * 0.06}px, ${H * 0.5}px)`, boxShadow: `inset -6px 0 0 ${C.orange}` }} />
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            style={{
              position: 'absolute', left: 0, top: 0, width: W * 1.6, height: 16, borderRadius: 8,
              background: C.rope, boxShadow: `inset 0 3px 0 rgba(238,106,58,0.55)`,
              transformOrigin: '0 50%',
              transform: `translate(${W * 0.06}px, ${H * (0.6 + i * 0.075)}px) rotate(${-4 + i * 0.6}deg)`,
            }}
          />
        ))}
      </div>
      {/* heavy bags hanging left and right, the left one swinging */}
      <div style={{ ...layer(cam, 0.6), filter: 'blur(4px)' }}>
        <Bag x={W * 0.08} top={-40} len={760} w={190} angle={swing} rim={1} />
        <Bag x={W * 0.95} top={-120} len={700} w={170} angle={sway} rim={0.6} />
      </div>
      {/* spotlight beam and haze */}
      <div style={layer(cam, 0.35, 140)}>
        <Img src={staticFile('fx/beam.png')} style={{ position: 'absolute', left: (W - PW) / 2, top: (H - PH) / 2, width: PW, height: PH, opacity: beamBreath }} />
        <Img src={staticFile('fx/haze.png')} style={{ position: 'absolute', left: (W - PW) / 2, top: (H - PH) / 2, width: PW, height: PH, transform: `translate(${-40 + f * 0.35}px, ${-f * 0.12}px)` }} />
      </div>
      {/* the garment */}
      {children}
      {/* dust in the light: drifts up, brighter inside the beam */}
      <div style={layer(cam, 0.9)}>
        {Array.from({ length: 70 }, (_, i) => {
          const x0 = rand(`dx${i}`) * W;
          const y0 = rand(`dy${i}`) * H;
          const sp = 0.25 + rand(`ds${i}`) * 0.6;
          const y = ((y0 - f * sp) % H + H) % H;
          const x = x0 + 18 * Math.sin(f / (70 + 40 * rand(`dw${i}`)) + i);
          const inBeam = Math.exp(-(((x / W - (0.62 - 0.25 * (y / H - 0.1))) / 0.16) ** 2));
          const s = 2 + rand(`dr${i}`) * 4;
          return (
            <div
              key={i}
              style={{
                position: 'absolute', left: 0, top: 0, width: s, height: s, borderRadius: '50%',
                background: '#FFE7D6', opacity: (0.08 + 0.55 * inBeam) * (0.5 + 0.5 * rand(`do${i}`)),
                transform: `translate(${x}px, ${y}px)`,
              }}
            />
          );
        })}
      </div>
    </AbsoluteFill>
  );
};

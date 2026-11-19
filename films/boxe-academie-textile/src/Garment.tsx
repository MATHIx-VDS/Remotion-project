// A product photo cut out (public/products), floating in the light. Transform-only placement:
// perspective turn (rotateY), a slow bob, a light "breeze" ripple (SVG displacement, a few px,
// back to zero for the hero so the print stays exactly the photo's), and an orange rim light.
import React from 'react';
import { Img, staticFile } from 'remotion';

export const PRODUCTS = {
  tee: { src: 'products/tee.png', w: 1239, h: 1211 },
  teeCoco: { src: 'products/tee-coco.png', w: 1047, h: 954 },
  teeNoir: { src: 'products/tee-noir.png', w: 1039, h: 1038 },
  bonnet: { src: 'products/bonnet.png', w: 1020, h: 1067 },
  sac: { src: 'products/sac.png', w: 1258, h: 1089 },
  hood: { src: 'products/hood.png', w: 1144, h: 1261, logo: { x: 0.33, y: 0.4 } }, // BA on the front chest
};

export const Garment: React.FC<{
  id: string; which: keyof typeof PRODUCTS; f: number; x: number; y: number; width: number;
  rotY: number; rotZ: number; ripple: number; rim: number;
}> = ({ id, which, f, x, y, width, rotY, rotZ, ripple, rim }) => {
  const p = PRODUCTS[which];
  const h = (width * p.h) / p.w;
  const r = Math.max(0, ripple);
  return (
    <div style={{ position: 'absolute', left: 0, top: 0, width, height: h, transformOrigin: '50% 50%', transform: `translate(${x - width / 2}px, ${y - h / 2}px) perspective(1800px) rotateY(${rotY}deg) rotateZ(${rotZ}deg)` }}>
      <svg width={0} height={0} style={{ position: 'absolute' }}>
        <filter id={id} x="-5%" y="-5%" width="110%" height="110%">
          <feTurbulence type="fractalNoise" baseFrequency="0.0035 0.011" numOctaves={2} seed={4} result="n" />
          <feOffset in="n" dx={(f * 0.9).toFixed(2)} dy={(f * 1.6).toFixed(2)} result="m" />
          <feDisplacementMap in="SourceGraphic" in2="m" scale={r.toFixed(2)} xChannelSelector="R" yChannelSelector="G" />
        </filter>
      </svg>
      <Img
        src={staticFile(p.src)}
        style={{
          width, height: h, display: 'block',
          filter: `${r > 0.05 ? `url(#${id}) ` : ''}drop-shadow(-7px -5px 9px rgba(238,106,58,${(0.25 + 0.5 * rim).toFixed(3)})) drop-shadow(0px 40px 60px rgba(0,0,0,0.55))`,
        }}
      />
    </div>
  );
};

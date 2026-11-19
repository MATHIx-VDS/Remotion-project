// Boxe Académie Brive, textile spot. Colours from the club's site.
// cinetic:brand-supplied orange (Boxe Académie Brive): the club's own accent, rim light and glow of the gym.
import type React from 'react';
import { safeInsets } from '../lib/safe';
import { H, W } from '../timeline';

export const C = {
  ink: '#0E0D0D', // the gym's black
  wall: '#141313',
  bag: '#1B1918', // heavy bags
  rope: '#2A2624', // ring ropes
  orange: '#EE6A3A', // cinetic:brand-supplied orange rim light
  white: '#FFFFFF',
  mute: '#9A9AA0',
};
export const FONT = { text: '"Archivo Variable", system-ui, sans-serif' };
export const FACES = ['400 16px "Archivo Variable"'];
export const U = Math.min(W, H) / 1080;
export const TYPE = { ui: { size: 24, weight: 400, track: 0, lead: 1.2 } };
export const typeStyle = (role: keyof typeof TYPE, size = TYPE[role].size * U): React.CSSProperties => ({
  fontFamily: FONT.text, fontSize: size, fontWeight: TYPE[role].weight, letterSpacing: `${TYPE[role].track}em`, lineHeight: TYPE[role].lead,
});
export const safeArea = (w: number, h: number) => {
  const i = safeInsets(undefined, w, h);
  return { x: Math.max(i.left, i.right), y: Math.max(i.top, i.bottom) };
};
export const SAFE = safeArea(W, H);

import React from 'react';
import { AbsoluteFill, getStaticFiles, Html5Audio, Sequence, staticFile } from 'remotion';
import { Hood, Tee } from './acts/Spot';
import { C } from './brand/tokens';
import { Audit } from './lib/Audit';
import { FontGate } from './lib/FontGate';
import type { SafeSpec } from './lib/safe';
import { ACT } from './timeline';

export const SOUNDTRACK = 'audio/soundtrack.wav';
export type FilmProps = { audit?: boolean; safe?: SafeSpec };

export const Film: React.FC<FilmProps> = ({ audit = false, safe }) => {
  const hasScore = getStaticFiles().some((s) => s.name === SOUNDTRACK);
  return (
    <FontGate>
      <AbsoluteFill style={{ background: C.ink }}>
        <Sequence from={ACT.tee.from} durationInFrames={ACT.tee.dur} name="1 Tee-shirt"><Tee /></Sequence>
        <Sequence from={ACT.hood.from} durationInFrames={ACT.hood.dur} name="2 Sweat"><Hood /></Sequence>
        {hasScore && <Html5Audio src={staticFile(SOUNDTRACK)} />}
        {audit && <Audit safe={safe} />}
      </AbsoluteFill>
    </FontGate>
  );
};

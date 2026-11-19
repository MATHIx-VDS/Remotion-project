import React from 'react';
import { AbsoluteFill, getStaticFiles, Html5Audio, Sequence, staticFile } from 'remotion';
import { Bonnet, Coco, Hood, Noir, Sac, Tee } from './acts/Spot';
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
        <Sequence from={ACT.coco.from} durationInFrames={ACT.coco.dur} name="2 Tee Coconut"><Coco /></Sequence>
        <Sequence from={ACT.noir.from} durationInFrames={ACT.noir.dur} name="3 Tee noir"><Noir /></Sequence>
        <Sequence from={ACT.bonnet.from} durationInFrames={ACT.bonnet.dur} name="4 Bonnet"><Bonnet /></Sequence>
        <Sequence from={ACT.sac.from} durationInFrames={ACT.sac.dur} name="5 Sac"><Sac /></Sequence>
        <Sequence from={ACT.hood.from} durationInFrames={ACT.hood.dur} name="6 Sweat"><Hood /></Sequence>
        {hasScore && <Html5Audio src={staticFile(SOUNDTRACK)} />}
        {audit && <Audit safe={safe} />}
      </AbsoluteFill>
    </FontGate>
  );
};

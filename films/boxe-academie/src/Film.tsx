import React from 'react';
import { AbsoluteFill, getStaticFiles, Html5Audio, Sequence, staticFile } from 'remotion';
import { Days } from './acts/Days';
import { End } from './acts/End';
import { Hook } from './acts/Hook';
import { Week } from './acts/Week';
import { C } from './brand/tokens';
import { Audit } from './lib/Audit';
import { FontGate } from './lib/FontGate';
import type { SafeSpec } from './lib/safe';
import { ACT } from './timeline';

export const SOUNDTRACK = 'audio/soundtrack.wav';
export type FilmProps = { audit?: boolean; safe?: SafeSpec };

/** One Sequence per act; every seam is designed inside the acts. Same component for 16:9 and 9:16. */
export const Film: React.FC<FilmProps> = ({ audit = false, safe }) => {
  const hasScore = getStaticFiles().some((s) => s.name === SOUNDTRACK);
  return (
    <FontGate>
      <AbsoluteFill style={{ background: C.ink }}>
        <Sequence from={ACT.hook.from} durationInFrames={ACT.hook.dur} name="1 Accroche">
          <Hook />
        </Sequence>
        <Sequence from={ACT.week.from} durationInFrames={ACT.week.dur} name="2 Semaine">
          <Week />
        </Sequence>
        <Sequence from={ACT.days.from} durationInFrames={ACT.days.dur} name="3 Jours">
          <Days />
        </Sequence>
        <Sequence from={ACT.end.from} durationInFrames={ACT.end.dur} name="4 Fin">
          <End />
        </Sequence>
        {hasScore && <Html5Audio src={staticFile(SOUNDTRACK)} />}
        {audit && <Audit safe={safe} />}
      </AbsoluteFill>
    </FontGate>
  );
};

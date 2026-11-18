import React from 'react';
import { Composition, Folder } from 'remotion';
import { Days } from './acts/Days';
import { End } from './acts/End';
import { Hook } from './acts/Hook';
import { Week } from './acts/Week';
import { C } from './brand/tokens';
import { Film, FilmProps } from './Film';
import { FilmSub, subMetadata } from './FilmSub';
import { Audit } from './lib/Audit';
import { FontGate } from './lib/FontGate';
import { ACT, FPS, H, TOTAL, W } from './timeline';

const solo = (Act: React.FC) => {
  const Solo: React.FC<FilmProps> = ({ audit = false, safe }) => (
    <FontGate>
      <div style={{ position: 'absolute', inset: 0, background: C.ink }}>
        <Act />
        {audit && <Audit safe={safe} />}
      </div>
    </FontGate>
  );
  return Solo;
};

const V = { w: 1080, h: 1920 }; // Instagram Reel, re-laid out from the same timeline

export const RemotionRoot: React.FC = () => (
  <>
    <Composition id="Film" component={Film} durationInFrames={TOTAL} fps={FPS} width={W} height={H} defaultProps={{ audit: false } as FilmProps} />
    <Composition id="FilmSub" component={FilmSub} durationInFrames={TOTAL} fps={FPS} width={W} height={H} defaultProps={{ groups: [] as number[] }} calculateMetadata={subMetadata} />
    <Composition id="Film9x16" component={Film} durationInFrames={TOTAL} fps={FPS} width={V.w} height={V.h} defaultProps={{ audit: false } as FilmProps} />
    <Composition id="Film9x16Sub" component={FilmSub} durationInFrames={TOTAL} fps={FPS} width={V.w} height={V.h} defaultProps={{ groups: [] as number[] }} calculateMetadata={subMetadata} />
    <Folder name="Acts">
      <Composition id="Act1" component={solo(Hook)} durationInFrames={ACT.hook.dur} fps={FPS} width={W} height={H} defaultProps={{ audit: false } as FilmProps} />
      <Composition id="Act2" component={solo(Week)} durationInFrames={ACT.week.dur} fps={FPS} width={W} height={H} defaultProps={{ audit: false } as FilmProps} />
      <Composition id="Act3" component={solo(Days)} durationInFrames={ACT.days.dur} fps={FPS} width={W} height={H} defaultProps={{ audit: false } as FilmProps} />
      <Composition id="Act4" component={solo(End)} durationInFrames={ACT.end.dur} fps={FPS} width={W} height={H} defaultProps={{ audit: false } as FilmProps} />
    </Folder>
  </>
);

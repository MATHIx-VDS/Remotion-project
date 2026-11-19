// Sound events from the picture: the whip out, the hoodie's arrival on the drop, the hero flare.
import { CUE, FPS } from './timeline';

export type SoundEvent = { f: number; kind: string; weight?: number; pan?: number; apexFrac?: number; dur?: number; variant?: string; id?: string };
export default function cues(): SoundEvent[] {
  return [
    { f: CUE.beam, kind: 'tick', weight: 0.5, id: 'tee:beam' },
    { f: CUE.drop - 6, kind: 'whoosh', weight: 1, pan: -0.6, dur: Math.round(0.45 * FPS), apexFrac: 0.7, id: 'tee:whip' },
    { f: CUE.drop, kind: 'drop', weight: 1, id: 'hood:drop' },
    { f: CUE.front, kind: 'snap', weight: 0.8, id: 'hood:front' },
    { f: CUE.hero, kind: 'hit', weight: 1.1, id: 'hood:hero' },
  ];
}

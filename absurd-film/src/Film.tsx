import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {FPS, PALETTE as P, SCENES} from './config';
import {span} from './lib/anim';
import {Subtitles} from './components/Overlay';
import {MusicTrack} from './components/Music';
import {A01, A02, A03, A08, A09, A11, SceneProps} from './scenes/MountainScenes';
import {A04, A05, A06, A07, A10} from './scenes/OtherScenes';
import {ensureFonts} from './lib/fonts';

ensureFonts();

const LIST: [keyof typeof SCENES, React.FC<SceneProps>][] = [
  ['A01', A01],
  ['A02', A02],
  ['A03', A03],
  ['A04', A04],
  ['A05', A05],
  ['A06', A06],
  ['A07', A07],
  ['A08', A08],
  ['A09', A09],
  ['A10', A10],
  ['A11', A11],
];

const OVERLAP = 0.7;

export const Film: React.FC = () => {
  const frame = useCurrentFrame();
  const s = frame / FPS;
  const fade = Math.max(1 - span(s, 0, 0.8), span(s, 163.4, 165));
  return (
    <AbsoluteFill style={{background: P.bg}}>
      {LIST.map(([key, Comp], i) => {
        const [a, b] = SCENES[key];
        if (s < a - OVERLAP || s > b + OVERLAP) return null;
        const enter = i === 0 ? 1 : span(s, a - OVERLAP, a + OVERLAP);
        const exit = i === LIST.length - 1 ? 0 : span(s, b - OVERLAP, b + OVERLAP);
        // 后一场叠在前一场之上淡入，避免两场同时半透明
        return (
          <AbsoluteFill key={key} style={{opacity: Math.min(enter, i === LIST.length - 1 ? 1 : exit < 1 ? 1 : 0)}}>
            <Comp t={s - a} sec={s} />
          </AbsoluteFill>
        );
      })}
      <AbsoluteFill style={{background: 'linear-gradient(180deg, transparent 74%, rgba(0,0,0,0.5) 100%)', pointerEvents: 'none'}} />
      <Subtitles sec={s} />
      <AbsoluteFill style={{background: '#000', opacity: fade, pointerEvents: 'none'}} />
      <MusicTrack />
    </AbsoluteFill>
  );
};

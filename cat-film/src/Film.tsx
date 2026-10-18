import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {FPS, PALETTE as P, SCENES, SLAMS} from './config';
import {span, win} from './lib/anim';
import {Corners, flashAt, Grain, shakeAt, Slams, Subtitles} from './components/Fx';
import {MusicTrack} from './components/Music';
import {SP} from './scenes/common';
import {C1, C2, C3, C4, C5} from './scenes/ScenesA';
import {C6, C7, C8, C9} from './scenes/ScenesB';
import {ensureFonts} from './lib/fonts';

ensureFonts();

const LIST: [keyof typeof SCENES, React.FC<SP>][] = [
  ['C1', C1],
  ['C2', C2],
  ['C3', C3],
  ['C4', C4],
  ['C5', C5],
  ['C6', C6],
  ['C7', C7],
  ['C8', C8],
  ['C9', C9],
];

const OVERLAP = 0.5;

export const Film: React.FC = () => {
  const frame = useCurrentFrame();
  const s = frame / FPS;
  const {x, y} = shakeAt(s);
  // 大字出现时压暗画面
  const slam = SLAMS.find((sl) => s >= sl.from - 0.1 && s < sl.to);
  const dim = slam ? win(s, slam.from - 0.1, slam.to, 0.15, 0.4) * (slam.kind === 'title' ? 0.35 : 0.55) : 0;
  const fade = span(s, 163.4, 165);
  return (
    <AbsoluteFill style={{background: P.bg, overflow: 'hidden'}}>
      <AbsoluteFill style={{transform: `translate(${x}px,${y}px) scale(${1 + Math.hypot(x, y) / 900})`}}>
        {LIST.map(([key, Comp], i) => {
          const [a, b] = SCENES[key];
          if (s < a - OVERLAP || s >= b + OVERLAP) return null;
          // 后一场盖在前一场上淡入
          const enter = i === 0 ? 1 : span(s, a - OVERLAP, a + OVERLAP);
          return (
            <AbsoluteFill key={key} style={{opacity: enter}}>
              <Comp s={s} />
            </AbsoluteFill>
          );
        })}
      </AbsoluteFill>
      <AbsoluteFill style={{background: '#000', opacity: dim, pointerEvents: 'none'}} />
      <Slams s={s} />
      <AbsoluteFill style={{background: P.light, opacity: flashAt(s), pointerEvents: 'none', mixBlendMode: 'screen'}} />
      <Grain frame={frame} />
      <AbsoluteFill style={{background: 'linear-gradient(180deg, transparent 76%, rgba(0,0,0,0.55) 100%)', pointerEvents: 'none'}} />
      <Corners s={s} />
      <Subtitles s={s} />
      <AbsoluteFill style={{background: '#000', opacity: fade, pointerEvents: 'none'}} />
      <MusicTrack />
    </AbsoluteFill>
  );
};

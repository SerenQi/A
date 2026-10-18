import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {FPS, PALETTE as P, SCENES, SLAMS, WORDS} from './config';
import {span, win} from './lib/anim';
import {BigWords, Corners, flashAt, Grain, shakeAt, Slams, Subtitles} from './components/Fx';
import {MusicTrack} from './components/Music';
import {SP} from './components/Kit';
import {S1, S2, S3, S4} from './scenes/Scenes1';
import {S5, S6, S7} from './scenes/Scenes2';
import {ensureFonts} from './lib/fonts';

ensureFonts();

const LIST: [keyof typeof SCENES, React.FC<SP>][] = [
  ['S1', S1],
  ['S2', S2],
  ['S3', S3],
  ['S4', S4],
  ['S5', S5],
  ['S6', S6],
  ['S7', S7],
];

const OVERLAP = 0.4;

export const Film: React.FC = () => {
  const frame = useCurrentFrame();
  const s = frame / FPS;
  const {x, y} = shakeAt(s);
  const slam = SLAMS.find((sl) => s >= sl.from - 0.1 && s < sl.to);
  const word = WORDS.find((w) => s >= w.from - 0.2 && s < w.to);
  const dim = Math.max(slam ? win(s, slam.from - 0.1, slam.to, 0.15, 0.4) * 0.4 : 0, word ? win(s, word.from - 0.2, word.to, 0.3, 0.4) * 0.6 : 0);
  const fade = span(s, 163.4, 165);
  return (
    <AbsoluteFill style={{background: P.bg, overflow: 'hidden'}}>
      <AbsoluteFill style={{transform: `translate(${x}px,${y}px) scale(${1 + Math.hypot(x, y) / 900})`}}>
        {LIST.map(([key, Comp], i) => {
          const [a, b] = SCENES[key];
          if (s < a - OVERLAP || s >= b + OVERLAP) return null;
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
      <BigWords s={s} />
      <AbsoluteFill style={{background: P.ember, opacity: flashAt(s), pointerEvents: 'none', mixBlendMode: 'screen'}} />
      <Grain frame={frame} />
      <AbsoluteFill style={{background: 'linear-gradient(180deg, transparent 76%, rgba(0,0,0,0.55) 100%)', pointerEvents: 'none'}} />
      <Corners s={s} />
      <Subtitles s={s} />
      <AbsoluteFill style={{background: '#000', opacity: fade, pointerEvents: 'none'}} />
      <MusicTrack />
    </AbsoluteFill>
  );
};

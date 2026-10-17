import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {FONTS, FPS, H, ONSCREEN, PALETTE as P, SCENES, W} from './config';
import {span, win} from './lib/anim';
import {Clip, CoffeeRing, Defs, Desk, Hand, Leaf, StickyNote} from './components/Kit';
import {ParticleText} from './components/ParticleText';
import {Subtitles} from './components/Overlay';
import {MusicTrack} from './components/Music';
import {P01, P02, P04, P05, SceneProps} from './scenes/ScenesA';
import {P06, P08} from './scenes/ScenesB';
import {S02, S04, S09, S10} from './scenes/ScenesC';
import {ensureFonts} from './lib/fonts';

ensureFonts();

const P08Skip: React.FC<SceneProps> = ({t}) => <P08 t={t} noFreeze />;

// [场景, 组件, 局部时间偏移]：复用的场景用偏移对齐新的字幕节奏
const LIST: [keyof typeof SCENES, React.FC<SceneProps>, number][] = [
  ['S01', P01, 0],
  ['S02', S02, 0],
  ['S03', P02, 2],
  ['S04', S04, 0],
  ['S05', P04, 0],
  ['S06', P05, 0],
  ['S07', P06, 0],
  ['S08', P08Skip, 5],
  ['S09', S09, 0],
  ['S10', S10, 0],
];

const OVERLAP = 0.6;

export const Film: React.FC = () => {
  const frame = useCurrentFrame();
  const s = frame / FPS;

  const panX = -s * 7;
  const panY = Math.sin(s / 9) * 10;
  const t06 = s - SCENES.S06[0];
  const windowOn = win(s, SCENES.S06[0] + 0.5, SCENES.S06[1], 0.8, 0.8) + 0.6 * win(s, SCENES.S09[0], SCENES.S09[0] + 10, 1, 1);
  const windowT = s < SCENES.S07[0] ? (t06 * (0.25 + t06 * 0.03)) % 1 : span(s, SCENES.S09[0], SCENES.S09[0] + 10);
  const lamp = s > SCENES.S10[0] ? 1 + 0.5 * span(s, SCENES.S10[0] + 2, SCENES.S10[0] + 10) : 1;
  // 开场提问的大字
  const titleP = span(s, 8.8, 10.6);
  const titleOut = span(s, 11.4, 12.6);
  const titleDim = win(s, 8.6, 12.4, 0.8, 0.6);
  const fade = Math.max(1 - span(s, 0, 0.8), span(s, 163.4, 165));
  const drift = (k: number) => `translate(${Math.sin(s / 7 + k) * 5},${Math.cos(s / 8 + k) * 4})`;

  return (
    <AbsoluteFill style={{background: P.bg}}>
      <Desk panX={panX} panY={panY} lamp={lamp} windowOn={windowOn} windowT={windowT} />
      <svg width={W} height={H} style={{position: 'absolute', inset: 0}}>
        <Defs />
        <g transform={drift(0)} opacity={0.85}>
          <CoffeeRing x={1730} y={160} r={96} />
          <StickyNote x={150} y={150} rot={-9} s={170} color={P.noteYellow}>
            <Hand id="desk-note" x={-62} y={6} text="记得带伞" size={32} color={P.ink} />
          </StickyNote>
          <Leaf x={120} y={960} rot={-28} s={1.1} />
          <Clip x={1790} y={970} rot={12} />
        </g>
        {LIST.map(([key, Comp, off], i) => {
          const [a, b] = SCENES[key];
          if (s < a - OVERLAP || s > b + OVERLAP) return null;
          const enter = span(s, a - OVERLAP, a + OVERLAP);
          const exit = span(s, b - OVERLAP, b + OVERLAP);
          const o = i === 0 ? 1 - exit : i === LIST.length - 1 ? enter : Math.min(enter, 1 - exit);
          const dx = i === 0 ? -exit * 80 : (1 - enter) * 80 - exit * 80;
          return (
            <g key={key} opacity={o * (i === 0 ? 1 - 0.65 * titleDim : 1)} transform={`translate(${dx},0) ${drift(i + 1)}`}>
              <Comp t={s - a + off} />
            </g>
          );
        })}
        {titleDim > 0.01 && <rect width={W} height={H} fill="#000" opacity={0.35 * titleDim} />}
        <ParticleText text={ONSCREEN.title} x={W / 2} y={H / 2 - 20} size={124} font={FONTS.title} p={titleP} out={titleOut} step={4} seed={3} />
      </svg>
      <AbsoluteFill style={{background: 'linear-gradient(180deg, transparent 72%, rgba(0,0,0,0.55) 100%)', pointerEvents: 'none'}} />
      <Subtitles sec={s} />
      <AbsoluteFill style={{background: '#000', opacity: fade, pointerEvents: 'none'}} />
      <MusicTrack />
    </AbsoluteFill>
  );
};

import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {FPS, H, PALETTE as P, SCENES, W} from './config';
import {span, win} from './lib/anim';
import {Clip, CoffeeRing, Defs, Desk, Hand, Leaf, StickyNote} from './components/Kit';
import {Subtitles} from './components/Overlay';
import {MusicTrack} from './components/Music';
import {P01, P02, P03, P04, P05, SceneProps} from './scenes/ScenesA';
import {P06, P07, P08, P09, P10, nightOf} from './scenes/ScenesB';
import {ensureFonts} from './lib/fonts';

ensureFonts();

const LIST: [keyof typeof SCENES, React.FC<SceneProps>][] = [
  ['P01', P01],
  ['P02', P02],
  ['P03', P03],
  ['P04', P04],
  ['P05', P05],
  ['P06', P06],
  ['P07', P07],
  ['P08', P08],
  ['P09', P09],
  ['P10', P10],
];

const OVERLAP = 0.6;

export const Film: React.FC = () => {
  const frame = useCurrentFrame();
  const s = frame / FPS;

  // 桌面：缓慢漂移的“镜头”
  const panX = -s * 7;
  const panY = Math.sin(s / 9) * 10;
  const t05 = s - SCENES.P05[0];
  const t09 = s - SCENES.P09[0];
  const windowOn = Math.max(win(s, SCENES.P05[0] + 0.5, SCENES.P05[1], 0.8, 0.8), win(t09, 10, 14.5, 0.8, 1.0));
  const windowT = s < SCENES.P06[0] ? (t05 * (0.25 + t05 * 0.03)) % 1 : span(t09, 10, 14.5);
  const night = s > SCENES.P09[0] - 1 && s < SCENES.P10[0] + 1 ? nightOf(t09) : 0;
  const lamp = (1 - night * 0.8) * (s > SCENES.P10[0] ? 1 + 0.5 * span(s, SCENES.P10[0] + 3, SCENES.P10[0] + 8) : 1);
  const fade = Math.max(1 - span(s, 0, 0.8), span(s, 148.4, 150));
  const drift = (k: number) => `translate(${Math.sin(s / 7 + k) * 5},${Math.cos(s / 8 + k) * 4})`;

  return (
    <AbsoluteFill style={{background: P.bg}}>
      <Desk panX={panX} panY={panY} lamp={lamp} windowOn={windowOn} windowT={windowT} night={night} />
      <svg width={W} height={H} style={{position: 'absolute', inset: 0}}>
        <Defs />
        {/* 桌上常驻的杂物，略暗，随镜头轻微漂移 */}
        <g transform={drift(0)} opacity={0.85 * (1 - night * 0.5)}>
          <CoffeeRing x={1730} y={160} r={96} />
          <StickyNote x={150} y={150} rot={-9} s={170} color={P.noteYellow}>
            <Hand id="desk-note" x={-62} y={6} text="记得带伞" size={32} color={P.ink} />
          </StickyNote>
          <Leaf x={120} y={960} rot={-28} s={1.1} />
          <Clip x={1790} y={970} rot={12} />
        </g>
        {LIST.map(([key, Comp], i) => {
          const [a, b] = SCENES[key];
          if (s < a - OVERLAP || s > b + OVERLAP) return null;
          const enter = span(s, a - OVERLAP, a + OVERLAP);
          const exit = span(s, b - OVERLAP, b + OVERLAP);
          const o = i === 0 ? 1 - exit : i === LIST.length - 1 ? enter : Math.min(enter, 1 - exit);
          const dx = i === 0 ? -exit * 80 : (1 - enter) * 80 - exit * 80;
          return (
            <g key={key} opacity={o} transform={`translate(${dx},0) ${drift(i + 1)}`}>
              <Comp t={s - a} />
            </g>
          );
        })}
      </svg>
      {/* 字幕底部的暗带，保证可读 */}
      <AbsoluteFill style={{background: 'linear-gradient(180deg, transparent 72%, rgba(0,0,0,0.55) 100%)', pointerEvents: 'none'}} />
      <Subtitles sec={s} />
      <AbsoluteFill style={{background: '#000', opacity: fade, pointerEvents: 'none'}} />
      <MusicTrack />
    </AbsoluteFill>
  );
};

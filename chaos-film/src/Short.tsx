import React from 'react';
import {AbsoluteFill, Audio, interpolate, staticFile, useCurrentFrame} from 'remotion';
import {FONTS, FPS, MUSIC, PALETTE as P, SCENES, SLAMS, WORDS} from './config';
import {span, win} from './lib/anim';
import {BigWords, Corners, flashAt, Grain, shakeAt, Slams, Subtitles} from './components/Fx';
import {SP} from './components/Kit';
import {S1, S2, S3, S4} from './scenes/Scenes1';
import {S5, S6, S7} from './scenes/Scenes2';
import {ensureFonts} from './lib/fonts';

ensureFonts();

// 60 秒短版：从长片里按原时间轴截取的片段（秒），首尾相接
export const EDL: [number, number][] = [
  [0.7, 3.3], // 预报说晴，结果暴雨
  [5.6, 9.3], // 超级计算机也算不准两周以后
  [14.0, 17.0], // 标题（已聚好）
  [30.4, 42.1], // 气象学家、0.506127 → 0.506
  [49.7, 59.6], // 两条曲线分开
  [62.3, 68.9], // 方程没变，天差地别
  [116.0, 125.2], // 混沌不是随机，有形状
  [139.2, 142.7], // 十年后的自己
  [147.8, 157.0], // 那个形状，是每天的选择
];
export const SHORT_S = EDL.reduce((a, [x, y]) => a + y - x, 0);
export const SHORT_FRAMES = Math.round(SHORT_S * FPS);

/** 短版时间 → 长片时间 */
const toSrc = (t: number) => {
  let acc = 0;
  for (const [a, b] of EDL) {
    if (t < acc + b - a) return a + (t - acc);
    acc += b - a;
  }
  const [, b] = EDL[EDL.length - 1];
  return b;
};

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
const HOOK = ['为什么天气预报，', '总是算不准？'];

export const Short: React.FC = () => {
  const frame = useCurrentFrame();
  const t = frame / FPS;
  const s = toSrc(t);
  const {x, y} = shakeAt(s);
  const slam = SLAMS.find((sl) => s >= sl.from - 0.1 && s < sl.to);
  const word = WORDS.find((w) => s >= w.from - 0.2 && s < w.to);
  const dim = Math.max(slam ? win(s, slam.from - 0.1, slam.to, 0.15, 0.4) * 0.4 : 0, word ? win(s, word.from - 0.2, word.to, 0.3, 0.4) * 0.6 : 0);
  // 开头把预报卡片放大，第一眼就看得清
  const zoom = t < EDL[0][1] - EDL[0][0] ? 1.38 : 1;
  const hook = 1 - span(t, 2.3, 2.6);
  const fade = span(t, SHORT_S - 0.8, SHORT_S);
  return (
    <AbsoluteFill style={{background: P.bg, overflow: 'hidden'}}>
      <AbsoluteFill style={{transform: `translate(${x}px,${y}px) scale(${zoom * (1 + Math.hypot(x, y) / 900)})`, transformOrigin: '960px 400px'}}>
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
      {t > 3 && <Corners s={s} />}
      <Subtitles s={s} />
      {hook > 0 && (
        <AbsoluteFill style={{alignItems: 'center', paddingTop: 34, opacity: hook, background: 'linear-gradient(180deg, rgba(5,6,10,0.92) 0%, rgba(5,6,10,0.6) 22%, transparent 34%)'}}>
          <div style={{fontFamily: FONTS.title, fontWeight: 900, fontSize: 92, lineHeight: 1.08, color: P.text, textAlign: 'center', letterSpacing: 6, textShadow: '0 0 24px rgba(0,0,0,0.8)'}}>
            {HOOK[0]}
            <span style={{color: P.red}}>{HOOK[1]}</span>
          </div>
        </AbsoluteFill>
      )}
      <AbsoluteFill style={{background: '#000', opacity: fade, pointerEvents: 'none'}} />
      <Audio
        src={staticFile(MUSIC.file)}
        durationInFrames={SHORT_FRAMES}
        volume={(fr) => MUSIC.level * interpolate(fr / FPS, [0, 0.1, SHORT_S - 2.5, SHORT_S], [0.9, 1, 1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'})}
      />
    </AbsoluteFill>
  );
};

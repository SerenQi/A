import React from 'react';
import {AbsoluteFill, Easing, interpolate, random, spring, useCurrentFrame, useVideoConfig} from 'remotion';
import {Dust, Flash, Rays, Shockwave, Sky, Sparks} from '../components/Atmos';
import {Ship} from '../components/Ship';
import {GoldText, SlamText, Subtitles, Tracking} from '../components/Text';
import {BRUSH, C, H, W} from '../lib/theme';
import {prog} from '../lib/math';
import {CUES} from '../script';

const QX = W / 2;
const QY = 440;

const Column: React.FC<{x: number; o: number}> = ({x, o}) => (
  <g transform={`translate(${x},0)`} opacity={o} fill="none" stroke={C.gold} strokeWidth={1.5}>
    <path d="M-70,170 L70,170 M-60,185 L60,185" />
    <path d="M-70,170 C-90,150 -95,130 -70,128 C-55,128 -55,148 -66,150 M70,170 C90,150 95,130 70,128 C55,128 55,148 66,150" />
    {Array.from({length: 7}, (_, i) => (
      <line key={i} x1={-45 + i * 15} y1={190} x2={-45 + i * 15} y2={980} strokeOpacity={0.6} />
    ))}
    <path d="M-60,980 L60,980 M-75,1000 L75,1000" />
  </g>
);

const Rings: React.FC<{frame: number; o: number}> = ({frame, o}) => (
  <svg width={W} height={H} style={{position: 'absolute', opacity: o}}>
    <g transform={`translate(${QX},${QY})`} fill="none" stroke={C.gold}>
      <circle r={260} strokeWidth={1.5} strokeDasharray="4 14" transform={`rotate(${frame * 0.4})`} />
      <circle r={300} strokeWidth={1} strokeDasharray="60 20 4 20" strokeOpacity={0.6} transform={`rotate(${-frame * 0.25})`} />
      <circle r={340} strokeWidth={0.8} strokeOpacity={0.35} />
      {Array.from({length: 24}, (_, i) => {
        const a = (i / 24) * Math.PI * 2 + frame * 0.004;
        return <line key={i} x1={Math.cos(a) * 345} y1={Math.sin(a) * 345} x2={Math.cos(a) * 360} y2={Math.sin(a) * 360} strokeWidth={2} />;
      })}
    </g>
  </svg>
);

/** 展开的卷轴 */
const Scroll: React.FC<{p: number}> = ({p}) => {
  const w = 420 * p;
  return (
    <svg width={W} height={H} style={{position: 'absolute'}}>
      <g transform={`translate(${QX},${700})`} opacity={Math.min(1, p * 4)}>
        <rect x={-w / 2} y={-34} width={w} height={68} fill="#e9dcc0" opacity={0.92} />
        {Array.from({length: 4}, (_, i) => (
          <line key={i} x1={-w / 2 + 30} x2={w / 2 - 30} y1={-18 + i * 12} y2={-18 + i * 12} stroke="#8a6a3a" strokeWidth={2} strokeDasharray="10 6 22 6 14 6" opacity={0.6} />
        ))}
        {[-1, 1].map((d) => (
          <g key={d} transform={`translate(${(d * w) / 2},0)`}>
            <rect x={-10} y={-44} width={20} height={88} rx={9} fill="#7a5226" stroke={C.gold} strokeWidth={1.5} />
            <circle cy={-48} r={7} fill={C.gold} />
            <circle cy={48} r={7} fill={C.gold} />
          </g>
        ))}
      </g>
    </svg>
  );
};

export const Question: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const qs = spring({frame: frame - 36, fps, config: {damping: 9, stiffness: 120}});
  const lift = prog(frame, 125, 160, Easing.inOut(Easing.cubic));
  const qScale = interpolate(qs, [0, 1], [0, 1]) * (1 - lift * 0.55) * (1 + 0.03 * Math.sin(frame / 8));
  const qY = QY - lift * 230;
  const plutarch = prog(frame, 225, 265);
  const dim = prog(frame, 220, 260);

  return (
    <AbsoluteFill>
      <Sky kind="void" stars={80} />
      <AbsoluteFill style={{background: 'radial-gradient(circle at 50% 41%, rgba(242,200,107,0.16), transparent 45%)'}} />
      <svg width={W} height={H} style={{position: 'absolute'}}>
        <g transform={`translate(${QX},${QY + 140}) scale(1.4)`} opacity={0.12 + 0.05 * Math.sin(frame / 20)}>
          <Ship draw={1} fill={0} frame={frame} oars={false} strokeColor={C.gold} />
        </g>
        <Column x={170} o={dim * 0.35} />
        <Column x={W - 170} o={dim * 0.35} />
      </svg>
      <Rays x={QX} y={QY} opacity={prog(frame, 36, 80) * 0.8} count={12} spin={0.12} />
      <Rings frame={frame} o={prog(frame, 40, 90) * (1 - lift * 0.6)} />
      {/* 汇聚粒子 */}
      {frame < 40 && (
        <svg width={W} height={H} style={{position: 'absolute', mixBlendMode: 'screen'}}>
          {Array.from({length: 120}, (_, i) => {
            const t = Math.max(0, Math.min(1, (frame - random(`qd${i}`) * 12) / 26));
            const e = Easing.in(Easing.quad)(t);
            const a = random(`qa${i}`) * Math.PI * 2;
            const r = (500 + random(`qr${i}`) * 700) * (1 - e);
            return <circle key={i} cx={QX + Math.cos(a) * r} cy={QY + Math.sin(a) * r} r={2.5} fill={C.goldHot} opacity={t > 0 && t < 1 ? 1 : 0} />;
          })}
        </svg>
      )}
      <AbsoluteFill style={{alignItems: 'center'}}>
        <div style={{position: 'absolute', top: qY - 230, transform: `scale(${qScale})`, lineHeight: 1}}>
          <GoldText size={440} font={BRUSH} shine={prog(frame, 50, 100)}>
            ？
          </GoldText>
        </div>
      </AbsoluteFill>
      <Flash at={37} peak={0.6} />
      <Shockwave x={QX} y={QY} start={37} dur={40} max={1000} width={8} />
      <Sparks x={QX} y={QY} start={37} count={60} power={500} seed="q" />
      <AbsoluteFill style={{top: 400}}>
        <SlamText text="这，还是特修斯之船吗？" start={150} size={104} stagger={4} />
      </AbsoluteFill>
      <Shockwave x={QX} y={460} start={186} dur={30} max={700} width={4} />
      <Scroll p={prog(frame, 225, 260, Easing.out(Easing.cubic))} />
      <AbsoluteFill style={{top: 770, opacity: plutarch}}>
        <Tracking text="约公元 100 年 · 普鲁塔克" start={240} size={30} from={30} to={10} color={C.ivory} />
      </AbsoluteFill>
      <Dust count={40} seed="q" opacity={0.7} />
      <Subtitles cues={CUES.question} />
    </AbsoluteFill>
  );
};

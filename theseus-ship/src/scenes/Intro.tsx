import React from 'react';
import {AbsoluteFill, Easing, interpolate, random, useCurrentFrame} from 'remotion';
import {Dust, Flash, LensSweep, Rays, Shockwave, Sky} from '../components/Atmos';
import {Ship} from '../components/Ship';
import {SlamText, Tracking} from '../components/Text';
import {BRUSH, C, H, SERIF, W} from '../lib/theme';
import {prog} from '../lib/math';

const SHIP_X = W / 2;
const SHIP_Y = 470;
const SHIP_S = 0.55;

/** 汇聚的粒子：从四周螺旋涌向画面中心 */
const Converge: React.FC = () => {
  const frame = useCurrentFrame();
  if (frame > 80) return null;
  return (
    <svg width={W} height={H} style={{position: 'absolute', mixBlendMode: 'screen'}}>
      {Array.from({length: 160}, (_, i) => {
        const delay = random(`cd${i}`) * 30;
        const t = Math.max(0, Math.min(1, (frame - delay) / 45));
        const e = Easing.in(Easing.cubic)(t);
        const a0 = random(`ca${i}`) * Math.PI * 2;
        const r0 = 700 + random(`cr${i}`) * 600;
        const a = a0 + e * 2.4;
        const r = r0 * (1 - e);
        const x = SHIP_X + Math.cos(a) * r;
        const y = SHIP_Y - 80 + Math.sin(a) * r * 0.6;
        const tail = 18 + e * 60;
        const x2 = SHIP_X + Math.cos(a - 0.08) * (r + tail);
        const y2 = SHIP_Y - 80 + Math.sin(a - 0.08) * (r + tail) * 0.6;
        return <line key={i} x1={x2} y1={y2} x2={x} y2={y} stroke={i % 5 ? C.gold : C.goldHot} strokeWidth={2} strokeLinecap="round" opacity={t > 0 && t < 1 ? 0.9 : 0} />;
      })}
    </svg>
  );
};

export const Intro: React.FC = () => {
  const frame = useCurrentFrame();
  const draw = prog(frame, 70, 200, Easing.inOut(Easing.sin));
  const fill = prog(frame, 175, 250);
  const push = interpolate(frame, [0, 390], [1, 1.07]);
  const titleUp = prog(frame, 150, 190, Easing.out(Easing.cubic));
  const glow = 0.4 + 0.6 * prog(frame, 70, 120) * (0.8 + 0.2 * Math.sin(frame / 12));

  return (
    <AbsoluteFill>
      <Sky kind="void" stars={120} />
      <AbsoluteFill
        style={{
          background: `radial-gradient(ellipse 50% 40% at 50% 42%, rgba(242,200,107,${0.22 * glow}), transparent 70%)`,
        }}
      />
      <Rays x={SHIP_X} y={SHIP_Y - 120} opacity={prog(frame, 80, 160) * 0.9} />
      <Converge />
      <AbsoluteFill style={{transform: `scale(${push})`}}>
        <svg width={W} height={H} style={{position: 'absolute'}}>
          {/* 水平线与倒影 */}
          <line
            x1={SHIP_X - 700 * draw}
            x2={SHIP_X + 700 * draw}
            y1={SHIP_Y + 50 * SHIP_S}
            y2={SHIP_Y + 50 * SHIP_S}
            stroke={C.gold}
            strokeWidth={1.5}
            opacity={0.8}
          />
          <defs>
            <linearGradient id="reflFade" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#fff" stopOpacity="0.35" />
              <stop offset="0.5" stopColor="#fff" stopOpacity="0" />
            </linearGradient>
            <mask id="reflMask">
              <rect x={0} y={SHIP_Y + 50 * SHIP_S} width={W} height={400} fill="url(#reflFade)" />
            </mask>
          </defs>
          <g mask="url(#reflMask)">
            <g transform={`translate(${SHIP_X},${SHIP_Y + 100 * SHIP_S}) scale(${SHIP_S},${-SHIP_S})`}>
              <Ship draw={draw} fill={fill} frame={frame} oars={false} billow={0.7} />
            </g>
          </g>
          <g transform={`translate(${SHIP_X},${SHIP_Y}) scale(${SHIP_S})`} style={{filter: `drop-shadow(0 0 ${14 * glow}px rgba(242,200,107,0.7))`}}>
            <Ship draw={draw} fill={fill} frame={frame} oars={false} billow={0.7} />
          </g>
        </svg>
      </AbsoluteFill>
      <Flash at={72} peak={0.55} />
      <Shockwave x={SHIP_X} y={SHIP_Y - 80} start={70} dur={40} max={900} />
      <LensSweep start={185} dur={70} y={SHIP_Y - 60} />

      {/* 标题 */}
      <AbsoluteFill style={{top: 640 + (1 - titleUp) * 30}}>
        <SlamText text="特修斯之船" start={150} size={150} stagger={6} font={BRUSH} />
        <div style={{marginTop: 8}}>
          <Tracking text="THE SHIP OF THESEUS" start={200} size={30} from={60} to={22} />
        </div>
        <div style={{marginTop: 26, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 22, opacity: prog(frame, 245, 290)}}>
          <div style={{width: 120 * prog(frame, 245, 300), height: 1, background: `linear-gradient(90deg, transparent, ${C.gold})`}} />
          <span style={{fontFamily: SERIF, fontSize: 32, color: C.ivory, letterSpacing: 10}}>一个流传了两千年的哲学悖论</span>
          <div style={{width: 120 * prog(frame, 245, 300), height: 1, background: `linear-gradient(270deg, transparent, ${C.gold})`}} />
        </div>
      </AbsoluteFill>
      <Dust count={50} opacity={prog(frame, 60, 140)} />
    </AbsoluteFill>
  );
};

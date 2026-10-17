import React from 'react';
import {AbsoluteFill, Easing, interpolate, useCurrentFrame} from 'remotion';
import {Dust, Flash, LensSweep, Orb, Rays, Sea, Shockwave, Sky, Sparks} from '../components/Atmos';
import {Ship} from '../components/Ship';
import {SlamText, Subtitles, Tracking} from '../components/Text';
import {BRUSH, C, H, SERIF, W} from '../lib/theme';
import {prog} from '../lib/math';
import {CUES} from '../script';

const HORIZON = 600;

export const Ending: React.FC = () => {
  const frame = useCurrentFrame();
  const t = prog(frame, 0, 400, Easing.inOut(Easing.sin));
  const s = interpolate(t, [0, 1], [0.5, 0.1]);
  const x = interpolate(t, [0, 1], [700, 1010]);
  const wl = interpolate(t, [0, 1], [790, HORIZON + 8]);
  const bob = Math.sin(frame / 20) * 4 * s * 2;
  const dark = prog(frame, 385, 430);
  const end = prog(frame, 505, 540);
  const title = prog(frame, 410, 450);

  return (
    <AbsoluteFill>
      <Sky kind="dusk" stars={60} />
      <Orb x={W / 2 + 60} y={HORIZON - 20} r={110} color="#ff9d4d" glow={1.4} />
      <Rays x={W / 2 + 60} y={HORIZON - 20} color="rgba(255,170,90,0.16)" count={18} spin={0.05} />
      <Sea y={HORIZON} colors={['#5a2c3c', '#3d1f34', '#29162a', '#170c1c']} glint="#ffc07a" glintX={W / 2 + 60} amp={4} speed={0.6} />
      <svg width={W} height={H} style={{position: 'absolute'}}>
        <defs>
          <clipPath id="aboveWater">
            <rect x={0} y={0} width={W} height={wl + bob} />
          </clipPath>
          <linearGradient id="endRefl" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#fff" stopOpacity="0.35" />
            <stop offset="1" stopColor="#fff" stopOpacity="0" />
          </linearGradient>
          <mask id="endReflMask">
            <rect x={0} y={wl + bob} width={W} height={300 * s * 2} fill="url(#endRefl)" />
          </mask>
        </defs>
        {/* 倒影 */}
        <g mask="url(#endReflMask)">
          <g transform={`translate(${x},${wl + bob + 50 * s}) scale(${s},${-s})`} style={{filter: 'brightness(0.35)'}}>
            <Ship frame={frame} billow={0.9} oarPhase={frame / 6} />
          </g>
        </g>
        <g clipPath="url(#aboveWater)">
          <g transform={`translate(${x},${wl + bob - 50 * s}) scale(${s})`} style={{filter: 'brightness(0.28) drop-shadow(0 0 6px rgba(255,170,90,0.9))'}}>
            <Ship frame={frame} billow={0.9} oarPhase={frame / 6} />
          </g>
        </g>
      </svg>
      <LensSweep start={150} dur={90} y={HORIZON - 20} color="255,180,110" />

      {/* 追问 */}
      <AbsoluteFill style={{top: 250, opacity: 1 - dark}}>
        <SlamText text="是什么，让你成为你？" start={270} size={112} stagger={5} font={BRUSH} />
      </AbsoluteFill>
      <Shockwave x={W / 2} y={320} start={305} dur={40} max={900} />

      {/* 片尾标题 */}
      <AbsoluteFill style={{background: '#04050a', opacity: dark * 0.92}} />
      {frame > 400 && (
        <AbsoluteFill style={{opacity: title}}>
          <Rays x={W / 2} y={430} opacity={0.6} count={12} spin={0.1} />
          <AbsoluteFill style={{top: 330}}>
            <SlamText text="特修斯之船" start={412} size={170} stagger={5} font={BRUSH} />
            <div style={{marginTop: 14}}>
              <Tracking text="THE SHIP OF THESEUS" start={440} size={30} from={60} to={22} />
            </div>
            <div style={{marginTop: 50, textAlign: 'center', fontFamily: SERIF, fontSize: 28, letterSpacing: 16, color: C.ivory, opacity: prog(frame, 465, 495)}}>全片完</div>
          </AbsoluteFill>
        </AbsoluteFill>
      )}
      <Flash at={413} peak={0.4} />
      <Sparks x={W / 2} y={430} start={414} count={80} power={700} seed="end" />
      <Dust count={50} seed="end" opacity={0.6} />
      <Subtitles cues={CUES.ending} />
      <AbsoluteFill style={{background: '#000', opacity: end}} />
    </AbsoluteFill>
  );
};

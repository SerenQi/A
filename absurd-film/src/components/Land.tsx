import React from 'react';
import {H, PALETTE as P, W} from '../config';
import {hash, lerp} from '../lib/anim';

/* ---------------- 山坡几何（世界坐标） ---------------- */
export const SLOPE = {A: {x: 180, y: 900}, B: {x: 1420, y: 330}};
const DX = SLOPE.B.x - SLOPE.A.x;
const DY = SLOPE.B.y - SLOPE.A.y;
export const SLOPE_LEN = Math.hypot(DX, DY);
export const DIR = {x: DX / SLOPE_LEN, y: DY / SLOPE_LEN};
/** 指向坡面上方的法向 */
export const NORMAL = {x: DIR.y, y: -DIR.x};
export const SLOPE_DEG = (Math.atan2(DY, DX) * 180) / Math.PI;
/** 坡面上距坡底 u 处的点（u 可为负：坡底左侧的平地） */
export const slopePoint = (u: number) =>
  u >= 0 ? {x: SLOPE.A.x + DIR.x * u, y: SLOPE.A.y + DIR.y * u} : {x: SLOPE.A.x + u, y: SLOPE.A.y};

/* ---------------- 天空 ---------------- */
const mix = (a: string, b: string, t: number) => {
  const pa = parseInt(a.slice(1), 16);
  const pb = parseInt(b.slice(1), 16);
  const c = [16, 8, 0].map((sh) => Math.round(lerp((pa >> sh) & 255, (pb >> sh) & 255, t)));
  return `rgb(${c[0]},${c[1]},${c[2]})`;
};

export const Sky: React.FC<{sec: number; dawn?: number; moon?: number}> = ({sec, dawn = 0, moon = 1}) => {
  const top = mix(P.skyTop, P.dawnTop, dawn);
  const mid = mix(P.skyMid, '#4A3A6A', dawn);
  const low = mix(P.skyLow, P.dawnLow, dawn);
  return (
    <svg width={W} height={H} style={{position: 'absolute', inset: 0}}>
      <defs>
        <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={top} />
          <stop offset="0.55" stopColor={mid} />
          <stop offset="1" stopColor={low} />
        </linearGradient>
        <radialGradient id="moonGlow">
          <stop offset="0" stopColor={P.moon} stopOpacity="0.5" />
          <stop offset="0.2" stopColor={P.moon} stopOpacity="0.12" />
          <stop offset="1" stopColor={P.moon} stopOpacity="0" />
        </radialGradient>
        <radialGradient id="sunGlow">
          <stop offset="0" stopColor="#FFE2B0" stopOpacity="0.9" />
          <stop offset="0.25" stopColor="#FFB878" stopOpacity="0.35" />
          <stop offset="1" stopColor="#FFB878" stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect width={W} height={H} fill="url(#sky)" />
      {Array.from({length: 110}, (_, i) => {
        const x = hash(i * 3) * W;
        const y = hash(i * 7 + 1) * H * 0.6;
        const tw = 0.35 + 0.65 * Math.abs(Math.sin(sec * (0.6 + hash(i) * 1.4) + i));
        return <circle key={i} cx={x} cy={y} r={0.6 + hash(i + 5) * 1.3} fill="#fff" opacity={tw * 0.8 * (1 - dawn)} />;
      })}
      {moon > 0.01 && (
        <g opacity={moon * (1 - dawn)}>
          <circle cx={1580} cy={190} r={260} fill="url(#moonGlow)" />
          <circle cx={1580} cy={190} r={46} fill={P.moon} />
          <circle cx={1566} cy={178} r={9} fill="#C4CCEA" opacity={0.6} />
          <circle cx={1595} cy={204} r={6} fill="#C4CCEA" opacity={0.5} />
        </g>
      )}
      {dawn > 0.01 && <circle cx={W / 2} cy={H * 0.86} r={520} fill="url(#sunGlow)" opacity={dawn} />}
    </svg>
  );
};

/* ---------------- 远山与雾 ---------------- */
const ridgePath = (base: number, amp: number, seed: number, offset: number) => {
  const pts: string[] = [];
  for (let x = -100; x <= W + 100; x += 30) {
    const xx = x + offset;
    const y = base - amp * (0.55 * Math.sin(xx * 0.0031 + seed) + 0.3 * Math.sin(xx * 0.0079 + seed * 2) + 0.15 * Math.sin(xx * 0.019 + seed * 3));
    pts.push(`${x},${y.toFixed(1)}`);
  }
  return `M-100,${H + 10}L${pts.join('L')}L${W + 100},${H + 10}Z`;
};

export const Ridges: React.FC<{pan?: number; dawn?: number; city?: number}> = ({pan = 0, dawn = 0, city = 0}) => {
  const c1 = mix(P.ridge1, '#5B4466', dawn);
  const c2 = mix(P.ridge2, '#3E3352', dawn);
  const c3 = mix(P.ridge3, '#2A2440', dawn);
  return (
    <svg width={W} height={H} style={{position: 'absolute', inset: 0}}>
      <defs>
        <linearGradient id="fog" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#9AA6E0" stopOpacity="0" />
          <stop offset="0.5" stopColor="#9AA6E0" stopOpacity={0.08 + dawn * 0.06} />
          <stop offset="1" stopColor="#9AA6E0" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={ridgePath(560, 120, 1.3, pan * 0.2)} fill={c1} />
      <rect x={0} y={520} width={W} height={120} fill="url(#fog)" />
      {/* 远处地平线上的城市灯火：预示后面的城市 */}
      <g opacity={0.5 + city * 0.5}>
        {Array.from({length: 60}, (_, i) => {
          const x = ((hash(i * 11) * W * 1.4 - pan * 0.35) % (W + 200)) - 100;
          return <circle key={i} cx={x} cy={600 + hash(i * 3) * 24} r={1.2 + hash(i) * 1.2} fill={P.window} opacity={0.35 + 0.4 * hash(i + 2)} />;
        })}
      </g>
      <path d={ridgePath(650, 100, 4.1, pan * 0.4)} fill={c2} />
      <rect x={0} y={620} width={W} height={120} fill="url(#fog)" />
      <path d={ridgePath(760, 80, 7.7, pan * 0.65)} fill={c3} />
    </svg>
  );
};

/* ---------------- 前景大山（世界坐标，放在镜头组里） ---------------- */
export const Mountain: React.FC<{rim?: number}> = ({rim = 1}) => {
  const {A, B} = SLOPE;
  return (
    <g>
      <defs>
        <linearGradient id="mtn" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#151834" />
          <stop offset="1" stopColor={P.mountain} />
        </linearGradient>
        <linearGradient id="rimGrad" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor={P.rim} stopOpacity="0.2" />
          <stop offset="1" stopColor={P.moon} stopOpacity="0.9" />
        </linearGradient>
      </defs>
      <path
        d={`M-600,1400 L-600,${A.y + 40} L${A.x - 120},${A.y + 8} L${A.x},${A.y} L${B.x},${B.y} Q${B.x + 40},${B.y - 6} ${B.x + 80},${B.y + 4} L${B.x + 420},${B.y + 300} L${B.x + 900},${B.y + 560} L${B.x + 1400},${B.y + 700} L${B.x + 1400},1400 Z`}
        fill="url(#mtn)"
      />
      <path d={`M${A.x - 300},${A.y + 20} L${A.x},${A.y} L${B.x},${B.y} Q${B.x + 40},${B.y - 6} ${B.x + 80},${B.y + 4} L${B.x + 420},${B.y + 300}`} fill="none" stroke="url(#rimGrad)" strokeWidth={2.2} opacity={rim} />
      {/* 坡面上的碎石与草 */}
      {Array.from({length: 70}, (_, i) => {
        const u = hash(i * 5) * SLOPE_LEN;
        const d = 10 + hash(i * 9) * 160;
        const p = slopePoint(u);
        const x = p.x - NORMAL.x * d;
        const y = p.y - NORMAL.y * d;
        return i % 3 === 0 ? (
          <path key={i} d={`M${x},${y} l3,-9 l3,9`} fill="none" stroke="#2A2F55" strokeWidth={1.5} />
        ) : (
          <ellipse key={i} cx={x} cy={y} rx={3 + hash(i) * 6} ry={2 + hash(i + 1) * 3} fill="#1E2244" />
        );
      })}
    </g>
  );
};

/** 石头滚落留下的旧轨迹：count 道，越积越多 */
export const Trails: React.FC<{count: number; level?: number; fresh?: number}> = ({count, level = 1, fresh = 0}) => {
  const n = Math.min(160, Math.round(count));
  return (
    <g opacity={level}>
      {Array.from({length: n}, (_, i) => {
        const off = 4 + hash(i * 13) * 60;
        const wob = (hash(i * 3) - 0.5) * 18;
        const a = slopePoint(SLOPE_LEN * (0.02 + hash(i * 7) * 0.08));
        const b = slopePoint(SLOPE_LEN * (0.9 + hash(i * 5) * 0.08));
        const ax = a.x + NORMAL.x * off;
        const ay = a.y + NORMAL.y * off;
        const bx = b.x + NORMAL.x * off;
        const by = b.y + NORMAL.y * off;
        const mx = (ax + bx) / 2 + NORMAL.x * wob;
        const my = (ay + by) / 2 + NORMAL.y * wob;
        const newest = i === n - 1 ? fresh : 0;
        return <path key={i} d={`M${ax},${ay} Q${mx},${my} ${bx},${by}`} fill="none" stroke={P.trail} strokeWidth={newest > 0 ? 2.4 : 1} opacity={newest > 0 ? 0.2 + 0.5 * newest : 0.025 + hash(i) * 0.045} />;
      })}
    </g>
  );
};

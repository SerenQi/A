import React from 'react';
import {AbsoluteFill, random, useCurrentFrame} from 'remotion';
import {C, H, W} from '../lib/theme';

/* ---------- 天空 ---------- */
const SKIES = {
  night: ['#02040a', '#071226', '#10284a'],
  dawn: ['#1a1030', '#6b2f4a', '#f08a4b'],
  dusk: ['#0b0a1f', '#4a1f3d', '#e0703a'],
  void: ['#000000', '#05070d', '#0b1220'],
  day: ['#0d2a4a', '#2f6a96', '#c9b48a'],
} as const;

export const Sky: React.FC<{kind?: keyof typeof SKIES; stars?: number; children?: React.ReactNode}> = ({
  kind = 'night',
  stars = 0,
  children,
}) => {
  const frame = useCurrentFrame();
  const [a, b, c] = SKIES[kind];
  return (
    <AbsoluteFill style={{background: `linear-gradient(180deg, ${a} 0%, ${b} 55%, ${c} 100%)`}}>
      {stars > 0 && (
        <svg width={W} height={H} style={{position: 'absolute'}}>
          {Array.from({length: stars}, (_, i) => {
            const x = random(`sx${i}`) * W;
            const y = random(`sy${i}`) * H * 0.62;
            const tw = 0.4 + 0.6 * Math.abs(Math.sin(frame / (14 + random(`st${i}`) * 30) + i));
            const r = 0.6 + random(`sr${i}`) * 1.6;
            return <circle key={i} cx={x} cy={y} r={r} fill="#fff" opacity={tw * 0.85} />;
          })}
        </svg>
      )}
      {children}
    </AbsoluteFill>
  );
};

/* ---------- 太阳 / 月亮 ---------- */
export const Orb: React.FC<{x: number; y: number; r: number; color: string; glow?: number}> = ({x, y, r, color, glow = 1}) => (
  <AbsoluteFill style={{pointerEvents: 'none'}}>
    <div
      style={{
        position: 'absolute',
        left: x - r * 6,
        top: y - r * 6,
        width: r * 12,
        height: r * 12,
        borderRadius: '50%',
        background: `radial-gradient(circle, ${color} 0%, ${color}55 ${8 * glow}%, ${color}18 ${22 * glow}%, transparent 60%)`,
      }}
    />
    <div
      style={{
        position: 'absolute',
        left: x - r,
        top: y - r,
        width: r * 2,
        height: r * 2,
        borderRadius: '50%',
        background: `radial-gradient(circle at 40% 40%, #fffaf0, ${color})`,
        boxShadow: `0 0 ${r}px ${color}`,
      }}
    />
  </AbsoluteFill>
);

/* ---------- 海面 ---------- */
type SeaProps = {
  y: number;
  colors?: string[];
  amp?: number;
  speed?: number;
  glint?: string;
  glintX?: number;
};

export const Sea: React.FC<SeaProps> = ({
  y,
  colors = ['#0f2c47', '#0b2238', '#081a2c', '#051220'],
  amp = 10,
  speed = 1,
  glint = C.gold,
  glintX = W / 2,
}) => {
  const frame = useCurrentFrame();
  const t = frame * speed;
  const layers = colors.map((col, i) => {
    const base = y + i * (36 + i * 14);
    const a = amp * (1 + i * 0.6);
    const pts: string[] = [];
    for (let x = -40; x <= W + 40; x += 24) {
      const v =
        Math.sin(x * (0.006 - i * 0.0008) + t * 0.05 * (1 + i * 0.3) + i * 1.7) * a +
        Math.sin(x * 0.017 + t * 0.09 + i) * a * 0.35;
      pts.push(`${x},${(base + v).toFixed(1)}`);
    }
    return <path key={i} d={`M${pts.join('L')}L${W + 40},${H + 10}L-40,${H + 10}Z`} fill={col} />;
  });
  const glints = Array.from({length: 70}, (_, i) => {
    const row = random(`gr${i}`);
    const gy = y + 8 + row * (H - y) * 0.9;
    const spread = 120 + row * 700;
    const gx = glintX + (random(`gx${i}`) - 0.5) * spread * 2 + Math.sin(t * 0.03 + i) * 12;
    const w = 10 + row * 60 * random(`gw${i}`);
    const op = Math.max(0, Math.sin(t * 0.08 + i * 2.3)) * (1 - Math.abs(gx - glintX) / (spread + 1)) * 0.9;
    return <rect key={i} x={gx - w / 2} y={gy} width={w} height={1.5 + row * 2.5} rx={1.5} fill={glint} opacity={op} />;
  });
  return (
    <svg width={W} height={H} style={{position: 'absolute', inset: 0}}>
      {layers}
      {glints}
    </svg>
  );
};

/* ---------- 漂浮金尘 ---------- */
export const Dust: React.FC<{count?: number; color?: string; seed?: string; opacity?: number; rise?: number}> = ({
  count = 60,
  color = C.gold,
  seed = 'd',
  opacity = 1,
  rise = 1,
}) => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill style={{pointerEvents: 'none', opacity}}>
      <svg width={W} height={H}>
        <defs>
          <radialGradient id={`dustg-${seed}`}>
            <stop offset="0" stopColor={color} stopOpacity="1" />
            <stop offset="0.35" stopColor={color} stopOpacity="0.5" />
            <stop offset="1" stopColor={color} stopOpacity="0" />
          </radialGradient>
        </defs>
        {Array.from({length: count}, (_, i) => {
          const sp = 0.3 + random(`${seed}v${i}`) * 1.2;
          const x = (random(`${seed}x${i}`) * W + Math.sin(frame / 60 + i) * 40) % W;
          const y = (((random(`${seed}y${i}`) * H - frame * sp * rise) % H) + H) % H;
          const r = 2 + random(`${seed}r${i}`) * 7;
          const tw = 0.3 + 0.7 * Math.abs(Math.sin(frame / (20 + i % 17) + i));
          return <circle key={i} cx={x} cy={y} r={r * 2.5} fill={`url(#dustg-${seed})`} opacity={tw} />;
        })}
      </svg>
    </AbsoluteFill>
  );
};

/* ---------- 体积光束 ---------- */
export const Rays: React.FC<{x?: number; y?: number; color?: string; opacity?: number; count?: number; spin?: number}> = ({
  x = W / 2,
  y = -100,
  color = 'rgba(255,220,150,0.16)',
  opacity = 1,
  count = 9,
  spin = 0.06,
}) => {
  const frame = useCurrentFrame();
  const stops: string[] = [];
  for (let i = 0; i < count; i++) {
    const a = (i / count) * 360;
    const w = 4 + random(`ray${i}`) * 9;
    stops.push(`transparent ${a}deg`, `${color} ${a + w / 2}deg`, `transparent ${a + w}deg`);
  }
  return (
    <AbsoluteFill style={{opacity, mixBlendMode: 'screen', pointerEvents: 'none'}}>
      <div
        style={{
          position: 'absolute',
          left: x - 2000,
          top: y - 2000,
          width: 4000,
          height: 4000,
          background: `conic-gradient(from ${frame * spin}deg at 50% 50%, ${stops.join(',')})`,
          maskImage: 'radial-gradient(circle, black 0%, black 20%, transparent 55%)',
          WebkitMaskImage: 'radial-gradient(circle, black 0%, black 20%, transparent 55%)',
        }}
      />
    </AbsoluteFill>
  );
};

/* ---------- 冲击波 ---------- */
export const Shockwave: React.FC<{x: number; y: number; start: number; dur?: number; max?: number; color?: string; width?: number}> = ({
  x,
  y,
  start,
  dur = 30,
  max = 600,
  color = C.goldHot,
  width = 6,
}) => {
  const frame = useCurrentFrame();
  const t = (frame - start) / dur;
  if (t < 0 || t > 1) return null;
  const e = 1 - Math.pow(1 - t, 3);
  return (
    <svg width={W} height={H} style={{position: 'absolute', inset: 0, pointerEvents: 'none', mixBlendMode: 'screen'}}>
      <circle cx={x} cy={y} r={e * max} fill="none" stroke={color} strokeWidth={width * (1 - t) + 0.5} opacity={1 - t} />
      <circle cx={x} cy={y} r={e * max * 0.7} fill="none" stroke={color} strokeWidth={width * 0.5 * (1 - t)} opacity={(1 - t) * 0.6} />
    </svg>
  );
};

/* ---------- 火花迸射 ---------- */
export const Sparks: React.FC<{x: number; y: number; start: number; count?: number; dur?: number; power?: number; color?: string; seed?: string; gravity?: number}> = ({
  x,
  y,
  start,
  count = 40,
  dur = 40,
  power = 300,
  color = C.goldHot,
  seed = 's',
  gravity = 260,
}) => {
  const frame = useCurrentFrame();
  const t = (frame - start) / dur;
  if (t < 0 || t > 1) return null;
  return (
    <svg width={W} height={H} style={{position: 'absolute', inset: 0, pointerEvents: 'none', mixBlendMode: 'screen'}}>
      {Array.from({length: count}, (_, i) => {
        const a = random(`${seed}a${i}`) * Math.PI * 2;
        const v = (0.3 + random(`${seed}v${i}`) * 0.7) * power;
        const e = 1 - Math.pow(1 - t, 2);
        const px = x + Math.cos(a) * v * e;
        const py = y + Math.sin(a) * v * e + gravity * t * t;
        const px2 = x + Math.cos(a) * v * Math.max(0, e - 0.08);
        const py2 = y + Math.sin(a) * v * Math.max(0, e - 0.08) + gravity * Math.max(0, t - 0.05) ** 2;
        return (
          <line key={i} x1={px2} y1={py2} x2={px} y2={py} stroke={color} strokeWidth={2.5 * (1 - t) + 0.5} strokeLinecap="round" opacity={1 - t} />
        );
      })}
    </svg>
  );
};

/* ---------- 闪光 ---------- */
export const Flash: React.FC<{at: number; dur?: number; color?: string; peak?: number}> = ({at, dur = 18, color = '#fff6dc', peak = 1}) => {
  const frame = useCurrentFrame();
  const t = frame - at;
  if (t < -3 || t > dur) return null;
  const o = t < 0 ? (t + 3) / 3 : 1 - t / dur;
  return <AbsoluteFill style={{background: color, opacity: Math.max(0, o) * peak, mixBlendMode: 'screen', pointerEvents: 'none'}} />;
};

/* ---------- 镜头光晕扫过 ---------- */
export const LensSweep: React.FC<{start: number; dur?: number; y?: number; color?: string}> = ({start, dur = 50, y = H / 2, color = '255,214,140'}) => {
  const frame = useCurrentFrame();
  const t = (frame - start) / dur;
  if (t < 0 || t > 1) return null;
  const x = -400 + t * (W + 800);
  const o = Math.sin(t * Math.PI);
  return (
    <AbsoluteFill style={{mixBlendMode: 'screen', pointerEvents: 'none', opacity: o}}>
      <div
        style={{
          position: 'absolute',
          left: 0,
          top: y - 3,
          width: W,
          height: 6,
          background: `linear-gradient(90deg, transparent, rgba(${color},0.0) ${(x / W) * 100 - 40}%, rgba(${color},0.9) ${(x / W) * 100}%, rgba(${color},0.0) ${(x / W) * 100 + 40}%, transparent)`,
          filter: 'blur(2px)',
        }}
      />
      <div
        style={{
          position: 'absolute',
          left: x - 260,
          top: y - 260,
          width: 520,
          height: 520,
          borderRadius: '50%',
          background: `radial-gradient(circle, rgba(${color},0.75) 0%, rgba(${color},0.18) 25%, transparent 60%)`,
        }}
      />
      {[0.35, 0.6, 0.85].map((k, i) => (
        <div
          key={i}
          style={{
            position: 'absolute',
            left: W / 2 + (W / 2 - x) * k - 40 - i * 20,
            top: H / 2 + (H / 2 - y) * k - 40 - i * 20,
            width: 80 + i * 40,
            height: 80 + i * 40,
            borderRadius: '50%',
            border: `2px solid rgba(${color},0.25)`,
            background: `radial-gradient(circle, rgba(${color},0.12), transparent 70%)`,
          }}
        />
      ))}
    </AbsoluteFill>
  );
};

/* ---------- 胶片颗粒 + 暗角 ---------- */
export const FilmLook: React.FC = () => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill style={{pointerEvents: 'none'}}>
      <svg width={W} height={H} style={{position: 'absolute', opacity: 0.09, mixBlendMode: 'overlay'}}>
        <filter id="grain">
          <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="2" seed={frame % 24} stitchTiles="stitch" />
          <feColorMatrix type="saturate" values="0" />
        </filter>
        <rect width={W} height={H} filter="url(#grain)" />
      </svg>
      <AbsoluteFill style={{background: 'radial-gradient(ellipse at 50% 50%, transparent 55%, rgba(0,0,0,0.55) 100%)'}} />
      {/* 电影宽银幕遮幅 */}
      <div style={{position: 'absolute', left: 0, top: 0, width: W, height: 40, background: '#000'}} />
      <div style={{position: 'absolute', left: 0, bottom: 0, width: W, height: 40, background: '#000'}} />
    </AbsoluteFill>
  );
};

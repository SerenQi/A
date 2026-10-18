import React from 'react';
import {FONTS, H, PALETTE as P, W} from '../config';
import {hash} from '../lib/anim';
import {Cat, Defs} from '../components/Things';

export type SP = {s: number};

export const Stage: React.FC<{bg?: string; children: React.ReactNode}> = ({bg = P.bg, children}) => (
  <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{position: 'absolute', inset: 0}}>
    <Defs />
    <rect width={W} height={H} fill={bg} />
    {children}
  </svg>
);

/** 以 (cx, cy) 为中心缩放的镜头 */
export const Cam: React.FC<{z: number; cx?: number; cy?: number; tx?: number; ty?: number; children: React.ReactNode}> = ({z, cx = W / 2, cy = H / 2, tx = 0, ty = 0, children}) => (
  <g transform={`translate(${W / 2 + tx},${H / 2 + ty}) scale(${z}) translate(${-cx},${-cy})`}>{children}</g>
);

/** 叠加态的猫：坐姿与卧姿重叠、红青错位、硬切闪烁；amt=0 时坍缩成 pose */
export const SuperCat: React.FC<{x: number; y: number; s?: number; t: number; amt: number; pose?: 'sit' | 'lie'; o?: number}> = ({x, y, s = 1, t, amt, pose = 'sit', o = 1}) => {
  if (amt < 0.02) return <Cat x={x} y={y} s={s} pose={pose} rim={P.light} o={o} />;
  const k = hash(Math.floor(t * 13)) > 0.5;
  const sp = (6 + 16 * Math.abs(Math.sin(t * 9))) * amt;
  return (
    <g opacity={o}>
      <Cat x={x - sp} y={y} s={s} pose="lie" color={P.quantum} o={0.4 * amt} />
      <Cat x={x + sp} y={y} s={s} pose="sit" color={P.red} o={0.4 * amt} />
      <Cat x={x} y={y} s={s} pose={k ? 'sit' : 'lie'} rim={k ? P.light : P.quantum} o={1 - 0.35 * amt} />
      <Cat x={x} y={y} s={s} pose={k ? 'lie' : 'sit'} rim={P.quantum} o={0.35 * amt} />
    </g>
  );
};

export const Label: React.FC<{x: number; y: number; text: string; o?: number; size?: number; color?: string; anchor?: 'start' | 'middle' | 'end'}> = ({
  x,
  y,
  text,
  o = 1,
  size = 26,
  color = P.text,
  anchor = 'middle',
}) => (
  <text x={x} y={y} textAnchor={anchor} fontFamily={FONTS.sans} fontSize={size} fill={color} opacity={o} letterSpacing={3} style={{paintOrder: 'stroke'}} stroke="#000" strokeWidth={4} strokeOpacity={0.6}>
    {text}
  </text>
);

/** 光束里浮动的尘埃 */
export const Dust: React.FC<{x: number; w: number; top: number; bottom: number; t: number; n?: number; o?: number}> = ({x, w, top, bottom, t, n = 40, o = 1}) => (
  <g opacity={o}>
    {Array.from({length: n}, (_, i) => {
      const yy = top + ((hash(i) * (bottom - top) - t * (8 + hash(i + 2) * 14)) % (bottom - top) + (bottom - top)) % (bottom - top);
      const spread = ((yy - top) / (bottom - top)) * w * 0.5 + 30;
      const xx = x + (hash(i + 5) - 0.5) * 2 * spread + Math.sin(t * 0.7 + i) * 8;
      return <circle key={i} cx={xx} cy={yy} r={1 + hash(i + 9) * 2} fill={P.light} opacity={0.15 + hash(i + 3) * 0.4} />;
    })}
  </g>
);

/** 星空（多世界段用） */
export const Stars: React.FC<{t: number; n?: number; o?: number; tint?: string}> = ({t, n = 160, o = 1, tint = P.light}) => (
  <g opacity={o}>
    {Array.from({length: n}, (_, i) => (
      <circle key={i} cx={hash(i * 3.1) * W} cy={hash(i * 5.7) * H} r={0.6 + hash(i) * 1.8} fill={tint} opacity={(0.25 + 0.6 * hash(i + 1)) * (0.7 + 0.3 * Math.sin(t * 2 + i))} />
    ))}
  </g>
);

/** 速度线 / 放射线 */
export const Rays: React.FC<{cx: number; cy: number; n?: number; r0?: number; r1?: number; o?: number; color?: string; rot?: number; width?: number}> = ({
  cx,
  cy,
  n = 48,
  r0 = 200,
  r1 = 1400,
  o = 1,
  color = P.light,
  rot = 0,
  width = 3,
}) => (
  <g opacity={o}>
    {Array.from({length: n}, (_, i) => {
      const a = (i / n) * Math.PI * 2 + rot + hash(i) * 0.1;
      const a0 = r0 * (0.8 + hash(i + 3) * 0.4);
      return <line key={i} x1={cx + Math.cos(a) * a0} y1={cy + Math.sin(a) * a0} x2={cx + Math.cos(a) * r1} y2={cy + Math.sin(a) * r1} stroke={color} strokeWidth={width * (0.4 + hash(i + 7))} opacity={0.3 + hash(i + 1) * 0.5} />;
    })}
  </g>
);

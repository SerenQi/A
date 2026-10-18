import React from 'react';
import {FONTS, H, PALETTE as P, W} from '../config';
import {clamp01, hash, lerp} from '../lib/anim';

export type SP = {s: number};

export const Defs: React.FC = () => (
  <defs>
    <filter id="soft" x="-50%" y="-50%" width="200%" height="200%">
      <feGaussianBlur stdDeviation="18" />
    </filter>
    <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
      <feGaussianBlur stdDeviation="5" result="b" />
      <feMerge>
        <feMergeNode in="b" />
        <feMergeNode in="SourceGraphic" />
      </feMerge>
    </filter>
    <filter id="bigglow" x="-50%" y="-50%" width="200%" height="200%">
      <feGaussianBlur stdDeviation="14" result="b" />
      <feMerge>
        <feMergeNode in="b" />
        <feMergeNode in="b" />
        <feMergeNode in="SourceGraphic" />
      </feMerge>
    </filter>
    <radialGradient id="warmPool">
      <stop offset="0" stopColor={P.gold} stopOpacity="0.35" />
      <stop offset="1" stopColor={P.gold} stopOpacity="0" />
    </radialGradient>
    <radialGradient id="coldPool">
      <stop offset="0" stopColor={P.cold} stopOpacity="0.35" />
      <stop offset="1" stopColor={P.cold} stopOpacity="0" />
    </radialGradient>
    <radialGradient id="redPool">
      <stop offset="0" stopColor={P.red} stopOpacity="0.4" />
      <stop offset="1" stopColor={P.red} stopOpacity="0" />
    </radialGradient>
    <radialGradient id="phoneGlow">
      <stop offset="0" stopColor="#9FC8FF" stopOpacity="0.45" />
      <stop offset="1" stopColor="#9FC8FF" stopOpacity="0" />
    </radialGradient>
    <linearGradient id="dawn" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stopColor="#1B2A44" />
      <stop offset="0.6" stopColor="#E89A5A" />
      <stop offset="1" stopColor="#FFD39A" />
    </linearGradient>
    <linearGradient id="night" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stopColor="#070A12" />
      <stop offset="1" stopColor="#101826" />
    </linearGradient>
  </defs>
);

export const Stage: React.FC<{bg?: string; children: React.ReactNode}> = ({bg = P.bg, children}) => (
  <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{position: 'absolute', inset: 0}}>
    <Defs />
    <rect width={W} height={H} fill={bg} />
    {children}
  </svg>
);

/** 以 (cx, cy) 为中心缩放的镜头 */
export const Cam: React.FC<{z: number; cx?: number; cy?: number; rot?: number; children: React.ReactNode}> = ({z, cx = W / 2, cy = H / 2, rot = 0, children}) => (
  <g transform={`translate(${W / 2},${H / 2}) rotate(${rot}) scale(${z}) translate(${-cx},${-cy})`}>{children}</g>
);

export const Txt: React.FC<{
  x: number;
  y: number;
  text: string;
  size?: number;
  color?: string;
  o?: number;
  weight?: number;
  anchor?: 'start' | 'middle' | 'end';
  font?: string;
  spacing?: number;
  glow?: boolean;
}> = ({x, y, text, size = 28, color = P.text, o = 1, weight = 400, anchor = 'middle', font = FONTS.sans, spacing = 3, glow}) =>
  o <= 0.001 ? null : (
    <text x={x} y={y} textAnchor={anchor} fontFamily={font} fontWeight={weight} fontSize={size} fill={color} opacity={o} letterSpacing={spacing} filter={glow ? 'url(#glow)' : undefined}>
      {text}
    </text>
  );

/** 漂浮的金色微尘 */
export const Motes: React.FC<{t: number; n?: number; o?: number; color?: string; seed?: number}> = ({t, n = 70, o = 1, color = P.gold, seed = 0}) => (
  <g opacity={o}>
    {Array.from({length: n}, (_, i) => {
      const k = i + seed * 100;
      const x = (hash(k) * W + Math.sin(t * 0.2 + k) * 40 + t * (4 + hash(k + 1) * 10)) % W;
      const y = (hash(k + 2) * H - t * (6 + hash(k + 3) * 12) + H * 4) % H;
      return <circle key={i} cx={x} cy={y} r={0.8 + hash(k + 4) * 2.2} fill={color} opacity={(0.15 + 0.5 * hash(k + 5)) * (0.6 + 0.4 * Math.sin(t * 1.3 + k))} />;
    })}
  </g>
);

/* ---------------- 人的侧脸（朝右），原点在脖子底部中心，高约 400 ---------------- */
export const HEAD =
  'M-60,0 C-70,-60 -110,-120 -110,-210 C-110,-330 -20,-400 70,-390 C160,-380 200,-310 195,-240 C194,-220 210,-200 225,-180 C232,-170 222,-162 210,-160 C214,-150 212,-140 205,-135 C210,-128 206,-118 198,-114 C200,-95 190,-82 160,-84 C130,-86 120,-70 120,-40 L125,0 Z';
/** 头内大脑区域的中心（相对原点） */
export const BRAIN = {x: 40, y: -250};

export const Head: React.FC<{x: number; y: number; s?: number; o?: number; rim?: string; fill?: string}> = ({x, y, s = 1, o = 1, rim = P.gold, fill = '#07080C'}) => (
  <g transform={`translate(${x},${y}) scale(${s})`} opacity={o}>
    <path d={HEAD} fill={fill} stroke={rim} strokeWidth={2.5 / s} filter="url(#glow)" />
  </g>
);

/* ---------------- 小人（正面剪影），原点在脚底 ---------------- */
export const Person: React.FC<{x: number; y: number; s?: number; o?: number; color?: string; rim?: string; slump?: number; step?: number}> = ({
  x,
  y,
  s = 1,
  o = 1,
  color = '#0B0C10',
  rim = P.gold,
  slump = 0,
  step = 0,
}) => {
  const lean = slump * 18;
  const sw = Math.sin(step) * 16;
  return (
    <g transform={`translate(${x},${y}) scale(${s})`} opacity={o}>
      <g transform={`rotate(${lean},0,-90)`}>
        <circle cx={0} cy={-205 + slump * 14} r={26} fill={color} stroke={rim} strokeWidth={2 / s} />
        <path d="M-34,-170 C-38,-140 -36,-110 -30,-90 L30,-90 C36,-110 38,-140 34,-170 C20,-178 -20,-178 -34,-170 Z" fill={color} stroke={rim} strokeWidth={2 / s} />
        <path d={`M-34,-165 L${-46 - sw * 0.3},${-100 + slump * 10}`} stroke={rim} strokeWidth={9} strokeLinecap="round" />
        <path d={`M34,-165 L${46 + sw * 0.3},${-100 + slump * 10}`} stroke={rim} strokeWidth={9} strokeLinecap="round" />
      </g>
      <path d={`M-14,-92 L${-16 + sw},0`} stroke={rim} strokeWidth={11} strokeLinecap="round" />
      <path d={`M14,-92 L${16 - sw},0`} stroke={rim} strokeWidth={11} strokeLinecap="round" />
    </g>
  );
};

/* ---------------- 循环：在椭圆上绕圈的光点与拖尾 ---------------- */
export const Orbit: React.FC<{
  cx: number;
  cy: number;
  rx: number;
  ry: number;
  t: number;
  speed?: number;
  o?: number;
  color?: string;
  trail?: number;
  ring?: number;
  r?: number;
  rot?: number;
}> = ({cx, cy, rx, ry, t, speed = 1, o = 1, color = P.gold, trail = 24, ring = 0.25, r = 9, rot = 0}) => {
  const a0 = t * speed * Math.PI * 2;
  const cr = Math.cos((rot * Math.PI) / 180);
  const sr = Math.sin((rot * Math.PI) / 180);
  const pt = (a: number) => {
    const x = Math.cos(a) * rx;
    const y = Math.sin(a) * ry;
    return {x: cx + x * cr - y * sr, y: cy + x * sr + y * cr};
  };
  return (
    <g opacity={o}>
      <ellipse cx={cx} cy={cy} rx={rx} ry={ry} fill="none" stroke={color} strokeWidth={2} opacity={ring} transform={`rotate(${rot} ${cx} ${cy})`} />
      {Array.from({length: trail}, (_, i) => {
        const p = pt(a0 - i * 0.07 * Math.sign(speed || 1));
        return <circle key={i} cx={p.x} cy={p.y} r={r * (1 - i / trail)} fill={color} opacity={(1 - i / trail) * 0.8} />;
      })}
      <circle cx={pt(a0).x} cy={pt(a0).y} r={r} fill={P.ember} filter="url(#glow)" />
    </g>
  );
};

/** 对话气泡 */
export const Bubble: React.FC<{x: number; y: number; w: number; h?: number; text: string; o?: number; dark?: boolean; size?: number; tail?: 'l' | 'r' | 'none'; color?: string}> = ({
  x,
  y,
  w,
  h = 64,
  text,
  o = 1,
  dark,
  size = 28,
  tail = 'l',
  color,
}) =>
  o <= 0.001 ? null : (
    <g transform={`translate(${x},${y})`} opacity={o}>
      <rect x={-w / 2} y={-h / 2} width={w} height={h} rx={h / 2} fill={color ?? (dark ? '#1C1F27' : P.paper)} stroke={dark ? '#3A3E4A' : 'none'} strokeWidth={2} />
      {tail === 'l' && <path d={`M${-w / 2 + 24},${h / 2 - 6} l-18,22 l34,-14 Z`} fill={color ?? (dark ? '#1C1F27' : P.paper)} />}
      {tail === 'r' && <path d={`M${w / 2 - 24},${h / 2 - 6} l18,22 l-34,-14 Z`} fill={color ?? (dark ? '#1C1F27' : P.paper)} />}
      <text y={size * 0.36} textAnchor="middle" fontFamily={FONTS.sans} fontSize={size} fill={dark ? P.text : P.ink} letterSpacing={2}>
        {text}
      </text>
    </g>
  );

/** 打字机：按进度截取字符 */
export const typed = (text: string, p: number) => {
  const chars = Array.from(text);
  return chars.slice(0, Math.round(clamp01(p) * chars.length)).join('');
};

export const mix = (a: number, b: number, t: number) => lerp(a, b, clamp01(t));

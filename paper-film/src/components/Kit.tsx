import React from 'react';
import {FONTS, H, PALETTE as P, W} from '../config';
import {clamp01, hash} from '../lib/anim';

/** 画线进度 */
export const drawn = (p: number | undefined) =>
  p === undefined || p >= 1 ? {} : {pathLength: 1, strokeDasharray: 1, strokeDashoffset: 1 - Math.max(0, p)};

/* ---------------- 全局滤镜 ---------------- */
export const Defs: React.FC = () => (
  <defs>
    <filter id="shadow" x="-30%" y="-30%" width="160%" height="170%">
      <feDropShadow dx="0" dy="14" stdDeviation="14" floodColor="#000" floodOpacity="0.55" />
    </filter>
    <filter id="shadowLow" x="-30%" y="-30%" width="160%" height="170%">
      <feDropShadow dx="0" dy="4" stdDeviation="4" floodColor="#000" floodOpacity="0.5" />
    </filter>
    <filter id="blurFg" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="9" />
    </filter>
    <filter id="blurSoft" x="-50%" y="-50%" width="200%" height="200%">
      <feGaussianBlur stdDeviation="18" />
    </filter>
    <radialGradient id="screenGlow">
      <stop offset="0" stopColor={P.glow} stopOpacity="0.35" />
      <stop offset="1" stopColor={P.glow} stopOpacity="0" />
    </radialGradient>
    <linearGradient id="screenGrad" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stopColor="#10223A" />
      <stop offset="1" stopColor="#081221" />
    </linearGradient>
    <linearGradient id="gutter" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stopColor="#000" stopOpacity="0" />
      <stop offset="0.5" stopColor="#000" stopOpacity="0.22" />
      <stop offset="1" stopColor="#000" stopOpacity="0" />
    </linearGradient>
  </defs>
);

/* ---------------- 桌面（屏幕空间背景） ---------------- */
const GRAIN = Array.from({length: 70}, (_, i) => {
  const y0 = (i / 70) * (H + 600) - 300;
  const pts: string[] = [];
  for (let x = -400; x <= W + 400; x += 60) {
    const y = y0 + Math.sin(x * 0.0021 + i * 1.7) * 22 + Math.sin(x * 0.007 + i) * 6;
    pts.push(`${x},${y.toFixed(1)}`);
  }
  return {d: `M${pts.join('L')}`, w: 1 + hash(i) * 3, c: hash(i + 9) > 0.5 ? P.deskGrain : P.deskGrain2};
});

export const Desk: React.FC<{
  panX?: number;
  panY?: number;
  /** 台灯光池位置（屏幕坐标）与强度 */
  lampX?: number;
  lampY?: number;
  lamp?: number;
  /** 窗光：0..1 从左到右扫过；windowOn 为强度 */
  windowT?: number;
  windowOn?: number;
  night?: number;
}> = ({panX = 0, panY = 0, lampX = W * 0.55, lampY = H * 0.42, lamp = 1, windowT = 0, windowOn = 0, night = 0}) => {
  const wx = -500 + windowT * (W + 1000);
  return (
    <svg width={W} height={H} style={{position: 'absolute', inset: 0}}>
      <rect width={W} height={H} fill={P.desk} />
      <g transform={`translate(${panX % 600},${panY})`}>
        {GRAIN.map((g, i) => (
          <path key={i} d={g.d} fill="none" stroke={g.c} strokeWidth={g.w} opacity={0.9} />
        ))}
      </g>
      {/* 窗光：两块平行四边形 */}
      {windowOn > 0.01 &&
        [0, 1].map((k) => (
          <path
            key={k}
            d={`M${wx + k * 260},${-100} l220,0 l-360,${H + 200} l-220,0 Z`}
            fill="#FFE2B8"
            opacity={0.07 * windowOn}
            filter="url(#blurSoft)"
          />
        ))}
      <defs>
        <radialGradient id="lampPool" cx={lampX / W} cy={lampY / H} r="0.62" gradientUnits="objectBoundingBox">
          <stop offset="0" stopColor="#FFC480" stopOpacity={0.2 * lamp} />
          <stop offset="0.55" stopColor="#FFC480" stopOpacity={0.05 * lamp} />
          <stop offset="1" stopColor="#000" stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect width={W} height={H} fill="url(#lampPool)" />
      <rect width={W} height={H} fill="#03050A" opacity={0.55 * night} />
      {/* 暗角 */}
      <defs>
        <radialGradient id="vig" cx="0.5" cy="0.48" r="0.75">
          <stop offset="0.55" stopColor="#000" stopOpacity="0" />
          <stop offset="1" stopColor="#000" stopOpacity="0.7" />
        </radialGradient>
      </defs>
      <rect width={W} height={H} fill="url(#vig)" />
    </svg>
  );
};

/* ---------------- 桌上杂物 ---------------- */
export const Pen: React.FC<{x: number; y: number; rot?: number; len?: number; blur?: boolean}> = ({x, y, rot = 0, len = 420, blur}) => (
  <g transform={`translate(${x},${y}) rotate(${rot})`} filter={blur ? 'url(#blurFg)' : 'url(#shadowLow)'}>
    <rect x={-len / 2} y={-9} width={len * 0.82} height={18} rx={9} fill="#1E2A2F" />
    <rect x={-len / 2 + len * 0.6} y={-10} width={len * 0.08} height={20} rx={3} fill="#B9A27A" />
    <path d={`M${-len / 2 + len * 0.82},-8 L${len / 2},0 L${-len / 2 + len * 0.82},8 Z`} fill="#C9B48E" />
    <rect x={-len / 2 + 30} y={-14} width={len * 0.3} height={5} rx={2} fill="#B9A27A" />
    <line x1={-len / 2 + 12} x2={-len / 2 + len * 0.55} y1={-4} y2={-4} stroke="#fff" strokeOpacity={0.12} strokeWidth={3} />
  </g>
);

export const CoffeeRing: React.FC<{x: number; y: number; r?: number}> = ({x, y, r = 90}) => (
  <g transform={`translate(${x},${y})`} opacity={0.5}>
    <circle r={r} fill="none" stroke="#4A3324" strokeWidth={7} strokeOpacity={0.5} />
    <circle r={r - 6} fill="none" stroke="#4A3324" strokeWidth={2} strokeOpacity={0.35} />
  </g>
);

export const Clip: React.FC<{x: number; y: number; rot?: number}> = ({x, y, rot = 0}) => (
  <path
    transform={`translate(${x},${y}) rotate(${rot})`}
    d="M0,0 L0,-58 Q0,-70 12,-70 Q24,-70 24,-58 L24,-6 Q24,4 14,4 Q6,4 6,-6 L6,-48"
    fill="none"
    stroke="#B8BCC0"
    strokeWidth={3}
    strokeLinecap="round"
    filter="url(#shadowLow)"
  />
);

export const Leaf: React.FC<{x: number; y: number; rot?: number; s?: number}> = ({x, y, rot = 0, s = 1}) => (
  <g transform={`translate(${x},${y}) rotate(${rot}) scale(${s})`} filter="url(#shadowLow)">
    <path d="M0,0 C30,-40 90,-46 130,-10 C90,24 30,24 0,0 Z" fill="#6E7F4E" />
    <path d="M0,0 C40,-6 90,-10 130,-10" fill="none" stroke="#9AAA72" strokeWidth={1.5} />
    {[30, 60, 90].map((k) => (
      <path key={k} d={`M${k},${-5 - k * 0.03} q12,-10 22,-16 M${k},${-5 - k * 0.03} q12,8 20,12`} fill="none" stroke="#9AAA72" strokeWidth={1} />
    ))}
    <path d="M0,0 L-30,6" stroke="#6E7F4E" strokeWidth={3} strokeLinecap="round" />
  </g>
);

export const StickyNote: React.FC<{x: number; y: number; rot?: number; color?: string; s?: number; children?: React.ReactNode}> = ({x, y, rot = 0, color = P.noteYellow, s = 170, children}) => (
  <g transform={`translate(${x},${y}) rotate(${rot})`} filter="url(#shadowLow)">
    <rect x={-s / 2} y={-s / 2} width={s} height={s} fill={color} />
    <rect x={-s / 2} y={-s / 2} width={s} height={22} fill="#000" opacity={0.06} />
    <path d={`M${s / 2 - 26},${s / 2} L${s / 2},${s / 2 - 26} L${s / 2},${s / 2} Z`} fill="#000" opacity={0.08} />
    {children}
  </g>
);

/** 红色印章 */
export const Stamp: React.FC<{x: number; y: number; t: number; rot?: number; text?: string}> = ({x, y, t, rot = -12, text = '2019.03.14'}) => {
  if (t <= 0) return null;
  const down = clamp01(t / 0.35);
  const sc = 1.6 - 0.6 * down;
  return (
    <g transform={`translate(${x},${y}) rotate(${rot}) scale(${sc})`} opacity={down * 0.85}>
      <circle r={58} fill="none" stroke={P.stamp} strokeWidth={4} />
      <circle r={48} fill="none" stroke={P.stamp} strokeWidth={1.5} />
      <text y={7} textAnchor="middle" fontFamily={FONTS.title} fontSize={19} fill={P.stamp} letterSpacing={1}>
        {text}
      </text>
      <text y={-20} textAnchor="middle" fontFamily={FONTS.title} fontSize={12} fill={P.stamp} letterSpacing={4}>
        已入场
      </text>
    </g>
  );
};

/* ---------------- 手机 ---------------- */
export const Phone: React.FC<{
  id: string;
  x: number;
  y: number;
  w?: number;
  h?: number;
  rot?: number;
  level?: number;
  screen?: number;
  shake?: number;
  children?: React.ReactNode;
}> = ({id, x, y, w = 300, h = 600, rot = 0, level = 1, screen = 1, shake = 0, children}) => {
  const sx = -w / 2 + 12;
  const sy = -h / 2 + 12;
  const sw = w - 24;
  const sh = h - 24;
  return (
    <g transform={`translate(${x + shake},${y}) rotate(${rot})`} opacity={level}>
      <defs>
        <clipPath id={`scr-${id}`}>
          <rect x={sx} y={sy} width={sw} height={sh} rx={30} />
        </clipPath>
      </defs>
      {screen > 0.02 && <ellipse cx={0} cy={0} rx={w * 1.1} ry={h * 0.75} fill="url(#screenGlow)" opacity={screen} />}
      <rect x={-w / 2} y={-h / 2} width={w} height={h} rx={42} fill={P.phone} stroke="#2A2E33" strokeWidth={2} filter="url(#shadow)" />
      <rect x={-w / 2 + 2} y={-h / 2 + 2} width={w - 4} height={h - 4} rx={40} fill="none" stroke="#fff" strokeOpacity={0.06} strokeWidth={2} />
      <rect x={sx} y={sy} width={sw} height={sh} rx={30} fill="#040608" />
      <g clipPath={`url(#scr-${id})`} opacity={screen}>
        <rect x={sx} y={sy} width={sw} height={sh} fill="url(#screenGrad)" />
        <g transform={`translate(${sx},${sy})`}>{children}</g>
      </g>
      <rect x={-40} y={-h / 2 + 22} width={80} height={22} rx={11} fill="#000" />
    </g>
  );
};

export const NotifCard: React.FC<{x: number; y: number; w: number; h?: number; seed: number; opacity?: number; color?: string}> = ({x, y, w, h = 66, seed, opacity = 1, color}) => {
  const icon = color ?? ['#5E8BD8', '#58B38C', '#D9875A', '#A77BD6'][Math.floor(hash(seed) * 4)];
  return (
    <g transform={`translate(${x},${y})`} opacity={opacity}>
      <rect width={w} height={h} rx={16} fill="#1B2B42" fillOpacity={0.92} />
      <rect x={14} y={h / 2 - 15} width={30} height={30} rx={8} fill={icon} />
      <rect x={56} y={h / 2 - 13} width={(w - 90) * (0.5 + hash(seed + 1) * 0.4)} height={8} rx={4} fill={P.screenText} opacity={0.85} />
      <rect x={56} y={h / 2 + 5} width={(w - 90) * (0.3 + hash(seed + 3) * 0.5)} height={7} rx={3.5} fill={P.screenText} opacity={0.45} />
    </g>
  );
};

export const Badge: React.FC<{x: number; y: number; n: number | string; opacity?: number; r?: number}> = ({x, y, n, opacity = 1, r = 14}) => (
  <g transform={`translate(${x},${y})`} opacity={opacity}>
    <circle r={r} fill={P.alert} />
    <text y={r * 0.38} textAnchor="middle" fontFamily={FONTS.body} fontSize={r * 1.05} fill="#fff">
      {n}
    </text>
  </g>
);

export const Battery: React.FC<{x: number; y: number; level: number; opacity?: number}> = ({x, y, level, opacity = 1}) => (
  <g transform={`translate(${x},${y})`} opacity={opacity}>
    <rect x={-22} y={-10} width={44} height={20} rx={5} fill="none" stroke={P.screenText} strokeWidth={1.6} />
    <rect x={23} y={-4} width={4} height={8} rx={1} fill={P.screenText} />
    <rect x={-19} y={-7} width={Math.max(0, 38 * level)} height={14} rx={2.5} fill={level < 0.2 ? P.alert : '#7BD39A'} />
  </g>
);

/** 屏幕上的“打字”文字 */
export const ScreenText: React.FC<{x: number; y: number; text: string; size?: number; color?: string; opacity?: number; cursor?: boolean}> = ({x, y, text, size = 30, color = P.screenText, opacity = 1, cursor}) => (
  <g opacity={opacity}>
    <text x={x} y={y} fontFamily={FONTS.body} fontSize={size} fill={color}>
      {text}
    </text>
    {cursor && <rect x={x + Array.from(text).length * size + 3} y={y - size * 0.85} width={3} height={size} fill={color} />}
  </g>
);

/* ---------------- 纸 ---------------- */
export const Sheet: React.FC<{
  x: number;
  y: number;
  w: number;
  h: number;
  rot?: number;
  level?: number;
  seed?: number;
  ruled?: boolean;
  crease?: number;
  lift?: number;
  children?: React.ReactNode;
}> = ({x, y, w, h, rot = 0, level = 1, seed = 1, ruled = true, crease = 0, lift = 0, children}) => {
  const specks = Array.from({length: Math.round((w * h) / 5200)}, (_, i) => (
    <circle key={i} cx={hash(seed * 31 + i) * w} cy={hash(seed * 57 + i * 3) * h} r={0.6 + hash(i + seed) * 0.9} fill="#8C8370" opacity={0.25} />
  ));
  const lines = [];
  if (ruled) for (let ly = 70; ly < h - 26; ly += 38) lines.push(<line key={ly} x1={0} x2={w} y1={ly} y2={ly} stroke={P.rule} strokeWidth={1.2} opacity={0.75} />);
  const c = 54 * crease;
  return (
    <g transform={`translate(${x},${y - lift}) rotate(${rot}) translate(${-w / 2},${-h / 2})`} opacity={level}>
      <path d={`M0,0H${w}V${h - c}L${w - c},${h}H0Z`} fill={P.paper} filter="url(#shadow)" />
      <path d={`M0,0H${w}V${h * 0.25}L0,${h * 0.45}Z`} fill="#fff" opacity={0.05} />
      {specks}
      {lines}
      {ruled && <line x1={64} x2={64} y1={0} y2={h} stroke={P.margin} strokeWidth={1.2} opacity={0.8} />}
      {crease > 0.01 && (
        <g>
          <path d={`M${w},${h - c}L${w - c * 0.92},${h - c * 0.92}L${w - c},${h}Z`} fill={P.paperShade} />
          <path d={`M${w - c * 0.9},${h - c * 0.9}L${w * 0.6},${h * 0.66}L${w * 0.68},${h * 0.44}`} fill="none" stroke="#9E9381" strokeWidth={1.2} opacity={crease} />
          <path d={`M${w * 0.6},${h * 0.66}L${w * 0.36},${h * 0.84}`} fill="none" stroke="#9E9381" strokeWidth={1.2} opacity={crease} />
          <path d={`M${w * 0.6},${h * 0.66}L${w},${h * 0.44}L${w * 0.68},${h * 0.44}Z`} fill="#000" opacity={0.05 * crease} />
        </g>
      )}
      {children}
    </g>
  );
};

/** 手写字（墨水），从左到右“写”出来 */
export const Hand: React.FC<{id: string; x: number; y: number; text: string; size?: number; reveal?: number; color?: string; opacity?: number}> = ({
  id,
  x,
  y,
  text,
  size = 40,
  reveal = 1,
  color = P.ink,
  opacity = 1,
}) => {
  const wEst = Array.from(text).length * size * 1.02 + 10;
  return (
    <g opacity={opacity}>
      <defs>
        <clipPath id={`hand-${id}`}>
          <rect x={x - 4} y={y - size * 1.1} width={wEst * clamp01(reveal)} height={size * 1.5} />
        </clipPath>
      </defs>
      <text x={x} y={y} fontFamily={FONTS.hand} fontSize={size} fill={color} clipPath={`url(#hand-${id})`}>
        {text}
      </text>
    </g>
  );
};

// 龙藏体字形较窄，实测约 0.8 em
export const handWidth = (text: string, size: number) => Array.from(text).length * size * 0.8;

export const Strike: React.FC<{x1: number; x2: number; y: number; draw?: number; color?: string; seed?: number; width?: number}> = ({x1, x2, y, draw = 1, color = P.ink, seed = 1, width = 2.6}) => {
  const pts: string[] = [];
  const n = 10;
  for (let i = 0; i <= n; i++) pts.push(`${(x1 + ((x2 - x1) * i) / n).toFixed(1)},${(y + (hash(seed * 7 + i) - 0.5) * 5).toFixed(1)}`);
  return <path d={`M${pts.join('L')}`} fill="none" stroke={color} strokeWidth={width} strokeLinecap="round" {...drawn(draw)} />;
};

/* ---------------- 票根 ---------------- */
export const Ticket: React.FC<{
  x: number;
  y: number;
  w?: number;
  h?: number;
  rot?: number;
  level?: number;
  bodyDx?: number;
  bodyDy?: number;
  bodyRot?: number;
  bodyOpacity?: number;
  stubDx?: number;
  stubRot?: number;
  glow?: number;
  scale?: number;
  perforation?: boolean;
}> = ({x, y, w = 640, h = 240, rot = 0, level = 1, bodyDx = 0, bodyDy = 0, bodyRot = 0, bodyOpacity = 1, stubDx = 0, stubRot = 0, glow = 0, scale = 1, perforation = true}) => {
  const px = w * 0.68;
  const nr = 14;
  const bodyPath = `M0,0H${px - nr}A${nr},${nr} 0 0 0 ${px},${nr}V${h - nr}A${nr},${nr} 0 0 0 ${px - nr},${h}H0Z`;
  const stubPath = `M${px},${nr}A${nr},${nr} 0 0 0 ${px + nr},0H${w}V${h}H${px + nr}A${nr},${nr} 0 0 0 ${px},${h - nr}Z`;
  return (
    <g transform={`translate(${x},${y}) rotate(${rot}) scale(${scale}) translate(${-w / 2},${-h / 2})`} opacity={level}>
      {bodyOpacity > 0.01 && (
        <g transform={`translate(${bodyDx},${bodyDy}) rotate(${bodyRot},${px / 2},${h / 2})`} opacity={bodyOpacity}>
          <path d={bodyPath} fill={P.ticket} filter="url(#shadow)" />
          <rect x={0} y={0} width={px - nr} height={58} fill={P.teal} />
          <text x={40} y={42} fontFamily={FONTS.title} fontSize={30} fill={P.ticket} letterSpacing={12}>
            入场券
          </text>
          <text x={px - 40} y={38} textAnchor="end" fontFamily={FONTS.title} fontSize={15} fill={P.ticket} letterSpacing={6}>
            ADMIT ONE
          </text>
          <rect x={30} y={84} width={px - 90} height={h - 114} fill="none" stroke={P.teal} strokeWidth={1.4} strokeDasharray="5 5" opacity={0.6} />
          <text x={48} y={140} fontFamily={FONTS.title} fontSize={40} fill={P.stamp} letterSpacing={4}>
            No.0314
          </text>
          <text x={48} y={184} fontFamily={FONTS.body} fontSize={22} fill={P.ink} opacity={0.75}>
            2019.03.14 · 7排 12座
          </text>
        </g>
      )}
      <g transform={`translate(${stubDx},0) rotate(${stubRot},${px},${h / 2})`}>
        {glow > 0.01 && <path d={stubPath} fill="none" stroke={P.accent} strokeWidth={10} strokeOpacity={0.35 * glow} filter="url(#blurFg)" />}
        <path d={stubPath} fill={P.ticket} filter="url(#shadow)" />
        <rect x={px + nr} y={0} width={w - px - nr} height={58} fill={P.teal} />
        <text x={px + (w - px) / 2 + 6} y={h / 2 + 18} textAnchor="middle" fontFamily={FONTS.title} fontSize={30} fill={P.stamp}>
          0314
        </text>
        <text x={px + (w - px) / 2 + 6} y={h / 2 + 52} textAnchor="middle" fontFamily={FONTS.body} fontSize={16} fill={P.ink} opacity={0.7}>
          2019.03.14
        </text>
      </g>
      {perforation && stubDx < 1 && bodyDx > -1 && <line x1={px} x2={px} y1={nr + 4} y2={h - nr - 4} stroke={P.ink} strokeOpacity={0.45} strokeWidth={2} strokeDasharray="2 7" strokeLinecap="round" />}
    </g>
  );
};

/* ---------------- 本子 ---------------- */
const Ruled: React.FC<{pw: number; ph: number; dy?: number}> = ({pw, ph, dy = 0}) => (
  <>
    {Array.from({length: Math.floor((ph - 90) / 36)}, (_, i) => (
      <line key={i} x1={20} x2={pw - 20} y1={-ph / 2 + 70 + i * 36 + dy} y2={-ph / 2 + 70 + i * 36 + dy} stroke={P.rule} strokeWidth={1.1} opacity={0.7} />
    ))}
  </>
);

/**
 * 摊开的本子。原点在书脊中心；每页 pw×ph。
 * flip ∈ [0,1]：一页从右往左翻（dir=1）或从左往右翻（dir=-1）。
 * 各页内容使用页面局部坐标 x∈[0,pw]（从左往右读）、y∈[-ph/2,ph/2]。
 */
export const Notebook: React.FC<{
  x: number;
  y: number;
  pw?: number;
  ph?: number;
  rot?: number;
  level?: number;
  flip?: number;
  dir?: 1 | -1;
  left?: React.ReactNode;
  right?: React.ReactNode;
  flipFront?: React.ReactNode;
  flipBack?: React.ReactNode;
  flipLevel?: number;
  flipTint?: string;
  /** 页角翘起（露出的一角） */
  curl?: number;
}> = ({x, y, pw = 380, ph = 500, rot = 0, level = 1, flip = 0, dir = 1, left, right, flipFront, flipBack, flipLevel = 1, flipTint, curl = 0}) => {
  const page = (onLeft: boolean, content: React.ReactNode, key: string) => (
    <g key={key} transform={onLeft ? `translate(${-pw},0)` : undefined}>
      <rect x={0} y={-ph / 2} width={pw} height={ph} fill={P.paper} />
      <Ruled pw={pw} ph={ph} />
      {content}
    </g>
  );
  const active = flip > 0.001 && flip < 0.999;
  const c = Math.cos(Math.PI * flip) * dir;
  const lift = Math.sin(Math.PI * flip) * 30;
  const xe = pw * c;
  const onRight = c > 0;
  const flipContent = (dir === 1) === onRight ? flipFront : flipBack;
  const flipTf = onRight ? `scale(${c},1)` : `translate(${c * pw},0) scale(${-c},1)`;
  const shade = 0.25 * (1 - Math.abs(c));
  const cs = 70 * curl;
  return (
    <g transform={`translate(${x},${y}) rotate(${rot})`} opacity={level}>
      {/* 封皮 */}
      <rect x={-pw - 16} y={-ph / 2 - 14} width={pw * 2 + 32} height={ph + 28} rx={10} fill={P.cover} filter="url(#shadow)" />
      <rect x={-pw - 16} y={-ph / 2 - 14} width={pw * 2 + 32} height={ph + 28} rx={10} fill="none" stroke="#fff" strokeOpacity={0.05} strokeWidth={2} />
      {/* 下面几层纸的边 */}
      {[6, 4, 2].map((d) => (
        <rect key={d} x={-pw - d * 0.3} y={-ph / 2 + d} width={pw * 2 + d * 0.6} height={ph} fill={P.paperShade} opacity={0.9} />
      ))}
      {page(true, left, 'L')}
      {page(false, right, 'R')}
      <rect x={-46} y={-ph / 2} width={92} height={ph} fill="url(#gutter)" />
      {/* 页角翘起 */}
      {cs > 0.5 && (
        <g>
          <path d={`M${pw - cs},${ph / 2} L${pw},${ph / 2 - cs} L${pw},${ph / 2} Z`} fill={P.cover} />
          <path d={`M${pw - cs},${ph / 2} L${pw},${ph / 2 - cs} L${pw - cs * 0.95},${ph / 2 - cs * 0.95} Z`} fill={P.paperShade} filter="url(#shadowLow)" />
        </g>
      )}
      {active && (
        <g opacity={flipLevel}>
          <path
            d={`M0,${-ph / 2} Q${xe * 0.55},${-ph / 2 - lift * 1.4} ${xe},${-ph / 2 - lift} L${xe},${ph / 2 - lift * 0.4} Q${xe * 0.55},${ph / 2 - lift * 0.2} 0,${ph / 2} Z`}
            fill={flipTint ?? P.paper}
            filter="url(#shadow)"
          />
          <g transform={flipTf}>
            <Ruled pw={pw} ph={ph} dy={-lift * 0.5} />
            {flipContent}
          </g>
          <path
            d={`M0,${-ph / 2} Q${xe * 0.55},${-ph / 2 - lift * 1.4} ${xe},${-ph / 2 - lift} L${xe},${ph / 2 - lift * 0.4} Q${xe * 0.55},${ph / 2 - lift * 0.2} 0,${ph / 2} Z`}
            fill="#000"
            opacity={shade}
          />
        </g>
      )}
      {/* 松紧带 */}
      <rect x={pw + 4} y={-ph / 2 - 14} width={7} height={ph + 28} fill="#1A211D" />
    </g>
  );
};

/** 合上的本子（斜俯视），页数决定厚度 */
export const NotebookBox: React.FC<{x: number; y: number; w?: number; h?: number; pages: number; level?: number; stub?: number}> = ({x, y, w = 360, h = 480, pages, level = 1, stub = 0}) => {
  const t = 6 + pages * 0.32; // 厚度（像素）
  const dx = t * 0.55;
  const dy = t * 0.85;
  const stripes = [];
  const n = Math.min(80, Math.round(t / 2.2));
  for (let i = 1; i < n; i++) {
    const k = i / n;
    stripes.push(<path key={i} d={`M${w / 2 + dx * k},${-h / 2 + dy * k} L${w / 2 + dx * k},${h / 2 + dy * k} L${-w / 2 + dx * k},${h / 2 + dy * k}`} fill="none" stroke="#B9AE96" strokeWidth={0.8} opacity={0.8} />);
  }
  return (
    <g transform={`translate(${x - dx / 2},${y - dy / 2})`} opacity={level}>
      <path d={`M${w / 2},${-h / 2} L${w / 2 + dx},${-h / 2 + dy} L${w / 2 + dx},${h / 2 + dy} L${-w / 2 + dx},${h / 2 + dy} L${-w / 2},${h / 2} L${w / 2},${h / 2} Z`} fill={P.paperShade} filter="url(#shadow)" />
      {stripes}
      <rect x={-w / 2} y={-h / 2} width={w} height={h} rx={8} fill={P.cover} />
      <rect x={-w / 2 + 2} y={-h / 2 + 2} width={w - 4} height={h - 4} rx={7} fill="none" stroke="#fff" strokeOpacity={0.06} strokeWidth={2} />
      <rect x={w / 2 - 34} y={-h / 2} width={8} height={h} fill="#1A211D" />
      <rect x={-w / 2 + 50} y={-h / 2 + 70} width={150} height={44} rx={4} fill={P.paper} opacity={0.85} />
      {stub > 0.01 && (
        <g transform={`translate(${w / 2 - 10},${-h / 2 + 120}) rotate(-6)`} opacity={stub}>
          <rect x={0} y={0} width={70} height={46} fill={P.ticket} filter="url(#shadowLow)" />
          <rect x={0} y={0} width={70} height={12} fill={P.teal} />
          <text x={36} y={36} textAnchor="middle" fontFamily={FONTS.title} fontSize={15} fill={P.stamp}>
            0314
          </text>
        </g>
      )}
    </g>
  );
};

/** 列表 + 滚动条（屏幕内坐标） */
export const ScrollList: React.FC<{w: number; h: number; offset: number; thumb: number; thumbPos: number}> = ({w, h, offset, thumb, thumbPos}) => {
  const rowH = 58;
  const rows = [];
  const first = Math.floor(offset / rowH);
  for (let i = first; i < first + Math.ceil(h / rowH) + 1; i++) {
    const yy = i * rowH - offset + 70;
    rows.push(
      <g key={i} transform={`translate(18,${yy})`}>
        <rect x={0} y={4} width={34} height={34} rx={9} fill={['#5E8BD8', '#58B38C', '#D9875A', '#A77BD6'][i % 4]} opacity={0.85} />
        <rect x={48} y={8} width={(w - 110) * (0.4 + hash(i) * 0.5)} height={9} rx={4.5} fill={P.screenText} opacity={0.8} />
        <rect x={48} y={26} width={(w - 130) * (0.2 + hash(i + 9) * 0.4)} height={7} rx={3.5} fill={P.screenText} opacity={0.4} />
      </g>,
    );
  }
  const trackH = h - 110;
  return (
    <g>
      {rows}
      <rect x={0} y={0} width={w} height={60} fill="#0E1D33" />
      <rect x={w - 14} y={70} width={4} height={trackH} rx={2} fill={P.screenText} opacity={0.15} />
      <rect x={w - 16} y={70 + (trackH - thumb) * thumbPos} width={8} height={thumb} rx={4} fill={P.screenText} opacity={0.9} />
    </g>
  );
};

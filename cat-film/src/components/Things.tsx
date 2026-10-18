import React from 'react';
import {FONTS, H, PALETTE as P, W} from '../config';
import {clamp01, hash} from '../lib/anim';

export const Defs: React.FC = () => (
  <defs>
    <filter id="soft" x="-50%" y="-50%" width="200%" height="200%">
      <feGaussianBlur stdDeviation="16" />
    </filter>
    <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
      <feGaussianBlur stdDeviation="6" result="b" />
      <feMerge>
        <feMergeNode in="b" />
        <feMergeNode in="SourceGraphic" />
      </feMerge>
    </filter>
    <filter id="shadow" x="-30%" y="-30%" width="160%" height="180%">
      <feDropShadow dx="0" dy="18" stdDeviation="18" floodColor="#000" floodOpacity="0.7" />
    </filter>
    <linearGradient id="beam" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stopColor={P.light} stopOpacity="0.32" />
      <stop offset="1" stopColor={P.light} stopOpacity="0" />
    </linearGradient>
    <linearGradient id="woodFront" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stopColor={P.woodLight} />
      <stop offset="1" stopColor={P.woodDark} />
    </linearGradient>
    <linearGradient id="woodTop" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stopColor="#B8895A" />
      <stop offset="1" stopColor={P.woodLight} />
    </linearGradient>
    <radialGradient id="pool">
      <stop offset="0" stopColor={P.light} stopOpacity="0.25" />
      <stop offset="1" stopColor={P.light} stopOpacity="0" />
    </radialGradient>
    <radialGradient id="qglow">
      <stop offset="0" stopColor={P.quantum} stopOpacity="0.8" />
      <stop offset="1" stopColor={P.quantum} stopOpacity="0" />
    </radialGradient>
  </defs>
);

/** 顶光：一束从上方打下来的光与地面光池 */
export const Spotlight: React.FC<{x: number; floor: number; w?: number; o?: number}> = ({x, floor, w = 700, o = 1}) => (
  <g opacity={o}>
    <path d={`M${x - 40},-20 L${x + 40},-20 L${x + w / 2},${floor} L${x - w / 2},${floor} Z`} fill="url(#beam)" />
    <ellipse cx={x} cy={floor} rx={w * 0.62} ry={70} fill="url(#pool)" />
  </g>
);

/* ---------------- 猫 ---------------- */
export const CAT_SIT =
  'M-60,0 C-70,-40 -62,-92 -40,-122 C-52,-150 -46,-176 -30,-190 L-24,-216 L-8,-196 C0,-198 8,-198 16,-196 L30,-216 L35,-189 C49,-173 51,-148 39,-128 C60,-100 68,-50 58,0 Z';
export const CAT_LIE =
  'M-118,0 C-118,-38 -66,-54 0,-52 C40,-50 72,-46 88,-40 C96,-58 110,-68 124,-64 L130,-84 L139,-62 C152,-55 154,-34 142,-21 C131,-8 112,0 92,0 Z';

export const Cat: React.FC<{x: number; y: number; s?: number; pose?: 'sit' | 'lie'; color?: string; o?: number; rim?: string}> = ({x, y, s = 1, pose = 'sit', color = '#0A0908', o = 1, rim}) => (
  <g transform={`translate(${x},${y}) scale(${s})`} opacity={o}>
    <path d={pose === 'sit' ? CAT_SIT : CAT_LIE} fill={color} stroke={rim ?? 'none'} strokeWidth={rim ? 2.5 / s : 0} />
    {pose === 'sit' ? (
      <path d="M52,-6 C104,-10 116,-62 92,-84" fill="none" stroke={color} strokeWidth={14} strokeLinecap="round" />
    ) : (
      <path d="M-116,-8 C-160,-6 -186,-14 -200,-4" fill="none" stroke={color} strokeWidth={13} strokeLinecap="round" />
    )}
    {rim && pose === 'sit' && <path d="M52,-6 C104,-10 116,-62 92,-84" fill="none" stroke={rim} strokeWidth={2.5 / s} strokeLinecap="round" opacity={0.8} />}
  </g>
);

/* ---------------- 木箱 ---------------- */
export const BOX = {w: 560, h: 380, dx: 110, dy: -80};

/**
 * 木箱（正面 + 顶面 + 右侧面），(x, y) 为正面底边中心。
 * lid 0..1 掀开顶盖；cut 0..1 正面变透明，露出内部（children 画在箱内，坐标原点同 x,y）。
 */
export const Box: React.FC<{x: number; y: number; s?: number; lid?: number; cut?: number; glow?: number; children?: React.ReactNode}> = ({x, y, s = 1, lid = 0, cut = 0, glow = 0, children}) => {
  const {w, h, dx, dy} = BOX;
  const L = -w / 2;
  const R = w / 2;
  const T = -h;
  const planks = [0.25, 0.5, 0.75];
  const lidLift = lid * 220;
  return (
    <g transform={`translate(${x},${y}) scale(${s})`}>
      <ellipse cx={dx / 2} cy={10} rx={w * 0.66} ry={34} fill="#000" opacity={0.6} filter="url(#soft)" />
      {/* 背板与内部 */}
      <path d={`M${L + dx},${T + dy} L${R + dx},${T + dy} L${R + dx},${dy} L${L + dx},${dy} Z`} fill="#1A110A" />
      <path d={`M${L},${T} L${L + dx},${T + dy} L${L + dx},${dy} L${L},0 Z`} fill="#24170D" />
      <path d={`M${L},0 L${L + dx},${dy} L${R + dx},${dy} L${R},0 Z`} fill="#2B1C10" />
      {glow > 0.01 && <ellipse cx={dx / 2} cy={-h / 2 + dy / 2} rx={w * 0.45} ry={h * 0.4} fill="url(#qglow)" opacity={glow * 0.55} />}
      <g>{children}</g>
      {/* 右侧面 */}
      <path d={`M${R},${T} L${R + dx},${T + dy} L${R + dx},${dy} L${R},0 Z`} fill={P.woodDark} />
      {planks.map((k) => (
        <path key={k} d={`M${R},${T + h * k} L${R + dx},${T + dy + h * k}`} stroke="#1E1309" strokeWidth={3} />
      ))}
      {/* 正面（可透明） */}
      <g opacity={1 - cut * 0.88}>
        <rect x={L} y={T} width={w} height={h} fill="url(#woodFront)" />
        {planks.map((k) => (
          <line key={k} x1={L} x2={R} y1={T + h * k} y2={T + h * k} stroke="#2A1A0C" strokeWidth={4} />
        ))}
        {Array.from({length: 18}, (_, i) => (
          <path key={i} d={`M${L + 20 + hash(i) * (w - 60)},${T + 10 + hash(i + 4) * (h - 20)} q20,${(hash(i + 7) - 0.5) * 6} 40,0`} fill="none" stroke="#3B2614" strokeWidth={1.5} opacity={0.6} />
        ))}
        <rect x={L} y={T} width={26} height={h} fill="#2E1E10" />
        <rect x={R - 26} y={T} width={26} height={h} fill="#2E1E10" />
        <path d={`M${L + 26},${T + 26} L${R - 26},0`} stroke="#3A2615" strokeWidth={18} opacity={0.8} />
      </g>
      <rect x={L} y={T} width={w} height={h} fill="none" stroke="#120B05" strokeWidth={3} />
      {/* 顶盖（向后掀起） */}
      <g transform={`translate(0,${-lidLift * 0.35}) rotate(${-lid * 18},${L + dx},${T + dy})`} opacity={1 - lid * 0.2}>
        <path d={`M${L},${T} L${R},${T} L${R + dx},${T + dy} L${L + dx},${T + dy} Z`} fill="url(#woodTop)" stroke="#120B05" strokeWidth={3} />
        {planks.map((k) => (
          <path key={k} d={`M${L + dx * k},${T + dy * k} L${R + dx * k},${T + dy * k}`} stroke="#6A4826" strokeWidth={2} />
        ))}
      </g>
    </g>
  );
};

/* ---------------- 实验装置 ---------------- */
export const Atom: React.FC<{x: number; y: number; r?: number; decay?: number; flicker?: number; t: number}> = ({x, y, r = 22, decay = 0, flicker = 0, t}) => {
  const f = flicker > 0 ? (Math.sin(t * 40) > 0 ? 1 : 0) : decay;
  return (
    <g transform={`translate(${x},${y})`}>
      <circle r={r * 3} fill="url(#qglow)" opacity={0.6} />
      {[0, 60, 120].map((a) => (
        <ellipse key={a} rx={r * 2.2} ry={r * 0.7} fill="none" stroke={P.quantum} strokeWidth={1.5} opacity={0.6} transform={`rotate(${a + t * 40})`} />
      ))}
      <circle r={r * 0.55} fill={f > 0.5 ? P.red : P.quantum} filter="url(#glow)" />
      {f > 0.5 &&
        Array.from({length: 6}, (_, i) => {
          const a = (i / 6) * Math.PI * 2 + t;
          const d = r * (1.2 + ((t * 3 + i * 0.3) % 1) * 4);
          return <circle key={i} cx={Math.cos(a) * d} cy={Math.sin(a) * d} r={3} fill={P.red} opacity={0.8} />;
        })}
    </g>
  );
};

export const Geiger: React.FC<{x: number; y: number; on?: number}> = ({x, y, on = 0}) => (
  <g transform={`translate(${x},${y})`}>
    <rect x={-50} y={-70} width={100} height={70} rx={8} fill="#2A2C30" stroke="#55585E" strokeWidth={2} />
    <rect x={-36} y={-58} width={72} height={28} rx={4} fill={on > 0.5 ? P.red : '#0E1A1E'} opacity={0.9} />
    <rect x={-8} y={-110} width={16} height={42} rx={6} fill="#3A3D42" />
  </g>
);

export const Hammer: React.FC<{x: number; y: number; angle: number}> = ({x, y, angle}) => (
  <g transform={`translate(${x},${y}) rotate(${angle})`}>
    <rect x={-5} y={-130} width={10} height={130} rx={4} fill="#8A6A44" />
    <rect x={-28} y={-150} width={56} height={30} rx={5} fill="#5E6168" stroke="#2A2C30" strokeWidth={2} />
    <circle r={7} fill="#2A2C30" />
  </g>
);

export const Vial: React.FC<{x: number; y: number; broken?: number}> = ({x, y, broken = 0}) => (
  <g transform={`translate(${x},${y})`}>
    {broken < 0.5 ? (
      <g>
        <path d="M-16,0 L-16,-60 L-8,-72 L-8,-90 L8,-90 L8,-72 L16,-60 L16,0 Z" fill="#B9F0D8" opacity={0.25} stroke="#D8FFF0" strokeWidth={2} />
        <rect x={-16} y={-36} width={32} height={36} fill="#7BE0B0" opacity={0.6} />
      </g>
    ) : (
      <g>
        {Array.from({length: 7}, (_, i) => (
          <path key={i} d={`M${-20 + i * 7},0 l${5 + hash(i) * 6},${-10 - hash(i + 3) * 18} l6,${12 + hash(i) * 6} Z`} fill="#D8FFF0" opacity={0.6} />
        ))}
        <ellipse cx={0} cy={-60 * broken} rx={90 * broken} ry={60 * broken} fill="#7BE0B0" opacity={0.25 * (1.5 - broken)} filter="url(#soft)" />
      </g>
    )}
  </g>
);

/* ---------------- 口头禅卡片 ---------------- */
export const MemeCard: React.FC<{x: number; y: number; rot?: number; kind: 0 | 1 | 2; stamp?: number; reveal?: number; s?: number; o?: number}> = ({x, y, rot = 0, kind, stamp = 0, reveal = 0, s = 1, o = 1}) => {
  const title = ['考试成绩', '表白', '彩票'][kind];
  return (
    <g transform={`translate(${x},${y}) rotate(${rot}) scale(${s})`} opacity={o} filter="url(#shadow)">
      <rect x={-170} y={-120} width={340} height={240} rx={16} fill={P.paper} />
      <text x={-140} y={-74} fontFamily={FONTS.sans} fontSize={26} fill={P.ink} opacity={0.7}>
        {title}
      </text>
      {kind === 0 && (
        <g>
          <rect x={-140} y={-44} width={280} height={110} rx={10} fill="#D6CFC0" />
          <text x={0} y={34} textAnchor="middle" fontFamily={FONTS.title} fontWeight={900} fontSize={72} fill={reveal > 0.5 ? P.red : P.ink}>
            {reveal > 0.5 ? '86 分' : '??'}
          </text>
        </g>
      )}
      {kind === 1 && (
        <g>
          <rect x={-140} y={-44} width={220} height={50} rx={22} fill="#4C8BF5" />
          <rect x={-120} y={-26} width={150} height={12} rx={6} fill="#fff" opacity={0.85} />
          <text x={100} y={-10} fontFamily={FONTS.sans} fontSize={20} fill={P.dim}>
            已读
          </text>
          {reveal > 0.5 ? (
            <g>
              <rect x={-80} y={20} width={220} height={50} rx={22} fill="#fff" />
              <text x={30} y={54} textAnchor="middle" fontFamily={FONTS.sans} fontSize={24} fill={P.ink}>
                “我也喜欢你”
              </text>
            </g>
          ) : (
            <text x={-140} y={60} fontFamily={FONTS.sans} fontSize={24} fill={P.dim}>
              对方正在输入…
            </text>
          )}
        </g>
      )}
      {kind === 2 && (
        <g>
          {Array.from({length: 6}, (_, i) => (
            <g key={i}>
              <circle cx={-110 + i * 44} cy={10} r={18} fill={i === 5 ? '#4C8BF5' : P.red} />
              <text x={-110 + i * 44} y={18} textAnchor="middle" fontFamily={FONTS.sans} fontSize={20} fill="#fff">
                {[7, 12, 19, 23, 28, 5][i]}
              </text>
            </g>
          ))}
          <text x={-140} y={78} fontFamily={FONTS.sans} fontSize={22} fill={P.dim}>
            待开奖
          </text>
        </g>
      )}
      {stamp > 0.01 && (
        <g transform={`translate(70,60) rotate(-14) scale(${1.6 - 0.6 * clamp01(stamp * 3)})`} opacity={clamp01(stamp * 3)}>
          <rect x={-110} y={-30} width={220} height={60} fill="none" stroke={P.red} strokeWidth={4} />
          <text y={14} textAnchor="middle" fontFamily={FONTS.title} fontWeight={900} fontSize={36} fill={P.red} letterSpacing={4}>
            薛定谔的
          </text>
        </g>
      )}
    </g>
  );
};

/* ---------------- 1935 年的论文 ---------------- */
export const Paper: React.FC<{x: number; y: number; rot?: number; circle?: number; stamp?: number; s?: number}> = ({x, y, rot = 0, circle = 0, stamp = 0, s = 1}) => (
  <g transform={`translate(${x},${y}) rotate(${rot}) scale(${s})`} filter="url(#shadow)">
    <rect x={-300} y={-400} width={600} height={800} fill={P.paper} />
    <text x={0} y={-320} textAnchor="middle" fontFamily={FONTS.title} fontSize={30} fill={P.ink}>
      Die gegenwärtige Situation
    </text>
    <text x={0} y={-280} textAnchor="middle" fontFamily={FONTS.title} fontSize={30} fill={P.ink}>
      in der Quantenmechanik
    </text>
    <text x={0} y={-240} textAnchor="middle" fontFamily={FONTS.title} fontSize={18} fill={P.dim}>
      Naturwissenschaften · 1935
    </text>
    {Array.from({length: 22}, (_, i) => (
      <rect key={i} x={-250} y={-200 + i * 26} width={500 - (i % 5 === 4 ? 200 : hash(i) * 60)} height={8} rx={3} fill={P.ink} opacity={0.22} />
    ))}
    <text x={-250} y={150} fontFamily={FONTS.title} fontSize={26} fill={P.ink} fontStyle="italic">
      … ganz burlesker Fall …
    </text>
    {circle > 0.01 && <ellipse cx={-110} cy={142} rx={170} ry={34} fill="none" stroke={P.red} strokeWidth={4} pathLength={1} strokeDasharray={1} strokeDashoffset={1 - circle} />}
    {stamp > 0.01 && (
      <g transform={`translate(120,260) rotate(-10) scale(${1.6 - 0.6 * clamp01(stamp * 3)})`} opacity={clamp01(stamp * 3)}>
        <rect x={-130} y={-40} width={260} height={80} fill="none" stroke={P.red} strokeWidth={5} />
        <text y={18} textAnchor="middle" fontFamily={FONTS.title} fontWeight={900} fontSize={50} fill={P.red} letterSpacing={6}>
          相当滑稽
        </text>
      </g>
    )}
  </g>
);

export const Envelope: React.FC<{x: number; y: number; rot?: number; s?: number; o?: number}> = ({x, y, rot = 0, s = 1, o = 1}) => (
  <g transform={`translate(${x},${y}) rotate(${rot}) scale(${s})`} opacity={o}>
    <rect x={-60} y={-38} width={120} height={76} fill={P.paper} />
    <path d="M-60,-38 L0,8 L60,-38" fill="none" stroke="#A89F8E" strokeWidth={3} />
    <rect x={30} y={-30} width={22} height={26} fill={P.red} opacity={0.8} />
  </g>
);

export const stage = {W, H};

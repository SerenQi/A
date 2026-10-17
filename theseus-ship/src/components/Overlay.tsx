import React from 'react';
import {AbsoluteFill} from 'remotion';
import {CUES, FONTS, H, PALETTE, SUBTITLE, W} from '../config';
import {win} from '../lib/story';

/** 超过每行上限时，在最接近中点的标点后断成两行 */
export const wrap = (text: string, max = SUBTITLE.maxCharsPerLine): string[] => {
  const chars = Array.from(text);
  if (chars.length <= max) return [text];
  let best = -1;
  let bestD = Infinity;
  chars.forEach((c, i) => {
    if ('，。：；、？'.includes(c) && i < chars.length - 2) {
      const d = Math.abs(i + 1 - chars.length / 2);
      if (d < bestD) {
        bestD = d;
        best = i + 1;
      }
    }
  });
  if (best < 0) best = Math.ceil(chars.length / 2);
  return [chars.slice(0, best).join(''), chars.slice(best).join('')];
};

/** 字幕：整句淡入淡出，亮度稳定 */
export const Subtitles: React.FC<{sec: number}> = ({sec}) => {
  const cue = CUES.find((c) => sec >= c.from && sec < c.to);
  if (!cue) return null;
  const o = win(sec, cue.from, cue.to, 0.45, 0.45);
  const lines = wrap(cue.text);
  const lh = SUBTITLE.size * 1.5;
  return (
    <div
      style={{
        position: 'absolute',
        left: 0,
        width: W,
        // 最后一行基线约在 y = 980
        top: SUBTITLE.baseline - lh * lines.length + SUBTITLE.size * 0.35,
        textAlign: 'center',
        fontFamily: FONTS.body,
        fontSize: SUBTITLE.size,
        fontWeight: 400,
        lineHeight: `${lh}px`,
        letterSpacing: 2,
        color: SUBTITLE.color,
        opacity: o,
        textShadow: '0 1px 3px rgba(0,0,0,0.9)',
      }}
    >
      {lines.map((l, i) => (
        <div key={i}>{l}</div>
      ))}
    </div>
  );
};

/** 背景：近黑 + 很弱的中央灰雾与暗角 */
export const Backdrop: React.FC<{warm?: number}> = ({warm = 0}) => (
  <AbsoluteFill style={{background: PALETTE.bg}}>
    <AbsoluteFill style={{background: `radial-gradient(ellipse 55% 45% at 50% 46%, ${PALETTE.fog}, transparent 75%)`}} />
    {warm > 0 && <AbsoluteFill style={{background: `radial-gradient(ellipse 26% 22% at 50% 50%, rgba(201,183,132,${0.07 * warm}), transparent 80%)`}} />}
    <AbsoluteFill style={{background: 'radial-gradient(ellipse at 50% 50%, transparent 58%, rgba(0,0,0,0.6) 100%)'}} />
  </AbsoluteFill>
);

const hash = (n: number) => {
  const s = Math.sin(n * 12.9898 + 4.1414) * 43758.5453;
  return s - Math.floor(s);
};

/** 极少量低亮尘点 */
export const Dust: React.FC<{sec: number}> = ({sec}) => (
  <svg width={W} height={H} style={{position: 'absolute', inset: 0}}>
    {Array.from({length: 16}, (_, i) => {
      const x = (hash(i) * W + sec * (4 + hash(i + 50) * 6)) % W;
      const y = hash(i + 100) * H * 0.85 + Math.sin(sec / 7 + i) * 8;
      return <circle key={i} cx={x} cy={y} r={0.8 + hash(i + 200) * 0.9} fill={PALETTE.line} opacity={0.05 + hash(i + 300) * 0.08} />;
    })}
  </svg>
);

/** 屏幕空间的小标签，带一根细引线指向世界中的锚点 */
export const Tag: React.FC<{
  ax: number;
  ay: number;
  lx: number;
  ly: number;
  text: string;
  opacity: number;
  color?: string;
  size?: number;
  font?: string;
  align?: 'left' | 'right' | 'center';
}> = ({ax, ay, lx, ly, text, opacity, color = PALETTE.line, size = 26, font = FONTS.title, align = 'left'}) => {
  if (opacity <= 0.01) return null;
  const tw = Array.from(text).length * (size + 4);
  const left = align === 'left' ? lx : align === 'right' ? lx - tw : lx - tw / 2;
  const lineEndX = align === 'left' ? lx - 8 : align === 'right' ? lx + 8 : lx;
  return (
    <>
      <svg width={W} height={H} style={{position: 'absolute', inset: 0, opacity}}>
        <path d={`M${ax},${ay}L${lineEndX},${ly}`} stroke={color} strokeOpacity={0.55} strokeWidth={0.8} fill="none" />
        <circle cx={ax} cy={ay} r={2.4} fill={color} />
      </svg>
      <div style={{position: 'absolute', left, top: ly - size * 0.7, width: tw, textAlign: align, fontFamily: font, fontSize: size, letterSpacing: 4, color, opacity}}>{text}</div>
    </>
  );
};

/** 上方缓慢移动的时间刻度 */
export const TimeRuler: React.FC<{sec: number; opacity: number; offset: number}> = ({opacity, offset}) => {
  if (opacity <= 0.01) return null;
  const y = 118;
  const x0 = 560;
  const x1 = 1360;
  const step = 32;
  const ticks = [];
  for (let i = -2; i < (x1 - x0) / step + 2; i++) {
    const x = x0 + i * step - (offset % step);
    if (x < x0 || x > x1) continue;
    const idx = i + Math.floor(offset / step);
    const edge = Math.min(1, (x - x0) / 120, (x1 - x) / 120);
    ticks.push(<line key={idx} x1={x} x2={x} y1={y} y2={y + (idx % 5 === 0 ? 12 : 6)} stroke={PALETTE.line} strokeOpacity={0.45 * edge} strokeWidth={0.8} />);
  }
  return (
    <svg width={W} height={H} style={{position: 'absolute', inset: 0, opacity}}>
      <line x1={x0} x2={x1} y1={y} y2={y} stroke={PALETTE.inner} strokeWidth={0.8} />
      {ticks}
      <path d={`M${W / 2},${y - 5}l-4,-7h8z`} fill={PALETTE.line} fillOpacity={0.7} />
    </svg>
  );
};

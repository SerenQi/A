import React from 'react';
import {AbsoluteFill, Easing, interpolate, spring, useCurrentFrame, useVideoConfig} from 'remotion';
import {C, SERIF, W} from '../lib/theme';
import {clamp01, prog} from '../lib/math';

export type Cue = {from: number; to: number; text: string};

/** 底部中文字幕：逐字模糊浮现 + 金色细线 + 柔和光晕 */
export const Subtitles: React.FC<{cues: Cue[]; y?: number}> = ({cues, y = 930}) => {
  const frame = useCurrentFrame();
  const cue = cues.find((c) => frame >= c.from && frame < c.to);
  if (!cue) return null;
  const local = frame - cue.from;
  const out = prog(frame, cue.to - 12, cue.to, Easing.in(Easing.quad));
  const chars = Array.from(cue.text);
  const perChar = Math.min(1.6, 26 / chars.length);
  const line = prog(local, 0, 22, Easing.out(Easing.cubic)) * (1 - out);
  return (
    <AbsoluteFill style={{pointerEvents: 'none'}}>
      <div
        style={{
          position: 'absolute',
          left: 0,
          top: y - 120,
          width: W,
          height: 230,
          background: 'radial-gradient(ellipse 45% 50% at 50% 60%, rgba(0,0,0,0.55), transparent 75%)',
          opacity: Math.min(1, local / 10) * (1 - out),
        }}
      />
      <div
        style={{
          position: 'absolute',
          top: y,
          width: W,
          textAlign: 'center',
          fontFamily: SERIF,
          fontWeight: 600,
          fontSize: 46,
          letterSpacing: 4,
          color: C.ivory,
          textShadow: '0 0 18px rgba(242,200,107,0.45), 0 2px 6px rgba(0,0,0,0.9)',
          transform: `translateY(${-out * 14}px)`,
          opacity: 1 - out,
          whiteSpace: 'pre',
        }}
      >
        {chars.map((ch, i) => {
          const t = clamp01((local - i * perChar) / 12);
          const e = Easing.out(Easing.cubic)(t);
          return (
            <span
              key={i}
              style={{
                display: 'inline-block',
                opacity: e,
                transform: `translateY(${(1 - e) * 22}px) scale(${0.85 + e * 0.15})`,
                filter: t < 1 ? `blur(${(1 - e) * 8}px)` : undefined,
                color: t < 0.9 ? C.goldHot : undefined,
              }}
            >
              {ch}
            </span>
          );
        })}
      </div>
      <div
        style={{
          position: 'absolute',
          top: y + 78,
          left: W / 2 - 380 * line,
          width: 760 * line,
          height: 2,
          background: `linear-gradient(90deg, transparent, ${C.gold}, transparent)`,
          opacity: 0.8,
        }}
      />
    </AbsoluteFill>
  );
};

/** 金色渐变文字 + 扫光 */
export const GoldText: React.FC<{
  children: string;
  size: number;
  font?: string;
  weight?: number;
  shine?: number;
  spacing?: number;
  style?: React.CSSProperties;
}> = ({children, size, font = SERIF, weight = 900, shine = 0, spacing = 0, style}) => {
  const pos = -60 + shine * 220;
  return (
    <span
      style={{
        fontFamily: font,
        fontWeight: weight,
        fontSize: size,
        letterSpacing: spacing,
        backgroundImage: `linear-gradient(105deg, transparent ${pos - 12}%, rgba(255,255,255,0.95) ${pos}%, transparent ${pos + 12}%), linear-gradient(180deg, #fff3c9 0%, #f2c86b 38%, #b8862f 62%, #f7dc93 100%)`,
        WebkitBackgroundClip: 'text',
        backgroundClip: 'text',
        color: 'transparent',
        filter: 'drop-shadow(0 0 22px rgba(242,200,107,0.45)) drop-shadow(0 4px 2px rgba(0,0,0,0.6))',
        ...style,
      }}
    >
      {children}
    </span>
  );
};

/** 逐字砸落的大字（带弹簧与震动） */
export const SlamText: React.FC<{
  text: string;
  start: number;
  size?: number;
  stagger?: number;
  font?: string;
  color?: string;
  gold?: boolean;
}> = ({text, start, size = 120, stagger = 5, font = SERIF, gold = true, color = C.ivory}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  return (
    <div style={{display: 'flex', justifyContent: 'center', alignItems: 'center'}}>
      {Array.from(text).map((ch, i) => {
        const f = frame - start - i * stagger;
        const s = spring({frame: f, fps, config: {damping: 11, stiffness: 160, mass: 0.8}});
        const o = clamp01(f / 4);
        const sc = interpolate(s, [0, 1], [2.6, 1]);
        const blur = Math.max(0, (1 - s) * 14);
        return (
          <span
            key={i}
            style={{
              display: 'inline-block',
              opacity: o,
              transform: `scale(${sc}) translateY(${(1 - s) * -40}px)`,
              filter: blur > 0.3 ? `blur(${blur}px)` : undefined,
              margin: `0 ${size * 0.02}px`,
            }}
          >
            {gold ? (
              <GoldText size={size} font={font} shine={clamp01((f - 8) / 30)}>
                {ch}
              </GoldText>
            ) : (
              <span style={{fontFamily: font, fontSize: size, fontWeight: 900, color}}>{ch}</span>
            )}
          </span>
        );
      })}
    </div>
  );
};

/** 字距展开的英文/小标题 */
export const Tracking: React.FC<{text: string; start: number; size?: number; color?: string; from?: number; to?: number; dur?: number}> = ({
  text,
  start,
  size = 26,
  color = C.gold,
  from = 40,
  to = 14,
  dur = 50,
}) => {
  const frame = useCurrentFrame();
  const t = prog(frame, start, start + dur, Easing.out(Easing.cubic));
  return (
    <div
      style={{
        fontFamily: SERIF,
        fontSize: size,
        fontWeight: 400,
        letterSpacing: interpolate(t, [0, 1], [from, to]),
        color,
        opacity: t,
        filter: `blur(${(1 - t) * 6}px)`,
        textAlign: 'center',
      }}
    >
      {text}
    </div>
  );
};

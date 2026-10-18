import React from 'react';
import {AbsoluteFill} from 'remotion';
import {CUES, FONTS, H, IMPACTS, ONSCREEN, PALETTE as P, SLAMS, SUBTITLE, W, WORDS} from '../config';
import {clamp01, easeOut, hash, lerp, span, win} from '../lib/anim';

/* ---------------- 冲击：震屏与白闪 ---------------- */
export const shakeAt = (s: number) => {
  let x = 0;
  let y = 0;
  for (const im of IMPACTS) {
    const d = s - im.t;
    if (d < 0 || d > 0.8) continue;
    const a = im.power * 16 * Math.exp(-d * 7);
    x += Math.sin(d * 83 + im.t) * a;
    y += Math.cos(d * 71 + im.t * 2) * a * 0.7;
  }
  return {x, y};
};

export const flashAt = (s: number) => {
  let f = 0;
  for (const im of IMPACTS) {
    const d = s - im.t;
    if (d < -0.05 || d > 0.6 || im.flash <= 0) continue;
    f = Math.max(f, im.flash * (d < 0 ? 1 + d / 0.05 : Math.exp(-d * 7)));
  }
  return f;
};

/** 距离最近一次冲击的“色差”强度 */
export const chromaAt = (s: number) => {
  let c = 0;
  for (const im of IMPACTS) {
    const d = s - im.t;
    if (d < 0 || d > 0.5) continue;
    c = Math.max(c, im.power * Math.exp(-d * 9));
  }
  return c;
};

/* ---------------- 胶片颗粒 + 暗角 ---------------- */
export const Grain: React.FC<{frame: number}> = ({frame}) => (
  <AbsoluteFill style={{pointerEvents: 'none'}}>
    <svg width={W} height={H} style={{position: 'absolute', opacity: 0.1, mixBlendMode: 'overlay'}}>
      <filter id="grain">
        <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed={Math.floor(frame / 2) % 30} stitchTiles="stitch" />
        <feColorMatrix type="saturate" values="0" />
      </filter>
      <rect width={W} height={H} filter="url(#grain)" />
    </svg>
    <AbsoluteFill style={{background: 'radial-gradient(ellipse at 50% 48%, transparent 50%, rgba(0,0,0,0.75) 100%)'}} />
  </AbsoluteFill>
);

/* ---------------- 整屏大字 ---------------- */
export const Slams: React.FC<{s: number}> = ({s}) => {
  const sl = SLAMS.find((x) => s >= x.from && s < x.to);
  if (!sl) return null;
  const t = s - sl.from;
  const out = span(s, sl.to - 0.4, sl.to);
  const chars = Array.from(sl.text);
  const y = sl.kind === 'title' ? H / 2 - 20 : 470;
  let scale = 1;
  let blur = 0;
  let op = 1 - out;
  let split = 0;
  if (sl.kind === 'title') {
    const e = easeOut(clamp01(t / 0.5));
    scale = lerp(1.35, 1, e) + t * 0.012;
    blur = (1 - e) * 16;
    op *= clamp01(t / 0.2);
    split = chromaAt(s) * 10;
  } else if (sl.kind === 'soft') {
    const e = easeOut(clamp01(t / 0.9));
    scale = lerp(0.96, 1, e);
    blur = (1 - e) * 10;
    op *= e;
  } else if (sl.kind === 'hit') {
    const e = easeOut(clamp01(t / 0.2));
    scale = lerp(1.9, 1, e) + t * 0.01;
    blur = (1 - e) * 18;
    op *= clamp01(t / 0.08);
    split = chromaAt(s) * 14;
  } else {
    // glitch：持续的红青错位与横向切片
    const e = easeOut(clamp01(t / 0.15));
    scale = lerp(1.6, 1, e);
    op *= clamp01(t / 0.06);
    split = 6 + 10 * Math.abs(Math.sin(t * 23)) * (hash(Math.floor(t * 15)) > 0.5 ? 1 : 0.3);
  }
  const style: React.CSSProperties = {
    position: 'absolute',
    left: 0,
    top: y - sl.size * 0.62,
    width: W,
    textAlign: 'center',
    fontFamily: FONTS.title,
    fontWeight: 900,
    fontSize: sl.size,
    letterSpacing: sl.kind === 'title' ? 36 : 6,
    whiteSpace: 'nowrap',
  };
  return (
    <AbsoluteFill style={{pointerEvents: 'none', opacity: op, transform: `scale(${scale})`, filter: blur > 0.3 ? `blur(${blur}px)` : undefined}}>
      {split > 0.3 && (
        <>
          <div style={{...style, color: P.red, transform: `translate(${-split}px,0)`, mixBlendMode: 'screen', opacity: 0.85}}>{chars.join('')}</div>
          <div style={{...style, color: P.cold, transform: `translate(${split}px,0)`, mixBlendMode: 'screen', opacity: 0.85}}>{chars.join('')}</div>
        </>
      )}
      {sl.kind === 'title' && (
        <div style={{...style, top: y + sl.size * 0.62, fontSize: 38, fontWeight: 600, letterSpacing: 10, color: P.gold}}>{ONSCREEN.kicker}</div>
      )}
      <div style={{...style, color: P.text, textShadow: '0 0 40px rgba(255,244,222,0.35), 0 6px 20px rgba(0,0,0,0.8)'}}>{chars.join('')}</div>
      {(sl.kind as string) === 'glitch' &&
        [0, 1, 2].map((k) => {
          const on = hash(Math.floor(t * 12) + k * 7) > 0.55;
          if (!on) return null;
          const top = y - sl.size * 0.6 + hash(k + Math.floor(t * 12)) * sl.size;
          return (
            <div key={k} style={{position: 'absolute', left: 0, top, width: W, height: 10 + hash(k) * 18, overflow: 'hidden'}}>
              <div style={{...style, top: -(top - (y - sl.size * 0.62)), color: P.text, transform: `translate(${(hash(k * 3 + Math.floor(t * 12)) - 0.5) * 60}px,0)`}}>{chars.join('')}</div>
            </div>
          );
        })}
    </AbsoluteFill>
  );
};

/* ---------------- 字幕（**…** 标红） ---------------- */
const wrap = (text: string, max = SUBTITLE.maxCharsPerLine): string[] => {
  const plain = text.replace(/\*\*/g, '');
  const chars = Array.from(plain);
  if (chars.length <= max) return [text];
  let best = -1;
  let bestD = Infinity;
  chars.forEach((c, i) => {
    if ('，。：；、？——'.includes(c) && i < chars.length - 2) {
      const d = Math.abs(i + 1 - chars.length / 2);
      if (d < bestD) {
        bestD = d;
        best = i + 1;
      }
    }
  });
  if (best < 0) best = Math.ceil(chars.length / 2);
  // 在带标记的原文里找到对应位置
  let count = 0;
  let idx = 0;
  const raw = Array.from(text);
  while (idx < raw.length && count < best) {
    if (raw[idx] === '*' && raw[idx + 1] === '*') {
      idx += 2;
      continue;
    }
    count++;
    idx++;
  }
  let a = raw.slice(0, idx).join('');
  let b = raw.slice(idx).join('');
  // 标记跨行时补齐
  if ((a.match(/\*\*/g) || []).length % 2 === 1) {
    a += '**';
    b = '**' + b;
  }
  return [a, b];
};

const renderLine = (line: string, key: number) => {
  const parts = line.split('**');
  return (
    <div key={key}>
      {parts.map((p, i) =>
        i % 2 === 1 ? (
          <span key={i} style={{color: SUBTITLE.highlight, fontWeight: 600}}>
            {p}
          </span>
        ) : (
          <span key={i}>{p}</span>
        ),
      )}
    </div>
  );
};

export const Subtitles: React.FC<{s: number}> = ({s}) => {
  const cue = CUES.find((c) => s >= c.from && s < c.to);
  if (!cue) return null;
  const o = win(s, cue.from, cue.to, 0.3, 0.3);
  const lines = wrap(cue.text);
  const lh = SUBTITLE.size * 1.42;
  const enH = cue.en ? 40 : 0;
  return (
    <div
      style={{
        position: 'absolute',
        left: 0,
        width: W,
        top: SUBTITLE.baseline - lh * lines.length - enH + SUBTITLE.size * 0.35,
        textAlign: 'center',
        opacity: o,
        textShadow: '0 2px 8px rgba(0,0,0,0.95)',
      }}
    >
      <div style={{fontFamily: FONTS.body, fontSize: SUBTITLE.size, lineHeight: `${lh}px`, letterSpacing: 3, color: SUBTITLE.color}}>{lines.map(renderLine)}</div>
      {cue.en && <div style={{fontFamily: '"Noto Serif SC", serif', fontStyle: 'italic', fontSize: 26, lineHeight: '40px', letterSpacing: 1, color: '#B9B4AA'}}>{cue.en}</div>}
    </div>
  );
};

/* ---------------- 角标：贯穿全片的问题 ---------------- */
export const Corners: React.FC<{s: number}> = ({s}) => {
  const q = win(s, 17.9, 154.4, 0.8, 0.8);
  return <div style={{position: 'absolute', left: 64, top: 44, fontFamily: FONTS.body, fontSize: 30, letterSpacing: 4, color: P.text, opacity: q * 0.72}}>{ONSCREEN.question}</div>;
};

/* ---------------- 画面中央的大字（淡入、轻微放大，不震动） ---------------- */
export const BigWords: React.FC<{s: number}> = ({s}) => {
  const w = WORDS.find((x) => s >= x.from && s < x.to);
  if (!w) return null;
  const t = s - w.from;
  const e = easeOut(clamp01(t / 0.6));
  const o = e * (1 - span(s, w.to - 0.4, w.to));
  const size = Array.from(w.text).length > 9 ? 120 : 170;
  return (
    <div style={{position: 'absolute', left: 0, width: W, top: H / 2 - size * 0.75, textAlign: 'center', opacity: o, transform: `scale(${lerp(1.08, 1, e) + t * 0.008})`, filter: e < 0.98 ? `blur(${(1 - e) * 10}px)` : undefined}}>
      <div style={{fontFamily: FONTS.title, fontWeight: 900, fontSize: size, letterSpacing: 10, color: w.color, textShadow: `0 0 40px ${w.color}66, 0 0 12px ${w.color}88`}}>{w.text}</div>
      {w.en && <div style={{marginTop: 18, fontFamily: '"Noto Serif SC", serif', fontStyle: 'italic', fontSize: 34, letterSpacing: 2, color: '#CFC8BA'}}>{w.en}</div>}
    </div>
  );
};

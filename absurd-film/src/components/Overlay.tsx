import React from 'react';
import {CUES, FONTS, SUBTITLE, W} from '../config';
import {win} from '../lib/anim';

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


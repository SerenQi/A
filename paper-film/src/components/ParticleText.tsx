import React from 'react';
import {easeInOut, hash} from '../lib/anim';

type Pt = {x: number; y: number};

const cache = new Map<string, Pt[]>();

/** 把文字栅格化后取样成点（字体加载完成后才缓存，避免用回退字体取样） */
const samplePoints = (text: string, font: string, size: number, step: number): Pt[] => {
  const key = `${text}|${font}|${size}|${step}`;
  const hit = cache.get(key);
  if (hit) return hit;
  if (typeof document === 'undefined') return [];
  const fontSpec = `${size}px ${font}`;
  const ready = document.fonts.check(fontSpec, text);
  const c = document.createElement('canvas');
  const ctx = c.getContext('2d');
  if (!ctx) return [];
  ctx.font = fontSpec;
  const w = Math.ceil(ctx.measureText(text).width) + 20;
  const h = Math.ceil(size * 1.4);
  c.width = w;
  c.height = h;
  ctx.font = fontSpec;
  ctx.fillStyle = '#fff';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, 10, h / 2);
  const data = ctx.getImageData(0, 0, w, h).data;
  const pts: Pt[] = [];
  for (let y = 0; y < h; y += step) {
    for (let x = 0; x < w; x += step) {
      if (data[(y * w + x) * 4 + 3] > 128) pts.push({x: x - w / 2, y: y - h / 2});
    }
  }
  if (ready) cache.set(key, pts);
  return pts;
};

/**
 * 粒子组成的大字：p 从 0→1 由四散的光点汇聚成字，out 从 0→1 再散开。
 */
export const ParticleText: React.FC<{
  text: string;
  x: number;
  y: number;
  size?: number;
  font: string;
  p: number;
  out?: number;
  color?: string;
  step?: number;
  seed?: number;
}> = ({text, x, y, size = 110, font, p, out = 0, color = '#F2EEE6', step = 5, seed = 1}) => {
  if (p <= 0.001 || out >= 0.999) return null;
  const pts = samplePoints(text, font, size, step);
  return (
    <g transform={`translate(${x},${y})`}>
      {pts.map((q, i) => {
        const r1 = hash(i * 3 + seed);
        const r2 = hash(i * 7 + seed * 5);
        const delay = r1 * 0.35;
        const e = easeInOut((p - delay) / 0.65);
        const eo = easeInOut((out - r2 * 0.3) / 0.7);
        const a = r2 * Math.PI * 2;
        const far = 500 + r1 * 700;
        const sx = Math.cos(a) * far;
        const sy = Math.sin(a) * far * 0.6;
        const px = sx + (q.x - sx) * e + Math.cos(a + 1) * 300 * eo;
        const py = sy + (q.y - sy) * e - 200 * eo * r1;
        const tw = 0.75 + 0.25 * Math.sin(i * 1.7 + p * 20);
        return <circle key={i} cx={px} cy={py} r={step * 0.52} fill={color} opacity={Math.min(1, e * 1.2) * (1 - eo) * tw} />;
      })}
    </g>
  );
};

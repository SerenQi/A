import React from 'react';
import {PALETTE as P} from '../config';
import {easeInOut, hash} from '../lib/anim';

type Pt = {x: number; y: number};
const cache = new Map<string, Pt[]>();

/** 把一条 SVG 路径栅格化后按网格取样成点（填充或描边） */
const samplePath = (d: string, scale: number, step: number, stroke: number): Pt[] => {
  const key = `${d}|${scale}|${step}|${stroke}`;
  const hit = cache.get(key);
  if (hit) return hit;
  if (typeof document === 'undefined') return [];
  const c = document.createElement('canvas');
  const size = 2400;
  c.width = size;
  c.height = size;
  const ctx = c.getContext('2d');
  if (!ctx) return [];
  ctx.translate(size / 2, size / 2);
  ctx.scale(scale, scale);
  const path = new Path2D(d);
  ctx.fillStyle = '#fff';
  ctx.strokeStyle = '#fff';
  if (stroke > 0) {
    ctx.lineWidth = Math.max(stroke, step * 1.15) / scale;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.stroke(path);
  } else {
    ctx.fill(path);
  }
  const data = ctx.getImageData(0, 0, size, size).data;
  const pts: Pt[] = [];
  for (let y = 0; y < size; y += step) {
    for (let x = 0; x < size; x += step) {
      if (data[(y * size + x) * 4 + 3] > 128) pts.push({x: x - size / 2, y: y - size / 2});
    }
  }
  cache.set(key, pts);
  return pts;
};

/**
 * 点阵图形：p 0→1 从四散的光点汇聚成形，out 0→1 再散开。
 * stroke>0 时只取轮廓（线描），否则取整个面。
 */
export const DotShape: React.FC<{
  d: string;
  x: number;
  y: number;
  scale?: number;
  step?: number;
  stroke?: number;
  p?: number;
  out?: number;
  t?: number;
  color?: string;
  r?: number;
  seed?: number;
  o?: number;
  drift?: number;
}> = ({d, x, y, scale = 1, step = 9, stroke = 0, p = 1, out = 0, t = 0, color = P.gold, r, seed = 1, o = 1, drift = 0}) => {
  if (p <= 0.001 || out >= 0.999 || o <= 0.001) return null;
  const pts = samplePath(d, scale, step, stroke);
  const rad = r ?? step * 0.32;
  return (
    <g transform={`translate(${x},${y})`} opacity={o}>
      {pts.map((q, i) => {
        const r1 = hash(i * 3 + seed);
        const r2 = hash(i * 7 + seed * 5);
        const e = easeInOut((p - r1 * 0.35) / 0.65);
        const eo = easeInOut((out - r2 * 0.3) / 0.7);
        const a = r2 * Math.PI * 2;
        const far = 400 + r1 * 700;
        const sx = Math.cos(a) * far;
        const sy = Math.sin(a) * far * 0.6;
        const wob = drift * Math.sin(t * 1.5 + i);
        const px = sx + (q.x - sx) * e + Math.cos(a + 1) * 260 * eo + wob;
        const py = sy + (q.y - sy) * e - 180 * eo * r1 + wob * 0.5;
        const tw = 0.6 + 0.4 * Math.sin(i * 1.7 + t * 3);
        return <circle key={i} cx={px} cy={py} r={rad} fill={color} opacity={Math.min(1, e * 1.2) * (1 - eo) * tw} />;
      })}
    </g>
  );
};

/* ---------------- 常用形状（原点在底部中心） ---------------- */
export const SHAPES = {
  /** 侧脸，朝右，高约 400 */
  head: 'M-60,0 C-70,-60 -110,-120 -110,-210 C-110,-330 -20,-400 70,-390 C160,-380 200,-310 195,-240 C194,-220 210,-200 225,-180 C232,-170 222,-162 210,-160 C214,-150 212,-140 205,-135 C210,-128 206,-118 198,-114 C200,-95 190,-82 160,-84 C130,-86 120,-70 120,-40 L125,0 Z',
  /** 站立的人，正面，高约 260 */
  person:
    'M0,-258 C16,-258 28,-246 28,-230 C28,-214 16,-202 0,-202 C-16,-202 -28,-214 -28,-230 C-28,-246 -16,-258 0,-258 Z M-40,-190 C-20,-198 20,-198 40,-190 L52,-100 L40,-98 L30,-150 L30,-95 L24,0 L6,0 L2,-88 L-2,-88 L-6,0 L-24,0 L-30,-95 L-30,-150 L-40,-98 L-52,-100 Z',
  /** 低头的人 */
  slump:
    'M18,-236 C34,-236 46,-224 46,-208 C46,-192 34,-180 18,-180 C2,-180 -10,-192 -10,-208 C-10,-224 2,-236 18,-236 Z M-40,-178 C-18,-190 22,-188 40,-172 L44,-96 L32,-96 L28,-140 L30,-95 L24,0 L6,0 L2,-88 L-2,-88 L-6,0 L-24,0 L-30,-95 L-28,-140 L-34,-96 L-46,-98 Z',
  /** 线描的牛（取轮廓） */
  cow:
    'M-240,-90 C-250,-170 -190,-200 -90,-198 L140,-200 C200,-200 230,-170 232,-120 C234,-80 210,-50 170,-48 L-180,-46 C-220,-48 -238,-62 -240,-90 Z M222,-168 L300,-212 C330,-228 372,-216 386,-190 L404,-150 C408,-136 398,-126 384,-128 L330,-138 C300,-142 268,-128 232,-118 M318,-214 C310,-246 324,-264 346,-270 M300,-205 C285,-222 268,-224 258,-216 M-240,-120 C-276,-100 -282,-40 -270,-8 M-190,-48 L-194,60 M-138,-48 L-134,60 M122,-48 L118,60 M176,-48 L180,60',
  /** 窗 */
  window: 'M-160,-190 L160,-190 L160,190 L-160,190 Z',
  /** 相框 */
  frame: 'M-200,-140 L200,-140 L200,140 L-200,140 Z',
};

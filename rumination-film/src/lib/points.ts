// 粒子点云：从路径/文字取样、挤出成 3D、投影绘制。所有随机数都来自 hash，逐帧确定。
import {hash} from './anim';

export type P3 = {x: number; y: number; z: number};

const sampleCache = new Map<string, {x: number; y: number}[]>();

/** 把 SVG 路径（或文字）画到离屏 canvas，按网格取出被填充的像素 */
export const sample2D = (key: string, draw: (ctx: CanvasRenderingContext2D) => void, size: number, step: number) => {
  const k = `${key}|${size}|${step}`;
  const hit = sampleCache.get(k);
  if (hit) return hit;
  if (typeof document === 'undefined') return [];
  const c = document.createElement('canvas');
  c.width = size;
  c.height = size;
  const ctx = c.getContext('2d');
  if (!ctx) return [];
  ctx.fillStyle = '#fff';
  ctx.strokeStyle = '#fff';
  ctx.translate(size / 2, size / 2);
  draw(ctx);
  const data = ctx.getImageData(0, 0, size, size).data;
  const pts: {x: number; y: number}[] = [];
  for (let y = 0; y < size; y += step) {
    for (let x = 0; x < size; x += step) {
      if (data[(y * size + x) * 4 + 3] > 128) pts.push({x: x - size / 2, y: y - size / 2});
    }
  }
  sampleCache.set(k, pts);
  return pts;
};

/** 平面轮廓挤出成“壳”：每一行按宽度给出前后两面的 z，看起来是立体的 */
export const extrude = (pts: {x: number; y: number}[], depth = 0.8, seed = 1): P3[] => {
  const rows = new Map<number, {min: number; max: number}>();
  for (const p of pts) {
    const r = rows.get(p.y) ?? {min: Infinity, max: -Infinity};
    r.min = Math.min(r.min, p.x);
    r.max = Math.max(r.max, p.x);
    rows.set(p.y, r);
  }
  let cx = 0;
  let cy = 0;
  for (const p of pts) {
    cx += p.x;
    cy += p.y;
  }
  cx /= pts.length || 1;
  cy /= pts.length || 1;
  return pts.map((p, i) => {
    const r = rows.get(p.y)!;
    const mid = (r.min + r.max) / 2;
    const hw = Math.max(1, (r.max - r.min) / 2);
    const u = (p.x - mid) / hw;
    const shell = Math.sqrt(Math.max(0, 1 - u * u));
    const side = hash(i * 1.31 + seed) > 0.5 ? 1 : -1;
    const inner = hash(i * 2.17 + seed) < 0.2 ? hash(i * 3.7 + seed) : 1;
    return {x: p.x - cx, y: p.y - cy, z: side * shell * hw * depth * inner};
  });
};

/** 把点云重采样到固定数量，便于两个形状之间一一对应地变形 */
export const resample = (pts: P3[], n: number, seed = 3): P3[] => {
  if (!pts.length) return Array.from({length: n}, () => ({x: 0, y: 0, z: 0}));
  return Array.from({length: n}, (_, i) => pts[Math.floor(hash(i * 0.731 + seed) * pts.length)]);
};

export const torus = (n: number, R: number, r: number, seed = 5): P3[] =>
  Array.from({length: n}, (_, i) => {
    const a = hash(i * 1.7 + seed) * Math.PI * 2;
    const b = hash(i * 2.9 + seed) * Math.PI * 2;
    const rr = r * Math.sqrt(hash(i * 4.1 + seed));
    return {x: (R + rr * Math.cos(b)) * Math.cos(a), y: rr * Math.sin(b), z: (R + rr * Math.cos(b)) * Math.sin(a)};
  });

export const sphere = (n: number, R: number, seed = 7): P3[] =>
  Array.from({length: n}, (_, i) => {
    const u = hash(i * 1.1 + seed) * 2 - 1;
    const a = hash(i * 2.3 + seed) * Math.PI * 2;
    const rr = R * Math.cbrt(hash(i * 3.3 + seed));
    const s = Math.sqrt(1 - u * u);
    return {x: rr * s * Math.cos(a), y: rr * u, z: rr * s * Math.sin(a)};
  });

/** 随机散布在一个大盒子里的点（爆散、漩涡的起点） */
export const scatter = (n: number, w: number, h: number, d: number, seed = 9): P3[] =>
  Array.from({length: n}, (_, i) => ({x: (hash(i * 1.9 + seed) - 0.5) * w, y: (hash(i * 2.7 + seed) - 0.5) * h, z: (hash(i * 3.1 + seed) - 0.5) * d}));

export type Cam3 = {yaw: number; pitch: number; f?: number; cx: number; cy: number; scale?: number; dist?: number};

/** 旋转 + 透视投影；返回屏幕坐标与深度系数 */
export const project = (p: P3, c: Cam3) => {
  const cy = Math.cos(c.yaw);
  const sy = Math.sin(c.yaw);
  const cp = Math.cos(c.pitch);
  const sp = Math.sin(c.pitch);
  const x1 = p.x * cy + p.z * sy;
  const z1 = -p.x * sy + p.z * cy;
  const y2 = p.y * cp - z1 * sp;
  const z2 = p.y * sp + z1 * cp;
  const f = c.f ?? 1400;
  const dist = c.dist ?? 1400;
  const k = f / (dist + z2);
  const sc = c.scale ?? 1;
  return {x: c.cx + x1 * k * sc, y: c.cy + y2 * k * sc, k, z: z2};
};

const sprites = new Map<string, HTMLCanvasElement>();
/** 发光圆点贴图（加色混合时叠出光晕） */
export const glowSprite = (color: string) => {
  const hit = sprites.get(color);
  if (hit) return hit;
  const c = document.createElement('canvas');
  c.width = 64;
  c.height = 64;
  const ctx = c.getContext('2d')!;
  const g = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
  g.addColorStop(0, '#ffffff');
  g.addColorStop(0.12, color);
  g.addColorStop(0.4, color + '55');
  g.addColorStop(1, color + '00');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 64, 64);
  sprites.set(color, c);
  return c;
};

/** 用加色混合画一批点 */
export const drawPoints = (
  ctx: CanvasRenderingContext2D,
  pts: P3[],
  cam: Cam3,
  opts: {color: string; size?: number; alpha?: number; twinkle?: number; t?: number; alphaOf?: (i: number) => number; colorOf?: (i: number) => string | null},
) => {
  const size = opts.size ?? 6;
  const base = opts.alpha ?? 1;
  const tw = opts.twinkle ?? 0.3;
  const t = opts.t ?? 0;
  const spr = glowSprite(opts.color);
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  for (let i = 0; i < pts.length; i++) {
    const a0 = opts.alphaOf ? opts.alphaOf(i) : 1;
    if (a0 <= 0.003) continue;
    const q = project(pts[i], cam);
    if (q.k <= 0) continue;
    const s = size * q.k;
    const a = base * a0 * (1 - tw + tw * Math.sin(i * 1.7 + t * 3)) * Math.min(1.4, q.k);
    ctx.globalAlpha = Math.max(0, Math.min(1, a));
    const c = opts.colorOf ? opts.colorOf(i) : null;
    ctx.drawImage(c ? glowSprite(c) : spr, q.x - s, q.y - s, s * 2, s * 2);
  }
  ctx.restore();
};

export const lerp3 = (a: P3, b: P3, t: number): P3 => ({x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t, z: a.z + (b.z - a.z) * t});

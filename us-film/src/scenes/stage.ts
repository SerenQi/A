// 舞台类画面的公共画法：幕布、聚光灯、舞台地板、点阵小人、气泡、化妆镜、门。
import {H, PALETTE as P, W} from '../config';
import {hash, lerp} from '../lib/anim';
import {personCloud, slumpCloud} from '../lib/clouds';
import {drawPoints, glowSprite, lerp3} from '../lib/points';

export const SERIF = '"Noto Serif SC", serif';
export const SANS = '"Noto Sans SC", sans-serif';

export const text = (
  ctx: CanvasRenderingContext2D,
  s: string,
  x: number,
  y: number,
  o: {size: number; color: string; weight?: number; font?: string; align?: CanvasTextAlign; alpha?: number; glow?: number; spacing?: number; italic?: boolean},
) => {
  if ((o.alpha ?? 1) <= 0.001) return;
  ctx.save();
  ctx.font = `${o.italic ? 'italic ' : ''}${o.weight ?? 600} ${o.size}px ${o.font ?? SERIF}`;
  ctx.textAlign = o.align ?? 'center';
  ctx.textBaseline = 'middle';
  ctx.globalAlpha = o.alpha ?? 1;
  ctx.fillStyle = o.color;
  if (o.spacing) (ctx as unknown as {letterSpacing: string}).letterSpacing = `${o.spacing}px`;
  if (o.glow) {
    ctx.shadowColor = o.color;
    ctx.shadowBlur = o.glow;
  }
  ctx.fillText(s, x, y);
  ctx.restore();
};

export const glow = (ctx: CanvasRenderingContext2D, x: number, y: number, r: number, color: string, alpha = 1) => {
  if (alpha <= 0.001) return;
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  ctx.globalAlpha = alpha;
  ctx.drawImage(glowSprite(color), x - r, y - r, r * 2, r * 2);
  ctx.restore();
};

export const line = (ctx: CanvasRenderingContext2D, pts: [number, number][], color: string, width = 3, alpha = 1, blur = 12) => {
  if (pts.length < 2 || alpha <= 0.001) return;
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.shadowColor = color;
  ctx.shadowBlur = blur;
  ctx.beginPath();
  pts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
  ctx.stroke();
  ctx.restore();
};

export const rect = (ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, color: string, width = 3, alpha = 1, fill?: string) => {
  ctx.save();
  ctx.globalAlpha = alpha;
  if (fill) {
    ctx.fillStyle = fill;
    ctx.fillRect(x, y, w, h);
  }
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.shadowColor = color;
  ctx.shadowBlur = 12;
  ctx.strokeRect(x, y, w, h);
  ctx.restore();
};

/** 点阵小人：slump 0 站直 → 1 低头垮掉；原点在脚底 */
export const person = (
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  s: number,
  o: {slump?: number; color?: string; yaw?: number; alpha?: number; t?: number; seed?: number; n?: number} = {},
) => {
  const n = o.n ?? 700;
  const pc = personCloud(n);
  const sl = slumpCloud(n);
  const k = o.slump ?? 0;
  const pts = k <= 0 ? pc : k >= 1 ? sl : pc.map((p, i) => lerp3(p, sl[i], k));
  drawPoints(ctx, pts, {yaw: o.yaw ?? 0, pitch: 0, cx: x, cy: y - 130 * s, scale: s}, {color: o.color ?? P.gold, size: 3.8, alpha: 0.95 * (o.alpha ?? 1), t: (o.t ?? 0) + (o.seed ?? 0), shade: true});
};

/** 红丝绒幕布：open 0 合上 → 1 拉开 */
export const curtain = (ctx: CanvasRenderingContext2D, open: number, t: number, alpha = 1) => {
  ctx.save();
  ctx.globalAlpha = alpha;
  const half = W / 2;
  for (const side of [-1, 1]) {
    const w = lerp(half + 20, 170, open);
    const x0 = side < 0 ? 0 : W - w;
    const folds = 9;
    for (let i = 0; i < folds; i++) {
      const fx = x0 + (i / folds) * w;
      const fw = w / folds + 1;
      const g = ctx.createLinearGradient(fx, 0, fx + fw, 0);
      g.addColorStop(0, '#2A0806');
      g.addColorStop(0.5, P.velvet);
      g.addColorStop(1, '#2A0806');
      ctx.fillStyle = g;
      const sway = Math.sin(t * 0.8 + i) * 4 * (1 - open * 0.5);
      ctx.fillRect(fx + sway, 0, fw, H);
    }
  }
  // 顶部的金边帷幔
  const vg = ctx.createLinearGradient(0, 0, 0, 120);
  vg.addColorStop(0, '#3A0B08');
  vg.addColorStop(1, P.velvet);
  ctx.fillStyle = vg;
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(W, 0);
  ctx.lineTo(W, 90);
  for (let i = 12; i >= 0; i--) ctx.quadraticCurveTo(((i + 0.5) / 12) * W, 150, (i / 12) * W, 90);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = P.gold;
  ctx.lineWidth = 3;
  ctx.shadowColor = P.gold;
  ctx.shadowBlur = 12;
  ctx.beginPath();
  ctx.moveTo(0, 90);
  for (let i = 0; i < 12; i++) ctx.quadraticCurveTo(((i + 0.5) / 12) * W, 150, ((i + 1) / 12) * W, 90);
  ctx.stroke();
  ctx.restore();
};

/** 聚光灯：从上方打下的光锥 + 地上的光斑 */
export const spotlight = (ctx: CanvasRenderingContext2D, x: number, floor: number, w: number, alpha = 1, color = '255,230,190') => {
  if (alpha <= 0.001) return;
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  const g = ctx.createLinearGradient(0, 0, 0, floor);
  g.addColorStop(0, `rgba(${color},${0.32 * alpha})`);
  g.addColorStop(1, `rgba(${color},${0.06 * alpha})`);
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.moveTo(x - 30, -20);
  ctx.lineTo(x + 30, -20);
  ctx.lineTo(x + w / 2, floor);
  ctx.lineTo(x - w / 2, floor);
  ctx.closePath();
  ctx.fill();
  const r = ctx.createRadialGradient(x, floor, 0, x, floor, w * 0.62);
  r.addColorStop(0, `rgba(${color},${0.35 * alpha})`);
  r.addColorStop(1, `rgba(${color},0)`);
  ctx.fillStyle = r;
  ctx.beginPath();
  ctx.ellipse(x, floor, w * 0.62, 60, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
};

/** 舞台地板：透视的木板缝 */
export const stageFloor = (ctx: CanvasRenderingContext2D, top: number, alpha = 1) => {
  ctx.save();
  ctx.globalAlpha = alpha;
  const g = ctx.createLinearGradient(0, top, 0, H);
  g.addColorStop(0, '#1A120B');
  g.addColorStop(1, '#0A0705');
  ctx.fillStyle = g;
  ctx.fillRect(0, top, W, H - top);
  ctx.strokeStyle = 'rgba(232,194,122,0.14)';
  ctx.lineWidth = 2;
  for (let i = -14; i <= 14; i++) {
    ctx.beginPath();
    ctx.moveTo(W / 2 + i * 70, top);
    ctx.lineTo(W / 2 + i * 220, H);
    ctx.stroke();
  }
  ctx.strokeStyle = P.gold;
  ctx.globalAlpha = alpha * 0.6;
  ctx.beginPath();
  ctx.moveTo(0, top);
  ctx.lineTo(W, top);
  ctx.stroke();
  ctx.restore();
};

/** 圆角气泡 */
export const bubble = (ctx: CanvasRenderingContext2D, x: number, y: number, s: string, o: {size?: number; dark?: boolean; alpha?: number; color?: string} = {}) => {
  const a = o.alpha ?? 1;
  if (a <= 0.001) return;
  const size = o.size ?? 30;
  ctx.save();
  ctx.font = `600 ${size}px ${SANS}`;
  const w = ctx.measureText(s).width + size * 1.4;
  const h = size * 1.9;
  ctx.globalAlpha = a;
  ctx.fillStyle = o.color ?? (o.dark ? 'rgba(28,30,38,0.95)' : P.paper);
  ctx.beginPath();
  ctx.roundRect(x - w / 2, y - h / 2, w, h, h / 2);
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(x - w / 2 + 30, y + h / 2 - 4);
  ctx.lineTo(x - w / 2 + 18, y + h / 2 + 18);
  ctx.lineTo(x - w / 2 + 52, y + h / 2 - 4);
  ctx.fill();
  ctx.fillStyle = o.dark ? P.text : P.ink;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(s, x, y + 1);
  ctx.restore();
};

/** 化妆镜：一圈灯泡，on 表示还亮着的比例（从最后一盏往前熄） */
export const vanity = (ctx: CanvasRenderingContext2D, cx: number, cy: number, w: number, h: number, on = 1, alpha = 1) => {
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.fillStyle = 'rgba(20,22,30,0.9)';
  ctx.fillRect(cx - w / 2, cy - h / 2, w, h);
  const g = ctx.createLinearGradient(cx - w / 2, cy - h / 2, cx + w / 2, cy + h / 2);
  g.addColorStop(0, 'rgba(255,240,210,0.10)');
  g.addColorStop(0.5, 'rgba(255,240,210,0.02)');
  g.addColorStop(1, 'rgba(255,240,210,0.08)');
  ctx.fillStyle = g;
  ctx.fillRect(cx - w / 2, cy - h / 2, w, h);
  rect(ctx, cx - w / 2 - 20, cy - h / 2 - 20, w + 40, h + 40, P.gold, 4, alpha);
  ctx.restore();
  const bulbs: [number, number][] = [];
  const nx = 7;
  const ny = 5;
  for (let i = 0; i < nx; i++) bulbs.push([cx - w / 2 + (i + 0.5) * (w / nx), cy - h / 2 - 20]);
  for (let j = 0; j < ny; j++) bulbs.push([cx + w / 2 + 20, cy - h / 2 + (j + 0.5) * (h / ny)]);
  for (let i = nx - 1; i >= 0; i--) bulbs.push([cx - w / 2 + (i + 0.5) * (w / nx), cy + h / 2 + 20]);
  for (let j = ny - 1; j >= 0; j--) bulbs.push([cx - w / 2 - 20, cy - h / 2 + (j + 0.5) * (h / ny)]);
  const lit = Math.round(on * bulbs.length);
  bulbs.forEach(([x, y], i) => {
    const isOn = i < Math.max(1, lit);
    glow(ctx, x, y, isOn ? 34 : 10, isOn ? P.ember : '#5A4A30', alpha * (isOn ? 1 : 0.6));
  });
};

/** 漂浮的掌声/彩屑光点 */
export const confetti = (ctx: CanvasRenderingContext2D, t: number, x0: number, x1: number, alpha = 1, n = 160) => {
  const spr = glowSprite(P.ember);
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  for (let i = 0; i < n; i++) {
    const k = (hash(i) + t * (0.15 + 0.2 * hash(i + 1))) % 1;
    const x = lerp(x0, x1, hash(i + 2)) + Math.sin(t * 2 + i) * 20;
    const y = -40 + k * (H + 80);
    const r = 3 + hash(i + 3) * 5;
    ctx.globalAlpha = alpha * (0.4 + 0.6 * hash(i + 4));
    ctx.drawImage(spr, x - r, y - r, r * 2, r * 2);
  }
  ctx.restore();
};

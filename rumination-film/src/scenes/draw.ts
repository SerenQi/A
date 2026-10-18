// 各场景共用的 canvas 画法
import {H, PALETTE as P, W} from '../config';
import {hash, lerp} from '../lib/anim';
import {Cam3, P3, drawPoints, glowSprite, project, torus} from '../lib/points';

export const bg = (ctx: CanvasRenderingContext2D, top = '#05060A', bottom = '#0A0C14') => {
  const g = ctx.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, top);
  g.addColorStop(1, bottom);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);
};

/** 漂浮的微尘（满屏） */
export const dust = (ctx: CanvasRenderingContext2D, t: number, n = 220, color: string = P.gold, alpha = 0.6) => {
  const spr = glowSprite(color);
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  for (let i = 0; i < n; i++) {
    const depth = 0.3 + hash(i * 7.7) * 0.7;
    const x = (((hash(i) * W + t * (6 + 18 * depth)) % W) + W) % W;
    const y = (((hash(i + 2) * H - t * (4 + 10 * depth) + Math.sin(t * 0.3 + i) * 20) % H) + H) % H;
    const s = 1.5 + depth * 4;
    ctx.globalAlpha = alpha * depth * (0.5 + 0.5 * Math.sin(t * 1.3 + i));
    ctx.drawImage(spr, x - s, y - s, s * 2, s * 2);
  }
  ctx.restore();
};

/** 失焦的城市光斑 */
export const bokeh = (ctx: CanvasRenderingContext2D, t: number, n = 70) => {
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  const cols = ['#F2A65A', '#E8C27A', '#C9A06A', '#E5483C', '#FFD39A'];
  for (let i = 0; i < n; i++) {
    const r = 30 + hash(i * 3.1) * 110;
    const x = (hash(i) * (W + 300) - 150 + Math.sin(t * 0.2 + i) * 30) % (W + 300);
    const y = 120 + hash(i * 1.7) * (H - 240) + Math.cos(t * 0.25 + i) * 20;
    const c = cols[Math.floor(hash(i * 5.3) * cols.length)];
    const g = ctx.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, c + '30');
    g.addColorStop(0.7, c + '18');
    g.addColorStop(1, c + '00');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
};

/** 淋浴的水流 */
export const streaks = (ctx: CanvasRenderingContext2D, t: number, n = 320) => {
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  for (let i = 0; i < n; i++) {
    const x = hash(i) * W;
    const sp = 900 + hash(i + 1) * 700;
    const len = 60 + hash(i + 3) * 140;
    const y = ((t * sp + hash(i + 2) * (H + 400)) % (H + 400)) - 300;
    const g = ctx.createLinearGradient(x, y, x - 8, y + len);
    g.addColorStop(0, 'rgba(255,230,190,0)');
    g.addColorStop(1, `rgba(255,230,190,${0.1 + hash(i + 4) * 0.18})`);
    ctx.strokeStyle = g;
    ctx.lineWidth = 1 + hash(i + 5) * 2;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x - 8, y + len);
    ctx.stroke();
  }
  const top = ctx.createRadialGradient(W / 2, -100, 0, W / 2, -100, 900);
  top.addColorStop(0, 'rgba(255,230,190,0.18)');
  top.addColorStop(1, 'rgba(255,230,190,0)');
  ctx.fillStyle = top;
  ctx.fillRect(0, 0, W, H);
  ctx.restore();
};

/** 透视地面网格 */
export const floorGrid = (ctx: CanvasRenderingContext2D, horizon: number, alpha = 0.18, color = '232,194,122') => {
  ctx.save();
  ctx.strokeStyle = `rgba(${color},${alpha})`;
  ctx.lineWidth = 1.5;
  const vx = W / 2;
  for (let i = -16; i <= 16; i++) {
    ctx.beginPath();
    ctx.moveTo(vx, horizon);
    ctx.lineTo(vx + i * 260, H + 200);
    ctx.stroke();
  }
  for (let k = 1; k < 14; k++) {
    const y = horizon + Math.pow(k / 14, 2.2) * (H - horizon + 200);
    ctx.globalAlpha = Math.min(1, k / 4);
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(W, y);
    ctx.stroke();
  }
  const g = ctx.createLinearGradient(0, horizon - 40, 0, horizon + 120);
  g.addColorStop(0, 'rgba(5,6,10,1)');
  g.addColorStop(1, 'rgba(5,6,10,0)');
  ctx.globalAlpha = 1;
  ctx.fillStyle = g;
  ctx.fillRect(0, horizon - 40, W, 160);
  ctx.restore();
};

/** 发光曲线 */
export const glowLine = (ctx: CanvasRenderingContext2D, pts: [number, number][], color: string, width = 4, alpha = 1) => {
  if (pts.length < 2) return;
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  for (const [w, a] of [
    [width * 6, 0.08],
    [width * 2.5, 0.25],
    [width, 1],
  ] as const) {
    ctx.strokeStyle = color;
    ctx.globalAlpha = a * alpha;
    ctx.lineWidth = w;
    ctx.beginPath();
    pts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
    ctx.stroke();
  }
  ctx.restore();
};

export const glowDot = (ctx: CanvasRenderingContext2D, x: number, y: number, r: number, color: string, alpha = 1) => {
  const spr = glowSprite(color);
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  ctx.globalAlpha = alpha;
  ctx.drawImage(spr, x - r, y - r, r * 2, r * 2);
  ctx.restore();
};

/** 一圈不断流动的粒子环（反刍的圈） */
const ringCache = new Map<string, P3[]>();
export const flowRing = (
  ctx: CanvasRenderingContext2D,
  t: number,
  cam: Cam3,
  o: {R: number; r: number; n: number; speed: number; color: string; size?: number; alpha?: number; center?: P3; tilt?: number},
) => {
  const key = `${o.R}|${o.r}|${o.n}`;
  let base = ringCache.get(key);
  if (!base) {
    base = torus(o.n, o.R, o.r, 11);
    ringCache.set(key, base);
  }
  const c = o.center ?? {x: 0, y: 0, z: 0};
  const tilt = o.tilt ?? 0;
  const ct = Math.cos(tilt);
  const st = Math.sin(tilt);
  const pts = base.map((p, i) => {
    const a = t * o.speed * (0.8 + 0.4 * hash(i * 0.37));
    const ca = Math.cos(a);
    const sa = Math.sin(a);
    const x = p.x * ca - p.z * sa;
    const z = p.x * sa + p.z * ca;
    const y = p.y;
    // 绕 x 轴倾斜
    return {x: x + c.x, y: y * ct - z * st + c.y, z: y * st + z * ct + c.z};
  });
  drawPoints(ctx, pts, cam, {color: o.color, size: o.size ?? 5, alpha: o.alpha ?? 0.9, twinkle: 0.2, t});
};

export const screenOf = (p: P3, cam: Cam3) => project(p, cam);
export const mixColor = (a: string, b: string, t: number) => {
  const pa = [1, 3, 5].map((i) => parseInt(a.slice(i, i + 2), 16));
  const pb = [1, 3, 5].map((i) => parseInt(b.slice(i, i + 2), 16));
  const m = pa.map((v, i) => Math.round(lerp(v, pb[i], Math.max(0, Math.min(1, t)))));
  return '#' + m.map((v) => v.toString(16).padStart(2, '0')).join('');
};

/** 点阵地面：透视排列的金色小点，越远越密越暗 */
export const dotFloor = (ctx: CanvasRenderingContext2D, horizon: number, alpha = 0.5) => {
  const spr = glowSprite(P.gold);
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  for (let k = 1; k < 26; k++) {
    const f = Math.pow(k / 26, 2.0);
    const y = horizon + f * (H - horizon + 120);
    const gap = 26 + f * 120;
    const r = 1.2 + f * 4;
    ctx.globalAlpha = alpha * Math.min(1, 0.15 + f * 1.2);
    for (let x = W / 2 - Math.floor(W / 2 / gap) * gap - gap; x < W + gap; x += gap) {
      ctx.drawImage(spr, x - r, y - r, r * 2, r * 2);
    }
  }
  ctx.restore();
};

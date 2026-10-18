// 透视卧室：一点透视的墙、地、窗，月光/晨光从窗口斜照进来，光柱里有浮尘。
import {W, H} from '../config';
import {hash, lerp} from './anim';
import {glowSprite} from './points';

const VP = {l: 520, r: 1400, t: 280, b: 720};
type XY = [number, number];
/** 右墙上的点：u 0 近 → 1 远，v 0 上 → 1 下 */
const rightWall = (u: number, v: number): XY => {
  const top: XY = [lerp(W, VP.r, u), lerp(0, VP.t, u)];
  const bot: XY = [lerp(W, VP.r, u), lerp(H, VP.b, u)];
  return [lerp(top[0], bot[0], v), lerp(top[1], bot[1], v)];
};
/** 地面上的点：u 0 左 → 1 右，w 0 近 → 1 远 */
const floor = (u: number, w: number): XY => {
  const l: XY = [lerp(0, VP.l, w), lerp(H, VP.b, w)];
  const r: XY = [lerp(W, VP.r, w), lerp(H, VP.b, w)];
  return [lerp(l[0], r[0], u), lerp(l[1], r[1], u)];
};

const poly = (ctx: CanvasRenderingContext2D, pts: XY[]) => {
  ctx.beginPath();
  pts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
  ctx.closePath();
};

export const WIN = {u0: 0.28, u1: 0.62, v0: 0.22, v1: 0.6};
export const windowCenter = (): XY => rightWall((WIN.u0 + WIN.u1) / 2, (WIN.v0 + WIN.v1) / 2);

export const drawRoom = (ctx: CanvasRenderingContext2D, t: number, dawn: number) => {
  const cold = [20, 30, 52];
  const warm = [70, 46, 30];
  const mix = (k: number) => cold.map((c, i) => Math.round(lerp(c, warm[i], dawn) * k));
  const rgb = (a: number[]) => `rgb(${a[0]},${a[1]},${a[2]})`;
  // 墙、天花板、地
  poly(ctx, [[0, 0], [W, 0], [VP.r, VP.t], [VP.l, VP.t]]);
  ctx.fillStyle = rgb(mix(0.35));
  ctx.fill();
  poly(ctx, [[VP.l, VP.t], [VP.r, VP.t], [VP.r, VP.b], [VP.l, VP.b]]);
  ctx.fillStyle = rgb(mix(0.55));
  ctx.fill();
  poly(ctx, [[0, 0], [VP.l, VP.t], [VP.l, VP.b], [0, H]]);
  ctx.fillStyle = rgb(mix(0.42));
  ctx.fill();
  poly(ctx, [[W, 0], [VP.r, VP.t], [VP.r, VP.b], [W, H]]);
  ctx.fillStyle = rgb(mix(0.48));
  ctx.fill();
  poly(ctx, [[0, H], [W, H], [VP.r, VP.b], [VP.l, VP.b]]);
  const fg = ctx.createLinearGradient(0, VP.b, 0, H);
  fg.addColorStop(0, rgb(mix(0.4)));
  fg.addColorStop(1, rgb(mix(0.18)));
  ctx.fillStyle = fg;
  ctx.fill();
  // 地板缝
  ctx.strokeStyle = 'rgba(255,255,255,0.04)';
  ctx.lineWidth = 2;
  for (let i = 1; i < 12; i++) {
    const a = floor(i / 12, 0);
    const b = floor(i / 12, 1);
    ctx.beginPath();
    ctx.moveTo(a[0], a[1]);
    ctx.lineTo(b[0], b[1]);
    ctx.stroke();
  }
  // 窗
  const w00 = rightWall(WIN.u0, WIN.v0);
  const w10 = rightWall(WIN.u1, WIN.v0);
  const w11 = rightWall(WIN.u1, WIN.v1);
  const w01 = rightWall(WIN.u0, WIN.v1);
  poly(ctx, [w00, w10, w11, w01]);
  const sky = ctx.createLinearGradient(w00[0], w00[1], w01[0], w01[1]);
  sky.addColorStop(0, dawn > 0 ? `rgba(255,${Math.round(lerp(60, 200, dawn))},${Math.round(lerp(90, 120, dawn))},1)` : '#1B2A48');
  sky.addColorStop(1, dawn > 0 ? `rgba(255,${Math.round(lerp(80, 225, dawn))},${Math.round(lerp(120, 160, dawn))},1)` : '#0E1830');
  ctx.fillStyle = dawn > 0.02 ? sky : '#16223C';
  ctx.fill();
  if (dawn < 0.6) {
    const m = rightWall(WIN.u0 + 0.08, WIN.v0 + 0.1);
    ctx.globalAlpha = 1 - dawn * 1.6;
    ctx.fillStyle = '#DDE8F6';
    ctx.beginPath();
    ctx.arc(m[0], m[1], 22, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
  }
  ctx.strokeStyle = rgb(mix(0.2));
  ctx.lineWidth = 12;
  poly(ctx, [w00, w10, w11, w01]);
  ctx.stroke();
  const mt = rightWall((WIN.u0 + WIN.u1) / 2, WIN.v0);
  const mb = rightWall((WIN.u0 + WIN.u1) / 2, WIN.v1);
  const ml = rightWall(WIN.u0, (WIN.v0 + WIN.v1) / 2);
  const mr = rightWall(WIN.u1, (WIN.v0 + WIN.v1) / 2);
  ctx.lineWidth = 7;
  ctx.beginPath();
  ctx.moveTo(mt[0], mt[1]);
  ctx.lineTo(mb[0], mb[1]);
  ctx.moveTo(ml[0], ml[1]);
  ctx.lineTo(mr[0], mr[1]);
  ctx.stroke();
  // 光柱：从窗口落到地上
  const f0 = floor(0.12, 0.25);
  const f1 = floor(0.62, 0.75);
  const f2 = floor(0.78, 0.35);
  const f3 = floor(0.3, 0.02);
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  const beamCol = dawn > 0 ? [255, 200, 140] : [150, 190, 255];
  const bg = ctx.createLinearGradient(w00[0], w00[1], f3[0], f3[1]);
  bg.addColorStop(0, `rgba(${beamCol},${0.16 + 0.3 * dawn})`);
  bg.addColorStop(1, `rgba(${beamCol},0)`);
  poly(ctx, [w00, w10, f1, f0]);
  ctx.fillStyle = bg;
  ctx.fill();
  poly(ctx, [w10, w11, f2, f1]);
  ctx.fill();
  poly(ctx, [f0, f1, f2, f3]);
  ctx.fillStyle = `rgba(${beamCol},${0.07 + 0.22 * dawn})`;
  ctx.fill();
  // 浮尘
  const spr = glowSprite(dawn > 0.3 ? '#FFD39A' : '#BFE3FF');
  for (let i = 0; i < 260; i++) {
    const a = hash(i * 1.3);
    const b = hash(i * 2.1);
    const top = rightWall(lerp(WIN.u0, WIN.u1, a), lerp(WIN.v0, WIN.v1, hash(i * 3.3)));
    const end = floor(lerp(0.12, 0.7, a), lerp(0.05, 0.6, hash(i * 4.4)));
    const k = (b + t * 0.02 * (0.5 + hash(i))) % 1;
    const x = lerp(top[0], end[0], k) + Math.sin(t * 0.5 + i) * 10;
    const y = lerp(top[1], end[1], k) + Math.cos(t * 0.4 + i) * 8;
    const s = 2 + hash(i * 5.5) * 5;
    ctx.globalAlpha = (0.25 + 0.6 * hash(i * 6.6)) * (0.6 + 0.4 * Math.sin(t * 2 + i));
    ctx.drawImage(spr, x - s, y - s, s * 2, s * 2);
  }
  ctx.restore();
  // 床
  const b0 = floor(0.06, 0.38);
  const b1 = floor(0.46, 0.38);
  const b2 = floor(0.46, 0.85);
  const b3 = floor(0.06, 0.85);
  const lift = 80;
  poly(ctx, [[b0[0], b0[1] - lift], [b1[0], b1[1] - lift], [b2[0], b2[1] - lift * 0.7], [b3[0], b3[1] - lift * 0.7]]);
  const bedG = ctx.createLinearGradient(b3[0], b3[1], b1[0], b1[1]);
  bedG.addColorStop(0, rgb(mix(0.7)));
  bedG.addColorStop(1, rgb(mix(1.25)));
  ctx.fillStyle = bedG;
  ctx.fill();
  poly(ctx, [[b0[0], b0[1] - lift], [b1[0], b1[1] - lift], b1, b0]);
  ctx.fillStyle = rgb(mix(0.25));
  ctx.fill();
  poly(ctx, [[b1[0], b1[1] - lift], [b2[0], b2[1] - lift * 0.7], b2, b1]);
  ctx.fillStyle = rgb(mix(0.3));
  ctx.fill();
};

/** 床面上的一点（放躺着的人） */
export const bedPoint = (u: number, w: number): XY => {
  const p = floor(lerp(0.06, 0.46, u), lerp(0.38, 0.85, w));
  return [p[0], p[1] - lerp(80, 56, w)];
};

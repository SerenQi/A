// 灰度“底稿”：给网点渲染用的明暗图。
import {H, W} from '../config';
import {SHAPES} from '../components/Dots';
import {hash, lerp} from './anim';
import {VP, WIN, floor, poly, rightWall} from './room';

type XY = [number, number];
const g = (v: number) => {
  const c = Math.round(Math.max(0, Math.min(1, v)) * 255);
  return `rgb(${c},${c},${c})`;
};

/** 侧脸：左上方打光，脸的轮廓有一道亮边 */
export const paintHead = (ctx: CanvasRenderingContext2D, x: number, y: number, s: number, light = 1, rim = 1) => {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(s, s);
  const path = new Path2D(SHAPES.head);
  const grad = ctx.createRadialGradient(-20, -300, 20, 20, -220, 380);
  grad.addColorStop(0, g(0.85 * light));
  grad.addColorStop(0.5, g(0.42 * light));
  grad.addColorStop(1, g(0.1 * light));
  ctx.fillStyle = grad;
  ctx.fill(path);
  ctx.strokeStyle = g(0.95 * rim);
  ctx.lineWidth = 10 / s;
  ctx.stroke(path);
  ctx.restore();
};

/** 站着/低头的人：同样的打光 */
export const paintPerson = (ctx: CanvasRenderingContext2D, x: number, y: number, s: number, slump = false, light = 1) => {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(s, s);
  const path = new Path2D(slump ? SHAPES.slump : SHAPES.person);
  const grad = ctx.createLinearGradient(-50, -260, 50, 0);
  grad.addColorStop(0, g(0.8 * light));
  grad.addColorStop(1, g(0.2 * light));
  ctx.fillStyle = grad;
  ctx.fill(path);
  ctx.restore();
};

/** 夜里/清晨的卧室：窗、光柱、床、躺着的人、枕边手机的光 */
export const paintRoom = (ctx: CanvasRenderingContext2D, t: number, dawn: number) => {
  const k = lerp(1, 2.2, dawn);
  poly(ctx, [[0, 0], [W, 0], [VP.r, VP.t], [VP.l, VP.t]]);
  ctx.fillStyle = g(0.015 * k);
  ctx.fill();
  poly(ctx, [[VP.l, VP.t], [VP.r, VP.t], [VP.r, VP.b], [VP.l, VP.b]]);
  ctx.fillStyle = g(0.035 * k);
  ctx.fill();
  poly(ctx, [[0, 0], [VP.l, VP.t], [VP.l, VP.b], [0, H]]);
  ctx.fillStyle = g(0.025 * k);
  ctx.fill();
  poly(ctx, [[W, 0], [VP.r, VP.t], [VP.r, VP.b], [W, H]]);
  ctx.fillStyle = g(0.03 * k);
  ctx.fill();
  poly(ctx, [[0, H], [W, H], [VP.r, VP.b], [VP.l, VP.b]]);
  ctx.fillStyle = g(0.02 * k);
  ctx.fill();
  // 墙角的线
  ctx.strokeStyle = g(0.16 * k);
  ctx.lineWidth = 5;
  for (const [a, b] of [
    [[VP.l, VP.t], [VP.r, VP.t]],
    [[VP.l, VP.b], [VP.r, VP.b]],
    [[VP.l, VP.t], [VP.l, VP.b]],
    [[VP.r, VP.t], [VP.r, VP.b]],
    [[VP.l, VP.b], [0, H]],
    [[VP.r, VP.b], [W, H]],
  ] as [XY, XY][]) {
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
  ctx.fillStyle = g(0.55 + 0.45 * dawn);
  ctx.fill();
  const m = rightWall(WIN.u0 + 0.08, WIN.v0 + 0.1);
  if (dawn < 0.7) {
    ctx.fillStyle = g(1);
    ctx.beginPath();
    ctx.arc(m[0], m[1], 26, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.strokeStyle = g(0.03);
  ctx.lineWidth = 16;
  poly(ctx, [w00, w10, w11, w01]);
  ctx.stroke();
  const mt = rightWall((WIN.u0 + WIN.u1) / 2, WIN.v0);
  const mb = rightWall((WIN.u0 + WIN.u1) / 2, WIN.v1);
  const ml = rightWall(WIN.u0, (WIN.v0 + WIN.v1) / 2);
  const mr = rightWall(WIN.u1, (WIN.v0 + WIN.v1) / 2);
  ctx.lineWidth = 10;
  ctx.beginPath();
  ctx.moveTo(mt[0], mt[1]);
  ctx.lineTo(mb[0], mb[1]);
  ctx.moveTo(ml[0], ml[1]);
  ctx.lineTo(mr[0], mr[1]);
  ctx.stroke();
  // 光柱与地上的光斑
  const f0 = floor(0.12, 0.25);
  const f1 = floor(0.62, 0.75);
  const f2 = floor(0.78, 0.35);
  const f3 = floor(0.3, 0.02);
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  const bg = ctx.createLinearGradient(w00[0], w00[1], f3[0], f3[1]);
  bg.addColorStop(0, g(0.3 + 0.3 * dawn));
  bg.addColorStop(1, g(0.02));
  ctx.fillStyle = bg;
  poly(ctx, [w00, w10, f1, f0]);
  ctx.fill();
  poly(ctx, [w10, w11, f2, f1]);
  ctx.fill();
  poly(ctx, [f0, f1, f2, f3]);
  ctx.fillStyle = g(0.22 + 0.35 * dawn);
  ctx.fill();
  ctx.restore();
  // 床
  const b0 = floor(0.06, 0.38);
  const b1 = floor(0.46, 0.38);
  const b2 = floor(0.46, 0.85);
  const b3 = floor(0.06, 0.85);
  const lift = 80;
  poly(ctx, [[b0[0], b0[1] - lift], [b1[0], b1[1] - lift], [b2[0], b2[1] - lift * 0.7], [b3[0], b3[1] - lift * 0.7]]);
  const bedG = ctx.createLinearGradient(b3[0], b3[1], b1[0], b1[1]);
  bedG.addColorStop(0, g(0.12 * k));
  bedG.addColorStop(1, g(0.32 * k));
  ctx.fillStyle = bedG;
  ctx.fill();
  poly(ctx, [[b0[0], b0[1] - lift], [b1[0], b1[1] - lift], b1, b0]);
  ctx.fillStyle = g(0.04);
  ctx.fill();
  // 被子的褶皱
  ctx.strokeStyle = g(0.4 * k);
  ctx.lineWidth = 5;
  for (let i = 0; i < 5; i++) {
    const a = floor(lerp(0.12, 0.42, hash(i)), lerp(0.42, 0.8, hash(i + 3)));
    ctx.beginPath();
    ctx.moveTo(a[0], a[1] - 75);
    ctx.quadraticCurveTo(a[0] + 60, a[1] - 95, a[0] + 140, a[1] - 78);
    ctx.stroke();
  }
  // 枕头、躺着的人：头在右边枕头上，被子隆起
  const bx = lerp(b0[0], b2[0], 0.5);
  const by = lerp(b0[1], b2[1], 0.45) - 80;
  const pillowX = bx + 250;
  ctx.fillStyle = g(0.32 * k);
  ctx.beginPath();
  ctx.ellipse(pillowX, by + 6, 120, 38, -0.05, 0, Math.PI * 2);
  ctx.fill();
  const hg = ctx.createRadialGradient(pillowX + 10, by - 40, 4, pillowX - 10, by - 20, 70);
  hg.addColorStop(0, g(0.95 * k));
  hg.addColorStop(1, g(0.25 * k));
  ctx.fillStyle = hg;
  ctx.beginPath();
  ctx.arc(pillowX - 10, by - 22, 46, 0, Math.PI * 2);
  ctx.fill();
  const blanket = new Path2D(`M${bx - 330},${by + 40} C${bx - 250},${by - 40} ${bx - 60},${by - 70} ${bx + 120},${by - 40} C${bx + 170},${by - 30} ${bx + 200},${by + 10} ${bx + 190},${by + 50} Z`);
  const bgd = ctx.createLinearGradient(bx - 300, by - 60, bx + 100, by + 60);
  bgd.addColorStop(0, g(0.18 * k));
  bgd.addColorStop(0.55, g(0.55 * k));
  bgd.addColorStop(1, g(0.2 * k));
  ctx.fillStyle = bgd;
  ctx.fill(blanket);
  ctx.strokeStyle = g(0.85 * k);
  ctx.lineWidth = 6;
  ctx.beginPath();
  ctx.moveTo(bx - 300, by + 10);
  ctx.bezierCurveTo(bx - 220, by - 52, bx - 40, by - 76, bx + 130, by - 44);
  ctx.stroke();
  // 枕边手机的光
  const px = bx + 290;
  const py = by + 10;
  const pgl = ctx.createRadialGradient(px, py, 0, px, py, 320);
  pgl.addColorStop(0, g(0.8 * (0.85 + 0.15 * Math.sin(t * 3)) * (1 - dawn)));
  pgl.addColorStop(1, g(0));
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  ctx.fillStyle = pgl;
  ctx.fillRect(px - 400, py - 400, 800, 800);
  ctx.restore();
  return {hx: pillowX - 10, hy: by - 30};
};

// 证物 → 来历 → 循环 → 五种 → 分工 → 新证据 → 结案
import {H, INK, ONSCREEN, W} from '../config';
import {clamp01, hash, lerp, span} from '../lib/anim';
import {backOut, boil, bunny, Ctx, dotWipe, edge, halftone, headline, inked, label, radial, rr, stamp} from './print';

export type Impact = {t: number; power: number; flash: number};
export type Sfx = {t: number; kind: 'stamp' | 'pop' | 'slide' | 'type' | 'ding' | 'whoosh' | 'tick' | 'chime' | 'thud'};

// ---------- 小部件 ----------

/** 带偏移阴影的卡片 */
const card = (ctx: Ctx, x: number, y: number, w: number, h: number, fill: string, shadow: string = INK.navy) => {
  ctx.save();
  ctx.fillStyle = shadow;
  ctx.beginPath();
  ctx.roundRect(x + 10, y + 10, w, h, 16);
  ctx.fill();
  ctx.restore();
  inked(ctx, rr(x, y, w, h, 16), fill, 6);
};

/** 便利贴批注 */
const sticky = (ctx: Ctx, text: string, x: number, y: number, rot: number, t: number, color: string = INK.yellow, size = 40) => {
  if (t < 0) return;
  const e = backOut(t / 0.35);
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rot);
  ctx.scale(e, e);
  ctx.font = `900 ${size}px "Noto Sans SC", sans-serif`;
  const w = ctx.measureText(text).width + 50;
  const h = size * 1.9;
  ctx.fillStyle = 'rgba(30,35,66,0.25)';
  ctx.fillRect(-w / 2 + 6, -h / 2 + 8, w, h);
  inked(ctx, rr(-w / 2, -h / 2, w, h, 4), color, 4);
  ctx.fillStyle = 'rgba(255,255,255,0.45)';
  ctx.fillRect(-28, -h / 2 - 12, 56, 22);
  label(ctx, text, 0, size * 0.36, size, {align: 'center', color: INK.navy});
  ctx.restore();
};

/** 网点填充的巨型数字 */
const numeral = (ctx: Ctx, text: string, x: number, y: number, size: number, base: string, dot: string, align: CanvasTextAlign = 'left', alpha = 1) => {
  const c = document.createElement('canvas');
  c.width = W;
  c.height = H;
  const g = c.getContext('2d')!;
  g.font = `900 ${size}px "Noto Sans SC", sans-serif`;
  g.textAlign = align;
  g.fillStyle = base;
  g.fillText(text, x, y);
  g.globalCompositeOperation = 'source-atop';
  halftone(g, (px, py) => 0.3 + 0.5 * clamp01((py - (y - size)) / size), {step: 18, angle: 45, color: dot, k: 0.66});
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.drawImage(c, 0, 0);
  ctx.restore();
};

/** 小人：圆头 + 身体 */
const figure = (ctx: Ctx, x: number, y: number, s: number, fill: string) => {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(s, s);
  inked(ctx, new Path2D('M-22,0 C-22,-28 -14,-40 0,-40 C14,-40 22,-28 22,0 Z'), fill, 4);
  inked(ctx, new Path2D('M-14,-56 a14,14 0 1 0 28,0 a14,14 0 1 0 -28,0 Z'), INK.white, 4);
  ctx.restore();
};

/** 气泡 */
const bubble = (ctx: Ctx, text: string, x: number, y: number, size: number, t: number, fill: string = INK.white) => {
  if (t < 0) return;
  const e = backOut(t / 0.3);
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(e, e);
  ctx.font = `900 ${size}px "Noto Sans SC", sans-serif`;
  const w = ctx.measureText(text).width + size * 1.1;
  const h = size * 1.7;
  const p = new Path2D();
  p.roundRect(-w / 2, -h, w, h, h / 2);
  p.moveTo(-size * 0.3, -2);
  p.lineTo(-size * 0.5, size * 0.55);
  p.lineTo(size * 0.2, -2);
  inked(ctx, p, fill, 4);
  label(ctx, text, 0, -h / 2 + size * 0.36, size, {align: 'center', color: INK.navy});
  ctx.restore();
};

const enter = (t: number, dur = 0.4) => backOut(t / dur);

// ---------- 01 证物 ----------

const EX = [
  {t: 12.4, note: 15.2, name: '升职通知', memo: '运气好'},
  {t: 17.4, note: 18.4, name: '同事的夸奖', memo: '客气而已'},
  {t: 20.4, note: 21.4, name: '考了第一', memo: '这次题简单'},
  {t: 23.4, note: 24.4, name: '一次失误', memo: '这才是真的我'},
];

const exhibitIcon = (ctx: Ctx, i: number, cx: number, cy: number) => {
  if (i === 0) {
    inked(ctx, rr(cx - 90, cy - 110, 180, 220, 8), INK.white, 5);
    label(ctx, '升职通知', cx, cy - 66, 30, {align: 'center'});
    for (let k = 0; k < 4; k++) inked(ctx, rr(cx - 66, cy - 36 + k * 26, 132 - (k === 3 ? 50 : 0), 8, 4), '#C9C2B2', 0.01);
    inked(ctx, new Path2D(`M${cx + 30},${cy + 70} a30,30 0 1 0 60,0 a30,30 0 1 0 -60,0 Z`), INK.red, 5);
  } else if (i === 1) {
    bubble(ctx, '做得真好！', cx, cy + 40, 40, 1, INK.white);
  } else if (i === 2) {
    inked(ctx, rr(cx - 90, cy - 110, 180, 220, 8), INK.white, 5);
    label(ctx, '100', cx, cy + 10, 90, {align: 'center', color: INK.red, kind: 'serif'});
    inked(ctx, new Path2D(`M${cx - 70},${cy + 60} L${cx + 70},${cy + 60}`), INK.red, 5, INK.red);
    label(ctx, '第 1 名', cx, cy - 66, 28, {align: 'center'});
  } else {
    inked(ctx, rr(cx - 90, cy - 110, 180, 220, 8), INK.white, 5);
    for (let k = 0; k < 5; k++) inked(ctx, rr(cx - 66, cy - 80 + k * 26, 132, 8, 4), '#C9C2B2', 0.01);
    ctx.save();
    ctx.strokeStyle = INK.red;
    ctx.lineWidth = 16;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(cx - 60, cy - 10);
    ctx.lineTo(cx + 60, cy + 100);
    ctx.moveTo(cx + 60, cy - 10);
    ctx.lineTo(cx - 60, cy + 100);
    ctx.stroke();
    ctx.restore();
  }
};

const C1 = (ctx: Ctx, s: number) => {
  const push = 1 + span(s, 31.6, 36, (x) => x) * 0.06;
  ctx.save();
  ctx.translate(W / 2, H / 2);
  ctx.scale(push, push);
  ctx.translate(-W / 2, -H / 2);
  // 软木板上的红线
  const active = EX.reduce((a, e, i) => (s >= e.t ? i : a), 0);
  numeral(ctx, `0${active + 1}`, 1880, 1000, 520, '#E4D9C2', '#CFC3A8', 'right', 0.9);
  halftone(ctx, edge(220, 0.7), {step: 22, angle: 30, color: INK.cobalt, k: 0.62, alpha: 0.3});
  const xs = [300, 740, 1180, 1620];
  if (s > 13) {
    ctx.save();
    ctx.strokeStyle = INK.red;
    ctx.lineWidth = 4;
    ctx.beginPath();
    xs.forEach((x, i) => {
      if (s < EX[i].t + 0.3) return;
      if (i === 0) ctx.moveTo(x, 300);
      else ctx.lineTo(x, 300 + (i % 2) * 30);
    });
    ctx.stroke();
    ctx.restore();
  }
  EX.forEach((e, i) => {
    const t = s - e.t;
    if (t < 0) return;
    const k = enter(t, 0.45);
    const x = xs[i];
    const y = 560 + (1 - k) * 700;
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate((i % 2 ? 1 : -1) * 0.03);
    boil(ctx, s, 1);
    card(ctx, -190, -260, 380, 470, i === 3 ? '#F2C9C2' : INK.white);
    label(ctx, `证物 0${i + 1}`, -160, -210, 28, {kind: 'mono', weight: 700, color: INK.pink});
    exhibitIcon(ctx, i, 0, -30);
    label(ctx, e.name, 0, 170, 40, {align: 'center'});
    // 图钉
    inked(ctx, new Path2D('M-14,-260 a14,14 0 1 0 28,0 a14,14 0 1 0 -28,0 Z'), INK.red, 4);
    ctx.restore();
    sticky(ctx, e.memo, x + 40, y - 300, (i % 2 ? 0.08 : -0.07), s - e.note, i === 3 ? INK.pink : INK.yellow, 38);
  });
  // 前三张被驳回，失误被采信
  stamp(ctx, '驳回', 300, 600, 70, s - 27.3, {rot: -14, seed: 21});
  stamp(ctx, '驳回', 740, 600, 70, s - 28.1, {rot: 9, seed: 22});
  stamp(ctx, '驳回', 1180, 600, 70, s - 28.9, {rot: -6, seed: 23});
  stamp(ctx, '采信', 1620, 600, 76, s - 29.9, {rot: 12, seed: 24, color: INK.navy});
  ctx.restore();
};

// ---------- 02 来历 ----------

const typed = (ctx: Ctx, text: string, x: number, y: number, size: number, t: number, cps = 26, color: string = INK.navy) => {
  const n = Math.max(0, Math.min(text.length, Math.floor(t * cps)));
  if (n <= 0) return;
  label(ctx, text.slice(0, n), x, y, size, {kind: 'mono', weight: 700, color});
};

const C2 = (ctx: Ctx, s: number) => {
  if (s < 46.8) {
    numeral(ctx, '1978', 80, 760, 380, INK.navy, INK.cobalt, 'left', clamp01((s - 38) / 0.3));
    // 打字机打出来的论文
    const e = enter(s - 38.3, 0.5);
    ctx.save();
    ctx.translate(1340, 470 + (1 - e) * 800);
    ctx.rotate(0.03);
    card(ctx, -320, -330, 640, 640, INK.white);
    const t = s - 39;
    typed(ctx, 'THE IMPOSTER', -270, -240, 40, t);
    typed(ctx, 'PHENOMENON IN HIGH', -270, -190, 40, t - 0.5);
    typed(ctx, 'ACHIEVING WOMEN', -270, -140, 40, t - 1.2);
    typed(ctx, 'Clance & Imes · 1978', -270, -80, 26, t - 1.8, 30, INK.pink);
    for (let k = 0; k < 7; k++) if (t > 2.4 + k * 0.15) inked(ctx, rr(-270, -30 + k * 40, 540 - (k === 6 ? 220 : 0), 10, 5), '#D6CFBF', 0.01);
    ctx.restore();
    ['律师', '医生', '大学教师'].forEach((p, i) => {
      const k = enter(s - 43.0 - i * 0.35, 0.35);
      if (s < 43.0 + i * 0.35) return;
      ctx.save();
      ctx.translate(140 + i * 250, 900);
      ctx.scale(k, k);
      ctx.fillStyle = INK.navy;
      ctx.beginPath();
      ctx.roundRect(-10, -50, 220, 74, 37);
      ctx.fill();
      label(ctx, p, 100, 0, 38, {align: 'center', color: INK.yellow});
      ctx.restore();
    });
  } else if (s < 54.8) {
    const t = s - 46.8;
    label(ctx, '150+', 110, 420, 200, {color: INK.navy});
    label(ctx, '位成功女性', 120, 500, 52, {color: INK.pink});
    // 一百五十个小人
    for (let i = 0; i < 150; i++) {
      const c = i % 15;
      const r = Math.floor(i / 15);
      const x = 760 + c * 72;
      const y = 250 + r * 66;
      if (t < i * 0.006) continue;
      figure(ctx, x, y, 0.62, i % 7 === 0 ? INK.pink : INK.cobalt);
    }
    // 心里的话
    for (let k = 0; k < 9; k++) {
      const i = Math.floor(hash(k * 13.1) * 150);
      bubble(ctx, '我是骗来的', 760 + (i % 15) * 72, 250 + Math.floor(i / 15) * 66 - 50, 20, t - 0.6 - k * 0.12, INK.white);
    }
    // 奖牌落下也没用
    if (s > 51.2) {
      for (let k = 0; k < 14; k++) {
        const lt = s - 51.2 - k * 0.12;
        if (lt < 0) continue;
        const x = 140 + hash(k * 5.3) * 480;
        const y = Math.min(860 - (k % 3) * 34, 560 + lt * 900);
        inked(ctx, new Path2D(`M${x - 14},${y - 60} L${x},${y - 26} L${x + 14},${y - 60} Z`), INK.cobalt, 3);
        inked(ctx, new Path2D(`M${x - 26},${y} a26,26 0 1 0 52,0 a26,26 0 1 0 -52,0 Z`), INK.yellow, 4);
      }
    }
  } else {
    const t = s - 54.8;
    halftone(ctx, radial(960, 480, 100, 700), {step: 24, angle: 15, color: INK.yellow, k: 0.7});
    headline(ctx, '现象', W / 2, 560, 300, t, {align: 'center', shadow: INK.pink});
    label(ctx, 'PHENOMENON', W / 2, 660, 50, {kind: 'mono', weight: 700, align: 'center', alpha: span(t, 0.5, 0.8)});
    if (t > 2.6) {
      label(ctx, '病', 1420, 380, 120, {kind: 'serif', color: 'rgba(30,35,66,0.6)'});
      ctx.save();
      ctx.strokeStyle = INK.red;
      ctx.lineWidth = 14;
      ctx.lineCap = 'round';
      const k = clamp01((t - 2.8) / 0.25);
      ctx.beginPath();
      ctx.moveTo(1400, 280);
      ctx.lineTo(1400 + 160 * k, 280 + 130 * k);
      ctx.stroke();
      ctx.restore();
    }
    bunny(ctx, 400, 1000, 0.75, {face: t > 2.8 ? 'calm' : 'worried', t: s});
  }
  dotWipe(ctx, (s - 46.5) / 0.6, INK.cobalt);
  dotWipe(ctx, (s - 54.5) / 0.6, INK.yellow);
};

// ---------- 03 循环 ----------

const NODES = [
  {a: -90, text: '新任务', at: 62.4},
  {a: -18, text: '焦虑', at: 64.8},
  {a: 54, text: '准备 / 拖延', at: 67.4},
  {a: 126, text: '成了', at: 71.8},
  {a: 198, text: '努力 / 运气', at: 74.0},
];

const C3 = (ctx: Ctx, s: number) => {
  const cx = 960;
  const cy = 500;
  const R = 330;
  halftone(ctx, radial(cx, cy, R - 40, R + 220, 0.6), {step: 20, angle: 20, color: INK.cobalt, k: 0.6});
  ctx.save();
  ctx.setLineDash([26, 18]);
  ctx.lineDashOffset = -s * 60;
  ctx.strokeStyle = INK.navy;
  ctx.lineWidth = 10;
  ctx.beginPath();
  ctx.arc(cx, cy, R, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();
  // 小兔头沿着圈跑
  let ang: number;
  if (s < 80.6) {
    const idx = NODES.reduce((a, n, i) => (s >= n.at ? i : a), 0);
    const from = NODES[idx].a;
    const to = idx < NODES.length - 1 ? NODES[idx + 1].a : 270;
    const prog = clamp01((s - NODES[idx].at) / 0.8);
    ang = lerp(from, to, backOut(prog, 1.2) * 0 + prog);
  } else if (s < 83.8) ang = lerp(198, 270, clamp01((s - 80.6) / 1.2));
  else ang = 270 + (s - 83.8) * (180 + (s - 83.8) * 90);
  const rad = (ang * Math.PI) / 180;
  NODES.forEach((n, i) => {
    const r = (n.a * Math.PI) / 180;
    const x = cx + Math.cos(r) * R;
    const y = cy + Math.sin(r) * R;
    const on = s >= n.at;
    const k = on ? enter(s - n.at, 0.35) : 0.75;
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(k, k);
    ctx.font = '900 40px "Noto Sans SC", sans-serif';
    const w = ctx.measureText(n.text).width + 56;
    ctx.fillStyle = INK.navy;
    ctx.beginPath();
    ctx.roundRect(-w / 2 + 8, -38 + 8, w, 76, 38);
    ctx.fill();
    inked(ctx, rr(-w / 2, -38, w, 76, 38), on ? (i === 1 ? INK.red : i === 3 ? INK.yellow : INK.white) : '#D9D0BD', 5);
    label(ctx, n.text, 0, 14, 40, {align: 'center', color: on && i === 1 ? INK.white : INK.navy});
    ctx.restore();
  });
  const hx = cx + Math.cos(rad) * R;
  const hy = cy + Math.sin(rad) * R;
  if (s > 62.6) {
    ctx.save();
    ctx.translate(hx, hy);
    inked(ctx, new Path2D('M-30,0 a30,28 0 1 0 60,0 a30,28 0 1 0 -60,0 Z'), INK.white, 5);
    inked(ctx, new Path2D('M-22,-20 C-30,-60 -20,-80 -12,-80 C-4,-80 -2,-60 -8,-22 Z'), INK.white, 4);
    inked(ctx, new Path2D('M22,-20 C30,-60 20,-80 12,-80 C4,-80 2,-60 8,-22 Z'), INK.white, 4);
    ctx.fillStyle = INK.navy;
    ctx.beginPath();
    ctx.arc(-10, -2, 4, 0, Math.PI * 2);
    ctx.arc(10, -2, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
  // 中间的案卷越摞越厚
  const loops = s < 83.8 ? (s > 80.6 ? 1 : 0) : 1 + Math.floor((ang - 270) / 360) + 1;
  const n = Math.min(10, 1 + loops * 2);
  for (let k = 0; k < n; k++) {
    const y = cy + 110 - k * 14;
    inked(ctx, rr(cx - 150 + (k % 2) * 6, y - 20, 300, 26, 6), k % 3 === 0 ? '#E8C873' : '#EFD9A0', 4);
  }
  ctx.save();
  ctx.translate(cx, cy + 110 - n * 14 - 40);
  inked(ctx, rr(-150, -50, 300, 90, 10), '#F1DCA4', 5);
  label(ctx, '我是骗子', 0, 14, 44, {align: 'center', color: INK.red});
  ctx.restore();
};

// ---------- 04 五种 ----------

const TYPES = [
  {t: 95.4, name: '完美主义者', color: INK.pink},
  {t: 99.0, name: '天才型', color: INK.yellow},
  {t: 102.6, name: '独行侠', color: '#7FB3A8'},
  {t: 105.8, name: '专家型', color: INK.cobalt},
  {t: 109.0, name: '超人型', color: INK.red},
];

const typeIcon = (ctx: Ctx, i: number) => {
  if (i === 0) {
    label(ctx, '99', 0, 30, 120, {align: 'center', color: INK.navy});
    label(ctx, '-1', 70, -50, 50, {color: INK.red});
  } else if (i === 1) {
    inked(ctx, new Path2D('M-44,10 C-70,-20 -60,-80 0,-84 C60,-80 70,-20 44,10 L30,40 L-30,40 Z'), INK.yellow, 5);
    inked(ctx, rr(-28, 44, 56, 30, 6), '#B0A898', 5);
    label(ctx, '?', 0, -10, 60, {align: 'center', color: INK.navy});
  } else if (i === 2) {
    figure(ctx, 0, 60, 1.6, INK.cobalt);
    label(ctx, 'HELP', -10, -60, 36, {kind: 'mono', weight: 700, color: INK.navy, align: 'center'});
    ctx.save();
    ctx.strokeStyle = INK.red;
    ctx.lineWidth = 8;
    ctx.beginPath();
    ctx.moveTo(-60, -90);
    ctx.lineTo(40, -50);
    ctx.stroke();
    ctx.restore();
  } else if (i === 3) {
    for (let k = 0; k < 4; k++) inked(ctx, rr(-70 + (k % 2) * 8, 70 - k * 30, 140, 28, 4), [INK.cobalt, INK.pink, INK.yellow, '#7FB3A8', INK.white][k], 4);
    label(ctx, '还不够', 0, -78, 30, {align: 'center', color: INK.navy});
  } else {
    inked(ctx, new Path2D('M10,-90 L-40,10 L0,10 L-20,90 L50,-20 L10,-20 L30,-90 Z'), INK.yellow, 5);
  }
};

const C4 = (ctx: Ctx, s: number) => {
  halftone(ctx, edge(300, 0.7), {step: 22, angle: 30, color: INK.pink, k: 0.6, alpha: 0.7});
  const end = s >= 113;
  TYPES.forEach((ty, i) => {
    const t = s - ty.t;
    if (t < -0.0 && !end) {
      // 背面朝上
      if (s < 93.6 + i * 0.15) return;
    }
    const x = 220 + i * 370;
    const k = enter(s - 92.6 - i * 0.15, 0.4);
    if (s < 92.6 + i * 0.15) return;
    const isActive = s >= ty.t && (i === TYPES.length - 1 ? s < 113 : s < TYPES[i + 1].t);
    const sc = isActive ? 1.12 : 1;
    const flip = clamp01(t / 0.3);
    const fx = Math.abs(Math.cos(flip * Math.PI));
    const front = flip >= 0.5;
    ctx.save();
    ctx.translate(x, 520 + (1 - k) * 600 - (isActive ? 20 : 0));
    ctx.scale(sc * Math.max(0.04, fx), sc);
    boil(ctx, s, 1);
    if (!front) {
      card(ctx, -160, -230, 320, 440, INK.navy, INK.cobalt);
      label(ctx, `0${i + 1}`, 0, 30, 120, {align: 'center', color: INK.yellow, kind: 'mono', weight: 700});
    } else {
      card(ctx, -160, -230, 320, 440, ty.color);
      ctx.save();
      ctx.beginPath();
      ctx.roundRect(-160, -230, 320, 440, 16);
      ctx.clip();
      halftone(ctx, radial(0, -40, 20, 220), {step: 16, angle: 45, color: 'rgba(30,35,66,0.35)', k: 0.6, box: [-160, -230, 320, 440]});
      ctx.restore();
      inked(ctx, rr(-120, -190, 240, 260, 14), INK.white, 5);
      ctx.save();
      ctx.translate(0, -60);
      typeIcon(ctx, i);
      ctx.restore();
      ctx.fillStyle = INK.navy;
      ctx.beginPath();
      ctx.roundRect(-140, 110, 280, 76, 10);
      ctx.fill();
      label(ctx, ty.name, 0, 162, 40, {align: 'center', color: INK.white});
    }
    ctx.restore();
  });
  if (end) {
    headline(ctx, '你是哪一种？', W / 2, 900, 110, s - 113, {align: 'center', shadow: INK.yellow, kind: 'sans'});
  }
};

// ---------- 05 分工 ----------

const C5 = (ctx: Ctx, s: number) => {
  // 全家福相框
  inked(ctx, rr(420, 150, 1080, 700, 20), '#F7EEDB', 10);
  ctx.save();
  ctx.beginPath();
  ctx.roundRect(420, 150, 1080, 700, 20);
  ctx.clip();
  halftone(ctx, radial(960, 500, 100, 700, 0.55), {step: 20, angle: 20, color: INK.yellow, k: 0.65});
  ctx.restore();
  const look = s > 126.4;
  bunny(ctx, 760, 800, 0.95, {face: s > 130.8 ? 'sad' : 'calm', t: s});
  bunny(ctx, 1170, 800, 0.95, {face: 'happy', t: s + 3});
  // 标签
  const tag = (text: string, x: number, y: number, t: number, color: string, rot: number) => {
    if (t < 0) return;
    const k = enter(t, 0.4);
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rot + Math.sin(s * 2 + x) * 0.03);
    ctx.scale(k, k);
    ctx.strokeStyle = INK.navy;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(0, -70);
    ctx.lineTo(0, -40);
    ctx.stroke();
    ctx.font = '900 40px "Noto Sans SC", sans-serif';
    const w = ctx.measureText(text).width + 50;
    ctx.fillStyle = INK.navy;
    ctx.fillRect(-w / 2 + 7, -40 + 7, w, 70);
    inked(ctx, rr(-w / 2, -40, w, 70, 8), color, 5);
    label(ctx, text, 0, 8, 40, {align: 'center', color: INK.navy});
    ctx.restore();
  };
  tag('聪明的孩子', 1170, 250, s - 122.6, INK.yellow, 0.05);
  tag('懂事的那个', 760, 250, s - 123.6, '#D9D0BD', -0.05);
  if (s > 122.8) {
    // 金星贴纸
    const k = enter(s - 122.8, 0.3);
    ctx.save();
    ctx.translate(1320, 430);
    ctx.scale(k, k);
    const p = new Path2D();
    for (let i = 0; i < 10; i++) {
      const r = i % 2 ? 22 : 50;
      const a = (i * Math.PI) / 5 - Math.PI / 2;
      p.lineTo(Math.cos(a) * r, Math.sin(a) * r);
    }
    p.closePath();
    inked(ctx, p, INK.yellow, 5);
    ctx.restore();
  }
  // 你的满分卷子
  if (look) {
    const k = enter(s - 126.4, 0.4);
    ctx.save();
    ctx.translate(560, 640);
    ctx.rotate(-0.12);
    ctx.scale(k, k);
    card(ctx, -90, -110, 180, 220, INK.white);
    label(ctx, '100', 0, 10, 72, {align: 'center', color: INK.red, kind: 'serif'});
    ctx.restore();
    // 家人的目光还是指向那一个
    for (let i = 0; i < 3; i++) {
      const lt = clamp01((s - 127.4 - i * 0.3) / 0.5);
      if (lt <= 0) continue;
      ctx.save();
      ctx.strokeStyle = INK.pink;
      ctx.lineWidth = 8;
      ctx.lineCap = 'round';
      const y0 = 920 + i * 30;
      ctx.beginPath();
      ctx.moveTo(300 + i * 120, y0);
      ctx.quadraticCurveTo(900, 880, lerp(300 + i * 120, 1120, lt), lerp(y0, 640, lt));
      ctx.stroke();
      ctx.restore();
    }
  }
  if (s > 130.8) {
    // 推近“懂事的那个”
    halftone(ctx, edge(360, clamp01((s - 130.8) / 1)), {step: 24, angle: 45, color: INK.navy, k: 0.7});
  }
};

// ---------- 06 新证据 ----------

const C6 = (ctx: Ctx, s: number) => {
  halftone(ctx, radial(960, 520, 100, 800, 0.5), {step: 22, angle: 20, color: '#7FB3A8', k: 0.65});
  // 新的档案袋
  const k = enter(s - 138.2, 0.5);
  ctx.save();
  ctx.translate(560, 520 + (1 - k) * 700);
  ctx.rotate(-0.03);
  inked(ctx, new Path2D('M-300,-260 L-120,-260 L-90,-300 L60,-300 L90,-260 L300,-260 L300,280 L-300,280 Z'), '#E8C873', 7);
  card(ctx, -260, -220, 520, 460, INK.white);
  label(ctx, '新证据', -220, -150, 56, {color: INK.navy});
  label(ctx, '2022 · MIT', -220, -90, 36, {kind: 'mono', weight: 700, color: INK.pink});
  label(ctx, '研究对象：', -220, -20, 32, {});
  label(ctx, '心里觉得自己不配的员工', -220, 30, 32, {color: INK.cobalt});
  ctx.restore();
  stamp(ctx, '有利证据', 760, 330, 64, s - 139.6, {rot: 12, color: INK.cobalt, seed: 31});
  // 右边两项结论
  const row = (y: number, t: number, title: string, mark: string, color: string) => {
    if (t < 0) return;
    const e = enter(t, 0.4);
    ctx.save();
    ctx.translate(1080 + (1 - e) * 700, y);
    card(ctx, 0, -70, 720, 140, INK.white);
    label(ctx, title, 40, 18, 44, {});
    label(ctx, mark, 680, 30, 80, {align: 'right', color, kind: 'mono', weight: 700});
    ctx.restore();
  };
  row(380, s - 142.6, '工作表现：不比别人差', '=', INK.navy);
  row(580, s - 146.2, '和人打交道：更好', '↑', INK.red);
  if (s > 149.8) {
    // 认真倾听的兔子
    bunny(ctx, 1440, 1000, 0.6, {face: 'happy', t: s});
    bubble(ctx, '你说，我听着', 1200, 800, 34, s - 150.3);
  }
  if (s > 154) {
    const t = s - 154;
    ctx.save();
    ctx.fillStyle = `rgba(239,230,210,${clamp01(t / 0.2) * 0.85})`;
    ctx.fillRect(0, 0, W, H);
    ctx.restore();
    halftone(ctx, radial(960, 480, 60, 520), {step: 22, angle: 15, color: INK.yellow, k: 0.72, alpha: clamp01(t / 0.2)});
    headline(ctx, '认真', W / 2, 600, 300, t, {align: 'center', shadow: INK.pink});
  }
};

// ---------- 07 结案 ----------

const C7 = (ctx: Ctx, s: number) => {
  if (s < 168.8) {
    // 拉远：成千上万份一样的案卷
    const t = s - 160;
    const z = lerp(1.6, 1, clamp01(t / 2.4));
    ctx.save();
    ctx.translate(W / 2, H / 2);
    ctx.scale(z, z);
    ctx.translate(-W / 2, -H / 2);
    for (let r = 0; r < 5; r++)
      for (let c = 0; c < 11; c++) {
        const x = 110 + c * 172;
        const y = 250 + r * 140;
        const sh = s > 164.6 ? Math.sin(s * 40 + r * 3 + c) * 3 : 0;
        ctx.save();
        ctx.translate(x + sh, y);
        ctx.rotate((hash(r * 11 + c) - 0.5) * 0.12);
        inked(ctx, rr(-70, -50, 140, 100, 8), '#E8C873', 4);
        figure(ctx, -30, 30, 0.5, (r + c) % 4 === 0 ? INK.pink : INK.cobalt);
        label(ctx, '骗子', 22, 8, 28, {align: 'center', color: INK.red});
        ctx.restore();
      }
    ctx.restore();
    ctx.save();
    ctx.fillStyle = INK.navy;
    ctx.beginPath();
    ctx.roundRect(W / 2 - 400, 40, 800, 90, 14);
    ctx.fill();
    label(ctx, '62 项研究 · 14,161 人', W / 2, 102, 48, {align: 'center', color: INK.yellow});
    ctx.restore();
  } else if (s < 177.4) {
    // 你的那一份重新打开，驳回的证据摆回来
    const t = s - 168.8;
    halftone(ctx, edge(260, 0.7), {step: 22, angle: 30, color: INK.cobalt, k: 0.62, alpha: 0.5});
    inked(ctx, new Path2D('M260,180 L560,180 L600,130 L860,130 L900,180 L1660,180 L1660,900 L260,900 Z'), '#E8C873', 8);
    // 七版方案
    for (let v = 0; v < 7; v++) {
      const lt = t - 2.8 - v * 0.18;
      if (lt < 0) continue;
      const e = enter(lt, 0.3);
      ctx.save();
      ctx.translate(560 + v * 36, 560 - v * 30 + (1 - e) * 400);
      ctx.rotate(-0.1 + v * 0.03);
      card(ctx, -150, -190, 300, 380, INK.white, 'rgba(30,35,66,0.4)');
      label(ctx, `方案 v${v + 1}`, 0, -120, 40, {align: 'center'});
      for (let k = 0; k < 5; k++) inked(ctx, rr(-110, -70 + k * 34, 220 - (k === 4 ? 80 : 0), 10, 5), '#D6CFBF', 0.01);
      ctx.restore();
    }
    sticky(ctx, '改了七版', 1080, 380, -0.06, t - 4.2, INK.yellow, 56);
    // 证物 01–03 回来了
    ['升职通知', '同事的夸奖', '考了第一'].forEach((n, i) => {
      const lt = t - 0.3 - i * 0.3;
      if (lt < 0) return;
      const e = enter(lt, 0.35);
      ctx.save();
      ctx.translate(1300 + i * 120, 660 + i * 40 + (1 - e) * 500);
      ctx.rotate(0.06 * (i - 1));
      card(ctx, -130, -80, 260, 160, INK.white, 'rgba(30,35,66,0.4)');
      label(ctx, n, 0, 14, 36, {align: 'center'});
      ctx.restore();
    });
    stamp(ctx, '采信', 1520, 560, 72, t - 1.6, {rot: -10, color: INK.cobalt, seed: 41});
  } else {
    const t = s - 177.4;
    halftone(ctx, radial(960, 480, 100, 760), {step: 24, angle: 20, color: INK.yellow, k: 0.72});
    stamp(ctx, '结案', 960, 360, 120, t, {rot: -8, seed: 51});
    headline(ctx, '你没有骗任何人。', W / 2, 660, 130, t - 0.4, {align: 'center', shadow: INK.pink, stagger: 0.05});
    label(ctx, ONSCREEN.verdictEn, W / 2, 760, 40, {kind: 'mono', weight: 700, align: 'center', alpha: span(t, 1.0, 1.4)});
    bunny(ctx, 1650, 1080, 0.7, {face: 'happy', t: s});
  }
  dotWipe(ctx, (s - 168.5) / 0.6, INK.cobalt);
  dotWipe(ctx, (s - 177.1) / 0.6, INK.yellow);
};

export const CHAPTERS: Record<string, (ctx: Ctx, s: number) => void> = {C1, C2, C3, C4, C5, C6, C7};

/** 印章和闪光 */
export const CH_IMPACTS: Impact[] = [
  {t: 27.3, power: 0.6, flash: 0},
  {t: 28.1, power: 0.6, flash: 0},
  {t: 28.9, power: 0.6, flash: 0},
  {t: 29.9, power: 1, flash: 0.2},
  {t: 139.6, power: 0.8, flash: 0.2},
  {t: 170.4, power: 0.7, flash: 0},
  {t: 177.4, power: 1, flash: 0.35},
];

/** 音效时间点 */
export const SFX: Sfx[] = [
  {t: 0.0, kind: 'ding'},
  {t: 2.8, kind: 'thud'},
  {t: 4.3, kind: 'whoosh'},
  {t: 4.6, kind: 'chime'},
  {t: 7.2, kind: 'stamp'},
  {t: 9.3, kind: 'whoosh'},
  ...Array.from('冒名顶替综合征').map((_, i) => ({t: 9.6 + i * 0.07, kind: 'pop' as const})),
  {t: 10.6, kind: 'stamp'},
  ...EX.flatMap((e) => [{t: e.t, kind: 'slide' as const}, {t: e.note, kind: 'pop' as const}]),
  {t: 27.3, kind: 'stamp'},
  {t: 28.1, kind: 'stamp'},
  {t: 28.9, kind: 'stamp'},
  {t: 29.9, kind: 'stamp'},
  {t: 38.3, kind: 'slide'},
  ...Array.from({length: 40}, (_, i) => ({t: 39 + i * 0.09, kind: 'type' as const})),
  {t: 43.0, kind: 'pop'},
  {t: 43.35, kind: 'pop'},
  {t: 43.7, kind: 'pop'},
  {t: 46.5, kind: 'whoosh'},
  ...Array.from({length: 9}, (_, i) => ({t: 47.4 + i * 0.12, kind: 'pop' as const})),
  ...Array.from({length: 14}, (_, i) => ({t: 51.6 + i * 0.12, kind: 'tick' as const})),
  {t: 54.5, kind: 'whoosh'},
  {t: 57.6, kind: 'thud'},
  ...NODES.map((n) => ({t: n.at, kind: 'pop' as const})),
  ...Array.from({length: 8}, (_, i) => ({t: 83.8 + i * 0.6, kind: 'tick' as const})),
  ...Array.from({length: 5}, (_, i) => ({t: 92.6 + i * 0.15, kind: 'slide' as const})),
  ...TYPES.map((ty) => ({t: ty.t, kind: 'whoosh' as const})),
  {t: 113, kind: 'chime'},
  {t: 122.6, kind: 'pop'},
  {t: 122.8, kind: 'chime'},
  {t: 123.6, kind: 'pop'},
  {t: 126.4, kind: 'slide'},
  {t: 138.2, kind: 'slide'},
  {t: 139.6, kind: 'stamp'},
  {t: 142.6, kind: 'slide'},
  {t: 146.2, kind: 'slide'},
  {t: 150.3, kind: 'pop'},
  {t: 154, kind: 'chime'},
  {t: 160, kind: 'whoosh'},
  {t: 168.5, kind: 'whoosh'},
  ...Array.from({length: 3}, (_, i) => ({t: 169.1 + i * 0.3, kind: 'slide' as const})),
  {t: 170.4, kind: 'stamp'},
  ...Array.from({length: 7}, (_, i) => ({t: 171.6 + i * 0.18, kind: 'tick' as const})),
  {t: 173.0, kind: 'pop'},
  {t: 177.1, kind: 'whoosh'},
  {t: 177.4, kind: 'stamp'},
  {t: 177.9, kind: 'chime'},
];

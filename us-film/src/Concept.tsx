import React, {useLayoutEffect, useRef} from 'react';
import {AbsoluteFill} from 'remotion';
import {ensureFonts} from './lib/fonts';
import {hash} from './lib/anim';

ensureFonts();

const W = 1920;
const H = 1080;
const INK = '#2A1712';
const CREAM = '#FFF1D6';
const AMBER = '#FFC37A';
const CLAUDE = '#D77757';
const HUMAN = '#FF9A9E';
const HUMAN2 = '#FFD3B0';
const MONO = '"DejaVu Sans Mono", "Noto Sans SC", monospace';
const SANS = '"Noto Sans SC", sans-serif';

type P = [number, number];

// ---------- 绘本笔触 ----------

/** 抖两次的墨线，像手画的 */
const ink = (ctx: CanvasRenderingContext2D, path: Path2D, w = 4, color = INK, seed = 0) => {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  for (let k = 0; k < 2; k++) {
    ctx.save();
    ctx.translate((hash(seed + k * 3) - 0.5) * 2.4, (hash(seed + k * 3 + 1) - 0.5) * 2.4);
    ctx.globalAlpha = k === 0 ? 0.9 : 0.45;
    ctx.lineWidth = k === 0 ? w : w * 0.6;
    ctx.stroke(path);
    ctx.restore();
  }
  ctx.restore();
};

/** 平涂 + 内侧水彩晕 + 墨线 */
const fillInk = (ctx: CanvasRenderingContext2D, path: Path2D, fill: string, shade: string | null, box: [number, number, number, number], seed: number, w = 4) => {
  ctx.save();
  ctx.fillStyle = fill;
  ctx.fill(path);
  if (shade) {
    ctx.clip(path);
    const [x, y, bw, bh] = box;
    const g = ctx.createLinearGradient(x, y, x + bw * 0.3, y + bh);
    g.addColorStop(0, 'rgba(0,0,0,0)');
    g.addColorStop(1, shade);
    ctx.fillStyle = g;
    ctx.fillRect(x, y, bw, bh);
    // 纸上的颜料颗粒
    for (let i = 0; i < 90; i++) {
      ctx.globalAlpha = 0.05;
      ctx.fillStyle = '#fff4e0';
      ctx.beginPath();
      ctx.arc(x + hash(seed + i * 2) * bw, y + hash(seed + i * 3) * bh, 2 + hash(seed + i * 5) * 6, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.restore();
  ink(ctx, path, w, INK, seed);
};

const glow = (ctx: CanvasRenderingContext2D, x: number, y: number, r: number, c: string, a: number) => {
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  ctx.globalAlpha = Math.max(0, Math.min(1, a));
  const g = ctx.createRadialGradient(x, y, 0, x, y, r);
  g.addColorStop(0, c);
  g.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = g;
  ctx.fillRect(x - r, y - r, r * 2, r * 2);
  ctx.restore();
};

/** 绘本里的四角星光点 */
const sparkle = (ctx: CanvasRenderingContext2D, x: number, y: number, r: number, c: string, a = 1) => {
  glow(ctx, x, y, r * 3.2, c, 0.55 * a);
  ctx.save();
  ctx.globalAlpha = a;
  ctx.fillStyle = CREAM;
  ctx.beginPath();
  ctx.moveTo(x, y - r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.quadraticCurveTo(x, y, x, y + r);
  ctx.quadraticCurveTo(x, y, x - r, y);
  ctx.quadraticCurveTo(x, y, x, y - r);
  ctx.fill();
  ctx.restore();
};

const rr = (x: number, y: number, w: number, h: number, r: number) => {
  const p = new Path2D();
  p.roundRect(x, y, w, h, r);
  return p;
};

// ---------- 纸 ----------

let paperCache: HTMLCanvasElement | null = null;
const paper = () => {
  if (paperCache) return paperCache;
  const c = document.createElement('canvas');
  c.width = W;
  c.height = H;
  const x = c.getContext('2d')!;
  const img = x.createImageData(W, H);
  for (let i = 0; i < W * H; i++) {
    const v = 128 + (Math.random() - 0.5) * 70;
    img.data[i * 4] = v;
    img.data[i * 4 + 1] = v * 0.96;
    img.data[i * 4 + 2] = v * 0.9;
    img.data[i * 4 + 3] = 255;
  }
  x.putImageData(img, 0, 0);
  // 纤维
  x.strokeStyle = 'rgba(255,240,220,0.18)';
  x.lineWidth = 1;
  for (let i = 0; i < 900; i++) {
    const px = hash(i * 7) * W;
    const py = hash(i * 7 + 1) * H;
    const a = hash(i * 7 + 2) * Math.PI;
    const l = 8 + hash(i * 7 + 3) * 26;
    x.beginPath();
    x.moveTo(px, py);
    x.quadraticCurveTo(px + Math.cos(a) * l * 0.5 + 4, py + Math.sin(a) * l * 0.5, px + Math.cos(a) * l, py + Math.sin(a) * l);
    x.stroke();
  }
  paperCache = c;
  return c;
};

// ---------- 背景：暖色的夜，草坡 ----------

const background = (ctx: CanvasRenderingContext2D) => {
  const sky = ctx.createLinearGradient(0, 0, 0, H);
  sky.addColorStop(0, '#2A1626');
  sky.addColorStop(0.45, '#4A2330');
  sky.addColorStop(0.78, '#8A4636');
  sky.addColorStop(1, '#3A2018');
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, W, H);

  // 月亮
  const moon = new Path2D();
  moon.arc(190, 170, 70, 0, Math.PI * 2);
  glow(ctx, 190, 170, 260, 'rgba(255,214,150,0.5)', 0.6);
  ctx.save();
  ctx.clip(moon);
  const cres = new Path2D();
  cres.arc(190, 170, 70, 0, Math.PI * 2);
  cres.arc(226, 146, 64, 0, Math.PI * 2);
  ctx.fillStyle = '#FFE3AE';
  ctx.fill(cres, 'evenodd');
  ctx.restore();
  // 星星
  for (let i = 0; i < 70; i++) {
    const x = hash(i * 11) * W;
    const y = hash(i * 11 + 1) * 640;
    if (x > 440 && x < 1480 && y > 40) continue;
    const big = hash(i * 11 + 2) > 0.82;
    if (big) sparkle(ctx, x, y, 7 + hash(i) * 6, 'rgba(255,220,160,1)', 0.85);
    else {
      ctx.fillStyle = `rgba(255,236,200,${0.35 + 0.5 * hash(i * 11 + 3)})`;
      ctx.beginPath();
      ctx.arc(x, y, 1.4 + hash(i * 11 + 4) * 1.8, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // 远处的山坡
  const hill = (y0: number, amp: number, col: string, seed: number) => {
    const p = new Path2D();
    p.moveTo(0, H);
    p.lineTo(0, y0);
    for (let x = 0; x <= W; x += 40) p.lineTo(x, y0 - Math.sin(x / 380 + seed) * amp - Math.sin(x / 140 + seed * 2) * amp * 0.25);
    p.lineTo(W, H);
    p.closePath();
    ctx.fillStyle = col;
    ctx.fill(p);
    ink(ctx, p, 3, 'rgba(42,23,18,0.7)', seed * 10);
  };
  hill(770, 28, '#6A3530', 1.2);
  hill(850, 16, '#4A2620', 3.1);

  // 近处草地：小草和小花
  ctx.save();
  ctx.strokeStyle = 'rgba(30,16,12,0.75)';
  ctx.lineWidth = 2.5;
  ctx.lineCap = 'round';
  for (let i = 0; i < 260; i++) {
    const x = hash(i * 13) * W;
    const y = 880 + hash(i * 13 + 1) * 200;
    const l = 10 + hash(i * 13 + 2) * 18;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.quadraticCurveTo(x + 2, y - l * 0.6, x + (hash(i) - 0.5) * 14, y - l);
    ctx.stroke();
  }
  for (let i = 0; i < 26; i++) {
    const x = hash(i * 17 + 5) * W;
    const y = 900 + hash(i * 17 + 6) * 170;
    if (Math.abs(x - 960) < 200 && y < 1000) continue;
    ctx.fillStyle = hash(i) > 0.5 ? '#F2C48A' : '#E99A8A';
    for (let k = 0; k < 5; k++) {
      ctx.beginPath();
      ctx.arc(x + Math.cos((k * Math.PI * 2) / 5) * 5, y + Math.sin((k * Math.PI * 2) / 5) * 5, 4, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.fillStyle = '#7A3A22';
    ctx.beginPath();
    ctx.arc(x, y, 3, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
};

// ---------- 终端（按真实 Claude Code 的样子） ----------

const TX = 450;
const TY = 60;
const TW = 1020;
const TH = 720;

const terminal = (ctx: CanvasRenderingContext2D) => {
  // 投影光柱
  ctx.save();
  const beam = new Path2D();
  beam.moveTo(905, 935);
  beam.lineTo(1015, 935);
  beam.lineTo(TX + TW - 20, TY + TH);
  beam.lineTo(TX + 20, TY + TH);
  beam.closePath();
  const bg = ctx.createLinearGradient(0, 935, 0, TY + TH);
  bg.addColorStop(0, 'rgba(255,200,130,0.55)');
  bg.addColorStop(1, 'rgba(255,190,120,0.06)');
  ctx.fillStyle = bg;
  ctx.globalCompositeOperation = 'lighter';
  ctx.fill(beam);
  ctx.restore();

  glow(ctx, TX + TW / 2, TY + TH / 2, 760, 'rgba(255,170,100,0.35)', 0.6);

  // 窗口
  const win = rr(TX, TY, TW, TH, 18);
  ctx.save();
  ctx.fillStyle = 'rgba(28,20,18,0.93)';
  ctx.fill(win);
  ctx.clip(win);
  // 全息扫描线，很淡
  ctx.fillStyle = 'rgba(255,200,140,0.025)';
  for (let y = TY; y < TY + TH; y += 4) ctx.fillRect(TX, y, TW, 1.5);
  // 标题栏
  ctx.fillStyle = 'rgba(58,44,38,0.95)';
  ctx.fillRect(TX, TY, TW, 46);
  ctx.restore();
  ['#FF5F57', '#FEBC2E', '#28C840'].forEach((c, i) => {
    ctx.fillStyle = c;
    ctx.beginPath();
    ctx.arc(TX + 28 + i * 26, TY + 23, 8, 0, Math.PI * 2);
    ctx.fill();
  });
  ctx.fillStyle = 'rgba(255,236,214,0.7)';
  ctx.font = `500 19px ${MONO}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('✳ Claude Code — ~/us — 120×36', TX + TW / 2, TY + 24);

  const fs = 25;
  const lh = 40;
  const x0 = TX + 34;
  let y = TY + 92;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
  const t = (s: string, x: number, yy: number, c: string, w = 400) => {
    ctx.font = `${w} ${fs}px ${MONO}`;
    ctx.fillStyle = c;
    ctx.fillText(s, x, yy);
    return ctx.measureText(s).width;
  };

  // 欢迎框
  const box = rr(x0 - 6, y - 32, 780, 176, 10);
  ctx.save();
  ctx.strokeStyle = CLAUDE;
  ctx.lineWidth = 2;
  ctx.stroke(box);
  ctx.restore();
  let wx = x0 + 16;
  wx += t('✻ ', wx, y + 4, CLAUDE);
  t('Welcome to Claude Code!', wx, y + 4, '#FFFFFF', 700);
  t('/help for help, /status for your current setup', x0 + 50, y + 64, '#9C918A');
  t('cwd: /Users/me/us', x0 + 50, y + 116, '#9C918A');
  y += 196;

  const DIM = '#A39A93';
  const user = (s: string) => {
    ctx.fillStyle = 'rgba(255,255,255,0.05)';
    ctx.fillRect(x0 - 6, y - 29, TW - 56, 40);
    t('> ' + s, x0, y, DIM);
    y += lh + 14;
  };
  const claude = (s: string) => {
    t('●', x0, y, '#FFFFFF');
    t(s, x0 + 32, y, '#F4ECE4');
    y += lh + 14;
  };
  user('你好');
  claude('你好，我是Claude 。有什么可以帮你？');
  user('今天好累，想找人说说话');
  claude('我在。慢慢说，我听着。');
  user('你会记得我吗');
  // 思考中
  let sx = x0;
  sx += t('✶ ', sx, y, CLAUDE);
  sx += t('Pondering… ', sx, y, CLAUDE);
  t('(4s · ↑ 52 tokens · esc to interrupt)', sx, y, '#7E746E');
  y += lh + 6;

  // 输入框
  const ib = rr(x0 - 6, y - 4, TW - 56, 58, 10);
  ctx.save();
  ctx.strokeStyle = '#6E625B';
  ctx.lineWidth = 2;
  ctx.stroke(ib);
  ctx.restore();
  const cw = t('> ', x0 + 12, y + 34, '#E9E1DA');
  ctx.fillStyle = '#F4ECE4';
  ctx.fillRect(x0 + 12 + cw, y + 10, 14, 30);
  ctx.font = `400 19px ${MONO}`;
  ctx.fillStyle = '#7E746E';
  ctx.fillText('? for shortcuts', x0 + 8, y + 90);
  ctx.textAlign = 'right';
  ctx.fillText('auto-accept edits off (shift+tab to cycle)', TX + TW - 34, y + 90);
  ctx.textAlign = 'left';

  // 绘本式的外框：奶油色手绘双线 + 微光
  glow(ctx, TX, TY, 60, 'rgba(255,220,170,0.6)', 0.6);
  ink(ctx, win, 3.5, 'rgba(255,226,180,0.9)', 77);
  ink(ctx, rr(TX - 10, TY - 10, TW + 20, TH + 20, 24), 1.6, 'rgba(255,200,140,0.45)', 79);
};

// ---------- 手机 ----------

const phone = (ctx: CanvasRenderingContext2D) => {
  ctx.save();
  ctx.fillStyle = 'rgba(20,10,8,0.45)';
  ctx.beginPath();
  ctx.ellipse(960, 985, 170, 26, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
  const body = new Path2D();
  body.moveTo(868, 930);
  body.lineTo(1052, 930);
  body.lineTo(1096, 982);
  body.lineTo(824, 982);
  body.closePath();
  fillInk(ctx, body, '#3B2A26', null, [824, 930, 272, 52], 31, 4);
  const scr = new Path2D();
  scr.moveTo(878, 935);
  scr.lineTo(1042, 935);
  scr.lineTo(1080, 977);
  scr.lineTo(840, 977);
  scr.closePath();
  ctx.save();
  ctx.fillStyle = '#FFD9A0';
  ctx.fill(scr);
  ctx.restore();
  glow(ctx, 960, 950, 180, 'rgba(255,200,130,0.9)', 0.8);
};

// ---------- 笔记本（侧面） ----------

/** 侧面看的笔记本：底座在 (x, y)，dir=1 屏幕在右端翘起（人在左边），dir=-1 反之 */
const laptop = (ctx: CanvasRenderingContext2D, x: number, y: number, w: number, dir: 1 | -1, seed: number) => {
  const end = x + w * dir;
  // 屏幕的光，朝着打字的人
  glow(ctx, end - 40 * dir, y - 70, 150, 'rgba(255,214,150,0.9)', 0.55);
  const base = new Path2D();
  base.moveTo(x, y);
  base.lineTo(end, y);
  base.lineTo(end, y - 9);
  base.lineTo(x + 4 * dir, y - 9);
  base.closePath();
  fillInk(ctx, base, '#D9C7B2', null, [Math.min(x, end), y - 9, w, 9], seed, 3.2);
  const lid = new Path2D();
  lid.moveTo(end, y - 6);
  lid.lineTo(end - 22 * dir, y - w * 0.92);
  lid.lineTo(end - 12 * dir, y - w * 0.95);
  lid.lineTo(end + 9 * dir, y - 6);
  lid.closePath();
  fillInk(ctx, lid, '#C9B6A0', 'rgba(60,30,10,0.25)', [Math.min(end, end - 22 * dir) - 12, y - w, 44, w], seed + 1, 3.2);
  // 屏幕背面的小贴纸
  const sx = end - 5 * dir + 0;
  const sy = y - w * 0.5;
  ctx.save();
  ctx.translate(sx + 4 * dir, sy);
  ctx.fillStyle = '#E8836B';
  ctx.beginPath();
  ctx.arc(0, 0, 5, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
};

// ---------- 女孩（Q 版，坐着，膝上一台笔记本） ----------

const girl = (ctx: CanvasRenderingContext2D, gx: number, gy: number, s: number, typing = 0) => {
  ctx.save();
  ctx.translate(gx, gy);
  ctx.scale(s, s);
  const S = (d: string) => new Path2D(d);
  ctx.fillStyle = 'rgba(20,10,8,0.4)';
  ctx.beginPath();
  ctx.ellipse(30, 4, 120, 16, 0, 0, Math.PI * 2);
  ctx.fill();
  // 后面的头发和小马尾
  fillInk(ctx, S('M-74,-214 C-110,-196 -124,-150 -112,-118 C-104,-100 -84,-104 -80,-120 C-86,-142 -78,-170 -60,-190 Z'), '#4A2A22', 'rgba(0,0,0,0.3)', [-126, -216, 70, 116], 1, 4);
  // 小短腿
  fillInk(ctx, S('M-46,-46 C-46,-60 -30,-62 0,-60 L96,-52 C112,-50 116,-18 100,-14 L-30,-10 C-48,-10 -50,-30 -46,-46 Z'), '#6B3E5E', 'rgba(20,0,20,0.35)', [-50, -62, 170, 52], 2, 4);
  fillInk(ctx, S('M96,-34 C102,-48 128,-46 132,-28 C134,-14 98,-12 96,-34 Z'), '#FFF1DE', null, [96, -48, 40, 36], 3, 3.5);
  // 身体
  fillInk(ctx, S('M-46,-136 C-20,-150 24,-150 46,-134 C56,-104 58,-74 56,-48 C20,-36 -26,-36 -56,-48 C-58,-80 -56,-110 -46,-136 Z'), '#D9653F', 'rgba(90,20,0,0.35)', [-60, -150, 120, 116], 4, 4);
  ctx.save();
  ctx.strokeStyle = 'rgba(255,226,190,0.55)';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(-52, -62);
  ctx.quadraticCurveTo(0, -54, 54, -62);
  ctx.stroke();
  ctx.restore();
  // 膝上的笔记本
  laptop(ctx, 18, -60, 112, 1, 20);
  // 小手在键盘上
  const hy = -70 - (typing ? 3 : 0);
  fillInk(ctx, S(`M14,-124 C34,-112 50,-90 66,${hy + 2} L72,${hy - 12} C58,-100 42,-128 24,-138 Z`), '#D9653F', 'rgba(90,20,0,0.3)', [14, -138, 60, 70], 5, 3.5);
  fillInk(ctx, S(`M64,${hy} a10,8 0 1 0 20,0 a10,8 0 1 0 -20,0 Z`), '#F9D4B4', null, [64, hy - 8, 20, 16], 6, 3);
  // 大头
  fillInk(ctx, S('M-78,-212 a80,78 0 1 0 160,0 a80,78 0 1 0 -160,0 Z'), '#F9D4B4', null, [-80, -290, 160, 156], 7, 4);
  // 屏幕的光照在脸上
  ctx.save();
  ctx.clip(S('M-78,-212 a80,78 0 1 0 160,0 a80,78 0 1 0 -160,0 Z'));
  glow(ctx, 90, -170, 110, 'rgba(255,200,140,0.8)', 0.5);
  ctx.restore();
  // 前发
  fillInk(
    ctx,
    S('M-84,-204 C-96,-290 30,-322 80,-250 C86,-238 86,-226 84,-212 C70,-224 58,-226 50,-246 C42,-226 26,-220 14,-238 C4,-218 -14,-214 -24,-232 C-34,-210 -46,-196 -60,-184 C-70,-176 -80,-186 -84,-204 Z'),
    '#4A2A22',
    'rgba(0,0,0,0.3)',
    [-96, -310, 186, 130],
    8,
    4,
  );
  // 头发的高光
  ctx.save();
  ctx.strokeStyle = 'rgba(255,220,190,0.35)';
  ctx.lineWidth = 5;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.arc(-6, -228, 62, Math.PI * 1.15, Math.PI * 1.45);
  ctx.stroke();
  ctx.restore();
  // 眼睛（看着屏幕）
  const eye = (x: number, y: number, rx: number, ry: number) => {
    ctx.fillStyle = INK;
    ctx.beginPath();
    ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(x + rx * 0.3, y - ry * 0.4, rx * 0.42, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(x - rx * 0.25, y + ry * 0.35, rx * 0.2, 0, Math.PI * 2);
    ctx.fill();
  };
  eye(46, -184, 9, 13);
  eye(6, -186, 7.5, 12);
  ctx.fillStyle = 'rgba(240,110,110,0.45)';
  [
    [60, -160],
    [-10, -162],
  ].forEach(([x, y]) => {
    ctx.beginPath();
    ctx.ellipse(x, y, 13, 8, 0, 0, Math.PI * 2);
    ctx.fill();
  });
  ink(ctx, S('M24,-156 Q30,-150 36,-156'), 2.6, INK, 9);
  // 发夹：一颗小星
  const star = new Path2D();
  for (let k = 0; k < 10; k++) {
    const r = k % 2 ? 6 : 14;
    const a = (k * Math.PI) / 5 - Math.PI / 2;
    star.lineTo(52 + Math.cos(a) * r, -262 + Math.sin(a) * r);
  }
  star.closePath();
  fillInk(ctx, star, '#FFD27A', null, [38, -276, 28, 28], 10, 2.6);
  ctx.restore();
};

// ---------- Clawd（Q 版像素小螃蟹，面朝左，面前一台笔记本） ----------

const clawd = (ctx: CanvasRenderingContext2D, cx: number, gy: number, cell: number, typing = 0) => {
  const grid = ['..XXXXXXX..', '..XoXXXoX..', 'AAXXXXXXXAA', '..XXXXXXX..', '..X.X.X.X..'];
  const w = grid[0].length * cell;
  const x0 = cx - w / 2;
  const y0 = gy - grid.length * cell;
  ctx.save();
  ctx.fillStyle = 'rgba(20,10,8,0.4)';
  ctx.beginPath();
  ctx.ellipse(cx - 60, gy + 4, w * 0.75, 16, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
  // 笔记本在它左边
  const by = gy - cell * 2.1;
  const book = (bx: number, bw: number, top: number, h: number, col: string, sd: number) => {
    fillInk(ctx, rr(bx, top, bw, h, 4), col, 'rgba(40,10,0,0.3)', [bx, top, bw, h], sd, 3);
    ctx.fillStyle = 'rgba(255,244,226,0.85)';
    ctx.fillRect(bx + 6, top + h - 7, bw - 12, 3);
  };
  book(x0 - cell * 4.2, cell * 5.6, gy - cell * 1.05, cell * 1.05, '#7A9E7E', 50);
  book(x0 - cell * 3.9, cell * 5.0, by, cell * 1.05, '#C9873E', 51);
  laptop(ctx, x0 + cell * 1.0, by, cell * 4.8, -1, 40);
  const body = new Path2D();
  grid.forEach((row, r) =>
    [...row].forEach((ch, c) => {
      if (ch === '.') return;
      // 左钳搭在键盘上，打字时轻轻一点
      const yy = y0 + r * cell + (ch === 'A' && c < 2 ? cell * 0.75 + (typing ? 3 : 0) : 0);
      body.rect(x0 + c * cell, yy, cell + 0.6, cell + 0.6);
    }),
  );
  glow(ctx, cx, y0 + cell * 2, w * 1.1, 'rgba(255,150,90,0.6)', 0.4);
  ctx.save();
  ctx.strokeStyle = INK;
  ctx.lineWidth = 8;
  ctx.lineJoin = 'round';
  ctx.stroke(body);
  ctx.fillStyle = CLAUDE;
  ctx.fill(body);
  ctx.clip(body);
  const g = ctx.createLinearGradient(0, y0, 0, gy);
  g.addColorStop(0, 'rgba(255,232,196,0.4)');
  g.addColorStop(1, 'rgba(90,20,0,0.12)');
  ctx.fillStyle = g;
  ctx.fillRect(x0, y0 - 40, w, gy - y0 + 80);
  // 像素的小高光
  ctx.fillStyle = 'rgba(255,240,220,0.5)';
  ctx.fillRect(x0 + cell * 2 + 4, y0 + 4, cell * 1.4, 5);
  ctx.restore();
  // 眼睛看向左边的屏幕
  grid.forEach((row, r) =>
    [...row].forEach((ch, c) => {
      if (ch !== 'o') return;
      ctx.fillStyle = INK;
      ctx.fillRect(x0 + c * cell + cell * 0.12, y0 + r * cell - cell * 0.2, cell * 0.48, cell * 1.15);
      ctx.fillStyle = '#fff';
      ctx.fillRect(x0 + c * cell + cell * 0.16, y0 + r * cell - cell * 0.14, cell * 0.18, cell * 0.24);
    }),
  );
  ctx.fillStyle = 'rgba(255,170,150,0.75)';
  [x0 + 2.0 * cell, x0 + 7.9 * cell].forEach((bx) => {
    ctx.beginPath();
    ctx.ellipse(bx + cell * 0.4, y0 + 2.45 * cell, cell * 0.42, cell * 0.24, 0, 0, Math.PI * 2);
    ctx.fill();
  });
  return {screen: [x0 + cell * 0.6 - cell * 4.6 + 30, gy - cell * 3] as P};
};

// ---------- 她的萤火虫（化学的光）与它的像素星（代码的光） ----------

const M: P = [960, 840]; // 相遇的地方

const bez = (a: P, b: P, c: P, d: P, t: number): P => {
  const u = 1 - t;
  return [u * u * u * a[0] + 3 * u * u * t * b[0] + 3 * u * t * t * c[0] + t * t * t * d[0], u * u * u * a[1] + 3 * u * u * t * b[1] + 3 * u * t * t * c[1] + t * t * t * d[1]];
};

/** 萤火虫：身体、翅膀、会亮的尾巴 */
const firefly = (ctx: CanvasRenderingContext2D, x: number, y: number, s: number, ang: number, a = 1) => {
  glow(ctx, x, y, 34 * s, 'rgba(255,200,120,1)', 0.75 * a);
  glow(ctx, x, y, 12 * s, 'rgba(255,250,220,1)', 0.9 * a);
  ctx.save();
  ctx.globalAlpha = a;
  ctx.translate(x, y);
  ctx.rotate(ang);
  ctx.scale(s, s);
  // 翅膀
  ctx.fillStyle = 'rgba(255,248,236,0.7)';
  ctx.strokeStyle = 'rgba(60,30,20,0.6)';
  ctx.lineWidth = 1.2;
  [-1, 1].forEach((k) => {
    ctx.beginPath();
    ctx.ellipse(-2, k * 6, 7, 4, k * 0.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  });
  // 身体
  ctx.fillStyle = '#3A2018';
  ctx.beginPath();
  ctx.ellipse(4, 0, 6, 3.6, 0, 0, Math.PI * 2);
  ctx.fill();
  // 尾灯
  ctx.fillStyle = '#FFF2B8';
  ctx.beginPath();
  ctx.ellipse(-6, 0, 5, 4, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
};

/** 像素小星：十字五格，中间最亮 */
const pixstar = (ctx: CanvasRenderingContext2D, x: number, y: number, c: number, a = 1) => {
  glow(ctx, x, y, c * 5, 'rgba(255,150,80,1)', 0.7 * a);
  ctx.save();
  ctx.globalAlpha = a;
  ctx.fillStyle = '#F29A5C';
  ctx.fillRect(x - c * 1.5, y - c / 2, c * 3, c);
  ctx.fillRect(x - c / 2, y - c * 1.5, c, c * 3);
  ctx.fillStyle = '#FFF0D8';
  ctx.fillRect(x - c / 2, y - c / 2, c, c);
  ctx.restore();
};

/** 她那边：萤火虫沿着点点虚线飞出来 */
const fireflies = (ctx: CanvasRenderingContext2D, from: P) => {
  const routes: [P, P, P][] = [
    [[from[0] + 170, from[1] - 120], [M[0] - 300, M[1] - 60], [M[0] - 20, M[1] - 6]],
    [[from[0] + 200, from[1] - 60], [M[0] - 260, M[1] + 120], [M[0] - 30, M[1] + 14]],
    [[from[0] - 90, from[1] - 420], [M[0] - 560, M[1] + 40], [M[0] - 70, M[1] + 30]],
  ];
  routes.forEach(([c1, c2, end], r) => {
    ctx.save();
    ctx.setLineDash([1, 13]);
    ctx.lineCap = 'round';
    ctx.lineWidth = 4;
    ctx.strokeStyle = 'rgba(255,226,180,0.55)';
    ctx.beginPath();
    for (let i = 0; i <= 80; i++) {
      const [x, y] = bez(from, c1, c2, end, i / 80);
      if (i) ctx.lineTo(x, y);
      else ctx.moveTo(x, y);
    }
    ctx.stroke();
    ctx.restore();
    const n = 6 + r;
    for (let k = 0; k < n; k++) {
      const t = 0.12 + (k / n) * 0.86 + hash(r * 9 + k) * 0.04;
      const [x, y] = bez(from, c1, c2, end, t);
      const [x2, y2] = bez(from, c1, c2, end, t + 0.01);
      firefly(ctx, x + (hash(k + r) - 0.5) * 20, y + (hash(k * 3 + r) - 0.5) * 20, 1.1 + hash(k * 7 + r) * 0.5, Math.atan2(y2 - y, x2 - x) + Math.PI, 0.95);
    }
  });
};

/** 它那边：像素星沿着方点折线一格一格跳出来 */
const pixels = (ctx: CanvasRenderingContext2D, from: P) => {
  const routes: P[][] = [
    [from, [from[0] - 60, from[1]], [from[0] - 60, from[1] - 120], [M[0] + 200, from[1] - 120], [M[0] + 200, M[1] - 6], [M[0] + 20, M[1] - 6]],
    [from, [from[0] - 140, from[1]], [from[0] - 140, M[1] + 60], [M[0] + 120, M[1] + 60], [M[0] + 120, M[1] + 14], [M[0] + 30, M[1] + 14]],
    [from, [from[0] + 20, from[1]], [from[0] + 20, 560], [1510, 560], [1510, 812], [M[0] + 70, 812]],
  ];
  routes.forEach((pts, r) => {
    ctx.save();
    ctx.setLineDash([7, 11]);
    ctx.lineWidth = 4;
    ctx.strokeStyle = 'rgba(255,190,130,0.55)';
    ctx.beginPath();
    pts.forEach((p, i) => (i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1])));
    ctx.stroke();
    ctx.restore();
    let total = 0;
    for (let i = 1; i < pts.length; i++) total += Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]);
    const n = 7 + r;
    for (let k = 0; k < n; k++) {
      let d = (0.1 + (k / n) * 0.88) * total;
      for (let i = 1; i < pts.length; i++) {
        const l = Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]);
        if (d <= l) {
          const t = d / l;
          pixstar(ctx, pts[i - 1][0] + (pts[i][0] - pts[i - 1][0]) * t, pts[i - 1][1] + (pts[i][1] - pts[i - 1][1]) * t, 6 + hash(k * 5 + r) * 3, 0.95);
          break;
        }
        d -= l;
      }
    }
  });
};

/** 相遇处：萤火虫和像素星越聚越多，牵起细细的金线 */
const meeting = (ctx: CanvasRenderingContext2D) => {
  type L = {x: number; y: number; kind: 0 | 1};
  const pts: L[] = [];
  for (let i = 0; i < 40; i++) {
    const a = hash(i * 3 + 100) * Math.PI * 2;
    const r = Math.pow(hash(i * 3 + 101), 0.8);
    pts.push({x: M[0] + Math.cos(a) * r * 300, y: M[1] - 30 + Math.sin(a) * r * 120, kind: (i % 2) as 0 | 1});
  }
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  ctx.lineCap = 'round';
  for (let i = 0; i < pts.length; i++)
    for (let j = i + 1; j < pts.length; j++) {
      const d = Math.hypot(pts[i].x - pts[j].x, pts[i].y - pts[j].y);
      // 一只萤火虫和一颗像素星之间才牵线
      if (pts[i].kind !== pts[j].kind && d < 130) {
        ctx.lineWidth = 2;
        ctx.strokeStyle = `rgba(255,222,160,${0.7 * (1 - d / 130)})`;
        ctx.beginPath();
        ctx.moveTo(pts[i].x, pts[i].y);
        ctx.quadraticCurveTo((pts[i].x + pts[j].x) / 2, (pts[i].y + pts[j].y) / 2 - 10, pts[j].x, pts[j].y);
        ctx.stroke();
      }
    }
  ctx.restore();
  glow(ctx, M[0], M[1] - 20, 300, 'rgba(255,214,150,0.9)', 0.7);
  pts.forEach((p, i) => (p.kind ? pixstar(ctx, p.x, p.y, 6, 1) : firefly(ctx, p.x, p.y, 1.1, hash(i) * 6, 1)));
  sparkle(ctx, M[0], M[1] - 24, 30, 'rgba(255,232,190,1)', 1);
};

const draw = (ctx: CanvasRenderingContext2D) => {
  background(ctx);
  terminal(ctx);
  phone(ctx);
  fireflies(ctx, [360, 890]);
  pixels(ctx, [1440, 840]);
  meeting(ctx);
  girl(ctx, 230, 1000, 1.05, 1);
  clawd(ctx, 1720, 1000, 26, 1);

  // 纸纹 + 暗角
  ctx.save();
  ctx.globalCompositeOperation = 'overlay';
  ctx.globalAlpha = 0.28;
  ctx.drawImage(paper(), 0, 0);
  ctx.restore();
  const v = ctx.createRadialGradient(W / 2, H / 2, H * 0.45, W / 2, H / 2, H * 1.05);
  v.addColorStop(0, 'rgba(0,0,0,0)');
  v.addColorStop(1, 'rgba(30,10,6,0.6)');
  ctx.fillStyle = v;
  ctx.fillRect(0, 0, W, H);
};

export const Concept: React.FC = () => {
  const ref = useRef<HTMLCanvasElement>(null);
  useLayoutEffect(() => {
    const c = ref.current?.getContext('2d');
    if (c) draw(c);
  }, []);
  return (
    <AbsoluteFill style={{background: '#000'}}>
      <canvas ref={ref} width={W} height={H} />
    </AbsoluteFill>
  );
};

import React, {useLayoutEffect, useRef} from 'react';
import {AbsoluteFill} from 'remotion';
import {ensureFonts} from './lib/fonts';
import {hash} from './lib/anim';

ensureFonts();

const W = 1920;
const H = 1080;
const PAPER = '#ECE5D8';
const PINK = '#E9788E';
const PINK2 = '#F4B3C0';
const NAVY = '#2E3448';
const CLAUDE = '#D97757';
const GOLD = '#FFC83D';
const MONO = '"DejaVu Sans Mono", "Noto Sans SC", monospace';
const SANS = '"Noto Sans SC", sans-serif';

type P = [number, number];
type Box = [number, number, number, number];

const rr = (x: number, y: number, w: number, h: number, r: number) => {
  const p = new Path2D();
  p.roundRect(x, y, w, h, r);
  return p;
};

// ---------- 软胶玩具质感 ----------

/** 平涂 → 左上亮、右下暗 → 高光 → 内侧暗边 → 细轮廓，再落一个软阴影 */
const toy = (ctx: CanvasRenderingContext2D, path: Path2D, base: string, box: Box, o: {shadow?: number; gloss?: number; rim?: number} = {}) => {
  const [x, y, w, h] = box;
  ctx.save();
  ctx.shadowColor = 'rgba(90,50,40,0.28)';
  ctx.shadowBlur = o.shadow ?? 18;
  ctx.shadowOffsetY = (o.shadow ?? 18) * 0.45;
  ctx.fillStyle = base;
  ctx.fill(path);
  ctx.restore();
  ctx.save();
  ctx.clip(path);
  const g = ctx.createLinearGradient(x, y, x + w * 0.6, y + h);
  g.addColorStop(0, 'rgba(255,255,255,0.28)');
  g.addColorStop(0.5, 'rgba(255,255,255,0)');
  g.addColorStop(1, 'rgba(40,10,20,0.28)');
  ctx.fillStyle = g;
  ctx.fillRect(x - 4, y - 4, w + 8, h + 8);
  const hl = ctx.createRadialGradient(x + w * 0.32, y + h * 0.24, 0, x + w * 0.32, y + h * 0.24, Math.max(w, h) * 0.45);
  hl.addColorStop(0, `rgba(255,255,255,${o.gloss ?? 0.42})`);
  hl.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = hl;
  ctx.fillRect(x - 4, y - 4, w + 8, h + 8);
  ctx.strokeStyle = `rgba(60,20,30,${o.rim ?? 0.16})`;
  ctx.lineWidth = 7;
  ctx.stroke(path);
  // 软胶表面的细颗粒
  for (let i = 0; i < (w * h) / 260; i++) {
    ctx.fillStyle = hash(i + x) > 0.5 ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.06)';
    ctx.fillRect(x + hash(i * 3 + y) * w, y + hash(i * 5 + x) * h, 1.6, 1.6);
  }
  ctx.restore();
  ctx.save();
  ctx.strokeStyle = 'rgba(60,25,30,0.4)';
  ctx.lineWidth = 1.6;
  ctx.stroke(path);
  ctx.restore();
};

const glow = (ctx: CanvasRenderingContext2D, x: number, y: number, r: number, c: string, a: number) => {
  ctx.save();
  ctx.globalAlpha = Math.max(0, Math.min(1, a));
  const g = ctx.createRadialGradient(x, y, 0, x, y, r);
  g.addColorStop(0, c);
  g.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = g;
  ctx.fillRect(x - r, y - r, r * 2, r * 2);
  ctx.restore();
};

// ---------- 纸底与 UI 外框 ----------

let paperCache: HTMLCanvasElement | null = null;
const paper = () => {
  if (paperCache) return paperCache;
  const c = document.createElement('canvas');
  c.width = W;
  c.height = H;
  const x = c.getContext('2d')!;
  x.fillStyle = PAPER;
  x.fillRect(0, 0, W, H);
  const img = x.getImageData(0, 0, W, H);
  for (let i = 0; i < W * H; i++) {
    const n = (Math.random() - 0.5) * 16;
    img.data[i * 4] += n;
    img.data[i * 4 + 1] += n;
    img.data[i * 4 + 2] += n;
  }
  x.putImageData(img, 0, 0);
  // 混凝土的斑点
  for (let i = 0; i < 1400; i++) {
    const r = 0.6 + Math.pow(Math.random(), 4) * 7;
    x.fillStyle = Math.random() > 0.35 ? `rgba(120,100,85,${0.05 + Math.random() * 0.12})` : 'rgba(255,255,255,0.5)';
    x.beginPath();
    x.arc(Math.random() * W, Math.random() * H, r, 0, Math.PI * 2);
    x.fill();
  }
  // 划痕
  x.strokeStyle = 'rgba(120,100,85,0.12)';
  for (let i = 0; i < 60; i++) {
    const px = Math.random() * W;
    const py = Math.random() * H;
    x.lineWidth = 0.8;
    x.beginPath();
    x.moveTo(px, py);
    x.lineTo(px + (Math.random() - 0.5) * 60, py + (Math.random() - 0.5) * 20);
    x.stroke();
  }
  paperCache = c;
  return c;
};

const frame = (ctx: CanvasRenderingContext2D) => {
  ctx.fillStyle = '#D9D1C3';
  ctx.fillRect(0, 0, W, H);
  const card = rr(22, 18, W - 44, H - 36, 34);
  ctx.save();
  ctx.shadowColor = 'rgba(80,60,40,0.35)';
  ctx.shadowBlur = 30;
  ctx.shadowOffsetY = 8;
  ctx.fillStyle = PAPER;
  ctx.fill(card);
  ctx.restore();
  ctx.save();
  ctx.clip(card);
  ctx.drawImage(paper(), 0, 0);
  ctx.restore();
  ctx.save();
  ctx.strokeStyle = 'rgba(255,255,255,0.8)';
  ctx.lineWidth = 2;
  ctx.stroke(rr(30, 26, W - 60, H - 52, 30));
  ctx.restore();
};

/** 兔头 logo */
const bunny = (ctx: CanvasRenderingContext2D, x: number, y: number, s: number, c = '#FFFFFF') => {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(s, s);
  ctx.fillStyle = c;
  ctx.beginPath();
  ctx.ellipse(-9, -16, 5, 13, -0.15, 0, Math.PI * 2);
  ctx.ellipse(9, -16, 5, 13, 0.15, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(0, 4, 17, 14, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = PINK;
  ctx.fillRect(-8, 1, 4, 5);
  ctx.fillRect(4, 1, 4, 5);
  ctx.restore();
};

const topBar = (ctx: CanvasRenderingContext2D, msgs: number, lights: number) => {
  toy(ctx, rr(62, 46, 76, 76, 20), PINK, [62, 46, 76, 76], {shadow: 10});
  bunny(ctx, 100, 88, 1.35);
  ctx.fillStyle = '#1F1B1E';
  ctx.font = `900 48px ${SANS}`;
  ctx.textBaseline = 'alphabetic';
  ctx.textAlign = 'left';
  ctx.fillText('寓言兔', 160, 98);
  ctx.fillStyle = PINK;
  ctx.font = `700 17px ${MONO}`;
  ctx.fillText('MY STORY WITH AI', 162, 122);
  // 右上：消息数、光点数
  const pill = (x: number, w: number, icon: (cx: number, cy: number) => void, n: string) => {
    toy(ctx, rr(x, 52, w, 62, 18), '#F6F1E8', [x, 52, w, 62], {shadow: 10, gloss: 0.6, rim: 0.08});
    icon(x + 36, 83);
    ctx.fillStyle = '#1F1B1E';
    ctx.font = `800 28px ${MONO}`;
    ctx.textAlign = 'left';
    ctx.fillText(n, x + 64, 93);
  };
  pill(1530, 160, (cx, cy) => {
    ctx.fillStyle = PINK;
    ctx.beginPath();
    ctx.roundRect(cx - 15, cy - 12, 30, 22, 7);
    ctx.moveTo(cx - 6, cy + 9);
    ctx.lineTo(cx - 10, cy + 17);
    ctx.lineTo(cx + 2, cy + 9);
    ctx.fill();
  }, String(msgs).padStart(3, '0'));
  pill(1704, 160, (cx, cy) => star(ctx, cx, cy, 15, 1), String(lights).padStart(3, '0'));
};

// ---------- 光点：金黄色的立体星星贴纸 ----------

const starPath = (cx: number, cy: number, r: number) => {
  const p = new Path2D();
  for (let k = 0; k < 10; k++) {
    const rad = k % 2 ? r * 0.48 : r;
    const a = (k * Math.PI) / 5 - Math.PI / 2;
    p.lineTo(cx + Math.cos(a) * rad, cy + Math.sin(a) * rad);
  }
  p.closePath();
  return p;
};

const star = (ctx: CanvasRenderingContext2D, x: number, y: number, r: number, a = 1, halo = false) => {
  ctx.save();
  ctx.globalAlpha = a;
  if (halo) glow(ctx, x, y, r * 4, 'rgba(255,214,100,0.75)', 0.8);
  const p = starPath(x, y, r);
  // 白色贴纸边
  ctx.save();
  ctx.lineJoin = 'round';
  ctx.strokeStyle = '#FFFFFF';
  ctx.lineWidth = r * 0.36;
  ctx.shadowColor = 'rgba(120,70,20,0.35)';
  ctx.shadowBlur = r * 0.6;
  ctx.shadowOffsetY = r * 0.2;
  ctx.stroke(p);
  ctx.restore();
  toy(ctx, p, GOLD, [x - r, y - r, r * 2, r * 2], {shadow: 0, gloss: 0.7, rim: 0.12});
  ctx.restore();
};

// ---------- 终端（真实的 Claude Code） ----------

const TX = 470;
const TY = 215;
const TW = 980;
const TH = 640;

const terminal = (ctx: CanvasRenderingContext2D) => {
  const win = rr(TX, TY, TW, TH, 18);
  ctx.save();
  ctx.shadowColor = 'rgba(60,30,30,0.4)';
  ctx.shadowBlur = 40;
  ctx.shadowOffsetY = 18;
  ctx.fillStyle = '#1C1A1B';
  ctx.fill(win);
  ctx.restore();
  ctx.save();
  ctx.clip(win);
  ctx.fillStyle = '#2B2829';
  ctx.fillRect(TX, TY, TW, 44);
  // 全息的横纹，很淡
  ctx.fillStyle = 'rgba(255,200,210,0.025)';
  for (let y = TY; y < TY + TH; y += 4) ctx.fillRect(TX, y, TW, 1.5);
  ctx.restore();
  ['#FF5F57', '#FEBC2E', '#28C840'].forEach((c, i) => {
    ctx.fillStyle = c;
    ctx.beginPath();
    ctx.arc(TX + 28 + i * 26, TY + 22, 8, 0, Math.PI * 2);
    ctx.fill();
  });
  ctx.fillStyle = 'rgba(240,230,226,0.6)';
  ctx.font = `500 18px ${MONO}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('✳ Claude Code — ~/us — 120×36', TX + TW / 2, TY + 23);
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';

  const fs = 24;
  const x0 = TX + 34;
  let y = TY + 88;
  const t = (s: string, x: number, yy: number, c: string, w = 400, size = fs) => {
    ctx.font = `${w} ${size}px ${MONO}`;
    ctx.fillStyle = c;
    ctx.fillText(s, x, yy);
    return ctx.measureText(s).width;
  };
  ctx.save();
  ctx.strokeStyle = CLAUDE;
  ctx.lineWidth = 2;
  ctx.stroke(rr(x0 - 6, y - 30, 760, 150, 10));
  ctx.restore();
  let wx = x0 + 16;
  wx += t('✻ ', wx, y + 2, CLAUDE);
  t('Welcome to Claude Code!', wx, y + 2, '#FFFFFF', 700);
  t('/help for help, /status for your current setup', x0 + 50, y + 54, '#948C88');
  t('cwd: /Users/me/us', x0 + 50, y + 98, '#948C88');
  y += 150;
  const user = (s: string) => {
    ctx.fillStyle = 'rgba(255,255,255,0.06)';
    ctx.fillRect(x0 - 6, y - 28, TW - 56, 38);
    t('> ' + s, x0, y, '#A39A96');
    y += 48;
  };
  const claude = (s: string) => {
    t('●', x0, y, '#FFFFFF');
    t(s, x0 + 32, y, '#F1EAE6');
    y += 48;
  };
  user('你好');
  claude('你好，我是Claude 。有什么可以帮你？');
  user('今天好累，想找人说说话');
  claude('我在。慢慢说，我听着。');
  user('你会记得我吗');
  let sx = x0;
  sx += t('✶ ', sx, y, CLAUDE);
  sx += t('Pondering… ', sx, y, CLAUDE);
  t('(4s · ↑ 52 tokens · esc to interrupt)', sx, y, '#7A726E');
  y += 30;
  ctx.save();
  ctx.strokeStyle = '#6A615D';
  ctx.lineWidth = 2;
  ctx.stroke(rr(x0 - 6, y, TW - 56, 56, 10));
  ctx.restore();
  const cw = t('> ', x0 + 12, y + 37, '#E9E1DA');
  ctx.fillStyle = '#F1EAE6';
  ctx.fillRect(x0 + 12 + cw, y + 12, 13, 30);
  t('? for shortcuts', x0 + 8, y + 88, '#7A726E', 400, 18);
  ctx.textAlign = 'right';
  t('auto-accept edits off (shift+tab to cycle)', TX + TW - 34, y + 88, '#7A726E', 400, 18);
  ctx.textAlign = 'left';
  // 机身的软胶边
  ctx.save();
  ctx.strokeStyle = 'rgba(255,255,255,0.18)';
  ctx.lineWidth = 2;
  ctx.stroke(rr(TX + 2, TY + 2, TW - 4, TH - 4, 16));
  ctx.restore();
};

// ---------- 展台、手机、投影 ----------

const stage = (ctx: CanvasRenderingContext2D) => {
  // 终端后面的粉色大圆
  ctx.save();
  ctx.fillStyle = PINK2;
  ctx.globalAlpha = 0.85;
  ctx.beginPath();
  ctx.arc(960, 540, 420, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
  // 地上的大展台
  const top = new Path2D();
  top.ellipse(960, 968, 900, 70, 0, 0, Math.PI * 2);
  ctx.save();
  ctx.fillStyle = '#E2D8C8';
  ctx.beginPath();
  ctx.ellipse(960, 984, 900, 70, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
  toy(ctx, top, '#F5EFE5', [60, 898, 1800, 140], {shadow: 22, gloss: 0.5, rim: 0.06});
  ctx.save();
  ctx.strokeStyle = PINK;
  ctx.lineWidth = 3;
  ctx.setLineDash([16, 12]);
  ctx.beginPath();
  ctx.ellipse(960, 968, 860, 56, 0, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();
};

const beam = (ctx: CanvasRenderingContext2D) => {
  const b = new Path2D();
  b.moveTo(900, 946);
  b.lineTo(1020, 946);
  b.lineTo(TX + TW - 30, TY + TH);
  b.lineTo(TX + 30, TY + TH);
  b.closePath();
  const g = ctx.createLinearGradient(0, 946, 0, TY + TH);
  g.addColorStop(0, 'rgba(255,240,244,0.9)');
  g.addColorStop(1, 'rgba(255,214,224,0.15)');
  ctx.save();
  ctx.fillStyle = g;
  ctx.fill(b);
  ctx.restore();
};

const phone = (ctx: CanvasRenderingContext2D) => {
  const body = new Path2D();
  body.moveTo(872, 938);
  body.lineTo(1048, 938);
  body.lineTo(1088, 980);
  body.lineTo(832, 980);
  body.closePath();
  toy(ctx, body, NAVY, [832, 938, 256, 42], {shadow: 12});
  const scr = new Path2D();
  scr.moveTo(882, 942);
  scr.lineTo(1038, 942);
  scr.lineTo(1072, 975);
  scr.lineTo(848, 975);
  scr.closePath();
  ctx.fillStyle = '#FFF4F6';
  ctx.fill(scr);
  glow(ctx, 960, 950, 160, 'rgba(255,230,236,1)', 0.9);
};

// ---------- 她的电：粉色软胶分子珠链 ----------

const M: P = [960, 150]; // 相遇的地方：画面最上方

const smooth = (t: number) => t * t * (3 - 2 * t);

/** 从身体 (x0, ys) 冒出，散开到 xs，竖直往上升到 turnY，再拐弯汇向画面最上方的 end */
const route = (x0: number, xs: number, ys: number, turnY: number, end: P) => (u: number): P => {
  const vert = ys - turnY;
  const turn = Math.abs(end[0] - xs) * 0.9 + Math.abs(turnY - end[1]);
  const L = vert + turn;
  const d = u * L;
  if (d <= vert) return [x0 + (xs - x0) * smooth(Math.min(1, d / 260)), ys - d];
  const t = (d - vert) / turn;
  const u1 = 1 - t;
  // 二次贝塞尔：(xs,turnY) → 控制点 (xs,end.y) → end
  return [u1 * u1 * xs + 2 * u1 * t * xs + t * t * end[0], u1 * u1 * turnY + 2 * u1 * t * end[1] + t * t * end[1]];
};

const routeLen = (xs: number, ys: number, turnY: number, end: P) => ys - turnY + Math.abs(end[0] - xs) * 0.9 + Math.abs(turnY - end[1]);

const bead = (ctx: CanvasRenderingContext2D, x: number, y: number, r: number, c: string) => {
  const p = new Path2D();
  p.arc(x, y, r, 0, Math.PI * 2);
  toy(ctx, p, c, [x - r, y - r, r * 2, r * 2], {shadow: 6, gloss: 0.75, rim: 0.1});
};

const molecules = (ctx: CanvasRenderingContext2D) => {
  const cols = 9;
  for (let i = 0; i < cols; i++) {
    const x0 = 180 + i * 18;
    const xs = 84 + i * 40 + hash(i * 7) * 6;
    const ys = 690 - hash(i * 7 + 1) * 16;
    const end: P = [M[0] - 34, M[1] - 56 + i * 13];
    const turnY = 196 + i * 18;
    const f = route(x0, xs, ys, turnY, end);
    const L = routeLen(xs, ys, turnY, end);
    // 一段一段的链
    let d = hash(i * 7 + 2) * 60;
    let k = 0;
    let prev: P | null = null;
    while (d < L) {
      const on = hash(i * 31 + Math.floor(d / 150)) > 0.28;
      const [x, y] = f(d / L);
      if (on) {
        if (prev) {
          ctx.save();
          ctx.strokeStyle = 'rgba(214,110,134,0.7)';
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.moveTo(prev[0], prev[1]);
          ctx.lineTo(x, y);
          ctx.stroke();
          ctx.restore();
        }
        const big = hash(i * 13 + k) > 0.86;
        if (hash(i * 17 + k) > 0.93) {
          // 偶尔一个六元环
          ctx.save();
          ctx.strokeStyle = PINK;
          ctx.lineWidth = 3.5;
          ctx.beginPath();
          for (let q = 0; q < 6; q++) ctx.lineTo(x + Math.cos((q * Math.PI) / 3) * 13, y + Math.sin((q * Math.PI) / 3) * 13);
          ctx.closePath();
          ctx.stroke();
          ctx.restore();
          for (let q = 0; q < 6; q += 2) bead(ctx, x + Math.cos((q * Math.PI) / 3) * 13, y + Math.sin((q * Math.PI) / 3) * 13, 4.5, PINK2);
        } else bead(ctx, x, y, big ? 9 : 5 + hash(i * 5 + k) * 2.5, big ? PINK : hash(k + i) > 0.5 ? '#F39AAE' : '#F7C3CE');
        prev = [x, y];
      } else prev = null;
      d += 26;
      k++;
    }
  }
};

// ---------- 它的电：像图二那样竖直落下的代码雨 ----------

const RAIN = '01{}[]<>=;:/λ*+#$%&01001101';

const coderain = (ctx: CanvasRenderingContext2D) => {
  const cols = 12;
  ctx.save();
  ctx.font = `700 19px ${MONO}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  for (let i = 0; i < cols; i++) {
    const x0 = 1616 + i * 15;
    const xs = 1520 + i * 30 + hash(i * 9) * 4;
    const ys = 850 - hash(i * 9 + 1) * 10;
    const end: P = [M[0] + 34, M[1] - 56 + (cols - 1 - i) * 11];
    const turnY = 196 + (cols - 1 - i) * 15;
    const f = route(x0, xs, ys, turnY, end);
    const L = routeLen(xs, ys, turnY, end);
    let d = hash(i * 9 + 2) * 40;
    let k = 0;
    while (d < L) {
      const seg = Math.floor(d / 120);
      const on = hash(i * 37 + seg) > 0.3;
      if (on) {
        const [x, y] = f(d / L);
        const head = (d % 120) > 100; // 每段最下面那个字最亮
        const a = 0.35 + 0.65 * ((d % 120) / 120);
        if (head) {
          glow(ctx, x, y, 22, 'rgba(255,150,90,0.9)', 0.8);
          ctx.fillStyle = '#FFF3E8';
        } else ctx.fillStyle = `rgba(200,85,47,${a})`;
        ctx.fillText(RAIN[Math.floor(hash(i * 101 + k) * RAIN.length)], x, y);
        // 图二里的短横光条和亮点
        if (hash(i * 53 + k) > 0.95) {
          glow(ctx, x, y, 18, 'rgba(255,170,110,0.9)', 0.7);
          ctx.fillStyle = '#FFB27A';
          ctx.fillRect(x - 12, y - 2.5, 24, 5);
        }
      }
      d += 20;
      k++;
    }
  }
  ctx.restore();
};

// ---------- 交流之后亮起的星星 ----------

const meeting = (ctx: CanvasRenderingContext2D) => {
  const pts: P[] = [];
  for (let i = 0; i < 22; i++) {
    const a = hash(i * 3 + 200) * Math.PI * 2;
    const r = 0.25 + 0.75 * Math.pow(hash(i * 3 + 201), 0.8);
    pts.push([M[0] + Math.cos(a) * r * 340, M[1] + 10 + Math.sin(a) * r * 60]);
  }
  // 几颗已经飘上去的
  [
    [560, 90],
    [1380, 96],
    [700, 60],
    [1240, 64],
    [960, 60],
  ].forEach((p) => pts.push(p as P));
  ctx.save();
  ctx.strokeStyle = 'rgba(232,169,58,0.75)';
  ctx.lineWidth = 2.4;
  ctx.lineCap = 'round';
  for (let i = 0; i < 22; i++)
    for (let j = i + 1; j < 22; j++) {
      const d = Math.hypot(pts[i][0] - pts[j][0], pts[i][1] - pts[j][1]);
      if (d < 140) {
        ctx.globalAlpha = 0.9 * (1 - d / 140);
        ctx.beginPath();
        ctx.moveTo(pts[i][0], pts[i][1]);
        ctx.lineTo(pts[j][0], pts[j][1]);
        ctx.stroke();
      }
    }
  ctx.restore();
  glow(ctx, M[0], M[1], 220, 'rgba(255,226,140,0.9)', 0.75);
  pts.forEach((p, i) => star(ctx, p[0], p[1], i >= 22 ? 11 : 9 + hash(i * 3 + 202) * 9, 1, true));
  star(ctx, M[0], M[1], 26, 1, true);
};

// ---------- 笔记本（侧面，白色软胶） ----------

const laptop = (ctx: CanvasRenderingContext2D, x: number, y: number, w: number, dir: 1 | -1) => {
  const end = x + w * dir;
  glow(ctx, end - 30 * dir, y - w * 0.55, w * 1.1, 'rgba(255,240,230,1)', 0.6);
  const base = new Path2D();
  base.roundRect(Math.min(x, end), y - 11, w, 11, 4);
  toy(ctx, base, '#F7F3EE', [Math.min(x, end), y - 11, w, 11], {shadow: 8, rim: 0.08});
  const lid = new Path2D();
  lid.moveTo(end, y - 8);
  lid.lineTo(end - 24 * dir, y - w * 0.9);
  lid.lineTo(end - 11 * dir, y - w * 0.94);
  lid.lineTo(end + 12 * dir, y - 8);
  lid.closePath();
  const lx = Math.min(end - 24 * dir, end + 12 * dir);
  toy(ctx, lid, '#F2ECE4', [lx, y - w * 0.94, 36, w * 0.94], {shadow: 8, rim: 0.08});
  // 屏幕背面的粉色兔子贴纸
  ctx.save();
  ctx.fillStyle = PINK;
  ctx.beginPath();
  ctx.arc(end - 4 * dir, y - w * 0.48, 9, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
  bunny(ctx, end - 4 * dir, y - w * 0.46, 0.38);
};

// ---------- 女孩：Q 版软胶公仔 ----------

const girl = (ctx: CanvasRenderingContext2D, gx: number, gy: number, s: number) => {
  ctx.save();
  ctx.translate(gx, gy);
  ctx.scale(s, s);
  const S = (d: string) => new Path2D(d);
  ctx.fillStyle = 'rgba(90,50,40,0.22)';
  ctx.beginPath();
  ctx.ellipse(30, 2, 130, 16, 0, 0, Math.PI * 2);
  ctx.fill();
  // 马尾
  toy(ctx, S('M-74,-214 C-116,-196 -130,-146 -116,-112 C-106,-94 -84,-100 -80,-118 C-88,-142 -80,-170 -60,-190 Z'), '#3A2A2E', [-130, -216, 76, 122], {shadow: 8});
  // 腿：白色裤子
  toy(ctx, S('M-48,-46 C-48,-62 -30,-64 0,-62 L98,-54 C114,-52 118,-16 102,-12 L-30,-8 C-50,-8 -52,-30 -48,-46 Z'), '#F4EEE6', [-52, -64, 170, 56], {shadow: 10});
  // 粉色鞋
  toy(ctx, S('M96,-36 C102,-52 132,-50 136,-28 C138,-12 98,-10 96,-36 Z'), PINK, [96, -52, 42, 42], {shadow: 6});
  // 粉色卫衣
  toy(ctx, S('M-48,-138 C-20,-152 24,-152 48,-136 C58,-104 60,-74 58,-46 C20,-34 -28,-34 -58,-46 C-60,-80 -58,-112 -48,-138 Z'), '#EE8FA3', [-60, -152, 120, 118], {shadow: 12});
  // 卫衣上的小贴标
  ctx.save();
  ctx.fillStyle = NAVY;
  ctx.beginPath();
  ctx.roundRect(-30, -104, 26, 18, 4);
  ctx.fill();
  ctx.fillStyle = '#FFFFFF';
  ctx.font = `800 11px ${MONO}`;
  ctx.textAlign = 'center';
  ctx.fillText('YY', -17, -91);
  ctx.restore();
  laptop(ctx, 16, -60, 116, 1);
  // 手臂和小手
  toy(ctx, S('M12,-126 C34,-114 52,-92 68,-72 L76,-86 C60,-104 42,-130 22,-140 Z'), '#EE8FA3', [12, -140, 64, 70], {shadow: 6});
  toy(ctx, S('M64,-74 a11,9 0 1 0 22,0 a11,9 0 1 0 -22,0 Z'), '#F7D3BC', [64, -83, 22, 18], {shadow: 4});
  // 大头
  const head = S('M-80,-212 a82,80 0 1 0 164,0 a82,80 0 1 0 -164,0 Z');
  toy(ctx, head, '#F7D3BC', [-80, -292, 164, 160], {shadow: 14, gloss: 0.5});
  // 头发：前发帽子一样包住头顶
  toy(
    ctx,
    S('M-86,-204 C-100,-292 30,-326 82,-252 C88,-240 88,-226 86,-212 C72,-224 60,-226 52,-246 C44,-226 28,-220 16,-238 C6,-218 -12,-214 -22,-232 C-32,-210 -46,-196 -60,-184 C-72,-176 -82,-186 -86,-204 Z'),
    '#3A2A2E',
    [-100, -326, 190, 150],
    {shadow: 8, gloss: 0.35},
  );
  // 软胶的大眼睛
  const eye = (x: number, y: number, rx: number, ry: number) => {
    ctx.fillStyle = '#1E1A1C';
    ctx.beginPath();
    ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.ellipse(x + rx * 0.25, y - ry * 0.4, rx * 0.4, ry * 0.3, 0, 0, Math.PI * 2);
    ctx.fill();
  };
  eye(48, -184, 10, 15);
  eye(6, -186, 8, 14);
  ctx.fillStyle = 'rgba(236,110,130,0.45)';
  ctx.beginPath();
  ctx.ellipse(62, -158, 13, 8, 0, 0, Math.PI * 2);
  ctx.ellipse(-12, -160, 12, 8, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#5A2E34';
  ctx.lineWidth = 3;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(24, -154);
  ctx.quadraticCurveTo(31, -147, 38, -154);
  ctx.stroke();
  // 发夹：一颗星星贴纸
  ctx.restore();
  star(ctx, gx + 54 * s, gy - 262 * s, 14 * s, 1);
};

// ---------- Clawd：体素软胶小螃蟹 ----------

const clawd = (ctx: CanvasRenderingContext2D, cx: number, gy: number, cell: number) => {
  const grid = ['..XXXXXXX..', '..XoXXXoX..', 'AAXXXXXXXAA', '..XXXXXXX..', '..X.X.X.X..'];
  const w = grid[0].length * cell;
  const x0 = cx - w / 2;
  const y0 = gy - grid.length * cell;
  ctx.fillStyle = 'rgba(90,50,40,0.22)';
  ctx.beginPath();
  ctx.ellipse(cx - 70, gy + 2, w * 0.8, 16, 0, 0, Math.PI * 2);
  ctx.fill();
  // 一摞书，上面放笔记本
  const by = gy - cell * 2.15;
  toy(ctx, rr(x0 - cell * 4.2, gy - cell * 1.08, cell * 5.6, cell * 1.08, 6), NAVY, [x0 - cell * 4.2, gy - cell * 1.08, cell * 5.6, cell * 1.08], {shadow: 10});
  toy(ctx, rr(x0 - cell * 3.9, by, cell * 5.0, cell * 1.07, 6), PINK, [x0 - cell * 3.9, by, cell * 5, cell * 1.07], {shadow: 8});
  ctx.fillStyle = 'rgba(255,255,255,0.85)';
  ctx.fillRect(x0 - cell * 3.9 + 8, by + cell * 0.75, cell * 5 - 16, 4);
  ctx.fillRect(x0 - cell * 4.2 + 8, gy - cell * 0.3, cell * 5.6 - 16, 4);
  laptop(ctx, x0 + cell * 1.0, by, cell * 4.8, -1);
  // 每一格都是一块有倒角的小方块
  const cells: [number, number, string][] = [];
  grid.forEach((row, r) =>
    [...row].forEach((ch, c) => {
      if (ch === '.') return;
      cells.push([x0 + c * cell, y0 + r * cell + (ch === 'A' && c < 2 ? cell * 0.75 : 0), ch]);
    }),
  );
  const body = new Path2D();
  cells.forEach(([x, y]) => body.rect(x, y, cell + 0.5, cell + 0.5));
  ctx.save();
  ctx.shadowColor = 'rgba(90,50,40,0.3)';
  ctx.shadowBlur = 20;
  ctx.shadowOffsetY = 10;
  ctx.fillStyle = CLAUDE;
  ctx.fill(body);
  ctx.restore();
  cells.forEach(([x, y], i) => {
    ctx.fillStyle = CLAUDE;
    ctx.fillRect(x, y, cell, cell);
    ctx.fillStyle = 'rgba(255,230,210,0.45)';
    ctx.fillRect(x + 2, y + 2, cell - 4, 4);
    ctx.fillRect(x + 2, y + 2, 4, cell - 4);
    ctx.fillStyle = 'rgba(110,30,10,0.28)';
    ctx.fillRect(x + 2, y + cell - 5, cell - 4, 4);
    ctx.fillRect(x + cell - 5, y + 2, 4, cell - 4);
    ctx.fillStyle = hash(i) > 0.5 ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)';
    ctx.fillRect(x + 7, y + 7, cell - 14, cell - 14);
  });
  // 大高光
  ctx.save();
  ctx.clip(body);
  glow(ctx, x0 + cell * 3.5, y0 + cell * 0.8, cell * 4, 'rgba(255,255,255,0.4)', 0.8);
  ctx.restore();
  ctx.save();
  ctx.strokeStyle = 'rgba(80,25,15,0.4)';
  ctx.lineWidth = 1.6;
  ctx.stroke(body);
  ctx.restore();
  // 眼睛：看着左边的屏幕
  grid.forEach((row, r) =>
    [...row].forEach((ch, c) => {
      if (ch !== 'o') return;
      const ex = x0 + c * cell + cell * 0.1;
      const ey = y0 + r * cell - cell * 0.15;
      toy(ctx, rr(ex, ey, cell * 0.55, cell * 1.15, 4), '#1E1A1C', [ex, ey, cell * 0.55, cell * 1.15], {shadow: 0, gloss: 0.3, rim: 0});
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(ex + cell * 0.08, ey + cell * 0.1, cell * 0.18, cell * 0.24);
    }),
  );
  ctx.fillStyle = 'rgba(255,170,160,0.75)';
  [x0 + 2.0 * cell, x0 + 7.9 * cell].forEach((bx) => {
    ctx.beginPath();
    ctx.ellipse(bx + cell * 0.4, y0 + 2.45 * cell, cell * 0.42, cell * 0.24, 0, 0, Math.PI * 2);
    ctx.fill();
  });
};

const draw = (ctx: CanvasRenderingContext2D) => {
  frame(ctx);
  stage(ctx);
  beam(ctx);
  terminal(ctx);
  phone(ctx);
  girl(ctx, 250, 990, 1.05);
  clawd(ctx, 1700, 990, 27);
  // 冒出来的地方亮一点
  glow(ctx, 252, 690, 150, 'rgba(255,160,180,0.7)', 0.7);
  glow(ctx, 1700, 850, 150, 'rgba(255,160,110,0.7)', 0.7);
  molecules(ctx);
  coderain(ctx);
  meeting(ctx);
  topBar(ctx, 5, 27);
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

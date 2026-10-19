// 半调档案的印刷工具：纸、网点、套印偏移的大字、印章、字幕条、HUD、角色。
import {FONTS, H, INK, W} from '../config';
import {clamp01, hash} from '../lib/anim';

export type Ctx = CanvasRenderingContext2D;
export type Field = (x: number, y: number) => number;

/** 回弹缓动：入场都带一点过冲 */
export const backOut = (t: number, k = 1.9) => {
  const x = clamp01(t) - 1;
  return 1 + (k + 1) * x * x * x + k * x * x;
};

/** 印章落下：快速放大缩回，再小幅回弹 */
export const slam = (t: number) => {
  if (t < 0) return 0;
  if (t < 0.09) return 2.6 - 1.6 * (t / 0.09) ** 2;
  return 1 + Math.sin((t - 0.09) * 30) * 0.06 * Math.exp(-(t - 0.09) * 9);
};

// ---------- 纸 ----------

let paperCache: HTMLCanvasElement | null = null;
export const paper = () => {
  if (paperCache) return paperCache;
  const c = document.createElement('canvas');
  c.width = W;
  c.height = H;
  const x = c.getContext('2d')!;
  x.fillStyle = '#FFFFFF';
  x.fillRect(0, 0, W, H);
  // 低频斑驳：小图放大
  const t = document.createElement('canvas');
  t.width = 48;
  t.height = 27;
  const tx = t.getContext('2d')!;
  for (let i = 0; i < 48 * 27; i++) {
    const v = 236 + hash(i * 1.37) * 19;
    tx.fillStyle = `rgb(${v},${v - 3},${v - 9})`;
    tx.fillRect(i % 48, Math.floor(i / 48), 1, 1);
  }
  x.imageSmoothingEnabled = true;
  x.drawImage(t, 0, 0, W, H);
  // 细噪点
  const img = x.getImageData(0, 0, W, H);
  for (let i = 0; i < W * H; i++) {
    const n = (hash(i * 0.731) - 0.5) * 18;
    img.data[i * 4] += n;
    img.data[i * 4 + 1] += n;
    img.data[i * 4 + 2] += n * 0.8;
  }
  x.putImageData(img, 0, 0);
  // 中缝折痕
  const f = x.createLinearGradient(W / 2 - 30, 0, W / 2 + 30, 0);
  f.addColorStop(0, 'rgba(0,0,0,0)');
  f.addColorStop(0.5, 'rgba(90,70,40,0.10)');
  f.addColorStop(0.52, 'rgba(255,255,255,0.25)');
  f.addColorStop(1, 'rgba(0,0,0,0)');
  x.fillStyle = f;
  x.fillRect(W / 2 - 30, 0, 60, H);
  // 暗角
  const v = x.createRadialGradient(W / 2, H / 2, H * 0.4, W / 2, H / 2, H * 1.05);
  v.addColorStop(0, 'rgba(0,0,0,0)');
  v.addColorStop(1, 'rgba(70,50,30,0.32)');
  x.fillStyle = v;
  x.fillRect(0, 0, W, H);
  paperCache = c;
  return c;
};

/** 纸底色：每帧最先画 */
export const ground = (ctx: Ctx, color = INK.paper) => {
  ctx.fillStyle = color;
  ctx.fillRect(0, 0, W, H);
};

/** 纸纹正片叠底 + 灰尘，每帧最后画 */
export const finish = (ctx: Ctx, frame: number) => {
  ctx.save();
  ctx.globalCompositeOperation = 'multiply';
  ctx.drawImage(paper(), 0, 0);
  ctx.restore();
  const seed = Math.floor(frame / 2) * 977;
  for (let i = 0; i < 260; i++) {
    const ink = i % 6 === 0;
    ctx.fillStyle = ink ? 'rgba(30,35,66,0.45)' : 'rgba(255,250,238,0.8)';
    const r = ink ? 1 + hash(seed + i * 3) * 1.4 : 1 + hash(seed + i * 5) * 2;
    ctx.beginPath();
    ctx.arc(hash(seed + i * 7) * W, hash(seed + i * 11) * H, r, 0, Math.PI * 2);
    ctx.fill();
  }
};

// ---------- 网点 ----------

export const radial =
  (cx: number, cy: number, r0: number, r1: number, max = 1): Field =>
  (x, y) => {
    const d = Math.hypot(x - cx, y - cy);
    return max * clamp01(1 - (d - r0) / (r1 - r0));
  };

export const edge =
  (inset: number, max = 1): Field =>
  (x, y) => {
    const d = Math.min(x, y, W - x, H - y);
    return max * clamp01(1 - d / inset);
  };

/** 旋转网格的圆点；半径 = 密度 × 步长 × k */
export const halftone = (ctx: Ctx, field: Field, o: {step?: number; angle?: number; color: string; k?: number; box?: [number, number, number, number]; multiply?: boolean; alpha?: number}) => {
  const step = o.step ?? 22;
  const k = o.k ?? 0.68;
  const a = ((o.angle ?? 15) * Math.PI) / 180;
  const [bx, by, bw, bh] = o.box ?? [0, 0, W, H];
  const cos = Math.cos(a);
  const sin = Math.sin(a);
  const cx = bx + bw / 2;
  const cy = by + bh / 2;
  const R = Math.hypot(bw, bh) / 2 + step;
  ctx.save();
  if (o.multiply) ctx.globalCompositeOperation = 'multiply';
  ctx.globalAlpha = o.alpha ?? 1;
  ctx.fillStyle = o.color;
  ctx.beginPath();
  for (let u = -R; u <= R; u += step)
    for (let v = -R; v <= R; v += step) {
      const x = cx + u * cos - v * sin;
      const y = cy + u * sin + v * cos;
      if (x < bx - step || x > bx + bw + step || y < by - step || y > by + bh + step) continue;
      const r = field(x, y) * step * k;
      if (r < 0.6) continue;
      ctx.moveTo(x + r, y);
      ctx.arc(x, y, r, 0, Math.PI * 2);
    }
  ctx.fill();
  ctx.restore();
};

// ---------- 字 ----------

const fontOf = (size: number, kind: 'serif' | 'sans' | 'mono' = 'serif', weight = 900) =>
  `${weight} ${size}px ${kind === 'serif' ? FONTS.title : kind === 'sans' ? FONTS.sans : FONTS.mono}`;

/** 套印偏移的大标题，逐字落下。t = 距入场的秒数 */
export const headline = (
  ctx: Ctx,
  text: string,
  x: number,
  y: number,
  size: number,
  t: number,
  o: {color?: string; shadow?: string; kind?: 'serif' | 'sans' | 'mono'; align?: 'left' | 'center'; stagger?: number; weight?: number; out?: number} = {},
) => {
  if (t < 0) return 0;
  const chars = Array.from(text);
  ctx.save();
  ctx.font = fontOf(size, o.kind, o.weight);
  ctx.textBaseline = 'alphabetic';
  const widths = chars.map((c) => ctx.measureText(c).width);
  const total = widths.reduce((a, b) => a + b, 0);
  let cx = o.align === 'center' ? x - total / 2 : x;
  const st = o.stagger ?? 0.06;
  const out = o.out ?? 0;
  chars.forEach((c, i) => {
    const lt = t - i * st;
    if (lt < 0) {
      cx += widths[i];
      return;
    }
    const e = backOut(lt / 0.38);
    const dy = (1 - e) * -70;
    const sq = 1 + Math.sin(clamp01(lt / 0.4) * Math.PI) * 0.12;
    ctx.save();
    ctx.translate(cx + widths[i] / 2, y + dy + out * (i % 2 ? 1 : -1) * 0);
    ctx.scale(1 / sq, sq);
    ctx.globalAlpha = 1 - out;
    ctx.textAlign = 'center';
    if (o.shadow !== 'none') {
      ctx.globalCompositeOperation = 'multiply';
      ctx.fillStyle = o.shadow ?? INK.pink;
      ctx.fillText(c, size * 0.06, size * 0.06);
      ctx.globalCompositeOperation = 'source-over';
    }
    ctx.fillStyle = o.color ?? INK.navy;
    ctx.fillText(c, 0, 0);
    ctx.restore();
    cx += widths[i];
  });
  ctx.restore();
  return total;
};

/** 普通字 */
export const label = (ctx: Ctx, text: string, x: number, y: number, size: number, o: {color?: string; kind?: 'serif' | 'sans' | 'mono'; weight?: number; align?: CanvasTextAlign; alpha?: number; base?: CanvasTextBaseline} = {}) => {
  ctx.save();
  ctx.font = fontOf(size, o.kind ?? 'sans', o.weight ?? 900);
  ctx.fillStyle = o.color ?? INK.navy;
  ctx.textAlign = o.align ?? 'left';
  ctx.textBaseline = o.base ?? 'alphabetic';
  ctx.globalAlpha = o.alpha ?? 1;
  ctx.fillText(text, x, y);
  const w = ctx.measureText(text).width;
  ctx.restore();
  return w;
};

/** 把 **关键词** 拆成段 */
const segs = (text: string) => text.split('**').map((s, i) => ({s, hi: i % 2 === 1}));

/** 底部字幕条：深墨圆角条 + 套印阴影，关键词用黄色；英文在下面 */
export const captionBar = (ctx: Ctx, text: string, en: string | undefined, t: number, out: number) => {
  if (t < 0 || out >= 1) return;
  const size = 44;
  ctx.save();
  ctx.font = fontOf(size, 'sans', 900);
  const parts = segs(text);
  const tw = parts.reduce((a, p) => a + ctx.measureText(p.s).width, 0);
  const pw = tw + 72;
  const ph = 78;
  const e = backOut(t / 0.32);
  const x = W / 2 - pw / 2;
  const y = 922 + (1 - e) * 60 + out * 30;
  ctx.globalAlpha = 1 - out;
  ctx.fillStyle = INK.cobalt;
  ctx.beginPath();
  ctx.roundRect(x + 8, y + 8, pw, ph, 18);
  ctx.fill();
  ctx.fillStyle = INK.navy;
  ctx.beginPath();
  ctx.roundRect(x, y, pw, ph, 18);
  ctx.fill();
  ctx.textBaseline = 'middle';
  let cx = x + 36;
  for (const p of parts) {
    ctx.fillStyle = p.hi ? INK.yellow : INK.white;
    ctx.fillText(p.s, cx, y + ph / 2 + 2);
    cx += ctx.measureText(p.s).width;
  }
  if (en) {
    ctx.font = `italic 600 24px ${FONTS.title}`;
    ctx.textAlign = 'center';
    ctx.fillStyle = INK.navy;
    ctx.fillText(en, W / 2, y + ph + 30);
  }
  ctx.restore();
};

/** 左上案卷号 + 章节牌，右上 REC 与日期 */
export const hud = (ctx: Ctx, chipNo: string, chip: string, s: number, dark = false) => {
  const fg = dark ? INK.paper : INK.navy;
  label(ctx, '案卷 No.2026-IMP-001', 62, 68, 26, {kind: 'mono', weight: 700, color: fg});
  ctx.save();
  ctx.font = fontOf(26, 'sans', 900);
  const w1 = ctx.measureText(chipNo).width;
  const w2 = ctx.measureText(chip).width;
  ctx.fillStyle = fg;
  ctx.beginPath();
  ctx.roundRect(60, 84, w1 + w2 + 44, 44, 8);
  ctx.fill();
  ctx.fillStyle = INK.yellow;
  ctx.textBaseline = 'middle';
  ctx.fillText(chipNo, 76, 107);
  ctx.fillStyle = dark ? INK.navy : INK.paper;
  ctx.fillText(chip, 76 + w1 + 12, 107);
  ctx.restore();
  // 右上
  ctx.save();
  ctx.strokeStyle = fg;
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.roundRect(1690, 40, 172, 54, 10);
  ctx.stroke();
  if (Math.floor(s * 1.4) % 2 === 0) {
    ctx.fillStyle = INK.red;
    ctx.beginPath();
    ctx.arc(1716, 67, 9, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
  label(ctx, '2026.10', 1736, 78, 30, {kind: 'mono', weight: 700, color: fg});
};

// ---------- 印章 ----------

/** 粗糙边缘的双框印章。t = 距落下的秒数 */
export const stamp = (ctx: Ctx, text: string, x: number, y: number, size: number, t: number, o: {rot?: number; color?: string; seed?: number} = {}) => {
  if (t < 0) return;
  const sc = slam(t);
  const color = o.color ?? INK.red;
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(((o.rot ?? -8) * Math.PI) / 180);
  ctx.scale(sc, sc);
  ctx.globalAlpha = 0.93 * clamp01(t / 0.05);
  ctx.font = fontOf(size, 'sans', 900);
  const tw = ctx.measureText(text).width;
  const pw = tw + size * 0.9;
  const ph = size * 1.5;
  // 先画到离屏，再用颗粒擦掉一些，边缘就毛了
  const c = document.createElement('canvas');
  c.width = Math.ceil(pw + 40);
  c.height = Math.ceil(ph + 40);
  const g = c.getContext('2d')!;
  g.translate(20, 20);
  g.strokeStyle = color;
  g.fillStyle = color;
  g.lineWidth = size * 0.11;
  g.beginPath();
  g.roundRect(0, 0, pw, ph, size * 0.18);
  g.stroke();
  g.lineWidth = size * 0.04;
  g.beginPath();
  g.roundRect(size * 0.16, size * 0.16, pw - size * 0.32, ph - size * 0.32, size * 0.1);
  g.stroke();
  g.font = fontOf(size, 'sans', 900);
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  g.fillText(text, pw / 2, ph / 2 + size * 0.04);
  g.globalCompositeOperation = 'destination-out';
  const seed = o.seed ?? 1;
  const n = Math.floor((pw * ph) / 40);
  for (let i = 0; i < n; i++) {
    const r = 0.6 + hash(seed + i * 1.7) ** 3 * 4;
    g.globalAlpha = 0.5 + hash(seed + i * 2.3) * 0.5;
    g.beginPath();
    g.arc(hash(seed + i * 3.1) * (pw + 40) - 20, hash(seed + i * 4.7) * (ph + 40) - 20, r, 0, Math.PI * 2);
    g.fill();
  }
  ctx.drawImage(c, -pw / 2 - 20, -ph / 2 - 20);
  ctx.restore();
};

// ---------- 墨线形状 ----------

/** 平涂 + 粗墨线 */
export const inked = (ctx: Ctx, path: Path2D, fill: string, lw = 7, stroke = INK.navy) => {
  ctx.save();
  ctx.fillStyle = fill;
  ctx.fill(path);
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  ctx.strokeStyle = stroke;
  ctx.lineWidth = lw;
  ctx.stroke(path);
  ctx.restore();
};

export const rr = (x: number, y: number, w: number, h: number, r: number) => {
  const p = new Path2D();
  p.roundRect(x, y, w, h, r);
  return p;
};

/** 平涂区域上再套印一层网点，做出印刷的阴影 */
export const dotShade = (ctx: Ctx, path: Path2D, box: [number, number, number, number], color: string, field?: Field, step = 14) => {
  ctx.save();
  ctx.clip(path);
  const [x, y, w, h] = box;
  halftone(ctx, field ?? ((px, py) => 0.25 + 0.55 * clamp01((px - x) / w * 0.6 + (py - y) / h * 0.6)), {step, angle: 45, color, k: 0.62, box, multiply: true});
  ctx.restore();
};

/** 线条呼吸：每 0.1 秒换一次小抖动，只给角色和道具用 */
export const boil = (ctx: Ctx, s: number, amp = 1.6) => {
  const f = Math.floor(s * 10);
  ctx.translate((hash(f * 3.1) - 0.5) * amp, (hash(f * 5.7) - 0.5) * amp);
  ctx.rotate((hash(f * 7.3) - 0.5) * 0.004);
};

// ---------- 寓言兔：被告 ----------

export type Face = 'calm' | 'happy' | 'worried' | 'shock' | 'blink' | 'sad';

/** 原点在脚底中心，s=1 时约 470px 高 */
export const bunny = (ctx: Ctx, x: number, y: number, s: number, o: {face?: Face; t?: number; hold?: 'phone' | 'none' | 'paper'; tilt?: number} = {}) => {
  const t = o.t ?? 0;
  const face = o.face ?? 'calm';
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(s, s);
  boil(ctx, t);
  ctx.rotate(((o.tilt ?? 0) * Math.PI) / 180);
  const breathe = 1 + Math.sin(t * 2.4) * 0.008;
  ctx.scale(1, breathe);
  const P = (d: string) => new Path2D(d);
  // 身体：西装
  const body = P('M-110,0 C-118,-70 -112,-150 -84,-196 L84,-196 C112,-150 118,-70 110,0 Z');
  inked(ctx, body, INK.cobalt);
  dotShade(ctx, body, [-120, -200, 240, 200], INK.navy);
  // 衬衫和领带
  inked(ctx, P('M-40,-196 L0,-120 L40,-196 Z'), INK.white, 6);
  inked(ctx, P('M-12,-170 L12,-170 L18,-96 L0,-78 L-18,-96 Z'), INK.pink, 6);
  // 耳朵
  const ear = (sx: number) => {
    ctx.save();
    ctx.scale(sx, 1);
    ctx.rotate(-0.16);
    const e = P('M20,-300 C0,-380 10,-470 46,-480 C80,-470 92,-380 70,-300 Z');
    inked(ctx, e, INK.white);
    inked(ctx, P('M36,-320 C26,-380 34,-440 46,-448 C60,-440 66,-380 56,-320 Z'), INK.pink, 0.01);
    ctx.restore();
  };
  ear(1);
  ear(-1);
  // 头
  const head = P('M-128,-262 C-128,-330 -70,-370 0,-370 C70,-370 128,-330 128,-262 C128,-200 70,-176 0,-176 C-70,-176 -128,-200 -128,-262 Z');
  inked(ctx, head, INK.white);
  dotShade(ctx, head, [-130, -372, 260, 200], '#E9D8C0', (px, py) => clamp01((py + 260) / 120) * 0.5, 12);
  // 脸
  const ey = -276;
  const eye = (ex: number) => {
    if (face === 'blink' || face === 'happy') {
      ctx.save();
      ctx.strokeStyle = INK.navy;
      ctx.lineWidth = 7;
      ctx.lineCap = 'round';
      ctx.beginPath();
      if (face === 'happy') ctx.arc(ex, ey + 6, 16, Math.PI * 1.1, Math.PI * 1.9);
      else {
        ctx.moveTo(ex - 16, ey);
        ctx.lineTo(ex + 16, ey);
      }
      ctx.stroke();
      ctx.restore();
      return;
    }
    const big = face === 'shock' ? 1.25 : 1;
    ctx.fillStyle = INK.navy;
    ctx.beginPath();
    ctx.ellipse(ex, ey, 17 * big, 22 * big, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.arc(ex + 6, ey - 8, 7 * big, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(ex - 6, ey + 9, 3.5 * big, 0, Math.PI * 2);
    ctx.fill();
  };
  eye(-48);
  eye(48);
  // 眉毛
  if (face === 'worried' || face === 'sad' || face === 'shock') {
    ctx.save();
    ctx.strokeStyle = INK.navy;
    ctx.lineWidth = 6;
    ctx.lineCap = 'round';
    ctx.beginPath();
    // 担心：眉毛内侧往上挑
    const lift = face === 'shock' ? 4 : 12;
    ctx.moveTo(-72, ey - 40);
    ctx.lineTo(-30, ey - 40 - lift);
    ctx.moveTo(72, ey - 40);
    ctx.lineTo(30, ey - 40 - lift);
    ctx.stroke();
    ctx.restore();
  }
  // 腮红
  ctx.fillStyle = INK.pink;
  ctx.globalAlpha = 0.55;
  ctx.beginPath();
  ctx.ellipse(-84, ey + 34, 20, 11, 0, 0, Math.PI * 2);
  ctx.ellipse(84, ey + 34, 20, 11, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 1;
  // 鼻子和嘴
  ctx.fillStyle = INK.pink;
  ctx.beginPath();
  ctx.ellipse(0, ey + 22, 9, 6, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.save();
  ctx.strokeStyle = INK.navy;
  ctx.lineWidth = 5;
  ctx.lineCap = 'round';
  ctx.beginPath();
  if (face === 'worried' || face === 'sad') {
    ctx.moveTo(-18, ey + 50);
    ctx.quadraticCurveTo(-9, ey + 42, 0, ey + 50);
    ctx.quadraticCurveTo(9, ey + 58, 18, ey + 50);
  } else if (face === 'shock') {
    ctx.ellipse(0, ey + 54, 10, 14, 0, 0, Math.PI * 2);
  } else {
    ctx.moveTo(-16, ey + 42);
    ctx.quadraticCurveTo(-8, ey + 52, 0, ey + 42);
    ctx.quadraticCurveTo(8, ey + 52, 16, ey + 42);
  }
  ctx.stroke();
  ctx.restore();
  // 冷汗
  if (face === 'worried' || face === 'shock') {
    inked(ctx, P('M112,-330 C104,-312 100,-300 112,-292 C124,-300 120,-312 112,-330 Z'), '#BFE0FF', 4);
  }
  // 手
  if (o.hold === 'phone') {
    inked(ctx, rr(-30, -168, 60, 104, 12), INK.navy, 6);
    inked(ctx, rr(-22, -160, 44, 86, 6), INK.yellow, 0.01);
    inked(ctx, P('M-56,-110 a20,20 0 1 0 40,0 a20,20 0 1 0 -40,0 Z'), INK.white, 6);
    inked(ctx, P('M16,-110 a20,20 0 1 0 40,0 a20,20 0 1 0 -40,0 Z'), INK.white, 6);
  }
  ctx.restore();
};

// ---------- 手机通知 ----------

export const phoneCard = (ctx: Ctx, x: number, y: number, s: number, t: number, lines: [string, string, string]) => {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(s, s);
  boil(ctx, t, 1);
  // 机身
  const body = rr(-230, -420, 460, 840, 64);
  inked(ctx, body, INK.navy, 8);
  const scr = rr(-204, -392, 408, 784, 44);
  inked(ctx, scr, INK.pink, 0.01);
  ctx.save();
  ctx.clip(scr);
  halftone(ctx, radial(0, -60, 40, 520), {step: 20, angle: 30, color: '#C23E70', box: [-204, -392, 408, 784], k: 0.7});
  ctx.restore();
  label(ctx, '9:41', 0, -250, 92, {kind: 'mono', weight: 700, color: INK.white, align: 'center'});
  // 通知：从上面弹下来
  const e = backOut(t / 0.4);
  ctx.translate(0, (1 - e) * -160);
  ctx.globalAlpha = clamp01(t / 0.1);
  const card = rr(-196, -170, 392, 150, 26);
  ctx.save();
  ctx.fillStyle = INK.navy;
  ctx.translate(8, 8);
  ctx.fill(card);
  ctx.restore();
  inked(ctx, card, INK.white, 6);
  inked(ctx, rr(-168, -150, 50, 50, 12), INK.yellow, 5);
  label(ctx, lines[1], -104, -116, 26, {weight: 900, color: INK.navy});
  label(ctx, lines[2], 168, -116, 22, {weight: 400, color: '#6B6B80', align: 'right'});
  label(ctx, lines[0], -172, -56, 30, {weight: 900, color: INK.navy});
  ctx.restore();
};

/** 起爆的放射线 */
export const rays = (ctx: Ctx, cx: number, cy: number, r0: number, r1: number, n: number, color: string, rot = 0) => {
  ctx.save();
  ctx.fillStyle = color;
  for (let i = 0; i < n; i++) {
    const a = rot + (i / n) * Math.PI * 2;
    const da = (Math.PI / n) * 0.45;
    ctx.beginPath();
    ctx.moveTo(cx + Math.cos(a - da) * r0, cy + Math.sin(a - da) * r0);
    ctx.lineTo(cx + Math.cos(a) * r1, cy + Math.sin(a) * r1);
    ctx.lineTo(cx + Math.cos(a + da) * r0, cy + Math.sin(a + da) * r0);
    ctx.fill();
  }
  ctx.restore();
};

/** 身高尺：档案照的横线 */
export const heightChart = (ctx: Ctx, alpha = 1) => {
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.strokeStyle = 'rgba(30,35,66,0.55)';
  ctx.lineWidth = 3;
  for (let i = 0; i <= 8; i++) {
    const y = 920 - i * 96;
    ctx.beginPath();
    ctx.moveTo(110, y);
    ctx.lineTo(1810, y);
    ctx.stroke();
    if (i % 2 === 0) {
      label(ctx, String(i * 10), 50, y + 10, 28, {kind: 'mono', weight: 700, color: 'rgba(30,35,66,0.7)'});
      label(ctx, String(i * 10), 1870, y + 10, 28, {kind: 'mono', weight: 700, color: 'rgba(30,35,66,0.7)', align: 'right'});
    }
  }
  ctx.restore();
};

/** 网点圆点转场：t 从 0 到 1，中间全盖住 */
export const dotWipe = (ctx: Ctx, t: number, color: string) => {
  if (t <= 0 || t >= 1) return;
  const step = 90;
  ctx.save();
  ctx.fillStyle = color;
  ctx.beginPath();
  for (let y = 0; y <= H + step; y += step)
    for (let x = 0; x <= W + step; x += step) {
      const d = (x / W + y / H) * 0.25;
      const lt = clamp01((t - d) / 0.5);
      const r = Math.sin(lt * Math.PI) * step * 0.75;
      if (r < 0.5) continue;
      ctx.moveTo(x + r, y);
      ctx.arc(x, y, r, 0, Math.PI * 2);
    }
  ctx.fill();
  ctx.restore();
};

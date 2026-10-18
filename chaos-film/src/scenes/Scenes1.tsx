import React from 'react';
import {FONTS, H, ONSCREEN, PALETTE as P, W} from '../config';
import {clamp01, easeInOut, easeOut, hash, lerp, span, win} from '../lib/anim';
import {SP} from '../components/Kit';
import {Canvas} from '../components/Canvas';
import {N, textCloud} from '../lib/clouds';
import {Cam3, P3, drawPoints, lerp3, scatter, sphere} from '../lib/points';
import {attractor, trajectory} from '../lib/lorenz';
import {bg, dust, glowDot, glowLine, streaks} from './draw';

const SERIF = '"Noto Serif SC", serif';
const SANS = '"Noto Sans SC", sans-serif';

export const text = (ctx: CanvasRenderingContext2D, s: string, x: number, y: number, o: {size: number; color: string; weight?: number; font?: string; align?: CanvasTextAlign; alpha?: number; glow?: number; spacing?: number}) => {
  ctx.save();
  ctx.font = `${o.weight ?? 600} ${o.size}px ${o.font ?? SERIF}`;
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

/** 洛伦兹吸引子点云（x 横、z 竖，正面看就是一对翅膀） */
export const wings = (() => {
  let c: P3[] | null = null;
  return () => {
    if (!c) c = attractor(24000).map((p) => ({x: p.x * 17, y: -p.z * 17, z: p.y * 17}));
    return c;
  };
})();

/* ---------------- 齿轮（S3、S5 共用） ---------------- */
export const gear = (ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number, teeth: number, rot: number, color: string, alpha = 1, broken = 0) => {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(rot);
  ctx.globalAlpha = alpha;
  ctx.strokeStyle = color;
  ctx.lineWidth = 3;
  ctx.shadowColor = color;
  ctx.shadowBlur = 14;
  ctx.beginPath();
  for (let i = 0; i < teeth; i++) {
    const a0 = (i / teeth) * Math.PI * 2;
    const a1 = a0 + (Math.PI * 2) / teeth;
    const fly = broken * (40 + hash(i) * 260);
    const ox = Math.cos(a0 + 0.1) * fly;
    const oy = Math.sin(a0 + 0.1) * fly + broken * broken * 300 * hash(i + 3);
    const pts: [number, number][] = [
      [Math.cos(a0) * r, Math.sin(a0) * r],
      [Math.cos(a0 + (a1 - a0) * 0.2) * (r + 18), Math.sin(a0 + (a1 - a0) * 0.2) * (r + 18)],
      [Math.cos(a0 + (a1 - a0) * 0.5) * (r + 18), Math.sin(a0 + (a1 - a0) * 0.5) * (r + 18)],
      [Math.cos(a0 + (a1 - a0) * 0.7) * r, Math.sin(a0 + (a1 - a0) * 0.7) * r],
      [Math.cos(a1) * r, Math.sin(a1) * r],
    ];
    pts.forEach(([x, y], k) => (k === 0 && (i === 0 || broken > 0) ? ctx.moveTo(x + ox, y + oy) : ctx.lineTo(x + ox, y + oy)));
  }
  if (broken === 0) ctx.closePath();
  ctx.stroke();
  if (broken < 0.3) {
    ctx.globalAlpha = alpha * (1 - broken * 3);
    ctx.beginPath();
    ctx.arc(0, 0, r * 0.62, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(0, 0, r * 0.16, 0, Math.PI * 2);
    ctx.stroke();
    for (let k = 0; k < 6; k++) {
      const a = (k / 6) * Math.PI * 2;
      ctx.beginPath();
      ctx.moveTo(Math.cos(a) * r * 0.16, Math.sin(a) * r * 0.16);
      ctx.lineTo(Math.cos(a) * r * 0.62, Math.sin(a) * r * 0.62);
      ctx.stroke();
    }
  }
  ctx.restore();
};

export const GEARS = [
  {x: 960, y: 470, r: 230, teeth: 36, dir: 1},
  {x: 1300, y: 300, r: 120, teeth: 19, dir: -1},
  {x: 1340, y: 640, r: 140, teeth: 22, dir: -1},
  {x: 600, y: 300, r: 110, teeth: 17, dir: -1},
  {x: 570, y: 680, r: 150, teeth: 24, dir: -1},
];
export const drawGears = (ctx: CanvasRenderingContext2D, t: number, alpha: number, broken = 0, frozen = false) => {
  GEARS.forEach((g, i) => {
    const rot = frozen ? 0.3 * i : (t * 0.5 * g.dir * 36) / g.teeth;
    gear(ctx, g.x, g.y, g.r, g.teeth, rot, i === 0 ? P.ember : P.gold, alpha, broken * (0.7 + 0.3 * hash(i)));
  });
};

/* ================= S1 开头 ================= */
export const S1: React.FC<SP> = ({s}) => {
  const draw = (ctx: CanvasRenderingContext2D, t: number) => {
    bg(ctx);
    const a = win(t, -1, 3.7, 0.1, 0.4);
    const b = win(t, 3.3, 9.6, 0.3, 0.4);
    const c = span(t, 9.3, 9.8);
    if (a > 0) {
      ctx.save();
      ctx.globalAlpha = a;
      const storm = span(t, 1.85, 2.4);
      // 乌云
      if (storm > 0) {
        const cloud = sphere(2600, 300, 3).map((p) => ({x: p.x * 3.2, y: p.y * 0.4, z: p.z}));
        drawPoints(ctx, cloud, {yaw: t * 0.05, pitch: 0, cx: W / 2, cy: 120, scale: 1}, {color: '#8C8070', size: 7, alpha: 0.5 * storm, t});
        streaks(ctx, t, Math.round(420 * storm));
        if (t > 2.55 && t < 2.8) {
          ctx.strokeStyle = '#FFF6E0';
          ctx.lineWidth = 5;
          ctx.shadowColor = '#FFF6E0';
          ctx.shadowBlur = 30;
          ctx.beginPath();
          let x = 1380;
          let y = 120;
          ctx.moveTo(x, y);
          for (let i = 0; i < 9; i++) {
            x += (hash(i) - 0.5) * 120;
            y += 70;
            ctx.lineTo(x, y);
          }
          ctx.stroke();
          ctx.shadowBlur = 0;
        }
      }
      // 天气卡片
      const shake = storm > 0 && storm < 1 ? (hash(Math.floor(t * 30)) - 0.5) * 30 : 0;
      ctx.translate(shake, 0);
      ctx.fillStyle = 'rgba(30,32,40,0.75)';
      ctx.strokeStyle = 'rgba(232,194,122,0.5)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.roundRect(W / 2 - 360, 260, 720, 440, 36);
      ctx.fill();
      ctx.stroke();
      text(ctx, '天气预报', W / 2 - 290, 320, {size: 30, color: P.dim, align: 'left', font: SANS, weight: 400});
      text(ctx, '明天', W / 2 - 290, 380, {size: 40, color: P.text, align: 'left'});
      if (storm < 0.5) {
        const sx = W / 2 - 110;
        const sy = 520;
        glowDot(ctx, sx, sy, 200, P.ember, 0.7);
        ctx.fillStyle = P.ember;
        ctx.beginPath();
        ctx.arc(sx, sy, 64, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = P.ember;
        ctx.lineWidth = 8;
        ctx.lineCap = 'round';
        for (let k = 0; k < 12; k++) {
          const ang = (k / 12) * Math.PI * 2 + t * 0.6;
          ctx.beginPath();
          ctx.moveTo(sx + Math.cos(ang) * 90, sy + Math.sin(ang) * 90);
          ctx.lineTo(sx + Math.cos(ang) * 120, sy + Math.sin(ang) * 120);
          ctx.stroke();
        }
        text(ctx, '晴 26°', W / 2 + 160, 520, {size: 96, color: P.text, weight: 900});
      } else {
        text(ctx, '暴雨', W / 2 + 60, 520, {size: 150, color: P.red, weight: 900, glow: 30});
      }
      ctx.restore();
    }
    if (b > 0) {
      ctx.save();
      ctx.globalAlpha = b;
      // 机房：两侧向远处延伸的机柜，指示灯成片闪烁
      const vx = W / 2;
      const vy = 470;
      const push = lerp(0, 0.18, span(t, 3.3, 9.6));
      for (const side of [-1, 1]) {
        for (let k = 0; k < 7; k++) {
          const d0 = Math.pow((k + push * 7) / 7.5, 1.6);
          const d1 = Math.pow((k + 0.82 + push * 7) / 7.5, 1.6);
          const x0 = vx + side * lerp(40, 980, d0);
          const x1 = vx + side * lerp(40, 980, d1);
          const h0 = lerp(30, 760, d0);
          const h1 = lerp(30, 760, d1);
          ctx.fillStyle = `rgba(20,22,30,${0.9})`;
          ctx.beginPath();
          ctx.moveTo(x0, vy - h0 * 0.55);
          ctx.lineTo(x1, vy - h1 * 0.55);
          ctx.lineTo(x1, vy + h1 * 0.45);
          ctx.lineTo(x0, vy + h0 * 0.45);
          ctx.closePath();
          ctx.fill();
          ctx.strokeStyle = 'rgba(232,194,122,0.25)';
          ctx.stroke();
          for (let r = 0; r < 14; r++) {
            for (let q = 0; q < 4; q++) {
              const u = (q + 0.5) / 4;
              const v = (r + 0.5) / 14;
              const x = lerp(x0, x1, u);
              const hh = lerp(h0, h1, u);
              const y = vy - hh * 0.55 + v * hh;
              const on = hash(k * 131 + r * 7 + q + side * 999 + Math.floor(t * 8 + hash(r + k) * 8)) > 0.45;
              if (on) glowDot(ctx, x, y, lerp(3, 14, (d0 + d1) / 2), hash(r * 3 + q) > 0.85 ? P.red : P.gold, 0.8);
            }
          }
        }
      }
      // 两周的预报条
      const days = 14;
      for (let d = 0; d < days + 4; d++) {
        const x = W / 2 - 680 + d * 76;
        const sure = d < 10 ? 1 : d < days ? 1 - (d - 9) / 6 : 0.08;
        const appear = span(t, 5.6 + d * 0.06, 6.0 + d * 0.06);
        ctx.globalAlpha = b * appear;
        ctx.fillStyle = `rgba(232,194,122,${0.12 + 0.5 * sure})`;
        ctx.fillRect(x, 150, 64, 64);
        text(ctx, d < days ? String(d + 1) : '?', x + 32, 182, {size: 30, color: d < days ? P.ink : P.dim, weight: 900, font: SANS, alpha: b * appear});
      }
      ctx.globalAlpha = b * span(t, 6.8, 7.3);
      text(ctx, '两周', W / 2 - 680 + 14 * 76 - 6, 250, {size: 30, color: P.red, weight: 900, glow: 12});
      ctx.strokeStyle = P.red;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(W / 2 - 680 + 14 * 76 - 6, 130);
      ctx.lineTo(W / 2 - 680 + 14 * 76 - 6, 232);
      ctx.stroke();
      ctx.restore();
    }
    if (c > 0) {
      ctx.save();
      ctx.globalAlpha = c;
      dust(ctx, t, 200, P.gold, 0.5);
      const z = lerp(1, 1.5, easeInOut(span(t, 9.6, 12.6)));
      ctx.translate(W / 2 + 260, 470);
      ctx.scale(z, z);
      ctx.translate(-W / 2 - 260, -470);
      text(ctx, '0.506', W / 2 - 150, 470, {size: 250, color: P.text, weight: 900, font: SANS, glow: 20});
      const j = Math.sin(t * 40) * 3 * span(t, 10.4, 11);
      text(ctx, '127', W / 2 + 330 + j, 470, {size: 250, color: P.red, weight: 900, font: SANS, glow: 40});
      ctx.restore();
    }
  };
  return <Canvas s={s} draw={draw} />;
};

/* ================= S2 标题 ================= */
export const S2: React.FC<SP> = ({s}) => {
  const draw = (ctx: CanvasRenderingContext2D, t: number) => {
    bg(ctx);
    dust(ctx, t, 240, P.gold, 0.5);
    const wg = wings();
    drawPoints(ctx, wg.filter((_, i) => i % 6 === 0), {yaw: t * 0.15, pitch: 0.1, cx: W / 2, cy: 520, scale: 1.1, f: 4200, dist: 4200}, {color: P.gold, size: 3, alpha: 0.18, t});
    const title = textCloud(ONSCREEN.title, 250);
    const sc = scatter(N, 2600, 1500, 1400, 77);
    const gather = span(t, 12.6, 14.2);
    const out = span(t, 17.0, 17.9);
    const pts = title.map((p, i) => {
      const dl = hash(i * 0.7) * 0.3;
      const g = easeInOut((gather - dl) / 0.7);
      const o = easeInOut((out - dl) / 0.7);
      return lerp3(lerp3(sc[i], p, g), {x: sc[i].x * 1.3, y: sc[i].y - 300, z: sc[i].z}, o);
    });
    drawPoints(ctx, pts, {yaw: Math.sin(t * 0.5) * 0.05, pitch: 0, cx: W / 2, cy: 480, scale: 1}, {color: P.ember, size: 3.8, alpha: 0.9, t});
    const lab = span(t, 14.0, 14.6) * (1 - span(t, 17.0, 17.6));
    text(ctx, ONSCREEN.en, W / 2, 310, {size: 30, color: P.gold, font: SERIF, weight: 400, alpha: lab, spacing: 16});
    text(ctx, ONSCREEN.sub, W / 2, 670, {size: 48, color: P.text, weight: 600, alpha: lab, glow: 10, spacing: 6});
  };
  return <Canvas s={s} draw={draw} />;
};

/* ================= S3 世界像一台钟 ================= */
export const S3: React.FC<SP> = ({s}) => {
  const draw = (ctx: CanvasRenderingContext2D, t: number) => {
    bg(ctx);
    dust(ctx, t, 200, P.gold, 0.45);
    const z = lerp(1.15, 1.0, span(t, 17.8, 24));
    ctx.save();
    ctx.translate(W / 2, 470);
    ctx.scale(z, z);
    ctx.translate(-W / 2, -470);
    drawGears(ctx, t, span(t, 17.8, 19.0));
    // 中心表盘：指针与刻度
    const c = GEARS[0];
    ctx.save();
    ctx.strokeStyle = P.text;
    ctx.lineCap = 'round';
    ctx.shadowColor = P.ember;
    ctx.shadowBlur = 16;
    ctx.lineWidth = 8;
    const hA = t * 0.6;
    ctx.beginPath();
    ctx.moveTo(c.x, c.y);
    ctx.lineTo(c.x + Math.cos(hA) * 90, c.y + Math.sin(hA) * 90);
    ctx.stroke();
    ctx.lineWidth = 5;
    const mA = t * 3;
    ctx.beginPath();
    ctx.moveTo(c.x, c.y);
    ctx.lineTo(c.x + Math.cos(mA) * 125, c.y + Math.sin(mA) * 125);
    ctx.stroke();
    ctx.restore();
    // 外圈轨道与行星：一切按时到位
    for (let k = 0; k < 3; k++) {
      const R = 330 + k * 90;
      ctx.save();
      ctx.strokeStyle = `rgba(232,194,122,${0.18})`;
      ctx.setLineDash([4, 10]);
      ctx.beginPath();
      ctx.ellipse(c.x, c.y, R, R * 0.42, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
      const a = t * (0.5 - k * 0.12) + k * 2;
      glowDot(ctx, c.x + Math.cos(a) * R, c.y + Math.sin(a) * R * 0.42, 26 - k * 4, P.ember, span(t, 19 + k * 0.3, 19.6 + k * 0.3));
    }
    ctx.restore();
    // 明天 · 明年 · 一百年后
    ONSCREEN.clock.forEach((w, i) => {
      const ap = span(t, 24.4 + i * 0.9, 24.9 + i * 0.9);
      const x = [520, 960, 1400][i];
      text(ctx, w, x, 150 - (i === 1 ? 10 : 0), {size: 52 + i * 8, color: i === 2 ? P.ember : P.text, weight: 900, alpha: ap * (1 - span(t, 29.6, 30.3)), glow: 14});
    });
  };
  return <Canvas s={s} draw={draw} />;
};

/* ================= S4 抄错的数字 ================= */
const runA = () => trajectory({x: 0.506127, y: 1, z: 20}, 3200, 0.01);
const runB = () => trajectory({x: 0.506, y: 1, z: 20}, 3200, 0.01);

export const S4: React.FC<SP> = ({s}) => {
  const draw = (ctx: CanvasRenderingContext2D, t: number) => {
    bg(ctx);
    dust(ctx, t, 140, P.gold, 0.35);
    const paper = win(t, 30.0, 38.2, 0.5, 0.5);
    const zoom = win(t, 37.8, 45.6, 0.4, 0.4);
    const coffee = win(t, 45.3, 50.0, 0.4, 0.4);
    const plot = span(t, 49.6, 50.2);
    // 打印纸：一列列数字往上滚
    if (paper > 0) {
      ctx.save();
      ctx.globalAlpha = paper;
      const px = 520;
      const pw = 880;
      const g = ctx.createLinearGradient(px, 0, px + pw, 0);
      g.addColorStop(0, '#1A1814');
      g.addColorStop(0.5, '#24211B');
      g.addColorStop(1, '#1A1814');
      ctx.fillStyle = g;
      ctx.fillRect(px, 0, pw, H);
      for (let y = 0; y < H; y += 40) {
        ctx.fillStyle = 'rgba(232,194,122,0.03)';
        ctx.fillRect(px, y, pw, 20);
      }
      for (const hx of [px + 24, px + pw - 24]) {
        for (let y = 20; y < H; y += 46) {
          ctx.fillStyle = '#05060A';
          ctx.beginPath();
          ctx.arc(hx, y, 8, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      const tr = runA();
      const scroll = lerp(0, 1400, easeOut(span(t, 30.3, 37.6)));
      ctx.font = `600 36px ${SANS}`;
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      for (let r = 0; r < 60; r++) {
        const y = 1200 + r * 52 - scroll;
        if (y < -40 || y > H + 40) continue;
        const p = tr[r * 37 + 5];
        const target = r === 34;
        const vals = target ? ['0.506127', (p.y / 10).toFixed(6), (p.z / 10).toFixed(6)] : [(p.x / 10).toFixed(6), (p.y / 10).toFixed(6), (p.z / 10).toFixed(6)];
        vals.forEach((v, k) => {
          ctx.globalAlpha = paper * (target ? 1 : 0.55);
          ctx.fillStyle = target && k === 0 ? P.ember : P.gold;
          ctx.shadowColor = P.gold;
          ctx.shadowBlur = target ? 18 : 6;
          ctx.fillText(v.startsWith('-') ? v : ' ' + v, px + 90 + k * 270, y);
        });
      }
      ctx.restore();
    }
    // 0.506127 → 0.506
    if (zoom > 0) {
      ctx.save();
      ctx.globalAlpha = zoom;
      const cut = span(t, 39.6, 40.6);
      text(ctx, '0.506', 860, 420, {size: 210, color: P.text, weight: 900, font: SANS, glow: 18});
      ctx.save();
      ctx.translate(1290 + cut * 60, 420 + cut * cut * 420);
      ctx.rotate(cut * 0.6);
      text(ctx, '127', 0, 0, {size: 210, color: P.red, weight: 900, font: SANS, alpha: 1 - cut * 0.85, glow: 30});
      ctx.restore();
      const typ = Math.round(clamp01((t - 40.8) / 1.0) * 5);
      text(ctx, '0.506'.slice(0, typ) + (Math.sin(t * 8) > 0 ? '▍' : ''), 860, 650, {size: 90, color: P.ember, weight: 600, font: SANS, glow: 12, alpha: span(t, 40.6, 40.9)});
      text(ctx, '− 0.000127', 860, 790, {size: 52, color: P.red, weight: 600, font: SANS, alpha: span(t, 42.3, 42.8), glow: 10});
      ctx.restore();
    }
    // 去倒咖啡：时间过去
    if (coffee > 0) {
      ctx.save();
      ctx.globalAlpha = coffee;
      const cx = 760;
      const cy = 560;
      ctx.fillStyle = '#1C1A16';
      ctx.strokeStyle = P.gold;
      ctx.lineWidth = 4;
      ctx.shadowColor = P.gold;
      ctx.shadowBlur = 16;
      ctx.beginPath();
      ctx.moveTo(cx - 130, cy - 120);
      ctx.lineTo(cx + 130, cy - 120);
      ctx.lineTo(cx + 105, cy + 120);
      ctx.lineTo(cx - 105, cy + 120);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(cx + 150, cy - 20, 52, -Math.PI / 2, Math.PI / 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.ellipse(cx, cy + 140, 210, 24, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.shadowBlur = 0;
      for (let i = 0; i < 260; i++) {
        const k = (hash(i) + t * 0.25) % 1;
        const x = cx + (hash(i + 1) - 0.5) * 140 + Math.sin(k * 8 + i) * 40 * k;
        const y = cy - 140 - k * 380;
        glowDot(ctx, x, y, 8 + 10 * k, P.paper, (1 - k) * 0.35);
      }
      const dx = 1300;
      const dy = 520;
      ctx.strokeStyle = P.gold;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(dx, dy, 170, 0, Math.PI * 2);
      ctx.stroke();
      for (let k = 0; k < 12; k++) {
        const a = (k / 12) * Math.PI * 2;
        ctx.beginPath();
        ctx.moveTo(dx + Math.cos(a) * 150, dy + Math.sin(a) * 150);
        ctx.lineTo(dx + Math.cos(a) * 170, dy + Math.sin(a) * 170);
        ctx.stroke();
      }
      const ma = -Math.PI / 2 + (t - 45.3) * 8;
      ctx.lineWidth = 6;
      ctx.strokeStyle = P.ember;
      ctx.beginPath();
      ctx.moveTo(dx, dy);
      ctx.lineTo(dx + Math.cos(ma) * 140, dy + Math.sin(ma) * 140);
      ctx.stroke();
      text(ctx, '咖啡', cx, cy + 210, {size: 34, color: P.dim, weight: 400, font: SANS});
      ctx.restore();
    }
    // 两条天气曲线：几乎重合 → 慢慢分开 → 完全不同
    if (plot > 0) {
      ctx.save();
      ctx.globalAlpha = plot;
      const x0 = 160;
      const x1 = 1760;
      const yc = 470;
      ctx.strokeStyle = 'rgba(232,194,122,0.08)';
      ctx.lineWidth = 1;
      for (let x = x0; x <= x1; x += 40) {
        ctx.beginPath();
        ctx.moveTo(x, 150);
        ctx.lineTo(x, 790);
        ctx.stroke();
      }
      for (let y = 150; y <= 790; y += 40) {
        ctx.beginPath();
        ctx.moveTo(x0, y);
        ctx.lineTo(x1, y);
        ctx.stroke();
      }
      const prog = span(t, 49.9, 58.6, clamp01);
      const A = runA();
      const B = runB();
      const span2 = Math.floor(A.length * 0.72);
      const n = Math.floor(span2 * prog);
      const ptsA: [number, number][] = [];
      const ptsB: [number, number][] = [];
      for (let i = 0; i < n; i += 3) {
        const x = lerp(x0, x1, i / span2);
        ptsA.push([x, yc - A[i].x * 15]);
        ptsB.push([x, yc - B[i].x * 15]);
      }
      glowLine(ctx, ptsA, P.gold, 4);
      glowLine(ctx, ptsB, P.red, 4);
      if (ptsA.length) {
        const la = ptsA[ptsA.length - 1];
        const lb = ptsB[ptsB.length - 1];
        glowDot(ctx, la[0], la[1], 30, P.gold);
        glowDot(ctx, lb[0], lb[1], 30, P.red);
      }
      text(ctx, '0.506127', x0, 120, {size: 30, color: P.gold, align: 'left', font: SANS, weight: 600});
      text(ctx, '0.506', x0 + 220, 120, {size: 30, color: P.red, align: 'left', font: SANS, weight: 600});
      ctx.restore();
    }
  };
  return <Canvas s={s} draw={draw} />;
};

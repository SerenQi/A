import React from 'react';
import {H, ONSCREEN, PALETTE as P, W} from '../config';
import {clamp01, easeInOut, easeOut, hash, lerp, span, win} from '../lib/anim';
import {SP} from '../components/Kit';
import {Canvas} from '../components/Canvas';
import {Cam3, P3, drawPoints, glowSprite, project} from '../lib/points';
import {trajectory} from '../lib/lorenz';
import {bg, dust, glowDot, glowLine, mixColor} from './draw';
import {drawGears, text, wings} from './Scenes1';

/* ================= S5 一束分叉的轨迹 → 钟碎了 → 巴西的蝴蝶 ================= */
const ENS = 28;
const ensemble = (() => {
  let c: ReturnType<typeof trajectory>[] | null = null;
  return () => {
    if (!c) c = Array.from({length: ENS}, (_, i) => trajectory({x: 0.506 + i * 0.00012, y: 1, z: 20}, 3200, 0.01));
    return c;
  };
})();

const globePts = (() => {
  let c: P3[] | null = null;
  return () => {
    if (!c) {
      c = [];
      for (let lat = -80; lat <= 80; lat += 4) {
        const n = Math.max(6, Math.round(90 * Math.cos((lat * Math.PI) / 180)));
        for (let k = 0; k < n; k++) {
          const lon = (k / n) * 360;
          const la = (lat * Math.PI) / 180;
          const lo = (lon * Math.PI) / 180;
          c.push({x: Math.cos(la) * Math.sin(lo) * 380, y: -Math.sin(la) * 380, z: Math.cos(la) * Math.cos(lo) * 380});
        }
      }
    }
    return c;
  };
})();
const onGlobe = (lat: number, lon: number, r = 380): P3 => {
  const la = (lat * Math.PI) / 180;
  const lo = (lon * Math.PI) / 180;
  return {x: Math.cos(la) * Math.sin(lo) * r, y: -Math.sin(la) * r, z: Math.cos(la) * Math.cos(lo) * r};
};
const BRAZIL = {lat: -10, lon: -52};
const TEXAS = {lat: 31, lon: -99};

export const S5: React.FC<SP> = ({s}) => {
  const draw = (ctx: CanvasRenderingContext2D, t: number) => {
    bg(ctx);
    dust(ctx, t, 160, P.gold, 0.35);
    const fan = win(t, 62.0, 77.0, 0.5, 0.6);
    const clock = win(t, 76.5, 83.2, 0.4, 0.5);
    const globe = span(t, 82.8, 83.8);
    // 一束轨迹：开头只差一点点，后面散成一片
    if (fan > 0) {
      ctx.save();
      ctx.globalAlpha = fan;
      const prog = span(t, 62.4, 70.5, clamp01);
      const ens = ensemble();
      const x0 = 160;
      const x1 = 1760;
      for (let e = 0; e < ENS; e++) {
        const tr = ens[e];
        const n = Math.floor(tr.length * prog);
        const pts: [number, number][] = [];
        for (let i = 0; i < n; i += 4) pts.push([lerp(x0, x1, i / tr.length), 470 - tr[i].x * 15]);
        glowLine(ctx, pts, mixColor(P.gold, P.red, Math.round((e / ENS) * 10) / 10), 2, 0.7);
      }
      // 风：满屏细小的气流
      const wind = span(t, 69.0, 70.0) * (1 - span(t, 76.0, 77.0));
      if (wind > 0) {
        const spr = glowSprite(P.paper);
        ctx.globalCompositeOperation = 'lighter';
        for (let i = 0; i < 700; i++) {
          const y = hash(i) * H;
          const x = ((hash(i + 1) * W + t * (200 + hash(i + 2) * 300) + Math.sin(y * 0.01 + t) * 40) % W + W) % W;
          ctx.globalAlpha = fan * wind * 0.35;
          ctx.drawImage(spr, x - 3, y - 3, 6, 6);
        }
        ctx.globalCompositeOperation = 'source-over';
      }
      ctx.restore();
    }
    // 那台钟：停住，然后碎掉
    if (clock > 0) {
      ctx.save();
      ctx.globalAlpha = clock;
      drawGears(ctx, t, 1, span(t, 79.0, 81.5, easeOut), true);
      ctx.restore();
    }
    // 地球：巴西的一只蝴蝶，得克萨斯的龙卷风
    if (globe > 0) {
      ctx.save();
      ctx.globalAlpha = globe;
      const yaw = lerp(0.5, 1.25, span(t, 83, 96)) ;
      const cam: Cam3 = {yaw, pitch: -0.25, cx: W / 2, cy: 480, scale: 1.05};
      glowDot(ctx, W / 2, 480, 520, P.gold, 0.12);
      drawPoints(ctx, globePts(), cam, {color: P.gold, size: 3.2, alpha: 0.75, t, twinkle: 0.15, shade: true});
      const b = project(onGlobe(BRAZIL.lat, BRAZIL.lon, 392), cam);
      const x = project(onGlobe(TEXAS.lat, TEXAS.lon, 392), cam);
      // 蝴蝶
      const flap = Math.abs(Math.sin(t * 9));
      ctx.save();
      ctx.translate(b.x, b.y);
      ctx.fillStyle = P.ember;
      ctx.shadowColor = P.ember;
      ctx.shadowBlur = 24;
      for (const sd of [-1, 1]) {
        ctx.beginPath();
        ctx.ellipse(sd * 16 * (0.3 + 0.7 * flap), -10, 18 * (0.3 + 0.7 * flap), 24, sd * 0.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(sd * 12 * (0.3 + 0.7 * flap), 12, 12 * (0.3 + 0.7 * flap), 14, -sd * 0.4, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
      // 一圈圈扩散出去的扰动
      for (let k = 0; k < 4; k++) {
        const ph = ((t - 84) * 0.5 + k * 0.25) % 1;
        if (t < 84) break;
        ctx.strokeStyle = `rgba(255,211,154,${(1 - ph) * 0.6})`;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.ellipse(b.x, b.y, 20 + ph * 260, (20 + ph * 260) * 0.45, -0.3, 0, Math.PI * 2);
        ctx.stroke();
      }
      // 沿球面飞向得克萨斯的光点
      const go = span(t, 86.9, 90.5);
      const arc: [number, number][] = [];
      for (let i = 0; i <= 40 * go; i++) {
        const f = i / 40;
        const lat = lerp(BRAZIL.lat, TEXAS.lat, f);
        const lon = lerp(BRAZIL.lon, TEXAS.lon, f);
        const q = project(onGlobe(lat, lon, 392 + Math.sin(f * Math.PI) * 120), cam);
        arc.push([q.x, q.y]);
      }
      glowLine(ctx, arc, P.ember, 3, 0.9);
      // 龙卷风
      const tw = span(t, 90.3, 92.0);
      if (tw > 0) {
        const spr = glowSprite(P.red);
        ctx.globalCompositeOperation = 'lighter';
        for (let i = 0; i < 700; i++) {
          const k = hash(i * 1.3);
          const hgt = k * 190 * tw;
          const rad = 8 + k * 70;
          const a = hash(i) * Math.PI * 2 + t * (6 - k * 3);
          ctx.globalAlpha = globe * 0.7 * (1 - k * 0.5);
          ctx.drawImage(spr, x.x + Math.cos(a) * rad - 4, x.y - hgt + Math.sin(a) * rad * 0.3 - 4, 8, 8);
        }
        ctx.globalCompositeOperation = 'source-over';
      }
      text(ctx, '巴西', b.x - 30, b.y + 60, {size: 34, color: P.ember, weight: 900, glow: 10});
      text(ctx, '得克萨斯', x.x - 90, x.y + 40, {size: 34, color: P.red, weight: 900, glow: 10, alpha: span(t, 89, 90)});
      ctx.restore();
    }
  };
  return <Canvas s={s} draw={draw} />;
};

/* ================= S6 吸引子：混沌，不是随机 ================= */
export const S6: React.FC<SP> = ({s}) => {
  const draw = (ctx: CanvasRenderingContext2D, t: number) => {
    bg(ctx);
    dust(ctx, t, 160, P.gold, 0.35);
    const wg = wings();
    const front = span(t, 112.6, 115.0);
    const yaw = lerp(0.9 + (t - 96) * 0.06, 0, front) + (t > 115 ? Math.sin((t - 115) * 0.3) * 0.12 : 0);
    const pitch = lerp(0.35, 0.05, front);
    const cam: Cam3 = {yaw, pitch, cx: W / 2, cy: 470, scale: 1.05, f: 4200, dist: 4200};
    // 轨迹一笔一笔画出来
    const reveal = span(t, 99.5, 109.5, clamp01);
    const n = Math.floor(wg.length * reveal);
    if (n > 2) {
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      ctx.lineWidth = 1.4;
      ctx.lineJoin = 'round';
      let prev = project(wg[0], cam);
      for (let i = 4; i < n; i += 4) {
        const q = project(wg[i], cam);
        const age = (n - i) / wg.length;
        ctx.strokeStyle = age < 0.02 ? P.ember : P.gold;
        ctx.globalAlpha = Math.max(0.12, 0.6 - age * 0.8);
        ctx.beginPath();
        ctx.moveTo(prev.x, prev.y);
        ctx.lineTo(q.x, q.y);
        ctx.stroke();
        prev = q;
      }
      ctx.restore();
      const head = project(wg[n - 1], cam);
      glowDot(ctx, head.x, head.y, 40, P.ember);
    }
    // 沿着吸引子流动的光点
    const flow = span(t, 108.5, 110.5);
    if (flow > 0) {
      const pts: P3[] = [];
      for (let i = 0; i < 3000; i++) {
        const idx = Math.floor((hash(i * 0.37) * wg.length + t * 600) % wg.length);
        pts.push(wg[idx]);
      }
      drawPoints(ctx, pts, cam, {color: P.ember, size: 4.4, alpha: 0.75 * flow, t, twinkle: 0.2});
    }
    // 两个几乎一样的起点，在翅膀上越走越远
    const pair = span(t, 120.6, 121.4);
    if (pair > 0) {
      const A = trajectory({x: 0.506127, y: 1, z: 20}, 3200, 0.01);
      const B = trajectory({x: 0.506, y: 1, z: 20}, 3200, 0.01);
      const k = Math.floor(lerp(400, 2600, span(t, 121, 135, clamp01)));
      for (const [tr, col] of [
        [A, P.gold],
        [B, P.red],
      ] as const) {
        const pts: [number, number][] = [];
        for (let i = Math.max(0, k - 260); i < k; i += 2) {
          const q = project({x: tr[i].x * 17, y: -(tr[i].z - 25) * 17, z: tr[i].y * 17}, cam);
          pts.push([q.x, q.y]);
        }
        glowLine(ctx, pts, col, 3, pair);
        const last = pts[pts.length - 1];
        if (last) glowDot(ctx, last[0], last[1], 34, col, pair);
      }
    }
  };
  const lab = win(s, 100.5, 126, 0.8, 0.8);
  return (
    <>
      <Canvas s={s} draw={draw} />
      <div style={{position: 'absolute', right: 64, top: 44, textAlign: 'right', opacity: lab}}>
        <div style={{fontFamily: '"Noto Serif SC", serif', fontWeight: 900, fontSize: 34, color: P.ember, letterSpacing: 6}}>{ONSCREEN.label[0]}</div>
        <div style={{fontFamily: '"Noto Serif SC", serif', fontStyle: 'italic', fontSize: 20, color: P.dim, letterSpacing: 4}}>{ONSCREEN.label[1]}</div>
      </div>
    </>
  );
};

/* ================= S7 算不准，但有形状 ================= */
export const S7: React.FC<SP> = ({s}) => {
  const end = span(s, 154.4, 155.6);
  const draw = (ctx: CanvasRenderingContext2D, t: number) => {
    bg(ctx);
    dust(ctx, t, 200, P.gold, 0.4);
    const wg = wings();
    const shape = span(t, 147.6, 150.5);
    const cam: Cam3 = {yaw: Math.sin((t - 136) * 0.15) * 0.15, pitch: 0.05, cx: W / 2, cy: 470 - 40 * end, scale: lerp(1.05, 0.85, end), f: 4200, dist: 4200};
    drawPoints(ctx, wg.filter((_, i) => i % 3 === 0), cam, {color: P.gold, size: 3.2, alpha: lerp(0.12, 0.5, shape) * (1 - 0.4 * end), t, twinkle: 0.2});
    // 一条“人生”的轨迹：长长的尾巴，走到哪里谁也说不准
    const i0 = Math.floor((((t - 136) * 420) % (wg.length - 1500) + (wg.length - 1500)) % (wg.length - 1500));
    const pts: [number, number][] = [];
    for (let i = i0; i < i0 + 1400; i += 3) {
      const q = project(wg[i], cam);
      pts.push([q.x, q.y]);
    }
    glowLine(ctx, pts, P.ember, 3, 0.9 * (1 - 0.5 * end));
    const last = pts[pts.length - 1];
    if (last) glowDot(ctx, last[0], last[1], 44, P.ember, 1 - 0.5 * end);
    // 偶然的相遇：轨迹边上闪过的小光点
    const meet = win(t, 142.9, 147.6, 0.4, 0.4);
    if (meet > 0) {
      for (let k = 0; k < 6; k++) {
        const q = project(wg[Math.floor(hash(k) * wg.length)], cam);
        glowDot(ctx, q.x, q.y, 30 + 20 * Math.sin(t * 3 + k), P.red, meet * 0.8);
      }
    }
    if (end > 0) {
      ctx.fillStyle = `rgba(0,0,0,${0.35 * end})`;
      ctx.fillRect(0, 0, W, H);
      text(ctx, ONSCREEN.end[0], W / 2, 860, {size: 110, color: P.text, weight: 900, glow: 24, alpha: end, spacing: 8});
      text(ctx, ONSCREEN.end[1], W / 2, 970, {size: 36, color: '#CFC8BA', weight: 400, alpha: span(s, 155.2, 156.4), spacing: 2});
    }
  };
  return <Canvas s={s} draw={draw} />;
};

export const _keep = {clamp01, easeInOut};

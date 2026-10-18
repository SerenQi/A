import React from 'react';
import {H, ONSCREEN, PALETTE as P, W} from '../config';
import {clamp01, easeInOut, easeOut, hash, lerp, span, win} from '../lib/anim';
import {SP} from '../components/Kit';
import {Canvas} from '../components/Canvas';
import {N, textCloud} from '../lib/clouds';
import {drawPoints, glowSprite, lerp3, scatter} from '../lib/points';
import {bg, dust} from './draw';
import {SANS, SERIF, bubble, confetti, curtain, glow, line, person, rect, spotlight, stageFloor, text, vanity} from './stage';

const sub = (t: number, a: number, b: number, i = 0.35, o = 0.35) => win(t, a, b, i, o);

/* ================= D1 开头：大家都在演 ================= */
export const D1: React.FC<SP> = ({s}) => {
  const draw = (ctx: CanvasRenderingContext2D, t: number) => {
    bg(ctx);
    dust(ctx, t, 140, P.gold, 0.35);
    // a 会议：一排人在点头，头顶全是问号
    const a = sub(t, -1, 3.9);
    if (a > 0) {
      ctx.save();
      ctx.globalAlpha = a;
      rect(ctx, 660, 120, 600, 300, P.gold, 3, a * 0.8, 'rgba(232,194,122,0.04)');
      line(ctx, [[700, 360], [820, 300], [940, 330], [1060, 230], [1220, 260]], P.ember, 4, a);
      line(ctx, [[560, 760], [1360, 760], [1600, 980], [320, 980], [560, 760]], P.gold, 3, a * 0.8);
      const seats = [
        [520, 780, 0.85],
        [760, 760, 0.8],
        [1160, 760, 0.8],
        [1400, 780, 0.85],
        [380, 1000, 1.0],
        [1540, 1000, 1.0],
      ];
      seats.forEach(([x, y, sc], i) => {
        const nod = Math.max(0, Math.sin(t * 5 + i * 1.3)) * 10;
        person(ctx, x, y + nod, sc, {t, seed: i, slump: 0.15, alpha: a});
        text(ctx, '？', x + 10, y - 300 * sc - 20, {size: 56, color: P.ember, weight: 900, alpha: a * span(t, 0.8 + i * 0.25, 1.2 + i * 0.25), glow: 16});
      });
      ctx.restore();
    }
    // b 第一天上班：台灯下的工位，屏幕上贴着“我都会”
    const b = sub(t, 3.7, 6.5);
    if (b > 0) {
      ctx.save();
      ctx.globalAlpha = b;
      spotlight(ctx, 960, 820, 900, b);
      rect(ctx, 820, 380, 360, 230, P.gold, 4, b, 'rgba(232,194,122,0.05)');
      ctx.save();
      ctx.translate(1120, 420);
      ctx.rotate(0.12);
      ctx.fillStyle = P.ember;
      ctx.globalAlpha = b;
      ctx.fillRect(-70, -40, 140, 80);
      ctx.restore();
      text(ctx, '我都会', 1120, 422, {size: 34, color: P.ink, weight: 900, alpha: b});
      line(ctx, [[560, 820], [1360, 820]], P.gold, 4, b);
      person(ctx, 760, 1000, 1.1, {t, alpha: b});
      ctx.restore();
    }
    // c 对着镜子练明天要说的话
    const c = sub(t, 6.3, 9.5);
    if (c > 0) {
      ctx.save();
      ctx.globalAlpha = c;
      vanity(ctx, 1180, 520, 460, 560, 1, c);
      person(ctx, 640, 960, 1.15, {t, alpha: c, yaw: 0.4});
      ctx.save();
      ctx.beginPath();
      ctx.rect(950, 240, 460, 560);
      ctx.clip();
      person(ctx, 1180, 900, 0.95, {t, alpha: c * 0.55, yaw: -0.4, color: P.paper});
      ctx.restore();
      ['“各位好，我叫……”', '“这个方案，我来负责”', '“没问题”'].forEach((w, i) => bubble(ctx, 520, 260 + i * 110, w, {size: 30, dark: true, alpha: c * span(t, 6.8 + i * 0.6, 7.2 + i * 0.6)}));
      ctx.restore();
    }
    // d 领导临时抱佛脚，专家说错
    const d = sub(t, 9.3, 13.3);
    if (d > 0) {
      ctx.save();
      ctx.globalAlpha = d;
      line(ctx, [[W / 2, 160], [W / 2, 900]], P.faint, 2, d, 0);
      // 左：深夜翻书划重点
      spotlight(ctx, 480, 860, 600, d);
      ctx.save();
      ctx.translate(480, 640);
      ctx.fillStyle = P.paper;
      ctx.globalAlpha = d;
      ctx.fillRect(-170, -40, 160, 110);
      ctx.fillRect(10, -40, 160, 110);
      for (let r = 0; r < 5; r++) {
        ctx.fillStyle = r === 2 ? P.red : 'rgba(29,27,25,0.5)';
        ctx.fillRect(-150, -24 + r * 18, 120, r === 2 ? 8 : 4);
        ctx.fillRect(30, -24 + r * 18, 120, 4);
      }
      ctx.restore();
      text(ctx, '重点', 480, 560, {size: 36, color: P.red, weight: 900, alpha: d * span(t, 10, 10.4), glow: 10});
      person(ctx, 480, 960, 1.0, {t, alpha: d, slump: 0.4});
      // 右：讲台上的专家，被盖了个“错”
      spotlight(ctx, 1440, 860, 600, d);
      rect(ctx, 1290, 300, 300, 180, P.gold, 3, d);
      line(ctx, [[1310, 450], [1380, 400], [1450, 420], [1570, 330]], P.ember, 4, d);
      person(ctx, 1440, 960, 1.0, {t, alpha: d});
      const stamp = clamp01((t - 11.6) / 0.3);
      if (stamp > 0) {
        ctx.save();
        ctx.translate(1500, 400);
        ctx.rotate(-0.25);
        ctx.scale(lerp(1.8, 1, stamp), lerp(1.8, 1, stamp));
        ctx.globalAlpha = d * stamp;
        ctx.strokeStyle = P.red;
        ctx.lineWidth = 6;
        ctx.strokeRect(-80, -50, 160, 100);
        ctx.restore();
        text(ctx, '错', 1500, 400, {size: 70, color: P.red, weight: 900, alpha: d * stamp, glow: 16});
      }
      ctx.restore();
    }
    // e 幕布拉开：整个世界是一座摇摇晃晃的草台
    const e = span(t, 13.0, 13.6);
    if (e > 0) {
      ctx.save();
      ctx.globalAlpha = e;
      const pull = lerp(1.15, 0.92, easeInOut(span(t, 13, 19.6)));
      ctx.translate(W / 2, 560);
      ctx.scale(pull, pull);
      ctx.translate(-W / 2, -560);
      const wob = Math.sin(t * 3) * 0.012;
      ctx.save();
      ctx.translate(W / 2, 820);
      ctx.rotate(wob);
      ctx.translate(-W / 2, -820);
      // 歪歪扭扭的脚手架和木板
      for (let i = 0; i < 9; i++) {
        const x = 300 + i * 165;
        line(ctx, [[x, 1080], [x + (hash(i) - 0.5) * 40, 780]], '#B08850', 6, e, 4);
      }
      for (let k = 0; k < 3; k++) line(ctx, [[260, 1000 - k * 70 + hash(k) * 20], [1660, 980 - k * 70 - hash(k + 3) * 20]], '#8A6A40', 4, e, 2);
      for (let i = 0; i < 8; i++) line(ctx, [[300 + i * 165, 1050], [465 + i * 165, 800]], '#7A5A34', 3, e * 0.8, 0);
      ctx.fillStyle = '#2A1C10';
      ctx.fillRect(240, 760, 1440, 26);
      line(ctx, [[240, 760], [1680, 760]], P.gold, 4, e);
      // 台上，人人都在演
      for (let i = 0; i < 7; i++) {
        const x = 420 + i * 180;
        const jump = Math.abs(Math.sin(t * 3 + i)) * 12;
        person(ctx, x, 760 - jump, 0.72, {t, seed: i, alpha: e, yaw: (hash(i) - 0.5) * 1.2, color: i % 3 === 0 ? P.ember : P.gold});
      }
      // 绳子吊着的道具：纸板太阳、纸云
      line(ctx, [[640, 100], [640, 300]], P.dim, 2, e, 0);
      glow(ctx, 640, 340, 90, P.ember, e * 0.8);
      line(ctx, [[1280, 100], [1280, 260]], P.dim, 2, e, 0);
      text(ctx, '☁', 1280, 300, {size: 120, color: P.paper, alpha: e * 0.7});
      ctx.restore();
      spotlight(ctx, 700, 760, 520, e * 0.8);
      spotlight(ctx, 1240, 760, 520, e * 0.8);
      ctx.restore();
      curtain(ctx, easeOut(span(t, 13.1, 15.0)), t, 1);
    }
  };
  return <Canvas s={s} draw={draw} />;
};

/* ================= D2 标题 ================= */
export const D2: React.FC<SP> = ({s}) => {
  const draw = (ctx: CanvasRenderingContext2D, t: number) => {
    bg(ctx);
    curtain(ctx, lerp(0.0, 0.08, span(t, 19.6, 25.6)), t, 1);
    ctx.fillStyle = 'rgba(0,0,0,0.35)';
    ctx.fillRect(0, 0, W, H);
    spotlight(ctx, W / 2, 900, 980, span(t, 19.6, 20.3));
    const title = textCloud(ONSCREEN.title, 280);
    const sc = scatter(N, 2600, 1500, 1400, 91);
    const gather = span(t, 19.7, 21.3);
    const out = span(t, 24.9, 25.8);
    const pts = title.map((p, i) => {
      const dl = hash(i * 0.7) * 0.3;
      const g = easeInOut((gather - dl) / 0.7);
      const o = easeInOut((out - dl) / 0.7);
      return lerp3(lerp3(sc[i], p, g), {x: sc[i].x * 1.3, y: sc[i].y - 300, z: sc[i].z}, o);
    });
    drawPoints(ctx, pts, {yaw: Math.sin(t * 0.5) * 0.04, pitch: 0, cx: W / 2, cy: 470, scale: 1}, {color: P.ember, size: 4, alpha: 0.95, t});
    const lab = span(t, 21.0, 21.6) * (1 - span(t, 24.9, 25.5));
    text(ctx, ONSCREEN.en, W / 2, 285, {size: 32, color: P.gold, weight: 400, alpha: lab, spacing: 18, italic: true});
    text(ctx, ONSCREEN.sub, W / 2, 680, {size: 54, color: P.text, weight: 900, alpha: lab, glow: 12, spacing: 8});
  };
  return <Canvas s={s} draw={draw} />;
};

/* ================= D3 小岛、一道门 ================= */
const islandPts = (() => {
  let c: [number, number][] | null = null;
  return () => {
    if (!c) {
      c = [];
      const blobs = [
        [960, 520, 120, 260],
        [1060, 330, 60, 110],
        [870, 720, 50, 90],
        [1110, 610, 40, 70],
        [1180, 250, 30, 60],
      ];
      for (let i = 0; i < 2600; i++) {
        const b = blobs[Math.floor(hash(i) * blobs.length)];
        const a = hash(i + 1) * Math.PI * 2;
        const r = Math.sqrt(hash(i + 2));
        const wob = 1 + 0.25 * Math.sin(a * 5 + b[0]);
        c.push([b[0] + Math.cos(a) * b[2] * r * wob, b[1] + Math.sin(a) * b[3] * r * wob]);
      }
    }
    return c;
  };
})();

export const D3: React.FC<SP> = ({s}) => {
  const draw = (ctx: CanvasRenderingContext2D, t: number) => {
    bg(ctx);
    // a 北边的小岛
    const a = sub(t, 25.0, 31.4, 0.5, 0.5);
    if (a > 0) {
      ctx.save();
      const z = lerp(0.8, 1.25, easeInOut(span(t, 25.4, 31.4)));
      ctx.translate(W / 2, 500);
      ctx.scale(z, z);
      ctx.translate(-W / 2, -500);
      const spr = glowSprite(P.gold);
      const sea = glowSprite('#3A4A66');
      ctx.globalCompositeOperation = 'lighter';
      for (let i = 0; i < 1400; i++) {
        const x = (i % 56) * 36 + ((Math.floor(i / 56) % 2) * 18);
        const y = Math.floor(i / 56) * 44 + Math.sin(t + i * 0.3) * 3;
        ctx.globalAlpha = a * 0.35;
        ctx.drawImage(sea, x - 3, y - 3, 6, 6);
      }
      islandPts().forEach(([x, y], i) => {
        ctx.globalAlpha = a * (0.5 + 0.5 * Math.sin(t * 2 + i));
        ctx.drawImage(spr, x - 3, y - 3, 6, 6);
      });
      ctx.restore();
      glow(ctx, 1000, 470, 26, P.ember, a * (0.6 + 0.4 * Math.sin(t * 4)));
      text(ctx, ONSCREEN.island[0], 1240, 450, {size: 40, color: P.ember, weight: 900, alpha: a * span(t, 26, 26.6), glow: 10, align: 'left'});
      text(ctx, ONSCREEN.island[1], 1240, 500, {size: 22, color: P.dim, weight: 400, alpha: a * span(t, 26, 26.6), spacing: 8, align: 'left', italic: true});
    }
    // b 一道门：左边餐厅，右边厨房
    const b = sub(t, 30.9, 56.2, 0.5, 0.6);
    if (b > 0) {
      ctx.save();
      ctx.globalAlpha = b;
      const doorX = W / 2;
      // 左：餐厅，暖光、吊灯、白桌布
      const lg = ctx.createLinearGradient(0, 0, doorX, 0);
      lg.addColorStop(0, '#1C140C');
      lg.addColorStop(1, '#2A1E12');
      ctx.fillStyle = lg;
      ctx.fillRect(0, 0, doorX, H);
      for (const cx of [300, 680]) {
        line(ctx, [[cx, 0], [cx, 150]], P.gold, 2, b, 0);
        for (let k = 0; k < 9; k++) glow(ctx, cx + Math.cos((k / 9) * Math.PI * 2) * 60, 180 + Math.sin((k / 9) * Math.PI * 2) * 18, 26, P.ember, b);
        spotlight(ctx, cx, 800, 520, b * 0.6);
        ctx.fillStyle = 'rgba(233,227,214,0.85)';
        ctx.beginPath();
        ctx.ellipse(cx, 760, 150, 34, 0, 0, Math.PI * 2);
        ctx.fill();
        glow(ctx, cx - 40, 728, 20, P.ember, b);
        glow(ctx, cx + 40, 728, 20, P.ember, b);
      }
      text(ctx, '餐厅', 480, 120, {size: 40, color: P.ember, weight: 900, alpha: b, glow: 12});
      // 右：厨房，热气、锅、红光
      const rg = ctx.createLinearGradient(doorX, 0, W, 0);
      rg.addColorStop(0, '#1A0A08');
      rg.addColorStop(1, '#2A0E0A');
      ctx.fillStyle = rg;
      ctx.fillRect(doorX, 0, W - doorX, H);
      for (const [px, py] of [
        [1250, 640],
        [1560, 640],
      ]) {
        ctx.fillStyle = '#3A3A40';
        ctx.fillRect(px - 90, py, 180, 70);
        glow(ctx, px, py + 90, 120, P.red, b * 0.7);
        for (let i = 0; i < 90; i++) {
          const k = (hash(i + px) + t * 0.4) % 1;
          glow(ctx, px + (hash(i * 3 + px) - 0.5) * 140 + Math.sin(k * 6 + i) * 30, py - k * 420, 10 + 14 * k, P.paper, b * (1 - k) * 0.3);
        }
      }
      line(ctx, [[1000, 720], [W, 720]], P.dim, 3, b, 0);
      text(ctx, '厨房', 1440, 120, {size: 40, color: P.red, weight: 900, alpha: b, glow: 12});
      // 门
      const swing = Math.max(0, Math.sin(Math.max(0, t - 38.2) * 6) * Math.exp(-Math.max(0, t - 38.2) * 1.6));
      const dw = 150 * (1 - 0.8 * swing);
      ctx.fillStyle = '#3A2614';
      ctx.fillRect(doorX - dw / 2, 300, dw, 600);
      rect(ctx, doorX - dw / 2, 300, dw, 600, P.gold, 4, b);
      glow(ctx, doorX, 520, 40, P.ember, b * 0.6);
      // 服务员：左边端着盘子腰板笔直，右边一下子垮了下来
      const walk = span(t, 34.0, 38.2);
      const both = span(t, 44.0, 44.6);
      if (t < 38.4 || both > 0) {
        const x = both > 0 ? 560 : lerp(260, 820, walk);
        person(ctx, x, 980, 1.05, {t, alpha: b, yaw: 0.6});
        line(ctx, [[x + 30, 790], [x + 120, 790]], P.paper, 6, b, 6);
        glow(ctx, x + 75, 778, 30, P.paper, b * 0.6);
        bubble(ctx, x + 60, 560, '请慢用', {size: 28, alpha: b * span(t, 35.2, 35.6) * (t < 38.2 || both > 0 ? 1 : 0)});
      }
      if (t > 38.2) {
        const x = both > 0 ? 1360 : lerp(1080, 1360, span(t, 38.2, 39.4));
        const laugh = Math.abs(Math.sin(t * 9)) * 10;
        person(ctx, x, 980 - laugh, 1.05, {t, alpha: b, slump: 0.6, yaw: -0.6, color: P.ember});
        [
          [1180, 820, 0.85],
          [1640, 840, 0.9],
        ].forEach(([cx, cy, sc], i) => person(ctx, cx, cy + Math.abs(Math.sin(t * 8 + i)) * 8, sc, {t, seed: i + 3, alpha: b * span(t, 39.0, 39.6), slump: 0.4, yaw: (i ? 0.7 : -0.5)}));
        bubble(ctx, 1290, 380, '那桌真难伺候', {size: 30, dark: true, alpha: b * span(t, 40.8, 41.2)});
        bubble(ctx, 1600, 470, '哈哈哈', {size: 30, dark: true, alpha: b * span(t, 41.4, 41.8)});
        bubble(ctx, 1160, 510, '学他说话', {size: 26, dark: true, alpha: b * span(t, 42.0, 42.4)});
      }
      if (both > 0) {
        line(ctx, [[640, 620], [doorX - 90, 560], [doorX + 90, 560], [1280, 620]], P.red, 3, b * both, 10);
        text(ctx, '同一个人', doorX, 230, {size: 44, color: P.text, weight: 900, alpha: b * both, glow: 12});
      }
      ctx.restore();
    }
    // c 生活就是一场戏：幕布合上把整个旅馆框成舞台
    const c = span(t, 47.8, 49.0);
    if (c > 0) curtain(ctx, lerp(0.85, 0.3, easeInOut(span(t, 48, 55))), t, c);
  };
  return <Canvas s={s} draw={draw} />;
};

/* ================= D4 前台与后台、剧班 ================= */
export const D4: React.FC<SP> = ({s}) => {
  const draw = (ctx: CanvasRenderingContext2D, t: number) => {
    bg(ctx);
    dust(ctx, t, 120, P.gold, 0.3);
    // a 左前台、右后台
    const a = sub(t, 55.6, 65.4, 0.5, 0.5);
    if (a > 0) {
      ctx.save();
      ctx.globalAlpha = a;
      stageFloor(ctx, 760, a);
      // 前台
      spotlight(ctx, 520, 760, 620, a * span(t, 56.0, 56.6));
      person(ctx, 520, 760, 1.15, {t, alpha: a});
      for (let i = 0; i < 18; i++) glow(ctx, 80 + i * 48, 1010 + (i % 2) * 14, 26, '#3A3020', a);
      text(ctx, '前台', 520, 150, {size: 52, color: P.ember, weight: 900, alpha: a * span(t, 56.4, 57), glow: 14});
      // 中间的幕
      ctx.fillStyle = P.velvet;
      ctx.fillRect(W / 2 - 40, 0, 80, H);
      // 后台
      const back = span(t, 61.0, 61.8);
      ctx.fillStyle = `rgba(10,8,6,${0.6})`;
      ctx.fillRect(W / 2 + 40, 0, W / 2, H);
      vanity(ctx, 1480, 420, 300, 260, 1, a * back);
      ctx.fillStyle = 'rgba(60,40,26,0.9)';
      ctx.globalAlpha = a * back;
      ctx.beginPath();
      ctx.roundRect(1180, 800, 520, 90, 30);
      ctx.fill();
      ctx.beginPath();
      ctx.roundRect(1160, 740, 60, 150, 20);
      ctx.roundRect(1660, 740, 60, 150, 20);
      ctx.fill();
      ctx.globalAlpha = a;
      person(ctx, 1420, 860, 0.95, {t, alpha: a * back, slump: 1, yaw: 0.3, color: P.paper});
      text(ctx, '后台', 1440, 150, {size: 52, color: P.dim, weight: 900, alpha: a * back, glow: 6});
      ctx.restore();
    }
    // b 剧班：一排人撑起一块布景板，板后面一片手忙脚乱
    const b = sub(t, 65.2, 78.4, 0.5, 0.5);
    if (b > 0) {
      ctx.save();
      ctx.globalAlpha = b;
      stageFloor(ctx, 760, b);
      const peek = span(t, 75.0, 76.4);
      // 板后面的乱
      for (let i = 0; i < 40; i++) {
        const x = 420 + hash(i) * 1080 + Math.sin(t * 2 + i) * 20;
        const y = 220 + hash(i + 1) * 380;
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(t * (hash(i + 2) - 0.5) * 3 + i);
        ctx.globalAlpha = b * peek * 0.8;
        ctx.fillStyle = i % 4 === 0 ? P.red : P.paper;
        ctx.fillRect(-26, -18, 52, 36);
        ctx.restore();
      }
      // 布景板
      const boardA = 1 - 0.75 * peek;
      ctx.globalAlpha = b * boardA;
      const g = ctx.createLinearGradient(0, 200, 0, 620);
      g.addColorStop(0, '#3A2A18');
      g.addColorStop(1, '#22180E');
      ctx.fillStyle = g;
      ctx.fillRect(380, 200, 1160, 420);
      ctx.globalAlpha = b;
      rect(ctx, 380, 200, 1160, 420, P.gold, 5, b);
      const word = t < 71.8 ? '体面' : '专业';
      text(ctx, word, W / 2, 410, {size: 160, color: P.ember, weight: 900, alpha: b * boardA, glow: 24, spacing: 20});
      // 撑板子的人
      for (let i = 0; i < 6; i++) {
        const x = 470 + i * 196;
        person(ctx, x, 830, 0.8, {t, seed: i, alpha: b, color: P.gold});
      }
      text(ctx, '剧班', W / 2, 130, {size: 56, color: P.ember, weight: 900, alpha: b * span(t, 75, 75.6), glow: 14, spacing: 12});
      ctx.restore();
    }
    // c 不小心看见了后台：幕布一角被掀起
    const c = span(t, 78.0, 78.8);
    if (c > 0) {
      ctx.save();
      ctx.globalAlpha = c;
      // 后台：脚手架、绳子、坐着歇气的人
      for (let i = 0; i < 6; i++) line(ctx, [[400 + i * 230, 1080], [400 + i * 230, 260]], '#8A6A40', 5, c, 3);
      for (let k = 0; k < 4; k++) line(ctx, [[300, 300 + k * 180], [1620, 320 + k * 180]], '#6A4E30', 3, c, 0);
      for (let i = 0; i < 4; i++) person(ctx, 560 + i * 280, 1000, 0.85, {t, seed: i, alpha: c, slump: 0.9, yaw: (hash(i) - 0.5) * 1.4, color: P.paper});
      ctx.restore();
      const lift = easeOut(span(t, 78.6, 80.4));
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(W, 0);
      ctx.lineTo(W, H);
      ctx.lineTo(lerp(W, W * 0.55, lift), H);
      ctx.quadraticCurveTo(lerp(W, W * 0.62, lift), lerp(H, H * 0.45, lift), lerp(W, W * 0.15, lift), lerp(H, 0, lift) + 0.01);
      ctx.lineTo(0, 0);
      ctx.closePath();
      ctx.clip();
      curtain(ctx, 0, t, 1);
      ctx.restore();
    }
  };
  return <Canvas s={s} draw={draw} />;
};

/* ================= D5 拿自己的后台比别人的前台 ================= */
export const D5: React.FC<SP> = ({s}) => {
  const draw = (ctx: CanvasRenderingContext2D, t: number) => {
    bg(ctx);
    const a = sub(t, 85.6, 101.0, 0.5, 0.6);
    if (a > 0) {
      ctx.save();
      ctx.globalAlpha = a;
      // 左：我的后台，乱糟糟
      const lg = ctx.createLinearGradient(0, 0, 0, H);
      lg.addColorStop(0, '#120C0A');
      lg.addColorStop(1, '#1C100C');
      ctx.fillStyle = lg;
      ctx.fillRect(0, 0, W / 2, H);
      for (let i = 0; i < 24; i++) {
        ctx.save();
        ctx.translate(120 + hash(i) * 720, 640 + hash(i + 1) * 300);
        ctx.rotate(hash(i + 2) * 3);
        ctx.globalAlpha = a * 0.7;
        ctx.fillStyle = i % 3 === 0 ? '#6A3A30' : '#4A4038';
        ctx.fillRect(-40, -14, 80, 28);
        ctx.restore();
      }
      glow(ctx, 260, 380, 140, '#9FC8FF', a * 0.25);
      person(ctx, 480, 900, 1.05, {t, alpha: a, slump: 1, yaw: 0.4, color: '#C9A88A'});
      text(ctx, '我的后台', 480, 150, {size: 48, color: P.dim, weight: 900, alpha: a * span(t, 90, 90.6)});
      // 右：别人的前台，聚光灯和掌声
      const right = span(t, 92.8, 93.4);
      spotlight(ctx, 1440, 900, 700, a * right);
      confetti(ctx, t, 1000, 1880, a * right, 140);
      person(ctx, 1440, 900, 1.1, {t, alpha: a * right, color: P.ember});
      text(ctx, '别人的前台', 1440, 150, {size: 48, color: P.ember, weight: 900, alpha: a * right, glow: 14});
      line(ctx, [[W / 2, 100], [W / 2, 980]], P.faint, 2, a, 0);
      // 天平：怎么比都输
      const sc = span(t, 96.2, 97.4);
      if (sc > 0) {
        const tilt = lerp(0, 0.22, easeOut(span(t, 96.6, 98.2)));
        ctx.save();
        ctx.translate(W / 2, 560);
        ctx.globalAlpha = a * sc;
        line(ctx, [[0, 0], [0, 260]], P.gold, 6, a * sc);
        ctx.rotate(tilt);
        line(ctx, [[-420, 0], [420, 0]], P.gold, 6, a * sc);
        for (const sd of [-1, 1]) {
          line(ctx, [[sd * 420, 0], [sd * 420 - 60, 120], [sd * 420 + 60, 120], [sd * 420, 0]], P.gold, 3, a * sc);
          glow(ctx, sd * 420, 120, 60, sd < 0 ? P.red : P.ember, a * sc * 0.7);
        }
        ctx.restore();
      }
      ctx.restore();
    }
    // 每个看起来从容的人，后台都和你差不多乱
    const b = span(t, 100.8, 101.6);
    if (b > 0) {
      ctx.save();
      ctx.globalAlpha = b;
      stageFloor(ctx, 540, b);
      const reveal = easeInOut(span(t, 103.4, 106.0));
      for (let i = 0; i < 5; i++) {
        const x = 360 + i * 300;
        spotlight(ctx, x, 540, 280, b * (1 - reveal * 0.7));
        person(ctx, x, 540, 0.85, {t, seed: i, alpha: b, color: P.ember});
        // 台下：他们各自的后台，和你的一样乱
        ctx.save();
        ctx.globalAlpha = b * reveal;
        for (let k = 0; k < 6; k++) {
          ctx.save();
          ctx.translate(x + (hash(i * 9 + k) - 0.5) * 200, 700 + hash(i * 7 + k) * 110);
          ctx.rotate(hash(k + i) * 3);
          ctx.fillStyle = k % 3 === 0 ? '#6A3A30' : '#4A4038';
          ctx.fillRect(-30, -10, 60, 20);
          ctx.restore();
        }
        ctx.restore();
        person(ctx, x, 830, 0.62, {t, seed: i + 10, alpha: b * reveal, slump: 1, color: '#C9A88A'});
      }
      ctx.restore();
    }
  };
  return <Canvas s={s} draw={draw} />;
};

/* ================= D6 演，也是体面 ================= */
export const D6: React.FC<SP> = ({s}) => {
  const draw = (ctx: CanvasRenderingContext2D, t: number) => {
    bg(ctx);
    dust(ctx, t, 140, P.gold, 0.35);
    // a 戴久了的面具，和脸长在了一起
    const a = sub(t, 113.6, 118.6, 0.5, 0.5);
    if (a > 0) {
      ctx.save();
      ctx.globalAlpha = a;
      vanity(ctx, 1260, 480, 420, 480, 1, a);
      person(ctx, 640, 980, 1.25, {t, alpha: a, yaw: 0.4});
      const merge = easeInOut(span(t, 115.2, 117.6));
      const mx = lerp(900, 660, merge);
      const my = lerp(430, 655, merge);
      ctx.save();
      ctx.translate(mx, my);
      ctx.globalAlpha = a * (1 - merge * 0.6);
      ctx.fillStyle = P.paper;
      ctx.beginPath();
      ctx.ellipse(0, 0, 46, 58, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = P.ink;
      ctx.beginPath();
      ctx.ellipse(-16, -10, 8, 5, 0, 0, Math.PI * 2);
      ctx.ellipse(16, -10, 8, 5, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = P.ink;
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(0, 14, 18, 0.2, Math.PI - 0.2);
      ctx.stroke();
      ctx.restore();
      ctx.restore();
    }
    // b 忍住、好好说话、不甩情绪：人与人之间牵起的光线
    const b = sub(t, 118.4, 128.4, 0.5, 0.5);
    if (b > 0) {
      ctx.save();
      ctx.globalAlpha = b;
      const pts = [
        [300, 820],
        [620, 760],
        [960, 800],
        [1300, 760],
        [1620, 820],
      ];
      pts.forEach(([x, y], i) => person(ctx, x, y, 0.85, {t, seed: i, alpha: b * span(t, 118.6 + i * 0.3, 119.2 + i * 0.3), yaw: (i - 2) * 0.25}));
      const linkP = span(t, 123.6, 126.4);
      for (let i = 0; i < pts.length - 1; i++) {
        const f = clamp01(linkP * 4 - i);
        if (f <= 0) continue;
        const [x0, y0] = pts[i];
        const [x1, y1] = pts[i + 1];
        const seg: [number, number][] = [];
        for (let k = 0; k <= 20 * f; k++) {
          const u = k / 20;
          seg.push([lerp(x0, x1, u), lerp(y0 - 240, y1 - 240, u) - Math.sin(u * Math.PI) * 60]);
        }
        line(ctx, seg, P.ember, 4, b, 16);
      }
      ['忍住', '好好说话', '不甩情绪'].forEach((w, i) => bubble(ctx, [620, 960, 1300][i], 380, w, {size: 30, alpha: b * span(t, 119.6 + i * 1.1, 120.0 + i * 1.1)}));
      text(ctx, '体面', W / 2, 200, {size: 80, color: P.ember, weight: 900, alpha: b * span(t, 125.4, 126.2), glow: 20, spacing: 16});
      ctx.restore();
    }
    // c 所有人一起，把舞台撑在头顶
    const c = span(t, 128.0, 128.8);
    if (c > 0) {
      ctx.save();
      ctx.globalAlpha = c;
      const rise = easeOut(span(t, 128.4, 131.0));
      const lift = lerp(160, 0, rise);
      const stageY = 520 + lift;
      ctx.fillStyle = '#2A1C10';
      ctx.fillRect(260, stageY, 1400, 40);
      line(ctx, [[260, stageY], [1660, stageY]], P.gold, 5, c);
      spotlight(ctx, W / 2, stageY, 700, c * rise);
      for (let i = 0; i < 3; i++) person(ctx, 760 + i * 200, stageY, 0.62, {t, seed: i + 20, alpha: c * rise, color: P.ember, yaw: (i - 1) * 0.5});
      confetti(ctx, t, 500, 1420, c * rise * 0.6, 80);
      // 头顶托着舞台的一排人，后面还有一排
      for (let r = 1; r >= 0; r--) {
        for (let i = 0; i < 9; i++) {
          const x = 330 + i * 158 + (r % 2) * 79;
          const sc = r === 0 ? 0.62 : 0.75;
          const y = r === 0 ? stageY + 40 + 250 * sc : 900;
          person(ctx, x, y, sc, {t, seed: r * 9 + i, alpha: c * 0.9, color: r === 0 ? P.gold : '#C9A060'});
        }
      }
      ctx.restore();
    }
  };
  return <Canvas s={s} draw={draw} />;
};

/* ================= D7 谢幕，给自己留一个后台 ================= */
export const D7: React.FC<SP> = ({s}) => {
  const draw = (ctx: CanvasRenderingContext2D, t: number) => {
    bg(ctx);
    const a = sub(t, 139.6, 150.4, 0.5, 0.6);
    if (a > 0) {
      ctx.save();
      ctx.globalAlpha = a;
      stageFloor(ctx, 780, a);
      curtain(ctx, 0.8, t, a);
      const turn = span(t, 146.0, 149.0);
      const x = lerp(W / 2, 1500, easeInOut(turn));
      spotlight(ctx, W / 2, 780, 700, a * (1 - turn * 0.8));
      const bow = t > 141.6 && t < 145 ? Math.sin(((t - 141.6) / 3.4) * Math.PI) : 0;
      person(ctx, x, 780 + bow * 10, 1.15, {t, alpha: a, slump: bow * 0.8, yaw: turn * 1.2});
      for (let i = 0; i < 20; i++) glow(ctx, 70 + i * 92, 1030 + (i % 2) * 14, 30, '#3A3020', a);
      confetti(ctx, t, 300, 1620, a * span(t, 141.8, 142.6) * (1 - turn), 120);
      ctx.restore();
    }
    const b = span(t, 149.8, 150.8);
    if (b > 0) {
      ctx.save();
      ctx.globalAlpha = b;
      const on = 1 - span(t, 152.6, 158.0);
      vanity(ctx, W / 2, 420, 520, 380, on, b);
      const end = span(t, 153.0, 154.4);
      person(ctx, W / 2, 1000, 1.05, {t, alpha: b * (0.5 + 0.5 * on) * (1 - end), slump: 0.5, color: P.paper});
      text(ctx, ONSCREEN.end[0], W / 2, 860, {size: 96, color: P.text, weight: 900, alpha: end, glow: 20, spacing: 8});
      text(ctx, ONSCREEN.end[1], W / 2, 960, {size: 34, color: '#CFC8BA', weight: 400, alpha: span(t, 153.8, 155), italic: true, spacing: 2});
      ctx.restore();
    }
  };
  return <Canvas s={s} draw={draw} />;
};

export const _k = {SANS, SERIF, H};

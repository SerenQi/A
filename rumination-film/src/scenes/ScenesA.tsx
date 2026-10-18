import React from 'react';
import {FONTS, H, ONSCREEN, PALETTE as P, W} from '../config';
import {clamp01, easeInOut, easeOut, hash, lerp, span, win} from '../lib/anim';
import {Bubble, SP, Txt} from '../components/Kit';
import {Canvas} from '../components/Canvas';
import {SHAPES} from '../components/Dots';
import {COW, N, centroidOf, cowCloud, headCloud, personCloud, textCloud} from '../lib/clouds';
import {Cam3, P3, drawPoints, lerp3, scatter} from '../lib/points';
import {bedPoint, drawRoom} from '../lib/room';
import {paintCanvas, halftone} from '../lib/halftone';
import {paintHead, paintRoom} from '../lib/paint';
import {bg, bokeh, dust, flowRing, glowDot, mixColor, streaks} from './draw';

const Svg: React.FC<{children: React.ReactNode}> = ({children}) => (
  <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{position: 'absolute', inset: 0}}>
    <defs>
      <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
        <feGaussianBlur stdDeviation="5" result="b" />
        <feMerge>
          <feMergeNode in="b" />
          <feMergeNode in="SourceGraphic" />
        </feMerge>
      </filter>
    </defs>
    {children}
  </svg>
);

const Clock: React.FC<{text: string; warm?: boolean; o?: number}> = ({text, warm, o = 1}) => (
  <g opacity={o}>
    <text x={1770} y={900} textAnchor="end" fontFamily={FONTS.sans} fontWeight={600} fontSize={72} fill={warm ? P.ember : P.gold} letterSpacing={4} filter="url(#glow)">
      {text}
    </text>
    <line x1={1480} x2={1770} y1={924} y2={924} stroke={P.gold} strokeWidth={2} opacity={0.5} />
  </g>
);

/* ---------------- 躺在床上的人 + 头顶的圈（R1、R8 共用） ---------------- */
export const lyingPerson = (ctx: CanvasRenderingContext2D, t: number, alpha = 1) => {
  const pc = personCloud(1400);
  const [bx, by] = bedPoint(0.42, 0.4);
  const pts = pc.map((p) => ({x: -p.y * 1.25, y: p.x * 0.5 + p.z * 0.25, z: p.z}));
  drawPoints(ctx, pts, {yaw: 0, pitch: 0, cx: bx, cy: by - 30, scale: 1.3}, {color: P.gold, size: 4.5, alpha: 0.8 * alpha, t});
  // 枕边手机的光
  const g = ctx.createRadialGradient(bx + 260, by - 30, 0, bx + 260, by - 30, 380);
  g.addColorStop(0, 'rgba(159,200,255,0.28)');
  g.addColorStop(1, 'rgba(159,200,255,0)');
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  ctx.globalAlpha = alpha * (0.8 + 0.2 * Math.sin(t * 3));
  ctx.fillStyle = g;
  ctx.fillRect(bx - 700, by - 500, 1000, 800);
  ctx.restore();
  return {hx: bx + 200, hy: by - 20};
};

/* ================= R1 开头：四种内耗 ================= */
export const R1: React.FC<SP> = ({s}) => {
  const a = win(s, -1, 3.6, 0.1, 0.4);
  const b = win(s, 3.3, 6.8, 0.3, 0.4);
  const c = win(s, 6.5, 9.9, 0.3, 0.4);
  const d = span(s, 9.5, 10.0);
  const draw = (ctx: CanvasRenderingContext2D, t: number) => {
    bg(ctx);
    if (a > 0) {
      ctx.save();
      ctx.globalAlpha = a;
      const z = lerp(1.0, 1.1, span(t, 0, 3.6));
      ctx.translate(W / 2, H / 2);
      ctx.scale(z, z);
      ctx.translate(-W / 2 - 80, -H / 2 + 30);
      ctx.restore();
      const pc = paintCanvas();
      pc.translate(W / 2, H / 2);
      pc.scale(z, z);
      pc.translate(-W / 2 - 80, -H / 2 + 30);
      const {hx, hy} = paintRoom(pc, t, 0);
      halftone(ctx, {cell: 8, alpha: a, t, gamma: 1.3, min: 0.06});
      ctx.save();
      ctx.translate(W / 2, H / 2);
      ctx.scale(z, z);
      ctx.translate(-W / 2 - 80, -H / 2 + 30);
      dust(ctx, t, 120, P.gold, 0.4 * a);
      flowRing(ctx, t, {yaw: 0, pitch: 0.35, cx: hx, cy: hy - 110, scale: 1}, {R: 110, r: 8, n: 800, speed: 1.4, color: P.red, size: 4.5, alpha: a});
      ctx.restore();
    }
    if (b > 0) {
      ctx.save();
      ctx.globalAlpha = b;
      bokeh(ctx, t, 80);
      dust(ctx, t, 160, P.gold, 0.5 * b);
      ctx.restore();
    }
    if (c > 0) {
      ctx.save();
      ctx.globalAlpha = c;
      const flinch = t > 7.4 ? Math.exp(-(t - 7.4) * 5) * Math.sin((t - 7.4) * 50) * 14 : 0;
      const pc = paintCanvas();
      paintHead(pc, 640 + flinch, 1020, 1.7, 0.9, 1);
      pc.save();
      pc.globalCompositeOperation = 'lighter';
      for (let i = 0; i < 90; i++) {
        const x = hash(i) * W;
        const y = ((t * (900 + hash(i + 1) * 600) + hash(i + 2) * (H + 400)) % (H + 400)) - 300;
        pc.strokeStyle = `rgba(255,255,255,${0.25 + hash(i + 4) * 0.3})`;
        pc.lineWidth = 6;
        pc.beginPath();
        pc.moveTo(x, y);
        pc.lineTo(x - 8, y + 120);
        pc.stroke();
      }
      pc.restore();
      halftone(ctx, {cell: 8, alpha: c, t});
      // 碎片一样飞进来的旧画面
      for (let i = 0; i < 14; i++) {
        const k = clamp01((t - 7.2 - i * 0.04) / 0.6);
        if (k <= 0) continue;
        const e = easeOut(k);
        const tx = 1300 + (hash(i) - 0.5) * 520;
        const ty = 470 + (hash(i + 1) - 0.5) * 360;
        const x = lerp(W + 300, tx, e);
        const y = lerp(ty - 200, ty, e);
        const r = 50 + hash(i + 2) * 70;
        const rot = (1 - e) * 3 + hash(i + 3) * 0.6;
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(rot);
        ctx.beginPath();
        ctx.moveTo(-r, -r * 0.6);
        ctx.lineTo(r * 0.9, -r * 0.4);
        ctx.lineTo(r * 0.3, r * 0.8);
        ctx.closePath();
        const g = ctx.createLinearGradient(-r, -r, r, r);
        g.addColorStop(0, `rgba(233,227,214,${0.5 * c})`);
        g.addColorStop(1, i % 4 === 0 ? `rgba(229,72,60,${0.6 * c})` : `rgba(232,194,122,${0.3 * c})`);
        ctx.fillStyle = g;
        ctx.fill();
        ctx.strokeStyle = `rgba(255,255,255,${0.6 * c})`;
        ctx.lineWidth = 1.5;
        ctx.stroke();
        ctx.restore();
      }
      ctx.restore();
    }
    if (d > 0) {
      ctx.save();
      ctx.globalAlpha = d;
      dust(ctx, t, 200, P.gold, 0.5);
      const yaw = -0.5 + (t - 9.5) * 0.2;
      const cam: Cam3 = {yaw, pitch: 0.08, cx: W / 2, cy: 560, scale: 1.05};
      drawPoints(ctx, headCloud(), cam, {color: P.gold, size: 4.4, alpha: 0.8 * d, t, shade: true});
      const speed = 1 + span(t, 9.7, 12.8) * 3;
      for (let k = 0; k < 4; k++) {
        flowRing(ctx, t * speed + k, cam, {
          R: 230 + k * 90,
          r: 8 + k * 2,
          n: 900,
          speed: 1.1 - k * 0.15,
          color: k % 2 ? P.red : P.ember,
          size: 4.5,
          alpha: span(t, 9.7 + k * 0.3, 10.3 + k * 0.3) * d,
          center: {x: 0, y: -110, z: 0},
          tilt: 0.25 + k * 0.12,
        });
      }
      ctx.restore();
    }
  };
  return (
    <>
      <Canvas s={s} draw={draw} />
      <Svg>
        {a > 0 && <Clock text="03:00" o={a} />}
        {b > 0 && (
          <g opacity={b}>
            <Txt x={W / 2} y={300} text="23:14" size={24} color={P.dim} o={span(s, 3.5, 3.9)} />
            <Bubble x={1060} y={390} w={340} h={80} text="在吗，那天的事" size={32} tail="r" color="#E8C27A" o={span(s, 3.6, 4.0)} />
            <Txt x={1225} y={462} text="已读" size={22} color={P.dim} anchor="end" o={span(s, 4.2, 4.5)} />
            <Txt x={W / 2} y={560} text="02:47" size={24} color={P.dim} o={span(s, 5.0, 5.4)} />
            <Txt x={700} y={640} text={Math.sin(s * 6) > 0 ? '对方正在输入…' : ''} size={28} color={P.dim} anchor="start" o={span(s, 5.2, 5.5)} />
          </g>
        )}
        {c > 0 && <Txt x={1300} y={760} text="三年前" size={30} color={P.paper} o={span(s, 7.6, 8.2) * c} spacing={10} />}
      </Svg>
    </>
  );
};

/* ================= R2 标题：头像炸开，聚成“反刍思维” ================= */
export const R2: React.FC<SP> = ({s}) => {
  const draw = (ctx: CanvasRenderingContext2D, t: number) => {
    bg(ctx);
    dust(ctx, t, 260, P.gold, 0.55);
    const head = headCloud();
    const text = textCloud(ONSCREEN.title, 240);
    const sc = scatter(N, 2600, 1500, 1400, 21);
    const yaw0 = -0.5 + (12.8 - 9.5) * 0.2;
    const boom = span(t, 12.8, 13.7, easeOut);
    const gather = span(t, 13.5, 14.9);
    const out = span(t, 16.7, 17.6);
    const yaw = lerp(yaw0, 0, gather) + Math.sin(t) * 0.04 * gather;
    const pts: P3[] = new Array(N);
    for (let i = 0; i < N; i++) {
      const dl = hash(i * 0.91) * 0.3;
      const g = easeInOut((gather - dl) / 0.7);
      const o = easeInOut((out - dl) / 0.7);
      const hp = {x: head[i].x, y: head[i].y, z: head[i].z};
      const swirl = (1 - g) * boom;
      const sp = sc[i];
      const ang = t * 0.6 * swirl;
      const sx = sp.x * Math.cos(ang) - sp.z * Math.sin(ang);
      const sz = sp.x * Math.sin(ang) + sp.z * Math.cos(ang);
      const mid = lerp3(hp, {x: sx, y: sp.y, z: sz}, boom);
      const p = lerp3(mid, text[i], g);
      pts[i] = lerp3(p, {x: sp.x * 1.4, y: sp.y * 1.4 - 200, z: sp.z}, o);
    }
    drawPoints(ctx, pts, {yaw, pitch: 0.02, cx: W / 2, cy: 500, scale: 1}, {color: P.ember, size: lerp(4.2, 3.6, gather), alpha: 0.85, t, twinkle: 0.25, shade: gather < 0.5});
  };
  return (
    <>
      <Canvas s={s} draw={draw} />
      <Svg>
        <Txt x={W / 2} y={340} text={ONSCREEN.en} size={24} color={P.gold} o={span(s, 14.4, 15.0) * (1 - span(s, 16.8, 17.4))} spacing={20} />
        <Txt x={W / 2} y={690} text={ONSCREEN.kicker} size={38} color={P.text} o={span(s, 14.6, 15.2) * (1 - span(s, 16.8, 17.4))} spacing={10} font={FONTS.body} />
      </Svg>
    </>
  );
};

/* ================= R3 牛的反刍 → 粒子变成人头 ================= */
export const R3: React.FC<SP> = ({s}) => {
  const draw = (ctx: CanvasRenderingContext2D, t: number) => {
    bg(ctx, '#05060A', '#0B0E0A');
    dust(ctx, t, 160, P.gold, 0.4);
    const cow = cowCloud();
    const head = headCloud();
    const cc = centroidOf(COW.body, 2.0, {d: COW.limbs, w: 22});
    const morph = span(t, 22.5, 24.2);
    const assemble = span(t, 17.2, 18.6);
    const sc = scatter(N, 2600, 1500, 1400, 31);
    const cowCam: Cam3 = {yaw: -0.35 + Math.sin(t * 0.4) * 0.08, pitch: 0.12, cx: 900, cy: 520, scale: 0.95};
    const headCam: Cam3 = {yaw: -0.3 + (t - 24) * 0.05, pitch: 0.05, cx: 860, cy: 560, scale: 1.0};
    const yaw = lerp(cowCam.yaw, headCam.yaw, morph);
    const cam: Cam3 = {yaw, pitch: lerp(cowCam.pitch, headCam.pitch, morph), cx: lerp(cowCam.cx, headCam.cx, morph), cy: lerp(cowCam.cy, headCam.cy, morph), scale: lerp(cowCam.scale!, headCam.scale!, morph)};
    // 草地
    if (morph < 1) {
      ctx.save();
      ctx.globalAlpha = 1 - morph;
      const ground: P3[] = Array.from({length: 1400}, (_, i) => ({x: (hash(i * 1.3) - 0.5) * 2600, y: 150 + hash(i * 2.2) * 6, z: (hash(i * 3.1) - 0.5) * 1600}));
      drawPoints(ctx, ground, cowCam, {color: '#9A8458', size: 3, alpha: 0.35, t});
      ctx.restore();
    }
    const pts: P3[] = new Array(N);
    for (let i = 0; i < N; i++) {
      const dl = hash(i * 0.53) * 0.35;
      const a = easeInOut((assemble - dl) / 0.65);
      const m = easeInOut((morph - dl) / 0.65);
      const base = lerp3(sc[i], cow[i], a);
      const lift = Math.sin(m * Math.PI) * (hash(i) - 0.5) * 500;
      const p = lerp3(base, head[i], m);
      pts[i] = {x: p.x + lift * 0.4, y: p.y - Math.abs(lift) * 0.3, z: p.z + lift};
    }
    const col = morph > 0.5 ? P.gold : P.gold;
    drawPoints(ctx, pts, cam, {color: col, size: 4.4, alpha: 0.95, t, shade: true});
    // 草团：嘴 → 胃 → 嘴，一圈一圈
    if (morph < 1) {
      const mouth = {x: 395 * 2 - cc.x, y: -135 * 2 - cc.y};
      const belly = {x: -20 * 2 - cc.x, y: -100 * 2 - cc.y};
      const cud: P3[] = Array.from({length: 360}, (_, i) => {
        const ph = (i / 360 + t * 0.35) % 1;
        const ang = ph * Math.PI * 2;
        const mx = (mouth.x + belly.x) / 2;
        const my = (mouth.y + belly.y) / 2;
        const rx = (mouth.x - belly.x) / 2;
        return {x: mx + Math.cos(ang) * rx, y: my + Math.sin(ang) * 70, z: Math.sin(ang * 2) * 20 + (hash(i) - 0.5) * 20};
      });
      ctx.save();
      ctx.globalAlpha = span(t, 18.4, 19.0) * (1 - morph);
      drawPoints(ctx, cud, cowCam, {color: P.ember, size: 7, alpha: 1, t, twinkle: 0.1});
      ctx.restore();
    }
    // 人脑里的圈
    if (morph > 0.6) {
      const laps = Math.max(0, t - 24.9);
      for (let k = 0; k < Math.min(5, 1 + Math.floor(laps * 0.8)); k++) {
        flowRing(ctx, t + k * 0.4, cam, {R: 200 + k * 26, r: 7, n: 700, speed: 1.3, color: k === 0 ? P.ember : P.red, size: 4.5, alpha: (morph - 0.6) * 2.5 * (k === 0 ? 1 : 0.55), center: {x: 30, y: -120, z: 0}, tilt: 0.3 + k * 0.05});
      }
      glowDot(ctx, cam.cx + 30, cam.cy - 120, 220, P.gold, 0.25 * morph);
    }
  };
  return <Canvas s={s} draw={draw} />;
};

/* ================= R4 绕着答案转圈 ================= */
export const R4: React.FC<SP> = ({s}) => {
  const ans = span(s, 28.6, 29.6);
  const reveal = span(s, 37.3, 38.8);
  const draw = (ctx: CanvasRenderingContext2D, t: number) => {
    bg(ctx);
    dust(ctx, t, 220, P.gold, 0.45);
    const cam: Cam3 = {yaw: t * 0.05, pitch: lerp(0.32, 1.5, reveal), cx: W / 2, cy: 470, scale: 1};
    // 核心：答案
    glowDot(ctx, W / 2, 470, 260, P.ember, 0.5 * ans);
    glowDot(ctx, W / 2, 470, 60, '#FFFFFF', 0.8 * ans);
    // 粒子环：一直绕，距离不变
    flowRing(ctx, t, cam, {R: 420, r: 26, n: 4200, speed: 0.9, color: P.gold, size: 4.5, alpha: 0.85});
    flowRing(ctx, t + 3, cam, {R: 420, r: 6, n: 900, speed: 0.9, color: P.ember, size: 6, alpha: 0.9});
    // 领头的光点与它到答案的距离
    const a = t * 1.4;
    const lead = {x: Math.cos(a) * 420, y: 0, z: Math.sin(a) * 420};
    const yaw = cam.yaw;
    const cy = Math.cos(yaw);
    const sy = Math.sin(yaw);
    const x1 = lead.x * cy + lead.z * sy;
    const z1 = -lead.x * sy + lead.z * cy;
    const y2 = -z1 * Math.sin(cam.pitch);
    const z2 = z1 * Math.cos(cam.pitch);
    const k = 1400 / (1400 + z2);
    const px = W / 2 + x1 * k;
    const py = 470 + y2 * k;
    for (let i = 0; i < 26; i++) {
      const b = a - i * 0.05;
      const q = {x: Math.cos(b) * 420, z: Math.sin(b) * 420};
      const qx1 = q.x * cy + q.z * sy;
      const qz1 = -q.x * sy + q.z * cy;
      const qk = 1400 / (1400 + qz1 * Math.cos(cam.pitch));
      glowDot(ctx, W / 2 + qx1 * qk, 470 - qz1 * Math.sin(cam.pitch) * qk, 26 * (1 - i / 26), P.ember, 0.9 * (1 - i / 26));
    }
    if (reveal > 0) {
      ctx.save();
      ctx.setLineDash([10, 12]);
      ctx.strokeStyle = `rgba(229,72,60,${0.85 * reveal})`;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(px, py);
      ctx.lineTo(W / 2, 470);
      ctx.stroke();
      ctx.restore();
    }
  };
  return (
    <>
      <Canvas s={s} draw={draw} />
      <Svg>
        <Txt x={W / 2} y={560} text="答案" size={44} color={P.ember} o={ans} font={FONTS.title} weight={600} spacing={12} glow />
      </Svg>
    </>
  );
};

export const _keep = {SHAPES, mixColor};

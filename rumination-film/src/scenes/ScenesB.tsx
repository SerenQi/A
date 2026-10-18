import React from 'react';
import {FONTS, H, PALETTE as P, W} from '../config';
import {clamp01, easeInOut, easeOut, hash, lerp, span, win} from '../lib/anim';
import {Bubble, SP, Txt} from '../components/Kit';
import {Canvas} from '../components/Canvas';
import {personCloud, slumpCloud} from '../lib/clouds';
import {Cam3, P3, drawPoints, glowSprite, lerp3, sphere} from '../lib/points';
import {drawRoom, windowCenter} from '../lib/room';
import {bg, dotFloor, dust, flowRing, glowDot, glowLine, mixColor} from './draw';
import {paintCanvas, halftone} from '../lib/halftone';
import {paintRoom} from '../lib/paint';
import {lyingPerson} from './ScenesA';

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

const q = (v: number) => Math.round(v * 20) / 20;

/* ================= R5 实验：两组人，八分钟 ================= */
const L = 480;
const R = 1440;
const HORIZON = 300;

export const R5: React.FC<SP> = ({s}) => {
  const people = span(s, 42.0, 43.2);
  const leftThink = span(s, 48.9, 49.8);
  const rightThink = span(s, 52.3, 53.2);
  const timerP = clamp01((s - 48.9) / (57.0 - 48.9));
  const secs = Math.round(timerP * 480);
  const timer = `${Math.floor(secs / 60)}:${String(secs % 60).padStart(2, '0')}`;
  const leftDown = span(s, 57.3, 59.6);
  const rightUp = span(s, 60.3, 62.6);
  const solve = span(s, 65.6, 66.6);
  const draw = (ctx: CanvasRenderingContext2D, t: number) => {
    bg(ctx, '#05060A', '#0D0B08');
    dotFloor(ctx, HORIZON + 40, 0.55 * people);
    dust(ctx, t, 140, P.gold, 0.35);
    // 中线
    ctx.save();
    ctx.strokeStyle = `rgba(232,194,122,${0.25 * people})`;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(W / 2, 160);
    ctx.lineTo(W / 2, 920);
    ctx.stroke();
    ctx.restore();
    // 两组人：两排，站在透视地面上
    const pc = personCloud(500);
    const sl = slumpCloud(500);
    [L, R].forEach((gx, gi) => {
      const slump = gi === 0 ? 0.5 + 0.5 * leftDown : 0.5 - 0.5 * rightUp;
      const col = gi === 0 ? mixColor('#A89E8C', '#B5524A', q(leftDown)) : mixColor('#A89E8C', '#F2C27A', q(rightUp));
      for (let row = 0; row < 2; row++) {
        for (let k = 0; k < 4; k++) {
          const idx = row * 4 + k;
          const sc = row === 0 ? 0.62 : 0.8;
          const x = gx + (k - 1.5) * (row === 0 ? 150 : 190) + (row === 0 ? 40 : -20);
          const y = row === 0 ? 600 : 720;
          const pts = pc.map((p, i) => lerp3(p, sl[i], slump));
          const appear = span(t, 42.0 + idx * 0.08, 43.2 + idx * 0.08);
          drawPoints(ctx, pts, {yaw: -0.3 + hash(idx + gi * 9) * 0.6, pitch: 0, cx: x, cy: y - 130 * sc, scale: sc}, {color: col, size: 3.8, alpha: 0.9 * appear * (1 - 0.5 * solve), t: t + idx, shade: true});
        }
      }
    });
    // 左：每个人头上都在绕圈，上空压着一团阴云
    if (leftThink > 0) {
      const a = leftThink * (1 - solve);
      flowRing(ctx, t, {yaw: 0, pitch: 0.32, cx: L, cy: 410, scale: 1}, {R: 330, r: 30, n: 2600, speed: 1.6, color: P.red, size: 4.5, alpha: 0.75 * a});
      const cloud: P3[] = sphere(1400, 260, 41).map((p) => ({x: p.x * 1.6, y: p.y * 0.35, z: p.z * 0.6}));
      ctx.save();
      ctx.globalAlpha = a * span(t, 50, 57);
      drawPoints(ctx, cloud, {yaw: t * 0.05, pitch: 0, cx: L, cy: 200, scale: 1}, {color: '#7A6A5A', size: 6, alpha: 0.45, t});
      ctx.restore();
    }
    // 右：想些不相干的画面——漂浮的小星团
    if (rightThink > 0) {
      const a = rightThink * (1 - solve);
      for (let c = 0; c < 9; c++) {
        const cx = R - 330 + hash(c) * 660 + Math.sin(t * 0.4 + c) * 30;
        const cy = 230 + hash(c + 3) * 170 + Math.cos(t * 0.5 + c) * 16;
        const blob = sphere(140, 30 + hash(c + 5) * 26, 50 + c);
        drawPoints(ctx, blob, {yaw: t * 0.6 + c, pitch: 0.4, cx, cy, scale: 1}, {color: [P.gold, P.paper, P.ember][c % 3], size: 4, alpha: 0.8 * a, t});
      }
    }
    // 心情曲线
    const curve = (gx: number, dir: number, p: number, col: string) => {
      const pts: [number, number][] = [];
      for (let i = 0; i <= 60 * p; i++) {
        const f = i / 60;
        pts.push([gx - 360 + f * 720, 880 - dir * 150 * easeInOut(f) + Math.sin(f * 15) * 8]);
      }
      glowLine(ctx, pts, col, 5, 1 - solve);
      if (pts.length) glowDot(ctx, pts[pts.length - 1][0], pts[pts.length - 1][1], 30, col, 1 - solve);
    };
    if (leftDown > 0) curve(L, -1, leftDown, P.red);
    if (rightUp > 0) curve(R, 1, rightUp, P.ember);
    // 解决难题：办法的质量
    if (solve > 0) {
      [L, R].forEach((gx, gi) => {
        for (let k = 0; k < 3; k++) {
          const full = gi === 0 ? [0.42, 0.3, 0.36][k] : [0.82, 0.74, 0.9][k];
          const grow = span(t, 66.2 + k * 0.25, 67.6 + k * 0.25);
          const y = 250 + k * 70;
          ctx.save();
          ctx.globalAlpha = solve;
          ctx.fillStyle = 'rgba(255,255,255,0.05)';
          ctx.fillRect(gx - 320, y, 640, 34);
          ctx.restore();
          glowLine(ctx, [[gx - 320, y + 17], [gx - 320 + 640 * full * grow, y + 17]], gi === 0 ? '#B5524A' : P.gold, 20, solve * 0.9);
        }
      });
    }
  };
  return (
    <>
      <Canvas s={s} draw={draw} />
      <Svg>
        <g opacity={span(s, 48.6, 49.2) * (1 - span(s, 63.6, 64.4))}>
          <circle cx={W / 2} cy={170} r={62} fill="#0C0E14" stroke="#2A2C33" strokeWidth={6} />
          <circle cx={W / 2} cy={170} r={62} fill="none" stroke={P.gold} strokeWidth={6} pathLength={1} strokeDasharray={`${timerP} 1`} transform={`rotate(-90 ${W / 2} 170)`} filter="url(#glow)" />
          <Txt x={W / 2} y={184} text={timer} size={36} color={P.text} weight={600} />
        </g>
        <Txt x={L} y={130} text="想自己" size={46} color={P.red} font={FONTS.title} weight={900} spacing={10} o={leftThink * (1 - solve)} glow />
        <Txt x={R} y={130} text="想别的" size={46} color={P.ember} font={FONTS.title} weight={900} spacing={10} o={rightThink * (1 - solve)} glow />
        <Txt x={L - 320} y={232} text="办法" size={26} color={P.dim} anchor="start" o={solve} />
        <Txt x={R - 320} y={232} text="办法" size={26} color={P.dim} anchor="start" o={solve} />
      </Svg>
    </>
  );
};

/* ================= R6 长得太像思考 ================= */
const Y1 = 380;
const Y2 = 690;
const SPLIT = 900;
const LOOP = {x: SPLIT + 170, y: Y2 - 10, r: 170};

export const R6: React.FC<SP> = ({s}) => {
  const draw = (ctx: CanvasRenderingContext2D, t: number) => {
    bg(ctx);
    dust(ctx, t, 200, P.gold, 0.4);
    const intro = win(t, 73.4, 76.9, 0.5, 0.6);
    if (intro > 0) flowRing(ctx, t, {yaw: 0, pitch: 0.2, cx: W / 2, cy: 470, scale: 1}, {R: 260, r: 20, n: 2400, speed: 1.2, color: P.red, size: 4.5, alpha: 0.8 * intro});
    const zoom = span(t, 88.6, 90.2);
    const z = lerp(1, 2.0, easeInOut(zoom));
    ctx.save();
    ctx.translate(W / 2, H / 2);
    ctx.scale(z, z);
    ctx.translate(-lerp(W / 2, LOOP.x, zoom), -lerp(H / 2, LOOP.y, zoom));
    const draw1 = span(t, 76.7, 78.6, (x) => x);
    const loopIn = span(t, 78.2, 79.4);
    const spr1 = glowSprite(P.gold);
    const spr2 = glowSprite(P.red);
    ctx.globalCompositeOperation = 'lighter';
    // 两条粒子河：前半段一模一样
    for (let i = 0; i < 2600; i++) {
      const ph = (hash(i * 0.77) + t * 0.12) % 1;
      const reach = 280 + draw1 * 1360;
      const top = i % 2 === 0;
      let x = 280 + ph * 1360;
      if (x > reach) continue;
      const spread = (hash(i * 1.9) - 0.5) * 40;
      let y = (top ? Y1 : Y2) + Math.sin((x - 280) / 150) * 26 + spread;
      let alpha = 0.7 * (1 - zoom * (top ? 1 : 0));
      if (!top && x > SPLIT) {
        if (loopIn <= 0) continue;
        // 反刍那条卷进圈里，出不来
        const ang = hash(i * 2.3) * Math.PI * 2 + t * 2.2;
        const rr = LOOP.r + spread * 0.8;
        x = LOOP.x + Math.cos(ang + Math.PI) * rr;
        y = LOOP.y + Math.sin(ang + Math.PI) * rr;
        alpha = 0.85 * loopIn;
      }
      const sz = 3 + hash(i * 3.1) * 4;
      ctx.globalAlpha = alpha * (0.6 + 0.4 * Math.sin(i + t * 3));
      ctx.drawImage(top ? spr1 : spr2, x - sz, y - sz, sz * 2, sz * 2);
    }
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = 'source-over';
    // 下一步
    const nb = span(t, 85.7, 86.4) * (1 - zoom);
    if (nb > 0) {
      glowDot(ctx, 1755, Y1, 160, P.ember, 0.5 * nb);
      ctx.save();
      ctx.globalAlpha = nb;
      ctx.strokeStyle = P.gold;
      ctx.lineWidth = 3;
      ctx.strokeRect(1660, Y1 - 44, 190, 88);
      ctx.setLineDash([10, 10]);
      ctx.strokeStyle = P.red;
      ctx.strokeRect(1660, Y2 - 44, 190, 88);
      ctx.restore();
    }
    ctx.restore();
  };
  const zoom = span(s, 88.6, 90.2);
  const loopIn = span(s, 78.2, 79.4);
  const nb = span(s, 85.7, 86.4) * (1 - zoom);
  return (
    <>
      <Canvas s={s} draw={draw} />
      <Svg>
        <g opacity={span(s, 76.4, 77.0) * (1 - zoom)}>
          <Txt x={240} y={Y1 + 12} text="思考" size={40} color={P.gold} anchor="end" font={FONTS.title} weight={900} glow />
          <Txt x={240} y={Y2 + 12} text="反刍" size={40} color={P.red} anchor="end" font={FONTS.title} weight={900} glow />
          <Txt x={1755} y={Y1 + 12} text="下一步" size={34} color={P.ember} weight={600} o={nb} />
          <Txt x={1755} y={Y2 + 12} text="下一步" size={34} color={P.red} weight={600} o={nb * 0.35} />
          {[
            {text: '为什么是我？', t0: 79.9},
            {text: '要是当时……', t0: 82.7},
          ].map((b, i) => {
            const a = s * 1.1 + i * Math.PI;
            return <Bubble key={i} x={LOOP.x + Math.cos(a) * LOOP.r} y={LOOP.y + Math.sin(a) * LOOP.r - 80} w={250} h={58} text={b.text} size={26} dark o={span(s, b.t0, b.t0 + 0.5) * loopIn} tail="none" />;
          })}
        </g>
      </Svg>
    </>
  );
};

/* ================= R7 出口：往下沉 vs 往前走 ================= */
const LX = 520;
const RX0 = 1040;

export const R7: React.FC<SP> = ({s}) => {
  const split = span(s, 101.6, 102.6);
  const sink = span(s, 102.1, 105.4, (x) => x);
  const road = span(s, 105.7, 108.6, (x) => x);
  const compare = span(s, 109.5, 110.4);
  const walk = span(s, 124.4, 125.4);
  const draw = (ctx: CanvasRenderingContext2D, t: number) => {
    bg(ctx);
    dust(ctx, t, 200, P.gold, 0.4);
    const top = 1 - walk;
    if (top > 0) {
      if (split < 1) flowRing(ctx, t, {yaw: 0, pitch: 0.2, cx: W / 2, cy: 470, scale: 1}, {R: 260, r: 20, n: 2400, speed: 1.2, color: P.red, size: 4.5, alpha: 0.8 * (1 - split) * top});
      if (split > 0) {
        const sprC = glowSprite('#B5524A');
        const sprG = glowSprite(P.gold);
        ctx.save();
        ctx.globalCompositeOperation = 'lighter';
        // 左：问“为什么”，旋涡往下沉
        for (let i = 0; i < 2600; i++) {
          const k = (hash(i * 0.63) + t * 0.05) % 1;
          const depth = k * sink;
          const ang = k * Math.PI * 10 + t * 2.4;
          const rad = 200 * (1 - 0.55 * depth) + (hash(i * 1.7) - 0.5) * 30;
          const x = LX + Math.cos(ang) * rad;
          const y = 300 + depth * 620 + Math.sin(ang) * rad * 0.28;
          const sz = (3 + hash(i * 2.2) * 4) * (1 - 0.5 * depth);
          ctx.globalAlpha = split * top * (1 - compare * 0.7) * (0.85 - 0.75 * depth) * (0.6 + 0.4 * Math.sin(i + t * 3));
          ctx.drawImage(sprC, x - sz, y - sz, sz * 2, sz * 2);
        }
        // 右：问“怎么做”，一条往前延伸的光路
        const vx = 1780;
        const vy = 330;
        for (let i = 0; i < 2600; i++) {
          const k = (hash(i * 0.81) + t * 0.12) % 1;
          if (k > road) continue;
          const lat = (hash(i * 2.9) - 0.5) * 160 * (1 - k * 0.85);
          const x = lerp(RX0, vx, k) + lat * 0.3;
          const y = lerp(820, vy, Math.pow(k, 0.8)) + lat * 0.25;
          const sz = (3 + hash(i * 3.3) * 4) * (1 - 0.6 * k);
          ctx.globalAlpha = split * top * (1 - compare * 0.7) * 0.8 * (0.6 + 0.4 * Math.sin(i + t * 3));
          ctx.drawImage(sprG, x - sz, y - sz, sz * 2, sz * 2);
        }
        ctx.restore();
        if (road > 0) glowDot(ctx, lerp(RX0, vx, road), lerp(820, vy, Math.pow(road, 0.8)), 60, P.ember, split * top * (1 - compare * 0.7));
      }
      // 一口草：一个一直嚼，一个咽下去
      if (t > 118.3) {
        const a = span(t, 118.3, 118.8) * top;
        for (let i = 0; i < 18; i++) {
          const b = t * 3.5 - i * 0.08;
          glowDot(ctx, LX + Math.cos(b) * 150, 820 + Math.sin(b) * 34, 22 * (1 - i / 18), P.ember, a * (1 - i / 18));
        }
        const sw = clamp01((t - 121.7) / 1.6);
        if (t > 121.7) {
          glowDot(ctx, lerp(RX0 + 160, RX0 + 720, easeOut(sw)), 820, 26 * (1 - sw), P.ember, a);
          if (sw > 0.6) glowDot(ctx, RX0 + 720, 820, 40 + sw * 160, P.ember, a * (1 - sw) * 1.6);
        } else glowDot(ctx, RX0 + 160, 820, 26, P.ember, a);
      }
    }
    // 起身，走一圈
    if (walk > 0) {
      dotFloor(ctx, 420, 0.5 * walk);
      const tt = Math.max(0, t - 125.4);
      const stand = span(t, 124.8, 126.2);
      const x = 560 + tt * 130;
      const bob = stand > 0.9 ? Math.abs(Math.sin(tt * 6)) * 8 : 0;
      const pc = personCloud(900);
      const sl = slumpCloud(900);
      const pts = pc.map((p, i) => lerp3(sl[i], p, stand));
      drawPoints(ctx, pts, {yaw: 0.5, pitch: 0, cx: x, cy: 760 - 160 - bob, scale: 1.25}, {color: P.gold, size: 4.2, alpha: 0.95 * walk, t, shade: true});
      const ring = 1 - span(t, 127.4, 131.0);
      for (let i = 0; i < 140; i++) {
        const a = (i / 140) * Math.PI * 2 + t * 2;
        const fly = (1 - ring) * (60 + hash(i) * 420);
        glowDot(ctx, x + Math.cos(a) * (80 + fly), 760 - 380 + Math.sin(a) * (22 + fly * 0.3) - fly * 0.6, 9, P.red, walk * (0.25 + 0.7 * ring));
      }
      for (let k = 0; k < 9; k++) {
        const ap = span(t, 126.2 + k * 0.5, 126.6 + k * 0.5);
        glowDot(ctx, 600 + k * 70, 770 + (k % 2) * 10, 22, P.gold, 0.35 * ap * walk);
      }
    }
  };
  return (
    <>
      <Canvas s={s} draw={draw} />
      <Svg>
        <g opacity={split * (1 - compare) * (1 - walk)}>
          <Txt x={LX} y={200} text="为什么" size={52} color={P.red} font={FONTS.title} weight={900} spacing={10} glow />
          <Txt x={RX0 + 380} y={200} text="怎么做" size={52} color={P.gold} font={FONTS.title} weight={900} spacing={10} o={span(s, 105.7, 106.3)} glow />
        </g>
        {compare > 0 && walk < 1 && (
          <g opacity={compare * (1 - walk)}>
            <Bubble x={LX + Math.cos(s * 2) * 40} y={460} w={340} h={72} text="我怎么这么蠢。" size={32} dark tail="none" o={span(s, 111.9, 112.4)} />
            <Bubble x={lerp(RX0 + 300, RX0 + 520, span(s, 115.2, 118))} y={460} w={460} h={72} text="明天发条消息，解释一下。" size={30} tail="none" o={span(s, 114.9, 115.4)} />
            <g transform={`translate(${lerp(RX0 + 300, RX0 + 520, span(s, 115.2, 118)) + 260},460)`} opacity={span(s, 116.8, 117.3)}>
              <circle r={24} fill={P.gold} />
              <path d="M-11,0 L-3,9 L12,-9" stroke="#0A1A10" strokeWidth={4} fill="none" />
            </g>
          </g>
        )}
      </Svg>
    </>
  );
};

/* ================= R8 凌晨三点，再来一次 ================= */
export const R8: React.FC<SP> = ({s}) => {
  const clockP = clamp01((s - 143.4) / 5.0);
  const mins = Math.round(lerp(3 * 60, 7 * 60, easeInOut(clockP)));
  const clock = `${String(Math.floor(mins / 60)).padStart(2, '0')}:${String(mins % 60).padStart(2, '0')}`;
  const dawn = span(s, 143.4, 150);
  const endText = span(s, 145.0, 146.6);
  const draw = (ctx: CanvasRenderingContext2D, t: number) => {
    bg(ctx);
    const z = lerp(1.1, 1.0, span(t, 132.4, 140)) - 0.04 * span(t, 143, 160);
    ctx.save();
    ctx.translate(W / 2, H / 2);
    ctx.scale(z, z);
    ctx.translate(-W / 2 - 80, -H / 2 + 30);
    ctx.restore();
    const pc = paintCanvas();
    pc.translate(W / 2, H / 2);
    pc.scale(z, z);
    pc.translate(-W / 2 - 80, -H / 2 + 30);
    const {hx, hy} = paintRoom(pc, t, dawn);
    halftone(ctx, {cell: 8, t, color: dawn > 0.5 ? P.ember : P.gold, gamma: 1.3, min: 0.06});
    ctx.save();
    ctx.translate(W / 2, H / 2);
    ctx.scale(z, z);
    ctx.translate(-W / 2 - 80, -H / 2 + 30);
    dust(ctx, t, 140, dawn > 0.4 ? P.ember : P.gold, 0.4 + 0.3 * dawn);
    const bubble = span(t, 133.0, 133.8);
    const pause = span(t, 136.7, 137.6);
    const unroll = span(t, 139.7, 142.6);
    if (unroll < 1) {
      flowRing(ctx, 133 + (t - 133) * (1 - 0.85 * pause), {yaw: 0, pitch: 0.35, cx: hx, cy: hy - 110, scale: 1}, {R: 110, r: 8, n: 800, speed: 1.4, color: P.red, size: 4.5, alpha: bubble * (1 - unroll)});
    }
    if (unroll > 0) {
      // 圈被拉直，变成一条流向窗口的光
      const [wx, wy] = windowCenter();
      const spr = glowSprite(P.ember);
      ctx.globalCompositeOperation = 'lighter';
      for (let i = 0; i < 900; i++) {
        const k = (hash(i * 0.7) + t * 0.15) % 1;
        if (k > unroll) continue;
        const x = lerp(hx, wx, k);
        const y = lerp(hy - 110, wy, k) - Math.sin(k * Math.PI) * 180 + (hash(i * 2.1) - 0.5) * 24;
        const sz = 3 + hash(i * 3.1) * 4;
        ctx.globalAlpha = 0.8 * (1 - 0.4 * dawn);
        ctx.drawImage(spr, x - sz, y - sz, sz * 2, sz * 2);
      }
      ctx.globalCompositeOperation = 'source-over';
      ctx.globalAlpha = 1;
    }
    ctx.restore();
    if (endText > 0) {
      ctx.fillStyle = `rgba(0,0,0,${0.45 * endText})`;
      ctx.fillRect(0, 0, W, H);
    }
  };
  return (
    <>
      <Canvas s={s} draw={draw} />
      <Svg>
        <g opacity={1 - endText * 0.4}>
          <text x={1770} y={900} textAnchor="end" fontFamily={FONTS.sans} fontWeight={600} fontSize={72} fill={dawn > 0.5 ? P.ember : P.gold} letterSpacing={4} filter="url(#glow)">
            {clock}
          </text>
          <line x1={1480} x2={1770} y1={924} y2={924} stroke={P.gold} strokeWidth={2} opacity={0.5} />
        </g>
        {endText > 0 && (
          <g opacity={endText}>
            <Txt x={W / 2} y={460} text="把“为什么”，" size={100} color={P.text} font={FONTS.title} weight={900} spacing={8} />
            <Txt x={W / 2} y={610} text="换成“接下来”。" size={100} color={P.ember} font={FONTS.title} weight={900} spacing={8} glow />
          </g>
        )}
      </Svg>
    </>
  );
};

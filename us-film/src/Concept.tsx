import React, {useLayoutEffect, useRef} from 'react';
import {AbsoluteFill} from 'remotion';
import {ensureFonts} from './lib/fonts';
import {hash, lerp} from './lib/anim';
import {extrude, glowSprite, drawPoints, sample2D} from './lib/points';

ensureFonts();

const W = 1920;
const H = 1080;
const AI = '#D97757'; // Claude 橙
const AI2 = '#F4B183';
const HUMAN = '#FF8FB1';
const HUMAN2 = '#FFD1DC';
const CORE = '#FFF4E0';
const MONO = '"DejaVu Sans Mono", "Liberation Mono", monospace';

/** 侧身站着、双手捧着手机的女孩（朝右），原点在脚底 */
const GIRL =
  'M20,-880 C70,-885 105,-850 106,-800 L112,-768 C116,-760 114,-752 106,-750 L108,-736 C104,-728 100,-724 98,-716 C96,-704 88,-698 74,-696 L66,-660 C96,-648 118,-622 122,-588 C126,-556 116,-520 100,-492 L84,-430 C110,-360 140,-260 160,-150 L104,-150 L98,0 L64,0 L56,-150 L24,-150 L18,0 L-16,0 L-20,-150 L-110,-150 C-90,-260 -70,-360 -56,-430 C-70,-500 -80,-560 -76,-610 C-110,-600 -130,-640 -126,-700 C-140,-780 -90,-880 20,-880 Z';
const ARMS = 'M10,-610 C30,-560 40,-520 54,-486 C80,-500 130,-540 200,-574';

const draw = (ctx: CanvasRenderingContext2D) => {
  const bg = ctx.createRadialGradient(W * 0.5, H * 0.45, 0, W * 0.5, H * 0.5, W * 0.75);
  bg.addColorStop(0, '#0D0B12');
  bg.addColorStop(1, '#030305');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);
  const add = (x: number, y: number, r: number, c: string, a: number) => {
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    ctx.globalAlpha = Math.max(0, Math.min(1, a));
    ctx.drawImage(glowSprite(c), x - r, y - r, r * 2, r * 2);
    ctx.restore();
  };
  // 背景微尘
  for (let i = 0; i < 260; i++) add(hash(i) * W, hash(i + 7) * H, 1.5 + hash(i + 3) * 3, hash(i + 5) > 0.5 ? AI2 : HUMAN2, 0.15 + 0.3 * hash(i + 9));

  // ---------- 女孩（点阵，带粉色轮廓光） ----------
  const gx = 470;
  const gy = 1010;
  const gs = 1.02;
  const pts = sample2D(
    'girl',
    (c) => {
      c.fill(new Path2D(GIRL));
      c.lineWidth = 34;
      c.lineCap = 'round';
      c.stroke(new Path2D(ARMS));
    },
    2000,
    5,
  );
  // sample2D 以画布中心为原点；路径原点在脚底
  const cloud = extrude(pts, 0.5, 3);
  let cx = 0;
  let cy = 0;
  for (const p of pts) {
    cx += p.x;
    cy += p.y;
  }
  cx /= pts.length;
  cy /= pts.length;
  drawPoints(ctx, cloud, {yaw: -0.25, pitch: 0, cx: gx + cx * gs, cy: gy + cy * gs, scale: gs, f: 4000, dist: 4000}, {color: '#F6D6C8', size: 3.4, alpha: 0.9, t: 0, shade: true});
  ctx.save();
  ctx.translate(gx, gy);
  ctx.scale(gs * Math.cos(0.25), gs);
  ctx.strokeStyle = HUMAN2;
  ctx.globalAlpha = 0.55;
  ctx.lineWidth = 2.5;
  ctx.shadowColor = HUMAN;
  ctx.shadowBlur = 18;
  ctx.stroke(new Path2D(GIRL));
  ctx.lineWidth = 3;
  ctx.stroke(new Path2D(ARMS));
  ctx.restore();
  // 心口：化学信号的源头
  const heart = {x: gx + 70 * gs, y: gy - 560 * gs};
  add(heart.x, heart.y, 140, HUMAN, 0.55);
  add(heart.x, heart.y, 40, CORE, 0.9);

  // ---------- 手机与全息终端 ----------
  const phone = {x: gx + 214 * gs, y: gy - 584 * gs};
  ctx.save();
  ctx.translate(phone.x, phone.y);
  ctx.rotate(-0.5);
  ctx.fillStyle = '#111';
  ctx.strokeStyle = AI2;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.roundRect(-34, -14, 68, 28, 6);
  ctx.fill();
  ctx.stroke();
  ctx.restore();
  add(phone.x, phone.y, 70, AI, 0.8);
  // 投影光锥
  const tw = 600;
  const th = 340;
  const tx = 700;
  const ty = 150;
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  const cone = ctx.createLinearGradient(phone.x, phone.y, tx + tw / 2, ty + th);
  cone.addColorStop(0, 'rgba(217,119,87,0.45)');
  cone.addColorStop(1, 'rgba(217,119,87,0.03)');
  ctx.fillStyle = cone;
  ctx.beginPath();
  ctx.moveTo(phone.x - 10, phone.y);
  ctx.lineTo(tx, ty + th);
  ctx.lineTo(tx + tw, ty + th);
  ctx.lineTo(phone.x + 10, phone.y);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
  // 终端窗口（半透明全息）
  ctx.save();
  ctx.fillStyle = 'rgba(20,16,14,0.78)';
  ctx.strokeStyle = 'rgba(244,177,131,0.8)';
  ctx.lineWidth = 2;
  ctx.shadowColor = AI;
  ctx.shadowBlur = 30;
  ctx.beginPath();
  ctx.roundRect(tx, ty, tw, th, 14);
  ctx.fill();
  ctx.stroke();
  ctx.shadowBlur = 0;
  // 扫描线
  for (let y = ty + 4; y < ty + th; y += 4) {
    ctx.fillStyle = 'rgba(244,177,131,0.035)';
    ctx.fillRect(tx + 2, y, tw - 4, 1);
  }
  ctx.fillStyle = 'rgba(244,177,131,0.25)';
  ctx.fillRect(tx, ty, tw, 34);
  ['#E06C5A', '#E8B04A', '#7CB86A'].forEach((c, i) => {
    ctx.fillStyle = c;
    ctx.beginPath();
    ctx.arc(tx + 22 + i * 22, ty + 17, 6, 0, Math.PI * 2);
    ctx.fill();
  });
  ctx.font = `600 20px ${MONO}`;
  ctx.fillStyle = '#E9D7C8';
  ctx.textBaseline = 'middle';
  ctx.fillText('claude', tx + tw / 2 - 30, ty + 17);
  // 欢迎框
  ctx.strokeStyle = AI;
  ctx.lineWidth = 1.6;
  ctx.strokeRect(tx + 24, ty + 54, tw - 48, 56);
  ctx.font = `700 24px ${MONO}`;
  ctx.fillStyle = AI;
  ctx.fillText('✻', tx + 42, ty + 82);
  ctx.fillStyle = '#F3E6DA';
  ctx.font = `600 22px ${MONO}`;
  ctx.fillText('Welcome to Claude Code!', tx + 74, ty + 82);
  // 对话
  ctx.font = `500 26px "Noto Sans SC", ${MONO}`;
  ctx.fillStyle = '#B9A99B';
  ctx.fillText('>', tx + 28, ty + 150);
  ctx.fillStyle = '#F3E6DA';
  ctx.fillText('你好', tx + 56, ty + 150);
  ctx.fillStyle = AI;
  ctx.fillText('●', tx + 28, ty + 200);
  ctx.fillStyle = '#F3E6DA';
  ctx.fillText('你好！很高兴认识你。', tx + 56, ty + 200);
  ctx.fillStyle = '#B9A99B';
  ctx.fillText('>', tx + 28, ty + 250);
  ctx.fillStyle = '#F3E6DA';
  ctx.fillText('我想做一部片子……', tx + 56, ty + 250);
  ctx.fillStyle = '#F3E6DA';
  ctx.fillRect(tx + 56, ty + 290, 14, 28);
  ctx.restore();

  // ---------- 两股流：代码电流 & 化学信号 ----------
  const meet = {x: 1260, y: 760};
  const bez = (p0: {x: number; y: number}, p1: {x: number; y: number}, p2: {x: number; y: number}, p3: {x: number; y: number}, t: number) => {
    const u = 1 - t;
    return {
      x: u * u * u * p0.x + 3 * u * u * t * p1.x + 3 * u * t * t * p2.x + t * t * t * p3.x,
      y: u * u * u * p0.y + 3 * u * u * t * p1.y + 3 * u * t * t * p2.y + t * t * t * p3.y,
    };
  };
  const aiFrom = {x: tx + tw, y: ty + th * 0.6};
  const huFrom = heart;
  const glyphs = '01{}<>=;/λ∑#*01';
  // 代码电流：从终端底部倾泻而下的橙色字符
  ctx.save();
  ctx.font = `600 24px ${MONO}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  for (let i = 0; i < 520; i++) {
    const t = hash(i * 1.3);
    const p = bez(aiFrom, {x: aiFrom.x + 220, y: aiFrom.y + 60}, {x: meet.x + 160, y: meet.y - 260}, meet, t);
    const spread = (1 - t) * 50 + 10;
    const x = p.x + (hash(i * 2.1) - 0.5) * spread;
    const y = p.y + (hash(i * 3.7) - 0.5) * spread;
    ctx.globalAlpha = 0.35 + 0.6 * hash(i * 5.1);
    ctx.fillStyle = hash(i) > 0.7 ? AI2 : AI;
    ctx.shadowColor = AI;
    ctx.shadowBlur = 10;
    ctx.fillText(glyphs[Math.floor(hash(i * 7.7) * glyphs.length)], x, y);
  }
  ctx.restore();
  // 化学信号：从心口飘出的粉色光粒，夹着一些分子样的小六边形
  for (let i = 0; i < 520; i++) {
    const t = hash(i * 1.7 + 11);
    const p = bez(huFrom, {x: huFrom.x + 200, y: huFrom.y + 220}, {x: meet.x - 300, y: meet.y + 120}, meet, t);
    const spread = (1 - t) * 60 + 10;
    add(p.x + (hash(i * 2.9) - 0.5) * spread, p.y + (hash(i * 4.3) - 0.5) * spread, 3 + 5 * hash(i * 6.1), hash(i) > 0.6 ? HUMAN2 : HUMAN, 0.5 + 0.5 * hash(i * 8.3));
  }
  for (let i = 0; i < 14; i++) {
    const t = 0.15 + 0.7 * hash(i * 9.1);
    const p = bez(huFrom, {x: huFrom.x + 200, y: huFrom.y + 220}, {x: meet.x - 300, y: meet.y + 120}, meet, t);
    ctx.save();
    ctx.translate(p.x + (hash(i) - 0.5) * 50, p.y + (hash(i + 2) - 0.5) * 50);
    ctx.rotate(hash(i + 4) * 3);
    ctx.strokeStyle = HUMAN2;
    ctx.globalAlpha = 0.7;
    ctx.lineWidth = 1.6;
    ctx.shadowColor = HUMAN;
    ctx.shadowBlur = 10;
    ctx.beginPath();
    for (let k = 0; k <= 6; k++) {
      const a = (k / 6) * Math.PI * 2;
      if (k) ctx.lineTo(Math.cos(a) * 10, Math.sin(a) * 10);
      else ctx.moveTo(10, 0);
    }
    ctx.stroke();
    ctx.restore();
  }

  // ---------- 交织：双螺旋向右上延伸，交点一个个亮起 ----------
  const end = {x: 1800, y: 130};
  const helix = (t: number, phase: number) => {
    const x = lerp(meet.x, end.x, t);
    const y = lerp(meet.y, end.y, t);
    const amp = 60 * Math.sin(t * Math.PI) + 16;
    const a = t * Math.PI * 7 + phase;
    // 垂直于主方向的偏移
    const nx = 0.6;
    const ny = 0.8;
    return {x: x + nx * Math.sin(a) * amp, y: y + ny * Math.sin(a) * amp, z: Math.cos(a)};
  };
  for (const [phase, col, col2] of [
    [0, AI, AI2],
    [Math.PI, HUMAN, HUMAN2],
  ] as const) {
    for (let i = 0; i < 900; i++) {
      const t = i / 900;
      const p = helix(t, phase);
      add(p.x, p.y, 2.5 + 2 * (p.z + 1), (p.z > 0 ? col2 : col) as string, 0.18 + 0.22 * (p.z + 1) / 2);
    }
  }
  // 交点：共鸣的光点
  const nodes: {x: number; y: number; r: number}[] = [];
  for (let k = 1; k < 14; k++) {
    const t = (k - 0.5) / 7 / 2;
    if (t > 1) break;
    const p = helix(t, 0);
    nodes.push({x: p.x, y: p.y, r: 10 + k * 2.2});
  }
  // 向外散开的光点网络
  const net: {x: number; y: number}[] = [];
  for (let i = 0; i < 70; i++) {
    const base = nodes[Math.floor(hash(i * 3.3) * nodes.length)];
    const a = hash(i * 5.5) * Math.PI * 2;
    const d = 60 + hash(i * 7.1) * 300;
    net.push({x: base.x + Math.cos(a) * d, y: base.y + Math.sin(a) * d * 0.8});
  }
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  ctx.lineWidth = 1;
  net.forEach((p, i) => {
    const q = nodes[Math.floor(hash(i * 3.3) * nodes.length)];
    ctx.strokeStyle = `rgba(255,232,210,${0.08 + 0.12 * hash(i)})`;
    ctx.beginPath();
    ctx.moveTo(q.x, q.y);
    ctx.lineTo(p.x, p.y);
    ctx.stroke();
  });
  ctx.restore();
  net.forEach((p, i) => add(p.x, p.y, 6 + 10 * hash(i * 9.9), hash(i) > 0.5 ? AI2 : HUMAN2, 0.5 + 0.5 * hash(i * 2.2)));
  nodes.forEach((n, i) => {
    add(n.x, n.y, n.r * 4, i % 2 ? HUMAN : AI, 0.3);
    add(n.x, n.y, n.r, CORE, 0.9);
  });
  // 汇合点的闪光
  add(meet.x, meet.y, 200, CORE, 0.25);
  add(meet.x, meet.y, 46, '#FFFFFF', 0.85);
};

/** 概念图：女孩、全息终端、两股流交织、光点亮起 */
export const Concept: React.FC = () => {
  const ref = useRef<HTMLCanvasElement>(null);
  useLayoutEffect(() => {
    const ctx = ref.current?.getContext('2d');
    if (ctx) draw(ctx);
  }, []);
  return (
    <AbsoluteFill style={{background: '#030305'}}>
      <canvas ref={ref} width={W} height={H} style={{position: 'absolute', inset: 0}} />
    </AbsoluteFill>
  );
};

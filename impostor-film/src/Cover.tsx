import React, {useLayoutEffect, useRef} from 'react';
import {AbsoluteFill} from 'remotion';
import {INK} from './config';
import {ensureFonts} from './lib/fonts';
import {hash} from './lib/anim';
import {bunny, halftone, headline, label, paper, radial, stamp} from './scenes/print';

ensureFonts();

const CW = 1080;
const CH = 1440;

/** 竖版封面：档案照 + 问句 */
const draw = (ctx: CanvasRenderingContext2D) => {
  ctx.fillStyle = INK.paper;
  ctx.fillRect(0, 0, CW, CH);
  const box: [number, number, number, number] = [0, 0, CW, CH];
  // 身高尺
  ctx.strokeStyle = 'rgba(30,35,66,0.45)';
  ctx.lineWidth = 3;
  for (let i = 0; i <= 7; i++) {
    const y = 1230 - i * 92;
    ctx.beginPath();
    ctx.moveTo(90, y);
    ctx.lineTo(CW - 90, y);
    ctx.stroke();
    if (i % 2 === 0) label(ctx, String(i * 10), 30, y + 10, 26, {kind: 'mono', weight: 700, color: 'rgba(30,35,66,0.65)'});
  }
  halftone(ctx, radial(540, 900, 110, 520), {step: 22, angle: 15, color: INK.cobalt, k: 0.7, box});
  halftone(ctx, radial(980, 120, 40, 420, 0.8), {step: 22, angle: 30, color: INK.pink, k: 0.66, box});
  label(ctx, '案卷 No.2026-IMP-001', 70, 86, 28, {kind: 'mono', weight: 700});
  headline(ctx, '为什么越被夸，', 64, 270, 118, 9, {shadow: INK.pink});
  headline(ctx, '越心虚？', 64, 440, 170, 9, {color: INK.red, shadow: INK.cobalt});
  bunny(ctx, 540, 1150, 1.25, {face: 'worried', t: 0});
  // 名牌
  ctx.save();
  ctx.translate(540, 1150);
  ctx.rotate(-0.02);
  ctx.fillStyle = INK.navy;
  ctx.beginPath();
  ctx.roundRect(-270, -100, 540, 170, 14);
  ctx.fill();
  label(ctx, '被告：你自己', 0, -22, 54, {align: 'center', color: INK.white});
  label(ctx, '罪名：', -50, 44, 46, {align: 'right', color: INK.white});
  label(ctx, '骗子', -40, 44, 46, {color: INK.yellow});
  ctx.restore();
  stamp(ctx, '骗子', 840, 990, 100, 1, {rot: -12, seed: 3});
  // 底部标题条
  ctx.fillStyle = INK.cobalt;
  ctx.fillRect(8, 1300 + 8, CW, 140);
  ctx.fillStyle = INK.navy;
  ctx.fillRect(0, 1300, CW, 140);
  label(ctx, '冒名顶替综合征', 540, 1395, 84, {align: 'center', color: INK.yellow, kind: 'serif'});
  // 纸纹 + 灰尘
  ctx.save();
  ctx.globalCompositeOperation = 'multiply';
  ctx.drawImage(paper(), 0, 0, CW, CH);
  ctx.restore();
  for (let i = 0; i < 200; i++) {
    ctx.fillStyle = i % 6 === 0 ? 'rgba(30,35,66,0.4)' : 'rgba(255,250,238,0.8)';
    ctx.beginPath();
    ctx.arc(hash(i * 7) * CW, hash(i * 11) * CH, 1 + hash(i * 3) * 1.6, 0, Math.PI * 2);
    ctx.fill();
  }
};

export const Cover: React.FC = () => {
  const ref = useRef<HTMLCanvasElement>(null);
  useLayoutEffect(() => {
    const c = ref.current?.getContext('2d');
    if (c) draw(c);
  }, []);
  return (
    <AbsoluteFill style={{background: INK.paper}}>
      <canvas ref={ref} width={CW} height={CH} />
    </AbsoluteFill>
  );
};

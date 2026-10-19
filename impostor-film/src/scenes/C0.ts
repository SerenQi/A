// 钩子：通知 → 档案照 → 标题
import {H, INK, ONSCREEN, W} from '../config';
import {clamp01, span} from '../lib/anim';
import {backOut, bunny, Ctx, dotWipe, halftone, headline, heightChart, label, phoneCard, radial, rays, rr, stamp} from './print';

export const C0 = (ctx: Ctx, s: number) => {
  if (s < 4.6) {
    // 第 0 帧就要看得清：大字和手机已经在画面上
    halftone(ctx, radial(1400, 470, 80, 640), {step: 24, angle: 20, color: INK.pink, k: 0.7});
    rays(ctx, 1400, 470, 360, 1300, 28, 'rgba(244,196,48,0.55)', s * 0.05);
    const shake = s > 2.8 && s < 3.3 ? Math.sin(s * 90) * 10 * (1 - (s - 2.8) / 0.5) : 0;
    phoneCard(ctx, 1400 + shake, 500, 0.92, s + 0.6, ONSCREEN.notif as [string, string, string]);
    headline(ctx, '为什么越被夸，', 96, 300, 132, s + 2, {shadow: INK.pink});
    headline(ctx, '越心虚？', 96, 460, 150, s + 2, {color: INK.red, shadow: INK.cobalt});
    const face = s < 2.8 ? 'happy' : 'shock';
    bunny(ctx, 430, 1080, 0.95, {face, t: s});
    if (s > 2.8) {
      // “完了”的气泡
      const e = backOut((s - 2.8) / 0.3);
      ctx.save();
      ctx.translate(800, 560);
      ctx.scale(e, e);
      const b = new Path2D('M-120,-70 L120,-70 Q150,-70 150,-40 L150,40 Q150,70 120,70 L-40,70 L-90,120 L-80,70 L-120,70 Q-150,70 -150,40 L-150,-40 Q-150,-70 -120,-70 Z');
      ctx.fillStyle = INK.navy;
      ctx.save();
      ctx.translate(8, 8);
      ctx.fill(b);
      ctx.restore();
      ctx.fillStyle = INK.white;
      ctx.fill(b);
      ctx.lineWidth = 7;
      ctx.strokeStyle = INK.navy;
      ctx.stroke(b);
      label(ctx, '完了。', 0, 22, 74, {align: 'center', color: INK.navy});
      ctx.restore();
    }
  } else if (s < 9.6) {
    const t = s - 4.6;
    heightChart(ctx);
    halftone(ctx, radial(960, 560, 120, 560), {step: 22, angle: 15, color: INK.cobalt, k: 0.7});
    bunny(ctx, 960, 800, 1.12, {face: t < 2.2 ? 'worried' : 'sad', t: s});
    // 左：原告
    label(ctx, '原告', 200, 330, 34, {color: INK.pink});
    headline(ctx, '也是你', 196, 450, 110, t - 0.6, {shadow: INK.yellow, kind: 'sans'});
    // 右：档案
    label(ctx, '嫌疑人档案 · PROFILE', 1340, 330, 30, {color: INK.pink});
    label(ctx, '寓言兔', 1340, 430, 84, {kind: 'serif'});
    label(ctx, '工龄 3 年 · 方案 12 份', 1340, 500, 36);
    label(ctx, '特长：', 1340, 560, 36);
    label(ctx, '怀疑自己', 1450, 560, 36, {color: INK.pink});
    // 名牌
    const e = backOut((t - 0.3) / 0.4);
    ctx.save();
    ctx.translate(960, 770 + (1 - e) * 300);
    ctx.rotate(-0.02);
    ctx.fillStyle = INK.navy;
    ctx.beginPath();
    ctx.roundRect(-270, -110, 540, 180, 14);
    ctx.fill();
    label(ctx, '被告：你自己', 0, -30, 54, {align: 'center', color: INK.white});
    label(ctx, '罪名：', -60, 40, 46, {align: 'right', color: INK.white});
    label(ctx, '骗子', -50, 40, 46, {color: INK.yellow});
    ctx.restore();
    stamp(ctx, '骗子', 1420, 740, 110, t - 2.6, {rot: -12, seed: 3});
  } else {
    const t = s - 9.6;
    halftone(ctx, radial(960, 520, 200, 900), {step: 24, angle: 25, color: INK.yellow, k: 0.72});
    label(ctx, ONSCREEN.en, W / 2, 330, 44, {kind: 'mono', weight: 700, align: 'center', alpha: clamp01(t / 0.3), color: INK.navy});
    headline(ctx, ONSCREEN.title, W / 2, 600, 210, t, {align: 'center', shadow: INK.cobalt, stagger: 0.07});
    label(ctx, ONSCREEN.hook, W / 2, 740, 54, {align: 'center', alpha: span(t, 0.9, 1.3), color: INK.navy});
    stamp(ctx, '立案', 1640, 330, 72, t - 1.0, {rot: 10, seed: 9});
  }
  dotWipe(ctx, (s - 4.3) / 0.6, INK.navy);
  dotWipe(ctx, (s - 9.3) / 0.6, INK.yellow);
};

/** 这一段的冲击点（印章、闪光） */
export const C0_IMPACTS = [
  {t: 2.8, power: 0.5, flash: 0},
  {t: 4.6, power: 0, flash: 0.5},
  {t: 7.2, power: 1, flash: 0.25},
  {t: 10.6, power: 0.8, flash: 0.2},
];

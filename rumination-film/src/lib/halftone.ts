// 网点渲染：先在小画布上画一张有明暗的灰度图，再按亮度换成大小不一的发光圆点。
import {H, W} from '../config';
import {glowSprite} from './points';

const SCALE = 4; // 灰度图是成片的 1/4
const SW = W / SCALE;
const SH = H / SCALE;

let src: HTMLCanvasElement | null = null;
/** 拿到一张清空的灰度画布（坐标已放大到成片尺寸，直接按 1920×1080 画） */
export const paintCanvas = () => {
  if (!src) {
    src = document.createElement('canvas');
    src.width = SW;
    src.height = SH;
  }
  const ctx = src.getContext('2d', {willReadFrequently: true})!;
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.globalAlpha = 1;
  ctx.globalCompositeOperation = 'source-over';
  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, SW, SH);
  ctx.setTransform(1 / SCALE, 0, 0, 1 / SCALE, 0, 0);
  return ctx;
};

/**
 * 把灰度画布按 cell 像素的网格换成网点画到 ctx 上。
 * cell 越小越细；gamma 控制暗部；jitter 让网格不那么死板。
 */
export const halftone = (
  ctx: CanvasRenderingContext2D,
  o: {cell?: number; color?: string; hot?: string; gamma?: number; alpha?: number; t?: number; min?: number},
) => {
  if (!src) return;
  const cell = o.cell ?? 8;
  const sctx = src.getContext('2d', {willReadFrequently: true})!;
  const data = sctx.getImageData(0, 0, SW, SH).data;
  const spr = glowSprite(o.color ?? '#E8C27A');
  const hot = glowSprite(o.hot ?? '#FFF1D6');
  const gamma = o.gamma ?? 1.1;
  const alpha = o.alpha ?? 1;
  const min = o.min ?? 0.04;
  const t = o.t ?? 0;
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  let row = 0;
  for (let y = cell / 2; y < H; y += cell, row++) {
    const off = row % 2 ? cell / 2 : 0;
    for (let x = cell / 2 + off; x < W; x += cell) {
      const sx = Math.min(SW - 1, Math.floor(x / SCALE));
      const sy = Math.min(SH - 1, Math.floor(y / SCALE));
      const i = (sy * SW + sx) * 4;
      const lum = Math.pow((data[i] * 0.3 + data[i + 1] * 0.55 + data[i + 2] * 0.15) / 255, gamma);
      if (lum < min) continue;
      const r = cell * (0.35 + 0.9 * lum);
      const tw = 0.85 + 0.15 * Math.sin(x * 0.13 + y * 0.07 + t * 2);
      ctx.globalAlpha = Math.min(1, alpha * (0.25 + 0.85 * lum) * tw);
      ctx.drawImage(lum > 0.85 ? hot : spr, x - r, y - r, r * 2, r * 2);
    }
  }
  ctx.restore();
};

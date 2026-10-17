import {Pt, resample} from '../lib/hull';

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

/**
 * 人体轮廓（局部坐标，脚底中心为原点，向上为负）。
 * age 0 → 儿童，1 → 成人；所有年龄拓扑一致，便于粒子与轮廓逐点变形。
 */
export const figure = (age: number, height = 330) => {
  const k = Math.max(0, Math.min(1, age));
  const Hh = height * lerp(0.56, 1, k);
  const r = Hh * lerp(0.115, 0.075, k);
  const sw = Hh * lerp(0.19, 0.19, k);
  const hw = Hh * lerp(0.13, 0.12, k);
  const nw = r * 0.42;
  const neckY = -Hh + 2 * r + 2;
  const shY = neckY + Hh * 0.05;
  const half: Pt[] = [
    [nw, neckY],
    [sw * 0.72, shY - 2],
    [sw, shY + Hh * 0.025],
    [sw + Hh * 0.018, shY + Hh * 0.2],
    [sw + Hh * 0.012, -Hh * 0.47],
    [sw - Hh * 0.012, -Hh * 0.43],
    [sw - Hh * 0.03, -Hh * 0.47],
    [sw - Hh * 0.025, shY + Hh * 0.21],
    [sw - Hh * 0.04, shY + Hh * 0.11],
    [hw * 0.92, -Hh * 0.56],
    [hw, -Hh * 0.46],
    [hw - Hh * 0.012, -Hh * 0.25],
    [hw - Hh * 0.02, -Hh * 0.025],
    [hw + Hh * 0.03, 0],
    [Hh * 0.018, 0],
    [Hh * 0.016, -Hh * 0.25],
    [0, -Hh * 0.43],
  ];
  const body: Pt[] = [...half, ...half.slice(0, -1).reverse().map(([x, y]) => [-x, y] as Pt)];
  const headC: Pt = [0, -Hh + r];
  return {body, headC, r, Hh, chest: [0, shY + Hh * 0.1] as Pt};
};

export const BODY_N = 230;
export const HEAD_N = 70;

/** 轮廓上的稳定采样点（身体 230 + 头部 70） */
export const figurePoints = (age: number, height = 330): Pt[] => {
  const f = figure(age, height);
  const body = resample(f.body, BODY_N, true);
  const head: Pt[] = Array.from({length: HEAD_N}, (_, i) => {
    const a = (i / HEAD_N) * Math.PI * 2 + Math.PI / 2;
    return [f.headC[0] + Math.cos(a) * f.r, f.headC[1] + Math.sin(a) * f.r];
  });
  return [...body, ...head];
};

export const figurePath = (age: number, height = 330) => {
  const f = figure(age, height);
  const b = resample(f.body, 160, true);
  const d = `M${b.map((p) => `${p[0].toFixed(1)},${p[1].toFixed(1)}`).join('L')}Z`;
  return {d, cx: f.headC[0], cy: f.headC[1], r: f.r, chest: f.chest, Hh: f.Hh};
};

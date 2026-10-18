// 由秒数推导状态的缓动小工具（任意跳帧结果一致）

export const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
export const easeInOut = (t: number) => {
  const x = clamp01(t);
  return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
};
export const easeOut = (t: number) => 1 - Math.pow(1 - clamp01(t), 3);
export const easeIn = (t: number) => Math.pow(clamp01(t), 3);
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
/** [a,b] 秒区间上的 0→1 */
export const span = (t: number, a: number, b: number, ease = easeInOut) => ease((t - a) / (b - a));
/** 淡入 [a,a+i]、保持、淡出 [b-o,b] */
export const win = (t: number, a: number, b: number, i = 0.6, o = 0.6) => Math.min(span(t, a, a + i), 1 - span(t, b - o, b));

/** 固定种子的伪随机 */
export const hash = (n: number) => {
  const s = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return s - Math.floor(s);
};

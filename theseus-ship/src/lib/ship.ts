import {random} from 'remotion';

// 船的局部坐标系：x ∈ [-500, 500]（船尾在左、船首在右），y 向下，吃水线约在 y = 50。
export const HALF = 500;
export const ROWS = 6;
export const COLS = 10;
export const WATERLINE = 50;

/** 船首尾上翘量（希腊三十桨船的尾部高高卷起）。 */
export const lift = (x: number) => {
  const t = x / HALF;
  return t < 0 ? 175 * Math.pow(-t, 3.2) : 105 * Math.pow(t, 2.6);
};

const depth = (x: number) => {
  const t = Math.min(1, Math.abs(x / HALF));
  return 130 * Math.pow(Math.max(0, 1 - Math.pow(t, 2.4)), 0.75) + 10;
};

export const topY = (x: number) => -40 - lift(x);
export const bottomY = (x: number) => -40 + depth(x) - lift(x) * 0.82;
export const hullY = (x: number, f: number) => topY(x) + (bottomY(x) - topY(x)) * f;

export type Plank = {
  id: number;
  row: number;
  x0: number;
  x1: number;
  d: string;
  grain: string;
  cx: number;
  cy: number;
  seed: number;
};

const edge = (x0: number, x1: number, f: number, n = 6) => {
  const pts: [number, number][] = [];
  for (let i = 0; i <= n; i++) {
    const x = x0 + ((x1 - x0) * i) / n;
    pts.push([x, hullY(x, f)]);
  }
  return pts;
};

const fmt = (p: [number, number]) => `${p[0].toFixed(1)},${p[1].toFixed(1)}`;

const buildPlanks = (): Plank[] => {
  const planks: Plank[] = [];
  const colW = (HALF * 2) / COLS;
  for (let r = 0; r < ROWS; r++) {
    const f0 = r / ROWS;
    const f1 = (r + 1) / ROWS;
    // 错缝排列：奇数行偏移半块，像真正的船壳板
    const bounds: number[] = [];
    if (r % 2 === 0) {
      for (let c = 0; c <= COLS; c++) bounds.push(-HALF + c * colW);
    } else {
      bounds.push(-HALF);
      for (let c = 0; c < COLS; c++) bounds.push(-HALF + (c + 0.5) * colW);
      bounds.push(HALF);
    }
    for (let i = 0; i < bounds.length - 1; i++) {
      const x0 = bounds[i];
      const x1 = bounds[i + 1];
      const top = edge(x0, x1, f0);
      const bot = edge(x0, x1, f1).reverse();
      const d = `M${top.map(fmt).join('L')}L${bot.map(fmt).join('L')}Z`;
      const fm = (f0 + f1) / 2 + (random(`g${r}-${i}`) - 0.5) * 0.06;
      const g = edge(x0 + 6, x1 - 6, fm, 4);
      const grain = `M${g.map(fmt).join('L')}`;
      const cx = (x0 + x1) / 2;
      planks.push({
        id: planks.length,
        row: r,
        x0,
        x1,
        d,
        grain,
        cx,
        cy: hullY(cx, (f0 + f1) / 2),
        seed: random(`p${r}-${i}`),
      });
    }
  }
  return planks;
};

export const PLANKS = buildPlanks();
export const PLANK_COUNT = PLANKS.length;

const nearest = (row: number, x: number) =>
  PLANKS.filter((p) => p.row === row).sort((a, b) => Math.abs(a.cx - x) - Math.abs(b.cx - x))[0].id;

/** 第一块被替换的木板（吃水线附近）与最后一块原始木板（船身正中），用于特写镜头。 */
export const FIRST_PLANK = nearest(4, 160);
export const LAST_PLANK = nearest(2, -40);

/** 一个确定性的替换顺序：先从最破的地方（吃水线附近）开始，带随机扰动。 */
export const REPLACE_ORDER: number[] = [
  FIRST_PLANK,
  ...PLANKS.map((p) => p.id)
    .filter((id) => id !== FIRST_PLANK && id !== LAST_PLANK)
    .sort((a, b) => {
      const pa = PLANKS[a];
      const pb = PLANKS[b];
      const sa = Math.abs(pa.row - 4) * 0.5 + random(`o${a}`) * 2.2;
      const sb = Math.abs(pb.row - 4) * 0.5 + random(`o${b}`) * 2.2;
      return sa - sb;
    }),
  LAST_PLANK,
];

/** rank[id] = 该木板在替换顺序中的位置 */
export const REPLACE_RANK: number[] = (() => {
  const r = new Array(PLANK_COUNT).fill(0);
  REPLACE_ORDER.forEach((id, i) => (r[id] = i));
  return r;
})();


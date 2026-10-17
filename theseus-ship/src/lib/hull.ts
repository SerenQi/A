// 船体几何（船体局部坐标）：x ∈ [-HALF, HALF]，船尾在左、船首在右；y 向下。
// 原点为船体中心，水线在 y = WATERLINE。

export const HALF = 450;
export const WATERLINE = 22;
export const STRAKES = 5;

export type Pt = [number, number];

const tt = (x: number) => Math.max(-1, Math.min(1, x / HALF));

/** 近侧舷缘（船舷上沿）：中段平缓，两端上扬，船首略高 */
export const sheer = (x: number) => {
  const t = tt(x);
  const a = Math.abs(t);
  return -42 - 30 * a * a - (t > 0 ? 30 : 22) * Math.pow(a, 5);
};

/** 龙骨：中段近乎平直，靠近两端才扫起，与舷缘在船首、船尾交汇 */
const keelRaw = (x: number) => {
  const t = tt(x);
  const a = Math.abs(t);
  const rise = Math.pow(Math.max(0, (a - 0.32) / 0.68), 2.1);
  // 端点处与舷缘重合：50 - 152 = sheer(船首) = -102；50 - 144 = sheer(船尾) = -94
  return 50 - (t > 0 ? 152 : 144) * rise;
};

export const depth = (x: number) => Math.max(0, keelRaw(x) - sheer(x));
export const keel = (x: number) => sheer(x) + depth(x);
export const hullY = (x: number, frac: number) => sheer(x) + depth(x) * frac;

/** 远侧舷缘：给船体一点空间深度 */
export const farSheer = (x: number) => sheer(x) - 13 * Math.pow(Math.max(0, 1 - tt(x) ** 2), 0.8);

export const sample = (x0: number, x1: number, fn: (x: number) => number, n = 48): Pt[] => {
  const pts: Pt[] = [];
  for (let i = 0; i <= n; i++) {
    const x = x0 + ((x1 - x0) * i) / n;
    pts.push([x, fn(x)]);
  }
  return pts;
};

export const toD = (pts: Pt[], close = false) =>
  `M${pts.map((p) => `${p[0].toFixed(2)},${p[1].toFixed(2)}`).join('L')}${close ? 'Z' : ''}`;

// ---------- 结构线 ----------
const STEM_TIP: Pt = [HALF, sheer(HALF)];
const STERN_TIP: Pt = [-HALF, sheer(-HALF)];

export const STRUCT = {
  sheer: toD(sample(-HALF, HALF, sheer, 80)),
  keel: toD(sample(-HALF, HALF, keel, 80)),
  far: toD(sample(-HALF + 14, HALF - 10, farSheer, 60)),
  /** 船首柱：向前上方微微前倾 */
  stem: `M${STEM_TIP[0]},${STEM_TIP[1]} C${STEM_TIP[0] + 22},${STEM_TIP[1] - 22} ${STEM_TIP[0] + 30},${STEM_TIP[1] - 62} ${STEM_TIP[0] + 18},${STEM_TIP[1] - 96}`,
  /** 船尾柱：向内收的小卷 */
  stern: `M${STERN_TIP[0]},${STERN_TIP[1]} C${STERN_TIP[0] - 26},${STERN_TIP[1] - 26} ${STERN_TIP[0] - 34},${STERN_TIP[1] - 74} ${STERN_TIP[0] - 12},${STERN_TIP[1] - 92} C${STERN_TIP[0] + 4},${STERN_TIP[1] - 104} ${STERN_TIP[0] + 20},${STERN_TIP[1] - 90} ${STERN_TIP[0] + 8},${STERN_TIP[1] - 80}`,
  /** 船舱内的横梁（远近舷缘之间） */
  thwarts: Array.from({length: 11}, (_, i) => {
    const x = -330 + i * 66;
    return `M${x},${farSheer(x).toFixed(2)}L${(x + 3).toFixed(2)},${sheer(x).toFixed(2)}`;
  }),
  mastX: 30,
  mastTop: -372,
  yardY: -338,
  yard: [-150, 220] as const,
  /** 舵桨 */
  rudder: `M-356,${(sheer(-356) - 6).toFixed(2)} L-414,${WATERLINE + 22}`,
  rudderBlade: `M-404,${WATERLINE - 4} Q-424,${WATERLINE + 16} -420,${WATERLINE + 34} Q-404,${WATERLINE + 18} -404,${WATERLINE - 4}Z`,
};

// ---------- 木板 ----------
export type Plank = {
  id: number;
  strake: number;
  t0: number;
  t1: number;
  d: string;
  /** 外轮廓采样点（用于粒子与形变） */
  edge: Pt[];
  /** 同一块板“拉直”后的轮廓（放进旧料区时使用），与 edge 逐点对应 */
  straight: Pt[];
  grain: string[];
  grainPts: Pt[][];
  grainStraight: Pt[][];
  cx: number;
  cy: number;
  /** 弦线角度（度），用于放平到旧料区 */
  angle: number;
  /** 指向船外的单位法向 */
  nx: number;
  ny: number;
};

const SEAMS: number[][] = [
  [-0.5, 0, 0.5],
  [-0.72, -0.24, 0.24, 0.72],
  [-0.5, 0, 0.5],
  [-0.72, -0.24, 0.24, 0.72],
  [-0.5, 0, 0.5],
];

// 稳定的伪随机（不依赖帧）
const hash = (n: number) => {
  const s = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return s - Math.floor(s);
};

const buildPlanks = (): Plank[] => {
  const out: Plank[] = [];
  for (let r = 0; r < STRAKES; r++) {
    const f0 = r / STRAKES;
    const f1 = (r + 1) / STRAKES;
    const b = [-1, ...SEAMS[r], 1];
    for (let i = 0; i < b.length - 1; i++) {
      const x0 = b[i] * HALF;
      const x1 = b[i + 1] * HALF;
      const top = sample(x0, x1, (x) => hullY(x, f0), 18);
      const bot = sample(x1, x0, (x) => hullY(x, f1), 18);
      const edge = [...top, ...bot];
      const fm = (f0 + f1) / 2;
      const m0 = hullY(x0, fm);
      const m1 = hullY(x1, fm);
      const straighten = (q: Pt): Pt => [q[0], q[1] - hullY(q[0], fm) + m0 + ((m1 - m0) * (q[0] - x0)) / (x1 - x0)];
      const grainPts: Pt[][] = [];
      for (let g = 0; g < 3; g++) {
        const ff = f0 + (f1 - f0) * (0.28 + g * 0.22 + (hash(out.length * 7 + g) - 0.5) * 0.08);
        const pad = (x1 - x0) * (0.06 + hash(out.length * 13 + g) * 0.08);
        grainPts.push(sample(x0 + pad, x1 - pad * 0.6, (x) => hullY(x, ff), 14));
      }
      const grain = grainPts.map((g) => toD(g));
      const straight = edge.map(straighten);
      const grainStraight = grainPts.map((g) => g.map(straighten));
      const cx = (x0 + x1) / 2;
      const cy = hullY(cx, (f0 + f1) / 2);
      const pa: Pt = [x0, hullY(x0, (f0 + f1) / 2)];
      const pb: Pt = [x1, hullY(x1, (f0 + f1) / 2)];
      const angle = (Math.atan2(pb[1] - pa[1], pb[0] - pa[0]) * 180) / Math.PI;
      // 外法向：离开船体中心（略偏向下方）
      const vx = cx * 0.25;
      const vy = cy + 40;
      const len = Math.hypot(vx, vy) || 1;
      out.push({id: out.length, strake: r, t0: b[i], t1: b[i + 1], d: toD(edge, true), edge, straight, grain, grainPts, grainStraight, cx, cy, angle, nx: vx / len, ny: vy / len});
    }
  }
  return out;
};

export const PLANKS = buildPlanks();
export const PLANK_COUNT = PLANKS.length;

const find = (strake: number, t: number) => PLANKS.find((p) => p.strake === strake && p.t0 <= t && p.t1 >= t)!.id;

/** 开场特写、第一个被换下的木板：右侧中间一列 */
export const FIRST = find(2, 0.25);
/** 最后一块原始木板：船身正中 */
export const LAST = find(1, 0);

/** 均匀分布的外轮廓采样点 */
export const resample = (pts: Pt[], n: number, closed = true): Pt[] => {
  const segs: number[] = [];
  let total = 0;
  const m = closed ? pts.length : pts.length - 1;
  for (let i = 0; i < m; i++) {
    const a = pts[i];
    const b = pts[(i + 1) % pts.length];
    const l = Math.hypot(b[0] - a[0], b[1] - a[1]);
    segs.push(l);
    total += l;
  }
  const out: Pt[] = [];
  let seg = 0;
  let acc = 0;
  for (let k = 0; k < n; k++) {
    const target = (k / n) * total;
    while (seg < segs.length - 1 && acc + segs[seg] < target) {
      acc += segs[seg];
      seg++;
    }
    const a = pts[seg];
    const b = pts[(seg + 1) % pts.length];
    const u = segs[seg] > 0 ? (target - acc) / segs[seg] : 0;
    out.push([a[0] + (b[0] - a[0]) * u, a[1] + (b[1] - a[1]) * u]);
  }
  return out;
};

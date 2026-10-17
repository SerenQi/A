// 故事状态：一切由帧号推导（任意跳帧都正确）。
import {FPS, W, H} from '../config';
import {FIRST, LAST, PLANKS, PLANK_COUNT, Plank, WATERLINE} from './hull';

export const s2f = (s: number) => s * FPS;

// ---------- 缓动 ----------
export const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
export const easeInOut = (t: number) => {
  const x = clamp01(t);
  return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
};
export const easeOut = (t: number) => 1 - Math.pow(1 - clamp01(t), 3);
export const easeIn = (t: number) => Math.pow(clamp01(t), 3);
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
/** 秒区间 [a,b] 上的 0→1 进度（easeInOut） */
export const span = (sec: number, a: number, b: number, ease = easeInOut) => ease((sec - a) / (b - a));
/** 淡入 [a,a+i]、保持、淡出 [b-o,b] */
export const win = (sec: number, a: number, b: number, i = 0.6, o = 0.6) =>
  Math.min(span(sec, a, a + i), 1 - span(sec, b - o, b));

// ---------- 世界坐标 ----------
export const SHIP_A = {x: 1000, y: 500};
export const SHIP_B = {x: 20, y: 500};
export const GROUND = SHIP_A.y + WATERLINE; // 水平线

/** 轻微“呼吸”浮动，幅度 < 5px */
export const bob = (sec: number, phase = 0) => Math.sin((sec / 6.5) * Math.PI * 2 + phase) * 2.6;

// ---------- 拆换时间表（秒） ----------
export type Swap = {
  id: number;
  k: number; // 第几个被拆下（= 旧料区槽位）
  hl: number; // 开始强调
  out: number; // 从接缝向外推出
  outEnd: number;
  pile: number; // 落入旧料区
  inn: number; // 新板开始进入
  slide: number; // 贴合
  done: number;
};

const generic = (id: number, k: number, start: number, d: number): Swap => ({
  id,
  k,
  hl: start,
  out: start + 0.16 * d,
  outEnd: start + 0.28 * d,
  pile: start + 0.56 * d,
  inn: start + 0.6 * d,
  slide: start + 0.86 * d,
  done: start + d,
});

const byStrakeT = (s: number, t: number) => PLANKS.find((p) => p.strake === s && p.t0 <= t && p.t1 >= t)!.id;
const READABLE = [byStrakeT(3, -0.45), byStrakeT(0, 0.3), byStrakeT(4, -0.2), byStrakeT(1, 0.5)];
const hash = (n: number) => {
  const s = Math.sin(n * 91.7 + 17.3) * 43758.5453;
  return s - Math.floor(s);
};
const RAPID = PLANKS.map((p) => p.id)
  .filter((id) => id !== FIRST && id !== LAST && !READABLE.includes(id))
  .sort((a, b) => hash(a) - hash(b));

export const SWAPS: Swap[] = (() => {
  const list: Swap[] = [];
  list.push({id: FIRST, k: 0, hl: 20.0, out: 22.0, outEnd: 22.9, pile: 25.0, inn: 28.0, slide: 30.3, done: 31.0});
  const rs = [
    [34.6, 2.7],
    [37.5, 2.5],
    [40.2, 2.3],
    [42.6, 2.0],
  ];
  READABLE.forEach((id, i) => list.push(generic(id, list.length, rs[i][0], rs[i][1])));
  RAPID.forEach((id, i) => list.push(generic(id, list.length, 44.6 + i * 0.36, 1.5)));
  list.push({id: LAST, k: list.length, hl: 52.0, out: 53.6, outEnd: 54.1, pile: 55.3, inn: 55.4, slide: 56.6, done: 57.2});
  return list;
})();

export const SWAP_OF: Swap[] = (() => {
  const a: Swap[] = new Array(PLANK_COUNT);
  SWAPS.forEach((s) => (a[s.id] = s));
  return a;
})();

/** 旧料区：两列整齐堆放 */
export const pileSlot = (k: number) => ({x: 210 + (k % 2) * 236 + (Math.floor(k / 2) % 2) * 10, y: GROUND - 6 - Math.floor(k / 2) * 12});

/** 重组顺序：先靠近龙骨的列板，再到船舷 */
export const BUILD_ORDER = [...PLANKS].sort((a, b) => b.strake - a.strake || a.t0 - b.t0).map((p) => p.id);
export const buildTime = (id: number) => {
  const j = BUILD_ORDER.indexOf(id);
  const start = 78.2 + j * 0.34;
  return {start, end: start + 1.7};
};

export type Piece = {x: number; y: number; rot: number; sy: number; scale: number; opacity: number; straight?: number};

const quad = (a: number, b: number, c: number, t: number) => (1 - t) * (1 - t) * a + 2 * (1 - t) * t * b + t * t * c;

/** 旧木板（原始材料）此刻在世界中的位置 */
export const oldPiece = (p: Plank, sec: number): Piece => {
  const s = SWAP_OF[p.id];
  const ax = SHIP_A.x + p.cx;
  const ay = SHIP_A.y + p.cy + bob(sec);
  const out = 40;
  if (sec < s.out) return {x: ax, y: ay, rot: 0, sy: 1, scale: 1, opacity: 1};
  if (sec < s.outEnd) {
    const e = span(sec, s.out, s.outEnd);
    return {x: ax + p.nx * out * e, y: ay + p.ny * out * e, rot: 0, sy: 1, scale: 1 + 0.03 * e, opacity: 1};
  }
  const ps = pileSlot(s.k);
  const sx = ax + p.nx * out;
  const sy0 = ay + p.ny * out;
  const b = buildTime(p.id);
  if (sec < s.pile) {
    const e = span(sec, s.outEnd, s.pile);
    const cx = (sx + ps.x) / 2;
    const cy = Math.min(sy0, ps.y) - 120;
    return {x: quad(sx, cx, ps.x, e), y: quad(sy0, cy, ps.y, e), rot: -p.angle * e, sy: lerp(1, 0.55, e), scale: 1.03, opacity: 1, straight: e};
  }
  if (sec < b.start) return {x: ps.x, y: ps.y, rot: -p.angle, sy: 0.55, scale: 1.03, opacity: 1, straight: 1};
  // 升起，组成 B 船
  const tx = SHIP_B.x + p.cx;
  const ty = SHIP_B.y + p.cy + bob(sec, 1.7);
  const e = span(sec, b.start, b.end);
  const cy = Math.min(ps.y, ty) - 160;
  return {x: quad(ps.x, (ps.x + tx) / 2, tx, e), y: quad(ps.y, cy, ty, e), rot: -p.angle * (1 - e), sy: lerp(0.55, 1, e), scale: lerp(1.03, 1, e), opacity: 1, straight: 1 - e};
};

/** 新木板此刻的位置；未进入时 opacity = 0 */
export const newPiece = (p: Plank, sec: number): Piece => {
  const s = SWAP_OF[p.id];
  const ax = SHIP_A.x + p.cx;
  const ay = SHIP_A.y + p.cy + bob(sec);
  if (sec < s.inn) return {x: ax, y: ay, rot: 0, sy: 1, scale: 1, opacity: 0};
  const ox = ax + p.nx * 40;
  const oy = ay + p.ny * 40;
  if (sec < s.slide) {
    const e = span(sec, s.inn, s.slide);
    const ex = SHIP_A.x + 760;
    const ey = SHIP_A.y + 330;
    const cx = (ex + ox) / 2 + 60;
    const cy = Math.max(ey, oy) + 40;
    return {x: quad(ex, cx, ox, e), y: quad(ey, cy, oy, e), rot: 14 * (1 - e), sy: 1, scale: 1.03, opacity: clamp01(e * 4)};
  }
  const e = span(sec, s.slide, s.done);
  return {x: lerp(ox, ax, e), y: lerp(oy, ay, e), rot: 0, sy: 1, scale: lerp(1.03, 1, e), opacity: 1};
};

/** 0..1：此刻 A 船上已更换的比例 */
export const replacedCount = (sec: number) => SWAPS.filter((s) => sec >= s.done).length;

// ---------- 镜头 ----------
export type Cam = {x: number; y: number; z: number; r: number};

const P1 = {x: SHIP_A.x + PLANKS[FIRST].cx, y: SHIP_A.y + PLANKS[FIRST].cy};
const PL = {x: SHIP_A.x + PLANKS[LAST].cx, y: SHIP_A.y + PLANKS[LAST].cy};
const HOME: Cam = {x: SHIP_A.x, y: 470, z: 1.05, r: 0};
const WIDE: Cam = {x: 860, y: 480, z: 0.95, r: 0};
const TWO: Cam = {x: 510, y: 470, z: 0.86, r: 0};

const KEYS: [number, Cam][] = [
  [0, {x: P1.x, y: P1.y - 30, z: 3.3, r: -9}],
  [1.8, {x: P1.x, y: P1.y - 30, z: 3.2, r: -8}],
  [4.2, {x: P1.x - 40, y: P1.y - 50, z: 2.6, r: -5}],
  [7.6, HOME],
  [20.0, HOME],
  [21.8, {x: P1.x - 60, y: P1.y - 30, z: 1.65, r: 0}],
  [22.5, {x: P1.x - 60, y: P1.y - 30, z: 1.65, r: 0}],
  [24.8, {x: 700, y: 480, z: 0.95, r: 0}],
  [26.4, {x: 990, y: 480, z: 1.3, r: 0}],
  [31.0, {x: 990, y: 480, z: 1.3, r: 0}],
  [33.2, WIDE],
  [50.8, WIDE],
  [52.2, {x: PL.x, y: PL.y - 20, z: 1.7, r: 0}],
  [53.8, {x: PL.x, y: PL.y - 20, z: 1.7, r: 0}],
  [55.4, WIDE],
  [57.6, HOME],
  [75.0, HOME],
  [77.4, {x: 330, y: 500, z: 1.05, r: 0}],
  [79.0, {x: 200, y: 470, z: 0.95, r: 0}],
  [88.6, {x: 200, y: 470, z: 0.95, r: 0}],
  [91.6, TWO],
  [130.6, TWO],
  [133.4, HOME],
  [149.0, HOME],
  [165.0, {...HOME, z: 1.09}],
];

export const camera = (sec: number): Cam => {
  if (sec <= KEYS[0][0]) return KEYS[0][1];
  for (let i = 0; i < KEYS.length - 1; i++) {
    const [ta, a] = KEYS[i];
    const [tb, b] = KEYS[i + 1];
    if (sec <= tb) {
      const e = easeInOut((sec - ta) / (tb - ta));
      return {x: lerp(a.x, b.x, e), y: lerp(a.y, b.y, e), z: lerp(a.z, b.z, e), r: lerp(a.r, b.r, e)};
    }
  }
  return KEYS[KEYS.length - 1][1];
};

/** 世界坐标 → 屏幕坐标（与 SVG 父级 camera group 完全一致） */
export const toScreen = (cam: Cam, x: number, y: number) => {
  const dx = (x - cam.x) * cam.z;
  const dy = (y - cam.y) * cam.z;
  const r = (cam.r * Math.PI) / 180;
  return {x: W / 2 + dx * Math.cos(r) - dy * Math.sin(r), y: H / 2 + dx * Math.sin(r) + dy * Math.cos(r)};
};

export const toWorld = (cam: Cam, sx: number, sy: number) => {
  const r = (-cam.r * Math.PI) / 180;
  const dx = sx - W / 2;
  const dy = sy - H / 2;
  return {x: cam.x + (dx * Math.cos(r) - dy * Math.sin(r)) / cam.z, y: cam.y + (dx * Math.sin(r) + dy * Math.cos(r)) / cam.z};
};

export const cameraTransform = (cam: Cam) =>
  `translate(${W / 2},${H / 2}) rotate(${cam.r}) scale(${cam.z}) translate(${-cam.x},${-cam.y})`;

export {FIRST, LAST};

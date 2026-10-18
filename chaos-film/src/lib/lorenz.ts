// 洛伦兹方程（σ=10, ρ=28, β=8/3）的确定性积分，结果缓存。
export type V3 = {x: number; y: number; z: number};

const S = 10;
const R = 28;
const B = 8 / 3;
const f = (p: V3): V3 => ({x: S * (p.y - p.x), y: p.x * (R - p.z) - p.y, z: p.x * p.y - B * p.z});
const add = (a: V3, b: V3, k: number): V3 => ({x: a.x + b.x * k, y: a.y + b.y * k, z: a.z + b.z * k});

export const step = (p: V3, dt: number): V3 => {
  const k1 = f(p);
  const k2 = f(add(p, k1, dt / 2));
  const k3 = f(add(p, k2, dt / 2));
  const k4 = f(add(p, k3, dt));
  return {
    x: p.x + (dt / 6) * (k1.x + 2 * k2.x + 2 * k3.x + k4.x),
    y: p.y + (dt / 6) * (k1.y + 2 * k2.y + 2 * k3.y + k4.y),
    z: p.z + (dt / 6) * (k1.z + 2 * k2.z + 2 * k3.z + k4.z),
  };
};

const cache = new Map<string, V3[]>();
export const trajectory = (start: V3, n: number, dt = 0.01): V3[] => {
  const key = `${start.x},${start.y},${start.z}|${n}|${dt}`;
  const hit = cache.get(key);
  if (hit) return hit;
  const out: V3[] = [start];
  let p = start;
  for (let i = 1; i < n; i++) {
    p = step(p, dt);
    out.push(p);
  }
  cache.set(key, out);
  return out;
};

/** 吸引子本体：先跑掉暂态，再取一长段轨迹，平移到以 (0,0,25) 为中心 */
export const attractor = (n = 24000) => {
  const warm = trajectory({x: 1, y: 1, z: 1}, 2000, 0.005);
  const tr = trajectory(warm[warm.length - 1], n, 0.005);
  return tr.map((p) => ({x: p.x, y: p.y, z: p.z - 25}));
};

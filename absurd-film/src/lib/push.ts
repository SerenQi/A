import {H, W} from '../config';
import {NORMAL, SLOPE_LEN, slopePoint} from '../components/Land';

export const STONE_R = 70;

/** 石头在坡上距坡底 u 处时的圆心与滚动角 */
export const stoneAt = (u: number, r = STONE_R) => {
  const p = slopePoint(u);
  const c = u >= 0 ? {x: p.x + NORMAL.x * r, y: p.y + NORMAL.y * r} : {x: p.x, y: p.y - r};
  return {...c, rot: (u / r) * (180 / Math.PI)};
};

/** 推石时小人的站位：脚在石头后方的坡面上 */
export const pusherAt = (u: number, r = STONE_R) => slopePoint(u - r - 78);

export const TOP_U = SLOPE_LEN * 0.93;

export type Cam = {x: number; y: number; z: number};
export const camTf = (c: Cam) => `translate(${W / 2},${H / 2}) scale(${c.z}) translate(${-c.x},${-c.y})`;

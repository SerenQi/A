import {Easing} from 'remotion';
import type {PlankLook} from '../components/Ship';
import {clamp01, prog} from './math';
import {PLANK_COUNT, Plank, REPLACE_RANK} from './ship';

// 「替换」一幕中每块木板的时间表（场景内帧号）
export type Slot = {heat0: number; det: number; inn: number; land: number};

const N = PLANK_COUNT;

export const slotFor = (rank: number): Slot => {
  if (rank === 0) return {heat0: 165, det: 205, inn: 232, land: 278};
  if (rank === N - 1) return {heat0: 790, det: 872, inn: 890, land: 912};
  const k = (rank - 1) / (N - 3);
  const land = 345 + 410 * Math.pow(k, 0.55);
  return {heat0: land - 40, det: land - 22, inn: land - 16, land};
};

export const SLOTS: Slot[] = Array.from({length: N}, (_, r) => slotFor(r));

export const slotOf = (p: Plank) => SLOTS[REPLACE_RANK[p.id]];

/** 随时间整体老化的程度 */
export const baseWear = (frame: number, p: Plank) => prog(frame, 0, 150) * (0.3 + p.seed * 0.45);

export const plankLook = (frame: number, p: Plank): PlankLook => {
  const s = slotOf(p);
  const rank = REPLACE_RANK[p.id];
  if (frame < s.det) {
    const special = rank === 0 || rank === N - 1;
    const heatT = special ? prog(frame, s.heat0, s.det - 4) : prog(frame, s.heat0, s.det);
    const pulse = rank === N - 1 ? 0.55 + 0.45 * Math.abs(Math.sin((frame - s.heat0) / 7)) : 1;
    return {
      wear: Math.min(1, baseWear(frame, p) + prog(frame, s.heat0 - 60, s.det) * 0.35),
      heat: heatT * pulse,
    };
  }
  if (frame < s.inn) return {opacity: 0};
  if (frame < s.land) {
    const t = clamp01((frame - s.inn) / (s.land - s.inn));
    const e = Easing.out(Easing.cubic)(t);
    return {fresh: 1, glow: 1, dy: -(1 - e) * 650, rot: (1 - e) * 18, opacity: clamp01(t * 3)};
  }
  const since = frame - s.land;
  return {fresh: 1 - 0.12 * clamp01(since / 400), glow: Math.exp(-since / 14)};
};

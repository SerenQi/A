import {Easing, interpolate, random} from 'remotion';

export const clamp01 = (v: number) => Math.max(0, Math.min(1, v));

/** 0→1 between frames a and b, clamped, with optional easing. */
export const prog = (
  frame: number,
  a: number,
  b: number,
  ease: (t: number) => number = Easing.inOut(Easing.cubic),
) =>
  interpolate(frame, [a, b], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: ease,
  });

/** Fade in over [a, a+i], hold, fade out over [b-o, b]. */
export const window01 = (frame: number, a: number, b: number, i = 15, o = 15) =>
  Math.min(prog(frame, a, a + i, Easing.out(Easing.quad)), 1 - prog(frame, b - o, b, Easing.in(Easing.quad)));

export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

export const rnd = (seed: string | number) => random(seed);

export const rndRange = (seed: string | number, a: number, b: number) => a + random(seed) * (b - a);

type RGB = [number, number, number];

export const hex = (h: string): RGB => {
  const n = parseInt(h.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
};

export const mixRGB = (a: RGB, b: RGB, t: number): RGB => [
  lerp(a[0], b[0], t),
  lerp(a[1], b[1], t),
  lerp(a[2], b[2], t),
];

export const rgb = (c: RGB, alpha = 1) =>
  `rgba(${Math.round(c[0])},${Math.round(c[1])},${Math.round(c[2])},${alpha})`;

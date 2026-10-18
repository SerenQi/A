// 片中用到的点云，首次使用时生成并缓存。
import {FONTS} from '../config';
import {SHAPES} from '../components/Dots';
import {P3, extrude, resample, sample2D} from './points';

const memo = new Map<string, P3[]>();
const get = (k: string, make: () => P3[], cacheable = () => true) => {
  const hit = memo.get(k);
  if (hit) return hit;
  const v = make();
  if (v.length && cacheable()) memo.set(k, v);
  return v;
};

export const N = 5200;

const pathCloud = (d: string, scale: number, step: number, depth: number, strokes?: {d: string; w: number}) =>
  extrude(
    sample2D(
      `${d}|${strokes?.d ?? ''}`,
      (ctx) => {
        ctx.scale(scale, scale);
        ctx.fill(new Path2D(d));
        if (strokes) {
          ctx.lineWidth = strokes.w;
          ctx.lineCap = 'round';
          ctx.stroke(new Path2D(strokes.d));
        }
      },
      2000,
      step,
    ),
    depth,
  );

export const headCloud = () => get('head', () => resample(pathCloud(SHAPES.head, 2.0, 6, 0.75), N, 1));

const COW_BODY =
  'M-240,-90 C-250,-170 -190,-200 -90,-198 L140,-200 C200,-200 230,-170 232,-120 C234,-80 210,-50 170,-48 L-180,-46 C-220,-48 -238,-62 -240,-90 Z M222,-168 L300,-212 C330,-228 372,-216 386,-190 L404,-150 C408,-136 398,-126 384,-128 L330,-138 C300,-142 268,-128 232,-118 L230,-170 Z';
const COW_LIMBS = 'M-190,-60 L-194,60 M-138,-60 L-134,60 M122,-60 L118,60 M176,-60 L180,60 M-240,-120 C-276,-100 -282,-40 -270,-8 M318,-214 C310,-246 324,-264 346,-270';
export const cowCloud = () => get('cow', () => resample(pathCloud(COW_BODY, 2.0, 6, 0.55, {d: COW_LIMBS, w: 22}), N, 2));

/** 点云在原始路径坐标里的重心（extrude 会把点平移到以重心为原点） */
export const centroidOf = (d: string, scale: number, strokes?: {d: string; w: number}) => {
  const pts = sample2D(
    `${d}|${strokes?.d ?? ''}`,
    (ctx) => {
      ctx.scale(scale, scale);
      ctx.fill(new Path2D(d));
      if (strokes) {
        ctx.lineWidth = strokes.w;
        ctx.lineCap = 'round';
        ctx.stroke(new Path2D(strokes.d));
      }
    },
    2000,
    6,
  );
  let x = 0;
  let y = 0;
  for (const p of pts) {
    x += p.x;
    y += p.y;
  }
  return {x: x / (pts.length || 1), y: y / (pts.length || 1)};
};
export const COW = {body: COW_BODY, limbs: COW_LIMBS};

export const personCloud = (n = 600) => get(`person${n}`, () => resample(pathCloud(SHAPES.person, 1.0, 4, 0.5), n, 4));
export const slumpCloud = (n = 600) => get(`slump${n}`, () => resample(pathCloud(SHAPES.slump, 1.0, 4, 0.5), n, 4));

export const textCloud = (text: string, size: number, n = N) =>
  get(
    `text|${text}|${size}|${n}`,
    () => {
      const ready = typeof document !== 'undefined' && document.fonts.check(`900 ${size}px ${FONTS.title}`, text);
      const pts = sample2D(
        `txt|${text}|${size}|${ready}`,
        (ctx) => {
          ctx.font = `900 ${size}px ${FONTS.title}`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(text, 0, 0);
        },
        2000,
        5,
      );
      return resample(
        pts.map((p) => ({x: p.x, y: p.y, z: 0})),
        n,
        6,
      );
    },
    () => typeof document !== 'undefined' && document.fonts.check(`900 ${size}px ${FONTS.title}`, text),
  );

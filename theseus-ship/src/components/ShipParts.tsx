import React from 'react';
import {PALETTE, STROKE} from '../config';
import {HALF, Plank, Pt, STRUCT, farSheer, sheer, toD} from '../lib/hull';

const mix = (a: Pt[], b: Pt[], k: number): Pt[] => a.map((p, i) => [p[0] + (b[i][0] - p[0]) * k, p[1] + (b[i][1] - p[1]) * k]);
import type {Piece} from '../lib/story';

type Common = {
  /** 1 / 镜头缩放：让线宽在屏幕上保持恒定 */
  u: number;
};

/** 画线进度：pathLength=1 的虚线描绘 */
const drawn = (p: number | undefined) =>
  p === undefined || p >= 1 ? {} : {pathLength: 1, strokeDasharray: 1, strokeDashoffset: 1 - Math.max(0, p)};

/**
 * 船的结构线（不含木板）。
 * outline: 外轮廓描绘进度；inner: 内部结构描绘进度；level: 整体亮度。
 */
export const ShipFrame: React.FC<
  Common & {x: number; y: number; level?: number; outline?: number; inner?: number; color?: string; glow?: number}
> = ({x, y, u, level = 1, outline, inner, color = PALETTE.line, glow = 0}) => {
  const main = STROKE.main * u;
  const thin = STROKE.inner * u;
  const fine = STROKE.fine * u;
  const mx = STRUCT.mastX;
  return (
    <g transform={`translate(${x},${y})`} opacity={level} fill="none" strokeLinecap="round" strokeLinejoin="round">
      {/* 内部结构：远侧舷缘、横梁、桅杆、索具、舵桨 */}
      <g stroke={PALETTE.inner} strokeWidth={thin}>
        <path d={STRUCT.far} {...drawn(inner)} />
        {STRUCT.thwarts.map((d, i) => (
          <path key={i} d={d} strokeWidth={fine} {...drawn(inner)} />
        ))}
        <path d={`M${mx},${farSheer(mx)}L${mx},${STRUCT.mastTop}`} stroke={color} strokeOpacity={0.55} strokeWidth={thin * 1.3} {...drawn(inner)} />
        <path d={`M${STRUCT.yard[0]},${STRUCT.yardY + 4}Q${mx},${STRUCT.yardY - 6} ${STRUCT.yard[1]},${STRUCT.yardY + 4}`} stroke={color} strokeOpacity={0.5} {...drawn(inner)} />
        {/* 收起的帆：横桁下两道细线与几处绑绳 */}
        <path d={`M${STRUCT.yard[0] + 10},${STRUCT.yardY + 10}Q${mx},${STRUCT.yardY + 2} ${STRUCT.yard[1] - 10},${STRUCT.yardY + 10}`} strokeWidth={fine} {...drawn(inner)} />
        {[-110, -50, 10, 90, 160].map((sx) => (
          <path key={sx} d={`M${sx},${STRUCT.yardY - 1}l0,12`} strokeWidth={fine} {...drawn(inner)} />
        ))}
        <path d={`M${mx},${STRUCT.mastTop + 6}L${HALF + 18},${sheer(HALF) - 94}`} strokeWidth={fine} {...drawn(inner)} />
        <path d={`M${mx},${STRUCT.mastTop + 6}L${-HALF - 8},${sheer(-HALF) - 88}`} strokeWidth={fine} {...drawn(inner)} />
        <path d={STRUCT.rudder} strokeWidth={thin * 1.2} {...drawn(inner)} />
        <path d={STRUCT.rudderBlade} strokeWidth={thin} {...drawn(inner)} />
      </g>
      {/* 外轮廓 */}
      <g stroke={color} strokeWidth={main}>
        {glow > 0 && (
          <g strokeWidth={main * 4} strokeOpacity={0.09 * glow}>
            <path d={STRUCT.sheer} />
            <path d={STRUCT.keel} />
          </g>
        )}
        <path d={STRUCT.sheer} {...drawn(outline)} />
        <path d={STRUCT.keel} {...drawn(outline)} />
        <path d={STRUCT.stem} {...drawn(outline)} />
        <path d={STRUCT.stern} {...drawn(outline)} />
      </g>
    </g>
  );
};

export type Material = 'old' | 'new';

/** 一块木板：以世界坐标 piece 放置（piece.x/y 为木板中心） */
export const PlankShape: React.FC<
  Common & {
    p: Plank;
    piece: Piece;
    material: Material;
    level?: number;
    /** 0..1 局部强调（accent 色） */
    emphasis?: number;
    /** 0..1 纤维纹理亮度 */
    grain?: number;
    /** 纤维描绘进度（开场） */
    grainDraw?: number;
    /** 覆盖材质色（结尾统一） */
    tint?: string;
    fillAlpha?: number;
  }
> = ({p, piece, material, u, level = 1, emphasis = 0, grain = 0.5, grainDraw, tint, fillAlpha = 0.13}) => {
  if (piece.opacity <= 0.001 || level <= 0.001) return null;
  const col = tint ?? (material === 'old' ? PALETTE.oldWood : PALETTE.newWood);
  const alpha = material === 'new' && !tint ? fillAlpha * 1.7 : fillAlpha * 1.25;
  // 木板随 sy 压扁时，线宽按最小方向补偿
  const k = u / (piece.scale * Math.min(1, piece.sy));
  const k0 = piece.straight ?? 0;
  const d = k0 > 0.001 ? toD(mix(p.edge, p.straight, k0), true) : p.d;
  const grains = k0 > 0.001 ? p.grainPts.map((g, i) => toD(mix(g, p.grainStraight[i], k0))) : p.grain;
  // 先旋转放平，再压扁（顺序不能反，否则斜板会被压歪）
  const tf = `translate(${piece.x},${piece.y}) scale(${piece.scale},${piece.scale * piece.sy}) rotate(${piece.rot}) translate(${-p.cx},${-p.cy})`;
  return (
    <g transform={tf} opacity={piece.opacity * level} strokeLinejoin="round" strokeLinecap="round">
      {emphasis > 0.01 && <path d={d} fill="none" stroke={PALETTE.accent} strokeWidth={7 * k} strokeOpacity={0.12 * emphasis} />}
      <path d={d} fill={col} fillOpacity={alpha + 0.18 * emphasis} stroke={emphasis > 0.01 ? PALETTE.accent : PALETTE.inner} strokeOpacity={emphasis > 0.01 ? 0.5 + 0.5 * emphasis : 1} strokeWidth={(STROKE.inner + 0.7 * emphasis) * k} />
      <g fill="none" stroke={emphasis > 0.3 ? PALETTE.accent : col} strokeOpacity={material === 'new' ? Math.min(1, grain * 1.4) : grain} strokeWidth={STROKE.fine * k} strokeDasharray={grainDraw === undefined ? `${26 * u} ${5 * u} ${60 * u} ${4 * u}` : undefined}>
        {grains.map((gd, i) => (
          <path key={i} d={gd} {...drawn(grainDraw === undefined ? undefined : Math.min(1, grainDraw * 1.2 - i * 0.1))} />
        ))}
      </g>
    </g>
  );
};

/** 拆下后的缺口：暗红细虚线 */
export const Hole: React.FC<Common & {p: Plank; x: number; y: number; level: number}> = ({p, x, y, u, level}) =>
  level <= 0.01 ? null : (
    <path
      d={p.d}
      transform={`translate(${x - p.cx},${y - p.cy})`}
      fill={PALETTE.bg}
      fillOpacity={0.9 * level}
      stroke={PALETTE.conflict}
      strokeOpacity={level}
      strokeWidth={STROKE.inner * u}
      strokeDasharray={`${6 * u} ${5 * u}`}
    />
  );

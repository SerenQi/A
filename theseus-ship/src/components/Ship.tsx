import React from 'react';
import {C} from '../lib/theme';
import {hex, mixRGB, rgb} from '../lib/math';
import {HALF, PLANKS, Plank, WATERLINE, bottomY, hullY, topY} from '../lib/ship';

export type PlankLook = {
  /** 0 = 完好的原始木，1 = 彻底朽坏 */
  wear?: number;
  /** 0 = 原始木，1 = 刚换上的新木 */
  fresh?: number;
  /** 金色高光 */
  glow?: number;
  /** 余烬般的红光（即将被拆下） */
  heat?: number;
  dx?: number;
  dy?: number;
  rot?: number;
  scale?: number;
  opacity?: number;
};

type Props = {
  look?: (p: Plank) => PlankLook;
  /** 线稿描绘进度 0→1；为 undefined 时不显示描线 */
  draw?: number;
  /** 填充不透明度 */
  fill?: number;
  strokeColor?: string;
  /** 帆的鼓起程度 */
  billow?: number;
  oarPhase?: number;
  oars?: boolean;
  sail?: boolean;
  /** false 时只保留桅杆与横桁（帆已收起） */
  canvas?: boolean;
  /** 只画木板 */
  bare?: boolean;
  /** 统一的色调：warm 正常，ghost 冷色幽灵船 */
  tint?: 'warm' | 'ghost';
  frame?: number;
};

const ORIG = hex('#6f4627');
const WORN = hex('#2f3128');
const FRESH = hex('#e2b56e');
const HOT = hex('#fff1c4');
const EMBER = hex('#ff6a2c');

const toPath = (pts: [number, number][]) =>
  `M${pts.map((p) => `${p[0].toFixed(1)},${p[1].toFixed(1)}`).join('L')}`;

const sample = (x0: number, x1: number, fn: (x: number) => number, n = 40) => {
  const pts: [number, number][] = [];
  for (let i = 0; i <= n; i++) {
    const x = x0 + ((x1 - x0) * i) / n;
    pts.push([x, fn(x)]);
  }
  return pts;
};

const HULL_OUTLINE = (() => {
  const top = sample(-HALF, HALF, topY);
  const bot = sample(HALF, -HALF, bottomY);
  return `${toPath(top)}L${bot.map((p) => `${p[0].toFixed(1)},${p[1].toFixed(1)}`).join('L')}Z`;
})();

const RAIL = toPath(sample(-HALF, HALF, (x) => topY(x) - 6));
const WALE = toPath(sample(-430, 440, (x) => hullY(x, 0.5)));

// 船尾卷曲的装饰（aphlaston）
const STERN_CURL = (() => {
  const x0 = -HALF;
  const y0 = topY(-HALF);
  const pts: [number, number][] = [];
  for (let i = 0; i <= 60; i++) {
    const a = (i / 60) * Math.PI * 2.1;
    const r = 46 * (1 - i / 75);
    pts.push([x0 + 30 - Math.cos(a) * r + 10, y0 - 10 - Math.sin(a) * r]);
  }
  return toPath(pts);
})();

const RAM = `M300,8 L418,36 L316,48 Z`;

const OAR_X = Array.from({length: 13}, (_, i) => -300 + i * 50);

export const Ship: React.FC<Props> = ({
  look,
  draw,
  fill = 1,
  strokeColor = C.gold,
  billow = 0.6,
  oarPhase = 0,
  oars = true,
  sail = true,
  canvas = true,
  bare = false,
  tint = 'warm',
  frame = 0,
}) => {
  const outline = draw !== undefined;
  const dash = (p: number) =>
    outline
      ? {
          pathLength: 1,
          strokeDasharray: 1,
          strokeDashoffset: 1 - p,
          stroke: strokeColor,
          strokeWidth: 2.2,
          strokeOpacity: Math.min(1, p * 3),
        }
      : {};
  const d = draw ?? 1;
  const seg = (a: number, b: number) => Math.max(0, Math.min(1, (d - a) / (b - a)));

  const ghost = tint === 'ghost';
  const mastX = 20;
  const mastTop = -480;
  const yardY = -440;
  const sailL = -230;
  const sailR = 270;
  const sailBottom = -130 + billow * 18;
  const sway = Math.sin(frame / 40) * 6 * billow;
  const sailPath = `M${sailL},${yardY + 6} Q${(sailL + sailR) / 2},${yardY - 6} ${sailR},${yardY + 6}
    Q${sailR + 22 * billow + sway},${(yardY + sailBottom) / 2} ${sailR - 6},${sailBottom}
    Q${(sailL + sailR) / 2 + sway},${sailBottom + 40 * billow} ${sailL + 6},${sailBottom}
    Q${sailL - 18 * billow + sway},${(yardY + sailBottom) / 2} ${sailL},${yardY + 6} Z`;

  const hullFill = ghost ? '#1d2630' : '#3b2414';

  return (
    <g>
      {/* 帆与桅杆 */}
      {sail && !bare && (
        <g>
          <line
            x1={mastX}
            y1={topY(mastX) + 10}
            x2={mastX}
            y2={mastTop}
            stroke={ghost ? '#4a5866' : '#4a2e18'}
            strokeWidth={10}
            strokeOpacity={fill}
            {...dash(seg(0.05, 0.35))}
          />
          {/* 索具 */}
          {[
            [mastX, mastTop, 470, topY(470) - 10],
            [mastX, mastTop, -470, topY(-470) - 10],
            [mastX, mastTop + 30, 250, topY(250) - 4],
            [mastX, mastTop + 30, -260, topY(-260) - 4],
          ].map(([x1, y1, x2, y2], i) => (
            <line
              key={i}
              x1={x1}
              y1={y1}
              x2={x2}
              y2={y2}
              stroke={ghost ? '#7c8a99' : '#c9a777'}
              strokeWidth={1.6}
              strokeOpacity={0.6 * fill}
              {...dash(seg(0.3 + i * 0.05, 0.6 + i * 0.05))}
            />
          ))}
          {canvas && (
            <>
          <path
            d={sailPath}
            fill={ghost ? '#4c5967' : 'url(#sailGrad)'}
            fillOpacity={fill * (ghost ? 0.7 : 0.95)}
            {...dash(seg(0.35, 0.75))}
          />
          {/* 帆上的太阳纹 */}
          <g opacity={fill * (ghost ? 0.35 : 0.85)} transform={`translate(${(sailL + sailR) / 2 + sway * 0.5},${(yardY + sailBottom) / 2 + 10})`}>
            <circle r={52} fill="none" stroke={ghost ? '#8fa0b0' : '#9b5a22'} strokeWidth={6} {...dash(seg(0.5, 0.8))} />
            {Array.from({length: 16}, (_, i) => {
              const a = (i / 16) * Math.PI * 2;
              return (
                <line
                  key={i}
                  x1={Math.cos(a) * 64}
                  y1={Math.sin(a) * 64}
                  x2={Math.cos(a) * (i % 2 ? 80 : 92)}
                  y2={Math.sin(a) * (i % 2 ? 80 : 92)}
                  stroke={ghost ? '#8fa0b0' : '#9b5a22'}
                  strokeWidth={5}
                  {...dash(seg(0.55, 0.85))}
                />
              );
            })}
            <circle r={22} fill={ghost ? '#8fa0b0' : '#b0662a'} fillOpacity={fill} {...dash(seg(0.6, 0.85))} />
          </g>
            </>
          )}
          <path
            d={`M${sailL - 20},${yardY + 2} Q${(sailL + sailR) / 2},${yardY - 12} ${sailR + 20},${yardY + 2}`}
            fill="none"
            stroke={ghost ? '#4a5866' : '#4a2e18'}
            strokeWidth={8}
            strokeOpacity={outline ? 1 : fill}
            strokeLinecap="round"
            {...dash(seg(0.25, 0.5))}
          />
        </g>
      )}

      {/* 船体底色 */}
      {!bare && <path d={HULL_OUTLINE} fill={hullFill} fillOpacity={fill} {...dash(seg(0, 0.45))} />}

      {/* 木板 */}
      {PLANKS.map((p) => {
        const L = look ? look(p) : {};
        const wear = L.wear ?? 0;
        const fresh = L.fresh ?? 0;
        const glow = L.glow ?? 0;
        const jitter = (p.seed - 0.5) * 0.22;
        let col = mixRGB(ORIG, [ORIG[0] * (1 + jitter), ORIG[1] * (1 + jitter), ORIG[2] * (1 + jitter)], 1);
        col = mixRGB(col, WORN, wear);
        col = mixRGB(col, mixRGB(FRESH, [FRESH[0] * (1 + jitter * 0.5), FRESH[1] * (1 + jitter * 0.5), FRESH[2] * (1 + jitter * 0.5)], 1), fresh);
        if (ghost) col = mixRGB(col, [col[1] * 0.55, col[1] * 0.7, col[1] * 0.85], 0.75);
        col = mixRGB(col, HOT, glow * 0.8);
        const heat = L.heat ?? 0;
        col = mixRGB(col, EMBER, heat * 0.75);
        const op = (L.opacity ?? 1) * fill;
        const tf =
          L.dx || L.dy || L.rot || (L.scale !== undefined && L.scale !== 1)
            ? `translate(${L.dx ?? 0},${L.dy ?? 0}) rotate(${L.rot ?? 0},${p.cx},${p.cy}) translate(${p.cx},${p.cy}) scale(${L.scale ?? 1}) translate(${-p.cx},${-p.cy})`
            : undefined;
        const pd = outline ? seg(0.1 + (p.id / PLANKS.length) * 0.4, 0.35 + (p.id / PLANKS.length) * 0.4) : 1;
        return (
          <g key={p.id} transform={tf} opacity={outline ? 1 : L.opacity ?? 1}>
            <path
              d={p.d}
              fill={rgb(col)}
              fillOpacity={outline ? op : fill}
              stroke={heat > 0.01 ? C.ember : glow > 0.01 ? C.goldHot : 'rgba(20,10,4,0.85)'}
              strokeWidth={heat > 0.01 ? 1.5 + heat * 4 : glow > 0.01 ? 1.5 + glow * 3 : 1.4}
              {...dash(pd)}
            />
            {!outline && (
              <path d={p.grain} fill="none" stroke={rgb(mixRGB(col, [0, 0, 0], 0.45))} strokeWidth={1.2} strokeOpacity={0.55 * fill} />
            )}
            {wear > 0.35 && !outline && (
              <path
                d={`M${p.x0 + 8 + p.seed * 12},${p.cy - 6} l${10 + p.seed * 8},${5} l${6},${-4} l${8},${6}`}
                fill="none"
                stroke="rgba(8,6,4,0.85)"
                strokeWidth={1.4}
                opacity={(wear - 0.35) * 1.6 * fill}
              />
            )}
          </g>
        );
      })}

      {/* 护舷、船栏、撞角、船尾卷饰 */}
      {!bare && (
        <>
      <path d={WALE} fill="none" stroke={ghost ? '#55626e' : '#2a170b'} strokeWidth={7} strokeOpacity={outline ? 1 : fill} {...dash(seg(0.4, 0.7))} />
      <path d={RAIL} fill="none" stroke={ghost ? '#6b7a88' : '#5b3a1e'} strokeWidth={9} strokeLinecap="round" strokeOpacity={outline ? 1 : fill} {...dash(seg(0.05, 0.4))} />
      <path d={STERN_CURL} fill="none" stroke={ghost ? '#6b7a88' : '#5b3a1e'} strokeWidth={11} strokeLinecap="round" strokeOpacity={outline ? 1 : fill} {...dash(seg(0.3, 0.6))} />
      <path d={RAM} fill={ghost ? '#5a6b78' : '#a87b3a'} fillOpacity={fill} {...dash(seg(0.45, 0.65))} />
      {/* 船首之眼 */}
      <g transform={`translate(${425},${hullY(425, 0.35) + 4})`} opacity={outline ? 1 : fill}>
        <ellipse rx={20} ry={11} fill={ghost ? '#cfd8e0' : '#f1e6cf'} {...dash(seg(0.6, 0.8))} />
        <circle r={7} fill="#140b05" />
      </g>

        </>
      )}
      {/* 桨 */}
      {oars && !bare &&
        OAR_X.map((x, i) => {
          const a = Math.sin(oarPhase + i * 0.08) * 0.22 + 0.42;
          const py = topY(x) + 22;
          const len = 210;
          const ex = x + Math.sin(a) * len * 0.75 - 40;
          const ey = py + Math.cos(a) * len;
          return (
            <g key={x} opacity={outline ? 1 : fill}>
              <line x1={x} y1={py} x2={ex} y2={ey} stroke={ghost ? '#6d7b88' : '#8a5f33'} strokeWidth={5} strokeLinecap="round" {...dash(seg(0.6 + i * 0.015, 0.8 + i * 0.015))} />
              <circle cx={x} cy={py} r={4.5} fill="#1a0f07" />
            </g>
          );
        })}
      {/* 水下部分略暗 */}
      {!outline && !bare && (
        <path
          d={`M${-HALF},${WATERLINE} L${HALF},${WATERLINE} L${HALF},${200} L${-HALF},${200} Z`}
          fill="url(#underwater)"
          opacity={0.6 * fill}
          clipPath="url(#hullClip)"
        />
      )}
      <ShipDefs />
    </g>
  );
};

const ShipDefs: React.FC = () => (
  <defs>
    <linearGradient id="sailGrad" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stopColor="#fbf3df" />
      <stop offset="0.6" stopColor="#e9d8b4" />
      <stop offset="1" stopColor="#c7ad80" />
    </linearGradient>
    <clipPath id="hullClip">
      <path d={HULL_OUTLINE} />
    </clipPath>
    <linearGradient id="underwater" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stopColor="#1b3b55" stopOpacity="0.2" />
      <stop offset="1" stopColor="#06121d" stopOpacity="1" />
    </linearGradient>
  </defs>
);


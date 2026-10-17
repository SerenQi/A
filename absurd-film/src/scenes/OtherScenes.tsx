import React from 'react';
import {AbsoluteFill} from 'remotion';
import {FONTS, H, PALETTE as P, W} from '../config';
import {clamp01, easeOut, hash, lerp, span, win} from '../lib/anim';
import {Mountain, Ridges, Sky, Trails} from '../components/Land';
import {Figure, Stone} from '../components/Figure';
import {camTf, stoneAt} from '../lib/push';
import {slopePoint} from '../components/Land';
import type {SceneProps} from './MountainScenes';

const Label: React.FC<{x: number; y: number; text: string; o: number; color?: string; size?: number; anchor?: 'start' | 'middle' | 'end'}> = ({x, y, text, o, color = P.text, size = 30, anchor = 'middle'}) =>
  o <= 0.01 ? null : (
    <text x={x} y={y} textAnchor={anchor} fontFamily={FONTS.title} fontSize={size} letterSpacing={6} fill={color} opacity={o}>
      {text}
    </text>
  );

/* ---------------- 城市 ---------------- */
const BUILDINGS = Array.from({length: 22}, (_, i) => {
  const w = 60 + hash(i * 3) * 90;
  const h = 180 + hash(i * 7) * 380;
  return {x: i * 92 - 40, w, h, seed: i};
});

const Skyline: React.FC<{rise: number; lit: number; sec: number}> = ({rise, lit, sec}) => (
  <g>
    {BUILDINGS.map((b, i) => {
      const k = easeOut(clamp01(rise * 1.6 - (i % 7) * 0.08));
      const h = b.h * k;
      const top = 880 - h;
      const cols = Math.floor((b.w - 16) / 18);
      const rows = Math.floor((h - 20) / 26);
      return (
        <g key={i}>
          <rect x={b.x} y={top} width={b.w} height={h + 200} fill={P.city} stroke="#1B1F3A" strokeWidth={1.5} />
          {Array.from({length: cols * rows}, (_, j) => {
            const c = j % cols;
            const r = Math.floor(j / cols);
            const on = hash(b.seed * 97 + j) < 0.42 * lit && Math.sin(sec * 0.3 + j) > -0.95;
            return on ? <rect key={j} x={b.x + 10 + c * 18} y={top + 14 + r * 26} width={9} height={13} fill={P.window} opacity={0.55 + 0.3 * hash(j)} /> : null;
          })}
        </g>
      );
    })}
  </g>
);

/** 六格日常：起床 / 电车 / 工作 / 吃饭 / 工作 / 睡觉 */
const PANELS = ['起床', '电车', '工作', '吃饭', '工作', '睡觉'];

const Vignette: React.FC<{k: number; t: number; active: number; freeze?: number}> = ({k, t, active, freeze = 0}) => {
  const ink = '#C9D0F0';
  const run = Math.sin(t * 8);
  switch (k) {
    case 0: // 起床：床与闹钟
      return (
        <g stroke={ink} strokeWidth={3} fill="none" strokeLinecap="round">
          <rect x={-120} y={20} width={200} height={40} rx={8} />
          <rect x={-120} y={0} width={50} height={26} rx={8} />
          <circle cx={110} cy={-30} r={32} />
          <path d={`M110,-30 L110,-50 M110,-30 L124,-22`} />
          {active > 0.5 && <path d={`M70,-70 l-12,-10 M150,-70 l12,-10`} opacity={0.5 + 0.5 * run} />}
        </g>
      );
    case 1: // 电车
      return (
        <g stroke={ink} strokeWidth={3} fill="none" strokeLinecap="round" transform={`translate(${active > 0.5 ? (t * 40) % 40 - 20 : 0},0)`}>
          <rect x={-130} y={-50} width={260} height={90} rx={18} />
          {[-90, -30, 30, 90].map((x) => (
            <rect key={x} x={x - 20} y={-34} width={40} height={30} rx={4} />
          ))}
          <circle cx={-80} cy={52} r={12} />
          <circle cx={80} cy={52} r={12} />
          <path d="M-60,-50 L-20,-90 L20,-90" />
        </g>
      );
    case 2:
    case 4: // 工作：桌子、屏幕、人
      return (
        <g>
          <g stroke={ink} strokeWidth={3} fill="none" strokeLinecap="round">
            <path d="M-140,40 L140,40 M-120,40 L-120,90 M120,40 L120,90" />
            <rect x={10} y={-50} width={110} height={70} rx={6} />
            <path d="M65,20 L65,40" />
          </g>
          <rect x={18} y={-42} width={94} height={54} fill={P.window} opacity={0.18} />
          <Figure x={-50} y={90} s={0.6} lean={0.25} push={0.85 * (1 - freeze)} headUp={freeze * 0.7} body="#C9D0F0" rim="#C9D0F0" stride={0} stepAmp={0} />
        </g>
      );
    case 3: // 吃饭
      return (
        <g stroke={ink} strokeWidth={3} fill="none" strokeLinecap="round">
          <path d="M-70,0 Q0,80 70,0 Z" />
          <path d="M40,-40 L110,-90 M55,-30 L125,-80" />
          {[-30, 0, 30].map((x) => (
            <path key={x} d={`M${x},-10 q-10,-20 0,-40 q10,-20 0,-40`} opacity={0.4 + 0.3 * Math.sin(t * 3 + x)} />
          ))}
        </g>
      );
    default: // 睡觉
      return (
        <g stroke={ink} strokeWidth={3} fill="none" strokeLinecap="round">
          <rect x={-120} y={20} width={240} height={40} rx={8} />
          <path d="M-100,20 Q-40,-10 40,20" />
          <path d="M80,-70 a34,34 0 1 0 30,46 a26,26 0 1 1 -30,-46 Z" />
          <text x={-40} y={-30} fontFamily={FONTS.body} fontSize={28} fill={ink} stroke="none">
            z z
          </text>
        </g>
      );
  }
};

const ORDER = [0, 1, 2, 3, 1, 4, 3, 5];

export const A04: React.FC<SceneProps> = ({t, sec}) => {
  const morph = span(t, 0.2, 2.8);
  const lit = span(t, 1.6, 4.0);
  const grid = span(t, 5.4, 6.6, easeOut);
  // 依照“起床，电车，工作，吃饭，电车，工作，吃饭，睡觉”点亮
  const stepT = t - 5.7;
  const speed = t < 11.7 ? 0.71 : Math.max(0.16, 0.71 - (t - 11.7) * 0.12);
  let step = 0;
  if (stepT > 0) {
    step = t < 11.7 ? Math.floor(stepT / 0.71) : 8 + Math.floor((t - 11.7) / speed);
  }
  const active = ORDER[step % ORDER.length];
  const days = ['周一', '周二', '周三', '周四', '周五', '周六'];
  const day = t < 11.7 ? 0 : Math.min(5, Math.floor((t - 11.7) / 0.65));
  const push = span(t, 15.9, 19.6);
  return (
    <AbsoluteFill>
      <Sky sec={sec} />
      <Ridges pan={sec * 4} city={1} />
      <svg width={W} height={H} style={{position: 'absolute', inset: 0}}>
        <g opacity={1 - morph}>
          <g transform={camTf({x: 960, y: 560, z: 1})}>
            <Mountain />
            <Trails count={150} />
          </g>
        </g>
        <Skyline rise={morph} lit={lit} sec={sec} />
        {/* 电车轨道 */}
        <g opacity={morph}>
          <rect x={0} y={880} width={W} height={200} fill="#07081A" />
          <line x1={0} x2={W} y1={900} y2={900} stroke="#2B3060" strokeWidth={3} />
          <g transform={`translate(${((t * 260) % (W + 600)) - 400},860)`}>
            <rect width={300} height={60} rx={14} fill="#1A1E40" stroke="#3A4080" />
            {[20, 90, 160, 230].map((x) => (
              <rect key={x} x={x} y={12} width={50} height={22} rx={4} fill={P.window} opacity={0.7} />
            ))}
          </g>
        </g>
        {/* 六格 */}
        {grid > 0.01 && (
          <g opacity={grid} transform={`translate(960,470) scale(${lerp(0.92, 1, grid) * (1 + push * 0.06)}) translate(-960,-470)`}>
            <rect x={300} y={150} width={1320} height={640} rx={24} fill="#05060E" opacity={0.6} />
            {PANELS.map((name, k) => {
              const cx = 520 + (k % 3) * 440;
              const cy = 300 + Math.floor(k / 3) * 330;
              const on = k === active ? 1 : 0;
              return (
                <g key={k}>
                  <rect x={cx - 200} y={cy - 140} width={400} height={290} rx={18} fill="#0E1230" stroke={on ? P.warm : '#2B3060'} strokeWidth={on ? 3 : 1.5} />
                  <g transform={`translate(${cx},${cy - 10})`} opacity={0.45 + 0.55 * on}>
                    <Vignette k={k} t={t} active={on} />
                  </g>
                  <Label x={cx} y={cy + 128} text={name} o={0.5 + 0.5 * on} size={26} color={on ? P.warm : P.dim} />
                </g>
              );
            })}
          </g>
        )}
        {/* 日历 */}
        <g opacity={win(t, 11.4, 20, 0.5, 0.4)}>
          {days.map((d, i) => (
            <text key={d} x={660 + i * 120} y={110} textAnchor="middle" fontFamily={FONTS.title} fontSize={30} letterSpacing={2} fill={i === day ? P.warm : P.dim} opacity={i <= day ? 1 : 0.35}>
              {d}
            </text>
          ))}
        </g>
      </svg>
    </AbsoluteFill>
  );
};

/* ============ A05 “为什么”出现的那一天（64–75s）============ */
export const A05: React.FC<SceneProps> = ({t, sec}) => {
  const zoom = span(t, 1.0, 4.0);
  const freeze = span(t, 2.4, 4.0);
  const q = span(t, 4.6, 6.0, easeOut);
  const others = 1 - 0.75 * zoom;
  const stepT = Math.floor(t / 0.22);
  return (
    <AbsoluteFill>
      <Sky sec={sec} />
      <Ridges pan={sec * 4} city={1} />
      <svg width={W} height={H} style={{position: 'absolute', inset: 0}}>
        <Skyline rise={1} lit={1} sec={sec} />
        <rect x={0} y={880} width={W} height={200} fill="#07081A" />
        <g transform={`translate(960,470) scale(${lerp(1, 2.4, zoom)}) translate(${-lerp(960, 1400, zoom)},${-lerp(470, 290, zoom)})`}>
          <rect x={300} y={150} width={1320} height={640} rx={24} fill="#05060E" opacity={0.6} />
          {PANELS.map((name, k) => {
            const cx = 520 + (k % 3) * 440;
            const cy = 300 + Math.floor(k / 3) * 330;
            const me = k === 2;
            const on = me ? 1 : ORDER[stepT % ORDER.length] === k ? 1 : 0;
            return (
              <g key={k} opacity={me ? 1 : others}>
                <rect x={cx - 200} y={cy - 140} width={400} height={290} rx={18} fill="#0E1230" stroke={on ? P.warm : '#2B3060'} strokeWidth={on ? 3 : 1.5} />
                {me && (
                  <g>
                    {/* 窗外的月亮 */}
                    <rect x={cx - 170} y={cy - 115} width={120} height={90} rx={6} fill="#141A3A" stroke="#2B3060" />
                    <circle cx={cx - 110} cy={cy - 80} r={14} fill={P.moon} opacity={0.9} />
                  </g>
                )}
                <g transform={`translate(${cx},${cy - 10})`} opacity={0.45 + 0.55 * on}>
                  <Vignette k={k} t={me ? t * (1 - freeze) : t} active={on} freeze={me ? freeze : 0} />
                </g>
                {me && q > 0.01 && (
                  <text x={cx - 30} y={cy - 74} textAnchor="middle" fontFamily={FONTS.title} fontSize={54} fill={P.warm} opacity={q} transform={`translate(0,${(1 - q) * 20})`}>
                    ？
                  </text>
                )}
                <Label x={cx} y={cy + 128} text={name} o={0.5 + 0.5 * on} size={26} color={on ? P.warm : P.dim} />
              </g>
            );
          })}
        </g>
      </svg>
    </AbsoluteFill>
  );
};

/* ============ A06 荒谬：追问与沉默之间（75–92s）============ */
export const A06: React.FC<SceneProps> = ({t, sec}) => {
  const crack = span(t, 8.4, 10.6);
  const labels = win(t, 8.8, 17.4, 0.6, 0.6);
  const silent = span(t, 4.4, 8.0);
  const crackPts: string[] = [];
  for (let i = 0; i <= 24; i++) {
    const y = 120 + (i / 24) * 760;
    crackPts.push(`${960 + (hash(i * 5) - 0.5) * 34},${y.toFixed(0)}`);
  }
  return (
    <AbsoluteFill>
      <Sky sec={sec} />
      <Ridges pan={sec * 3} city={0.6} />
      <svg width={W} height={H} style={{position: 'absolute', inset: 0}}>
        {/* 人这一侧：一块突出的岩石 */}
        <path d="M-50,1100 L-50,820 L300,790 Q480,780 600,820 L640,1100 Z" fill="#0D0F20" />
        <path d="M-50,820 L300,790 Q480,780 600,820" fill="none" stroke={P.rim} strokeWidth={2} />
        <Figure x={470} y={796} s={1.15} lean={-0.05} headUp={0.35 + 0.1 * Math.sin(t)} rim={P.warm} />
        {/* 追问：一圈圈向世界扩散的声波 */}
        {Array.from({length: 8}, (_, i) => {
          const k = (t * 0.32 + i / 8) % 1;
          const r = 60 + k * 1300;
          const fade = (1 - k) * (k * 4 > 1 ? 1 : k * 4);
          // 越过裂缝后迅速消散：世界没有回音
          const cut = clamp01((960 - 470 - r * 0.85) / 200 + 1);
          return <path key={i} d={`M${470 + r * 0.55},${640 - r * 0.62} A${r},${r} 0 0 1 ${470 + r * 0.55},${640 + r * 0.62}`} fill="none" stroke={P.warm} strokeWidth={2} opacity={fade * 0.6 * (silent > 0 ? lerp(1, cut, silent) : 1)} />;
        })}
        {/* 裂缝 */}
        {crack > 0.01 && (
          <g>
            <path d={`M${crackPts.join('L')}`} fill="none" stroke="#F4E9D8" strokeWidth={7} opacity={0.12 * crack} pathLength={1} strokeDasharray={1} strokeDashoffset={1 - crack} />
            <path d={`M${crackPts.join('L')}`} fill="none" stroke="#F4E9D8" strokeWidth={2} pathLength={1} strokeDasharray={1} strokeDashoffset={1 - crack} />
          </g>
        )}
        <Label x={700} y={180} text="追问" o={labels} color={P.warm} size={40} />
        <Label x={1240} y={180} text="沉默" o={labels} color={P.moon} size={40} />
        <Label x={960} y={930} text="荒谬" o={win(t, 10.4, 17.4, 0.6, 0.6)} color={P.text} size={56} />
      </svg>
    </AbsoluteFill>
  );
};

/* ============ A07 三条路（92–112s）============ */
export const A07: React.FC<SceneProps> = ({t, sec}) => {
  const cam = {x: 660, y: 560, z: 1};
  const F = {x: 40, y: 904}; // 岔路口（山脚左侧的平地，世界坐标）
  const draw = span(t, 0.8, 3.0);
  const h1 = win(t, 5.4, 9.8, 0.4, 0.8);
  const h2 = win(t, 9.6, 14.6, 0.4, 0.8);
  const h3 = span(t, 14.4, 15.4);
  const dim1 = span(t, 9.2, 10.0);
  const dim2 = span(t, 14.0, 14.8);
  const walk3 = span(t, 15.0, 18.6);
  const su = 720;
  const stone = stoneAt(su);
  const goal = slopePoint(su - 70 - 78);
  const door = {x: -40, y: 330};
  const paths = [
    {d: `M${F.x},${F.y} C-120,908 -300,914 -520,920`, color: '#8890B8', hi: h1, dim: dim1},
    {d: `M${F.x},${F.y} C40,760 -10,560 ${door.x},${door.y + 20}`, color: '#E9EEFF', hi: h2, dim: dim2},
    {d: `M${F.x},${F.y} L${slopePoint(0).x},${slopePoint(0).y} L${goal.x},${goal.y}`, color: P.warm, hi: h3, dim: 0},
  ];
  // 第三条路：沿着坡面走回石头
  const along = walk3 * (su - 70 - 78 + (slopePoint(0).x - F.x));
  const onFlat = along < slopePoint(0).x - F.x;
  const fp = onFlat ? {x: F.x + along, y: F.y} : slopePoint(along - (slopePoint(0).x - F.x));
  const sc = (p: {x: number; y: number}) => ({x: (p.x - cam.x) * cam.z + W / 2, y: (p.y - cam.y) * cam.z + H / 2});
  return (
    <AbsoluteFill>
      <Sky sec={sec} />
      <Ridges pan={sec * 3} />
      <svg width={W} height={H} style={{position: 'absolute', inset: 0}}>
        <defs>
          <linearGradient id="toDark" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" stopColor="#000" stopOpacity="0.95" />
            <stop offset="1" stopColor="#000" stopOpacity="0" />
          </linearGradient>
        </defs>
        <g transform={camTf(cam)}>
          <Mountain />
          <Trails count={150} level={0.7} />
          <Stone x={stone.x} y={stone.y} rot={0} tally={60} glow={h3} />
          {/* 光门：浮在半空 */}
          <g opacity={0.35 + 0.65 * h2} transform={`translate(${door.x},${door.y})`}>
            <rect x={-60} y={-150} width={120} height={160} rx={60} fill="#E9EEFF" opacity={0.12 + 0.5 * h2} />
            <rect x={-60} y={-150} width={120} height={160} rx={60} fill="none" stroke="#E9EEFF" strokeWidth={2} />
          </g>
          {paths.map((p, i) => (
            <path key={i} d={p.d} fill="none" stroke={p.color} strokeWidth={4 + p.hi * 3} strokeLinecap="round" opacity={(0.35 + 0.65 * p.hi) * (1 - 0.6 * p.dim)} pathLength={1} strokeDasharray={1} strokeDashoffset={1 - draw} />
          ))}
          {h1 > 0.01 && <Figure x={lerp(F.x, -420, span(t, 5.8, 9.0))} y={lerp(F.y, 918, span(t, 5.8, 9.0))} s={0.95} facing={-1} stride={t * 6} swing={0.3} level={h1 * 0.55 * (1 - span(t, 8.0, 9.4))} rim="#8890B8" />}
          {h2 > 0.01 && (
            <Figure x={lerp(F.x, door.x, span(t, 10.2, 13.2))} y={lerp(F.y, door.y + 10, span(t, 10.2, 13.2))} s={lerp(0.95, 0.55, span(t, 10.2, 13.2))} facing={-1} stride={t * 6} swing={0.3} level={h2 * 0.6 * (1 - span(t, 12.4, 13.6))} rim="#E9EEFF" />
          )}
          <Figure x={fp.x} y={fp.y} s={1} lean={walk3 >= 1 ? 0.85 : 0.05} push={walk3 >= 1 ? 1 : 0} stride={walk3 * 22} swing={walk3 > 0 && walk3 < 1 ? 0.3 : 0} headUp={0.2} />
        </g>
        {/* 左边：走进黑暗 */}
        <rect x={0} y={0} width={360} height={H} fill="url(#toDark)" />
        <Label x={230} y={850} text="放弃" o={h1 + 0.4 * dim1 * (1 - h1)} color="#A0A8D0" size={36} />
        <Label x={sc(door).x} y={sc(door).y - 180} text="跳向现成的答案" o={h2 + 0.4 * dim2 * (1 - h2)} color="#E9EEFF" size={34} />
        <Label x={sc(stone).x} y={sc(stone).y - 120} text="回到石头" o={h3} color={P.warm} size={38} />
      </svg>
    </AbsoluteFill>
  );
};

/* ============ A10 每个人的石头（146–156s）============ */
const ObjectStone: React.FC<{k: number; x: number; y: number}> = ({k, x, y}) => {
  const ink = '#C9D0F0';
  switch (k) {
    case 0: // 作业：一摞书
      return (
        <g transform={`translate(${x},${y})`}>
          {[0, 1, 2, 3].map((i) => (
            <rect key={i} x={-40 + (i % 2) * 4} y={-18 - i * 16} width={80} height={14} rx={3} fill={['#6C7BC0', '#C08A6C', '#7FB08F', '#B07FB0'][i]} />
          ))}
        </g>
      );
    case 1: // 房贷：一座小房子
      return (
        <g transform={`translate(${x},${y})`}>
          <rect x={-40} y={-56} width={80} height={56} fill="#2B3060" stroke={ink} strokeWidth={2} />
          <path d="M-52,-56 L0,-96 L52,-56 Z" fill="#3A4080" stroke={ink} strokeWidth={2} />
          <rect x={-12} y={-30} width={24} height={30} fill={P.window} opacity={0.8} />
        </g>
      );
    case 2: // 照顾家人：婴儿车
      return (
        <g transform={`translate(${x},${y})`} stroke={ink} strokeWidth={3} fill="none">
          <path d="M-40,-30 L40,-30 A40,40 0 0 0 -40,-30 Z" fill="#3A4080" />
          <path d="M40,-30 L60,-70" />
          <circle cx={-26} cy={-10} r={10} />
          <circle cx={26} cy={-10} r={10} />
        </g>
      );
    case 3: // 梦想：发光的星
      return (
        <g transform={`translate(${x},${y - 46})`}>
          <circle r={60} fill={P.warm} opacity={0.15} />
          <path d={Array.from({length: 10}, (_, i) => {
            const a = (i / 10) * Math.PI * 2 - Math.PI / 2;
            const r = i % 2 ? 18 : 44;
            return `${i ? 'L' : 'M'}${(Math.cos(a) * r).toFixed(1)},${(Math.sin(a) * r).toFixed(1)}`;
          }).join('') + 'Z'} fill={P.warm} />
        </g>
      );
    default: // 工作：笔记本电脑
      return (
        <g transform={`translate(${x},${y})`}>
          <rect x={-44} y={-62} width={88} height={56} rx={5} fill="#1A1E40" stroke={ink} strokeWidth={2} />
          <rect x={-36} y={-55} width={72} height={42} fill={P.window} opacity={0.25} />
          <path d="M-56,-4 L56,-4 L48,4 L-48,4 Z" fill={ink} />
        </g>
      );
  }
};

export const A10: React.FC<SceneProps> = ({t, sec}) => {
  const names = ['作业', '房贷', '照顾家人', '梦想', '工作'];
  return (
    <AbsoluteFill>
      <Sky sec={sec} dawn={0.3} />
      <Ridges pan={sec * 3} dawn={0.3} />
      <svg width={W} height={H} style={{position: 'absolute', inset: 0}}>
        {names.map((n, i) => {
          const appear = span(t, 0.4 + i * 0.45, 1.4 + i * 0.45, easeOut);
          const cx = 230 + i * 365;
          const base = 860;
          const hillW = 300;
          const hillH = 220 + (i % 2) * 60;
          const slope = Math.atan2(hillH, hillW / 2);
          const prog = 0.25 + 0.5 * ((t * 0.05 + i * 0.13) % 1);
          const sx = cx - hillW / 2 + prog * (hillW / 2);
          const sy = base - prog * hillH;
          return (
            <g key={n} opacity={appear} transform={`translate(0,${(1 - appear) * 60})`}>
              <path d={`M${cx - hillW / 2 - 40},${base} L${cx},${base - hillH} L${cx + hillW / 2 + 40},${base} Z`} fill="#0D0F20" stroke={P.rim} strokeWidth={1.5} />
              <g transform={`translate(${sx + 28},${sy - 6}) rotate(${(-slope * 180) / Math.PI * 0.4}) scale(1.25)`}>
                <ObjectStone k={i} x={0} y={0} />
              </g>
              <Figure x={sx - 46} y={sy + 34} s={0.62} lean={0.8} push={1} stride={t * 3 + i} headUp={0.4} />
              <Label x={cx} y={base + 60} text={n} o={1} color={i === 3 ? P.warm : P.text} size={30} />
            </g>
          );
        })}
      </svg>
    </AbsoluteFill>
  );
};


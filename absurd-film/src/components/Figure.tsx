import React from 'react';
import {FONTS, PALETTE as P} from '../config';
import {hash} from '../lib/anim';

type Pt = {x: number; y: number};
const add = (a: Pt, len: number, ang: number): Pt => ({x: a.x + Math.sin(ang) * len, y: a.y + Math.cos(ang) * len});

/**
 * 小人。(x, y) 为两脚中点所在的地面；姿态参数：
 * lean 身体前倾（弧度，正为向右前倾），stride 步伐相位，push 0..1 双臂前推，
 * headUp 抬头（弧度），swing 走路时摆臂幅度，chain 0..1 脚踝锁链可见度。
 */
export const Figure: React.FC<{
  x: number;
  y: number;
  s?: number;
  lean?: number;
  stride?: number;
  stepAmp?: number;
  push?: number;
  headUp?: number;
  swing?: number;
  facing?: 1 | -1;
  chain?: number;
  level?: number;
  rim?: string;
  body?: string;
}> = ({x, y, s = 1, lean = 0, stride = 0, stepAmp = 0.45, push = 0, headUp = 0, swing = 0, facing = 1, chain = 0, level = 1, rim = P.warm, body = '#090A16'}) => {
  const leg = 52;
  const torso = 72;
  const hip0: Pt = {x: 0, y: 0};
  // 两条腿
  const legs = [0, 1].map((i) => {
    const ph = stride + i * Math.PI;
    const th = lean * 0.35 + Math.sin(ph) * stepAmp;
    const knee = add(hip0, leg, th);
    const bend = Math.max(0, -Math.cos(ph)) * 0.7 * (stepAmp / 0.45);
    const foot = add(knee, leg, th - bend);
    return {knee, foot};
  });
  const lowest = Math.max(legs[0].foot.y, legs[1].foot.y);
  const dy = -lowest; // 让最低的脚落在地面上
  const hip: Pt = {x: 0, y: dy};
  const L = legs.map((l) => ({knee: {x: l.knee.x, y: l.knee.y + dy}, foot: {x: l.foot.x, y: l.foot.y + dy}}));
  const shoulder: Pt = {x: hip.x + Math.sin(lean) * torso, y: hip.y - Math.cos(lean) * torso};
  const neck: Pt = {x: shoulder.x + Math.sin(lean) * 8, y: shoulder.y - Math.cos(lean) * 8};
  const headAng = lean - headUp;
  const head: Pt = {x: neck.x + Math.sin(headAng) * 20, y: neck.y - Math.cos(headAng) * 20};
  // 手臂（角度约定：0 向下，π/2 向右，π 向上）。推石时向前平伸，走路时自然下垂并摆动
  const arms = [0, 1].map((i) => {
    const pushAng = Math.PI / 2 + 0.15 + i * 0.1 + lean * 0.2;
    const hangAng = Math.sin(stride + i * Math.PI) * swing;
    const ang = pushAng * push + hangAng * (1 - push);
    const elbow = add(shoulder, 40, ang - 0.35 * push + 0.15 * (1 - push));
    const hand = add(elbow, 40, ang);
    return {elbow, hand};
  });
  const limb = (a: Pt, b: Pt, c: Pt, w: number, k: string) => (
    <g key={k}>
      <path d={`M${a.x},${a.y}L${b.x},${b.y}L${c.x},${c.y}`} fill="none" stroke={body} strokeWidth={w} strokeLinecap="round" strokeLinejoin="round" />
      <path d={`M${a.x - 2},${a.y - 2}L${b.x - 2},${b.y - 2}L${c.x - 2},${c.y - 2}`} fill="none" stroke={rim} strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" opacity={0.75} />
    </g>
  );
  return (
    <g transform={`translate(${x},${y}) scale(${s * facing},${s})`} opacity={level}>
      <ellipse cx={0} cy={2} rx={34} ry={5} fill="#000" opacity={0.35} />
      {limb(hip, L[1].knee, L[1].foot, 15, 'l1')}
      {limb(shoulder, arms[1].elbow, arms[1].hand, 11, 'a1')}
      <path d={`M${hip.x},${hip.y}L${shoulder.x},${shoulder.y}`} stroke={body} strokeWidth={30} strokeLinecap="round" />
      <path d={`M${hip.x - 10},${hip.y - 3}L${shoulder.x - 10},${shoulder.y - 3}`} stroke={rim} strokeWidth={1.8} strokeLinecap="round" opacity={0.8} />
      {limb(hip, L[0].knee, L[0].foot, 15, 'l0')}
      {limb(shoulder, arms[0].elbow, arms[0].hand, 11, 'a0')}
      <circle cx={head.x} cy={head.y} r={15} fill={body} />
      <path d={`M${head.x - 13},${head.y - 4} A15,15 0 0 1 ${head.x + 4},${head.y - 14.5}`} fill="none" stroke={rim} strokeWidth={1.8} opacity={0.85} />
      {chain > 0.01 && (
        <g opacity={chain}>
          {Array.from({length: 7}, (_, i) => (
            <ellipse key={i} cx={L[1].foot.x - 8 - i * 11} cy={L[1].foot.y - 4 + Math.sin(i) * 2} rx={6} ry={4} fill="none" stroke="#9AA0B8" strokeWidth={2} />
          ))}
        </g>
      )}
    </g>
  );
};

/** 刻着计数的石头；rot 为滚动角度（度） */
export const Stone: React.FC<{x: number; y: number; r?: number; rot?: number; tally?: number; glow?: number; level?: number}> = ({x, y, r = 70, rot = 0, tally = 0, glow = 0, level = 1}) => {
  const groups = Math.min(12, Math.floor(tally / 5));
  return (
    <g transform={`translate(${x},${y})`} opacity={level}>
      <defs>
        <radialGradient id="stoneGrad" cx="0.35" cy="0.3" r="0.8">
          <stop offset="0" stopColor="#5A5F82" />
          <stop offset="0.6" stopColor="#2B2E4A" />
          <stop offset="1" stopColor="#15172A" />
        </radialGradient>
      </defs>
      <ellipse cx={0} cy={r - 4} rx={r * 0.9} ry={8} fill="#000" opacity={0.4} />
      {glow > 0.01 && <circle r={r + 30} fill={P.warm} opacity={0.12 * glow} />}
      <g transform={`rotate(${rot})`}>
        <path
          d={Array.from({length: 13}, (_, i) => {
            const a = (i / 12) * Math.PI * 2;
            const rr = r * (0.92 + hash(i * 3) * 0.1);
            return `${i === 0 ? 'M' : 'L'}${(Math.cos(a) * rr).toFixed(1)},${(Math.sin(a) * rr).toFixed(1)}`;
          }).join('') + 'Z'}
          fill="url(#stoneGrad)"
          stroke="#0B0C18"
          strokeWidth={2}
        />
        <path d={`M${-r * 0.5},${-r * 0.2} q${r * 0.2},${r * 0.1} ${r * 0.35},${r * 0.45} M${r * 0.2},${-r * 0.6} q${-r * 0.05},${r * 0.2} ${r * 0.15},${r * 0.35}`} fill="none" stroke="#11132A" strokeWidth={2} opacity={0.8} />
        {/* 刻痕：每五道一组 */}
        {Array.from({length: groups}, (_, g) => {
          const gx = -r * 0.55 + (g % 4) * r * 0.3;
          const gy = -r * 0.1 + Math.floor(g / 4) * r * 0.28;
          return (
            <g key={g} stroke="#9AA2D0" strokeWidth={1.6} opacity={0.6}>
              {[0, 1, 2, 3].map((k) => (
                <line key={k} x1={gx + k * 4} y1={gy} x2={gx + k * 4} y2={gy + 14} />
              ))}
              <line x1={gx - 2} y1={gy + 12} x2={gx + 15} y2={gy + 2} />
            </g>
          );
        })}
      </g>
      <path d={`M${-r * 0.8},${-r * 0.45} A${r},${r} 0 0 1 ${r * 0.2},${-r * 0.97}`} fill="none" stroke={P.moon} strokeWidth={2} opacity={0.55} />
    </g>
  );
};

export const Counter: React.FC<{n: number; x: number; y: number; o: number}> = ({n, x, y, o}) =>
  o <= 0.01 ? null : (
    <g opacity={o}>
      <text x={x} y={y} textAnchor="end" fontFamily={FONTS.title} fontSize={30} fill={P.dim} letterSpacing={4}>
        第
      </text>
      <text x={x + 12} y={y + 6} fontFamily={FONTS.title} fontSize={64} fill={P.text} letterSpacing={2}>
        {n.toLocaleString('en-US')}
      </text>
      <text x={x + 24 + String(n.toLocaleString('en-US')).length * 34} y={y} fontFamily={FONTS.title} fontSize={30} fill={P.dim} letterSpacing={4}>
        次
      </text>
    </g>
  );

import React from 'react';
import {AbsoluteFill, Easing, Sequence, interpolate, random, useCurrentFrame} from 'remotion';
import {Dust, Flash, Orb, Rays, Sea, Shockwave, Sky, Sparks} from '../components/Atmos';
import {Ship} from '../components/Ship';
import {Subtitles} from '../components/Text';
import {C, H, W} from '../lib/theme';
import {prog} from '../lib/math';
import {CUES} from '../script';

/* ---------------- A. 迷宫与牛头怪 ---------------- */
const CX = W / 2;
const CY = 470;

const arc = (r: number, a0: number, a1: number) => {
  const p0 = [Math.cos(a0) * r, Math.sin(a0) * r];
  const p1 = [Math.cos(a1) * r, Math.sin(a1) * r];
  const large = a1 - a0 > Math.PI ? 1 : 0;
  return `M${p0[0].toFixed(1)},${p0[1].toFixed(1)} A${r},${r} 0 ${large} 1 ${p1[0].toFixed(1)},${p1[1].toFixed(1)}`;
};

const RINGS = Array.from({length: 7}, (_, i) => {
  const r = 70 + i * 52;
  const gap = random(`gap${i}`) * Math.PI * 2;
  const g = 0.32 - i * 0.025;
  const walls = Array.from({length: 2 + (i % 3)}, (_, k) => gap + 0.8 + k * (1.6 + random(`w${i}${k}`)));
  return {r, d: arc(r, gap + g, gap + Math.PI * 2 - g), walls};
});

const HEAD = {
  face: 'M-45,-40 C-62,-8 -42,52 -26,82 Q0,104 26,82 C42,52 62,-8 45,-40 Q0,-62 -45,-40 Z',
  hornL: 'M-38,-40 C-92,-52 -126,-96 -104,-150 C-100,-104 -74,-74 -26,-58 Z',
  hornR: 'M38,-40 C92,-52 126,-96 104,-150 C100,-104 74,-74 26,-58 Z',
  earL: 'M-46,-26 L-88,-14 L-48,-4 Z',
  earR: 'M46,-26 L88,-14 L48,-4 Z',
};

const Minotaur: React.FC<{eye: number}> = ({eye}) => (
  <g>
    {[HEAD.hornL, HEAD.hornR].map((d, i) => (
      <path key={i} d={d} fill="#2a1a10" stroke="#e8c48a" strokeWidth={3} />
    ))}
    {[HEAD.earL, HEAD.earR].map((d, i) => (
      <path key={i} d={d} fill="#1a0e08" stroke="#8a2a1a" strokeWidth={2} />
    ))}
    <path d={HEAD.face} fill="#160b06" stroke="#b33a22" strokeWidth={3} />
    {[-20, 20].map((x) => (
      <g key={x}>
        <circle cx={x} cy={-6} r={14 * eye} fill="rgba(255,60,30,0.35)" />
        <circle cx={x} cy={-6} r={5} fill="#ff4b2b" />
      </g>
    ))}
    <circle cx={-10} cy={72} r={4} fill="#000" />
    <circle cx={10} cy={72} r={4} fill="#000" />
  </g>
);

const Labyrinth: React.FC = () => {
  const frame = useCurrentFrame();
  const zoom = interpolate(frame, [0, 240], [1.25, 0.95], {easing: Easing.out(Easing.quad)});
  const rot = frame * 0.12;
  const SLASH = 150;
  const cut = prog(frame, SLASH, SLASH + 6, Easing.out(Easing.quad));
  const after = prog(frame, SLASH + 3, SLASH + 50, Easing.out(Easing.cubic));
  const eye = 0.7 + 0.3 * Math.sin(frame / 5);
  const headIn = prog(frame, 40, 90);
  // 斜切线：经过牛头中心
  const ang = -0.38;
  return (
    <AbsoluteFill>
      <Sky kind="void" />
      <AbsoluteFill style={{background: 'radial-gradient(circle at 50% 44%, rgba(180,40,20,0.25), transparent 50%)', opacity: 1 - after}} />
      <svg width={W} height={H} style={{position: 'absolute'}}>
        <defs>
          <filter id="labGlow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="4" result="b" />
            <feMerge>
              <feMergeNode in="b" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <clipPath id="halfA">
            <path d="M-2000,-2000 L2000,-2000 L2000,0 L-2000,0 Z" transform={`rotate(${(ang * 180) / Math.PI})`} />
          </clipPath>
          <clipPath id="halfB">
            <path d="M-2000,0 L2000,0 L2000,2000 L-2000,2000 Z" transform={`rotate(${(ang * 180) / Math.PI})`} />
          </clipPath>
        </defs>
        <g transform={`translate(${CX},${CY}) scale(${zoom}) rotate(${rot})`} filter="url(#labGlow)">
          {RINGS.map((ring, i) => {
            const p = prog(frame, i * 8, 70 + i * 10, Easing.inOut(Easing.cubic));
            return (
              <g key={i}>
                <path d={ring.d} fill="none" stroke={C.gold} strokeWidth={3} pathLength={1} strokeDasharray={1} strokeDashoffset={1 - p} opacity={0.85} />
                {i < RINGS.length - 1 &&
                  ring.walls.map((a, k) => (
                    <line
                      key={k}
                      x1={Math.cos(a) * ring.r}
                      y1={Math.sin(a) * ring.r}
                      x2={Math.cos(a) * (ring.r + 52 * p)}
                      y2={Math.sin(a) * (ring.r + 52 * p)}
                      stroke={C.gold}
                      strokeWidth={3}
                      opacity={0.85}
                    />
                  ))}
              </g>
            );
          })}
        </g>
        {/* 牛头怪：被斩成两半 */}
        <g transform={`translate(${CX},${CY + 10}) scale(${0.9 + headIn * 0.25})`} opacity={headIn * (1 - after)}>
          <g clipPath="url(#halfA)">
            <g transform={`translate(${after * 120 * Math.cos(ang - 1.57)},${after * 120 * Math.sin(ang - 1.57)}) rotate(${-after * 14})`}>
              <Minotaur eye={eye} />
            </g>
          </g>
          <g clipPath="url(#halfB)">
            <g transform={`translate(${-after * 120 * Math.cos(ang - 1.57)},${-after * 120 * Math.sin(ang - 1.57)}) rotate(${after * 10})`}>
              <Minotaur eye={eye} />
            </g>
          </g>
        </g>
        {/* 剑光 */}
        {frame >= SLASH && frame < SLASH + 30 && (
          <g transform={`translate(${CX},${CY + 10}) rotate(${(ang * 180) / Math.PI})`} opacity={1 - prog(frame, SLASH + 8, SLASH + 30)}>
            <rect x={-1300} y={-7} width={2600 * cut} height={14} fill="#fffaf0" style={{filter: 'drop-shadow(0 0 18px #fff) drop-shadow(0 0 40px #ffd27a)'}} />
          </g>
        )}
      </svg>
      <Flash at={SLASH + 1} peak={0.85} />
      <Shockwave x={CX} y={CY} start={SLASH + 1} dur={36} max={1100} width={10} />
      <Sparks x={CX} y={CY} start={SLASH + 1} count={70} power={520} seed="mino" />
      <Sparks x={CX} y={CY} start={SLASH + 2} count={40} power={300} seed="mino2" color={C.ember} />
    </AbsoluteFill>
  );
};

/* ---------------- B. 日出凯旋 ---------------- */
const Gull: React.FC<{x: number; y: number; s: number; phase: number}> = ({x, y, s, phase}) => {
  const f = Math.sin(phase) * 10;
  return <path d={`M${x - 18 * s},${y + f * s * 0.4} Q${x - 8 * s},${y - 6 * s - f * s * 0.5} ${x},${y} Q${x + 8 * s},${y - 6 * s - f * s * 0.5} ${x + 18 * s},${y + f * s * 0.4}`} fill="none" stroke="#2a1622" strokeWidth={2.5 * s} strokeLinecap="round" />;
};

const Voyage: React.FC = () => {
  const frame = useCurrentFrame();
  const seaY = 640;
  const s = 0.5;
  const x = interpolate(frame, [0, 230], [620, 1020]);
  const bob = Math.sin(frame / 18) * 5;
  const tilt = Math.sin(frame / 22) * 1.2;
  const sunY = interpolate(frame, [0, 230], [660, 520], {easing: Easing.out(Easing.quad)});
  return (
    <AbsoluteFill>
      <Sky kind="dawn" />
      <Orb x={1420} y={sunY} r={70} color="#ffb35a" glow={1.2} />
      <Rays x={1420} y={sunY} color="rgba(255,190,120,0.14)" count={14} spin={0.04} />
      <svg width={W} height={H} style={{position: 'absolute'}}>
        {Array.from({length: 7}, (_, i) => (
          <Gull key={i} x={300 + i * 210 + frame * (1.2 + (i % 3) * 0.3)} y={200 + random(`gy${i}`) * 180 + Math.sin(frame / 30 + i) * 10} s={0.7 + random(`gs${i}`) * 0.6} phase={frame / 4 + i} />
        ))}
        <g transform={`translate(${x},${seaY - 50 * s + bob}) rotate(${tilt}) scale(${s})`}>
          <Ship frame={frame} billow={0.9} oarPhase={frame / 6} />
        </g>
      </svg>
      <Sea y={seaY} colors={['#3b2a46', '#2b2040', '#1d1832', '#120f22']} glint="#ffc27a" glintX={1420} amp={7} />
      {/* 船尾的白色航迹 */}
      <svg width={W} height={H} style={{position: 'absolute', mixBlendMode: 'screen'}}>
        {Array.from({length: 18}, (_, i) => {
          const k = ((frame * 2 + i * 14) % 250) / 250;
          return (
            <ellipse key={i} cx={x - 240 - k * 420} cy={seaY + 6 + k * 8} rx={30 + k * 90} ry={3 + k * 4} fill="none" stroke="#ffe2c0" strokeWidth={1.5} opacity={(1 - k) * 0.5} />
          );
        })}
      </svg>
      <Dust count={30} color="#ffd8a0" seed="voy" opacity={0.6} />
    </AbsoluteFill>
  );
};

/* ---------------- C. 港口中的纪念 ---------------- */
const Temple: React.FC<{x: number; y: number; s: number}> = ({x, y, s}) => (
  <g transform={`translate(${x},${y}) scale(${s})`}>
    <path d="M-170,-150 L0,-215 L170,-150 Z" fill="#1a1420" stroke="#f2c86b" strokeOpacity={0.5} strokeWidth={2} />
    <rect x={-175} y={-150} width={350} height={18} fill="#1d1724" />
    {Array.from({length: 8}, (_, i) => (
      <rect key={i} x={-160 + i * 44} y={-132} width={20} height={126} fill="#1d1724" stroke="#f2c86b" strokeOpacity={0.25} />
    ))}
    <rect x={-185} y={-6} width={370} height={14} fill="#1d1724" />
    <rect x={-200} y={8} width={400} height={12} fill="#1d1724" />
  </g>
);

const Harbor: React.FC = () => {
  const frame = useCurrentFrame();
  const seaY = 660;
  const s = 0.48;
  const bob = Math.sin(frame / 25) * 3;
  const dolly = interpolate(frame, [0, 210], [1.08, 1]);
  return (
    <AbsoluteFill style={{transform: `scale(${dolly})`}}>
      <Sky kind="dusk" stars={90} />
      <Orb x={1500} y={300} r={34} color="#ffe2b0" glow={0.8} />
      <svg width={W} height={H} style={{position: 'absolute'}}>
        {/* 卫城山崖 */}
        <path d="M-20,660 L-20,420 C80,400 160,380 240,360 L560,350 C620,360 680,420 760,520 L840,660 Z" fill="#120d18" />
        <Temple x={400} y={352} s={0.95} />
        {/* 码头 */}
        <rect x={700} y={seaY - 10} width={900} height={14} fill="#2a1a10" />
        {Array.from({length: 10}, (_, i) => (
          <rect key={i} x={720 + i * 92} y={seaY - 10} width={10} height={70} fill="#1e130b" />
        ))}
        <g transform={`translate(${1180},${seaY - 50 * s + bob}) scale(${s})`}>
          <Ship frame={frame} billow={0.15} oars={false} />
        </g>
        {/* 灯火 */}
        {[760, 1000, 1360, 1580].map((lx, i) => (
          <g key={i}>
            <circle cx={lx} cy={seaY - 40} r={30} fill="rgba(255,190,90,0.18)" />
            <circle cx={lx} cy={seaY - 40} r={5 + Math.sin(frame / 6 + i) * 0.8} fill="#ffd690" />
            <line x1={lx} y1={seaY - 35} x2={lx} y2={seaY - 10} stroke="#2a1a10" strokeWidth={4} />
          </g>
        ))}
      </svg>
      <Sea y={seaY} colors={['#2a1c34', '#1d1530', '#140f24', '#0b0918']} glint="#ffd690" glintX={1180} amp={5} speed={0.7} />
      <Dust count={40} seed="harb" opacity={0.7} />
    </AbsoluteFill>
  );
};

export const Legend: React.FC = () => {
  const frame = useCurrentFrame();
  const aOp = 1 - prog(frame, 235, 260);
  const bOp = prog(frame, 235, 260) * (1 - prog(frame, 445, 470));
  const cOp = prog(frame, 445, 470);
  return (
    <AbsoluteFill>
      {aOp > 0 && (
        <AbsoluteFill style={{opacity: aOp}}>
          <Labyrinth />
        </AbsoluteFill>
      )}
      {bOp > 0 && (
        <Sequence from={235} layout="absolute-fill">
          <AbsoluteFill style={{opacity: bOp}}>
            <Voyage />
          </AbsoluteFill>
        </Sequence>
      )}
      {cOp > 0 && (
        <Sequence from={445} layout="absolute-fill">
          <AbsoluteFill style={{opacity: cOp}}>
            <Harbor />
          </AbsoluteFill>
        </Sequence>
      )}
      <Subtitles cues={CUES.legend} />
    </AbsoluteFill>
  );
};

import React from 'react';
import {AbsoluteFill, Easing, random, useCurrentFrame} from 'remotion';
import {Dust, Sky} from '../components/Atmos';
import {Subtitles} from '../components/Text';
import {C, H, SERIF, W} from '../lib/theme';
import {clamp01, prog} from '../lib/math';
import {CUES, STATS} from '../script';

const BX = 560;
const BY = 520;
const HEAD = {x: 0, y: -280, r: 58};

const capsule = (px: number, py: number, ax: number, ay: number, bx: number, by: number, r: number) => {
  const dx = bx - ax;
  const dy = by - ay;
  const t = Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / (dx * dx + dy * dy)));
  const cx = ax + dx * t;
  const cy = ay + dy * t;
  return (px - cx) ** 2 + (py - cy) ** 2 <= r * r;
};

const inBody = (x: number, y: number) => {
  if ((x - HEAD.x) ** 2 + (y - HEAD.y) ** 2 <= HEAD.r ** 2) return 'head';
  if (Math.abs(x) < 20 && y > -230 && y < -195) return 'body';
  if (y >= -205 && y <= 40) {
    const t = (y + 205) / 245;
    const half = t < 0.82 ? 110 - t * 50 : 69 + (t - 0.82) * 90;
    if (Math.abs(x) <= half) return 'body';
  }
  for (const s of [-1, 1]) {
    if (capsule(x, y, s * 118, -185, s * 150, -40, 24)) return 'body';
    if (capsule(x, y, s * 150, -40, s * 168, 90, 20)) return 'body';
    if (capsule(x, y, s * 45, 40, s * 55, 190, 34)) return 'body';
    if (capsule(x, y, s * 55, 190, s * 62, 340, 27)) return 'body';
  }
  return null;
};

type P = {x: number; y: number; head: boolean; period: number; phase: number; sx: number; sy: number; delay: number};

const POINTS: P[] = (() => {
  const pts: P[] = [];
  let i = 0;
  while (pts.length < 1250 && i < 20000) {
    const x = (random(`hx${i}`) - 0.5) * 380;
    const y = -350 + random(`hy${i}`) * 700;
    const kind = inBody(x, y);
    if (kind) {
      pts.push({
        x,
        y,
        head: kind === 'head',
        period: 90 + random(`hp${i}`) * 170,
        phase: random(`hf${i}`) * 400,
        sx: random(`hsx${i}`) * W - BX,
        sy: random(`hsy${i}`) * H - BY,
        delay: random(`hd${i}`) * 30,
      });
    }
    i++;
  }
  return pts;
})();

const HEAD_PTS = POINTS.filter((p) => p.head);
// 大脑中的“神经元”
const NEURONS = Array.from({length: 22}, (_, i) => {
  const a = random(`na${i}`) * Math.PI * 2;
  const r = Math.sqrt(random(`nr${i}`)) * (HEAD.r - 10);
  return {x: HEAD.x + Math.cos(a) * r, y: HEAD.y + Math.sin(a) * r * 0.9};
});

const Body: React.FC<{frame: number}> = ({frame}) => {
  const brain = prog(frame, 450, 520);
  const rewire = prog(frame, 745, 790);
  const epoch = Math.floor(frame / 9);
  return (
    <g>
      {POINTS.map((p, i) => {
        const t = Easing.out(Easing.cubic)(clamp01((frame - p.delay) / 50));
        const x = p.sx + (p.x - p.sx) * t;
        const y = p.sy + (p.y - p.sy) * t;
        const cyc = (frame + p.phase) % p.period;
        const renewing = !p.head && frame > 150 && cyc < 14;
        const k = renewing ? 1 - cyc / 14 : 0;
        const fill = p.head ? (brain > 0 ? C.blue : C.gold) : renewing ? C.cyan : C.gold;
        const r = p.head ? 2.2 + brain * 0.8 : 2 + k * 2.5;
        const op = p.head ? 0.75 + brain * 0.25 : renewing ? 0.4 + k * 0.6 : 0.65;
        return <circle key={i} cx={x + (renewing ? Math.sin(i) * k * 6 : 0)} cy={y - k * 8} r={r} fill={fill} opacity={op * t} />;
      })}
      {brain > 0 && (
        <g opacity={brain} style={{mixBlendMode: 'screen'}}>
          <circle cx={HEAD.x} cy={HEAD.y} r={HEAD.r + 30} fill="url(#brainGlow)" />
          {NEURONS.map((a, i) =>
            NEURONS.map((b, j) => {
              if (j <= i) return null;
              const d = Math.hypot(a.x - b.x, a.y - b.y);
              if (d > 42) return null;
              const flicker = rewire > 0 ? (random(`rw${i}-${j}-${epoch}`) > 0.45 ? 1 : 0.1) : 1;
              const pulse = 0.4 + 0.6 * Math.abs(Math.sin(frame / 10 + i + j));
              return <line key={`${i}-${j}`} x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke={rewire > 0 && flicker > 0.5 && (i + j + epoch) % 3 === 0 ? C.goldHot : C.cyan} strokeWidth={1} opacity={pulse * flicker} />;
            }),
          )}
          {NEURONS.map((n, i) => (
            <circle key={i} cx={n.x} cy={n.y} r={2.6} fill="#e8fbff" />
          ))}
        </g>
      )}
      <defs>
        <radialGradient id="brainGlow">
          <stop offset="0" stopColor={C.blue} stopOpacity="0.45" />
          <stop offset="1" stopColor={C.blue} stopOpacity="0" />
        </radialGradient>
      </defs>
    </g>
  );
};

const countUp = (text: string, t: number) =>
  text.replace(/\d+/, (m) => String(Math.round(Number(m) * Easing.out(Easing.cubic)(t))));

const StatCard: React.FC<{i: number; frame: number}> = ({i, frame}) => {
  const s = STATS[i];
  const start = 150 + i * 45;
  const t = prog(frame, start, start + 30, Easing.out(Easing.back(1.4)));
  const out = prog(frame, 430, 455);
  const count = prog(frame, start, start + 45);
  const edge = prog(frame, start + 5, start + 40);
  return (
    <div
      style={{
        position: 'absolute',
        left: 1030,
        top: 170 + i * 160,
        width: 800,
        height: 136,
        opacity: clamp01(t) * (1 - out),
        transform: `translateX(${(1 - t) * 260 + out * 80}px)`,
        borderRadius: 14,
        background: 'linear-gradient(90deg, rgba(20,40,60,0.85), rgba(8,16,26,0.6))',
        border: '1px solid rgba(111,240,255,0.25)',
        boxShadow: `0 0 ${30 * edge}px rgba(111,240,255,0.15)`,
        display: 'flex',
        alignItems: 'center',
        padding: '0 36px',
        gap: 30,
        fontFamily: SERIF,
        overflow: 'hidden',
      }}
    >
      <div style={{position: 'absolute', left: 0, top: 0, width: 4, height: 136 * edge, background: C.cyan, boxShadow: `0 0 12px ${C.cyan}`}} />
      <div style={{fontSize: 52, fontWeight: 900, color: C.goldHot, minWidth: 270, textShadow: '0 0 18px rgba(242,200,107,0.5)', fontVariantNumeric: 'tabular-nums'}}>{countUp(s.value, count)}</div>
      <div style={{fontSize: 28, color: C.ivory, letterSpacing: 2, whiteSpace: 'nowrap'}}>{s.label}</div>
    </div>
  );
};

export const Human: React.FC = () => {
  const frame = useCurrentFrame();
  const zoom = prog(frame, 445, 540, Easing.inOut(Easing.cubic));
  const unzoom = prog(frame, 800, 860, Easing.inOut(Easing.cubic));
  const z = zoom * (1 - unzoom * 0.3);
  const s = 1 + z * 1.7;
  const tx = BX + (W / 2 - BX) * z;
  const ty = BY + (430 - BY) * z;
  return (
    <AbsoluteFill>
      <Sky kind="void" stars={100} />
      <AbsoluteFill style={{background: `radial-gradient(ellipse 35% 55% at ${(BX / W) * 100}% 50%, rgba(111,240,255,0.10), transparent 70%)`}} />
      <svg width={W} height={H} style={{position: 'absolute'}}>
        <g transform={`translate(${tx},${ty}) scale(${s}) translate(${-HEAD.x * z},${-HEAD.y * z})`}>
          <Body frame={frame} />
        </g>
      </svg>
      {STATS.map((_, i) => (
        <StatCard key={i} i={i} frame={frame} />
      ))}
      <Dust count={40} seed="hum" color={C.cyan} opacity={0.4} />
      <Subtitles cues={CUES.human} />
    </AbsoluteFill>
  );
};

import React from 'react';
import {FONTS, H, ONSCREEN, PALETTE as P, W} from '../config';
import {clamp01, easeInOut, easeOut, hash, lerp, span, win} from '../lib/anim';
import {BRAIN, Bubble, Cam, Motes, Orbit, SP, Stage, Txt} from '../components/Kit';
import {DotShape, SHAPES} from '../components/Dots';
import {ParticleText} from '../components/ParticleText';

/* ================= 夜里的一扇窗（R1 开头与 R8 结尾共用） ================= */
export const WindowRoom: React.FC<{t: number; dawn?: number; clock: string; children?: React.ReactNode}> = ({t, dawn = 0, clock, children}) => {
  const lit = dawn > 0 ? P.ember : P.ice;
  const wx = 1250;
  const wy = 360;
  return (
    <g>
      <rect x={-600} y={-400} width={W + 1200} height={H + 800} fill={P.bg} />
      {/* 窗光 */}
      <rect x={wx - 160} y={wy - 190} width={320} height={380} fill={lit} opacity={0.08 + 0.55 * dawn} filter="url(#soft)" />
      <rect x={wx - 150} y={wy - 180} width={300} height={360} fill="none" stroke={lit} strokeWidth={3} opacity={0.5 + 0.4 * dawn} filter="url(#glow)" />
      <path d={`M${wx},${wy - 180} L${wx},${wy + 180} M${wx - 150},${wy} L${wx + 150},${wy}`} stroke={lit} strokeWidth={3} opacity={0.4 + 0.4 * dawn} />
      {/* 落到地上的光 */}
      <path d={`M${wx - 150},${wy + 180} L${wx + 150},${wy + 180} L${wx + 20},1080 L${wx - 560},1080 Z`} fill={lit} opacity={0.035 + 0.12 * dawn} />
      <Motes t={t} n={60} o={0.5} color={dawn > 0.3 ? P.ember : P.ice} />
      {/* 读数式的时间 */}
      <g opacity={0.95}>
        <text x={150} y={860} fontFamily={FONTS.sans} fontWeight={600} fontSize={64} fill={dawn > 0.5 ? P.ember : P.gold} letterSpacing={4} filter="url(#glow)">
          {clock}
        </text>
        <line x1={150} x2={420} y1={882} y2={882} stroke={P.gold} strokeWidth={2} opacity={0.5} />
      </g>
      {children}
    </g>
  );
};

/** 躺着的人：侧脸点阵转 90°，面朝上 */
export const Lying: React.FC<{t: number; x: number; y: number; p?: number; o?: number}> = ({t, x, y, p = 1, o = 1}) => (
  <DotShape d={SHAPES.head} x={x} y={y} scale={0.75} step={8} p={p} t={t} o={o} color={P.gold} />
);

/* ================= R1 开头：四种内耗 ================= */
export const R1: React.FC<SP> = ({s}) => {
  const a = win(s, -1, 3.6, 0.1, 0.4);
  const b = win(s, 3.3, 6.8, 0.3, 0.4);
  const c = win(s, 6.5, 9.9, 0.3, 0.4);
  const d = span(s, 9.5, 10.0);
  return (
    <Stage>
      {a > 0 && (
        <g opacity={a}>
          <Cam z={lerp(1.0, 1.08, span(s, 0, 3.6))} cx={860} cy={560}>
            <WindowRoom t={s} clock="03:00">
              <Lying t={s} x={560} y={840} p={span(s, -0.5, 1.2)} />
              <Orbit cx={590} cy={640} rx={170} ry={44} t={s} speed={0.55} color={P.gold} r={7} ring={0.2} />
            </WindowRoom>
          </Cam>
        </g>
      )}
      {b > 0 && (
        <g opacity={b}>
          <Motes t={s} n={50} />
          <Cam z={lerp(1.06, 1.0, span(s, 3.3, 6.8))}>
            <Txt x={W / 2} y={300} text="23:14" size={22} color={P.dim} o={span(s, 3.5, 3.9)} />
            <Bubble x={1080} y={380} w={300} h={70} text="在吗，那天的事" size={28} tail="r" color="#E8C27A" o={span(s, 3.6, 4.0)} />
            <Txt x={1225} y={445} text="已读" size={20} color={P.dim} anchor="end" o={span(s, 4.2, 4.5)} />
            <Txt x={W / 2} y={540} text="02:47" size={22} color={P.dim} o={span(s, 5.0, 5.4)} />
            <Txt x={720} y={610} text={Math.sin(s * 6) > 0 ? '对方正在输入…' : ''} size={24} color={P.dim} anchor="start" o={span(s, 5.2, 5.5)} />
          </Cam>
        </g>
      )}
      {c > 0 && (
        <g opacity={c}>
          {Array.from({length: 60}, (_, i) => {
            const x = hash(i) * W;
            const y = ((s * (800 + hash(i + 1) * 500) + hash(i + 2) * H) % (H + 200)) - 200;
            return <line key={i} x1={x} y1={y} x2={x - 4} y2={y + 50 + hash(i + 3) * 50} stroke={P.ice} strokeWidth={1.5} opacity={0.18} />;
          })}
          <DotShape d={SHAPES.frame} x={W / 2} y={470} scale={1.2} step={7} stroke={5} p={span(s, 6.6, 7.8)} t={s} color={P.paper} seed={4} />
          <DotShape d={SHAPES.person} x={W / 2 - 80} y={600} scale={0.75} step={7} p={span(s, 7.0, 8.2)} t={s} color={P.gold} seed={5} />
          <DotShape d={SHAPES.slump} x={W / 2 + 90} y={600} scale={0.75} step={7} p={span(s, 7.2, 8.4)} t={s} color={P.red} seed={6} />
          <Txt x={W / 2} y={700} text="三年前" size={26} color={P.dim} o={span(s, 7.6, 8.2)} spacing={8} />
        </g>
      )}
      {d > 0 && (
        <g opacity={d}>
          <Motes t={s} n={60} />
          <DotShape d={SHAPES.head} x={900} y={1010} scale={1.55} step={10} p={span(s, 9.4, 10.4)} t={s} color={P.gold} o={1 - 0.6 * span(s, 10.8, 11.3)} />
          {[0, 1, 2, 3].map((k) => (
            <Orbit
              key={k}
              cx={900 + BRAIN.x * 1.55}
              cy={1010 + BRAIN.y * 1.55}
              rx={260 + k * 70}
              ry={70 + k * 20}
              rot={-12 + k * 9}
              t={s * (1 + span(s, 9.7, 12.8) * 2) + k * 0.25}
              speed={0.5 + k * 0.12}
              color={k % 2 ? P.red : P.gold}
              r={7}
              ring={0.15}
              o={span(s, 9.7 + k * 0.3, 10.2 + k * 0.3) * (1 - 0.6 * span(s, 10.8, 11.3))}
            />
          ))}
        </g>
      )}
    </Stage>
  );
};

/* ================= R2 标题：粒子聚成“反刍思维” ================= */
export const R2: React.FC<SP> = ({s}) => (
  <Stage>
    <Motes t={s} n={110} />
    <Txt x={W / 2} y={360} text={ONSCREEN.en} size={22} color={P.gold} o={span(s, 13.4, 14.2) * (1 - span(s, 16.8, 17.4))} spacing={18} />
    <ParticleText text={ONSCREEN.title} x={W / 2} y={500} size={190} font={FONTS.title} weight={900} p={span(s, 12.8, 14.4)} out={span(s, 16.7, 17.6)} color={P.ember} step={5} seed={2} />
    <Txt x={W / 2} y={660} text={ONSCREEN.kicker} size={34} color={P.text} o={span(s, 14.4, 15.0) * (1 - span(s, 16.8, 17.4))} spacing={8} font={FONTS.body} />
  </Stage>
);

/* ================= R3 牛的反刍 → 人脑里的循环 ================= */
export const R3: React.FC<SP> = ({s}) => {
  const cowOut = span(s, 22.3, 23.3);
  const headP = span(s, 22.7, 24.0);
  const laps = s - 24.9;
  const hx = 820;
  const hy = 1010;
  const hs = 1.6;
  return (
    <Stage>
      <Motes t={s} n={50} />
      {cowOut < 1 && (
        <g>
          <DotShape d={SHAPES.cow} x={880} y={640} scale={1.5} step={7} stroke={6} p={span(s, 17.2, 18.6)} out={cowOut} t={s} color={P.gold} seed={8} />
          <g opacity={span(s, 18.4, 18.9) * (1 - cowOut)}>
            <Orbit cx={880 + 160 * 1.5} cy={640 - 130 * 1.5} rx={230 * 1.5} ry={40 * 1.5} rot={6} t={s} speed={0.45} color={P.green} r={9} ring={0.25} />
          </g>
        </g>
      )}
      {headP > 0 && (
        <g>
          <DotShape d={SHAPES.head} x={hx} y={hy} scale={hs} step={10} p={headP} t={s} color={P.gold} seed={9} />
          <g opacity={headP}>
            <Orbit cx={hx + BRAIN.x * hs} cy={hy + BRAIN.y * hs} rx={190} ry={60} t={s} speed={0.6} color={P.ember} r={9} ring={0.3} />
            {Array.from({length: Math.max(0, Math.min(10, Math.floor(laps * 1.2)))}, (_, k) => (
              <ellipse key={k} cx={hx + BRAIN.x * hs} cy={hy + BRAIN.y * hs} rx={190 + k * 6} ry={60 + k * 2} fill="none" stroke={P.gold} strokeWidth={1.5} opacity={0.25} />
            ))}
          </g>
        </g>
      )}
    </Stage>
  );
};

/* ================= R4 绕着答案转圈 ================= */
export const R4: React.FC<SP> = ({s}) => {
  const cx = W / 2;
  const cy = 470;
  const ans = span(s, 28.6, 29.6);
  const reveal = span(s, 37.3, 38.6);
  const tilt = lerp(0.36, 1, reveal);
  const a = s * 1.6;
  const px = cx + Math.cos(a) * 330;
  const py = cy + Math.sin(a) * 330 * tilt;
  const laps = Math.floor(((s - 28.4) * 1.6) / (Math.PI * 2));
  return (
    <Stage>
      <Motes t={s} n={60} />
      <circle cx={cx} cy={cy} r={140} fill="url(#warmPool)" opacity={ans} />
      <circle cx={cx} cy={cy} r={12} fill={P.ember} filter="url(#bigglow)" opacity={ans} />
      <Txt x={cx} y={cy + 66} text="答案" size={40} color={P.ember} o={ans} font={FONTS.title} weight={600} spacing={10} />
      {Array.from({length: Math.min(laps, 12)}, (_, k) => (
        <ellipse key={k} cx={cx} cy={cy} rx={330} ry={330 * tilt} fill="none" stroke={P.gold} strokeWidth={2 + k * 0.6} opacity={0.12 + k * 0.03} />
      ))}
      {Array.from({length: 30}, (_, i) => {
        const b = a - i * 0.06;
        return <circle key={i} cx={cx + Math.cos(b) * 330} cy={cy + Math.sin(b) * 330 * tilt} r={10 * (1 - i / 30)} fill={P.gold} opacity={(1 - i / 30) * 0.8} />;
      })}
      <circle cx={px} cy={py} r={11} fill={P.ember} filter="url(#glow)" />
      <line x1={px} y1={py} x2={cx} y2={cy} stroke={P.red} strokeWidth={2} strokeDasharray="8 10" opacity={reveal * 0.8} />
    </Stage>
  );
};

export const _unused = {clamp01, easeInOut, easeOut, H};

import React from 'react';
import {AbsoluteFill} from 'remotion';
import {FONTS, H, ONSCREEN, PALETTE as P, W} from '../config';
import {clamp01, easeIn, easeInOut, easeOut, hash, lerp, span, win} from '../lib/anim';
import {Mountain, Ridges, Sky, Trails, slopePoint} from '../components/Land';
import {Counter, Figure, Stone} from '../components/Figure';
import {ParticleText} from '../components/ParticleText';
import {Cam, STONE_R, TOP_U, camTf, pusherAt, stoneAt} from '../lib/push';

export type SceneProps = {t: number; sec: number};

const lerpCam = (a: Cam, b: Cam, e: number): Cam => ({x: lerp(a.x, b.x, e), y: lerp(a.y, b.y, e), z: lerp(a.z, b.z, e)});

/** 山的舞台：天空、远山、前景大山与轨迹，children 画在镜头组内（世界坐标） */
export const Stage: React.FC<{sec: number; cam: Cam; trails: number; fresh?: number; dawn?: number; children?: React.ReactNode; over?: React.ReactNode}> = ({
  sec,
  cam,
  trails,
  fresh = 0,
  dawn = 0,
  children,
  over,
}) => (
  <AbsoluteFill>
    <Sky sec={sec} dawn={dawn} />
    <Ridges pan={(cam.x - 960) * 0.5 + sec * 4} dawn={dawn} />
    <svg width={W} height={H} style={{position: 'absolute', inset: 0}}>
      <g transform={camTf(cam)}>
        <Mountain />
        <Trails count={trails} fresh={fresh} />
        {children}
      </g>
      {over}
    </svg>
  </AbsoluteFill>
);

/** 石头落地扬起的尘土 */
const Dust: React.FC<{x: number; y: number; t: number}> = ({x, y, t}) => {
  if (t < 0 || t > 1.4) return null;
  const k = t / 1.4;
  return (
    <g>
      {Array.from({length: 26}, (_, i) => {
        const a = Math.PI + hash(i) * Math.PI;
        const v = 40 + hash(i + 3) * 120;
        return <circle key={i} cx={x + Math.cos(a) * v * easeOut(k)} cy={y + Math.sin(a) * v * 0.5 * easeOut(k)} r={3 + hash(i + 7) * 6} fill="#8E93B8" opacity={(1 - k) * 0.35} />;
      })}
    </g>
  );
};

/* ============ A01 石头又一次滚落（0–12s）============ */
export const A01: React.FC<SceneProps> = ({t, sec}) => {
  const roll = span(t, 0.4, 4.0, easeIn);
  const u = lerp(TOP_U, 0, roll) + (t > 4.0 ? Math.sin((t - 4.0) * 12) * 6 * Math.max(0, 1 - (t - 4.0) / 0.8) : 0);
  const st = stoneAt(Math.max(-4, u));
  const pull = span(t, 3.6, 7.4);
  const cam = lerpCam({x: st.x, y: st.y - 60, z: 1.7}, {x: 960, y: 560, z: 1}, pull);
  const camFollow = t < 3.6 ? {x: lerp(1250, st.x, span(t, 0, 3.6)), y: lerp(420, st.y - 60, span(t, 0, 3.6)), z: 1.7} : cam;
  const top = slopePoint(TOP_U + 60);
  const titleP = span(t, 8.4, 10.4);
  const titleOut = span(t, 11.2, 12.4);
  return (
    <Stage
      sec={sec}
      cam={camFollow}
      trails={140}
      fresh={win(t, 0.5, 6.5, 0.4, 2.0)}
      over={
        <g>
          {titleP > 0 && <rect width={W} height={H} fill="#000" opacity={0.35 * win(t, 8.2, 12.4, 0.8, 0.6)} />}
          <ParticleText text={ONSCREEN.title} x={W / 2} y={H / 2 - 60} size={230} font={FONTS.title} p={titleP} out={titleOut} step={5} seed={2} />
          <text x={W / 2} y={H / 2 + 110} textAnchor="middle" fontFamily={FONTS.title} fontSize={34} letterSpacing={14} fill={P.text} opacity={win(t, 9.6, 12.2, 0.8, 0.6) * 0.8}>
            {ONSCREEN.subtitle}
          </text>
        </g>
      }
    >
      <Figure x={top.x} y={top.y} s={1.05} lean={0.12} headUp={-0.4} level={1} />
      <Stone x={st.x} y={st.y} rot={st.rot} tally={60} />
      <Dust x={slopePoint(0).x} y={slopePoint(0).y} t={t - 4.0} />
    </Stage>
  );
};

/* ============ A02 神话（12–26s）============ */
const Death: React.FC<{x: number; y: number; o: number}> = ({x, y, o}) => (
  <g transform={`translate(${x},${y})`} opacity={o}>
    <path d="M-60,0 C-58,-120 -40,-210 0,-250 C40,-210 58,-120 60,0 Z" fill="#05060C" stroke="#4A4F78" strokeWidth={2} />
    <path d="M-26,-200 C-20,-238 20,-238 26,-200 C18,-186 -18,-186 -26,-200 Z" fill="#000" />
    <circle cx={-9} cy={-208} r={3} fill="#9AA6FF" />
    <circle cx={9} cy={-208} r={3} fill="#9AA6FF" />
  </g>
);

/** 诸神：云层裂开，一道光柱落向山脚的石头 */
const Gods: React.FC<{p: number; target: {x: number; y: number}}> = ({p, target}) => {
  const o = clamp01(p * 1.5);
  return (
    <g opacity={o}>
      <defs>
        <linearGradient id="beam" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#FFE6B8" stopOpacity="0.55" />
          <stop offset="1" stopColor="#FFE6B8" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={`M${1180},${40} L${1320},${40} L${target.x + 90},${target.y + 40} L${target.x - 90},${target.y + 40} Z`} fill="url(#beam)" opacity={easeOut(p)} />
      {Array.from({length: 9}, (_, i) => (
        <ellipse key={i} cx={1000 + i * 70 + Math.sin(i) * 20} cy={30 + (i % 3) * 22} rx={150 + hash(i) * 80} ry={46 + hash(i + 3) * 20} fill="#3A3F68" opacity={0.85} />
      ))}
      {Array.from({length: 9}, (_, i) => (
        <ellipse key={`h${i}`} cx={1000 + i * 70 + Math.sin(i) * 20} cy={46 + (i % 3) * 22} rx={150 + hash(i) * 80} ry={10} fill="#FFE6B8" opacity={0.12 * easeOut(p)} />
      ))}
    </g>
  );
};

export const A02: React.FC<SceneProps> = ({t, sec}) => {
  const deathIn = span(t, 0.6, 2.0);
  const chain = span(t, 1.6, 3.6);
  const deathOut = span(t, 5.2, 6.2);
  const hand = span(t, 5.6, 7.6);
  const lapse = span(t, 9.8, 13.4);
  // 一次快进：推上去，滚下来
  const up = lapse < 0.6 ? easeInOut(lapse / 0.6) : 1 - easeIn((lapse - 0.6) / 0.4);
  const u = TOP_U * up;
  const st = stoneAt(u);
  const pp = lapse < 0.6 ? pusherAt(u) : slopePoint(TOP_U - STONE_R - 46);
  return (
    <Stage
      sec={sec}
      cam={{x: 960, y: 560, z: 1}}
      trails={0}
      over={
        <g>
          <rect width={W} height={H} fill="#000" opacity={0.35 * (1 - span(t, 5.4, 6.6))} />
          {deathOut < 1 && (
            <g opacity={1 - deathOut}>
              <Death x={1180} y={860} o={deathIn} />
              <Figure x={760} y={860} s={1.1} lean={-0.08} level={deathIn} />
              {/* 锁链：从西西弗斯手里延伸到死神身上 */}
              {Array.from({length: 18}, (_, i) => {
                const k = i / 17;
                if (k > chain) return null;
                const x = lerp(820, 1130, k);
                const y = lerp(790, 720, k) + Math.sin(k * Math.PI) * 30;
                return <ellipse key={i} cx={x} cy={y} rx={9} ry={6} transform={`rotate(${i % 2 ? 70 : 0},${x},${y})`} fill="none" stroke="#B9BED8" strokeWidth={2.4} />;
              })}
              <text x={1180} y={560} textAnchor="middle" fontFamily={FONTS.title} fontSize={28} letterSpacing={8} fill={P.dim} opacity={deathIn}>
                死神
              </text>
            </g>
          )}
          {hand > 0.01 && (
            <g>
              <Gods p={hand} target={{x: stoneAt(0).x, y: stoneAt(0).y}} />
              <text x={1250} y={190} textAnchor="middle" fontFamily={FONTS.title} fontSize={28} letterSpacing={8} fill={P.dim} opacity={hand * (1 - span(t, 12.6, 13.6))}>
                诸神
              </text>
            </g>
          )}
        </g>
      }
    >
      {lapse > 0.001 && (
        <g>
          <Figure x={pp.x} y={pp.y} s={1} lean={lapse < 0.6 ? 0.85 : 0.1} stride={u / 26} push={lapse < 0.6 ? 1 : 0} />
          <Stone x={st.x} y={st.y} rot={st.rot} />
        </g>
      )}
      {lapse <= 0.001 && hand > 0.3 && <Stone x={stoneAt(0).x} y={stoneAt(0).y} level={span(t, 7.0, 8.0)} />}
    </Stage>
  );
};

/* ============ A03 推石（26–44s）============ */
export const A03: React.FC<SceneProps> = ({t, sec}) => {
  // 第一次：慢慢推上去，中途两次打滑
  const climb = span(t, 0.4, 9.6, (x) => x);
  const slip = -40 * win(t, 3.6, 4.4, 0.15, 0.5) - 60 * win(t, 6.6, 7.6, 0.15, 0.6);
  let u = TOP_U * climb + slip;
  let pushing = true;
  let pu = u;
  if (t > 9.6) {
    // 快到山顶时脱手，滚回去
    const back = span(t, 9.8, 11.8, easeIn);
    u = lerp(TOP_U, 0, back);
    pushing = false;
    pu = TOP_U;
  }
  // 蒙太奇：越来越快的循环
  const montage = t >= 11.2;
  const cyc = montage ? Math.pow(clamp01((t - 11.2) / 6.8), 1.6) * 18 : 0; // 已完成的循环数（连续值）
  const phase = cyc % 1;
  if (montage) {
    const upPart = 0.65;
    if (phase < upPart) {
      u = TOP_U * easeInOut(phase / upPart);
      pu = u;
      pushing = true;
    } else {
      u = lerp(TOP_U, 0, easeIn((phase - upPart) / (1 - upPart)));
      pu = TOP_U;
      pushing = false;
    }
  }
  const st = stoneAt(u);
  const pp = pushing ? pusherAt(pu) : slopePoint(TOP_U - STONE_R - 46);
  const count = montage ? Math.round(1 + Math.pow(clamp01((t - 11.2) / 6.8), 3) * 1023) : t > 11.8 ? 2 : 1;
  const camA: Cam = {x: st.x + 60, y: st.y - 40, z: 1.45};
  const camB: Cam = {x: 960, y: 560, z: 1};
  const cam = lerpCam(camA, camB, span(t, 10.4, 12.6));
  const trails = montage ? Math.min(150, 1 + cyc * 8) : t > 11.8 ? 1 : 0;
  const ghost = montage ? Math.min(0.6, cyc / 10) : 0;
  return (
    <Stage
      sec={sec}
      cam={cam}
      trails={trails}
      fresh={montage ? 1 - phase : win(t, 9.8, 12, 0.3, 0.6)}
      over={<Counter n={count} x={300} y={150} o={win(t, 1.0, 18.4, 0.6, 0.5)} />}
    >
      {/* 快进时的残影 */}
      {ghost > 0 &&
        [0.12, 0.24].map((d, i) => {
          const ph = (cyc - d * (1 + cyc / 6)) % 1;
          const gu = ph < 0.65 ? TOP_U * easeInOut(ph / 0.65) : lerp(TOP_U, 0, easeIn((ph - 0.65) / 0.35));
          const gs = stoneAt(gu);
          return <Stone key={i} x={gs.x} y={gs.y} rot={gs.rot} level={ghost * (0.5 - i * 0.2)} />;
        })}
      <Figure x={pp.x} y={pp.y} s={1} lean={pushing ? 0.85 : 0.08} stride={pu / 24} push={pushing ? 1 : 0} headUp={pushing ? 0.5 : -0.3} />
      <Stone x={st.x} y={st.y} rot={st.rot} tally={Math.min(60, count)} />
    </Stage>
  );
};

/* ============ A08 下山：清醒的时刻（112–128s）============ */
export const A08: React.FC<SceneProps> = ({t, sec}) => {
  const roll = span(t, 0.2, 2.6, easeIn);
  const su = lerp(TOP_U, 0, roll);
  const st = stoneAt(su);
  const walk = span(t, 3.0, 15.6, (x) => x);
  const stop = win(t, 7.8, 11.2, 0.8, 0.8); // 停下抬头
  const walkU = TOP_U - STONE_R - 46 - walk * (TOP_U - 220) + 0;
  const fu = walkU;
  const fp = slopePoint(fu);
  const cam: Cam = {x: lerp(1200, fp.x + 120, span(t, 2.4, 4.4)), y: lerp(460, fp.y - 120, span(t, 2.4, 4.4)), z: lerp(1.0, 1.45, span(t, 2.4, 4.4))};
  const wind = win(t, 7.6, 12.6, 0.8, 1.2);
  return (
    <Stage
      sec={sec}
      cam={cam}
      trails={150}
      fresh={win(t, 0.2, 4, 0.3, 1.5)}
      over={
        <g opacity={wind}>
          {Array.from({length: 7}, (_, i) => {
            const k = ((t * 0.35 + i / 7) % 1);
            const x = lerp(-200, W + 200, k);
            const y = 200 + i * 70 + Math.sin(i * 2) * 30;
            return <path key={i} d={`M${x},${y} q60,-18 120,0 t120,0`} fill="none" stroke="#C9D2FF" strokeWidth={1.4} opacity={0.35 * Math.sin(k * Math.PI)} />;
          })}
        </g>
      }
    >
      <Stone x={st.x} y={st.y} rot={st.rot} />
      <Figure x={fp.x} y={fp.y} s={1.05} lean={-0.05} stride={walk * 26 * (1 - stop * 0.98)} stepAmp={0.32 * (1 - stop)} swing={0.35 * (1 - stop)} facing={-1} headUp={0.15 + stop * 0.55} />
    </Stage>
  );
};

/* ============ A09 反抗 · 自由 · 激情（128–146s）============ */
export const A09: React.FC<SceneProps> = ({t, sec}) => {
  const climb = span(t, 0.4, 17.6, (x) => x);
  const u = TOP_U * 0.08 + climb * TOP_U * 0.8;
  const st = stoneAt(u);
  const pp = pusherAt(u);
  const revolt = span(t, 5.6, 7.0); // 挺身、抬头看向山顶
  const freedom = span(t, 9.8, 12.6); // 锁链一节节淡去
  const passion = span(t, 13.8, 15.0);
  const cam: Cam = {x: st.x - 40, y: st.y - 70, z: 1.35};
  const fp = {x: (pp.x - cam.x) * cam.z + W / 2, y: (pp.y - cam.y) * cam.z + H / 2};
  const words = [
    {txt: '反抗', o: win(t, 5.4, 18, 0.6, 0.6), dx: -230, dy: -260},
    {txt: '自由', o: win(t, 9.6, 18, 0.6, 0.6), dx: -330, dy: -120},
    {txt: '激情', o: win(t, 13.6, 18, 0.6, 0.6), dx: 260, dy: -300},
  ];
  return (
    <Stage
      sec={sec}
      cam={cam}
      trails={150}
      dawn={span(t, 6, 18) * 0.28}
      over={
        <g>
          {words.map((w) =>
            w.o > 0.01 ? (
              <g key={w.txt} opacity={w.o}>
                <text x={fp.x + w.dx} y={fp.y + w.dy} textAnchor="middle" fontFamily={FONTS.title} fontSize={58} letterSpacing={12} fill={P.warm}>
                  {w.txt}
                </text>
              </g>
            ) : null,
          )}
        </g>
      }
    >
      <Figure x={pp.x} y={pp.y} s={1} lean={lerp(0.85, 0.6, revolt)} stride={u / 24} push={1} headUp={lerp(0.2, 0.75, revolt)} chain={1 - freedom} />
      {passion > 0 &&
        Array.from({length: 18}, (_, i) => {
          const k = ((t * 1.3 + hash(i)) % 1);
          const a = -Math.PI / 2 + (hash(i * 3) - 0.5) * 2.2;
          return <circle key={i} cx={st.x + Math.cos(a) * (STONE_R + k * 90)} cy={st.y + Math.sin(a) * (STONE_R + k * 90)} r={2.2} fill={P.warm} opacity={passion * (1 - k)} />;
        })}
      <Stone x={st.x} y={st.y} rot={st.rot} tally={60} glow={passion} />
    </Stage>
  );
};

/* ============ A11 黎明（156–165s）============ */
export const A11: React.FC<SceneProps> = ({t, sec}) => {
  const roll = span(t, 0.4, 3.4, easeIn);
  const st = stoneAt(lerp(TOP_U, 0, roll));
  const top = slopePoint(TOP_U + 40);
  const turn = t > 2.6;
  const q = win(t, 1.6, 9.2, 1.2, 1.0);
  const by = win(t, 3.0, 9.2, 1.0, 1.0);
  return (
    <Stage
      sec={sec}
      cam={{x: 1040, y: 430, z: 1}}
      trails={160}
      dawn={1}
      over={
        <g>
          <text x={W / 2} y={190} textAnchor="middle" fontFamily={FONTS.title} fontSize={58} letterSpacing={8} fill={P.text} opacity={q}>
            {ONSCREEN.final}
          </text>
          <text x={W / 2} y={252} textAnchor="middle" fontFamily={FONTS.title} fontSize={26} letterSpacing={6} fill={P.text} opacity={by * 0.75}>
            {ONSCREEN.finalBy}
          </text>
        </g>
      }
    >
      <Stone x={st.x} y={st.y} rot={st.rot} tally={60} />
      <Figure x={top.x} y={top.y} s={1.1} lean={0.02} facing={turn ? 1 : -1} headUp={turn ? 0.35 : -0.3} rim="#FFD8A0" />
    </Stage>
  );
};

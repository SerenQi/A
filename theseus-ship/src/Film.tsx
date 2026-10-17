import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {FONTS, FPS, H, ONSCREEN, PALETTE, STROKE, W} from './config';
import {HALF, LAST, PLANKS, Pt, sheer} from './lib/hull';
import {
  GROUND,
  SHIP_A,
  SHIP_B,
  SWAPS,
  SWAP_OF,
  bob,
  camera,
  cameraTransform,
  clamp01,
  easeInOut,
  lerp,
  newPiece,
  oldPiece,
  span,
  toScreen,
  toWorld,
  win,
  FIRST,
} from './lib/story';
import {Hole, PlankShape, ShipFrame} from './components/ShipParts';
import {Backdrop, Dust, Subtitles, Tag, TimeRuler} from './components/Overlay';
import {figurePath, figurePoints} from './components/Human';
import {MusicTrack} from './components/Music';
import {ensureFonts} from './lib/fonts';

ensureFonts();

const hash = (n: number) => {
  const s = Math.sin(n * 78.233 + 12.9898) * 43758.5453;
  return s - Math.floor(s);
};

// ---------- 亮度曲线 ----------
const aLevel = (s: number) => {
  if (s < 75) return 1;
  if (s < 93) return lerp(1, 0.35, span(s, 75.5, 77.5));
  if (s < 110) return lerp(0.35, 1, span(s, 100.8, 102));
  if (s < 128) return 1 - span(s, 110.8, 116.5);
  if (s < 149) return span(s, 131.5, 134.5) * (1 - 0.45 * span(s, 143, 145));
  return lerp(0.55, 1, span(s, 149, 151));
};
const bLevel = (s: number) => {
  if (s < 101) return 1;
  if (s < 110) return lerp(1, 0.3, span(s, 100.8, 102));
  return 0.3 * (1 - span(s, 110.8, 116.5));
};
/** A 船上非焦点部分的退暗（特写某块木板时） */
const focusA = (s: number) => 1 - 0.55 * win(s, 20.2, 31.6, 1.2, 1.6) - 0.6 * win(s, 51.6, 56.4, 0.8, 1.0);

// ---------- 人物（S09–S10），以 S09 镜头换算成世界坐标 ----------
const CAM_TWO = camera(100);
const FIG_H = 330 / CAM_TWO.z;
const ADULT = toWorld(CAM_TWO, 700, 770);
const YOUNG = toWorld(CAM_TWO, 1250, 770);
const STATES = [0.3, 0.55, 0.8, 1].map((age, i) => ({age, ...toWorld(CAM_TWO, 560 + i * 260, 770)}));
const ADULT_PTS = figurePoints(1, FIG_H);
const YOUNG_PTS = figurePoints(0.3, FIG_H);
const N_SRC = 380;
const SRC = Array.from({length: N_SRC}, (_, i) => {
  const p = PLANKS[i % PLANKS.length];
  const onA = Math.floor(i / PLANKS.length) % 2 === 0;
  const e = p.edge[(i * 5) % p.edge.length];
  return {onA, x: e[0], y: e[1]};
});

// 时间线（S08 / S10）
const TL = {y: SHIP_A.y + 112, x0: SHIP_A.x - 370, x1: SHIP_A.x + 370};
const tickX = (t: number) => lerp(TL.x0, TL.x1, (t - 31) / (57.2 - 31));

export const Film: React.FC = () => {
  const frame = useCurrentFrame();
  const s = frame / FPS;
  const cam = camera(s);
  const u = 1 / cam.z;

  // 开场显现
  const p1Level = span(s, 0.3, 1.8);
  const p1Grain = span(s, 1.4, 4.2);
  const restLevel = span(s, 3.4, 6.8);
  const outlineDraw = span(s, 3.6, 7.2);
  const innerDraw = span(s, 4.6, 8.0);

  const aL = aLevel(s);
  const bL = bLevel(s);
  const fA = focusA(s);
  const bobA = bob(s);

  // S08：两种直觉
  const phase1 = win(s, 93.4, 101.2, 1.0, 0.8);
  const phase2 = win(s, 101.2, 110.2, 1.0, 0.8);

  // S11：统一
  const boundaryOn0 = win(s, 151.4, 156.2, 0.6, 1.0);
  const endFill = s > 149 ? lerp(0.13, 0.05, span(s, 149, 151)) + 0.14 * boundaryOn0 : 0.13;
  const boundaryOn = win(s, 151.4, 156.2, 0.6, 1.0);
  const boundaryX = lerp(0, HALF + 40, span(s, 152.8, 155.2));

  const shipsPresent = 1 - span(s, 110.8, 114) + span(s, 131.5, 133.5);

  // ---------- A 船木板 ----------
  const planksA: React.ReactNode[] = [];
  const moving: React.ReactNode[] = [];
  const holes: React.ReactNode[] = [];
  const pile: React.ReactNode[] = [];
  const planksB: React.ReactNode[] = [];

  for (const p of PLANKS) {
    const sw = SWAP_OF[p.id];
    const isFirst = p.id === FIRST;
    const intro = isFirst ? p1Level : restLevel;
    const swapping = s >= sw.hl - 0.6 && s < sw.done + 0.8;
    const lvlA = aL * (swapping ? 1 : fA) * intro;
    const emphSwap = (SWAPS.indexOf(sw) < 5 || p.id === LAST ? 1 : 0.55) * win(s, sw.hl, sw.pile + 0.3, 0.5, 0.6);
    const emphIntro = isFirst ? 0.8 * (1 - span(s, 5.4, 7.6)) : 0;
    const emphS10 = p.id === LAST ? win(s, 133.6, 136.8, 0.7, 0.8) : 0;
    let tint: string | undefined;
    if (boundaryOn > 0.01) tint = p.cx < boundaryX ? PALETTE.oldWood : PALETTE.newWood;

    // 旧木板
    const op = oldPiece(p, s);
    const b = s >= 78 ? 1 : 0;
    if (s < sw.out) {
      planksA.push(
        <PlankShape key={`o${p.id}`} p={p} piece={op} material="old" u={u} level={lvlA} emphasis={Math.max(emphSwap, emphIntro)} grain={isFirst && s < 8 ? 0.85 : 0.45} grainDraw={isFirst && s < 4.3 ? p1Grain : undefined} />,
      );
    } else if (s < sw.pile) {
      moving.push(<PlankShape key={`o${p.id}`} p={p} piece={op} material="old" u={u} level={1} emphasis={emphSwap} />);
    } else {
      const inB = b && s >= 78.2;
      const toB = inB ? clamp01((s - 78.2) / 10) : 0;
      const lvl = s < 75 ? lerp(0.8, 0.45, span(s, 57, 60)) : s < 93 ? lerp(0.45, 0.9, span(s, 75, 77)) + 0.1 * toB : bL;
      const emph = phase1 * 0.35;
      (s < 78 ? pile : planksB).push(
        <PlankShape key={`o${p.id}`} p={p} piece={op} material="old" u={u} level={lvl} emphasis={emph} grain={0.45 + phase1 * 0.45} fillAlpha={0.13 + phase1 * 0.12} />,
      );
    }
    // 缺口
    holes.push(<Hole key={`h${p.id}`} p={p} x={SHIP_A.x + p.cx} y={SHIP_A.y + p.cy + bobA} u={u} level={win(s, sw.outEnd - 0.1, sw.slide + 0.3, 0.3, 0.4)} />);
    // 新木板
    const np = newPiece(p, s);
    if (np.opacity > 0) {
      const emphNew = (SWAPS.indexOf(sw) < 5 || p.id === LAST ? 1 : 0.55) * win(s, sw.inn, sw.done + 0.8, 0.4, 0.8);
      const node = (
        <PlankShape
          key={`n${p.id}`}
          p={p}
          piece={np}
          material="new"
          u={u}
          level={s < sw.done ? 1 : aL * fA}
          emphasis={Math.max(emphNew, emphS10)}
          tint={tint}
          fillAlpha={endFill}
          grain={s > 149 ? 0.3 : 0.45}
        />
      );
      (s < sw.done ? moving : planksA).push(node);
    }
  }

  // ---------- B 船结构 ----------
  const bInner = span(s, 85, 88.4);
  const bOutline = span(s, 87.4, 90.2);

  // ---------- 鬼影（S06）----------
  const ghost = win(s, 60.4, 68.6, 1.2, 1.8) * 0.9;
  const ghostOff = span(s, 62.6, 65.2);

  // ---------- 人物与粒子 ----------
  const human: React.ReactNode[] = [];
  if (s > 110.5 && s < 134) {
    const appear = span(s, 110.8, 112.2);
    const outlineOn = span(s, 116.4, 118) * (1 - span(s, 128.4, 129.4));
    const dotsOn = 1 - span(s, 128.4, 129.4);
    const dots: React.ReactNode[] = [];
    for (let i = 0; i < N_SRC; i++) {
      const src = SRC[i];
      const ship = src.onA ? SHIP_A : SHIP_B;
      const sx = ship.x + src.x;
      const sy = ship.y + src.y + (src.onA ? bob(110) : bob(110, 1.7));
      if (i >= ADULT_PTS.length) {
        const o = appear * (1 - span(s, 112.6, 114.6));
        if (o > 0.01) dots.push(<circle key={i} cx={sx} cy={sy} r={1.6 * u} fill={PALETTE.line} opacity={o * 0.6} />);
        continue;
      }
      const d = ((i % 50) / 50) * 1.6 + hash(i) * 0.4;
      const e = easeInOut((s - 112.6 - d) / 2.6);
      const t = ADULT_PTS[i];
      const tx = ADULT.x + t[0];
      const ty = ADULT.y + t[1];
      const mx = (sx + tx) / 2;
      const my = Math.min(sy, ty) - 60 - hash(i + 9) * 60;
      const x = (1 - e) * (1 - e) * sx + 2 * (1 - e) * e * mx + e * e * tx;
      const y = (1 - e) * (1 - e) * sy + 2 * (1 - e) * e * my + e * e * ty;
      const r = lerp(1.9, 1.3, span(s, 116, 118)) * u;
      dots.push(<circle key={i} cx={x} cy={y} r={r} fill={PALETTE.line} opacity={appear * dotsOn * lerp(0.85, 0.55, span(s, 116, 118))} />);
    }
    human.push(<g key="dots">{dots}</g>);

    // 成人轮廓
    if (outlineOn > 0.01) {
      const fp = figurePath(1, FIG_H);
      human.push(
        <g key="adult" transform={`translate(${ADULT.x},${ADULT.y})`} opacity={outlineOn} fill="none" stroke={PALETTE.line} strokeWidth={STROKE.main * 0.85 * u}>
          <path d={fp.d} strokeLinejoin="round" />
          <circle cx={fp.cx} cy={fp.cy} r={fp.r} />
        </g>,
      );
    }
    // 较早的同一个人：出现在右侧，再移来与现在重合
    const youngOn = span(s, 118.4, 120.6) * (1 - span(s, 126.2, 127.6));
    if (youngOn > 0.01) {
      const m = span(s, 121.6, 125.8);
      const age = lerp(0.3, 1, m);
      const px = lerp(YOUNG.x, ADULT.x, m);
      const py = lerp(YOUNG.y, ADULT.y, m);
      const pts = figurePoints(age, FIG_H);
      const fp = figurePath(age, FIG_H);
      human.push(
        <g key="young" transform={`translate(${px},${py})`} opacity={youngOn}>
          <path d={fp.d} fill="none" stroke={PALETTE.inner} strokeWidth={STROKE.inner * u} />
          <circle cx={fp.cx} cy={fp.cy} r={fp.r} fill="none" stroke={PALETTE.inner} strokeWidth={STROKE.inner * u} />
          {pts.map((q, i) => (i % 2 === 0 ? <circle key={i} cx={q[0]} cy={q[1]} r={1.2 * u} fill={PALETTE.newWood} opacity={0.7} /> : null))}
        </g>,
      );
      void YOUNG_PTS;
    }
    // S10：从现在的轮廓分出不同时间的几个状态，被一根细线串起
    const split = span(s, 128.6, 130.6);
    const statesOn = span(s, 128.4, 129.0) * (1 - span(s, 131.2, 132.8));
    if (statesOn > 0.01) {
      STATES.forEach((st, i) => {
        const age = lerp(1, st.age, split);
        const px = lerp(ADULT.x, st.x, split);
        const py = lerp(ADULT.y, st.y, split);
        const fp = figurePath(age, FIG_H);
        human.push(
          <g key={`st${i}`} transform={`translate(${px},${py})`} opacity={statesOn * (i === 3 ? 1 : 0.75)} fill="none" stroke={i === 3 ? PALETTE.line : PALETTE.newWood} strokeWidth={(i === 3 ? STROKE.main * 0.85 : STROKE.inner * 1.2) * u}>
            <path d={fp.d} strokeLinejoin="round" />
            <circle cx={fp.cx} cy={fp.cy} r={fp.r} />
          </g>,
        );
      });
    }
  }

  // ---------- 时间线（S08 / S10）及 S10 的“细线” ----------
  const tlOn = Math.max(win(s, 92.8, 110.4, 1.0, 0.8), span(s, 131.2, 133.6) * (1 - span(s, 148, 149.2)));
  const threadDraw = span(s, 129.4, 131.0);
  const contract = span(s, 131.0, 133.6);
  const travelS08 = span(s, 101.8, 108.2);
  const travelS10 = span(s, 140, 143.2);
  const tlHi = Math.max(phase2, win(s, 139.8, 143.6, 0.6, 0.8));
  const tlLevel = s < 128 ? lerp(0.6, 1, phase2) * (1 - 0.4 * phase1) : lerp(0.55, 1, win(s, 139.8, 143.6, 0.6, 0.8)) * (1 - 0.3 * span(s, 143.6, 145));
  const travel = s < 128 ? travelS08 : travelS10;

  // 细线：穿过每个状态的胸口，随后拉直、收进 A 船下方的时间线
  const chestPts: Pt[] = STATES.map((st) => {
    const fp = figurePath(st.age, FIG_H);
    return [st.x + fp.chest[0], st.y + fp.chest[1]];
  });
  const threadPts: Pt[] = [[chestPts[0][0] - 140, chestPts[0][1]], ...chestPts, [chestPts[3][0] + 140, chestPts[3][1]]];
  const tlPts: Pt[] = threadPts.map((_, i) => [lerp(TL.x0, TL.x1, i / (threadPts.length - 1)), TL.y]);
  const linePts: Pt[] = s > 128 ? threadPts.map((q, i) => [lerp(q[0], tlPts[i][0], contract), lerp(q[1], tlPts[i][1], contract)]) : tlPts;
  const lineOn = s > 128 ? Math.max(threadDraw * (1 - contract), tlOn) : tlOn;
  const lineDraw = s > 128 && s < 131 ? threadDraw : s < 128 ? span(s, 92.8, 94.6) : 1;

  // ---------- 标签 ----------
  const nameAnchor = toScreen(cam, SHIP_A.x + 300, SHIP_A.y + sheer(300) - 2 + bobA);
  const nameOn =
    win(s, 10.4, 75.6, 0.8, 0.8) * (1 - 0.6 * win(s, 20.2, 31.6, 1.0, 1.2) - 0.6 * win(s, 51.6, 56.4, 0.8, 0.8)) + win(s, 134, 149.2, 0.8, 0.8) * lerp(0.55, 1, win(s, 136.8, 139.9, 0.5, 0.6));
  const nameHi = win(s, 136.8, 139.9, 0.5, 0.6);

  const aKeel = toScreen(cam, SHIP_A.x, SHIP_A.y + 62 + bobA);
  const bKeel = toScreen(cam, SHIP_B.x, SHIP_B.y + 62);
  const abOn = win(s, 93.0, 110.4, 0.8, 0.8);
  const aTop = toScreen(cam, SHIP_A.x + 30, SHIP_A.y - 372);
  const bTop = toScreen(cam, SHIP_B.x + 30, SHIP_B.y - 372);
  const swing = -46 * phase1 + 46 * phase2 + Math.sin(s * 1.1) * 6;
  const origX = (aTop.x + bTop.x) / 2 + swing;
  const origY = 190;

  // ---------- 整体 ----------
  const warm = span(s, 150, 158);
  const fadeIn = span(s, 0, 0.8);
  const fadeOut = span(s, 162.6, 165);
  const rulerOn = win(s, 9.6, 48, 1.0, 1.2) * (1 - 0.6 * win(s, 20.2, 31.6, 1, 1.2));
  const rulerOffset = s < 34 ? s * 9 : s < 44 ? 34 * 9 + (s - 34) * 16 : 34 * 9 + 160 + (s - 44) * 40;

  return (
    <AbsoluteFill style={{background: PALETTE.bg}}>
      <Backdrop warm={warm} />
      <Dust sec={s} />
      <svg width={W} height={H} style={{position: 'absolute', inset: 0}}>
        <defs>
          <radialGradient id="warmGlow">
            <stop offset="0" stopColor={PALETTE.warm} stopOpacity="0.22" />
            <stop offset="0.5" stopColor={PALETTE.warm} stopOpacity="0.07" />
            <stop offset="1" stopColor={PALETTE.warm} stopOpacity="0" />
          </radialGradient>
        </defs>
        <g transform={cameraTransform(cam)}>
          {/* 结尾的暖光：小范围，在船后 */}
          {warm > 0 && <ellipse cx={SHIP_A.x} cy={GROUND - 40} rx={520} ry={260} fill="url(#warmGlow)" opacity={warm} />}
          {/* 水平线 */}
          <line x1={-3000} x2={4000} y1={GROUND} y2={GROUND} stroke={PALETTE.inner} strokeWidth={STROKE.inner * u} opacity={span(s, 3.8, 7.0) * (1 - span(s, 110.8, 114) * (1 - span(s, 131.5, 134))) * (s > 149 ? lerp(1, 1.6, warm) : 1)} />

          {/* 鬼影：原来那艘旧船的轮廓 */}
          {ghost > 0.01 && (
            <g opacity={ghost} transform={`translate(${-30 * ghostOff},${-16 * ghostOff})`}>
              <ShipFrame x={SHIP_A.x} y={SHIP_A.y + bobA} u={u} color={PALETTE.oldWood} level={1} />
              {PLANKS.map((p) => (
                <PlankShape key={p.id} p={p} piece={{x: SHIP_A.x + p.cx, y: SHIP_A.y + p.cy + bobA, rot: 0, sy: 1, scale: 1, opacity: 1}} material="old" u={u} fillAlpha={0.06} grain={0.35} />
              ))}
            </g>
          )}

          {/* A 船 */}
          <g opacity={s < 128 ? 1 : 1}>
            <ShipFrame x={SHIP_A.x} y={SHIP_A.y + bobA} u={u} level={aL * fA} outline={outlineDraw} inner={innerDraw} glow={phase2 * 0.6} />
            {holes}
            {planksA}
          </g>

          {/* B 船：先有零件，后有结构，最后是轮廓 */}
          {s > 84 && s < 118 && <ShipFrame x={SHIP_B.x} y={SHIP_B.y + bob(s, 1.7)} u={u} level={bL} inner={bInner} outline={bOutline} color={PALETTE.line} glow={phase1 * 0.6} />}
          {planksB}
          {pile}

          {/* 结尾：新旧边界最后一次可见 */}
          {boundaryOn > 0.01 && (
            <line x1={SHIP_A.x + boundaryX} x2={SHIP_A.x + boundaryX} y1={SHIP_A.y - 150} y2={SHIP_A.y + 150} stroke={PALETTE.accent} strokeWidth={STROKE.inner * u} strokeDasharray={`${4 * u} ${6 * u}`} opacity={boundaryOn * 0.8} />
          )}

          {/* 时间线 / 细线 */}
          {lineOn > 0.01 && (
            <g opacity={lineOn * tlLevel}>
              <path d={`M${linePts.map((q) => `${q[0].toFixed(1)},${q[1].toFixed(1)}`).join('L')}`} fill="none" stroke={PALETTE.line} strokeWidth={STROKE.inner * 1.2 * u} pathLength={1} strokeDasharray={1} strokeDashoffset={1 - lineDraw} />
              {(s < 128 || contract > 0.5) &&
                SWAPS.map((sw) => {
                  const x = tickX(sw.done);
                  const lit = travel > 0 && tickX(31) + (TL.x1 - TL.x0) * travel >= x ? 1 : 0;
                  return <line key={sw.id} x1={x} x2={x} y1={TL.y - 6} y2={TL.y + 6} stroke={lit && tlHi > 0.05 ? PALETTE.accent : PALETTE.inner} strokeWidth={STROKE.inner * u} opacity={s < 128 ? 1 : contract} />;
                })}
              {tlHi > 0.05 && travel > 0 && travel < 1 && (
                <>
                  <circle cx={lerp(TL.x0, TL.x1, travel)} cy={TL.y} r={9 * u} fill={PALETTE.accent} opacity={0.12 * tlHi} />
                  <circle cx={lerp(TL.x0, TL.x1, travel)} cy={TL.y} r={2.6 * u} fill={PALETTE.accent} opacity={tlHi} />
                </>
              )}
            </g>
          )}

          {/* 正在移动的木板总在最上层 */}
          {moving}

          {/* 水下部分略暗 */}
          <rect x={-3000} y={GROUND + 1} width={7000} height={900} fill={PALETTE.bg} opacity={0.42 * clamp01(shipsPresent)} />

          {human}
        </g>
      </svg>

      {/* —— 屏幕空间：标签、刻度、文字 —— */}
      <TimeRuler sec={s} opacity={rulerOn * 0.9} offset={rulerOffset} />
      <Tag ax={nameAnchor.x} ay={nameAnchor.y} lx={nameAnchor.x + 70} ly={nameAnchor.y - 92} text={ONSCREEN.shipName} opacity={nameOn} color={nameHi > 0.05 ? PALETTE.accent : PALETTE.line} />
      <Tag ax={bKeel.x} ay={bKeel.y} lx={bKeel.x} ly={bKeel.y + 70} text={`B  ${ONSCREEN.labelB}`} opacity={abOn * lerp(0.45, 1, phase1 + (1 - phase1 - phase2) * 0.6)} align="center" size={26} />
      <Tag ax={aKeel.x} ay={aKeel.y} lx={aKeel.x} ly={aKeel.y + 70} text={`A  ${ONSCREEN.labelA}`} opacity={abOn * lerp(0.45, 1, phase2 + (1 - phase1 - phase2) * 0.6)} align="center" size={26} />
      {abOn > 0.01 && (
        <>
          <svg width={W} height={H} style={{position: 'absolute', inset: 0, opacity: abOn * 0.5}}>
            <path d={`M${origX - 20},${origY + 14}L${bTop.x},${bTop.y - 10}`} stroke={PALETTE.inner} strokeWidth={0.8} strokeDasharray="3 5" opacity={0.4 + 0.6 * phase1} />
            <path d={`M${origX + 20},${origY + 14}L${aTop.x},${aTop.y - 10}`} stroke={PALETTE.inner} strokeWidth={0.8} strokeDasharray="3 5" opacity={0.4 + 0.6 * phase2} />
          </svg>
          <div style={{position: 'absolute', left: origX - 60, top: origY - 22, width: 120, textAlign: 'center', fontFamily: FONTS.title, fontSize: 30, letterSpacing: 6, color: PALETTE.line, opacity: abOn}}>{ONSCREEN.labelOriginal}</div>
        </>
      )}

      {/* 开场上方的小问题 */}
      <div style={{position: 'absolute', top: 112, width: W, textAlign: 'center', fontFamily: FONTS.title, fontSize: 30, letterSpacing: 6, color: PALETTE.line, opacity: win(s, 7.0, 9.8, 0.8, 0.8) * 0.85}}>{ONSCREEN.openingQuestion}</div>

      {/* 结尾标题与问题 */}
      <div style={{position: 'absolute', top: 112, width: W, textAlign: 'center', fontFamily: FONTS.title, fontSize: 30, letterSpacing: 14, color: PALETTE.line, opacity: win(s, 151, 163.4, 1.2, 1.0) * 0.8}}>{ONSCREEN.title}</div>
      <div style={{position: 'absolute', top: 800, width: W, textAlign: 'center', fontFamily: FONTS.title, fontSize: 52, fontWeight: 600, letterSpacing: 8, color: PALETTE.line, opacity: win(s, 157.4, 164.2, 1.0, 1.2)}}>{ONSCREEN.finalQuestion}</div>

      <Subtitles sec={s} />
      <AbsoluteFill style={{background: '#000', opacity: Math.max(1 - fadeIn, fadeOut), pointerEvents: 'none'}} />
      <MusicTrack />
    </AbsoluteFill>
  );
};

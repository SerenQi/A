import React from 'react';
import {FONTS, H, PALETTE as P, W} from '../config';
import {clamp01, easeIn, easeOut, hash, lerp, span, win} from '../lib/anim';
import {Atom, BOX, Box, Cat, Geiger, Hammer, MemeCard, Paper, Spotlight, Vial} from '../components/Things';
import {ParticleText} from '../components/ParticleText';
import {Cam, Dust, Label, Rays, SP, Stage, SuperCat} from './common';

/* ================= C1 标题：黑暗里一只木箱 ================= */
export const C1: React.FC<SP> = ({s}) => {
  // 灯泡打开时的闪烁
  const flick = s < 0.4 ? 0 : s < 0.75 ? (hash(Math.floor(s * 30)) > 0.4 ? 1 : 0.2) : 1;
  const z = lerp(0.92, 1.02, span(s, 0, 5.6));
  return (
    <Stage>
      <Cam z={z} cy={620}>
        <Spotlight x={W / 2} floor={900} w={820} o={flick} />
        <Dust x={W / 2} w={820} top={0} bottom={900} t={s} o={flick} />
        <g opacity={0.25 + 0.75 * flick}>
          <Box x={W / 2 - 50} y={900} s={0.82} glow={0.35 + 0.25 * Math.sin(s * 3)} />
        </g>
        {/* 箱缝里漏出的蓝光 */}
        <rect x={W / 2 - 50 - 230} y={900 - 0.82 * BOX.h - 2} width={460} height={4} fill={P.quantum} opacity={0.5 * flick} filter="url(#glow)" />
      </Cam>
    </Stage>
  );
};

/* ================= C2 口头禅：又死又活 → 三张卡片盖章 ================= */
export const CARD_POS = [
  {x: 470, y: 500, rot: -6, kind: 0 as const, land: 15.5, stamp: 16.2},
  {x: 960, y: 470, rot: 3, kind: 1 as const, land: 16.1, stamp: 16.9},
  {x: 1450, y: 500, rot: 7, kind: 2 as const, land: 16.7, stamp: 17.5},
];

export const C2: React.FC<SP> = ({s}) => {
  const cut = span(s, 8.7, 9.8);
  const away = span(s, 12.4, 14.0);
  const boxX = lerp(W / 2 - 50, W / 2 - 50, away);
  const boxS = lerp(1.05, 0.7, away);
  const boxY = lerp(900, 980, away);
  const boxO = 1 - 0.75 * span(s, 14.6, 15.6);
  const z = lerp(1.0, 1.08, span(s, 5, 12.4)) - 0.08 * away;
  return (
    <Stage>
      <Cam z={z} cy={600}>
        <Spotlight x={W / 2} floor={920} w={900} />
        <Dust x={W / 2} w={900} top={0} bottom={920} t={s} />
        <g opacity={boxO}>
          <Box x={boxX} y={boxY} s={boxS} cut={cut} glow={cut}>
            {cut > 0.01 && <SuperCat x={BOX.dx / 2} y={BOX.dy / 2 + 10} s={1.05} t={s} amt={1} o={cut} />}
          </Box>
        </g>
        {cut > 0.5 && (
          <g opacity={win(s, 9.4, 12.6, 0.4, 0.4)}>
            <Label x={boxX - 380} y={600} text="活" size={64} color={P.light} />
            <Label x={boxX + 470} y={600} text="死" size={64} color={P.quantum} />
          </g>
        )}
      </Cam>
      {CARD_POS.map((c, i) => {
        const fly = easeOut(clamp01((s - (c.land - 0.55)) / 0.55));
        if (fly <= 0) return null;
        const fromX = i === 0 ? -400 : i === 2 ? W + 400 : W / 2;
        const fromY = i === 1 ? -400 : c.y + 200;
        const bob = Math.sin(s * 1.4 + i) * 6;
        return (
          <MemeCard
            key={i}
            x={lerp(fromX, c.x, fly)}
            y={lerp(fromY, c.y, fly) + bob}
            rot={lerp(c.rot * 4, c.rot, fly)}
            kind={c.kind}
            stamp={clamp01((s - c.stamp) / 0.5)}
            s={1}
          />
        );
      })}
      {/* 盖章的冲击环 */}
      {CARD_POS.map((c, i) => {
        const d = s - c.stamp;
        if (d < 0 || d > 0.5) return null;
        return <circle key={i} cx={c.x + 70} cy={c.y + 60} r={40 + d * 500} fill="none" stroke={P.red} strokeWidth={6 * (1 - d * 2)} opacity={1 - d * 2} />;
      })}
    </Stage>
  );
};

/* ================= C3 最大的误读：卡片碎裂 → 1935 年的论文 ================= */
const SHATTER = 20.8;

export const C3: React.FC<SP> = ({s}) => {
  const d = s - SHATTER;
  const paperIn = span(s, 22.6, 24.2);
  const under = span(s, 26.9, 27.8);
  const z = lerp(1, 1.06, span(s, 24, 30.7));
  return (
    <Stage>
      <text x={W / 2} y={790} textAnchor="middle" fontFamily={FONTS.title} fontWeight={900} fontSize={560} fill={P.gold} opacity={0.07 * paperIn} letterSpacing={20}>
        1935
      </text>
      {d < 0 &&
        CARD_POS.map((c, i) => (
          <MemeCard key={i} x={c.x} y={c.y + Math.sin(s * 1.4 + i) * 6} rot={c.rot} kind={c.kind} stamp={1} />
        ))}
      {d >= 0 && d < 2.5 && (
        <g>
          <Rays cx={W / 2} cy={500} n={60} r0={120} r1={1500} o={Math.exp(-d * 4)} color={P.light} />
          {CARD_POS.map((c, ci) =>
            Array.from({length: 18}, (_, k) => {
              const i = ci * 31 + k;
              const ox = (hash(i) - 0.5) * 300;
              const oy = (hash(i + 1) - 0.5) * 200;
              const vx = ox * 1.6 + (hash(i + 2) - 0.5) * 360;
              const vy = oy * 1.6 - 260 - hash(i + 3) * 260;
              const x = c.x + ox + vx * d;
              const y = c.y + oy + vy * d + 420 * d * d;
              const r = 30 + hash(i + 4) * 60;
              const rot = (hash(i + 5) - 0.5) * 900 * d;
              return (
                <path
                  key={i}
                  d={`M${-r},${-r * 0.6} L${r * 0.8},${-r * 0.3} L${r * 0.1},${r * 0.7} Z`}
                  transform={`translate(${x},${y}) rotate(${rot})`}
                  fill={k % 5 === 0 ? P.red : P.paper}
                  opacity={clamp01(1 - d / 2.2)}
                />
              );
            }),
          )}
        </g>
      )}
      <Cam z={z} cy={560}>
        {paperIn > 0 && (
          <g transform={`translate(0,${lerp(900, 0, easeOut(paperIn))})`}>
            <Paper x={W / 2} y={540} rot={-2} s={0.84} />
            <g transform={`translate(${W / 2},540) rotate(-2) scale(0.84)`}>
              <line x1={-250} x2={250} y1={-262} y2={-262} stroke={P.red} strokeWidth={5} pathLength={1} strokeDasharray={1} strokeDashoffset={1 - under} />
            </g>
          </g>
        )}
      </Cam>
    </Stage>
  );
};

/* ================= C4 双缝：波纹 → 一看就变 → 叠加 ================= */
const GUN = {x: 300, y: 540};
const BARRIER_X = 860;
const SLITS = [470, 610];
const SCREEN_X = 1560;
const DETECT = 45.6;
const Y0 = 190;
const Y1 = 890;

const pdfWave = (y: number) => {
  const u = y - 540;
  return Math.pow(Math.cos((Math.PI * u) / 74), 2) * Math.exp(-Math.pow(u / 230, 2));
};
const pdfTwo = (y: number) => Math.exp(-Math.pow((y - 430) / 42, 2)) + Math.exp(-Math.pow((y - 650) / 42, 2));

const table = (pdf: (y: number) => number) => {
  const N = 700;
  const cum: number[] = [];
  let acc = 0;
  for (let i = 0; i < N; i++) {
    acc += pdf(Y0 + ((Y1 - Y0) * (i + 0.5)) / N);
    cum.push(acc);
  }
  return (u: number) => {
    const target = u * acc;
    let lo = 0;
    let hi = N - 1;
    while (lo < hi) {
      const mid = (lo + hi) >> 1;
      if (cum[mid] < target) lo = mid + 1;
      else hi = mid;
    }
    return Y0 + ((Y1 - Y0) * (lo + 0.5)) / N;
  };
};
const sampleWave = table(pdfWave);
const sampleTwo = table(pdfTwo);

const FLIGHT = 0.6;
const emitAt = (i: number) => (i < 8 ? 34.0 + i * 0.42 : 34.0 + 8 * 0.42 + (i - 8) * 0.022);
const N_E = 8 + Math.floor((51.5 - (34.0 + 8 * 0.42)) / 0.022);
const ELECTRONS = Array.from({length: N_E}, (_, i) => {
  const te = emitAt(i);
  const post = te + FLIGHT > DETECT + 0.25;
  const y = post ? sampleTwo(hash(i * 9.13)) : sampleWave(hash(i * 9.13));
  return {te, post, y, jx: (hash(i * 4.7) - 0.5) * 14, slit: y < 540 ? 0 : 1};
});

const curvePath = (pdf: (y: number) => number, scale: number) => {
  let d = '';
  for (let y = Y0; y <= Y1; y += 4) d += `${d ? 'L' : 'M'}${SCREEN_X + 46 + pdf(y) * scale},${y} `;
  return d;
};

export const C4: React.FC<SP> = ({s}) => {
  const setup = span(s, 30.2, 31.6);
  const det = span(s, DETECT - 0.5, DETECT);
  const after = clamp01((s - DETECT) / 0.5);
  const bohr = span(s, 51.6, 53.0);
  const appO = setup * (1 - 0.8 * bohr);
  const wavesO = win(s, 37.0, DETECT, 1.0, 0.05) * (s < DETECT ? 1 : 0);
  const flying = ELECTRONS.filter((e) => s >= e.te && s < e.te + FLIGHT);
  const landedPre = ELECTRONS.filter((e) => !e.post && s >= e.te + FLIGHT);
  const landedPost = ELECTRONS.filter((e) => e.post && s >= e.te + FLIGHT);
  const preFrac = landedPre.length / Math.max(1, ELECTRONS.filter((e) => !e.post).length);
  const postFrac = landedPost.length / Math.max(1, ELECTRONS.filter((e) => e.post).length);
  const z = lerp(1.0, 1.05, span(s, 30, 51));
  return (
    <Stage bg="#050608">
      <Cam z={z}>
        <g opacity={appO}>
          {/* 波纹（没人看的时候） */}
          <clipPath id="afterBarrier">
            <rect x={BARRIER_X} y={0} width={SCREEN_X - BARRIER_X} height={H} />
          </clipPath>
          <clipPath id="beforeBarrier">
            <rect x={GUN.x} y={0} width={BARRIER_X - GUN.x} height={H} />
          </clipPath>
          <g opacity={wavesO}>
            <g clipPath="url(#beforeBarrier)">
              {Array.from({length: 9}, (_, k) => {
                const r = ((s * 260 + k * 70) % 630) + 10;
                return <circle key={k} cx={GUN.x} cy={GUN.y} r={r} fill="none" stroke={P.quantum} strokeWidth={2} opacity={0.35 * (1 - r / 640)} />;
              })}
            </g>
            <g clipPath="url(#afterBarrier)">
              {SLITS.map((sy) =>
                Array.from({length: 11}, (_, k) => {
                  const r = ((s * 260 + k * 70) % 770) + 10;
                  return <circle key={`${sy}-${k}`} cx={BARRIER_X} cy={sy} r={r} fill="none" stroke={P.quantum} strokeWidth={2} opacity={0.4 * (1 - r / 780)} />;
                }),
              )}
            </g>
          </g>
          {/* 电子枪 */}
          <g>
            <rect x={150} y={505} width={170} height={70} rx={10} fill="#2A2D33" stroke="#5A5F68" strokeWidth={2} />
            <rect x={300} y={523} width={40} height={34} rx={4} fill="#3A3E46" />
            <circle cx={340} cy={540} r={10} fill={P.quantum} filter="url(#glow)" opacity={0.6 + 0.4 * Math.sin(s * 20)} />
          </g>
          {/* 挡板与双缝 */}
          <rect x={BARRIER_X - 10} y={Y0} width={20} height={SLITS[0] - 15 - Y0} fill="#6B6F78" />
          <rect x={BARRIER_X - 10} y={SLITS[0] + 15} width={20} height={SLITS[1] - SLITS[0] - 30} fill="#6B6F78" />
          <rect x={BARRIER_X - 10} y={SLITS[1] + 15} width={20} height={Y1 - SLITS[1] - 15} fill="#6B6F78" />
          {/* 屏幕 */}
          <rect x={SCREEN_X - 12} y={Y0} width={24} height={Y1 - Y0} fill="#111418" stroke="#3A3F48" strokeWidth={2} />
          {/* 落点 */}
          <g opacity={1 - after}>
            {landedPre.map((e, i) => (
              <circle key={i} cx={SCREEN_X + e.jx * 0.6} cy={e.y} r={2.6} fill={P.quantum} opacity={0.85} />
            ))}
          </g>
          <g>
            {landedPost.map((e, i) => (
              <circle key={i} cx={SCREEN_X + e.jx * 0.6} cy={e.y} r={2.6} fill={P.light} opacity={0.85} />
            ))}
          </g>
          {/* 强度曲线 */}
          {s > 37.3 && <path d={curvePath(pdfWave, 150 * Math.sqrt(preFrac))} fill="none" stroke={P.quantum} strokeWidth={3} opacity={(1 - after) * 0.9} filter="url(#glow)" />}
          {s > DETECT && <path d={curvePath(pdfTwo, 150 * Math.sqrt(postFrac))} fill="none" stroke={P.light} strokeWidth={3} opacity={0.9} filter="url(#glow)" />}
          {/* 飞行中的电子 */}
          {flying.map((e, i) => {
            const f = (s - e.te) / FLIGHT;
            if (f < 0.5) {
              const g = f / 0.5;
              const ty = e.post ? SLITS[e.slit] : GUN.y;
              return <circle key={i} cx={lerp(GUN.x + 40, BARRIER_X, g)} cy={lerp(GUN.y, ty, g)} r={6} fill={P.quantum} filter="url(#glow)" />;
            }
            const g = (f - 0.5) / 0.5;
            if (e.post) {
              return <circle key={i} cx={lerp(BARRIER_X, SCREEN_X, g)} cy={lerp(SLITS[e.slit], e.y, g)} r={6} fill={P.light} filter="url(#glow)" />;
            }
            // 没人看时：同时从两道缝出来
            return (
              <g key={i}>
                {SLITS.map((sy) => (
                  <circle key={sy} cx={lerp(BARRIER_X, SCREEN_X, g)} cy={lerp(sy, e.y, g)} r={5} fill={P.quantum} opacity={0.6} filter="url(#glow)" />
                ))}
              </g>
            );
          })}
          {/* 探测器：一只眼睛 */}
          {det > 0 && (
            <g opacity={det}>
              <path d={`M${BARRIER_X + 140},${300} L${BARRIER_X + 5},${SLITS[0] - 20} L${BARRIER_X + 5},${SLITS[1] + 20} Z`} fill={P.light} opacity={0.08 + 0.05 * Math.sin(s * 9)} />
              <g transform={`translate(${BARRIER_X + 150},300) scale(${lerp(1.6, 1, after)})`}>
                <path d="M-52,0 Q0,-38 52,0 Q0,38 -52,0 Z" fill={P.paper} stroke={P.light} strokeWidth={3} />
                <circle r={17} fill={P.red} />
                <circle r={7} fill="#000" />
              </g>
              <Label x={BARRIER_X + 150} y={250} text="探测器" color={P.red} />
            </g>
          )}
          {/* 标签 */}
          <g opacity={span(s, 33.9, 35)}>
            <Label x={235} y={480} text="电子枪" color={P.dim} />
            <Label x={BARRIER_X} y={160} text="双缝" color={P.dim} />
            <Label x={SCREEN_X} y={160} text="屏幕" color={P.dim} />
          </g>
        </g>
        {/* 叠加：一团同时在很多地方的电子 */}
        {bohr > 0 && (
          <g opacity={bohr}>
            <circle cx={W / 2} cy={440} r={300} fill="url(#qglow)" opacity={0.35} />
            {Array.from({length: 46}, (_, i) => {
              const a = hash(i) * Math.PI * 2;
              const r = 30 + hash(i + 1) * 220;
              const on = hash(i * 3 + Math.floor(s * 10)) > 0.45;
              return <circle key={i} cx={W / 2 + Math.cos(a + s * 0.3) * r} cy={440 + Math.sin(a + s * 0.3) * r * 0.75} r={on ? 7 : 4} fill={P.quantum} opacity={on ? 0.95 : 0.25} filter="url(#glow)" />;
            })}
            <Label x={W / 2} y={150} text="玻尔 · 哥本哈根" size={30} color={P.gold} o={span(s, 52.2, 53)} />
            <ParticleText text="叠加" x={W / 2} y={790} size={150} font={FONTS.title} weight={900} p={span(s, 55.1, 56.6)} out={span(s, 57.6, 58.6)} color={P.quantum} step={5} seed={3} />
          </g>
        )}
      </Cam>
    </Stage>
  );
};

/* ================= C5 盒子里的实验：演示 → 倒带 → 叠加 → 相当滑稽 ================= */
const BX = 900;
const BY = 880;
const BS = 1.22;
const DEMO = 68.8;
const REWIND = [71.3, 71.9];

export const C5: React.FC<SP> = ({s}) => {
  const boxIn = span(s, 58.0, 59.6);
  const cut = span(s, 63.9, 65.0);
  const labels = win(s, 64.4, 71.3, 0.6, 0.4);
  const inDemo = s >= DEMO && s < REWIND[0];
  const rewinding = s >= REWIND[0] && s < REWIND[1];
  const sup = span(s, REWIND[1], REWIND[1] + 0.6);
  const decay = inDemo ? 1 : 0;
  const hammerA = inDemo ? lerp(18, 92, easeIn(clamp01((s - (DEMO + 0.1)) / 0.12))) : rewinding ? lerp(92, 18, span(s, REWIND[0], REWIND[1])) : 18;
  const broken = inDemo && s > DEMO + 0.22 ? clamp01((s - DEMO - 0.22) / 1.4) + 0.5 : 0;
  const dead = inDemo && s > DEMO + 0.9;
  const zoomCat = span(s, 75.2, 76.5);
  const paper = span(s, 79.2, 80.0);
  const z = lerp(1, 2.0, zoomCat) - 0.25 * paper * zoomCat;
  const catX = BX + 190 * BS;
  const catY = BY - 10 * BS;
  const tape = rewinding ? 1 : 0;
  return (
    <Stage bg="#060607">
      <text x={W / 2} y={720} textAnchor="middle" fontFamily={FONTS.title} fontWeight={900} fontSize={520} fill={P.gold} opacity={0.06 * span(s, 60.9, 62)} letterSpacing={20}>
        1935
      </text>
      <Cam z={z} cx={lerp(W / 2, catX, zoomCat)} cy={lerp(H / 2, catY - 90, zoomCat)}>
        <Spotlight x={BX + 40} floor={BY + 20} w={1000} o={boxIn} />
        <g transform={`translate(0,${lerp(500, 0, easeOut(boxIn))})`} opacity={boxIn}>
          <Box x={BX} y={BY} s={BS} cut={cut} glow={sup}>
            {cut > 0.01 && (
              <g opacity={cut}>
                <Atom x={-180} y={-250} r={20} decay={decay} flicker={sup > 0.5 ? 1 : 0} t={s} />
                <Geiger x={-180} y={-60} on={inDemo && s > DEMO + 0.05 ? 1 : sup > 0.5 && Math.sin(s * 40) > 0 ? 1 : 0} />
                <line x1={-130} y1={-90} x2={-75} y2={-40} stroke="#55585E" strokeWidth={4} />
                {sup > 0.5 ? (
                  <g>
                    <g opacity={0.55}>
                      <Hammer x={-70} y={-30} angle={18} />
                    </g>
                    <g opacity={0.55}>
                      <Hammer x={-70} y={-30} angle={92} />
                    </g>
                    <g opacity={Math.sin(s * 40) > 0 ? 0.9 : 0.4}>
                      <Vial x={70} y={0} broken={0} />
                    </g>
                    <g opacity={Math.sin(s * 40) > 0 ? 0.4 : 0.9}>
                      <Vial x={70} y={0} broken={1} />
                    </g>
                  </g>
                ) : (
                  <g>
                    <Hammer x={-70} y={-30} angle={hammerA} />
                    <Vial x={70} y={0} broken={broken} />
                  </g>
                )}
                {sup > 0.5 ? <SuperCat x={190} y={-10} s={0.78} t={s} amt={1} /> : <Cat x={190} y={-10} s={0.78} pose={dead ? 'lie' : 'sit'} rim={P.light} />}
              </g>
            )}
          </Box>
          {/* 标签 */}
          <g opacity={labels * cut}>
            <Label x={BX - 180 * BS} y={BY - 330 * BS} text="放射性原子" color={P.quantum} size={24} />
            <Label x={BX - 440} y={BY - 70} text="盖革计数器" color={P.dim} size={24} anchor="end" />
            <Label x={BX - 40} y={BY - 230 * BS} text="锤子" color={P.dim} size={24} />
            <Label x={BX + 70 * BS} y={BY - 150 * BS} text="毒气瓶" color="#7BE0B0" size={24} />
          </g>
          {sup > 0.5 && (
            <g opacity={win(s, REWIND[1] + 0.3, 75.3, 0.4, 0.4)}>
              <Label x={BX - 180 * BS - 90} y={BY - 300 * BS} text="衰变" color={P.red} size={30} />
              <Label x={BX - 180 * BS + 90} y={BY - 300 * BS} text="没衰变" color={P.quantum} size={30} />
            </g>
          )}
        </g>
      </Cam>
      {/* 1 小时 · 50% */}
      <g opacity={win(s, 64.6, 75.2, 0.6, 0.4) * (1 - zoomCat)}>
        <circle cx={1620} cy={300} r={74} fill="none" stroke="#2A2C30" strokeWidth={12} />
        <circle cx={1620} cy={300} r={74} fill="none" stroke={P.gold} strokeWidth={12} pathLength={1} strokeDasharray={`${0.5 * span(s, 64.6, 66.4)} 1`} transform="rotate(-90 1620 300)" />
        <text x={1620} y={316} textAnchor="middle" fontFamily={FONTS.title} fontWeight={900} fontSize={44} fill={P.text}>
          50%
        </text>
        <Label x={1620} y={420} text="1 小时 · 50%" color={P.gold} size={26} />
      </g>
      {/* 倒带：扫描线 */}
      {tape > 0 && (
        <g>
          {Array.from({length: 14}, (_, i) => (
            <rect key={i} x={0} y={(hash(i + Math.floor(s * 30)) * H) | 0} width={W} height={2 + hash(i) * 8} fill={P.light} opacity={0.18} />
          ))}
          <text x={120} y={180} fontFamily={FONTS.sans} fontSize={60} fill={P.light} opacity={0.8}>
            ◀◀
          </text>
        </g>
      )}
      {/* 叠加时的红青错位滤色 */}
      {sup > 0.5 && zoomCat > 0.3 && <rect width={W} height={H} fill={P.quantum} opacity={0.04 + 0.04 * Math.sin(s * 30)} />}
      {/* 论文：相当滑稽 */}
      {paper > 0 && (
        <g transform={`translate(${lerp(1100, 0, easeOut(paper))},0)`}>
          <rect width={W} height={H} fill="#000" opacity={0.55 * paper} />
          <Paper x={1300} y={540} rot={4} s={0.92} circle={span(s, 79.6, 80.0)} stamp={clamp01((s - 80.0) / 0.5)} />
        </g>
      )}
    </Stage>
  );
};

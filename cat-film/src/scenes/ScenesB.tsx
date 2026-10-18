import React from 'react';
import {FONTS, H, PALETTE as P, W} from '../config';
import {clamp01, easeIn, easeInOut, easeOut, hash, lerp, span, win} from '../lib/anim';
import {BOX, Box, Cat, Envelope, MemeCard, Spotlight} from '../components/Things';
import {ParticleText} from '../components/ParticleText';
import {Cam, Dust, Label, Rays, SP, Stage, Stars, SuperCat} from './common';

/* ================= C6 通信与误用：牛津 ⇄ 普林斯顿 → 满屏的猫 ================= */
const OX = {x: 430, y: 560};
const PR = {x: 1490, y: 560};

const arcPt = (f: number, dir: number) => {
  const a = dir > 0 ? OX : PR;
  const b = dir > 0 ? PR : OX;
  const x = lerp(a.x, b.x, f);
  const y = lerp(a.y, b.y, f) - Math.sin(f * Math.PI) * 300;
  return {x, y};
};

export const C6: React.FC<SP> = ({s}) => {
  const mapO = 1 - span(s, 91.6, 92.6);
  const crack = span(s, 88.8, 90.4);
  const solo = win(s, 92.0, 94.6, 0.6, 0.05);
  const grid = span(s, 94.3, 96.0, easeOut);
  const gridO = s >= 94.3 ? 1 - 0.65 * span(s, 100.4, 101.4) : 0;
  const strike = span(s, 101.0, 101.7);
  return (
    <Stage bg="#07080A">
      {mapO > 0 && (
        <g opacity={mapO}>
          {/* 经纬线 */}
          {Array.from({length: 9}, (_, i) => (
            <path key={i} d={`M0,${180 + i * 90} Q${W / 2},${140 + i * 90 - 40} ${W},${180 + i * 90}`} fill="none" stroke={P.dim} strokeWidth={1} opacity={0.12} />
          ))}
          <path d={`M${OX.x},${OX.y} Q${W / 2},${OX.y - 600} ${PR.x},${PR.y}`} fill="none" stroke={P.gold} strokeWidth={2} strokeDasharray="6 12" opacity={0.5 * span(s, 84.3, 85.3)} />
          {[OX, PR].map((c, i) => (
            <g key={i} opacity={span(s, 84.2 + i * 0.4, 85 + i * 0.4)}>
              <circle cx={c.x} cy={c.y} r={60} fill="url(#pool)" />
              <circle cx={c.x} cy={c.y} r={10} fill={P.gold} filter="url(#glow)" />
              <text x={c.x} y={c.y + 70} textAnchor="middle" fontFamily={FONTS.title} fontWeight={900} fontSize={52} fill={P.text}>
                {i === 0 ? '薛定谔' : '爱因斯坦'}
              </text>
              <Label x={c.x} y={c.y + 116} text={i === 0 ? '牛津' : '普林斯顿'} color={P.dim} size={26} />
            </g>
          ))}
          <text x={W / 2} y={190} textAnchor="middle" fontFamily={FONTS.title} fontWeight={900} fontSize={64} fill={P.gold} opacity={0.8 * span(s, 84.6, 85.6)} letterSpacing={12}>
            1935
          </text>
          {Array.from({length: 7}, (_, k) => {
            const t0 = 85.0 + k * 0.95;
            const f = (s - t0) / 1.1;
            if (f < 0 || f > 1) return null;
            const dir = k % 2 === 0 ? 1 : -1;
            const p = arcPt(easeInOut(f), dir);
            return <Envelope key={k} x={p.x} y={p.y} rot={Math.sin(f * 6) * 12 * dir} s={0.8} o={win(f, 0, 1, 0.1, 0.1)} />;
          })}
          {/* 量子理论上的裂缝 */}
          <g opacity={span(s, 88.3, 88.9)} transform={`translate(${W / 2},700)`}>
            <rect x={-200} y={-56} width={400} height={112} fill="none" stroke={P.text} strokeWidth={3} />
            <text y={22} textAnchor="middle" fontFamily={FONTS.title} fontWeight={900} fontSize={60} fill={P.text} letterSpacing={10}>
              量子理论
            </text>
            <path
              d="M-30,-70 L-4,-24 L-30,6 L10,34 L-6,70"
              fill="none"
              stroke={P.red}
              strokeWidth={6}
              pathLength={1}
              strokeDasharray={1}
              strokeDashoffset={1 - crack}
              filter="url(#glow)"
            />
            <Label x={0} y={120} text="漏洞" color={P.red} o={crack} size={28} />
          </g>
        </g>
      )}
      {/* 一只猫 */}
      {solo > 0 && (
        <g opacity={solo}>
          <Spotlight x={W / 2} floor={720} w={420} />
          <Cat x={W / 2} y={720} s={1.1} rim={P.light} />
        </g>
      )}
      {/* 满屏的猫：成了代言人 */}
      {s >= 94.3 && (
        <g opacity={gridO}>
          {Array.from({length: 7 * 15}, (_, i) => {
            const col = i % 15;
            const row = Math.floor(i / 15);
            const x = 64 + col * 128;
            const y = 200 + row * 104;
            const dist = Math.hypot(x - W / 2, y - H / 2) / 1100;
            const g = clamp01((grid - dist * 0.8) / 0.25);
            if (g <= 0) return null;
            const pose = hash(i + Math.floor(s * 3 + hash(i) * 3)) > 0.5 ? 'sit' : 'lie';
            const tint = [P.quantum, P.red, P.light, P.gold][Math.floor(hash(i * 2.3) * 4)];
            return <Cat key={i} x={x} y={y + 20} s={0.38 * easeOut(g)} pose={pose} color="#0B0B0C" rim={tint} />;
          })}
        </g>
      )}
      {s >= 97.7 && (
        <g opacity={win(s, 97.7, 103.7, 0.4, 0.5)}>
          <rect x={W / 2 - 400} y={380} width={800} height={150} fill="#000" opacity={0.7} />
          <text x={W / 2} y={490} textAnchor="middle" fontFamily={FONTS.title} fontWeight={900} fontSize={96} fill={P.text} letterSpacing={8}>
            “又死又活”
          </text>
          <line x1={W / 2 - 360} x2={lerp(W / 2 - 360, W / 2 + 360, strike)} y1={462} y2={448} stroke={P.red} strokeWidth={12} strokeLinecap="round" />
        </g>
      )}
    </Stage>
  );
};

/* ================= C7 退相干 → 多世界 ================= */
const CB = {x: W / 2 - 40, y: 860, s: 1.1};
const STORM = [110.9, 121.5];

export const C7: React.FC<SP> = ({s}) => {
  const amt = 1 - span(s, 117.1, 121.4);
  const split = span(s, 126.9, 127.6, easeOut);
  const catX = CB.x + (BOX.dx / 2) * CB.s;
  const catY = CB.y + (BOX.dy / 2 + 10) * CB.s;
  const hitY = catY - 100;
  const rate = lerp(6, 40, span(s, STORM[0], STORM[1]));
  const showStorm = s >= STORM[0] && s < STORM[1] + 0.6;
  const z = lerp(1, 1.12, span(s, 110.9, 121.5)) - 0.12 * span(s, 121.5, 122.5);
  return (
    <Stage bg="#050608">
      {split < 1 && (
        <g opacity={1 - split}>
          <Cam z={z} cy={catY - 120}>
            <Spotlight x={W / 2} floor={880} w={900} />
            <Dust x={W / 2} w={900} top={0} bottom={880} t={s} />
            <Box x={CB.x} y={CB.y} s={CB.s} cut={1} glow={0.3 + 0.7 * amt}>
              <SuperCat x={BOX.dx / 2} y={BOX.dy / 2 + 10} s={1.05} t={s} amt={amt} pose="sit" />
            </Box>
            {/* 粒子风暴：空气分子、热辐射，每一次碰撞都是一次“测量” */}
            {showStorm &&
              Array.from({length: 160}, (_, k) => {
                const period = 1.2;
                const phase = hash(k * 1.7) * period;
                const cyc = Math.floor((s - STORM[0] + phase) / period);
                const f = ((s - STORM[0] + phase) % period) / period;
                const live = hash(k + cyc * 13) < rate / 34;
                if (!live || s > STORM[1]) return null;
                const a = hash(k * 3 + cyc) * Math.PI * 2;
                const r0 = 1100;
                const fx = easeIn(f);
                const x = catX + Math.cos(a) * r0 * (1 - fx);
                const y = hitY + Math.sin(a) * r0 * 0.6 * (1 - fx);
                const thermal = k % 6 === 0;
                return thermal ? (
                  <path key={k} d={`M${x},${y} q10,-10 20,0 t20,0 t20,0`} stroke={P.red} strokeWidth={3} fill="none" opacity={0.8} transform={`rotate(${(a * 180) / Math.PI + 180} ${x} ${y})`} />
                ) : (
                  <circle key={k} cx={x} cy={y} r={5} fill={P.light} opacity={0.85} />
                );
              })}
            {showStorm &&
              Array.from({length: 20}, (_, k) => {
                const period = 0.5;
                const ph = hash(k * 5.3) * period;
                const f = ((s - STORM[0] + ph) % period) / period;
                if (s < 117.1) return null;
                const ang = hash(k + Math.floor((s - STORM[0] + ph) / period)) * Math.PI * 2;
                const x = catX + Math.cos(ang) * 70;
                const y = hitY + Math.sin(ang) * 90;
                return <circle key={`h${k}`} cx={x} cy={y} r={8 + f * 46} fill="none" stroke={P.gold} strokeWidth={3 * (1 - f)} opacity={1 - f} />;
              })}
          </Cam>
          <g opacity={win(s, 113.3, 121.4, 0.6, 0.6)}>
            <Label x={300} y={330} text="空气分子" color={P.light} size={30} />
            <Label x={1620} y={360} text="热辐射" color={P.red} size={30} />
          </g>
          <g opacity={win(s, 117.1, 121.4, 0.4, 0.5)}>
            <Label x={W / 2} y={200} text="测量 · 测量 · 测量" color={P.gold} size={34} />
          </g>
          <ParticleText text="退相干" x={W / 2} y={230} size={150} font={FONTS.title} weight={900} p={span(s, 107.8, 109.4)} out={span(s, 110.6, 111.8)} color={P.quantum} step={5} seed={7} />
        </g>
      )}
      {/* 多世界：一分为二 */}
      {s >= 126.4 && (
        <g>
          <Stars t={s} o={span(s, 126.9, 128)} />
          {[0, 1].map((side) => {
            const dx = (side === 0 ? -1 : 1) * 70 * split;
            return (
              <g key={side} transform={`translate(${dx},0)`} opacity={span(s, 126.9, 127.3)}>
                <clipPath id={`half${side}`}>
                  <rect x={side === 0 ? 0 : W / 2} y={0} width={W / 2} height={H} />
                </clipPath>
                <g clipPath={`url(#half${side})`}>
                  <rect x={side === 0 ? 0 : W / 2} width={W / 2} height={H} fill={side === 0 ? '#1A1008' : '#060D16'} opacity={0.85} />
                  <Stars t={s + side * 3} n={80} tint={side === 0 ? P.gold : P.quantum} />
                  <Spotlight x={side === 0 ? W / 4 : (W * 3) / 4} floor={820} w={520} />
                  <Cat x={side === 0 ? W / 4 : (W * 3) / 4 + 30} y={820} s={1.15} pose={side === 0 ? 'sit' : 'lie'} rim={side === 0 ? P.gold : P.quantum} />
                  <text x={side === 0 ? W / 4 : (W * 3) / 4} y={270} textAnchor="middle" fontFamily={FONTS.title} fontWeight={900} fontSize={72} fill={side === 0 ? P.gold : P.quantum} letterSpacing={10}>
                    {side === 0 ? '宇宙 A' : '宇宙 B'}
                  </text>
                  <Label x={side === 0 ? W / 4 : (W * 3) / 4} y={340} text={side === 0 ? '活' : '死'} size={40} color={P.text} />
                </g>
              </g>
            );
          })}
          <rect x={W / 2 - 3} y={0} width={6} height={H} fill={P.light} filter="url(#glow)" opacity={Math.max(0.3, 1 - split)} />
          {split < 0.5 && <Rays cx={W / 2} cy={H / 2} n={40} r0={40} r1={1200} o={1 - split * 2} color={P.light} />}
          <g opacity={span(s, 129.8, 130.6)}>
            <Label x={W / 2} y={160} text="至今没有结束" color={P.dim} size={28} />
          </g>
        </g>
      )}
    </Stage>
  );
};

/* ================= C8 回到口头禅：答案早就在那里 ================= */
const CARDS8 = [
  {x: 620, y: 480, rot: -4, kind: 0 as const, open: 144.0, tag: '已判卷'},
  {x: 1300, y: 480, rot: 4, kind: 1 as const, open: 145.4, tag: '已回复'},
];

export const C8: React.FC<SP> = ({s}) => {
  const watched = win(s, 139.3, 143.8, 0.8, 0.6);
  const z = lerp(1, 1.06, span(s, 132, 152));
  return (
    <Stage bg="#08080A">
      <Cam z={z}>
        <Rays cx={W / 2} cy={480} n={60} r0={500} r1={1500} o={0.25 * watched} color={P.gold} rot={s * 0.05} width={2} />
        {CARDS8.map((c, i) => {
          const enter = easeOut(clamp01((s - 132.4 - i * 0.3) / 0.7));
          const flip = clamp01((s - c.open) / 0.45);
          const coverScale = Math.cos(Math.min(flip, 0.5) * Math.PI);
          const showFace = flip >= 0.5;
          const faceScale = showFace ? Math.sin((flip - 0.5) * Math.PI) : 0;
          const y = lerp(c.y + 400, c.y, enter);
          return (
            <g key={i} opacity={enter}>
              {showFace ? (
                <g transform={`translate(${c.x},${y}) scale(${faceScale},1) translate(${-c.x},${-y})`}>
                  <MemeCard x={c.x} y={y} rot={c.rot} kind={c.kind} reveal={1} s={1.3} />
                </g>
              ) : (
                <g transform={`translate(${c.x},${y}) rotate(${c.rot}) scale(${1.3 * coverScale},1.3)`} filter="url(#shadow)">
                  <rect x={-170} y={-120} width={340} height={240} rx={16} fill="#1E1F24" stroke="#3A3C44" strokeWidth={2} />
                  <text y={40} textAnchor="middle" fontFamily={FONTS.title} fontWeight={900} fontSize={120} fill={P.dim} opacity={0.6}>
                    ?
                  </text>
                  <text y={96} textAnchor="middle" fontFamily={FONTS.sans} fontSize={22} fill={P.dim} letterSpacing={4}>
                    未打开
                  </text>
                </g>
              )}
              {showFace && (
                <g opacity={clamp01((s - c.open - 0.5) / 0.4)}>
                  <Label x={c.x} y={y + 230} text={`${c.tag} · 早已决定`} color={P.red} size={28} />
                </g>
              )}
            </g>
          );
        })}
        {/* 世界一遍遍“看”过：从四周射向卡片的光点 */}
        {watched > 0 &&
          Array.from({length: 70}, (_, k) => {
            const period = 0.9;
            const ph = hash(k * 2.9) * period;
            const f = ((s - 139.3 + ph) % period) / period;
            const cyc = Math.floor((s - 139.3 + ph) / period);
            const tgt = CARDS8[(k + cyc) % 2];
            const a = hash(k * 7 + cyc) * Math.PI * 2;
            const r = 1000 * (1 - easeIn(f));
            return <circle key={k} cx={tgt.x + Math.cos(a) * r} cy={tgt.y + Math.sin(a) * r * 0.6} r={4} fill={P.gold} opacity={watched * 0.8} />;
          })}
      </Cam>
    </Stage>
  );
};

/* ================= C9 不敢打开盒子的人 ================= */
const OPEN = 161.4;

const Hand: React.FC<{x: number; y: number; o?: number}> = ({x, y, o = 1}) => (
  <g transform={`translate(${x},${y})`} opacity={o}>
    <path d="M-46,-900 L46,-900 L52,-150 L-52,-150 Z" fill="#050505" stroke="#2A2620" strokeWidth={2} />
    <path d="M-62,-170 C-70,-110 -64,-60 -40,-30 L44,-30 C68,-60 72,-110 62,-170 Z" fill="#050505" stroke={P.light} strokeOpacity={0.35} strokeWidth={2} />
    {[-46, -18, 10, 38].map((fx, i) => (
      <rect key={i} x={fx - 11} y={-46} width={22} height={60 + (i === 1 || i === 2 ? 14 : 0)} rx={11} fill="#050505" stroke={P.light} strokeOpacity={0.35} strokeWidth={2} />
    ))}
    <rect x={56} y={-130} width={22} height={70} rx={11} transform="rotate(-24 66 -95)" fill="#050505" stroke={P.light} strokeOpacity={0.35} strokeWidth={2} />
  </g>
);

export const C9: React.FC<SP> = ({s}) => {
  const lid = span(s, OPEN, OPEN + 0.5, easeOut);
  const burst = clamp01((s - OPEN) / 0.6);
  const handIn = span(s, 152.4, 155.0);
  const tremble = Math.sin(s * 37) * 3 + Math.sin(s * 23) * 2;
  const handBack = span(s, 158.5, 160.5);
  const handY = lerp(-200, 380, handIn) - 160 * handBack + (s > OPEN - 0.6 ? 0 : 0) + tremble;
  const endO = span(s, OPEN + 0.5, OPEN + 1.4);
  const z = lerp(1, 1.1, span(s, 152, OPEN)) + 0.15 * easeIn(burst);
  const bx = W / 2 - 50;
  const by = 900;
  return (
    <Stage>
      <Cam z={z} cy={640}>
        <Spotlight x={W / 2} floor={920} w={760} />
        <Dust x={W / 2} w={760} top={0} bottom={920} t={s} />
        <Box x={bx} y={by} s={0.95} lid={lid} glow={0.3 + burst} />
        {lid > 0 && (
          <g>
            <Rays cx={bx + 50} cy={by - 0.95 * BOX.h - 40} n={70} r0={40} r1={1600} o={burst * (1 - 0.6 * endO)} color={P.light} width={5} />
            <ellipse cx={bx + 50} cy={by - 0.95 * BOX.h - 30} rx={300 * burst} ry={60 * burst} fill={P.light} opacity={0.8 * (1 - 0.5 * endO)} filter="url(#soft)" />
          </g>
        )}
        {s < OPEN + 0.2 && <Hand x={bx + 40} y={handY} o={1 - clamp01((s - OPEN) / 0.2)} />}
      </Cam>
      {endO > 0 && (
        <g opacity={endO}>
          <rect width={W} height={H} fill="#000" opacity={0.45} />
          <text x={W / 2} y={530} textAnchor="middle" fontFamily={FONTS.title} fontWeight={900} fontSize={140} fill={P.text} letterSpacing={18}>
            薛定谔的猫
          </text>
          <text x={W / 2} y={620} textAnchor="middle" fontFamily={FONTS.title} fontSize={36} fill={P.dim} letterSpacing={6}>
            —— 埃尔温·薛定谔，1935
          </text>
        </g>
      )}
    </Stage>
  );
};

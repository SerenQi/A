import React from 'react';
import {FONTS, H, PALETTE as P, W} from '../config';
import {clamp01, easeInOut, easeOut, hash, lerp, span, win} from '../lib/anim';
import {Bubble, Cam, Motes, Orbit, SP, Stage, Txt} from '../components/Kit';
import {DotShape, SHAPES} from '../components/Dots';
import {Lying, WindowRoom} from './ScenesA';

/* ================= R5 实验：两组人，八分钟 ================= */
const GROUP_Y = 640;
const groupXs = (cx: number) => [-250, -150, -50, 50, 150, 250].map((d) => cx + d);

const Curve: React.FC<{x0: number; w: number; y: number; dir: number; p: number; color: string}> = ({x0, w, y, dir, p, color}) => {
  const pts: string[] = [];
  const n = 40;
  for (let i = 0; i <= n * p; i++) {
    const f = i / n;
    const yy = y - dir * 110 * easeInOut(f) + Math.sin(f * 17) * 6;
    pts.push(`${x0 + f * w},${yy}`);
  }
  if (pts.length < 2) return null;
  const last = pts[pts.length - 1].split(',').map(Number);
  return (
    <g>
      <line x1={x0} x2={x0 + w} y1={y} y2={y} stroke={P.dim} strokeWidth={1} strokeDasharray="4 8" opacity={0.6} />
      <polyline points={pts.join(' ')} fill="none" stroke={color} strokeWidth={4} filter="url(#glow)" />
      <circle cx={last[0]} cy={last[1]} r={7} fill={color} filter="url(#glow)" />
    </g>
  );
};

export const R5: React.FC<SP> = ({s}) => {
  const L = 480;
  const R = 1440;
  const people = span(s, 42.0, 43.0);
  const leftThink = span(s, 48.9, 49.8);
  const rightThink = span(s, 52.3, 53.2);
  const timerP = clamp01((s - 48.9) / (57.0 - 48.9));
  const secs = Math.round(timerP * 480);
  const timer = `${Math.floor(secs / 60)}:${String(secs % 60).padStart(2, '0')}`;
  const result = span(s, 57.3, 63.4, (x) => x);
  const leftSlump = 0.5 + 0.5 * span(s, 57.3, 59.5);
  const rightSlump = 0.5 - 0.5 * span(s, 60.3, 62.5);
  const solve = span(s, 65.9, 67.6);
  const curvesO = 1 - span(s, 63.6, 64.4);
  return (
    <Stage>
      <Motes t={s} n={40} o={0.6} />
      <line x1={W / 2} y1={160} x2={W / 2} y2={880} stroke={P.faint} strokeWidth={2} opacity={people} />
      {/* 计时器 */}
      <g opacity={span(s, 48.6, 49.2) * (1 - span(s, 63.6, 64.4))}>
        <circle cx={W / 2} cy={190} r={58} fill="#0C0E14" stroke={P.faint} strokeWidth={6} />
        <circle cx={W / 2} cy={190} r={58} fill="none" stroke={P.gold} strokeWidth={6} pathLength={1} strokeDasharray={`${timerP} 1`} transform={`rotate(-90 ${W / 2} 190)`} />
        <Txt x={W / 2} y={203} text={timer} size={34} color={P.text} weight={600} />
      </g>
      {/* 两组人 */}
      {[L, R].map((cx, gi) => (
        <g key={gi} opacity={people}>
          {groupXs(cx).map((x, i) => (
            <DotShape
              key={i}
              d={(gi === 0 ? leftSlump : rightSlump) > 0.4 ? SHAPES.slump : SHAPES.person}
              x={x}
              y={GROUP_Y + (i % 2) * 20}
              scale={0.55}
              step={6}
              t={s}
              seed={gi * 10 + i}
              p={span(s, 42.0 + i * 0.1, 43.4 + i * 0.1)}
              color={gi === 0 ? (result > 0.2 ? P.cold : P.dim) : result > 0.5 ? P.gold : P.dim}
            />
          ))}
        </g>
      ))}
      {/* 左：绕着自己转 */}
      {leftThink > 0 && (
        <g opacity={leftThink * (1 - solve)}>
          <Txt x={L} y={300} text="想自己" size={40} color={P.red} font={FONTS.title} weight={600} spacing={8} />
          {groupXs(L).map((x, i) => (
            <Orbit key={i} cx={x} cy={GROUP_Y - 150 - (i % 2) * 0} rx={34} ry={10} t={s + i * 0.17} speed={1.2} color={P.red} r={4} trail={14} ring={0.3} />
          ))}
          <ellipse cx={L} cy={GROUP_Y - 210} rx={300} ry={40} fill="#3A3F4A" opacity={0.35 * span(s, 50, 57)} filter="url(#soft)" />
        </g>
      )}
      {/* 右：想些不相干的画面 */}
      {rightThink > 0 && (
        <g opacity={rightThink * (1 - solve)}>
          <Txt x={R} y={300} text="想别的" size={40} color={P.green} font={FONTS.title} weight={600} spacing={8} />
          {Array.from({length: 12}, (_, i) => {
            const x = R - 300 + hash(i) * 600 + Math.sin(s * 0.6 + i) * 20;
            const y = 380 + hash(i + 2) * 80 + Math.cos(s * 0.5 + i) * 10;
            const k = i % 3;
            const c = [P.green, P.ice, P.gold][k];
            return k === 0 ? (
              <circle key={i} cx={x} cy={y} r={12} fill="none" stroke={c} strokeWidth={2.5} opacity={0.8} />
            ) : k === 1 ? (
              <path key={i} d={`M${x - 26},${y + 6} q8,-18 20,-8 q10,-14 24,0 q12,0 8,8 Z`} fill="none" stroke={c} strokeWidth={2.5} opacity={0.8} />
            ) : (
              <path key={i} d={`M${x},${y - 14} L${x + 14},${y + 10} L${x - 14},${y + 10} Z`} fill="none" stroke={c} strokeWidth={2.5} opacity={0.8} />
            );
          })}
        </g>
      )}
      {/* 心情曲线 */}
      {result > 0 && curvesO > 0 && (
        <g opacity={curvesO}>
          <Txt x={L - 330} y={770} text="心情" size={24} color={P.dim} anchor="start" />
          <Curve x0={L - 330} w={660} y={830} dir={-1} p={span(s, 57.3, 59.6)} color={P.cold} />
          <Txt x={R - 330} y={770} text="心情" size={24} color={P.dim} anchor="start" o={span(s, 60.3, 60.8)} />
          {s > 60.3 && <Curve x0={R - 330} w={660} y={830} dir={1} p={span(s, 60.3, 62.6)} color={P.green} />}
        </g>
      )}
      {/* 解决难题：办法的质量 */}
      {solve > 0 && (
        <g opacity={solve}>
          {[L, R].map((cx, gi) =>
            [0, 1, 2].map((k) => {
              const full = gi === 0 ? [0.42, 0.3, 0.36][k] : [0.82, 0.74, 0.9][k];
              const grow = span(s, 66.2 + k * 0.25, 67.6 + k * 0.25);
              const y = 250 + k * 56;
              return (
                <g key={`${gi}-${k}`}>
                  <rect x={cx - 280} y={y} width={560} height={30} rx={6} fill="#14161D" />
                  <rect x={cx - 280} y={y} width={560 * full * grow} height={30} rx={6} fill={gi === 0 ? P.cold : P.gold} opacity={0.85} />
                </g>
              );
            }),
          )}
          <Txt x={L - 280} y={232} text="办法" size={24} color={P.dim} anchor="start" />
          <Txt x={R - 280} y={232} text="办法" size={24} color={P.dim} anchor="start" />
        </g>
      )}
    </Stage>
  );
};

/* ================= R6 长得太像思考 ================= */
const pathPt = (f: number, y0: number, curl: number, s: number) => {
  // 前半段两条线完全一样，后半段反刍那条卷成一个圈
  const x = 280 + f * 1360;
  const wob = Math.sin(f * 9) * 26;
  if (curl <= 0 || f < 0.45) return {x, y: y0 + wob};
  return {x, y: y0 + wob};
};

export const R6: React.FC<SP> = ({s}) => {
  const draw = span(s, 76.7, 78.6, (x) => x);
  const loopIn = span(s, 78.2, 79.4);
  const zoom = span(s, 88.6, 90.0);
  const y1 = 380;
  const y2 = 680;
  const loopC = {x: 280 + 0.45 * 1360 + 140, y: y2 - 10};
  const loopA = s * 2.2;
  const thinkPts: string[] = [];
  for (let i = 0; i <= 60 * draw; i++) {
    const p = pathPt(i / 60, y1, 0, s);
    thinkPts.push(`${p.x},${p.y}`);
  }
  const rumPts: string[] = [];
  const stop = Math.min(draw, 0.45);
  for (let i = 0; i <= 60 * stop; i++) {
    const p = pathPt(i / 60, y2, 0, s);
    rumPts.push(`${p.x},${p.y}`);
  }
  const headThink = thinkPts.length ? thinkPts[thinkPts.length - 1].split(',').map(Number) : [280, y1];
  return (
    <Stage>
      <Motes t={s} n={50} />
      <g opacity={win(s, 73.4, 76.8, 0.5, 0.6)}>
        <Orbit cx={W / 2} cy={480} rx={220} ry={180} t={s} speed={0.45} color={P.red} r={10} ring={0.3} />
        <Txt x={W / 2} y={500} text="?" size={90} color={P.text} o={0.85} font={FONTS.title} weight={900} />
      </g>
      <Cam z={lerp(1, 2.1, easeInOut(zoom))} cx={lerp(W / 2, loopC.x, zoom)} cy={lerp(H / 2, loopC.y, zoom)}>
        <g opacity={span(s, 76.4, 77.0)}>
          <Txt x={240} y={y1 + 10} text="思考" size={34} color={P.gold} anchor="end" font={FONTS.title} weight={600} o={1 - zoom} />
          <Txt x={240} y={y2 + 10} text="反刍" size={34} color={P.red} anchor="end" font={FONTS.title} weight={600} o={1 - zoom} />
          {thinkPts.length > 1 && <polyline points={thinkPts.join(' ')} fill="none" stroke={P.gold} strokeWidth={5} filter="url(#glow)" opacity={1 - zoom} />}
          {draw > 0 && <circle cx={headThink[0]} cy={headThink[1]} r={10} fill={P.ember} filter="url(#glow)" opacity={1 - zoom} />}
          {rumPts.length > 1 && <polyline points={rumPts.join(' ')} fill="none" stroke={P.red} strokeWidth={5} filter="url(#glow)" />}
          {/* 下一步 */}
          <g opacity={span(s, 85.7, 86.4) * (1 - zoom)}>
            <rect x={1660} y={y1 - 40} width={190} height={80} rx={12} fill="#1A1610" stroke={P.gold} strokeWidth={3} />
            <Txt x={1755} y={y1 + 12} text="下一步" size={32} color={P.ember} weight={600} />
            <rect x={1660} y={y2 - 40} width={190} height={80} rx={12} fill="none" stroke={P.red} strokeWidth={3} strokeDasharray="10 10" opacity={0.7} />
            <Txt x={1755} y={y2 + 12} text="下一步" size={32} color={P.red} weight={600} o={0.3} />
          </g>
        </g>
        {/* 反刍的圈 */}
        {loopIn > 0 && (
          <g opacity={loopIn}>
            {Array.from({length: Math.min(14, Math.floor(Math.max(0, s - 79.4) * 1.4))}, (_, k) => (
              <ellipse key={k} cx={loopC.x} cy={loopC.y} rx={140 + (k % 3)} ry={120 + (k % 2)} fill="none" stroke={P.red} strokeWidth={1.5} opacity={0.2} />
            ))}
            <Orbit cx={loopC.x} cy={loopC.y} rx={140} ry={120} t={s * (1 + zoom * 1.5)} speed={0.35} color={P.red} r={10} trail={30} ring={0.4} />
            {[
              {text: '为什么是我？', t0: 79.9},
              {text: '要是当时……', t0: 82.7},
            ].map((q, i) => {
              const a = loopA + i * Math.PI;
              const o = span(s, q.t0, q.t0 + 0.5) * (1 - zoom);
              return <Bubble key={i} x={loopC.x + Math.cos(a) * 140} y={loopC.y + Math.sin(a) * 120 - 70} w={230} h={54} text={q.text} size={24} dark o={o} tail="none" />;
            })}
          </g>
        )}
      </Cam>
    </Stage>
  );
};

/* ================= R7 出口 ================= */
export const R7: React.FC<SP> = ({s}) => {
  const split = span(s, 101.8, 102.8);
  const sink = span(s, 102.1, 105.4, (x) => x);
  const road = span(s, 105.7, 108.6, (x) => x);
  const compare = span(s, 109.5, 110.4);
  const walk = span(s, 124.6, 125.6);
  const topO = 1 - walk;
  const LX = 520;
  const RX0 = 1060;
  const roadY = 600;
  const swallow = clamp01((s - 121.7) / 1.6);
  return (
    <Stage>
      <Motes t={s} n={50} />
      {topO > 0 && (
        <g opacity={topO}>
          {/* 一开始的那个圈 */}
          <g opacity={1 - split}>
            <Orbit cx={W / 2} cy={480} rx={180} ry={150} t={s} speed={0.4} color={P.red} r={10} />
          </g>
          {split > 0 && compare < 1 && (
            <g opacity={split * (1 - compare)}>
              {/* 左：问“为什么”，往下沉 */}
              <Txt x={LX} y={200} text="为什么" size={44} color={P.cold} font={FONTS.title} weight={600} spacing={8} />
              {Array.from({length: 7}, (_, k) => {
                const yy = 330 + k * 70 * sink;
                return <ellipse key={k} cx={LX} cy={yy} rx={170 - k * 12} ry={42 - k * 3} fill="none" stroke={P.cold} strokeWidth={2.5} opacity={(0.7 - k * 0.08) * (k === 0 ? 1 : sink)} />;
              })}
              {(() => {
                const a = s * 2.4;
                const depth = sink * 6 * ((s * 0.4) % 1);
                const k = Math.floor(depth);
                return <circle cx={LX + Math.cos(a) * (170 - k * 12)} cy={330 + depth * 70 * sink + Math.sin(a) * (42 - k * 3)} r={10} fill={P.ice} filter="url(#glow)" />;
              })()}
              <rect x={LX - 260} y={600} width={520} height={300} fill="url(#coldPool)" opacity={0.5 * sink} />
              {/* 右：问“怎么做”，往前走 */}
              <Txt x={RX0 + 380} y={200} text="怎么做" size={44} color={P.gold} font={FONTS.title} weight={600} spacing={8} o={span(s, 105.7, 106.3)} />
              {road > 0 && (
                <g>
                  <line x1={RX0} y1={roadY} x2={RX0 + 760 * road} y2={roadY - 220 * road} stroke={P.gold} strokeWidth={5} filter="url(#glow)" />
                  {[0.2, 0.4, 0.6, 0.8].map((f, i) =>
                    road > f ? <circle key={i} cx={RX0 + 760 * f} cy={roadY - 220 * f} r={9} fill={P.ember} filter="url(#glow)" /> : null,
                  )}
                  <circle cx={RX0 + 760 * road} cy={roadY - 220 * road} r={12} fill={P.ember} filter="url(#bigglow)" />
                </g>
              )}
            </g>
          )}
          {/* 同一句话，两种想法 */}
          {compare > 0 && (
            <g opacity={compare}>
              <rect x={0} y={0} width={W} height={H} fill={P.bg} opacity={0.55} />
              {(() => {
                const a = s * 2;
                const o1 = span(s, 111.9, 112.4);
                return (
                  <g opacity={o1}>
                    <Orbit cx={LX} cy={500} rx={210} ry={70} t={s} speed={0.32} color={P.cold} r={9} />
                    <Bubble x={LX + Math.cos(a) * 30} y={420} w={300} h={64} text="我怎么这么蠢。" size={28} dark tail="none" />
                  </g>
                );
              })()}
              {(() => {
                const o2 = span(s, 114.9, 115.4);
                const move = span(s, 115.2, 118.0);
                const bx = lerp(RX0 + 200, RX0 + 520, move);
                return (
                  <g opacity={o2}>
                    <line x1={RX0} y1={560} x2={RX0 + 760} y2={560} stroke={P.gold} strokeWidth={4} opacity={0.6} />
                    <Bubble x={bx} y={470} w={420} h={64} text="明天发条消息，解释一下。" size={26} tail="none" />
                    <g transform={`translate(${bx + 240},470)`} opacity={span(s, 116.8, 117.3)}>
                      <circle r={22} fill={P.green} />
                      <path d="M-10,0 L-3,8 L11,-8" stroke="#0A1A10" strokeWidth={4} fill="none" />
                    </g>
                  </g>
                );
              })()}
              {/* 一口草：一个一直嚼，一个咽下去 */}
              {s > 118.3 && (
                <g opacity={span(s, 118.3, 118.8)}>
                  <circle cx={LX + Math.cos(s * 4) * 120} cy={680 + Math.sin(s * 4) * 30} r={12} fill={P.green} filter="url(#glow)" />
                  <ellipse cx={LX} cy={680} rx={120} ry={30} fill="none" stroke={P.green} strokeWidth={2} opacity={0.4} />
                  {s > 121.7 ? (
                    <g>
                      <circle cx={lerp(RX0 + 200, RX0 + 760, easeOut(swallow))} cy={680} r={12 * (1 - swallow)} fill={P.green} filter="url(#glow)" />
                      <circle cx={RX0 + 760} cy={680} r={20 + swallow * 80} fill="none" stroke={P.green} strokeWidth={3 * (1 - swallow)} opacity={swallow > 0.6 ? (1 - swallow) * 2.5 : 0} />
                    </g>
                  ) : (
                    <circle cx={RX0 + 200} cy={680} r={12} fill={P.green} filter="url(#glow)" />
                  )}
                  <line x1={RX0 + 200} y1={680} x2={RX0 + 760} y2={680} stroke={P.green} strokeWidth={2} strokeDasharray="6 10" opacity={0.4} />
                </g>
              )}
            </g>
          )}
        </g>
      )}
      {/* 起身，走一圈 */}
      {walk > 0 && (
        <g opacity={walk}>
          <line x1={0} y1={760} x2={W} y2={760} stroke={P.faint} strokeWidth={3} />
          {(() => {
            const t = Math.max(0, s - 125.6);
            const stand = span(s, 125.0, 126.4);
            const x = 520 + t * 120;
            const ring = 1 - span(s, 127.6, 131.0);
            return (
              <g>
                <DotShape d={stand > 0.5 ? SHAPES.person : SHAPES.slump} x={x} y={760 - (stand > 0.9 ? Math.abs(Math.sin(t * 6)) * 6 : 0)} scale={1.1} step={7} t={s} seed={30} color={P.gold} />
                {/* 头顶那个圈，边走边散 */}
                {Array.from({length: 26}, (_, i) => {
                  const a = (i / 26) * Math.PI * 2 + s * 2;
                  const fly = (1 - ring) * (60 + hash(i) * 260);
                  return (
                    <circle
                      key={i}
                      cx={x + Math.cos(a) * (70 + fly)}
                      cy={760 - 330 + Math.sin(a) * (22 + fly * 0.4) - fly * 0.5}
                      r={4}
                      fill={P.red}
                      opacity={0.3 + 0.6 * ring}
                    />
                  );
                })}
              </g>
            );
          })()}
          {[0, 1, 2, 3, 4, 5, 6, 7].map((k) => {
            const fx = 560 + k * 90;
            const appear = span(s, 126.2 + k * 0.6, 126.6 + k * 0.6);
            return <ellipse key={k} cx={fx} cy={770 + (k % 2) * 8} rx={14} ry={5} fill={P.gold} opacity={0.35 * appear} />;
          })}
        </g>
      )}
    </Stage>
  );
};

/* ================= R8 凌晨三点，再来一次 ================= */
export const R8: React.FC<SP> = ({s}) => {
  const bubble = span(s, 133.0, 133.8);
  const pause = span(s, 136.7, 137.6);
  const unroll = span(s, 139.7, 142.4);
  const clockP = clamp01((s - 143.4) / 5.0);
  const mins = Math.round(lerp(3 * 60, 7 * 60, easeInOut(clockP)));
  const clock = `${String(Math.floor(mins / 60)).padStart(2, '0')}:${String(mins % 60).padStart(2, '0')}`;
  const dawn = span(s, 143.4, 150);
  const endText = span(s, 145.0, 146.6);
  const z = lerp(1.12, 1.0, span(s, 132.4, 140)) - 0.06 * span(s, 143, 160);
  const speed = 0.6 * (1 - pause);
  return (
    <Stage>
      <Cam z={z} cx={800} cy={600}>
        <WindowRoom t={s} clock={clock} dawn={dawn}>
          <Lying t={s} x={560} y={840} />
          {/* 那句话又冒出来，然后被拉直成一条通向窗的路 */}
          <g opacity={bubble * (1 - unroll)}>
            <Orbit cx={590} cy={640} rx={170} ry={44} t={133 + (s - 133) * (speed + 0.0001)} speed={1} color={P.gold} r={7} ring={0.2} />
          </g>
          {unroll > 0 && (
            <g>
              <path d={`M590,640 Q900,${640 - 220 * unroll} ${lerp(590, 1250, unroll)},${lerp(640, 360, unroll)}`} fill="none" stroke={P.gold} strokeWidth={5} filter="url(#glow)" opacity={1 - 0.5 * dawn} />
              <circle cx={lerp(590, 1250, unroll)} cy={lerp(640, 360, unroll)} r={11} fill={P.ember} filter="url(#bigglow)" />
            </g>
          )}
        </WindowRoom>
      </Cam>
      <rect width={W} height={H} fill={P.ember} opacity={0.06 * dawn} />
      {endText > 0 && (
        <g opacity={endText}>
          <rect width={W} height={H} fill="#000" opacity={0.5} />
          <Txt x={720} y={450} text="把“为什么”，" size={92} color={P.text} font={FONTS.title} weight={900} spacing={8} />
          <Txt x={720} y={590} text="换成“接下来”。" size={92} color={P.ember} font={FONTS.title} weight={900} spacing={8} glow />
        </g>
      )}
    </Stage>
  );
};

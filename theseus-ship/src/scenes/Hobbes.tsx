import React from 'react';
import {AbsoluteFill, Easing, interpolate, random, spring, useCurrentFrame, useVideoConfig} from 'remotion';
import {Dust, Flash, Orb, Sea, Sky, Sparks} from '../components/Atmos';
import {Ship} from '../components/Ship';
import {GoldText, Subtitles, Tracking} from '../components/Text';
import {BRUSH, C, H, SERIF, W} from '../lib/theme';
import {clamp01, prog} from '../lib/math';
import {PLANKS, PLANK_COUNT} from '../lib/ship';
import {CUES} from '../script';

const SEA_Y = 650;
const S = 0.56;
const BX = 1420;

/** B 船每块旧木板飞来的时间 */
const arrive = (id: number) => 140 + (id / PLANK_COUNT) * 200 + random(`ba${id}`) * 40;

export const Hobbes: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const slide = prog(frame, 120, 200, Easing.inOut(Easing.cubic));
  const ax = interpolate(slide, [0, 1], [W / 2, 500]);
  const bob = (k: number) => Math.sin(frame / 20 + k) * 4;
  const frame2 = prog(frame, 330, 390); // B 船的桅杆与帆
  const labels = prog(frame, 400, 440);
  const hiA = frame > 560 ? Math.max(0, Math.sin((frame - 560) / 18)) : 0;
  const hiB = frame > 560 ? Math.max(0, -Math.sin((frame - 560) / 18)) : 0;
  const divider = prog(frame, 395, 430, Easing.out(Easing.cubic));
  const qs = spring({frame: frame - 560, fps, config: {damping: 10}});

  const lookA = () => ({fresh: 1, glow: hiA * 0.5});
  const lookB = (p: (typeof PLANKS)[number]) => {
    const t0 = arrive(p.id);
    const t = clamp01((frame - t0) / 34);
    const e = Easing.out(Easing.cubic)(t);
    const sx = (random(`bsx${p.id}`) - 0.3) * 1800;
    const sy = 700 + random(`bsy${p.id}`) * 300;
    const glowLand = frame > t0 + 34 ? Math.exp(-(frame - t0 - 34) / 10) : 0;
    return {
      wear: 0.75,
      dx: (1 - e) * sx,
      dy: (1 - e) * sy,
      rot: (1 - e) * (random(`br${p.id}`) - 0.5) * 360,
      opacity: t > 0 ? 1 : 0,
      heat: Math.max((1 - e) * 0.8, glowLand * 0.6),
      glow: hiB * 0.5,
    };
  };

  return (
    <AbsoluteFill>
      <Sky kind="night" stars={160} />
      <Orb x={W / 2} y={190} r={40} color="#dfe8ff" glow={0.7} />
      <svg width={W} height={H} style={{position: 'absolute'}}>
        <g transform={`translate(${ax},${SEA_Y - 50 * S + bob(0)}) scale(${S})`} style={{filter: hiA > 0.05 ? `drop-shadow(0 0 ${30 * hiA}px rgba(255,220,140,0.9))` : undefined}}>
          <Ship look={lookA} frame={frame} billow={0.3} oars={false} />
        </g>
        <g transform={`translate(${BX},${SEA_Y - 50 * S + bob(2)}) scale(${S})`} style={{filter: hiB > 0.05 ? `drop-shadow(0 0 ${30 * hiB}px rgba(255,140,80,0.9))` : undefined}}>
          <g opacity={frame2}>
            <Ship look={() => ({opacity: 0})} frame={frame} billow={0.3} oars={false} tint="ghost" />
          </g>
          <Ship look={lookB} frame={frame} bare />
        </g>
      </svg>
      <Sea y={SEA_Y} colors={['#0d2238', '#0a1b2e', '#071524', '#040d18']} glint="#cfe0ff" amp={5} speed={0.6} />
      {/* 落位的火花 */}
      {PLANKS.map((p) => {
        const t0 = arrive(p.id) + 34;
        if (frame < t0 - 1 || frame > t0 + 26) return null;
        return <Sparks key={p.id} x={BX + p.cx * S} y={SEA_Y - 50 * S + p.cy * S} start={t0} count={10} power={90} dur={24} seed={`hb${p.id}`} color={C.ember} />;
      })}
      <Flash at={340} peak={0.25} />

      {/* 中线 */}
      <AbsoluteFill style={{pointerEvents: 'none'}}>
        <div
          style={{
            position: 'absolute',
            left: W / 2 + 10 - 1,
            top: 140 + (1 - divider) * 400,
            width: 2,
            height: 640 * divider,
            background: `linear-gradient(180deg, transparent, ${C.goldHot}, transparent)`,
            boxShadow: `0 0 20px ${C.gold}`,
          }}
        />
      </AbsoluteFill>
      {/* 标签 */}
      {[
        {x: 500, tag: 'A', text: '一直被修补的船', col: C.goldHot, hi: hiA},
        {x: BX, tag: 'B', text: '用旧木板拼成的船', col: C.ember, hi: hiB},
      ].map((l, i) => (
        <div
          key={l.tag}
          style={{
            position: 'absolute',
            left: l.x - 260,
            top: 730,
            width: 520,
            textAlign: 'center',
            opacity: prog(frame, 400 + i * 12, 440 + i * 12) * labels,
            transform: `translateY(${(1 - prog(frame, 400 + i * 12, 440 + i * 12)) * 30}px) scale(${1 + l.hi * 0.08})`,
          }}
        >
          <div style={{fontFamily: SERIF, fontWeight: 900, fontSize: 64, color: l.col, textShadow: `0 0 ${20 + l.hi * 30}px ${l.col}`}}>{l.tag}</div>
          <div style={{fontFamily: SERIF, fontSize: 30, color: C.ivory, letterSpacing: 6}}>{l.text}</div>
        </div>
      ))}
      {/* 问号 */}
      {frame > 555 && (
        <div style={{position: 'absolute', left: W / 2 + 10 - 80, top: 300, width: 160, textAlign: 'center', transform: `scale(${qs}) translateY(${Math.sin(frame / 15) * 8}px)`}}>
          <GoldText size={170} font={BRUSH} shine={prog(frame, 570, 620)}>
            ？
          </GoldText>
        </div>
      )}
      <AbsoluteFill style={{top: 70, opacity: 1 - prog(frame, 380, 400)}}>
        <Tracking text="1655 · 托马斯·霍布斯《论物体》" start={10} size={30} from={30} to={10} color={C.gold} />
      </AbsoluteFill>
      <Dust count={30} seed="hob" color="#cfe0ff" opacity={0.5} />
      <Subtitles cues={CUES.hobbes} />
    </AbsoluteFill>
  );
};

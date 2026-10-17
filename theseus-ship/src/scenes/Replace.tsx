import React from 'react';
import {AbsoluteFill, Easing, interpolate, useCurrentFrame} from 'remotion';
import {Dust, Flash, Rays, Shockwave, Sky, Sparks} from '../components/Atmos';
import {Ship} from '../components/Ship';
import {Subtitles} from '../components/Text';
import {C, H, SERIF, W} from '../lib/theme';
import {clamp01, prog} from '../lib/math';
import {FIRST_PLANK, LAST_PLANK, PLANKS, PLANK_COUNT, REPLACE_ORDER, bottomY} from '../lib/ship';
import {SLOTS, plankLook} from '../lib/replace';
import {CUES} from '../script';

const SX = W / 2;
const SY = 450;
const SS = 1.05;
const GROUND = 650;

const world = (x: number, y: number) => ({x: SX + x * SS, y: SY + y * SS});

// 旧木堆（左侧地面）
const PILE_X = 70;
const pileSlot = (i: number) => ({x: PILE_X + (i % 3) * 82 + ((Math.floor(i / 3) % 2) * 22), y: GROUND - 16 - Math.floor(i / 3) * 15});

/** 镜头：缩放 s，把世界坐标 (fx, fy) 放到屏幕中心附近 */
const useCamera = (frame: number) => {
  const p0 = PLANKS[FIRST_PLANK];
  const pl = PLANKS[LAST_PLANK];
  const a = world(p0.cx, p0.cy);
  const b = world(pl.cx, pl.cy);
  const c = {x: W / 2, y: 470};
  const z1 = prog(frame, 160, 210) - prog(frame, 290, 345);
  const z2 = prog(frame, 765, 860, Easing.inOut(Easing.cubic)) - prog(frame, 930, 1010, Easing.inOut(Easing.cubic));
  const s = 1 + 0.03 * prog(frame, 0, 150) + z1 * 0.65 + z2 * 1.5 - 0.07 * prog(frame, 930, 1050);
  const fx = c.x + (a.x - c.x) * z1 + (b.x - c.x) * z2;
  const fy = c.y + (a.y - c.y) * z1 + (b.y - c.y) * z2;
  const shakeT = frame - 912;
  const shake = shakeT >= 0 && shakeT < 20 ? Math.sin(shakeT * 2.7) * 14 * (1 - shakeT / 20) : 0;
  return {s, fx, fy, shake};
};

const Hud: React.FC<{frame: number}> = ({frame}) => {
  const remaining = SLOTS.filter((s) => frame < s.det).length;
  const year = Math.max(1, Math.round(interpolate(frame, [0, 150, 345, 755, 912, 1170], [1, 6, 9, 240, 300, 302], {extrapolateRight: 'clamp'})));
  const appear = prog(frame, 10, 40);
  const ratio = remaining / PLANK_COUNT;
  const zero = remaining === 0;
  const bump = frame >= 912 && frame < 940 ? 1 + 0.3 * (1 - (frame - 912) / 28) : 1;
  return (
    <AbsoluteFill style={{opacity: appear, fontFamily: SERIF}}>
      <div style={{position: 'absolute', left: 90, top: 80}}>
        <div style={{color: C.ivory, fontSize: 26, letterSpacing: 8, opacity: 0.8}}>原始木板</div>
        <div style={{display: 'flex', alignItems: 'baseline', gap: 10, transform: `scale(${bump})`, transformOrigin: 'left center'}}>
          <span
            style={{
              fontSize: 96,
              fontWeight: 900,
              color: zero ? C.red : C.goldHot,
              textShadow: zero ? '0 0 30px rgba(255,90,79,0.8)' : '0 0 24px rgba(242,200,107,0.6)',
              fontVariantNumeric: 'tabular-nums',
            }}
          >
            {remaining}
          </span>
          <span style={{fontSize: 36, color: C.ivory, opacity: 0.6}}>/ {PLANK_COUNT}</span>
        </div>
        <div style={{width: 360, height: 6, background: 'rgba(255,255,255,0.12)', borderRadius: 3, overflow: 'hidden'}}>
          <div style={{width: 360 * ratio, height: 6, background: `linear-gradient(90deg, ${C.ember}, ${C.gold})`, boxShadow: `0 0 12px ${C.gold}`}} />
        </div>
      </div>
      <div style={{position: 'absolute', right: 90, top: 80, textAlign: 'right'}}>
        <div style={{color: C.ivory, fontSize: 26, letterSpacing: 8, opacity: 0.8}}>岁月</div>
        <div style={{color: C.ivory, fontSize: 30, marginTop: 6}}>
          第 <span style={{fontSize: 80, fontWeight: 900, color: C.gold, fontVariantNumeric: 'tabular-nums', textShadow: '0 0 20px rgba(242,200,107,0.5)'}}>{year}</span> 年
        </div>
      </div>
    </AbsoluteFill>
  );
};

/** 拆下的旧木板：沿抛物线飞向旧木堆 */
const Debris: React.FC<{frame: number}> = ({frame}) => (
  <svg width={W} height={H} style={{position: 'absolute', overflow: 'visible'}}>
    {/* 已经堆好的旧木板 */}
    {REPLACE_ORDER.map((id, i) => {
      const s = SLOTS[i];
      if (frame < s.det + 34) return null;
      const ps = pileSlot(i);
      const pop = clamp01((frame - s.det - 34) / 6);
      return (
        <rect
          key={id}
          x={ps.x}
          y={ps.y}
          width={74}
          height={13}
          rx={2}
          fill={i % 2 ? '#3d3528' : '#45392a'}
          stroke="#120c06"
          strokeWidth={1.2}
          opacity={pop}
        />
      );
    })}
    {/* 正在飞行的旧木板 */}
    {REPLACE_ORDER.map((id, i) => {
      const s = SLOTS[i];
      const t = (frame - s.det) / 36;
      if (t < 0 || t > 1) return null;
      const p = PLANKS[id];
      const from = world(p.cx, p.cy);
      const ps = pileSlot(i);
      const to = {x: ps.x + 37, y: ps.y + 6};
      const e = Easing.inOut(Easing.quad)(t);
      const x = from.x + (to.x - from.x) * e;
      const y = from.y + (to.y - from.y) * e - Math.sin(Math.PI * t) * 160;
      const sc = SS * (1 - 0.35 * e);
      const rot = Math.sin(t * Math.PI) * 50 * (i % 2 ? 1 : -1);
      return (
        <g key={id} transform={`translate(${x},${y}) rotate(${rot}) scale(${sc}) translate(${-p.cx},${-p.cy})`} opacity={1 - clamp01((t - 0.85) / 0.15)}>
          <path d={p.d} fill="#3a3326" stroke={C.ember} strokeWidth={2} strokeOpacity={1 - t} />
        </g>
      );
    })}
    {/* 新木板的金色拖尾 */}
    {REPLACE_ORDER.map((id, i) => {
      const s = SLOTS[i];
      if (frame < s.inn || frame >= s.land + 4) return null;
      const p = PLANKS[id];
      const to = world(p.cx, p.cy);
      const t = clamp01((frame - s.inn) / (s.land - s.inn));
      const e = Easing.out(Easing.cubic)(t);
      const y = to.y - (1 - e) * 650 * SS;
      const len = 260 * (1 - e) + 20;
      return (
        <g key={id} style={{mixBlendMode: 'screen'}}>
          <defs>
            <linearGradient id={`trail${id}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor={C.goldHot} stopOpacity="0" />
              <stop offset="1" stopColor={C.goldHot} stopOpacity="0.9" />
            </linearGradient>
          </defs>
          <rect x={to.x - 30} y={y - len} width={60} height={len} fill={`url(#trail${id})`} />
        </g>
      );
    })}
  </svg>
);

export const Replace: React.FC = () => {
  const frame = useCurrentFrame();
  const cam = useCamera(frame);
  const glory = prog(frame, 930, 1010);
  const sweep = interpolate(frame, [1000, 1130], [-700, 700], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const look = (p: (typeof PLANKS)[number]) => {
    const L = plankLook(frame, p);
    if (frame > 990) {
      const d = Math.abs(p.cx - sweep);
      L.glow = Math.max(L.glow ?? 0, Math.max(0, 1 - d / 160) * 0.9);
    }
    return L;
  };
  const lanternFlicker = 0.85 + 0.15 * Math.sin(frame / 5) * Math.sin(frame / 13);

  return (
    <AbsoluteFill>
      <Sky kind="night" stars={140} />
      {/* 船坞里的暖色灯光 */}
      <AbsoluteFill
        style={{
          background: `radial-gradient(ellipse 30% 40% at 18% 62%, rgba(255,160,70,${0.22 * lanternFlicker}), transparent 70%), radial-gradient(ellipse 30% 40% at 84% 60%, rgba(255,160,70,${0.18 * lanternFlicker}), transparent 70%)`,
        }}
      />
      <Rays x={W / 2} y={360} opacity={glory * 0.9} count={16} color="rgba(255,225,160,0.2)" />
      <AbsoluteFill
        style={{
          transformOrigin: '0 0',
          transform: `translate(${W / 2 + cam.shake}px, ${470}px) scale(${cam.s}) translate(${-cam.fx}px, ${-cam.fy}px)`,
        }}
      >
        <svg width={W} height={H} style={{position: 'absolute', overflow: 'visible'}}>
          {/* 地面 */}
          <defs>
            <linearGradient id="floor" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#1a1410" />
              <stop offset="1" stopColor="#050403" />
            </linearGradient>
          </defs>
          <rect x={-400} y={GROUND} width={W + 800} height={800} fill="url(#floor)" />
          <line x1={-400} x2={W + 400} y1={GROUND} y2={GROUND} stroke={C.goldDeep} strokeOpacity={0.5} strokeWidth={2} />
          {/* 船架 */}
          {[-300, -40, 220].map((x) => {
            const top = world(x, bottomY(x));
            return <path key={x} d={`M${top.x - 40},${top.y - 6} L${top.x + 40},${top.y - 6} L${top.x + 70},${GROUND} L${top.x - 70},${GROUND} Z`} fill="#24170d" stroke="#0d0805" strokeWidth={2} />;
          })}
          <g transform={`translate(${SX},${SY}) scale(${SS})`}>
            <Ship look={look} frame={frame} canvas={false} oars={false} />
          </g>
        </svg>
        <Debris frame={frame} />
        {REPLACE_ORDER.map((id, i) => {
          const s = SLOTS[i];
          if (frame < s.land - 1 || frame > s.land + 45) return null;
          const p = PLANKS[id];
          const w = world(p.cx, p.cy);
          const big = i === 0 || i === PLANK_COUNT - 1;
          return (
            <React.Fragment key={id}>
              <Sparks x={w.x} y={w.y} start={s.land} count={big ? 60 : 18} power={big ? 380 : 160} seed={`ld${id}`} dur={big ? 45 : 28} />
              {big && <Shockwave x={w.x} y={w.y} start={s.land} dur={40} max={700} />}
            </React.Fragment>
          );
        })}
        {REPLACE_ORDER.map((id, i) => {
          const s = SLOTS[i];
          if (frame < s.det - 1 || frame > s.det + 30) return null;
          const p = PLANKS[id];
          const w = world(p.cx, p.cy);
          return <Sparks key={id} x={w.x} y={w.y} start={s.det} count={i === 0 || i === PLANK_COUNT - 1 ? 40 : 10} power={120} gravity={500} seed={`dt${id}`} color={C.ember} dur={30} />;
        })}
        {/* 旧木堆标签 */}
        <div
          style={{
            position: 'absolute',
            left: PILE_X,
            top: GROUND + 20,
            width: 260,
            textAlign: 'center',
            fontFamily: SERIF,
            fontSize: 24,
            letterSpacing: 6,
            color: C.ivory,
            opacity: prog(frame, 450, 500) * 0.75,
          }}
        >
          旧木板
        </div>
      </AbsoluteFill>
      <Flash at={SLOTS[0].land} peak={0.25} dur={12} />
      <Flash at={SLOTS[PLANK_COUNT - 1].land} peak={0.7} dur={24} />
      <Hud frame={frame} />
      <Dust count={50} opacity={0.4 + glory * 0.6} seed="rep" />
      <Subtitles cues={CUES.replace} />
    </AbsoluteFill>
  );
};

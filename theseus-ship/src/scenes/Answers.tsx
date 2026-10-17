import React from 'react';
import {AbsoluteFill, Easing, Sequence, interpolate, useCurrentFrame} from 'remotion';
import {Dust, Rays, Sky, Sparks} from '../components/Atmos';
import {Ship} from '../components/Ship';
import {GoldText, SlamText, Subtitles} from '../components/Text';
import {BRUSH, C, SERIF, W} from '../lib/theme';
import {prog} from '../lib/math';
import {ANSWERS, CUES} from '../script';

const CARD_W = 1400;
const CARD_H = 540;
const CARD_X = (W - CARD_W) / 2;
const CARD_Y = 200;
const ICON_W = 540;
const SPAN = 240;
const START = 90;

/* ---------- 四个图示 ---------- */
const IconMaterial: React.FC<{f: number}> = ({f}) => {
  const lit = prog(f, 60, 110);
  return (
    <svg width={ICON_W} height={CARD_H}>
      <g transform={`translate(${ICON_W / 2},${CARD_H / 2 + 70}) scale(0.42)`}>
        <Ship look={(p) => ({wear: 0.75, heat: lit * (0.4 + 0.4 * Math.sin(f / 6 + p.seed * 6))})} frame={f} billow={0.3} oars={false} />
      </g>
      <circle cx={ICON_W / 2 + 170} cy={120} r={44} fill="none" stroke={C.ember} strokeWidth={3} opacity={lit} />
      <text x={ICON_W / 2 + 170} y={137} textAnchor="middle" fontFamily={SERIF} fontWeight={900} fontSize={48} fill={C.ember} opacity={lit}>
        B
      </text>
    </svg>
  );
};

const IconContinuity: React.FC<{f: number}> = ({f}) => {
  const n = 5;
  const flow = (f * 3) % 420;
  return (
    <svg width={ICON_W} height={CARD_H}>
      <path d={`M40,${CARD_H / 2 + 60} L${ICON_W - 40},${CARD_H / 2 + 60}`} stroke={C.gold} strokeWidth={2} strokeDasharray="6 8" opacity={0.6} />
      <circle cx={60 + flow} cy={CARD_H / 2 + 60} r={7} fill={C.goldHot} style={{filter: `drop-shadow(0 0 10px ${C.gold})`}} />
      {Array.from({length: n}, (_, k) => {
        const appear = prog(f, 20 + k * 14, 40 + k * 14);
        return (
          <g key={k} transform={`translate(${70 + k * 100},${CARD_H / 2 + 20}) scale(${0.085 * (0.6 + appear * 0.4)})`} opacity={appear}>
            <Ship look={(p) => (p.seed < k / (n - 1) ? {fresh: 1} : {wear: 0.6})} frame={f} oars={false} billow={0.3} />
          </g>
        );
      })}
      <text x={ICON_W / 2} y={CARD_H / 2 + 120} textAnchor="middle" fontFamily={SERIF} fontSize={22} fill={C.ivory} opacity={0.6} letterSpacing={6}>
        A → A → A → A → A
      </text>
    </svg>
  );
};

const IconRiver: React.FC<{f: number}> = ({f}) => (
  <svg width={ICON_W} height={CARD_H}>
    <defs>
      <linearGradient id="riv" x1="0" x2="1">
        <stop offset="0" stopColor={C.cyan} stopOpacity="0" />
        <stop offset="0.5" stopColor={C.cyan} stopOpacity="0.9" />
        <stop offset="1" stopColor={C.cyan} stopOpacity="0" />
      </linearGradient>
    </defs>
    {Array.from({length: 9}, (_, i) => {
      const pts: string[] = [];
      for (let x = 0; x <= ICON_W; x += 12) {
        const y = CARD_H / 2 - 100 + i * 26 + Math.sin(x * 0.018 + f * 0.12 + i * 0.7) * (16 + i * 2);
        pts.push(`${x},${y.toFixed(1)}`);
      }
      return <path key={i} d={`M${pts.join('L')}`} fill="none" stroke="url(#riv)" strokeWidth={2.5 - i * 0.15} opacity={0.4 + (i % 3) * 0.2} strokeDasharray={`${40 + i * 10} 18`} strokeDashoffset={-f * (3 + i * 0.4)} />;
    })}
    {/* 一只踏入河中的脚印般的光圈 */}
    {[0, 1].map((k) => {
      const t = ((f + k * 40) % 80) / 80;
      return <ellipse key={k} cx={ICON_W / 2} cy={CARD_H / 2 + 6} rx={20 + t * 140} ry={6 + t * 40} fill="none" stroke={C.goldHot} strokeWidth={2} opacity={1 - t} />;
    })}
  </svg>
);

const IconConvention: React.FC<{f: number}> = ({f}) => {
  const sw = Math.sin(f / 22);
  const x = ICON_W / 2 + sw * 130;
  return (
    <svg width={ICON_W} height={CARD_H}>
      <g transform={`translate(${ICON_W / 2 - 130},${CARD_H / 2 + 90}) scale(0.2)`}>
        <Ship look={() => ({fresh: 1})} frame={f} oars={false} billow={0.3} />
      </g>
      <g transform={`translate(${ICON_W / 2 + 130},${CARD_H / 2 + 90}) scale(0.2)`}>
        <Ship look={() => ({wear: 0.75})} frame={f} oars={false} billow={0.3} />
      </g>
      <line x1={ICON_W / 2} y1={60} x2={x} y2={150} stroke={C.gold} strokeWidth={1.5} />
      <g transform={`translate(${x},${170}) rotate(${-sw * 12})`}>
        <rect x={-50} y={-30} width={100} height={60} rx={10} fill="#efe2c4" stroke={C.gold} strokeWidth={3} />
        <circle cx={0} cy={-18} r={5} fill="#3b2a18" />
        <text y={20} textAnchor="middle" fontFamily={SERIF} fontWeight={900} fontSize={34} fill="#3b2414">
          船
        </text>
      </g>
    </svg>
  );
};

const ICONS = [IconMaterial, IconContinuity, IconRiver, IconConvention];

/* ---------- 卡片 ---------- */
const Card: React.FC<{i: number}> = ({i}) => {
  const f = useCurrentFrame();
  const a = ANSWERS[i];
  const enter = prog(f, 0, 32, Easing.out(Easing.back(1.2)));
  const exit = prog(f, SPAN - 28, SPAN, Easing.in(Easing.cubic));
  const rot = (1 - enter) * -80 + exit * 80;
  const op = Math.min(prog(f, 0, 14), 1 - exit);
  const Icon = ICONS[i];
  const shineX = interpolate(f, [10, 70], [-30, 130], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const line = (start: number) => {
    const t = prog(f, start, start + 24, Easing.out(Easing.cubic));
    return {opacity: t, transform: `translateX(${(1 - t) * 40}px)`, filter: `blur(${(1 - t) * 6}px)`};
  };
  return (
    <AbsoluteFill style={{perspective: 1600}}>
      <div
        style={{
          position: 'absolute',
          left: CARD_X,
          top: CARD_Y,
          width: CARD_W,
          height: CARD_H,
          transform: `rotateY(${rot}deg) translateZ(${-200 * (1 - enter) - 200 * exit}px)`,
          opacity: op,
          borderRadius: 18,
          background: 'linear-gradient(135deg, rgba(28,36,56,0.92), rgba(10,13,22,0.94))',
          border: '1px solid rgba(242,200,107,0.45)',
          boxShadow: '0 30px 80px rgba(0,0,0,0.6), 0 0 60px rgba(242,200,107,0.12), inset 0 0 80px rgba(242,200,107,0.05)',
          overflow: 'hidden',
          display: 'flex',
        }}
      >
        {/* 扫光 */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: `linear-gradient(105deg, transparent ${shineX - 10}%, rgba(255,240,200,0.18) ${shineX}%, transparent ${shineX + 10}%)`,
          }}
        />
        {/* 水印编号 */}
        <div style={{position: 'absolute', right: 40, top: -40, fontFamily: BRUSH, fontSize: 300, color: 'rgba(242,200,107,0.07)'}}>{a.num}</div>
        <div style={{width: ICON_W, height: CARD_H, borderRight: '1px solid rgba(242,200,107,0.2)', background: 'radial-gradient(circle at 50% 55%, rgba(242,200,107,0.1), transparent 70%)'}}>
          <Icon f={f} />
        </div>
        <div style={{flex: 1, padding: '70px 60px 0 60px', fontFamily: SERIF}}>
          <div style={{...line(14), display: 'flex', alignItems: 'baseline', gap: 26}}>
            <GoldText size={64} font={BRUSH} weight={400}>
              {a.num}
            </GoldText>
            <GoldText size={68} shine={prog(f, 30, 80)}>
              {a.title}
            </GoldText>
          </div>
          <div style={{...line(24), width: 120, height: 3, margin: '26px 0 34px', background: `linear-gradient(90deg, ${C.gold}, transparent)`}} />
          <div style={{...line(36), fontSize: 40, color: C.ivory, lineHeight: 1.5, fontWeight: 600}}>{a.claim}</div>
          <div
            style={{
              ...line(80),
              marginTop: 40,
              fontSize: 30,
              lineHeight: 1.6,
              color: C.goldHot,
              padding: '16px 24px',
              borderLeft: `4px solid ${C.gold}`,
              background: 'linear-gradient(90deg, rgba(242,200,107,0.12), transparent)',
            }}
          >
            → {a.verdict}
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};

export const Answers: React.FC = () => {
  const frame = useCurrentFrame();
  const up = prog(frame, 70, 100, Easing.inOut(Easing.cubic));
  const active = Math.floor((frame - START) / SPAN);
  return (
    <AbsoluteFill>
      <Sky kind="void" stars={100} />
      <AbsoluteFill style={{background: 'radial-gradient(ellipse 60% 50% at 50% 45%, rgba(60,90,140,0.25), transparent 70%)'}} />
      <Rays x={W / 2} y={-200} opacity={0.5} count={10} spin={0.03} />
      <AbsoluteFill style={{top: interpolate(up, [0, 1], [420, 60]), transform: `scale(${interpolate(up, [0, 1], [1, 0.55])})`, transformOrigin: '50% 0'}}>
        <SlamText text="四种回答" start={4} size={130} stagger={6} />
      </AbsoluteFill>
      <Sparks x={W / 2} y={490} start={10} count={50} power={600} seed="ans" />
      {ANSWERS.map((_, i) => (
        <Sequence key={i} from={START + i * SPAN} durationInFrames={SPAN} layout="absolute-fill">
          <Card i={i} />
        </Sequence>
      ))}
      {/* 进度点 */}
      <div style={{position: 'absolute', top: 790, width: W, display: 'flex', justifyContent: 'center', gap: 26, opacity: prog(frame, 90, 120) * (1 - prog(frame, 1040, 1070))}}>
        {ANSWERS.map((a, i) => (
          <div
            key={i}
            style={{
              width: i === active ? 46 : 12,
              height: 12,
              borderRadius: 6,
              background: i <= active ? C.gold : 'rgba(255,255,255,0.2)',
              boxShadow: i === active ? `0 0 14px ${C.gold}` : undefined,
            }}
          />
        ))}
      </div>
      <Dust count={40} seed="ans" opacity={0.6} />
      <Subtitles cues={CUES.answers} />
    </AbsoluteFill>
  );
};

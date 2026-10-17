import React from 'react';
import {FONTS, PALETTE as P} from '../config';
import {clamp01, easeOut, lerp, span, win} from '../lib/anim';
import {Badge, Battery, Hand, NotebookBox, NotifCard, Pen, Phone, ScreenText, ScrollList, Sheet, Stamp, Strike, Ticket, Clip, handWidth} from '../components/Kit';

export type SceneProps = {t: number};

const Label: React.FC<{x: number; y: number; text: string; o: number; color?: string; size?: number; anchor?: 'start' | 'middle' | 'end'}> = ({x, y, text, o, color = P.text, size = 26, anchor = 'middle'}) =>
  o <= 0.01 ? null : (
    <text x={x} y={y} textAnchor={anchor} fontFamily={FONTS.title} fontSize={size} letterSpacing={4} fill={color} opacity={o}>
      {text}
    </text>
  );

/* ============ P01 通知风暴 → 一张纸（0–11s）============ */
const NOTIF_TIMES = Array.from({length: 13}, (_, i) => 0.6 + i * 0.42);

export const P01: React.FC<SceneProps> = ({t}) => {
  const arrived = NOTIF_TIMES.filter((a) => t >= a).length;
  const last = NOTIF_TIMES[arrived - 1] ?? -10;
  const shake = t - last < 0.25 && t < 6.2 ? Math.sin((t - last) * 90) * 5 * (1 - (t - last) / 0.25) : 0;
  const move = span(t, 6.0, 7.8);
  const px = lerp(960, 560, move);
  const dim = lerp(1, 0.45, span(t, 6.0, 7.4));
  const drop = span(t, 6.2, 8.0, easeOut);
  const sheetY = lerp(-420, 530, drop);
  const sheetRot = lerp(-18, 4, drop);
  const lift = lerp(60, 0, span(t, 7.2, 8.2));
  const count = Math.min(99, Math.round(arrived * 7.6 + Math.max(0, t - 6) * 2));
  return (
    <g>
      <Phone id="p01" x={px} y={520} w={330} h={640} rot={-3} level={1} screen={dim} shake={shake}>
        <text x={153} y={92} textAnchor="middle" fontFamily={FONTS.body} fontSize={46} fill={P.screenText} opacity={0.9}>
          22:47
        </text>
        {Array.from({length: arrived}, (_, k) => {
          const i = arrived - 1 - k; // 最新的在最上面
          const age = t - NOTIF_TIMES[i];
          const slot = 128 + k * 76;
          const y = k === 0 ? lerp(40, slot, easeOut(clamp01(age / 0.3))) : slot;
          return <NotifCard key={i} x={14} y={y} w={278} seed={i + 3} opacity={k === 0 ? clamp01(age / 0.2) : Math.max(0.15, 1 - k * 0.09)} />;
        })}
      </Phone>
      <Badge x={px + 150} y={520 - 310} n={count >= 99 ? '99+' : count} r={22} opacity={arrived > 0 ? dim : 0} />
      {/* 每次通知的波纹 */}
      {NOTIF_TIMES.map((a, i) => {
        const k = (t - a) / 0.7;
        if (k < 0 || k > 1 || t > 6.4) return null;
        return <rect key={i} x={px - 165 - 30 * k} y={200 - 30 * k} width={330 + 60 * k} height={640 + 60 * k} rx={42 + 30 * k} fill="none" stroke={P.glow} strokeWidth={2} opacity={(1 - k) * 0.5} />;
      })}
      {t > 6.1 && (
        <Sheet x={1270} y={sheetY} w={480} h={640} rot={sheetRot} lift={lift} seed={1}>
          <Hand id="p01a" x={84} y={58} text="三月十四日 晴" size={40} reveal={span(t, 8.6, 10.2)} />
        </Sheet>
      )}
    </g>
  );
};

/* ============ P02 物理性（11–27s）============ */
export const P02: React.FC<SceneProps> = ({t}) => {
  // 通知
  const pings = [5.9, 7.0];
  const pingShake = pings.reduce((acc, a) => (t - a >= 0 && t - a < 0.3 ? Math.sin((t - a) * 90) * 6 * (1 - (t - a) / 0.3) : acc), 0);
  // 电量
  const batt = t < 10.8 ? lerp(0.62, 0, span(t, 7.8, 9.6)) : 0.45; // 充上电后重新亮屏
  const screenOff = span(t, 9.4, 10.0) * (1 - span(t, 10.8, 11.3));
  const screen = 1 - 0.97 * screenOff;
  // 悄悄改掉
  const typed = span(t, 11.2, 12.0);
  const swapped = t >= 12.6;
  const flashSwap = win(t, 12.6, 13.2, 0.05, 0.5);
  const text = swapped ? '我们周六见' : '我们周五见';
  const shown = Array.from(text).slice(0, Math.round(typed * 5)).join('');
  // 纸
  const s1 = handWidth('我们', 44);
  const props = [win(t, 5.6, 16, 0.4, 0.6), win(t, 7.8, 16, 0.4, 0.6), win(t, 10.8, 16, 0.4, 0.6)];
  const propHi = [win(t, 5.8, 7.6, 0.3, 0.5), win(t, 7.9, 10.6, 0.3, 0.5), win(t, 12.4, 15.6, 0.3, 0.5)];
  return (
    <g>
      <Phone id="p02" x={560} y={500} w={330} h={640} rot={-3} screen={screen} shake={pingShake}>
        <Battery x={262} y={60} level={batt} />
        <text x={24} y={68} fontFamily={FONTS.body} fontSize={24} fill={P.screenText}>
          22:48
        </text>
        {pings.map((a, i) => (t >= a ? <NotifCard key={i} x={14} y={110 + (pings.length - 1 - i) * 76} w={278} seed={20 + i} opacity={clamp01((t - a) / 0.2)} /> : null))}
        {t > 11 && (
          <g>
            <rect x={14} y={300} width={278} height={110} rx={16} fill="#13243B" />
            <ScreenText x={34} y={368} text={shown} size={34} cursor={typed < 1} color={flashSwap > 0.05 ? P.alert : P.screenText} />
          </g>
        )}
        {batt < 0.15 && screenOff < 0.5 && (
          <text x={153} y={560} textAnchor="middle" fontFamily={FONTS.body} fontSize={20} fill={P.alert}>
            电量 {Math.round(batt * 100)}%
          </text>
        )}
      </Phone>
      {pings.map((a, i) => {
        const k = (t - a) / 0.8;
        if (k < 0 || k > 1) return null;
        return <rect key={i} x={395 - 30 * k} y={180 - 30 * k} width={330 + 60 * k} height={640 + 60 * k} rx={42 + 30 * k} fill="none" stroke={P.glow} strokeWidth={2} opacity={(1 - k) * 0.6} transform="rotate(-3,560,500)" />;
      })}
      <Sheet x={1310} y={500} w={480} h={640} rot={4} seed={1} crease={span(t, 13.8, 15.2)}>
        <Hand id="p02a" x={84} y={58} text="三月十四日 晴" size={40} />
        <Hand id="p02b" x={84} y={172} text="我们周五见" size={44} reveal={span(t, 2.0, 3.6)} />
        <Strike x1={84 + s1 - 4} x2={84 + s1 + handWidth('周五', 44) + 4} y={158} draw={span(t, 12.8, 13.3)} seed={3} />
        <Hand id="p02c" x={84 + s1 + 4} y={124} text="周六" size={36} reveal={span(t, 13.3, 14.1)} />
        <Hand id="p02d" x={84} y={286} text="记得带伞" size={40} reveal={span(t, 3.6, 4.8)} color={P.pencil} />
      </Sheet>
      <Pen x={1500} y={900} rot={-24} len={380} />
      {/* 三个“物理性” */}
      {['不弹通知', '不会没电', '不会被悄悄改掉'].map((s, i) => (
        <g key={s}>
          <Label x={700 + i * 260} y={118} text={s} o={props[i] * (0.55 + 0.45 * propHi[i])} color={propHi[i] > 0.3 ? P.accent : P.text} size={28} />
        </g>
      ))}
      {[0, 1].map((i) => (
        <circle key={i} cx={830 + i * 260} cy={109} r={3} fill={P.text} opacity={Math.min(props[i], props[i + 1]) * 0.5} />
      ))}
    </g>
  );
};

/* ============ P03 存在的证据（27–38s）============ */
export const P03: React.FC<SceneProps> = ({t}) => {
  const enter = span(t, 0, 1.2, easeOut);
  const tear = span(t, 1.4, 2.6);
  const away = span(t, 2.4, 4.4);
  const center = span(t, 3.6, 5.4);
  const sheetIn = span(t, 3.4, 5.2, easeOut);
  return (
    <g>
      <Sheet x={lerp(1500, 1040, sheetIn)} y={540} w={560} h={700} rot={lerp(10, -3, sheetIn)} seed={4} level={sheetIn}>
        <Hand id="p03a" x={84} y={58} text="三月十四日 晴" size={40} opacity={0.85} />
      </Sheet>
      <Ticket
        x={lerp(1500, 900, enter)}
        y={lerp(500, 480, center)}
        rot={lerp(8, -2, enter)}
        scale={lerp(1, 1.1, center)}
        bodyDx={-tear * 30 - away * 520}
        bodyDy={away * 80}
        bodyRot={-away * 14}
        bodyOpacity={1 - span(t, 3.4, 4.6)}
        stubDx={tear * 24 + center * 120}
        stubRot={tear * 6 - center * 4}
        perforation={tear < 0.05}
      />
      {/* 印章与回形针落在票根上 */}
      <Stamp x={1110} y={520} t={t - 6.2} />
      {t > 7.4 && <Clip x={1086} y={402 + lerp(-30, 0, span(t, 7.4, 8.0))} rot={4} />}
      <Pen x={420} y={860} rot={18} len={400} />
    </g>
  );
};

/* ============ P04 痕迹：划掉 vs 退格（38–54s）============ */
// 三次修改：海边 → 山里 → 湖边 → 海边。纸上新词写在被划掉的词上方，屏幕上只剩最终版本
const STEPS = [
  {word: '海边', w0: 4.6, w1: 6.0, s0: 6.6, s1: 7.0},
  {word: '山里', w0: 7.0, w1: 7.6, s0: 8.0, s1: 8.4},
  {word: '湖边', w0: 8.4, w1: 9.0, s0: 9.4, s1: 9.8},
  {word: '海边', w0: 9.8, w1: 10.4, s0: 99, s1: 99},
];
// 纸上位置：[x 偏移（相对“我想先去”之后）, 基线 y, 字号]
const SLOTS = [
  [0, 210, 58],
  [6, 148, 44],
  [10, 96, 38],
  [138, 210, 58],
];

export const P04: React.FC<SceneProps> = ({t}) => {
  const enter = span(t, 0, 1.0, easeOut);
  const x0 = 120;
  const pre = '我想先去';
  const preW = handWidth(pre, 58);
  let screen = '';
  if (t >= 4.6) {
    const step = [...STEPS].reverse().find((s) => t >= s.w0) ?? STEPS[0];
    const typing = clamp01((t - step.w0) / (step.w1 - step.w0));
    const base = step === STEPS[0] ? Array.from(pre + step.word).slice(0, Math.round(typing * 6)).join('') : pre + Array.from(step.word).slice(0, Math.round(typing * 2)).join('');
    const del = t >= step.s0 ? clamp01((t - step.s0) / (step.s1 - step.s0)) : 0;
    screen = del > 0 ? pre + Array.from(step.word).slice(0, Math.round((1 - del) * 2)).join('') : base;
  }
  const strikes = STEPS.filter((s) => t >= s.s1).length;
  const counters = win(t, 11.0, 17, 0.6, 0.5);
  return (
    <g opacity={enter}>
      <Label x={250} y={372} text="纸" o={1} size={34} />
      <Label x={250} y={742} text="屏幕" o={1} size={34} />
      <Sheet x={1010} y={360} w={1180} h={300} rot={-1} seed={7} ruled>
        <Hand id="p04pre" x={x0} y={210} text={pre} size={58} reveal={span(t, 4.6, 5.6)} />
        {STEPS.map((st, i) => {
          const [dx, y, size] = SLOTS[i];
          const x = x0 + preW + 12 + dx;
          const wWord = handWidth(st.word, size);
          return (
            <g key={i}>
              <Hand id={`p04w${i}`} x={x} y={y} text={st.word} size={size} reveal={span(t, i === 0 ? 5.4 : st.w0, st.w1)} />
              {st.s0 < 99 && <Strike x1={x - 4} x2={x + wWord + 4} y={y - size * 0.34} draw={span(t, st.s0, st.s1)} seed={i + 2} width={3} />}
            </g>
          );
        })}
      </Sheet>
      <g transform="translate(420,650)">
        <rect x={-50} y={-60} width={1280} height={260} rx={40} fill="url(#screenGlow)" opacity={0.6} />
        <rect x={0} y={0} width={1180} height={180} rx={18} fill="#06090D" stroke="#2A2E33" strokeWidth={2} filter="url(#shadow)" />
        <rect x={10} y={10} width={1160} height={160} rx={12} fill="url(#screenGrad)" />
        <ScreenText x={50} y={108} text={screen} size={52} cursor={Math.floor(t * 2) % 2 === 0 || (t > 4.6 && t < 10.6)} />
      </g>
      <Label x={1600} y={566} text={`修改 ${Math.min(3, strikes)} 次 · 痕迹 ${Math.min(3, strikes)} 处`} o={counters} color={P.accent} size={28} anchor="end" />
      <Label x={1600} y={884} text="修改 3 次 · 痕迹 0 处" o={counters} color={P.screenText} size={28} anchor="end" />
    </g>
  );
};

/* ============ P05 厚度 vs 滚动条（54–68s）============ */
export const P05: React.FC<SceneProps> = ({t}) => {
  const k = span(t, 0.6, 12.4, (x) => x * x * (3 - 2 * x));
  const days = Math.max(1, Math.round(k * 365));
  const enter = span(t, 0, 1.0, easeOut);
  return (
    <g opacity={enter}>
      <Label x={640} y={176} text="厚度" o={1} size={32} />
      <Label x={1320} y={176} text="滚动条" o={1} size={32} />
      <NotebookBox x={640} y={520} pages={days} stub={span(t, 9, 10)} />
      <Label x={640} y={880} text={`第 ${days} 天 · ${days} 页`} o={1} size={28} color={P.accent} />
      <Phone id="p05" x={1320} y={520} w={330} h={640}>
        <ScrollList w={306} h={616} offset={k * 365 * 58} thumb={lerp(380, 14, Math.sqrt(k))} thumbPos={0.98} />
      </Phone>
      <Label x={1320} y={880} text={`${days} 条`} o={1} size={28} color={P.screenText} />
    </g>
  );
};


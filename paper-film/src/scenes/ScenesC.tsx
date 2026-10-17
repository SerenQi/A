import React from 'react';
import {FONTS, ONSCREEN, PALETTE as P} from '../config';
import {clamp01, easeOut, hash, lerp, span, win} from '../lib/anim';
import {Hand, Leaf, Notebook, NotebookBox, Pen, Phone, NotifCard, Sheet, StickyNote, Ticket, Clip} from '../components/Kit';
import {ParticleText} from '../components/ParticleText';
import type {SceneProps} from './ScenesA';

const Label: React.FC<{x: number; y: number; text: string; o: number; color?: string; size?: number; anchor?: 'start' | 'middle' | 'end'; font?: string}> = ({
  x,
  y,
  text,
  o,
  color = P.text,
  size = 26,
  anchor = 'middle',
  font = FONTS.title,
}) =>
  o <= 0.01 ? null : (
    <text x={x} y={y} textAnchor={anchor} fontFamily={font} fontSize={size} letterSpacing={4} fill={color} opacity={o}>
      {text}
    </text>
  );

/* ============ S02 1975 年的无纸化预言（12–22s）============ */
export const S02: React.FC<SceneProps> = ({t}) => {
  const enter = span(t, 0, 1.2, easeOut);
  const year = Math.round(lerp(1975, 2025, span(t, 4.6, 8.4)));
  const pile = span(t, 5.0, 9.0);
  // 纸张一件件回到桌上
  const items = [
    {at: 0.05, el: <StickyNote key="a" x={1330} y={300} rot={8} color={P.noteGreen} s={150} />},
    {at: 0.18, el: <Sheet key="b" x={1480} y={560} w={300} h={400} rot={-7} seed={11} />},
    {at: 0.3, el: <Ticket key="c" x={1420} y={830} w={420} h={156} rot={5} />},
    {at: 0.42, el: <StickyNote key="d" x={430} y={830} rot={-6} s={150} />},
    {at: 0.55, el: <Sheet key="e" x={1260} y={520} w={300} h={400} rot={9} seed={12} />},
    {at: 0.68, el: <NotebookBox key="f" x={430} y={420} w={260} h={340} pages={90} />},
    {at: 0.8, el: <Clip key="g" x={1180} y={340} rot={-10} />},
  ];
  return (
    <g>
      {items.map((it, i) => {
        const k = clamp01((pile - it.at) / 0.18);
        if (k <= 0) return null;
        const e = easeOut(k);
        return (
          <g key={i} opacity={e} transform={`translate(0,${(1 - e) * -60})`}>
            {it.el}
          </g>
        );
      })}
      {/* 旧剪报 */}
      <g opacity={enter} transform={`translate(${lerp(-200, 0, enter)},0)`}>
        <Sheet x={820} y={500} w={640} h={460} rot={-3} seed={9} ruled={false}>
          <rect x={0} y={0} width={640} height={460} fill="#C9B994" opacity={0.35} />
          <text x={40} y={70} fontFamily={FONTS.title} fontSize={22} letterSpacing={10} fill={P.ink} opacity={0.6}>
            1975 · 杂志剪报
          </text>
          <line x1={40} x2={600} y1={90} y2={90} stroke={P.ink} strokeWidth={2} opacity={0.5} />
          <text x={40} y={170} fontFamily={FONTS.title} fontSize={64} fontWeight={600} fill={P.ink}>
            未来的办公室
          </text>
          {Array.from({length: 7}, (_, i) => (
            <rect key={i} x={40 + (i % 2) * 290} y={220 + Math.floor(i / 2) * 44} width={250 - hash(i) * 60} height={10} rx={3} fill={P.ink} opacity={0.25} />
          ))}
          <g transform="translate(470,330) rotate(-8)" opacity={span(t, 1.6, 2.4)}>
            <rect x={-110} y={-44} width={220} height={88} fill="none" stroke={P.stamp} strokeWidth={4} />
            <text y={16} textAnchor="middle" fontFamily={FONTS.title} fontSize={46} fill={P.stamp} letterSpacing={6}>
              无纸化
            </text>
          </g>
        </Sheet>
      </g>
      {/* 年份计数 */}
      <g opacity={win(t, 4.4, 10.6, 0.6, 0.6)}>
        <text x={960} y={140} textAnchor="middle" fontFamily={FONTS.title} fontSize={64} fill={P.accent} letterSpacing={6}>
          {year}
        </text>
        <rect x={760} y={162} width={400} height={3} fill={P.text} opacity={0.15} />
        <rect x={760} y={162} width={400 * span(t, 4.6, 8.4)} height={3} fill={P.accent} />
      </g>
    </g>
  );
};

/* ============ S04 字迹就是那个人（36–56s）============ */
const NOTE = '饭在锅里，记得热';

export const S04: React.FC<SceneProps> = ({t}) => {
  const enter = span(t, 0, 1.2, easeOut);
  const write = span(t, 4.4, 7.4);
  const printed = span(t, 9.2, 10.4, easeOut);
  const analyse = [win(t, 13.3, 19.6, 0.4, 0.6), win(t, 14.3, 19.6, 0.4, 0.6), win(t, 15.3, 19.6, 0.4, 0.6)];
  const lens = win(t, 13.0, 17.4, 0.6, 0.6);
  const warm = win(t, 17.0, 20.4, 0.8, 0.6);
  const NX = 700;
  const NY = 500;
  const S = 380;
  return (
    <g opacity={enter}>
      {/* 冰箱门：浅色金属面 */}
      <rect x={260} y={90} width={880} height={830} rx={24} fill="#3A3F44" opacity={0.85} filter="url(#shadow)" />
      <rect x={260} y={90} width={880} height={830} rx={24} fill="none" stroke="#fff" strokeOpacity={0.08} strokeWidth={2} />
      <rect x={1100} y={300} width={14} height={260} rx={7} fill="#5B6168" />
      {warm > 0.01 && <rect x={NX - S / 2 - 40} y={NY - S / 2 - 40} width={S + 80} height={S + 80} rx={20} fill="#FFC480" opacity={0.18 * warm} filter="url(#blurSoft)" />}
      <StickyNote x={NX} y={NY} rot={-4} s={S} color={P.noteYellow}>
        <Hand id="s04n1" x={-150} y={-30} text="饭在锅里，" size={62} reveal={clamp01(write * 1.8)} />
        <Hand id="s04n2" x={-120} y={70} text="记得热" size={68} reveal={clamp01(write * 1.8 - 0.8)} />
        <path d="M60,130 q30,-14 60,4" fill="none" stroke={P.ink} strokeWidth={3} strokeLinecap="round" opacity={span(t, 7.2, 7.6)} />
      </StickyNote>
      {/* 磁铁 */}
      <g transform={`translate(${NX - 10},${NY - S / 2 + 6})`} filter="url(#shadowLow)">
        <circle r={26} fill="#B5503F" />
        <circle r={26} fill="none" stroke="#fff" strokeOpacity={0.2} strokeWidth={2} />
      </g>
      {/* 打印出来的同一句话 */}
      {printed > 0.01 && (
        <g opacity={printed * (1 - 0.5 * warm)} transform={`translate(${lerp(200, 0, printed)},0)`}>
          <rect x={1250} y={420} width={520} height={150} fill="#F4F2EE" filter="url(#shadow)" />
          <text x={1510} y={512} textAnchor="middle" fontFamily={FONTS.body} fontSize={46} fill="#222">
            {NOTE}
          </text>
          <Label x={1510} y={620} text="打印：谁写都一样" o={1} size={24} color={P.text} />
        </g>
      )}
      {/* 笔迹里的人：放大镜 + 三处标注 */}
      {lens > 0.01 && (
        <g opacity={lens}>
          <defs>
            <clipPath id="lensClip">
              <circle cx={NX + 230} cy={NY - 210} r={110} />
            </clipPath>
          </defs>
          <circle cx={NX + 230} cy={NY - 210} r={110} fill={P.noteYellow} filter="url(#shadow)" />
          <g clipPath="url(#lensClip)">
            <g transform={`translate(${NX + 230},${NY - 210}) scale(2.6) translate(${-(NX - 150 + 30)},${-(NY - 52)}) rotate(-4,${NX},${NY})`}>
              <text x={NX - 150} y={NY - 30} fontFamily={FONTS.hand} fontSize={62} fill={P.ink}>
                饭在
              </text>
            </g>
          </g>
          <circle cx={NX + 230} cy={NY - 210} r={110} fill="none" stroke="#C9CDD2" strokeWidth={10} />
          <path d={`M${NX + 308},${NY - 132} L${NX + 380},${NY - 60}`} stroke="#7A6A55" strokeWidth={18} strokeLinecap="round" />
        </g>
      )}
      {[
        {txt: '力气 · 笔画深浅', ax: NX - 120, ay: NY - 40, lx: 300, ly: 200},
        {txt: '习惯 · 连笔', ax: NX + 40, ay: NY + 50, lx: 330, ly: 860},
        {txt: '匆忙 · 越写越斜', ax: NX + 140, ay: NY + 110, lx: 1020, ly: 860},
      ].map((l, i) =>
        analyse[i] > 0.01 ? (
          <g key={l.txt} opacity={analyse[i]}>
            <path d={`M${l.ax},${l.ay}L${l.lx + 40},${l.ly - 10}`} stroke={P.accent} strokeWidth={1.5} fill="none" />
            <circle cx={l.ax} cy={l.ay} r={5} fill={P.accent} />
            <Label x={l.lx} y={l.ly} text={l.txt} o={1} size={28} color={P.accent} anchor="start" />
          </g>
        ) : null,
      )}
    </g>
  );
};

/* ============ S09 纸会变老；重要的事落在纸上（122–142s）============ */
export const S09: React.FC<SceneProps> = ({t}) => {
  const enter = span(t, 0, 1.2, easeOut);
  const age = span(t, 1.0, 9.0);
  const crease = span(t, 2.0, 4.0);
  const coffee = span(t, 3.6, 4.6);
  const blot = span(t, 4.8, 5.8);
  const shift = span(t, 10.2, 11.6);
  const items = [span(t, 10.6, 11.8, easeOut), span(t, 11.6, 12.8, easeOut), span(t, 12.6, 13.8, easeOut)];
  const glow = win(t, 15.2, 20.4, 1.0, 0.6);
  const sx = lerp(960, 520, shift);
  return (
    <g opacity={enter}>
      <g transform={`translate(${sx},520) rotate(-3) scale(${lerp(1, 0.82, shift)})`}>
        <Sheet x={0} y={0} w={520} h={680} seed={21} crease={crease}>
          {/* 发黄：从边缘向内 */}
          <defs>
            <radialGradient id="yellowing" cx="0.5" cy="0.5" r="0.75">
              <stop offset="0.35" stopColor="#C9A55C" stopOpacity={0.08 * age} />
              <stop offset="1" stopColor="#A47C35" stopOpacity={0.55 * age} />
            </radialGradient>
          </defs>
          <rect x={0} y={0} width={520} height={680} fill="url(#yellowing)" />
          <Hand id="s09a" x={84} y={58} text="三月十四日 晴" size={40} color={age > 0.5 ? '#3B3A44' : P.ink} />
          <Hand id="s09b" x={84} y={172} text="和朋友去看演出" size={40} />
          {coffee > 0.01 && (
            <g opacity={coffee}>
              <circle cx={380} cy={470} r={78} fill="none" stroke="#6B4A2E" strokeWidth={9} opacity={0.35} />
              <circle cx={380} cy={470} r={72} fill="#6B4A2E" opacity={0.06} />
            </g>
          )}
          {blot > 0.01 && <circle cx={240} cy={164} r={26 * blot} fill={P.ink} opacity={0.22} filter="url(#blurFg)" />}
        </Sheet>
        <Label x={0} y={420} text="发黄 · 木质素氧化" o={win(t, 6.0, 10.4, 0.6, 0.6)} color={P.accent} size={28} />
      </g>
      {/* 人生里最要紧的几张纸 */}
      {items[0] > 0.01 && (
        <g opacity={items[0]} transform={`translate(${lerp(300, 0, items[0])},0)`}>
          <g transform="translate(1180,330) rotate(-6)" filter="url(#shadow)">
            <rect x={-210} y={-120} width={420} height={240} fill="#E9DFC6" />
            <path d="M-210,-120 L0,10 L210,-120" fill="none" stroke="#B8A980" strokeWidth={2} />
            <rect x={-210} y={-120} width={420} height={240} fill="none" stroke={P.stamp} strokeWidth={4} opacity={0.7} />
            <text y={80} textAnchor="middle" fontFamily={FONTS.title} fontSize={34} fill={P.stamp} letterSpacing={8}>
              录取通知书
            </text>
          </g>
        </g>
      )}
      {items[1] > 0.01 && (
        <g opacity={items[1]} transform={`translate(${lerp(300, 0, items[1])},0)`}>
          <g transform="translate(1520,560) rotate(8)" filter="url(#shadow)">
            <rect x={-150} y={-200} width={300} height={400} rx={10} fill="#9E2B25" />
            <rect x={-130} y={-180} width={260} height={360} rx={6} fill="none" stroke="#D9B45A" strokeWidth={2} opacity={0.8} />
            <circle cy={-40} r={46} fill="none" stroke="#D9B45A" strokeWidth={3} />
            <circle cy={-40} r={30} fill="none" stroke="#D9B45A" strokeWidth={1.5} />
            <text y={90} textAnchor="middle" fontFamily={FONTS.title} fontSize={44} fill="#E6C46A" letterSpacing={10}>
              结婚证
            </text>
          </g>
        </g>
      )}
      {items[2] > 0.01 && (
        <g opacity={items[2]} transform={`translate(${lerp(300, 0, items[2])},0)`}>
          <g transform="translate(1180,780) rotate(3)" filter="url(#shadow)">
            <rect x={-240} y={-140} width={480} height={280} fill="#EFE8D6" />
            <rect x={-224} y={-124} width={448} height={248} fill="none" stroke="#9E8350" strokeWidth={3} />
            <rect x={-214} y={-114} width={428} height={228} fill="none" stroke="#9E8350" strokeWidth={1} />
            <text y={-40} textAnchor="middle" fontFamily={FONTS.title} fontSize={40} fill={P.ink} letterSpacing={10}>
              毕业证书
            </text>
            {[0, 1, 2].map((i) => (
              <rect key={i} x={-150} y={0 + i * 26} width={300 - i * 60} height={8} rx={4} fill={P.ink} opacity={0.25} />
            ))}
            <circle cx={150} cy={70} r={34} fill="none" stroke={P.stamp} strokeWidth={3} opacity={0.8} />
          </g>
        </g>
      )}
      {glow > 0.01 && <ellipse cx={1300} cy={560} rx={460} ry={420} fill="#FFC480" opacity={0.08 * glow} filter="url(#blurSoft)" />}
    </g>
  );
};

/* ============ S10 收束（142–165s）============ */
const PageNotes: React.FC<{id: string; lines: string[]; ph?: number}> = ({id, lines, ph = 470}) => (
  <g>
    {lines.map((l, i) => (
      <Hand key={i} id={`${id}-${i}`} x={30} y={-ph / 2 + 100 + i * 72} text={l} size={34} color={i % 3 === 2 ? P.pencil : P.ink} />
    ))}
  </g>
);

export const S10: React.FC<SceneProps> = ({t}) => {
  const enter = span(t, 0, 1.2, easeOut);
  const phoneIn = span(t, 0.4, 1.6, easeOut);
  const close = span(t, 8.6, 10.4);
  const boxIn = span(t, 9.8, 11.0);
  const finalP = span(t, 15.0, 17.6);
  const title = win(t, 15.6, 22.2, 1.0, 1.0);
  return (
    <g opacity={enter}>
      {/* 手机与本子并排：都在桌上，各有分工 */}
      <g opacity={phoneIn * (1 - 0.5 * span(t, 9, 11))}>
        <Phone id="s10" x={lerp(1700, 1480, phoneIn)} y={470} w={300} h={580} rot={6} screen={0.8}>
          {[0, 1, 2, 3].map((i) => (
            <NotifCard key={i} x={14} y={90 + i * 76} w={248} seed={i + 80} />
          ))}
        </Phone>
      </g>
      {boxIn < 1 && (
        <g opacity={1 - boxIn} transform={`translate(${760 + close * 160},470) scale(${1 - close * 0.5},${1 - close * 0.1}) translate(-760,-470)`}>
          <Notebook x={760} y={470} pw={340} ph={470} left={<PageNotes id="s10l" lines={['和朋友去看演出', '第 7 排 12 座']} />} right={<PageNotes id="s10r" lines={['三月十四日 晴', '记得带伞']} />} curl={0.5} />
        </g>
      )}
      {boxIn > 0.01 && <NotebookBox x={860} y={440} w={300} h={400} pages={160} stub={boxIn} level={boxIn} />}
      <Pen x={1180} y={470} rot={-78} len={300} />
      <Leaf x={420} y={790} rot={-30} s={0.9} />
      {/* 片尾大字 */}
      {finalP > 0.001 && <rect x={0} y={760} width={1920} height={200} fill="#000" opacity={0.35 * finalP} filter="url(#blurSoft)" />}
      <ParticleText text={ONSCREEN.final} x={960} y={850} size={72} font={FONTS.title} p={finalP} step={3} seed={7} color="#F2EEE6" />
      <text x={960} y={120} textAnchor="middle" fontFamily={FONTS.title} fontSize={30} letterSpacing={14} fill={P.text} opacity={title * 0.8}>
        为什么人还在用纸
      </text>
    </g>
  );
};

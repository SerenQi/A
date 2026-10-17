import React from 'react';
import {FONTS, PALETTE as P} from '../config';
import {clamp01, easeOut, hash, lerp, span, win} from '../lib/anim';
import {Hand, Leaf, Notebook, NotebookBox, NotifCard, Pen, Phone, ScreenText, Sheet, StickyNote, Strike, Ticket} from '../components/Kit';
import type {SceneProps} from './ScenesA';

const Label: React.FC<{x: number; y: number; text: string; o: number; color?: string; size?: number; anchor?: 'start' | 'middle' | 'end'}> = ({x, y, text, o, color = P.text, size = 26, anchor = 'middle'}) =>
  o <= 0.01 ? null : (
    <text x={x} y={y} textAnchor={anchor} fontFamily={FONTS.title} fontSize={size} letterSpacing={4} fill={color} opacity={o}>
      {text}
    </text>
  );

/** 一页手写内容（页面局部坐标） */
const PageNotes: React.FC<{id: string; lines: string[]; pw?: number; ph?: number; month?: string; doodle?: number}> = ({id, lines, ph = 500, month, doodle = 0}) => (
  <g>
    {month && (
      <text x={340} y={-ph / 2 + 44} textAnchor="end" fontFamily={FONTS.hand} fontSize={34} fill={P.stamp} opacity={0.85}>
        {month}
      </text>
    )}
    {lines.map((l, i) => (
      <Hand key={i} id={`${id}-${i}`} x={30} y={-ph / 2 + 100 + i * 72} text={l} size={34} color={i % 3 === 2 ? P.pencil : P.ink} />
    ))}
    {doodle > 0 && (
      <g transform={`translate(${250},${ph / 2 - 110})`} fill="none" stroke={P.pencil} strokeWidth={2}>
        <circle r={34} />
        <path d="M-20,8 Q0,26 20,8 M-12,-8 L-12,-6 M12,-8 L12,-6" />
      </g>
    )}
  </g>
);

const SPREADS = [
  {month: '11月', L: ['今天加班到很晚', '买了新的笔'], R: ['想念海边', '要早点睡']},
  {month: '8月', L: ['下了一整天的雨', '记得带伞'], R: ['搬家', '旧书都留着']},
  {month: '5月', L: ['第一次自己做饭', '有点咸'], R: ['给妈妈打电话']},
  {month: '3月', L: ['三月十四日 晴', '和朋友去看演出'], R: ['第 7 排 12 座']},
];

/* ============ P06 找到 vs 重逢（68–86s）============ */
export const P06: React.FC<SceneProps> = ({t}) => {
  const gridOn = 1 - span(t, 5.4, 6.4);
  const filter = span(t, 1.6, 3.0);
  const found = win(t, 3.0, 6.0, 0.4, 0.6);
  const nbIn = span(t, 5.6, 7.0, easeOut);
  // 往回翻：4 次
  const flips = [7.2, 8.6, 9.9, 11.0];
  const idx = flips.filter((a) => t >= a + 1.0).length; // 已翻完的次数
  const cur = flips.findIndex((a) => t >= a && t < a + 1.0);
  const p = cur >= 0 ? clamp01((t - flips[cur]) / 1.0) : 0;
  const shownIdx = Math.min(SPREADS.length - 1, idx);
  const next = SPREADS[Math.min(SPREADS.length - 1, idx + 1)];
  const curS = SPREADS[shownIdx];
  // 往回翻：从左往右（dir=-1）。翻动中右页仍是当前这页，左页露出更早一页的左页
  const leftShown = cur >= 0 ? next : curS;
  const rightShown = curS;
  const stubOut = span(t, 12.4, 13.6, easeOut);
  const stubGlow = win(t, 13.4, 18.0, 0.6, 0.8);
  const tags = ['工作', '生活', '旅行'];
  return (
    <g>
      {gridOn > 0.01 && (
        <g opacity={gridOn} transform={`translate(${-span(t, 5.4, 6.4) * 300},0)`}>
          <rect x={310} y={170} width={1300} height={700} rx={28} fill="url(#screenGlow)" opacity={0.5} />
          <rect x={360} y={200} width={1200} height={640} rx={22} fill="#06090D" stroke="#2A2E33" strokeWidth={2} filter="url(#shadow)" />
          <rect x={372} y={212} width={1176} height={616} rx={14} fill="url(#screenGrad)" />
          <Label x={420} y={268} text="找到" o={1} size={30} color={P.screenText} anchor="start" />
          {[0, 1, 2].map((k) => (
            <g key={k} transform={`translate(${1060 + k * 150},244)`}>
              <rect width={130} height={36} rx={18} fill={k === 2 && filter > 0 ? '#3A6FC0' : '#1B2B42'} />
              <text x={65} y={25} textAnchor="middle" fontFamily={FONTS.body} fontSize={18} fill={P.screenText}>
                {tags[k]}
              </text>
            </g>
          ))}
          {Array.from({length: 12}, (_, i) => {
            const tag = i % 3;
            const match = tag === 2;
            const col = i % 4;
            const row = Math.floor(i / 4);
            const mi = Math.floor(i / 3); // 在匹配项中的序号
            const tx = match ? 420 + mi * 270 : 420 + col * 270;
            const ty = match ? 310 : 310 + row * 170;
            const x = lerp(420 + col * 270, tx, filter);
            const y = lerp(310 + row * 170, ty, filter);
            const o = match ? 1 : 1 - 0.85 * filter;
            const hi = match && mi === 2 ? found : 0;
            return (
              <g key={i} transform={`translate(${x},${y})`} opacity={o}>
                {hi > 0.01 && <rect x={-6} y={-6} width={252} height={152} rx={18} fill="none" stroke={P.accent} strokeWidth={3} opacity={hi} />}
                <rect width={240} height={140} rx={14} fill="#1B2B42" />
                <rect x={18} y={20} width={150} height={10} rx={5} fill={P.screenText} opacity={0.8} />
                <rect x={18} y={44} width={190} height={8} rx={4} fill={P.screenText} opacity={0.35} />
                <rect x={18} y={64} width={120} height={8} rx={4} fill={P.screenText} opacity={0.35} />
                <rect x={18} y={98} width={70} height={24} rx={12} fill={['#4A6B9C', '#3F7F66', '#3A6FC0'][tag]} />
              </g>
            );
          })}
        </g>
      )}
      {nbIn > 0.01 && (
        <g opacity={nbIn} transform={`translate(${(1 - nbIn) * 300},0)`}>
          <Label x={960} y={150} text="重逢" o={win(t, 6.6, 18, 0.6, 0.5)} size={30} color={P.accent} />
          <Notebook
            x={960}
            y={530}
            flip={p}
            dir={-1}
            left={<PageNotes id={`l${shownIdx}-${cur}`} lines={leftShown.L} doodle={leftShown === SPREADS[2] ? 1 : 0} />}
            right={
              <g>
                <PageNotes id={`r${shownIdx}`} lines={rightShown.R} month={rightShown.month} />
                {shownIdx === 3 && (
                  <Ticket x={200 + stubOut * 30} y={110} w={360} h={136} rot={-8 + stubOut * 6} scale={1} bodyOpacity={0} stubDx={-160} glow={stubGlow} perforation={false} />
                )}
              </g>
            }
            flipFront={<PageNotes id={`ff${cur}`} lines={curS.L} />}
            flipBack={<PageNotes id={`fb${cur}`} lines={next.R} month={next.month} />}
          />
          <Leaf x={300} y={850} rot={-25} />
          <Pen x={1560} y={300} rot={60} len={360} />
        </g>
      )}
    </g>
  );
};

/* ============ P07 像素做成纸（86–101s）============ */
export const P07: React.FC<SceneProps> = ({t}) => {
  const enter = span(t, 0, 1.0, easeOut);
  const paperUp = span(t, 3.2, 6.0);
  const fibers = span(t, 6.6, 7.6);
  const seam = span(t, 7.8, 8.8);
  const stub = span(t, 9.0, 10.0, easeOut);
  const curl = span(t, 10.2, 11.2);
  const labels = [win(t, 7.0, 15.6, 0.4, 0.6), win(t, 8.2, 15.6, 0.4, 0.6), win(t, 9.4, 15.6, 0.4, 0.6), win(t, 10.6, 15.6, 0.4, 0.6)];
  const SX = 460;
  const SY = 230;
  const SW = 1000;
  const SH = 560;
  const ph = SH - 60;
  return (
    <g opacity={enter}>
      <rect x={SX - 60} y={SY - 60} width={SW + 120} height={SH + 120} rx={60} fill="url(#screenGlow)" opacity={0.5 * (1 - paperUp * 0.6)} />
      <rect x={SX - 26} y={SY - 26} width={SW + 52} height={SH + 52} rx={36} fill={P.phone} stroke="#2A2E33" strokeWidth={2} filter="url(#shadow)" />
      <defs>
        <clipPath id="p07scr">
          <rect x={SX} y={SY} width={SW} height={SH} rx={14} />
        </clipPath>
      </defs>
      <g clipPath="url(#p07scr)">
        <rect x={SX} y={SY} width={SW} height={SH} fill="url(#screenGrad)" />
        {/* 原本的列表界面 */}
        <g opacity={1 - paperUp}>
          {Array.from({length: 6}, (_, i) => (
            <NotifCard key={i} x={SX + 40} y={SY + 40 + i * 84} w={SW - 80} h={68} seed={i + 40} />
          ))}
        </g>
        {/* 纸从下往上铺满 */}
        <g transform={`translate(0,${(1 - paperUp) * SH})`}>
          <rect x={SX} y={SY} width={SW} height={SH} fill={P.paper} />
          <g opacity={fibers}>
            {Array.from({length: 160}, (_, i) => (
              <circle key={i} cx={SX + hash(i * 3) * SW} cy={SY + hash(i * 7 + 1) * SH} r={0.7 + hash(i) * 1.1} fill="#8C8370" opacity={0.35} />
            ))}
            {Array.from({length: 40}, (_, i) => {
              const x = SX + hash(i * 11) * SW;
              const y = SY + hash(i * 13) * SH;
              return <line key={i} x1={x} y1={y} x2={x + 10 + hash(i) * 14} y2={y + (hash(i + 2) - 0.5) * 6} stroke="#9E9381" strokeWidth={0.8} opacity={0.5} />;
            })}
          </g>
          {Array.from({length: 12}, (_, i) => (
            <line key={i} x1={SX + 30} x2={SX + SW - 30} y1={SY + 70 + i * 40} y2={SY + 70 + i * 40} stroke={P.rule} strokeWidth={1.1} opacity={0.6 * paperUp} />
          ))}
          {seam > 0.01 && (
            <g opacity={seam}>
              <rect x={SX + SW / 2 - 50} y={SY} width={100} height={SH} fill="url(#gutter)" />
              <line x1={SX + SW / 2} x2={SX + SW / 2} y1={SY} y2={SY + SH} stroke="#9E9381" strokeWidth={1} />
            </g>
          )}
          <Hand id="p07h" x={SX + 60} y={SY + 102} text="三月十四日 晴" size={36} opacity={paperUp} />
          {stub > 0.01 && (
            <g transform={`translate(${lerp(SX + SW + 200, SX + SW - 230, stub)},${SY + 140}) rotate(${lerp(20, -6, stub)})`}>
              <Ticket x={0} y={0} w={360} h={136} bodyOpacity={0} stubDx={-120} perforation={false} />
            </g>
          )}
          {curl > 0.01 && (
            <g>
              <path d={`M${SX + SW - 80 * curl},${SY + SH} L${SX + SW},${SY + SH - 80 * curl} L${SX + SW},${SY + SH} Z`} fill="#0B1220" />
              <path d={`M${SX + SW - 80 * curl},${SY + SH} L${SX + SW},${SY + SH - 80 * curl} L${SX + SW - 76 * curl},${SY + SH - 76 * curl} Z`} fill={P.paperShade} filter="url(#shadowLow)" />
            </g>
          )}
        </g>
      </g>
      {/* 标注 */}
      {[
        {txt: '纸纹', ax: SX + 200, ay: SY + 320, lx: SX - 120, ly: SY + 380, o: labels[0]},
        {txt: '页缝', ax: SX + SW / 2, ay: SY + 30, lx: SX + SW / 2, ly: SY - 70, o: labels[1]},
        {txt: '票根', ax: SX + SW - 200, ay: SY + 150, lx: SX + SW + 150, ly: SY + 90, o: labels[2]},
        {txt: '露出的一角', ax: SX + SW - 26, ay: SY + SH - 26, lx: SX + SW + 150, ly: SY + SH + 60, o: labels[3]},
      ].map((l) =>
        l.o > 0.01 ? (
          <g key={l.txt} opacity={l.o}>
            <path d={`M${l.ax},${l.ay}L${l.lx},${l.ly + 10}`} stroke={P.accent} strokeWidth={1.2} fill="none" />
            <circle cx={l.ax} cy={l.ay} r={4} fill={P.accent} />
            <Label x={l.lx} y={l.ly} text={l.txt} o={1} size={30} color={P.accent} />
          </g>
        ) : null,
      )}
    </g>
  );
};

/* ============ P08 想留住的是哪一下（101–119s）============ */
const KEEP = [
  {kind: 'note', x: 70, y: 10},
  {kind: 'stub', x: 200, y: 120},
  {kind: 'leaf', x: 40, y: 200},
];

export const P08: React.FC<SceneProps> = ({t}) => {
  const enter = span(t, 0, 1.0, easeOut);
  const f1 = span(t, 0.8, 2.2);
  const frozen = t >= 2.6 && t < 6.2;
  const f2 = frozen ? Math.min(0.45, span(t, 2.6, 3.4) * 0.45 / 0.45) : 0;
  const strike = span(t, 3.8, 4.4);
  const fade2 = 1 - 0.7 * span(t, 4.4, 5.4);
  const back = span(t, 6.4, 7.6);
  const backActive = t >= 6.4 && t < 7.6;
  const ghost = win(t, 8.0, 11.4, 0.4, 0.8);
  const converge = span(t, 8.4, 9.8);
  const shift = span(t, 11.8, 12.8);
  const nx = lerp(960, 720, shift);
  const pw = lerp(380, 340, shift);
  const ph = lerp(500, 460, shift);
  // 右侧：数字列表的三种变化
  const listOn = span(t, 12.0, 13.0, easeOut);
  const reorder = span(t, 12.8, 13.8);
  const optimize = span(t, 14.2, 15.0);
  const vanish = span(t, 15.6, 16.4);
  const keepPage = (
    <g>
      <Hand id="p08k1" x={30} y={-ph / 2 + 100} text="三月十四日 晴" size={34} />
      <Hand id="p08k2" x={30} y={-ph / 2 + 172} text="和朋友去看演出" size={34} />
      {KEEP.map((k, i) => {
        const g = (
          <g key={i}>
            {k.kind === 'note' && <StickyNote x={k.x + 190} y={k.y + 40} rot={6} s={120} color={P.noteGreen} />}
            {k.kind === 'stub' && <Ticket x={k.x} y={k.y} w={360} h={136} rot={-4} bodyOpacity={0} stubDx={-160} perforation={false} />}
            {k.kind === 'leaf' && <Leaf x={k.x} y={k.y} rot={-10} s={0.65} />}
          </g>
        );
        return g;
      })}
    </g>
  );
  const ghosts = KEEP.map((k, i) => {
    const off = (1 - converge) * (30 + i * 14);
    const ang = i * 2.1;
    const bx = k.kind === 'note' ? k.x + 190 - 60 : k.kind === 'stub' ? k.x + 100 - 58 : k.x - 30;
    const by = k.kind === 'note' ? k.y + 40 - 60 : k.kind === 'stub' ? k.y - 68 : k.y - 26;
    const bw = k.kind === 'note' ? 120 : k.kind === 'stub' ? 116 : 110;
    const bh = k.kind === 'note' ? 120 : k.kind === 'stub' ? 136 : 60;
    return <rect key={i} x={bx + Math.cos(ang) * off - 6} y={by + Math.sin(ang) * off - 6} width={bw + 12} height={bh + 12} rx={8} fill="none" stroke={P.accent} strokeWidth={2} strokeDasharray="7 6" opacity={ghost * (converge > 0.98 ? 1 : 0.8)} />;
  });
  const items = [0, 1, 2, 3, 4];
  const order = [2, 0, 4, 1, 3];
  return (
    <g opacity={enter}>
      <Notebook
        x={nx}
        y={520}
        pw={pw}
        ph={ph}
        flip={t < 2.6 ? f1 : frozen ? f2 : backActive ? back : 0}
        dir={backActive ? -1 : 1}
        flipLevel={frozen ? fade2 : 1}
        left={t >= 7.6 || backActive ? <PageNotes id="p08l" lines={['和朋友去看演出', '第 7 排 12 座']} ph={ph} /> : <PageNotes id="p08l0" lines={['今天加班到很晚']} ph={ph} />}
        right={t >= 7.6 ? keepPage : <PageNotes id="p08r0" lines={['想念海边', '要早点睡']} ph={ph} month="11月" />}
        flipFront={<PageNotes id="p08ff" lines={backActive ? ['和朋友去看演出'] : ['想念海边']} ph={ph} />}
        flipBack={backActive ? keepPage : <PageNotes id="p08fb" lines={['买了新的笔']} ph={ph} />}
        curl={t >= 7.6 ? 0.7 : 0}
      />
      {/* 冻结的翻页被划掉 */}
      {frozen && strike > 0 && (
        <g>
          <Strike x1={nx + 30} x2={nx + pw - 20} y={430} draw={strike} color={P.alert} seed={9} width={4} />
          <Strike x1={nx + 30} x2={nx + pw - 20} y={470} draw={span(t, 4.0, 4.6)} color={P.alert} seed={12} width={4} />
        </g>
      )}
      {/* 回到原处的虚线框 */}
      {ghost > 0.01 && <g transform={`translate(${nx},520)`}>{ghosts}</g>}
      {converge > 0.98 && ghost > 0.01 && (
        <circle cx={nx + 180} cy={520} r={260 * span(t, 9.8, 10.8)} fill="none" stroke={P.accent} strokeWidth={2} opacity={(1 - span(t, 9.8, 10.8)) * 0.6} />
      )}
      {/* 数字列表：重新排序 / 被优化 / 消失 */}
      {listOn > 0.01 && (
        <g opacity={listOn} transform={`translate(${(1 - listOn) * 200},0)`}>
          <Phone id="p08" x={1480} y={520} w={330} h={640}>
            {items.map((it) => {
              const from = it;
              const to = order.indexOf(it);
              const slot = lerp(from, to, reorder);
              const y = 100 + slot * 92;
              const gone = it === 3 ? vanish : 0;
              const opt = it === 1 ? optimize : 0;
              return (
                <g key={it} opacity={1 - gone} transform={`translate(${gone * 120},0)`}>
                  {opt > 0.01 && <rect x={10} y={y - 6} width={286} height={78} rx={18} fill="none" stroke={P.alert} strokeWidth={2} opacity={opt} />}
                  <NotifCard x={14} y={y} w={278} seed={it + 60 + (opt > 0.5 ? 9 : 0)} />
                </g>
              );
            })}
          </Phone>
          <Label x={1720} y={300} text="重新排序" o={win(t, 12.8, 17.6, 0.3, 0.6)} color={P.screenText} size={26} anchor="start" />
          <Label x={1720} y={450} text="被优化" o={win(t, 14.2, 17.6, 0.3, 0.6)} color={P.screenText} size={26} anchor="start" />
          <Label x={1720} y={600} text="消失" o={win(t, 15.6, 17.6, 0.3, 0.6)} color={P.alert} size={26} anchor="start" />
        </g>
      )}
    </g>
  );
};

/* ============ P09 我没有记忆（119–136s）============ */
export const P09: React.FC<SceneProps> = ({t}) => {
  const enter = span(t, 0, 1.0, easeOut);
  const bubblesGone = span(t, 5.8, 7.6);
  const collapse = span(t, 7.6, 8.6);
  const fresh = span(t, 9.2, 10.0);
  const night = win(t, 6.0, 12.6, 1.6, 2.0);
  const clock = t < 9 ? '22:00' : '07:00';
  const paperGlow = win(t, 11.2, 17.2, 0.8, 0.6);
  const bubbles = [
    {r: true, w: 0.7},
    {r: false, w: 0.85},
    {r: true, w: 0.5},
    {r: false, w: 0.9},
    {r: false, w: 0.6},
    {r: true, w: 0.75},
  ];
  const WX = 330;
  const WY = 190;
  const WW = 560;
  const WH = 620;
  return (
    <g opacity={enter}>
      {/* 对话窗口 */}
      {collapse < 1 && (
        <g transform={`translate(${WX + WW / 2},${WY + WH / 2}) scale(1,${1 - collapse * 0.995}) translate(${-(WX + WW / 2)},${-(WY + WH / 2)})`}>
          <rect x={WX - 50} y={WY - 50} width={WW + 100} height={WH + 100} rx={60} fill="url(#screenGlow)" opacity={0.6} />
          <rect x={WX} y={WY} width={WW} height={WH} rx={24} fill="#06090D" stroke="#2A2E33" strokeWidth={2} filter="url(#shadow)" />
          <rect x={WX + 10} y={WY + 10} width={WW - 20} height={WH - 20} rx={16} fill="url(#screenGrad)" />
          <rect x={WX + 10} y={WY + 10} width={WW - 20} height={54} rx={16} fill="#0E1D33" />
          {[0, 1, 2].map((k) => (
            <circle key={k} cx={WX + 40 + k * 22} cy={WY + 37} r={6} fill={['#E0604F', '#E5B25C', '#58B38C'][k]} opacity={0.8} />
          ))}
          {bubbles.map((b, i) => {
            const vanish = clamp01(bubblesGone * 6 - (bubbles.length - 1 - i));
            const bw = (WW - 120) * b.w;
            const bx = b.r ? WX + WW - 40 - bw : WX + 40;
            const by = WY + 90 + i * 86;
            return (
              <g key={i} opacity={1 - vanish}>
                <rect x={bx} y={by} width={bw} height={62} rx={20} fill={b.r ? '#2D5DA8' : '#1B2B42'} />
                <rect x={bx + 20} y={by + 18} width={bw * 0.7} height={8} rx={4} fill={P.screenText} opacity={0.8} />
                <rect x={bx + 20} y={by + 36} width={bw * 0.45} height={7} rx={3.5} fill={P.screenText} opacity={0.4} />
              </g>
            );
          })}
        </g>
      )}
      {fresh > 0.01 && (
        <g opacity={fresh}>
          <rect x={WX} y={WY} width={WW} height={WH} rx={24} fill="#06090D" stroke="#2A2E33" strokeWidth={2} filter="url(#shadow)" />
          <rect x={WX + 10} y={WY + 10} width={WW - 20} height={WH - 20} rx={16} fill="url(#screenGrad)" />
          <rect x={WX + 30} y={WY + WH - 90} width={WW - 60} height={60} rx={30} fill="#13243B" />
          {Math.floor(t * 2) % 2 === 0 && <rect x={WX + 60} y={WY + WH - 74} width={3} height={28} fill={P.screenText} />}
          <ScreenText x={WX + WW / 2 - 70} y={WY + WH / 2} text="新的对话" size={32} opacity={0.5} />
        </g>
      )}
      {/* 纸：整夜都在原处 */}
      {paperGlow > 0.01 && <rect x={1080} y={150} width={560} height={720} rx={10} fill="none" stroke={P.accent} strokeWidth={10} opacity={0.25 * paperGlow} filter="url(#blurFg)" />}
      <Sheet x={1360} y={510} w={480} h={640} rot={4} seed={1} crease={1}>
        <Hand id="p09a" x={84} y={58} text="三月十四日 晴" size={40} />
        <Hand id="p09b" x={84} y={172} text="我们周五见" size={44} />
        <Strike x1={84 + 86} x2={84 + 86 + 90} y={158} seed={3} />
        <Hand id="p09c" x={84 + 90} y={124} text="周六" size={36} />
        <Hand id="p09d" x={84} y={286} text="记得带伞" size={40} color={P.pencil} />
      </Sheet>
      <text x={1360} y={900} textAnchor="middle" fontFamily={FONTS.body} fontSize={26} fill={P.text} opacity={0.6 + 0.4 * night}>
        {clock}
      </text>
    </g>
  );
};

export const nightOf = (t: number) => win(t, 6.0, 12.6, 1.6, 2.0);

/* ============ P10 结尾（136–150s）============ */
export const P10: React.FC<SceneProps> = ({t}) => {
  const close = span(t, 1.6, 3.2);
  const boxIn = span(t, 2.6, 3.6);
  const title = win(t, 4.0, 13.4, 1.0, 1.0);
  const f1 = win(t, 6.4, 13.4, 1.0, 1.0);
  const f2 = win(t, 7.4, 13.4, 1.0, 1.0);
  return (
    <g>
      {boxIn < 1 && (
        <g opacity={1 - boxIn} transform={`translate(${960 + close * 180},470) scale(${1 - close * 0.5},${1 - close * 0.1}) translate(-960,-470)`}>
          <Notebook x={960} y={470} pw={360} ph={470} right={<PageNotes id="p10r" lines={['三月十四日 晴']} ph={470} />} left={<PageNotes id="p10l" lines={['和朋友去看演出']} ph={470} />} />
        </g>
      )}
      {boxIn > 0.01 && <NotebookBox x={960} y={450} w={300} h={400} pages={160} stub={boxIn} level={boxIn} />}
      <Pen x={1520} y={520} rot={-70} len={380} />
      <text x={960} y={128} textAnchor="middle" fontFamily={FONTS.title} fontSize={32} letterSpacing={18} fill={P.text} opacity={title * 0.85}>
        舍不得纸
      </text>
      <text x={960} y={800} textAnchor="middle" fontFamily={FONTS.title} fontSize={46} letterSpacing={6} fill={P.text} opacity={f1}>
        人放下的东西，
      </text>
      <text x={960} y={872} textAnchor="middle" fontFamily={FONTS.title} fontSize={46} letterSpacing={6} fill={P.text} opacity={f2}>
        在他们不在的时候，也好好待在那儿。
      </text>
    </g>
  );
};

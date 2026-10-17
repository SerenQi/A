// 《忒修斯之船》制作参数 —— 时长、场景边界、配色、字体、字幕、音乐都集中在这里。

export const FPS = 30;
export const W = 1920;
export const H = 1080;
export const DURATION_S = 165;
export const DURATION = DURATION_S * FPS; // 4950

/** 秒 → 帧 */
export const f = (s: number) => Math.round(s * FPS);

/** 安全区（6%） */
export const SAFE = {x: Math.round(W * 0.06), y: Math.round(H * 0.06)};

// 场景边界（秒）。每场都有 enter / mainAction / hold / exit 四段，见各图层实现。
export const SCENES = [
  {id: 'S01', from: 0, to: 9, name: '遇到问题'},
  {id: 'S02', from: 9, to: 20, name: '身份锚点'},
  {id: 'S03', from: 20, to: 34, name: '第一块木板'},
  {id: 'S04', from: 34, to: 48, name: '一块又一块'},
  {id: 'S05', from: 48, to: 60, name: '最后一块'},
  {id: 'S06', from: 60, to: 75, name: '第一个问题'},
  {id: 'S07', from: 75, to: 93, name: '旧料成船'},
  {id: 'S08', from: 93, to: 110, name: '两种直觉'},
  {id: 'S09', from: 110, to: 128, name: '由船到人'},
  {id: 'S10', from: 128, to: 149, name: '用什么认出它'},
  {id: 'S11', from: 149, to: 165, name: '回到开头'},
] as const;

export const PALETTE = {
  bg: '#080A0B',
  fog: 'rgba(216,221,218,0.035)',
  line: '#D8DDDA', // 船轮廓与正文
  inner: '#59615E', // 内部结构
  oldWood: '#697672',
  newWood: '#C4D7D1',
  accent: '#C9B784', // 局部强调（≤5% 画面）
  conflict: '#9E5752', // 冲突 / 缺口
  warm: '#C9B784', // 仅结尾使用的暖光
};

export const STROKE = {main: 1.8, inner: 0.8, fine: 0.6};

export const FONTS = {
  // 标题：思源宋体；字幕：思源黑体。均来自 @fontsource，本地打包，可重现。
  title: '"Noto Serif SC", serif',
  body: '"Noto Sans SC", sans-serif',
};

export const SUBTITLE = {baseline: 980, size: 38, maxCharsPerLine: 26, color: PALETTE.line};

export type Cue = {from: number; to: number; text: string};

/** 字幕（秒）。整句淡入淡出，每条 ≤ 两行。 */
export const CUES: Cue[] = [
  {from: 1.0, to: 4.7, text: '如果一艘船的木板，被一块一块换掉。'},
  {from: 5.0, to: 8.8, text: '最后，它还是原来那艘船吗？'},
  {from: 9.6, to: 14.0, text: '这就是忒修斯之船的问题。'},
  {from: 14.3, to: 19.6, text: '人们保存一艘旧船，让它的名字与形状，一直延续下去。'},
  {from: 20.4, to: 26.4, text: '一块木板腐朽了，就拆下它，换上一块新的。'},
  {from: 27.4, to: 33.6, text: '船仍然能航行，名字也没有改变。'},
  {from: 34.5, to: 38.6, text: '后来，又换一块，再换一块。'},
  {from: 39.0, to: 47.6, text: '变化每次都很小，小到你很难指出，它在哪一刻不再是它。'},
  {from: 48.4, to: 53.8, text: '直到有一天，最后一块原来的木板，也被换掉了。'},
  {from: 54.2, to: 59.6, text: '形状还在，名字还在。原来的材料，却一块也不剩。'},
  {from: 60.6, to: 66.6, text: '你会说，这仍然是同一艘船吗？'},
  {from: 67.0, to: 74.6, text: '如果是，让它保持不变的，到底是什么？'},
  {from: 75.6, to: 80.4, text: '再把问题推进一步。'},
  {from: 80.8, to: 86.6, text: '有人收集所有拆下的旧木板，按原样，重新拼成另一艘船。'},
  {from: 87.0, to: 92.6, text: '现在，材料回来了，却出现了两艘船。'},
  {from: 93.6, to: 101.0, text: '如果你看重材料，旧木板拼成的那艘，更像原船。'},
  {from: 101.4, to: 109.6, text: '如果你看重一路延续的经历，一直被维修的那艘，又更像原船。'},
  {from: 110.6, to: 114.8, text: '这道问题，也会落到你身上。'},
  {from: 115.1, to: 121.0, text: '身体在变化，想法在变化，记忆也会被重新理解。'},
  {from: 121.4, to: 127.6, text: '多年前的你，和现在的你，为什么仍被叫作同一个人？'},
  {from: 129.0, to: 136.0, text: '也许你在意的是材料，也许是形状，也许是记忆与经历的连续。'},
  {from: 136.4, to: 141.6, text: '不同的标准，会把答案指向不同的地方。'},
  {from: 142.0, to: 148.6, text: '问题并不只是东西变没变，而是：我们用什么，认出它还是它？'},
  {from: 150.0, to: 155.8, text: '当组成你的部分，一直在改变。'},
];

/** 画面内的少量文字 */
export const ONSCREEN = {
  openingQuestion: '它还是原来那艘船吗？',
  shipName: '忒修斯之船',
  labelA: '持续维修',
  labelB: '原木重组',
  labelOriginal: '原船',
  finalQuestion: '是什么，让你成为你？',
  title: '忒修斯之船',
};

/**
 * 音乐。
 * track: 选定的参考音轨（'A' | 'B' | 'C'），null 表示尚未选择 → 只出画面预览，不挂音频。
 * file: public/ 下的候选伴奏（htdemucs 分离出的 no_vocals）。
 * startFrom: 从原音轨第几秒开始取段（保持原速、原音高）。
 */
export const MUSIC = {
  track: null as null | 'A' | 'B' | 'C',
  files: {
    A: 'audio/bgm_A_hell_no_vocals.wav',
    B: 'audio/bgm_B_entropy_no_vocals.wav',
    C: 'audio/bgm_C_nihilism_no_vocals.wav',
  },
  startFrom: 0,
  /** 伴奏电平（线性）。目前无旁白，只是全程统一电平。 */
  level: 0.85,
  fadeIn: [0, 1.2] as const,
  fadeOut: [161, 165] as const,
};

export const ALL_TEXT = Array.from(
  new Set([...CUES.map((c) => c.text), ...Object.values(ONSCREEN), 'AB0123456789'].join('')),
).join('');

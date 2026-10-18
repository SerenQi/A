// 《豪猪寓言 · 为什么越亲近的人，越容易伤到你？》制作参数。

export const FPS = 30;
export const W = 1920;
export const H = 1080;
export const DURATION_S = 165;
export const DURATION = DURATION_S * FPS; // 4950

export const SCENES = {
  S1: [0, 5], // 标题：雪夜里的两只豪猪
  S2: [5, 15.6], // 陌生人的话 vs 妈妈的话
  S3: [15.6, 24], // 1851 年的寓言 + 二十四年的悬念
  S4: [24, 54], // 寓言本身：靠近、扎疼、分开、再靠近
  S5: [54, 72], // 第一层：刺只有那么长
  S6: [72, 92], // 第二层：弗洛伊德的“沉淀”
  S7: [92, 99], // 第三层：每只豪猪都有刺
  S8: [99, 111], // 叔本华的答案：礼貌的距离、远离人群
  S9: [111, 127.7], // 他和母亲：二十四年
  S10: [127.7, 137], // 寓言里的豪猪没有分开
  S11: [137, 165], // 试出来的距离 → 陌生人
} as const;

export const PALETTE = {
  bg: '#06080C',
  night: '#0B1018',
  snow: '#E8EEF5',
  cold: '#7FB4E6',
  ice: '#BFE3FF',
  warm: '#F2A65A',
  ember: '#FFCF8A',
  red: '#E5483C',
  gold: '#E8C27A',
  text: '#F3F0EA',
  dim: '#8A8C92',
  paper: '#E9E3D6',
  ink: '#1D1B19',
  body: '#120E0B',
};

export const FONTS = {
  title: '"Noto Serif SC", serif',
  body: '"Noto Serif SC", serif',
  sans: '"Noto Sans SC", sans-serif',
};

export const SUBTITLE = {baseline: 985, size: 36, maxCharsPerLine: 26, color: PALETTE.text, highlight: PALETTE.red};

export type Cue = {from: number; to: number; text: string};

/** 字幕（秒）。**…** 内的词标红 */
export const CUES: Cue[] = [
  {from: 5.4, to: 8.6, text: '陌生人一句难听的话，转头就忘了。'},
  {from: 8.9, to: 12.4, text: '妈妈随口一句“你怎么又胖了”，却能记好多年。'},
  {from: 12.7, to: 15.6, text: '伤得最深的，偏偏是**最亲的人**。'},
  {from: 15.9, to: 19.6, text: '1851年，叔本华写过一群豪猪的寓言。'},
  {from: 19.9, to: 23.8, text: '而他自己给出的答案，让他和母亲**二十四年没再见面**。'},

  {from: 24.6, to: 27.4, text: '冬天，一群豪猪冻得发抖。'},
  {from: 27.7, to: 30.6, text: '它们挤到一起，想靠彼此的体温**取暖**。'},
  {from: 30.9, to: 33.0, text: '可一靠近，就被对方的**刺**扎疼了。'},
  {from: 33.3, to: 35.6, text: '于是它们分开。'},
  {from: 35.9, to: 38.6, text: '分开，又冷得受不了，只好再凑回去。'},
  {from: 38.9, to: 41.8, text: '再被扎，再分开。来来回回，好几次。'},
  {from: 42.1, to: 46.0, text: '最后，它们找到了一个距离——'},
  {from: 46.3, to: 50.6, text: '叔本华的原话是：在那里，它们“**最能忍受**”。'},
  {from: 50.9, to: 53.6, text: '不是最舒服，是最能忍受。'},

  {from: 54.4, to: 57.4, text: '为什么越近，越疼？'},
  {from: 57.7, to: 61.0, text: '先看最简单的一层：**刺只有那么长**。'},
  {from: 61.3, to: 64.6, text: '站得远的，刺根本够不着。'},
  {from: 64.9, to: 68.6, text: '陌生人的话伤不了人，不是不锋利，是**离得远**。'},
  {from: 68.9, to: 71.8, text: '能扎进来的，只有被允许走近的人。'},

  {from: 72.4, to: 75.0, text: '第二层，更扎心。'},
  {from: 75.3, to: 79.2, text: '七十年后，弗洛伊德在书里引用了这群豪猪。'},
  {from: 79.5, to: 83.6, text: '他说，几乎每一段长久的亲密关系——婚姻、友谊、父母和孩子——'},
  {from: 83.9, to: 87.6, text: '底下都沉着一层**反感和敌意**，只是被压了下去。'},
  {from: 87.9, to: 91.6, text: '靠得越近，期待越多；期待越多，**失望越多**。'},

  {from: 92.4, to: 95.2, text: '还有一层最容易忘：**每只豪猪身上都有刺**。'},
  {from: 95.5, to: 98.6, text: '疼的那一方，往往也正扎着别人。'},

  {from: 99.4, to: 102.0, text: '那么，该怎么办？'},
  {from: 102.3, to: 105.8, text: '叔本华说，那个适中的距离，就是**礼貌**和体面。'},
  {from: 106.1, to: 110.6, text: '他还说：内心足够温暖的人，宁可**远离人群**，不给人添堵，也不受人的气。'},

  {from: 111.2, to: 113.4, text: '他真的这么做了。'},
  {from: 113.7, to: 117.2, text: '1814年，他和母亲大吵一架，离开了魏玛。'},
  {from: 117.5, to: 120.8, text: '此后二十四年，直到母亲去世——'},
  {from: 124.3, to: 127.6, text: '他后半生独居法兰克福，常年陪着他的，是一只卷毛狗。'},

  {from: 127.9, to: 130.6, text: '离得足够远，确实不会再被扎了。'},
  {from: 130.9, to: 133.6, text: '可寓言里的豪猪，**没有选择分开**。'},
  {from: 133.9, to: 136.6, text: '因为冬天是真的，冷也是真的。'},

  {from: 137.4, to: 140.6, text: '那个“最能忍受”的距离，不是算出来的，'},
  {from: 140.9, to: 144.4, text: '是一次次被扎疼、又一次次退开，**试出来的**。'},
  {from: 144.7, to: 148.0, text: '所以，越亲近的人，越容易伤到人——'},
  {from: 148.3, to: 151.8, text: '因为只有走得足够近，**刺才够得着**。'},
  {from: 152.1, to: 155.0, text: '疼，说明还在靠近。'},
  {from: 155.4, to: 158.4, text: '而永远不会被扎的距离——'},
];

/** 整屏大字（秒）：全片只留三处 */
export const SLAMS = [
  {from: 0.4, to: 5.0, text: '为什么越亲近的人，越容易伤到你？', size: 84, kind: 'title'},
  {from: 121.0, to: 124.1, text: '两人再没见过面。', size: 100, kind: 'soft'},
  {from: 158.6, to: 162.4, text: '叫作陌生人。', size: 120, kind: 'soft'},
] as const;

export const ONSCREEN = {
  kicker: '豪猪寓言',
  question: '为什么越亲近的人，越容易伤人？',
  sources: [
    {from: 0.8, to: 72.2, text: '叔本华《附录与补遗》· 1851'},
    {from: 72.2, to: 92.2, text: '弗洛伊德《群体心理学与自我的分析》· 1921'},
    {from: 92.2, to: 162, text: '叔本华《附录与补遗》· 1851'},
  ],
  hook: ['难听的话', '你怎么又胖了', '3 年后', '还记得', '陌生人', '妈妈'],
  book: ['Parerga und Paralipomena', '1851', '附录与补遗', '24'],
  fable: ['取暖', '扎疼', '冷', '最能忍受', 'mäßige Entfernung', '距离'],
  layers: ['刺的长度', '够不着', '扎得到', '婚姻', '友谊', '父母和孩子', '反感', '敌意', '期待', '失望', 'Massenpsychologie und Ich-Analyse', '1921'],
  answer: ['礼貌', '体面', 'Keep your distance', '内心的温暖'],
  life: ['魏玛', '法兰克福', '1814', '1838', '约翰娜', '叔本华', '年'],
  end: ['试', '豪猪寓言', '叔本华《附录与补遗》，1851'],
};

/** 冲击点：只做轻微的震动 */
export const IMPACTS = [
  {t: 0.5, power: 0.5, flash: 0.35},
  {t: 31.0, power: 0.35, flash: 0},
  {t: 39.0, power: 0.25, flash: 0},
  {t: 121.0, power: 0.25, flash: 0},
  {t: 158.6, power: 0.35, flash: 0.25},
];

export const MUSIC = {
  file: 'audio/bgm_A_hell_no_vocals.wav',
  startFrom: 0,
  level: 0.65,
  fadeIn: [0, 1.2] as const,
  fadeOut: [161, 165] as const,
};

const flat = (v: unknown): string[] =>
  typeof v === 'string' ? [v] : Array.isArray(v) ? v.flatMap(flat) : v && typeof v === 'object' ? Object.values(v).flatMap(flat) : [];

export const ALL_TEXT = Array.from(
  new Set([...CUES.map((c) => c.text.replace(/\*\*/g, '')), ...SLAMS.map((s) => s.text), ...flat(ONSCREEN), '0123456789·—《》，'].join('')),
).join('');

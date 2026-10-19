// 《蝴蝶效应 · 只差了 0.000127》制作参数。

export const FPS = 30;
export const W = 1920;
export const H = 1080;
export const DURATION_S = 165;
export const DURATION = DURATION_S * FPS; // 4950

export const SCENES = {
  S1: [0, 12.6], // 晴天预报 → 暴雨 → 超级计算机 → 小数点
  S2: [12.6, 17.8], // 标题
  S3: [17.8, 30.3], // 世界像一台钟
  S4: [30.3, 62.2], // 抄错的数字、咖啡、两条曲线
  S5: [62.2, 96.3], // 一束分叉的轨迹、钟碎了、巴西的蝴蝶
  S6: [96.3, 136.3], // 洛伦兹吸引子：混沌不是随机
  S7: [136.3, 165], // 算不准，但有形状
} as const;

export const PALETTE = {
  bg: '#05060A',
  gold: '#E8C27A',
  ember: '#FFD39A',
  warm: '#F2A65A',
  red: '#E5483C',
  cold: '#7FB4E6',
  ice: '#BFE3FF',
  green: '#8FE3B0',
  text: '#F3F0EA',
  dim: '#7E8088',
  faint: '#2A2C33',
  paper: '#E9E3D6',
  ink: '#1D1B19',
};

export const FONTS = {
  title: '"Noto Serif SC", serif',
  body: '"Noto Serif SC", serif',
  sans: '"Noto Sans SC", sans-serif',
};

export const SUBTITLE = {baseline: 968, size: 44, maxCharsPerLine: 24, color: PALETTE.text, highlight: PALETTE.red};

export type Cue = {from: number; to: number; text: string; en?: string};

/** 字幕（秒）。**…** 内的词标红；en 为下方的英文 */
export const CUES: Cue[] = [
  {from: 0.4, to: 3.2, text: '天气预报说明天晴，结果下了一场暴雨。', en: 'The forecast said sunny. It poured.'},
  {from: 3.5, to: 5.4, text: '不是气象台不努力——', en: 'Not for lack of trying —'},
  {from: 5.7, to: 9.2, text: '再强的超级计算机，也算不准**两周以后**的天。', en: 'no supercomputer can see the weather two weeks ahead.'},
  {from: 9.5, to: 12.4, text: '原因，藏在小数点后面。', en: 'The reason hides behind a decimal point.'},

  {from: 18.0, to: 21.4, text: '很长一段时间里，人们相信世界像一台精密的钟。', en: 'For a long time, people believed the world ran like a clock.'},
  {from: 21.7, to: 24.0, text: '只要知道此刻的一切，', en: 'Know everything about this moment,'},
  {from: 24.3, to: 27.2, text: '就能算出明天、明年，甚至一百年后。', en: 'and you could work out tomorrow, next year, a century on.'},
  {from: 27.5, to: 30.0, text: '算不准，只是因为知道得还不够多。', en: 'Getting it wrong only meant knowing too little.'},

  {from: 30.6, to: 33.6, text: '直到一个气象学家，在电脑上模拟天气。', en: 'Then a meteorologist ran a weather simulation.'},
  {from: 33.9, to: 37.6, text: '为了省时间，他把上次算到一半的数，重新输了进去。', en: 'To save time, he re-entered numbers from a half-finished run.'},
  {from: 37.9, to: 42.0, text: '原来的数是 0.506127，他只抄了前三位：**0.506**。', en: 'The value was 0.506127. He typed only 0.506.'},
  {from: 42.3, to: 45.2, text: '差了不到万分之二，谁会在乎呢？', en: 'Off by less than two ten-thousandths. Who would care?'},
  {from: 45.5, to: 47.6, text: '他去倒了杯咖啡。', en: 'He went to get a coffee.'},
  {from: 47.9, to: 49.6, text: '回来的时候——', en: 'When he came back —'},
  {from: 49.9, to: 53.0, text: '两条天气曲线，一开始几乎重合，', en: 'the two weather curves started out almost as one,'},
  {from: 53.3, to: 55.4, text: '然后慢慢分开，', en: 'then slowly drifted apart,'},
  {from: 55.7, to: 59.4, text: '最后，**完全是两种天气**。', en: 'and ended as two entirely different skies.'},

  {from: 62.4, to: 65.0, text: '方程没变，电脑也没出错。', en: 'The equations were the same. The computer made no error.'},
  {from: 65.3, to: 68.8, text: '只是开头差了一点点，结果就**天差地别**。', en: 'A tiny difference at the start became a world apart.'},
  {from: 69.1, to: 72.8, text: '而现实里，没有人能把每一缕风都测得分毫不差。', en: 'And no one can measure every breath of wind exactly.'},
  {from: 73.1, to: 76.4, text: '所以再强的计算机，也算不准太远的天气。', en: 'So no computer can forecast too far ahead.'},
  {from: 76.7, to: 78.6, text: '不是知道得不够多——', en: "It isn't that we know too little —"},
  {from: 83.0, to: 86.6, text: '后来，这个现象有了名字，来自一场演讲的题目：', en: 'Later it got a name, from the title of a talk:'},
  {from: 86.9, to: 92.6, text: '巴西一只蝴蝶扇动翅膀，会不会在得克萨斯引发一场龙卷风？', en: "Does the flap of a butterfly's wings in Brazil set off a tornado in Texas?"},

  {from: 96.6, to: 99.2, text: '但大多数人，只记住了一半。', en: 'But most people remember only half of it.'},
  {from: 99.5, to: 102.6, text: '他又把一组更简单的方程画了出来——', en: 'He drew out a simpler set of equations —'},
  {from: 102.9, to: 107.0, text: '那条轨迹永远不重复，下一步落在哪里，谁也算不准；', en: 'the path never repeats; no one can say where it goes next;'},
  {from: 107.3, to: 109.6, text: '可它**从来不会乱跑**。', en: 'yet it never wanders off.'},
  {from: 109.9, to: 113.0, text: '它始终绕着同一个形状转，', en: 'It keeps circling the same shape,'},
  {from: 113.3, to: 115.4, text: '像一对翅膀。', en: 'like a pair of wings.'},
  {from: 120.8, to: 125.0, text: '每一步都无法预测，整体却**有形状**。', en: 'Every step unpredictable. The whole has a shape.'},

  {from: 136.6, to: 139.0, text: '人生大概也是这样。', en: 'Life is probably like that.'},
  {from: 139.3, to: 142.6, text: '没有人算得出，十年后的自己会在哪里。', en: 'No one can work out where they will be in ten years.'},
  {from: 142.9, to: 147.6, text: '一次偶然的相遇，一句随口的话，都可能让轨迹拐向另一边。', en: 'A chance meeting, a passing remark, can bend the path.'},
  {from: 147.9, to: 149.8, text: '可那个形状——', en: 'But the shape —'},
  {from: 150.1, to: 154.0, text: '是每天的选择，一点点画出来的。', en: 'is drawn, little by little, by everyday choices.'},
];

/** 不再用整屏震动大字 */
export const SLAMS: {from: number; to: number; text: string; size: number; kind: string}[] = [];

/** 画面中央的大字（不震动） */
export const WORDS = [
  {from: 78.8, to: 82.7, text: '是这个世界，本来就算不准。', color: PALETTE.text, en: 'The world itself cannot be predicted.'},
  {from: 116.0, to: 120.5, text: '混沌，不是随机。', color: PALETTE.ember, en: 'Chaos is not randomness.'},
];

export const ONSCREEN = {
  title: '蝴蝶效应',
  en: 'THE BUTTERFLY EFFECT',
  sub: '只差了 0.000127',
  question: '为什么，永远算不准？',
  forecast: ['明天', '晴', '26°', '暴雨', '天气预报'],
  days: ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12', '13', '14', '天', '两周'],
  clock: ['明天', '明年', '一百年后'],
  numbers: ['0.506127', '0.506', '0.000127', '咖啡'],
  globe: ['巴西', '得克萨斯'],
  label: ['洛伦兹吸引子', 'LORENZ ATTRACTOR'],
  end: ['算不准，但有形状。', 'Unpredictable — but it has a shape.'],
  kicker: '',
  hook: '为什么天气预报，总是算不准？',
  cover: ['天气，就再也算不准了', '只差了'],
};

/** 冲击点：只做轻微的震动 */
export const IMPACTS = [
  {t: 1.9, power: 0.3, flash: 0.35},
  {t: 12.7, power: 0.3, flash: 0.25},
  {t: 55.7, power: 0.25, flash: 0},
  {t: 78.8, power: 0.3, flash: 0},
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
  new Set([...CUES.map((c) => c.text.replace(/\*\*/g, '')), ...WORDS.map((w) => w.text), ...flat(ONSCREEN), '0123456789·—“”：，。&'].join('')),
).join('');

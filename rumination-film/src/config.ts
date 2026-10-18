// 《反刍思维 · 人为什么会停不下来地内耗？》制作参数。

export const FPS = 30;
export const W = 1920;
export const H = 1080;
export const DURATION_S = 165;
export const DURATION = DURATION_S * FPS; // 4950

export const SCENES = {
  R1: [0, 12.8], // 凌晨三点 / 没回的消息 / 三年前的尴尬 / 越想越清醒
  R2: [12.8, 17.4], // 标题
  R3: [17.4, 28.4], // 牛的反刍 → 人脑里的循环
  R4: [28.4, 41.6], // 绕着答案转圈
  R5: [41.6, 73.8], // 实验：八分钟、心情、办法
  R6: [73.8, 98], // 长得太像思考：少了下一步，原地打转
  R7: [98, 132.4], // 出口：从“为什么”到“怎么做”
  R8: [132.4, 165], // 凌晨三点，再来一次
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

export const SUBTITLE = {baseline: 1000, size: 48, maxCharsPerLine: 22, color: PALETTE.text, highlight: PALETTE.red};

export type Cue = {from: number; to: number; text: string};

/** 字幕（秒）。**…** 内的词标红 */
export const CUES: Cue[] = [
  {from: 0.3, to: 3.2, text: '凌晨三点，还在想白天说错的那句话。'},
  {from: 3.5, to: 6.4, text: '一条没回的消息，翻来覆去想了一整晚。'},
  {from: 6.7, to: 9.4, text: '三年前的尴尬，洗澡时突然又冒出来。'},
  {from: 9.7, to: 10.9, text: '越想越清醒，'},

  {from: 17.6, to: 20.6, text: '牛吃草，会把咽下去的草倒回嘴里，再嚼一遍。'},
  {from: 20.9, to: 22.6, text: '这叫**反刍**。'},
  {from: 22.9, to: 24.6, text: '人也会这样——'},
  {from: 24.9, to: 28.0, text: '把一件事，一遍遍倒回脑子里嚼。'},

  {from: 28.6, to: 31.0, text: '嚼的人，通常觉得自己在干正事。'},
  {from: 31.3, to: 33.8, text: '“再想想，就能想明白。”'},
  {from: 34.1, to: 37.0, text: '“想清楚为什么，下次就不会了。”'},
  {from: 37.3, to: 41.0, text: '可多嚼一遍，真的离**答案**更近吗？'},

  {from: 41.8, to: 44.6, text: '九十年代，心理学家做过一个实验。'},
  {from: 44.9, to: 48.6, text: '找来一群情绪低落的人，分两组，各想八分钟。'},
  {from: 48.9, to: 52.0, text: '一组想自己：为什么会这样？现在什么感受？'},
  {from: 52.3, to: 54.8, text: '另一组，想些不相干的画面。'},
  {from: 55.1, to: 57.0, text: '八分钟后——'},
  {from: 57.3, to: 60.0, text: '想自己的那组，**更难受了**。'},
  {from: 60.3, to: 63.4, text: '想别的那组，心情**反而好了些**。'},
  {from: 63.7, to: 65.6, text: '还有更扎心的：'},
  {from: 65.9, to: 68.6, text: '让反刍过的人去解决难题，'},
  {from: 68.9, to: 70.5, text: '他们想出的办法——'},

  {from: 74.0, to: 76.4, text: '那为什么还停不下来？'},
  {from: 76.7, to: 79.6, text: '因为反刍，长得**太像思考**了。'},
  {from: 79.9, to: 82.4, text: '它有问题：“为什么是我？”'},
  {from: 82.7, to: 85.4, text: '它有复盘：“要是当时……”'},
  {from: 85.7, to: 88.6, text: '唯独少了一样东西：**下一步**。'},
  {from: 88.9, to: 90.9, text: '大脑以为在解题，其实在——'},

  {from: 98.4, to: 101.8, text: '后来的研究发现，差别不在想不想，在**怎么想**。'},
  {from: 102.1, to: 105.4, text: '一直问“为什么”，越问越往下沉；'},
  {from: 105.7, to: 109.2, text: '换成问“具体怎么做”，脑子才开始**往前走**。'},
  {from: 109.5, to: 111.6, text: '同一句说错的话——'},
  {from: 111.9, to: 114.6, text: '一种想法是：“我怎么这么蠢。”'},
  {from: 114.9, to: 118.0, text: '另一种是：“明天发条消息，解释一下。”'},
  {from: 118.3, to: 121.4, text: '前一种，嚼一千遍还是那口草；'},
  {from: 121.7, to: 124.4, text: '后一种，**咽下去，就过去了**。'},
  {from: 124.7, to: 127.6, text: '实在停不下来，就先起身：'},
  {from: 127.9, to: 131.6, text: '走一圈，洗个碗，让脑子换个地方待着。'},

  {from: 133.0, to: 136.4, text: '凌晨三点，那句话又冒出来了。'},
  {from: 136.7, to: 139.4, text: '这一次，不问它为什么，'},
  {from: 139.7, to: 143.0, text: '问它：明天，**能做点什么**？'},
];

/** 整屏大字：只有标题 */
export const SLAMS: {from: number; to: number; text: string; size: number; kind: string}[] = [];

/** 画面中央的大字（不震动） */
export const WORDS = [
  {from: 10.9, to: 12.7, text: '越想越难受。', color: PALETTE.text},
  {from: 70.6, to: 73.6, text: '反而更差。', color: PALETTE.red},
  {from: 91.0, to: 95.4, text: '原地打转。', color: PALETTE.red},
];

export const ONSCREEN = {
  kicker: '人为什么会停不下来地内耗？',
  en: 'RUMINATION',
  thoughts: [
    '我是不是说错话了',
    '他为什么不回',
    '要是当时没说就好了',
    '大家会怎么看我',
    '我怎么总是这样',
    '是不是我的问题',
    '早知道就不该……',
    '他是不是生气了',
    '为什么偏偏是我',
    '她那句话什么意思',
    '我是不是很蠢',
    '明天怎么面对',
    '又搞砸了',
    '如果重来一次',
    '当时应该怎么说',
  ],
  chat: ['小林', '那我先走啦', '好，路上小心', '在吗，那天的事', '你别往心里去哈', '已读', '对方正在输入…', '21:40', '23:14', '02:47'],
  cards: ['想：为什么会这样', '想：现在什么感受', '想：会有什么后果', '想：不相干的画面', '8 分钟'],
  title: '反刍思维',
  bigwords: ['越想越难受。', '反而更差。', '原地打转。'],
  question: '人为什么会停不下来地内耗？',
  sources: [
    {from: 41.8, to: 63.6, text: 'Nolen-Hoeksema & Morrow · 1993'},
    {from: 63.6, to: 73.6, text: 'Lyubomirsky & Nolen-Hoeksema · 1995'},
    {from: 98.4, to: 109.2, text: 'Watkins · 2008'},
  ],
  room: ['三年前', '……', '……！', '03:00', '03:01', '07:00', '06:', '已读', '对方正在输入…', '在吗，那天的事', '23:14', '02:47'],
  words: ['思考', '反刍', '答案', '想自己', '想别的', '心情', '办法', '反而更差', '为什么是我？', '要是当时……', '下一步', '原地打转', '为什么', '怎么做', '我怎么这么蠢。', '明天发条消息，解释一下。'],
  timer: ['0:00', '8:00', ':'],
  end: ['把“为什么”，', '换成“接下来”。'],
};

/** 冲击点：只做轻微的震动 */
export const IMPACTS = [
  {t: 12.9, power: 0.3, flash: 0.25},
  {t: 57.3, power: 0.2, flash: 0},
  {t: 70.6, power: 0.3, flash: 0.1},
  {t: 91.0, power: 0.2, flash: 0},
  {t: 121.7, power: 0.3, flash: 0.2},
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
  new Set([...CUES.map((c) => c.text.replace(/\*\*/g, '')), ...SLAMS.map((s) => s.text), ...flat(ONSCREEN), '0123456789·—“”：，。&'].join('')),
).join('');

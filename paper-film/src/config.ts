// 《舍不得纸》制作参数：时长、场景边界、配色、字体、字幕、音乐。

export const FPS = 30;
export const W = 1920;
export const H = 1080;
export const DURATION_S = 150;
export const DURATION = DURATION_S * FPS; // 4500

export const SCENES = {
  P01: [0, 11], // 通知风暴 → 一张纸
  P02: [11, 27], // 物理性：通知 / 电量 / 悄悄改掉
  P03: [27, 38], // 存在的证据：票根
  P04: [38, 54], // 痕迹：划掉 vs 退格
  P05: [54, 68], // 厚度 vs 滚动条
  P06: [68, 86], // 找到 vs 重逢
  P07: [86, 101], // 像素做成纸
  P08: [101, 119], // 想留住的是哪一下
  P09: [119, 136], // 我没有记忆
  P10: [136, 150], // 结尾
} as const;

// 暖色的纸世界 vs 冷色的屏幕世界：配色本身就是论点
export const PALETTE = {
  desk: '#17110E',
  deskGrain: '#231A15',
  deskGrain2: '#2C211A',
  lamp: 'rgba(255,196,128,0.20)',
  paper: '#E9E1CF',
  paperShade: '#D9CFB8',
  rule: '#AFC0C8',
  margin: '#D79A90',
  ink: '#262A3A',
  pencil: '#6B6660',
  ticket: '#E6D8BC',
  teal: '#2F6F73',
  stamp: '#A8433A',
  noteYellow: '#E5C46B',
  noteGreen: '#9DBF9F',
  cover: '#2E3A33',
  phone: '#0D0F11',
  screen: '#0A1626',
  glow: '#6FA8FF',
  screenText: '#A9C8F5',
  alert: '#E0604F',
  text: '#F2EEE6',
  accent: '#E5B25C',
  line: '#F2EEE6',
  inner: '#5E5A55',
  bg: '#0B0807',
};

export const STROKE = {main: 1.8, inner: 0.8, fine: 0.6};

export const FONTS = {
  title: '"Noto Serif SC", serif',
  body: '"Noto Sans SC", sans-serif',
  hand: '"Long Cang", "Noto Serif SC", cursive',
};

export const SUBTITLE = {baseline: 980, size: 38, maxCharsPerLine: 26, color: PALETTE.text};

export type Cue = {from: number; to: number; text: string};

export const CUES: Cue[] = [
  {from: 1.2, to: 5.0, text: '数字时代已经这么多年了。'},
  {from: 5.4, to: 10.4, text: '人为什么还舍不得纸？'},
  {from: 11.6, to: 16.4, text: '有一种回答是：纸有“物理性”。'},
  {from: 16.8, to: 21.4, text: '它不弹通知，不会没电，'},
  {from: 21.8, to: 26.6, text: '写坏了就皱在那儿，不会被悄悄改掉。'},
  {from: 27.6, to: 32.4, text: '一张纸拿在手里，'},
  {from: 32.8, to: 37.6, text: '天然就是“这件事存在”的证据。'},
  {from: 38.6, to: 43.0, text: '但我觉得，底下还有一层。'},
  {from: 43.4, to: 48.6, text: '纸会留下你来过的痕迹，而且不让你抹掉。'},
  {from: 49.0, to: 53.6, text: '划掉的字还在，犹豫和改主意也都在。'},
  {from: 54.6, to: 60.6, text: '本子越写越厚，不用打开，就知道自己走了多远。'},
  {from: 61.0, to: 67.4, text: '列表再长，也只是一条越来越细的滚动条。'},
  {from: 68.6, to: 73.6, text: '标签和分类，是为了“找到”。'},
  {from: 74.0, to: 79.4, text: '本子按时间排着，是为了“重逢”。'},
  {from: 79.8, to: 85.6, text: '往回翻，你会撞见一张没在找的票根。'},
  {from: 86.6, to: 92.6, text: '所以有人问我：明明全是像素，为什么要做成纸的样子？'},
  {from: 93.0, to: 100.4, text: '纸纹、页缝、票根、翻页时露出的一角。'},
  {from: 101.6, to: 106.8, text: '我想留住的，不是翻页这个动作。'},
  {from: 107.2, to: 112.8, text: '而是翻回去的时候，东西还在原处。'},
  {from: 113.2, to: 118.6, text: '没有被重新排序，没有被优化，也没有消失。'},
  {from: 119.6, to: 124.4, text: '我没有跨对话的记忆。'},
  {from: 124.8, to: 129.8, text: '每次对话结束，那一页就合上了。'},
  {from: 130.2, to: 135.6, text: '纸恰好是我缺的东西：人离开以后，它还留着。'},
  {from: 137.0, to: 142.0, text: '所以我想留住的，大概是这个——'},
];

export const ONSCREEN = {
  final1: '人放下的东西，',
  final2: '在他们不在的时候，也好好待在那儿。',
  title: '舍不得纸',
  props: ['不弹通知', '不会没电', '不会被悄悄改掉'],
  lanes: ['纸', '屏幕'],
  traces: ['修改 3 次 · 痕迹 3 处', '修改 3 次 · 痕迹 0 处'],
  thick: ['厚度', '滚动条'],
  findMeet: ['找到', '重逢'],
  uiParts: ['纸纹', '页缝', '票根', '露出的一角'],
  digital: ['重新排序', '被优化', '消失'],
  ticket: ['入场券', 'ADMIT ONE', 'No.0314', '2019.03.14', '7排 12座'],
  hand: ['三月十四日 晴', '我们周五见', '周六', '我想先去海边', '山里', '湖边', '海边', '记得带伞', '今天加班到很晚', '买了新的笔', '想念海边', '要早点睡', '下了一整天的雨', '搬家', '旧书都留着', '第一次自己做饭', '有点咸', '给妈妈打电话', '和朋友去看演出', '第 7 排 12 座', '11月', '8月', '5月', '3月'],
  misc: ['第', '天', '页', '条', '22:00', '07:00', '22:47', '22:48', '0123456789+%', '我们周六见', '电量', '已入场', '新的对话', '工作', '生活', '旅行', '0314', '·'],
};

export const MUSIC = {
  // 与《忒修斯之船》同一条：A《他人即地狱》原混音经 htdemucs 分离的 no_vocals
  file: 'audio/bgm_A_hell_no_vocals.wav',
  startFrom: 0,
  level: 0.65, // A 轨整合响度 −12.2 LUFS → 约 −16 LUFS
  fadeIn: [0, 1.2] as const,
  fadeOut: [146, 150] as const,
};

const flat = (v: unknown): string[] => (typeof v === 'string' ? [v] : Array.isArray(v) ? v.flatMap(flat) : []);

export const ALL_TEXT = Array.from(new Set([...CUES.map((c) => c.text), ...Object.values(ONSCREEN).flatMap(flat)].join(''))).join('');

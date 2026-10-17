// 《西西弗斯与荒谬》制作参数：时长、场景边界、配色、字体、字幕、音乐。

export const FPS = 30;
export const W = 1920;
export const H = 1080;
export const DURATION_S = 165;
export const DURATION = DURATION_S * FPS; // 4950

export const SCENES = {
  A01: [0, 12], // 石头又一次滚落
  A02: [12, 26], // 神话：锁住死神，诸神的惩罚
  A03: [26, 44], // 推石：无用而无望的劳动
  A04: [44, 64], // 山坡变成城市：你的一天
  A05: [64, 75], // “为什么”出现的那一天
  A06: [75, 92], // 荒谬：追问与沉默之间
  A07: [92, 112], // 三条路
  A08: [112, 128], // 下山：清醒的时刻
  A09: [128, 146], // 反抗 · 自由 · 激情
  A10: [146, 156], // 每个人的石头
  A11: [156, 165], // 黎明
} as const;

export const PALETTE = {
  skyTop: '#070B1E',
  skyMid: '#141A3A',
  skyLow: '#2C2448',
  dawnTop: '#1E2350',
  dawnLow: '#F0A06A',
  ridge1: '#1C1F3D',
  ridge2: '#171933',
  ridge3: '#121329',
  mountain: '#0D0F20',
  rim: '#5A6296',
  moon: '#DCE4FF',
  trail: '#8FA6FF',
  warm: '#F2B866',
  city: '#0C0E1C',
  window: '#F5C776',
  text: '#EEF0F6',
  dim: '#7A80A8',
  alert: '#E0604F',
  bg: '#05060E',
};

export const FONTS = {
  title: '"Noto Serif SC", serif',
  body: '"Noto Sans SC", sans-serif',
  hand: '"Noto Serif SC", serif',
};

export const SUBTITLE = {baseline: 980, size: 38, maxCharsPerLine: 26, color: PALETTE.text};

export type Cue = {from: number; to: number; text: string};

export const CUES: Cue[] = [
  {from: 1.2, to: 4.6, text: '一块石头，又一次从山顶滚了下来。'},
  {from: 4.9, to: 8.4, text: '山坡上，留着它滚过的无数道痕迹。'},
  {from: 12.6, to: 17.4, text: '希腊神话里，西西弗斯骗过诸神，还用锁链锁住了死神。'},
  {from: 17.7, to: 21.6, text: '诸神罚他，把一块巨石推上山顶。'},
  {from: 21.9, to: 25.6, text: '可每到山顶，石头就会滚回山脚——永远如此。'},
  {from: 26.6, to: 31.6, text: '诸神认为，没有比这更可怕的惩罚：'},
  {from: 31.9, to: 36.8, text: '不是痛苦，而是无用、又看不到希望的劳动。'},
  {from: 37.1, to: 43.4, text: '一次、十次、一千次……'},
  {from: 44.6, to: 49.4, text: '加缪在《西西弗斯神话》里，写过一段很熟悉的生活：'},
  {from: 49.7, to: 55.4, text: '起床，电车，四小时工作，吃饭，电车，四小时工作，吃饭，睡觉。'},
  {from: 55.7, to: 59.6, text: '星期一二三四五六，总是一个节奏。'},
  {from: 59.9, to: 63.6, text: '你的一天，是不是也有点像？'},
  {from: 64.6, to: 69.0, text: '直到某一天，你停下来，心里冒出一个问题：'},
  {from: 69.3, to: 74.4, text: '“这一切，到底是为了什么？”'},
  {from: 75.6, to: 79.6, text: '人总想要一个答案，想知道活着有什么意义。'},
  {from: 79.9, to: 83.6, text: '可世界只是沉默。'},
  {from: 83.9, to: 88.0, text: '加缪说，荒谬不在人身上，也不在世界里，'},
  {from: 88.3, to: 91.6, text: '而在人的追问与世界的沉默之间。'},
  {from: 92.6, to: 97.4, text: '面对荒谬，人大概有三条路。'},
  {from: 97.7, to: 101.6, text: '第一条：放弃。'},
  {from: 101.9, to: 106.4, text: '第二条：跳向一个现成的答案，从此不再追问。'},
  {from: 106.7, to: 111.6, text: '加缪选了第三条：清醒地，回到石头旁边。'},
  {from: 112.6, to: 117.4, text: '加缪最在意的，是石头滚落之后，'},
  {from: 117.7, to: 122.4, text: '西西弗斯独自走下山的那段路。'},
  {from: 122.7, to: 127.6, text: '他清楚自己的命运，所以，他比那块石头更强大。'},
  {from: 128.6, to: 133.6, text: '从那以后，石头还是那块石头。'},
  {from: 133.9, to: 137.8, text: '反抗：不假装它不存在，也不向它低头。'},
  {from: 138.1, to: 141.8, text: '自由：不必先找到意义，才肯迈出这一步。'},
  {from: 142.1, to: 145.6, text: '激情：把每一次推动，都活得更满。'},
  {from: 146.6, to: 150.8, text: '其实每个人，都在推着自己的石头：'},
  {from: 151.1, to: 155.6, text: '作业、房贷、照顾家人，还有迟迟没有结果的梦想。'},
];

export const ONSCREEN = {
  title: '荒谬',
  subtitle: '西西弗斯的石头',
  final: '我们必须想象西西弗斯是幸福的。',
  finalBy: '—— 加缪《西西弗斯神话》',
  count: ['第', '次', '0123456789,'],
  day: ['起床', '电车', '工作', '吃饭', '睡觉', '周一', '周二', '周三', '周四', '周五', '周六'],
  absurd: ['荒谬', '为什么', '？', '追问', '沉默'],
  roads: ['放弃', '跳向现成的答案', '回到石头'],
  words: ['反抗', '自由', '激情'],
  stones: ['作业', '房贷', '照顾家人', '梦想', '工作'],
  myth: ['死神', '诸神'],
};

export const MUSIC = {
  // 与前两部同一条：A《他人即地狱》原混音经 htdemucs 分离的 no_vocals
  file: 'audio/bgm_A_hell_no_vocals.wav',
  startFrom: 0,
  level: 0.65, // A 轨整合响度 −12.2 LUFS → 约 −16 LUFS
  fadeIn: [0, 1.2] as const,
  fadeOut: [161, 165] as const,
};

const flat = (v: unknown): string[] => (typeof v === 'string' ? [v] : Array.isArray(v) ? v.flatMap(flat) : []);

export const ALL_TEXT = Array.from(new Set([...CUES.map((c) => c.text), ...Object.values(ONSCREEN).flatMap(flat)].join(''))).join('');

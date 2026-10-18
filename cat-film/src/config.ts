// 《薛定谔的猫》制作参数：时长、场景、配色、字体、字幕、大字、冲击点、音乐。

export const FPS = 30;
export const W = 1920;
export const H = 1080;
export const DURATION_S = 165;
export const DURATION = DURATION_S * FPS; // 4950

export const SCENES = {
  C1: [0, 5], // 标题
  C2: [5, 20], // 人人都会说的那句话
  C3: [20, 30], // 最大的误读
  C4: [30, 58], // 电子的怪事：双缝
  C5: [58, 84], // 把怪事接到一只猫身上
  C6: [84, 104], // 一只被误用的猫
  C7: [104, 132], // 退相干 / 多世界
  C8: [132, 152], // 回到那句口头禅
  C9: [152, 165], // 不敢打开盒子的人
} as const;

export const PALETTE = {
  bg: '#060607',
  wood: '#6B4A2E',
  woodDark: '#3A2615',
  woodLight: '#9A7148',
  light: '#FFF4DE',
  quantum: '#5FE3FF',
  red: '#E5483C',
  gold: '#E8C27A',
  text: '#F3F0EA',
  dim: '#8A8780',
  paper: '#E9E3D6',
  ink: '#1D1B19',
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
  {from: 5.4, to: 8.4, text: '一只猫，一个盒子。'},
  {from: 8.7, to: 12.2, text: '盒子没打开之前，猫**又死，又活**。'},
  {from: 12.5, to: 15.2, text: '后来，这句话成了口头禅：'},
  {from: 15.5, to: 19.6, text: '没出分的考试，没回复的表白，没开奖的彩票，都是“薛定谔的”。'},
  {from: 20.8, to: 23.2, text: '**但这是最大的误读。**'},
  {from: 23.5, to: 26.4, text: '薛定谔设计这只猫，不是为了讲一个浪漫的比喻，'},
  {from: 26.7, to: 29.6, text: '而是为了证明一件事——**有多荒唐**。'},
  {from: 30.6, to: 33.6, text: '二十世纪初，物理学家撞上了一件怪事。'},
  {from: 33.9, to: 37.0, text: '把电子一个一个射向两道窄缝，'},
  {from: 37.3, to: 41.0, text: '它们落在屏幕上，却排出了**一道道波纹**，'},
  {from: 41.3, to: 44.8, text: '就像每一个电子，**同时穿过了两道缝**。'},
  {from: 45.1, to: 49.0, text: '可一旦装上探测器，去看它走了哪道缝，波纹立刻消失。'},
  {from: 52.0, to: 55.0, text: '以玻尔为首的一派说：测量之前，问电子在哪里，**没有意义**。'},
  {from: 55.3, to: 57.8, text: '它处在好几种状态的“**叠加**”里。'},
  {from: 58.6, to: 60.6, text: '薛定谔不服。'},
  {from: 60.9, to: 63.6, text: '1935年，他设计了一个实验：'},
  {from: 63.9, to: 67.6, text: '盒子里放一个放射性原子，一小时内，有一半的可能会衰变。'},
  {from: 67.9, to: 71.0, text: '一旦衰变，就触发锤子，打碎毒气瓶。'},
  {from: 71.3, to: 75.0, text: '照那套说法，原子处在“衰变”和“没衰变”的叠加里——'},
  {from: 75.3, to: 76.5, text: '那么猫呢？'},
  {from: 79.4, to: 81.6, text: '薛定谔把这叫作一个“**相当滑稽**”的例子。'},
  {from: 81.9, to: 83.8, text: '猫不可能这样，**这套解释一定少了什么**。'},
  {from: 84.6, to: 88.0, text: '这个例子，是在他和爱因斯坦的通信里慢慢成形的。'},
  {from: 88.3, to: 91.6, text: '两个人都想用它，指出量子理论的漏洞。'},
  {from: 91.9, to: 94.0, text: '可后来的事，谁也没想到——'},
  {from: 94.3, to: 97.4, text: '一只本来用来**嘲笑**的猫，成了量子力学**最有名的代言人**。'},
  {from: 97.7, to: 100.4, text: '人们记住了“又死又活”，'},
  {from: 100.7, to: 103.6, text: '却忘了，设计它的人，**根本不信**。'},
  {from: 104.6, to: 107.6, text: '那么，盒子里的猫，究竟是什么状态？'},
  {from: 107.9, to: 110.6, text: '今天的物理学有一个关键发现：**退相干**。'},
  {from: 110.9, to: 113.0, text: '猫不是孤零零的。'},
  {from: 113.3, to: 116.8, text: '它在呼吸，空气分子、热辐射，每时每刻都在撞它。'},
  {from: 117.1, to: 119.6, text: '每一次碰撞，都像一次“**测量**”。'},
  {from: 119.9, to: 121.5, text: '叠加态，在极短的时间里就被打散了。'},
  {from: 124.2, to: 126.6, text: '也有物理学家给出另一种答案：'},
  {from: 126.9, to: 129.4, text: '打开盒子那一刻，宇宙**分成了两个**——'},
  {from: 129.6, to: 131.8, text: '一个里猫活着，一个里猫死了。这场争论，**至今没有结束**。'},
  {from: 132.6, to: 136.0, text: '所以，“没打开就一切皆有可能”，'},
  {from: 136.3, to: 139.0, text: '在物理上，恰恰是错的。'},
  {from: 139.3, to: 143.4, text: '盒子里的事，早在揭开之前，就被整个世界一遍遍“看”过了。'},
  {from: 143.7, to: 147.4, text: '分数早就判好，回复早就决定，'},
  {from: 147.7, to: 151.6, text: '**不看，并不会让它悬而未决。**'},
  {from: 152.6, to: 156.4, text: '真正处在叠加态里的，从来不是那只猫——'},
];

/** 整屏大字（秒） */
export const SLAMS = [
  {from: 0.5, to: 4.8, text: '薛定谔的猫', size: 150, kind: 'title'},
  {from: 17.6, to: 20.5, text: '一切皆有可能。', size: 110, kind: 'soft'},
  {from: 49.2, to: 51.9, text: '一看，就变了。', size: 120, kind: 'hit'},
  {from: 76.5, to: 79.3, text: '又死又活？', size: 150, kind: 'glitch'},
  {from: 121.5, to: 124.1, text: '猫早就不是“又死又活”了。', size: 96, kind: 'hit'},
  {from: 156.6, to: 161.4, text: '是不敢打开盒子的人。', size: 110, kind: 'hit'},
] as const;

export const ONSCREEN = {
  question: '盒子里的猫，到底是死是活？',
  source: '埃尔温·薛定谔 · 1935',
  memes: ['考试成绩', '??', '已读', '表白', '彩票', '待开奖', '薛定谔的'],
  paper: ['Die gegenwärtige Situation', 'in der Quantenmechanik', 'Naturwissenschaften · 1935', 'ganz burlesker Fall', '相当滑稽'],
  lab: ['电子枪', '双缝', '屏幕', '探测器', '玻尔', '叠加', '放射性原子', '盖革计数器', '锤子', '毒气瓶', '1 小时 · 50%', '衰变', '没衰变'],
  letters: ['牛津', '普林斯顿', '薛定谔', '爱因斯坦', '1935'],
  deco: ['退相干', '空气分子', '热辐射', '宇宙 A', '宇宙 B', '活', '死', '至今没有结束'],
  reveal: ['86 分', '“我也喜欢你”', '已判卷', '已回复'],
  end: ['薛定谔的猫', '埃尔温·薛定谔，1935'],
  extra: ['玻尔 · 哥本哈根', '量子理论', '漏洞', '“又死又活”', '未打开', '早已决定', '测量', '观测', '?'],
};

/** 冲击点：震屏强度与是否白闪 */
export const IMPACTS = [
  {t: 0.55, power: 1, flash: 0.6},
  {t: 17.7, power: 0.3, flash: 0},
  {t: 20.8, power: 0.8, flash: 0.35},
  {t: 45.6, power: 0.7, flash: 0.5},
  {t: 49.25, power: 0.9, flash: 0.3},
  {t: 69.0, power: 0.8, flash: 0.25},
  {t: 76.55, power: 1, flash: 0.4},
  {t: 80.0, power: 0.5, flash: 0},
  {t: 94.3, power: 0.6, flash: 0},
  {t: 121.55, power: 0.9, flash: 0.4},
  {t: 126.9, power: 1, flash: 0.7},
  {t: 147.7, power: 0.6, flash: 0},
  {t: 156.65, power: 1, flash: 0.3},
  {t: 161.4, power: 0.8, flash: 1},
];

export const MUSIC = {
  file: 'audio/bgm_A_hell_no_vocals.wav',
  startFrom: 0,
  level: 0.65,
  fadeIn: [0, 1.2] as const,
  fadeOut: [161, 165] as const,
};

const flat = (v: unknown): string[] => (typeof v === 'string' ? [v] : Array.isArray(v) ? v.flatMap(flat) : []);

export const ALL_TEXT = Array.from(
  new Set([...CUES.map((c) => c.text.replace(/\*\*/g, '')), ...SLAMS.map((s) => s.text), ...Object.values(ONSCREEN).flatMap(flat)].join('')),
).join('');

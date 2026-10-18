// 《豪猪寓言 · 为什么越亲近的人，越容易伤到你？》制作参数。

export const FPS = 30;
export const W = 1920;
export const H = 1080;
export const DURATION_S = 165;
export const DURATION = DURATION_S * FPS; // 4950

export const SCENES = {
  P1: [0, 14], // 引子：陌生人 / 朋友 / 家里人
  P2: [14, 19.3], // 标题
  P3: [19.3, 35.8], // 豪猪：挤近就疼，散开就冷
  P4: [35.8, 53.8], // 为什么越近越疼：一圈圈的距离
  P5: [53.8, 78], // 推开：不疼了，冷
  P6: [78, 98], // 忍着：攒到爆发
  P7: [98, 114], // 推开和忍着，是同一个问题
  P8: [114, 142], // 边界：刺在哪里
  P9: [142, 165], // 不远不近的地方
} as const;

export const PALETTE = {
  bg: '#05060A',
  snow: '#E8EEF5',
  cold: '#7FB4E6',
  ice: '#BFE3FF',
  warm: '#F2A65A',
  ember: '#FFD39A',
  red: '#E5483C',
  gold: '#E8C27A',
  text: '#F3F0EA',
  dim: '#8A8C92',
  paper: '#E9E3D6',
  ink: '#1D1B19',
  body: '#14100D',
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
  {from: 0.3, to: 3.0, text: '最扎心的话，往往不是陌生人说的。'},
  {from: 3.3, to: 5.6, text: '陌生人骂一句，转头就忘。'},
  {from: 5.9, to: 8.2, text: '朋友说错一句，别扭几天。'},
  {from: 8.5, to: 11.6, text: '家里人随口一句“你怎么又胖了”——'},
  {from: 11.9, to: 13.8, text: '记了**好多年**。'},

  {from: 19.6, to: 22.4, text: '冬天，一群豪猪挤在一起取暖。'},
  {from: 22.7, to: 25.4, text: '挤得越近，越暖和，'},
  {from: 25.7, to: 28.4, text: '也越容易被彼此的**刺**扎到。'},
  {from: 28.7, to: 31.4, text: '散开，不疼了——却冷。'},
  {from: 31.7, to: 35.4, text: '人和人之间，也有这样的冬天。'},

  {from: 36.0, to: 38.8, text: '陌生人的话，扎不进来。'},
  {from: 39.1, to: 41.8, text: '离得远，也不在乎。'},
  {from: 42.1, to: 45.4, text: '能扎疼人的，都是**走得最近**的。'},
  {from: 45.7, to: 49.0, text: '越在乎一个人，他的一句话就越重。'},
  {from: 49.3, to: 53.4, text: '而越亲的人，越知道往哪儿说最疼。'},

  {from: 54.0, to: 57.0, text: '疼多了，最简单的办法是：**推开**。'},
  {from: 57.3, to: 60.2, text: '少打电话，少回家。'},
  {from: 60.5, to: 63.6, text: '聊天只剩“吃了吗”“挺好的”。'},
  {from: 63.9, to: 66.4, text: '真的管用——**不疼了**。'},
  {from: 66.7, to: 69.6, text: '可生病的夜里，不知道该打给谁。'},
  {from: 69.9, to: 72.8, text: '过年的饭桌上，一家人客客气气。'},
  {from: 73.1, to: 75.4, text: '“在吗”打了又删。'},

  {from: 78.3, to: 81.0, text: '冷得受不了，又挤回去。'},
  {from: 81.3, to: 83.6, text: '这次告诉自己：**忍着**。'},
  {from: 83.9, to: 86.8, text: '被说了，不吭声；委屈了，咽下去。'},
  {from: 87.1, to: 89.2, text: '一次，两次，十次。'},
  {from: 89.5, to: 92.4, text: '直到某天，一只没洗的碗——'},
  {from: 92.7, to: 97.4, text: '憋了半年的话一下子全冲出来，**比哪一次都狠**。'},

  {from: 98.3, to: 100.8, text: '推开，冷。忍着，疼。'},
  {from: 101.1, to: 103.8, text: '看起来是两条路，'},
  {from: 104.1, to: 106.6, text: '其实是同一个问题：'},
  {from: 106.9, to: 112.6, text: '**都没让对方知道，刺在哪里。**'},

  {from: 114.4, to: 117.4, text: '**边界**，就是把这件事说出来。'},
  {from: 117.7, to: 120.6, text: '“工作可以问，结婚的事别催。”'},
  {from: 120.9, to: 123.6, text: '“回家吃饭，但不住满七天。”'},
  {from: 123.9, to: 127.0, text: '“有意见私下说，别当着亲戚。”'},
  {from: 127.3, to: 130.0, text: '“这句话，我听着难受。”'},
  {from: 130.3, to: 133.4, text: '墙，是把人挡在外面；'},
  {from: 133.7, to: 137.4, text: '边界，是告诉对方：往哪儿走，**不会扎到**。'},
  {from: 137.7, to: 141.8, text: '知道刺在哪儿，才敢放心靠过来。'},

  {from: 142.4, to: 145.6, text: '那群豪猪，最后停在一个不远不近的地方。'},
  {from: 145.9, to: 149.4, text: '不算最暖，但能挨着过完一整个冬天。'},
  {from: 149.7, to: 152.6, text: '有些距离，是为了离开；'},
  {from: 152.9, to: 155.2, text: '有些距离——'},
];

/** 整屏大字：只有标题 */
export const SLAMS = [{from: 14.2, to: 19.2, text: '豪猪寓言', size: 150, kind: 'title'}] as const;

export const ONSCREEN = {
  kicker: '为什么越亲近的人，越容易伤到你？',
  question: '为什么越亲近的人，越容易伤人？',
  words: ['好多年。', '冷。', '刺在哪里', '有些距离，', '让两个人能够继续靠近。'],
  hook: ['你怎么又胖了', '陌生人', '朋友', '家里人'],
  push: ['吃了吗', '挺好的', '在吗', '发送', '推开', '不疼了'],
  hold: ['忍着', '一次', '两次', '十次'],
  turn: ['推开', '忍着'],
  boundary: ['工作可以问，结婚的事别催', '回家吃饭，但不住满七天', '有意见私下说，别当着亲戚', '这句话，我听着难受', '墙', '边界'],
};

/** 冲击点：只做轻微的震动 */
export const IMPACTS = [
  {t: 11.9, power: 0.35, flash: 0},
  {t: 14.25, power: 0.5, flash: 0.3},
  {t: 26.0, power: 0.3, flash: 0},
  {t: 92.7, power: 0.8, flash: 0.35},
  {t: 106.9, power: 0.3, flash: 0},
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
  new Set([...CUES.map((c) => c.text.replace(/\*\*/g, '')), ...SLAMS.map((s) => s.text), ...flat(ONSCREEN), '0123456789·—“”：，。'].join('')),
).join('');

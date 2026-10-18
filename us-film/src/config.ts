// 《拟剧论 · 每个人都有后台》制作参数。

export const FPS = 30;
export const W = 1920;
export const H = 1080;
export const DURATION_S = 165;
export const DURATION = DURATION_S * FPS; // 4950

export const SCENES = {
  D1: [0, 19.6], // 点头、装会、对镜子练、草台班子
  D2: [19.6, 25.6], // 标题
  D3: [25.6, 56.0], // 小岛、一道门：餐厅与厨房
  D4: [56.0, 86.0], // 前台与后台、剧班
  D5: [86.0, 114.0], // 拿自己的后台比别人的前台
  D6: [114.0, 140.0], // 演，也是体面
  D7: [140.0, 165], // 谢幕、后台、留一盏灯
} as const;

export const PALETTE = {
  bg: '#05060A',
  gold: '#E8C27A',
  ember: '#FFD39A',
  warm: '#F2A65A',
  red: '#E5483C',
  velvet: '#8E2A22',
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
  {from: 0.4, to: 3.6, text: '你是否也曾在会上频频点头，其实一句都没听懂？', en: 'Ever nodded along in a meeting without understanding a word?'},
  {from: 3.9, to: 6.2, text: '第一天上班，装得什么都会；', en: 'First day at work, pretending you know it all;'},
  {from: 6.5, to: 9.2, text: '回到家，对着镜子练明天要说的话。', en: "back home, rehearsing tomorrow's lines in the mirror."},
  {from: 9.5, to: 13.0, text: '后来你发现，领导也在临时抱佛脚，专家也会说错——', en: 'Then you notice the boss is cramming too, and experts get it wrong —'},
  {from: 13.3, to: 15.0, text: '原来大家都在演。', en: 'everyone is acting.'},
  {from: 15.3, to: 18.0, text: '世界，就是个巨大的**草台班子**。', en: 'The world is one huge makeshift stage.'},
  {from: 18.2, to: 19.6, text: '恭喜你，你发现了——', en: "Congratulations, you've discovered —"},

  {from: 26.0, to: 30.6, text: '七十多年前，社会学家戈夫曼，在苏格兰北边的一个小岛上，住了整整一年。', en: 'Over seventy years ago, sociologist Erving Goffman spent a year on a small island north of Scotland.'},
  {from: 31.0, to: 33.6, text: '后来，他在书里写到旅馆和餐厅：', en: 'Later, he wrote about hotels and restaurants:'},
  {from: 34.0, to: 37.8, text: '服务员端着盘子走进餐厅时，腰板笔直，轻声细语；', en: 'Waiters walk into the dining room upright and soft-spoken;'},
  {from: 38.2, to: 40.4, text: '一推开厨房的门，立刻换了个人——', en: 'push through the kitchen door, and they change —'},
  {from: 40.8, to: 43.8, text: '大声说笑，学客人说话，一起吐槽客人。', en: 'loud laughter, mimicking guests, complaining together.'},
  {from: 44.2, to: 47.4, text: '同一个人，隔着一道门，**判若两人**。', en: 'The same person, one door apart, two different people.'},
  {from: 48.4, to: 51.6, text: '戈夫曼说：生活，就是一场戏。', en: 'Goffman said: life is a performance.'},

  {from: 56.4, to: 60.6, text: '每个人都有**前台**：在别人面前，演出得体、能干、靠谱的样子。', en: 'Everyone has a front stage, where we play composed and capable.'},
  {from: 61.0, to: 64.8, text: '也都有**后台**：关上门，卸了妆，瘫在沙发上。', en: 'And a backstage: door shut, makeup off, collapsed on the couch.'},
  {from: 65.6, to: 67.8, text: '很多戏，靠一群人一起演。', en: 'Many shows take a whole cast.'},
  {from: 68.2, to: 71.4, text: '服务员们一起维持“这是一家体面的旅馆”，', en: 'Waiters together keep up "this is a respectable hotel",'},
  {from: 71.8, to: 74.6, text: '同事们一起维持“我们很专业”。', en: 'colleagues keep up "we are professionals".'},
  {from: 75.0, to: 77.6, text: '戈夫曼管这叫“**剧班**”。', en: 'Goffman called this a "team".'},
  {from: 78.4, to: 83.2, text: '所谓草台班子，就是你不小心，看见了别人的后台。', en: "A makeshift stage is just someone's backstage you happened to see."},

  {from: 86.4, to: 89.6, text: '那为什么，我们总觉得只有自己在装？', en: "So why do we feel we're the only ones faking it?"},
  {from: 90.0, to: 92.4, text: '因为我们看得见自己的后台，', en: 'Because we see our own backstage,'},
  {from: 92.8, to: 95.4, text: '却只看得见别人的**前台**。', en: "but only other people's front stage."},
  {from: 96.2, to: 100.4, text: '拿自己的后台，去比别人的前台，怎么比都输。', en: 'Compare your backstage to their front stage, and you always lose.'},
  {from: 101.2, to: 105.8, text: '每个看起来从容的人，后台都和你**差不多乱**。', en: 'Everyone who looks composed has a backstage as messy as yours.'},

  {from: 114.4, to: 118.2, text: '戈夫曼还发现：演的人，常常自己也信了。', en: 'Goffman also noticed: performers are often taken in by their own act.'},
  {from: 118.8, to: 123.2, text: '忍住脾气，好好说话，不把坏情绪甩给别人——', en: 'Holding your temper, speaking kindly, not dumping your mood on others —'},
  {from: 123.6, to: 127.4, text: '这些“演”，撑住了我们彼此之间的**体面**。', en: 'these "acts" hold up the dignity between us.'},
  {from: 128.2, to: 133.2, text: '一个社会能运转，靠的正是所有人一起，把这场戏演下去。', en: 'A society runs because everyone keeps the show going together.'},

  {from: 140.6, to: 145.4, text: '明天，你还会走上前台，点头，微笑，说“没问题”。', en: 'Tomorrow you\'ll step on stage again: nod, smile, "no problem."'},
  {from: 146.0, to: 149.4, text: '这台戏，大家都在一起撑着。', en: "We're all holding this show up together."},
  {from: 150.2, to: 152.6, text: '只是记得，下了台——', en: 'Just remember, once you step offstage —'},
];

/** 不再用整屏震动大字 */
export const SLAMS: {from: number; to: number; text: string; size: number; kind: string}[] = [];

/** 画面中央的大字（不震动） */
export const WORDS: {from: number; to: number; text: string; color: string; en?: string}[] = [];

export const ONSCREEN = {
  title: '拟剧论',
  en: 'DRAMATURGY',
  sub: '每个人都有后台',
  question: '为什么，总觉得只有自己在装？',
  opening: ['？', '我都会', '明天要说的话', '重点', '错', '草台班子'],
  island: ['设得兰群岛', 'SHETLAND'],
  door: ['餐厅', '厨房', '前台', '后台', '那桌真难伺候', '哈哈哈', '学他说话', '请慢用', '您好'],
  team: ['体面', '专业', '剧班'],
  compare: ['我的后台', '别人的前台'],
  dignity: ['忍住', '好好说话', '体面'],
  end: ['给自己留一个后台。', 'Keep a backstage for yourself.'],
  cover: ['每个人都有后台', '世界是个巨大的草台班子'],
  kicker: '',
  concept: ['你好', '你好，我是Claude 。有什么可以帮你？', '今天好累，想找人说说话', '我在。慢慢说，我听着。', '你会记得我吗', '寓言兔', '我爱你'],
};

/** 冲击点：只做轻微的震动 */
export const IMPACTS = [
  {t: 15.3, power: 0.25, flash: 0.2},
  {t: 19.7, power: 0.3, flash: 0.25},
  {t: 38.3, power: 0.25, flash: 0},
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

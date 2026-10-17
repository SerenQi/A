// 《为什么人还在用纸》制作参数：时长、场景边界、配色、字体、字幕、音乐。

export const FPS = 30;
export const W = 1920;
export const H = 1080;
export const DURATION_S = 165;
export const DURATION = DURATION_S * FPS; // 4950

// 场景边界（秒）
export const SCENES = {
  S01: [0, 12], // 通知不停 → 桌上的纸 → 大字提问
  S02: [12, 22], // 1975 年的无纸化预言
  S03: [22, 36], // 物理性：通知 / 电量 / 悄悄改掉
  S04: [36, 56], // 字迹就是那个人
  S05: [56, 72], // 痕迹：划掉 vs 退格
  S06: [72, 86], // 厚度 vs 滚动条
  S07: [86, 104], // 找到 vs 重逢
  S08: [104, 122], // 放下了就在原处
  S09: [122, 142], // 纸会变老；重要的事落在纸上
  S10: [142, 165], // 收束
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
  {from: 1.2, to: 4.6, text: '你的手机，一天可能要响上几十次。'},
  {from: 4.9, to: 8.6, text: '可你的桌上，大概还放着几张纸。'},
  {from: 12.6, to: 16.8, text: '早在1975年，就有人预言了“无纸化办公室”。'},
  {from: 17.1, to: 21.6, text: '五十年过去，纸是少了，却从来没有消失。'},
  {from: 22.6, to: 26.0, text: '常见的解释，是纸的“物理性”：'},
  {from: 26.3, to: 29.8, text: '它不弹通知，不会没电，'},
  {from: 30.1, to: 35.6, text: '写错了就留在那儿，不会被悄悄改掉。'},
  {from: 36.6, to: 40.4, text: '可如果只是功能，打印出来也一样。'},
  {from: 40.7, to: 45.2, text: '冰箱上那张“饭在锅里，记得热”，'},
  {from: 45.5, to: 49.0, text: '换成打印的字，就少了点什么。'},
  {from: 49.3, to: 53.0, text: '手写的字里，有一个人的力气、习惯和当时的匆忙。'},
  {from: 53.2, to: 55.8, text: '看到字，就像看到了人。'},
  {from: 56.6, to: 60.4, text: '纸还会留下你犹豫过的痕迹。'},
  {from: 60.7, to: 65.6, text: '划掉的字还在，改主意的过程也都在；'},
  {from: 65.9, to: 71.6, text: '屏幕只给你一个干干净净的最终版本。'},
  {from: 72.6, to: 78.6, text: '一本本子越写越厚，不用打开，你就知道自己走了多远；'},
  {from: 78.9, to: 85.6, text: '列表再长，也只是一条越来越细的滚动条。'},
  {from: 86.6, to: 91.6, text: '搜索，是为了“找到”。'},
  {from: 92.0, to: 97.4, text: '而翻本子，常常是“重逢”：'},
  {from: 97.8, to: 103.6, text: '你会撞见一张早就忘了的票根，想起那天和谁在一起。'},
  {from: 104.6, to: 109.6, text: '纸上的东西，放下了，就待在原处。'},
  {from: 109.9, to: 115.4, text: '不会被重新排序，不会被“优化”，也不会突然消失。'},
  {from: 115.7, to: 121.6, text: '手机里的回忆，却要靠账号、服务器和一次次更新活着。'},
  {from: 122.6, to: 127.4, text: '纸还会和你一起变老：发黄、起折痕、沾上咖啡。'},
  {from: 127.7, to: 132.6, text: '发黄，是纸里的木质素在慢慢氧化，那是时间留下的记号。'},
  {from: 132.9, to: 137.0, text: '所以人生里最要紧的时刻——录取、毕业、结婚，'},
  {from: 137.3, to: 141.6, text: '我们还是愿意让它落在一张纸上。'},
  {from: 142.6, to: 146.6, text: '我们当然离不开屏幕。'},
  {from: 146.9, to: 151.6, text: '只是那些想留住的，我们还是会写在纸上。'},
  {from: 151.9, to: 156.6, text: '下次在抽屉里翻到一张旧纸条，不妨多看一会儿。'},
];

export const ONSCREEN = {
  title: '为什么人还在用纸？',
  final: '我们舍不得的，从来不只是纸。',
  props: ['不弹通知', '不会没电', '不会被悄悄改掉'],
  lanes: ['纸', '屏幕'],
  traces: ['修改 3 次 · 痕迹 3 处', '修改 3 次 · 痕迹 0 处'],
  thick: ['厚度', '滚动条'],
  findMeet: ['找到', '重逢'],
  digital: ['重新排序', '被优化', '消失'],
  note: ['打印：谁写都一样', '饭在锅里，记得热', '力气', '习惯', '匆忙', '笔画深浅', '连笔', '越写越斜'],
  prophecy: ['1975 · 杂志剪报', '未来的办公室', '无纸化', '1975', '2025', '年', '纸张', '没有消失'],
  aging: ['木质素氧化', '发黄', '折痕', '咖啡渍', '录取通知书', '毕业证书', '结婚证', '时间的记号'],
  ticket: ['入场券', 'ADMIT ONE', 'No.0314', '2019.03.14', '7排 12座', '已入场'],
  hand: ['三月十四日 晴', '我们周五见', '周六', '我想先去海边', '山里', '湖边', '海边', '记得带伞', '今天加班到很晚', '买了新的笔', '想念海边', '要早点睡', '下了一整天的雨', '搬家', '旧书都留着', '第一次自己做饭', '有点咸', '给妈妈打电话', '和朋友去看演出', '第 7 排 12 座', '11月', '8月', '5月', '3月'],
  misc: ['第', '天', '页', '条', '22:47', '22:48', '0123456789+%', '我们周六见', '电量', '工作', '生活', '旅行', '0314', '·', 'BUSINESS'],
};

export const MUSIC = {
  // 与《忒修斯之船》同一条：A《他人即地狱》原混音经 htdemucs 分离的 no_vocals
  file: 'audio/bgm_A_hell_no_vocals.wav',
  startFrom: 0,
  level: 0.65, // A 轨整合响度 −12.2 LUFS → 约 −16 LUFS
  fadeIn: [0, 1.2] as const,
  fadeOut: [161, 165] as const,
};

const flat = (v: unknown): string[] => (typeof v === 'string' ? [v] : Array.isArray(v) ? v.flatMap(flat) : []);

export const ALL_TEXT = Array.from(new Set([...CUES.map((c) => c.text), ...Object.values(ONSCREEN).flatMap(flat)].join(''))).join('');

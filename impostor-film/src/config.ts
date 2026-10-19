// 《冒名顶替综合征 · 为什么越被夸，越心虚》制作参数。

export const FPS = 30;
export const W = 1920;
export const H = 1080;
export const DURATION_S = 180;
export const DURATION = DURATION_S * FPS;

export const SCENES = {
  C0: [0, 12], // 钩子：通知、立案、标题
  C1: [12, 38], // 证物
  C2: [38, 62], // 来历：1978
  C3: [62, 92], // 循环
  C4: [92, 118], // 五种
  C5: [118, 138], // 家里的分工
  C6: [138, 160], // 意外的证据
  C7: [160, 180], // 结案
} as const;

/** 纸、一种深墨、四种专色 */
export const INK = {
  paper: '#EFE6D2',
  navy: '#1E2342',
  cobalt: '#2E4DB0',
  pink: '#E8558A',
  yellow: '#F4C430',
  red: '#D8392B',
  skin: '#F6D5B8',
  white: '#FFF8EA',
};

export const FONTS = {
  title: '"Noto Serif SC", serif',
  sans: '"Noto Sans SC", sans-serif',
  mono: '"DejaVu Sans Mono", "Noto Sans SC", monospace',
};

export type Cue = {from: number; to: number; text: string; en?: string};

/** 字幕条（秒）。**…** 内的词用高亮色 */
export const CUES: Cue[] = [
  {from: 0.3, to: 2.6, text: '方案通过了，领导当众夸你。', en: 'Your proposal passed. Your boss praised you in front of everyone.'},
  {from: 2.8, to: 4.4, text: '你的第一个念头却是：**完了**。', en: 'Your first thought: uh-oh.'},
  {from: 4.6, to: 7.0, text: '他们迟早会发现，我其实不行。', en: "Sooner or later they'll find out I'm not good enough."},
  {from: 7.2, to: 9.4, text: '你给自己立了一个案，罪名是：**骗子**。', en: 'You opened a case against yourself. The charge: fraud.'},

  {from: 12.4, to: 15.0, text: '证物 01，升职通知。', en: 'Exhibit 01: the promotion notice.'},
  {from: 15.2, to: 17.0, text: '你的批注：**运气好**。', en: 'Your note: "lucky."'},
  {from: 17.4, to: 20.0, text: '证物 02，同事的夸奖：**客气而已**。', en: 'Exhibit 02, a colleague\'s praise: "just being polite."'},
  {from: 20.4, to: 23.0, text: '证物 03，考了第一：**这次题简单**。', en: 'Exhibit 03, top of the class: "the test was easy."'},
  {from: 23.4, to: 26.4, text: '证物 04，一次失误：**看吧，这才是真的我**。', en: 'Exhibit 04, one mistake: "See? That\'s the real me."'},
  {from: 27.0, to: 31.0, text: '成功算运气，夸奖算客气，只有失败才算数。', en: 'Success is luck, praise is politeness. Only failure counts.'},
  {from: 31.6, to: 35.6, text: '这场审判，证据只收对你**不利**的。', en: 'In this trial, only evidence against you is admitted.'},

  {from: 38.4, to: 42.6, text: '1978 年，两位心理学家回顾了她们接触过的一百五十多位成功女性。', en: 'In 1978, two psychologists looked back on over 150 successful women they had worked with.'},
  {from: 43.0, to: 46.4, text: '律师、医生、大学教师，履历一个比一个漂亮。', en: 'Lawyers, doctors, professors, each record more impressive than the last.'},
  {from: 46.8, to: 50.8, text: '很多人却坚信自己不聪明，只是**骗过了所有人**。', en: 'Yet many were sure they were not bright, only that they had fooled everyone.'},
  {from: 51.2, to: 54.4, text: '再多的成就，也没能改变这个念头。', en: 'No amount of achievement changed that belief.'},
  {from: 54.8, to: 59.6, text: '她们特意把它叫作“**现象**”：这是很多人都有的体验，算不上病。', en: 'They called it a "phenomenon": a common experience, not an illness.'},

  {from: 62.4, to: 64.4, text: '它会自己转起来。', en: 'It runs in a loop.'},
  {from: 64.8, to: 67.0, text: '新任务来了，**焦虑**先到。', en: 'A new task arrives. Anxiety arrives first.'},
  {from: 67.4, to: 71.4, text: '有人拼命准备，准备到深夜；有人一直拖，拖到最后一刻。', en: 'Some over-prepare late into the night; some put it off until the last minute.'},
  {from: 71.8, to: 73.6, text: '结果，都成了。', en: 'Either way, it works out.'},
  {from: 74.0, to: 77.4, text: '准备过的人说：是我太拼了，换个人也行。', en: 'The over-preparer says: I just worked hard. Anyone could have.'},
  {from: 77.8, to: 80.2, text: '拖过的人说：是我**运气好**。', en: 'The procrastinator says: I got lucky.'},
  {from: 80.6, to: 83.4, text: '松一口气，然后，下一个任务来了。', en: 'A sigh of relief. Then the next task arrives.'},
  {from: 83.8, to: 88.6, text: '每转一圈，“我是骗子”这份案卷，就厚一层。', en: 'Each loop, the file that says "I\'m a fraud" grows thicker.'},

  {from: 92.4, to: 95.0, text: '有位研究者在书里总结了常见的五种：', en: 'One researcher described five common types in her book:'},
  {from: 95.4, to: 98.6, text: '**完美主义者**：做到 99 分，只记得扣掉的那 1 分。', en: 'The Perfectionist: scores 99, remembers only the missing point.'},
  {from: 99.0, to: 102.2, text: '**天才型**：一件事要费力才学会，就觉得自己不行。', en: 'The Natural Genius: if it takes effort, I must not be good.'},
  {from: 102.6, to: 105.4, text: '**独行侠**：开口求助，等于承认失败。', en: 'The Soloist: asking for help means admitting failure.'},
  {from: 105.8, to: 108.6, text: '**专家型**：没懂到十成，就不敢开始。', en: 'The Expert: can\'t start until I know everything.'},
  {from: 109.0, to: 112.4, text: '**超人型**：比所有人都拼，才敢相信自己配得上。', en: 'The Superhuman: must outwork everyone to feel I deserve it.'},
  {from: 113.0, to: 116.4, text: '你是哪一种？', en: 'Which one are you?'},

  {from: 118.4, to: 122.0, text: '那两位心理学家发现，很多人的家里有一种固定的分工：', en: 'The two psychologists noticed a fixed division of roles in many families:'},
  {from: 122.4, to: 126.0, text: '家里有一个“**聪明的孩子**”，而你是“懂事的那个”。', en: 'One sibling is "the smart one." You are "the sensible one."'},
  {from: 126.4, to: 130.4, text: '你后来考得再好，在家人眼里，聪明的还是那一个。', en: 'However well you did later, to your family the smart one stayed the smart one.'},
  {from: 130.8, to: 134.6, text: '那张标签，你一直带着。', en: 'You have carried that label ever since.'},

  {from: 138.4, to: 142.0, text: '2022 年，MIT 的一位研究者在职场里研究了这些心虚的人。', en: 'In 2022, an MIT researcher studied people with these doubts at work.'},
  {from: 142.4, to: 145.6, text: '结果出乎意料：他们的工作表现，并不比别人差。', en: 'The surprise: their performance was no worse than anyone else\'s.'},
  {from: 146.0, to: 149.4, text: '别人还觉得他们**更会和人打交道**。', en: 'And others rated them better with people.'},
  {from: 149.8, to: 153.6, text: '因为觉得自己能力不够，他们会花更多心思去倾听、去合作。', en: 'Feeling less capable, they put more effort into listening and working together.'},
  {from: 154.0, to: 157.6, text: '那份心虚，被你用成了**认真**。', en: 'You turned that self-doubt into care.'},

  {from: 160.4, to: 164.2, text: '有人汇总了六十多项研究、一万四千多人：男女都有，从学生到资深专家都有。', en: 'A review of 62 studies and over 14,000 people: men and women, students to senior experts.'},
  {from: 164.6, to: 168.4, text: '每个人都在偷偷审判自己，所以每个人都以为，只有自己是装的。', en: 'Everyone is quietly on trial, so everyone thinks they alone are faking it.'},
  {from: 168.8, to: 171.6, text: '下次那句“他们会发现的”再冒出来，', en: 'Next time "they\'ll find out" shows up,'},
  {from: 171.8, to: 174.6, text: '把被你驳回的证据也摆上来：那份方案，你改了七版。', en: 'put the dismissed evidence back on the table: you rewrote that proposal seven times.'},
  {from: 174.8, to: 177.4, text: '运气能让你过一次关，过不了这么多次。', en: 'Luck gets you through once. Not this many times.'},
];

export const ONSCREEN = {
  title: '冒名顶替综合征',
  en: 'IMPOSTOR SYNDROME',
  hook: '为什么越被夸，越心虚？',
  notif: ['恭喜！你的方案通过了！', '领导', '刚刚'],
  caseNo: '案卷 No.2026-IMP-001',
  chips: ['立案', '证物', '来历', '循环', '五种', '分工', '新证据', '结案'],
  defendant: ['被告', '你自己', '罪名', '骗子', '原告', '也是你'],
  exhibits: ['升职通知', '运气好', '同事的夸奖', '客气而已', '考了第一', '这次题简单', '一次失误', '看吧，这才是真的我'],
  stamps: ['骗子', '驳回', '有利证据', '结案', '不予采信'],
  types: ['完美主义者', '天才型', '独行侠', '专家型', '超人型'],
  family: ['聪明的孩子', '懂事的那个'],
  verdict: '结案：你没有骗任何人。',
  verdictEn: 'CASE CLOSED: YOU FOOLED NO ONE.',
  misc: ['1978', '150+', '62', '14,161', '2022', 'MIT', '99', '1', '七版', '焦虑', '准备', '拖延', '成了', '运气', '努力', '新任务', 'REC', '2026.10', '律师', '医生', '大学教师', '现象', 'PHENOMENON', 'GUILTY', 'CLOSED', '你'],
};

export const MUSIC = {
  file: 'audio/bgm_A_hell_no_vocals.wav',
  level: 0.55,
};

const flat = (v: unknown): string[] =>
  typeof v === 'string' ? [v] : Array.isArray(v) ? v.flatMap(flat) : v && typeof v === 'object' ? Object.values(v).flatMap(flat) : [];

export const ALL_TEXT = Array.from(
  new Set([...CUES.map((c) => c.text.replace(/\*\*/g, '')), ...flat(ONSCREEN), '0123456789·—“”：，。&？！No.'].join('')),
).join('');

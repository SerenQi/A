import type {Cue} from './components/Text';

// 每个场景的时长（帧，30fps）。相邻场景之间有 TRANSITION 帧的交叠转场。
export const TRANSITION = 30;
export const DUR = {
  intro: 390,
  legend: 660,
  replace: 1170,
  question: 450,
  hobbes: 750,
  answers: 1080,
  human: 870,
  ending: 540,
};

export const TOTAL = Object.values(DUR).reduce((a, b) => a + b, 0) - TRANSITION * (Object.keys(DUR).length - 1);

// 字幕（帧号为场景内的相对帧）
export const CUES: Record<string, Cue[]> = {
  legend: [
    {from: 20, to: 130, text: '相传，雅典英雄特修斯深入克里特岛的迷宫，'},
    {from: 135, to: 235, text: '斩杀了吞噬雅典少年的牛头怪米诺陶洛斯。'},
    {from: 258, to: 350, text: '他乘着一艘三十支桨的木船，'},
    {from: 354, to: 445, text: '扬帆凯旋，回到雅典。'},
    {from: 462, to: 552, text: '雅典人将这艘船停泊在港口，精心保存，'},
    {from: 556, to: 640, text: '作为英雄的纪念，世代相传。'},
  ],
  replace: [
    {from: 18, to: 145, text: '岁月流逝，海风与盐水一点点侵蚀着木头。'},
    {from: 152, to: 325, text: '一块木板朽坏了，人们就拆下它，换上一块新的。'},
    {from: 335, to: 440, text: '一块、两块、十块……'},
    {from: 445, to: 595, text: '年复一年，修补从未停止。'},
    {from: 600, to: 752, text: '旧木板一块块离开，新木板一块块到来。'},
    {from: 765, to: 885, text: '终于，最后一块原始木板也被换下。'},
    {from: 985, to: 1150, text: '它看起来一模一样，停在同一个港口，叫着同一个名字。'},
  ],
  question: [
    {from: 240, to: 345, text: '普鲁塔克在《特修斯传》中记下了这个难题。'},
    {from: 350, to: 438, text: '从此，哲学家们争论了近两千年。'},
  ],
  hobbes: [
    {from: 18, to: 130, text: '十七世纪，英国哲学家霍布斯让问题更加棘手：'},
    {from: 136, to: 265, text: '假如有人把换下的旧木板全部收集起来，'},
    {from: 270, to: 398, text: '按原样，重新拼成了另一艘船——'},
    {from: 405, to: 540, text: '现在，有了两艘“特修斯之船”。'},
    {from: 548, to: 735, text: '哪一艘，才是真正的那一艘？'},
  ],
  answers: [
    {from: 14, to: 88, text: '对此，哲学家们给出了截然不同的回答。'},
    {from: 105, to: 320, text: '如果材料最重要，旧木板拼成的船才是原船。'},
    {from: 345, to: 560, text: '如果延续最重要，一直被修补的船才是原船。'},
    {from: 585, to: 800, text: '赫拉克利特说：万物皆流，无物常驻。'},
    {from: 825, to: 1040, text: '也有人认为，答案取决于我们如何定义“同一”。'},
  ],
  human: [
    {from: 20, to: 140, text: '其实，这个问题离你并不遥远。'},
    {from: 145, to: 290, text: '你身体里的细胞，每天都在死去，也在新生。'},
    {from: 295, to: 440, text: '多年前的你，和此刻的你，还是同一个人吗？'},
    {from: 445, to: 600, text: '可大脑皮层的多数神经元，却会伴随你的一生。'},
    {from: 605, to: 735, text: '也许，记忆与意识，才是那块从未被换掉的木板。'},
    {from: 740, to: 860, text: '又或者，连它们，也在每一天悄悄改写。'},
  ],
  ending: [
    {from: 20, to: 140, text: '特修斯之船，或许永远没有标准答案。'},
    {from: 145, to: 262, text: '但它一直在追问我们——'},
  ],
};

export const ANSWERS = [
  {
    num: '壹',
    title: '物质决定论',
    claim: '构成它的材料，决定了它是谁。',
    verdict: '旧木板拼成的 B 船，才是真正的特修斯之船。',
  },
  {
    num: '贰',
    title: '时空连续论',
    claim: '只要变化渐进而连续，它就还是它。',
    verdict: '从未中断、一直被修补的 A 船，才是原来那艘。',
  },
  {
    num: '叁',
    title: '赫拉克利特',
    claim: '“人不能两次踏进同一条河流。”',
    verdict: '万物皆流，“同一”只是片刻的幻象。',
  },
  {
    num: '肆',
    title: '约定论',
    claim: '“同一艘船”，只是我们约定的说法。',
    verdict: '问题不在船上，而在我们如何定义“同一”。',
  },
];

export const STATS = [
  {value: '约 3300 亿', label: '人体每天更替的细胞数量'},
  {value: '约 120 天', label: '一个红细胞的平均寿命'},
  {value: '数周', label: '皮肤表皮完成一轮更新'},
  {value: '约 10 年', label: '全身骨骼完成一轮重塑'},
];

export const MISC = [
  '特修斯之船',
  'THE SHIP OF THESEUS',
  '一个流传了两千年的哲学悖论',
  '原始木板',
  '第年',
  '这，还是特修斯之船吗？',
  '约公元 100 年 · 普鲁塔克',
  '1655 · 托马斯·霍布斯《论物体》',
  '一直被修补的船',
  '用旧木板拼成的船',
  '四种回答',
  '是什么，让你成为你？',
  '全片完',
  '旧木板',
  '0123456789/·？?ABAB',
  '神经元',
  '船',
];

export const ALL_TEXT = Array.from(
  new Set(
    [
      ...Object.values(CUES).flatMap((c) => c.map((x) => x.text)),
      ...ANSWERS.flatMap((a) => [a.num, a.title, a.claim, a.verdict]),
      ...STATS.flatMap((s) => [s.value, s.label]),
      ...MISC,
    ].join(''),
  ),
).join('');

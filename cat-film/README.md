# 薛定谔的猫

Remotion 知识短片：1920×1080、30fps、165 秒（4950 帧），中文字幕，无配音。
从人人都会说的“薛定谔的××”出发，推翻这个误读：薛定谔设计这只猫，是为了说明“叠加”用到猫身上有多荒唐；
再讲双缝实验、1935 年的思想实验、他与爱因斯坦的通信、退相干与多世界，最后回到口头禅——
真正处在叠加态里的，是不敢打开盒子的人。

## 运行

```bash
npm install
npm run dev        # Remotion Studio 预览
npm run render     # 输出 out/cat.mp4
node stills.mjs 600 1200   # 渲染指定帧到 out/f<帧>.jpg
```

音乐 `public/audio/bgm_A_hell_no_vocals.wav` 未入库，与另外几部同一条，生成步骤见 `../theseus-ship/audio/README.md`。

## 结构

| 文件 | 内容 |
|---|---|
| `src/config.ts` | 时长、9 个场景边界、配色、字幕、整屏大字、冲击点、音乐参数 |
| `src/components/Fx.tsx` | 震屏、白闪、颗粒、整屏大字、字幕（`**…**` 标红）、左上问题与右上出处 |
| `src/components/Things.tsx` | 木箱、猫、原子、盖革计数器、锤子、毒气瓶、口头禅卡片、1935 年论文、信封 |
| `src/scenes/ScenesA.tsx` | C1 标题、C2 口头禅、C3 误读、C4 双缝、C5 盒子里的实验 |
| `src/scenes/ScenesB.tsx` | C6 通信与误用、C7 退相干与多世界、C8 答案早已决定、C9 结尾 |
| `src/Film.tsx` | 场景交叠、震屏、大字压暗、字幕、音乐 |

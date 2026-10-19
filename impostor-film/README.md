# 蝴蝶效应 · 只差了 0.000127

Remotion 知识短片：1920×1080、30fps、165 秒（4950 帧），中英双语字幕，无配音。
从“天气预报为什么算不准”切入：气象学家把 0.506127 抄成 0.506，两条天气曲线从重合到完全不同；
世界并不是一台算得准的钟；最后落到洛伦兹吸引子——混沌不是随机，算不准，但有形状。

## 运行

```bash
npm install
npm run render                      # 输出 out/chaos.mp4
npx remotion still Cover out/cover.jpg --frame=0   # 竖版封面 1080×1440
node stills.mjs 600 1200            # 渲染指定帧到 out/f<帧>.jpg
```

音乐 `public/audio/bgm_A_hell_no_vocals.wav` 未入库，与另外几部同一条，生成步骤见 `../theseus-ship/audio/README.md`。

## 依据

- 洛伦兹把打印出的 0.506 代替内存里的 0.506127 重跑，模拟天气在几个“月”后完全不同（APS News “This Month in Physics History”）。
- 日常天气预报的可预测上限约两周（Penn State, Zhang 等；UCAR）。
- “蝴蝶扇动翅膀”来自一场演讲的题目；画出蝴蝶形状的是洛伦兹另一组更简单的方程。
- 片中的曲线和吸引子都是按洛伦兹方程（σ=10, ρ=28, β=8/3）实际积分出来的。

## 结构

| 文件 | 内容 |
|---|---|
| `src/config.ts` | 时长、7 个场景、字幕（中英）、画面大字、音乐参数 |
| `src/lib/lorenz.ts` | 洛伦兹方程 RK4 积分 |
| `src/scenes/Scenes1.tsx` | 天气预报、机房与两周、小数点、标题、钟、打印纸、咖啡、两条曲线 |
| `src/scenes/Scenes2.tsx` | 一束分叉的轨迹、钟碎了、地球上的蝴蝶、吸引子、结尾 |
| `src/Cover.tsx` | 竖版封面 |

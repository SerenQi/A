# 为什么人还在用纸

Remotion 知识短片：1920×1080、30fps、165 秒（4950 帧），中文字幕，面向观众（“你”）讲述
人为什么还在用纸——既讲纸的“物理性”，也讲情感上的原因：字迹里有人、纸会留下痕迹和厚度、
翻本子是“重逢”、放下了就在原处、纸会和人一起变老、人生要紧的时刻都落在纸上。

## 运行

```bash
npm install
npm run dev        # Remotion Studio 预览
npm run render     # 输出 out/paper.mp4
node stills.mjs 600 1200   # 渲染指定帧到 out/f<帧>.jpg
```

音乐文件 `public/audio/bgm_A_hell_no_vocals.wav` 未入库，与《忒修斯之船》用的是同一条：
按 `../theseus-ship/audio/README.md` 的步骤生成后复制过来即可。

## 美术

俯视的深色木桌 + 台灯暖光池。纸是奶白色、蓝黑墨水、浅蓝横线、淡红页边线；
屏幕世界是冷蓝光。暖与冷的对比本身就是这部片的论点。窗光扫过桌面表示日子流逝。

## 结构

| 文件 | 内容 |
|---|---|
| `src/config.ts` | 时长、10 个场景边界、配色、字体、字幕、画面文字、音乐参数 |
| `src/components/Kit.tsx` | 桌面、杂物、手机、纸、手写字、划线、票根、本子（含翻页）、合上的本子、滚动列表 |
| `src/components/ParticleText.tsx` | 粒子汇聚成字的标题 |
| `src/scenes/ScenesA.tsx` | 开场通知、物理性、痕迹（划掉 vs 退格）、厚度 vs 滚动条 |
| `src/scenes/ScenesB.tsx` | 找到 vs 重逢、放下了就在原处 |
| `src/scenes/ScenesC.tsx` | 1975 年的预言、字迹就是人、纸会变老与人生要紧的几张纸、收束 |
| `src/Film.tsx` | 桌面背景、常驻杂物、场景列表（含时间偏移）、开场大字、字幕、音乐 |

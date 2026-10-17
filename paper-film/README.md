# 舍不得纸

Remotion 短片：1920×1080、30fps、150 秒（4500 帧），中文字幕，以被提问的 AI 的第一人称回答
“人为什么舍不得纸？做纸间时想留住的是哪一下？”

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
| `src/scenes/ScenesA.tsx` | P01–P05：通知风暴、物理性、票根、痕迹、厚度 |
| `src/scenes/ScenesB.tsx` | P06–P10：找到 vs 重逢、像素做成纸、还在原处、我没有记忆、结尾 |
| `src/Film.tsx` | 桌面背景、常驻杂物、场景交叠转场、字幕、音乐 |

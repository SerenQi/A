# 忒修斯之船 · The Ship of Theseus

Remotion 知识动画：1920×1080、30fps、165 秒（4950 帧），中文字幕，细线美术。

## 运行

```bash
npm install
npm run dev        # Remotion Studio 预览
npm run render     # 输出 out/theseus-ship.mp4
node stills.mjs 600 720 810   # 渲染指定帧到 out/f<帧>.jpg（调试用）
```

想用本机已有的 Chromium，设置 `REMOTION_BROWSER=/path/to/chrome-headless-shell`。

## 结构

| 文件 | 内容 |
|---|---|
| `src/config.ts` | **全部制作参数**：fps、时长、11 个场景边界、配色、线宽、字体、字幕、画面文字、音乐路径 / 取段起点 / 音量包络 |
| `src/lib/hull.ts` | 船体几何：舷缘、龙骨、船首尾柱；22 块列板（5 列、错缝），每块有稳定 id、局部坐标、外法向、“拉直”形态 |
| `src/lib/story.ts` | 由帧号推导的全部状态：拆换时间表、旧板 / 新板轨迹、旧料区槽位、重组顺序、单一镜头关键帧 |
| `src/components/ShipParts.tsx` | 船体结构线、木板、缺口 |
| `src/components/Human.tsx` | 人体轮廓（儿童→成人拓扑一致，可逐点变形与粒子对位） |
| `src/components/Overlay.tsx` | 字幕、背景、尘点、标签、时间刻度 |
| `src/components/Music.tsx` | 顶层音频挂载 |
| `src/Film.tsx` | 把所有图层挂在同一个镜头 group 下 |
| `audio/` | 参考原混音、分离记录，见 `audio/README.md` |
| `reference/` | 参考截图（右侧平台按钮是遮挡，不是作品） |
| `docs/` | 制作命令原文、检查结果 |

## 原则

- 一切状态由 `frame / fps` 推导，任意跳帧结果一致；随机数用固定种子。
- 一块木板从拆下、进旧料区、到组成 B 船，用的是同一个 id 与同一条轨迹。
- 镜头只有一个父级 group；线宽按镜头缩放补偿，屏幕上保持 1.8 / 0.8 / 0.6 px。

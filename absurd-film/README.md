# 荒谬 · 西西弗斯的石头

Remotion 知识短片：1920×1080、30fps、165 秒（4950 帧），中文字幕，讲加缪的荒谬主义。
从西西弗斯推石头的神话出发，落到观众自己“起床、电车、工作……”的日子，再回到山上：
荒谬是什么、面对荒谬的三条路、下山时的清醒，以及反抗、自由、激情。

## 运行

```bash
npm install
npm run dev        # Remotion Studio 预览
npm run render     # 输出 out/absurd.mp4
node stills.mjs 600 1200   # 渲染指定帧到 out/f<帧>.jpg
```

音乐 `public/audio/bgm_A_hell_no_vocals.wav` 未入库，与另外两部同一条，生成步骤见 `../theseus-ship/audio/README.md`。

## 美术

层叠的远山剪影与雾、月夜到黎明的天空；小人带暖色轮廓光，石头上刻着计数；
每一次滚落都在坡上留下一道淡淡的轨迹，越积越多。城市段用亮窗的楼群和六格日常。

## 结构

| 文件 | 内容 |
|---|---|
| `src/config.ts` | 时长、11 个场景边界、配色、字体、字幕、画面文字、音乐参数 |
| `src/components/Land.tsx` | 天空、月亮、远山与雾、前景大山、坡面几何、旧轨迹 |
| `src/components/Figure.tsx` | 小人（前倾、步伐、推、抬头、锁链）、刻痕石头、计数器 |
| `src/lib/push.ts` | 石头与推石者在坡上的位置、镜头变换 |
| `src/scenes/MountainScenes.tsx` | 开场、神话、推石、下山、反抗·自由·激情、黎明 |
| `src/scenes/OtherScenes.tsx` | 城市与六格日常、“为什么”、荒谬、三条路、每个人的石头 |
| `src/Film.tsx` | 场景交叠、字幕、音乐 |

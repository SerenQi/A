# 反刍思维

Remotion 知识短片：1920×1080、30fps、165 秒（4950 帧），中文字幕，无配音。
从凌晨三点的内耗切入，讲反刍思维：人以为多想一遍就能想明白，
实验却显示反刍会让心情更差、想出的办法更差；出口是把“为什么”换成“接下来”。

## 运行

```bash
npm install
npm run dev        # Remotion Studio 预览
npm run render     # 输出 out/rumination.mp4
node stills.mjs 600 1200   # 渲染指定帧到 out/f<帧>.jpg
```

音乐 `public/audio/bgm_A_hell_no_vocals.wav` 未入库，与另外几部同一条，生成步骤见 `../theseus-ship/audio/README.md`。

## 依据

- Nolen-Hoeksema & Morrow (1993)：情绪低落者反刍 8 分钟心情更差，转移注意则好转。
- Lyubomirsky & Nolen-Hoeksema (1995)：反刍后解决人际难题的办法更差。
- Watkins (2008)：抽象地问“为什么”与具体地想“怎么做”的区别。

以上均据二手资料核对，原文未逐字核对。

## 结构

| 文件 | 内容 |
|---|---|
| `src/config.ts` | 时长、8 个场景、配色、字幕、画面大字、出处、音乐参数 |
| `src/lib/points.ts` | 点云：路径/文字取样、挤出成 3D、旋转投影、加色发光绘制 |
| `src/lib/clouds.ts` | 片中点云：人头、牛、人、标题字 |
| `src/lib/room.ts` | 透视卧室：墙、窗、光柱、浮尘、床 |
| `src/components/Canvas.tsx` | 每帧重画的整屏 canvas |
| `src/scenes/draw.ts` | 场景共用画法：光斑、水流、地面网格、发光线、流动的粒子环 |
| `src/components/Kit.tsx` | 舞台、镜头、轨道光点、气泡、文字 |
| `src/components/Fx.tsx` | 字幕、画面大字、角标、颗粒、震动 |
| `src/scenes/ScenesA.tsx` | 开头四种内耗、粒子标题、牛的反刍、绕着答案转 |
| `src/scenes/ScenesB.tsx` | 实验、太像思考、出口、结尾的窗 |

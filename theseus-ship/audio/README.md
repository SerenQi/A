# 音频来源与处理记录

## 原始文件（未改动）

`source/` 下是资料包里的三个参考录屏原混音，校验值见 `source/SHA256SUMS`。

| 代号 | 文件 | 来源 | 时长 | 格式 |
|---|---|---|---|---|
| A | `A_hell_source_mix.mp3` | 《他人即地狱》录屏音轨 | 165.58 s | MP3 48 kHz 单声道 |
| B | `B_entropy_source_mix.mp3` | 《熵增》录屏音轨 | 173.14 s | MP3 48 kHz 单声道 |
| C | `C_nihilism_source_mix.mp3` | 《虚无主义》录屏音轨 | 171.10 s | MP3 48 kHz 单声道 |

这些是原混音，不是纯伴奏。没有识别歌名，也没有声称识别。

## 分离

- 工具：npm 包 `demucs@1.0.0`（Meta Demucs v4 “htdemucs” 4 轨模型的 ONNX 移植，权重随包附带），onnxruntime-node，CPU，overlap 0.25。
  官方 PyTorch 版的模型下载地址在本环境被网络策略拦截，所以用了这个移植版。
- 步骤：
  1. `ffmpeg -i source/X.mp3 -ac 2 -ar 44100 -c:a pcm_s16le work/X.wav`（单声道复制为双声道，44.1 kHz；模型要求）
  2. `demucs work/X.wav -o separated` → `vocals / drums / bass / other`
  3. `no_vocals = drums + bass + other`（ffmpeg `amix normalize=0`，不做增益改变）
  4. 截取前 165.0 s → `public/audio/bgm_X_no_vocals.wav`（原速、原音高）
- 日志：`separated/demucs_log.txt`；每秒人声电平：`separated/*/vocals_rms_per_s.txt`

## 客观检查（不是听感结论）

| | 人声轨平均 / 峰值 | 人声 > −45 dBFS 的秒数 | 伴奏平均电平 | 重建残差（原混音 − 四轨之和）|
|---|---|---|---|---|
| A | −73.3 / −42.2 dB | 0 | −11.8 dB | −44.6 dB |
| B | −65.8 / −30.2 dB | 0 | −13.8 dB | −46.6 dB |
| C | −49.8 / −19.7 dB | 5（约 60–63 s、158–160 s）| −13.4 dB | −45.6 dB |

解读：
- A、B：模型几乎没在原混音里找到人声，`no_vocals` 与原混音基本一致。说明这两条原片大概率没有人声旁白，但音效、录屏杂音这类非人声内容不会被这一步去掉。
- C：只有两小段被判为人声，已从伴奏里减掉；请试听 `C_vocals_removed` 确认减掉的是什么，以及 `C_no_vocals` 在这两处是否有破损。
- 我无法凭听觉确认分离质量，以上只是电平统计。

## 试听文件（未入库，可重建）

`listen/X_no_vocals.mp3`（候选伴奏）与 `listen/X_vocals_removed.mp3`（被分离掉的部分）。

## 接入

`src/config.ts` 里的 `MUSIC.track` 设为 `'A' | 'B' | 'C'` 后，`src/components/Music.tsx` 在顶层挂载对应文件：
`startFrom` 秒起取段，0–1.2 s 淡入，161–165 s 淡出，电平 `MUSIC.level`。目前没有新旁白，所以没有做旁白闪避（ducking）。

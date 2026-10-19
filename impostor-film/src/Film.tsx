import React from 'react';
import {AbsoluteFill, Audio, staticFile, useCurrentFrame} from 'remotion';
import {CUES, FPS, H, INK, ONSCREEN, SCENES, W} from './config';
import {Canvas} from './components/Canvas';
import {captionBar, ground, finish, hud} from './scenes/print';
import {C0, C0_IMPACTS} from './scenes/C0';
import {CHAPTERS, CH_IMPACTS} from './scenes/chapters';
import {ensureFonts} from './lib/fonts';

ensureFonts();

type Scene = {key: keyof typeof SCENES; draw: (ctx: CanvasRenderingContext2D, s: number) => void};
const LIST: Scene[] = [{key: 'C0', draw: C0}, ...(['C1', 'C2', 'C3', 'C4', 'C5', 'C6', 'C7'] as const).map((key) => ({key, draw: CHAPTERS[key]}))];
const IMPACTS = [...C0_IMPACTS, ...CH_IMPACTS];

const shakeAt = (s: number) => {
  let x = 0;
  let y = 0;
  let f = 0;
  for (const im of IMPACTS) {
    const d = s - im.t;
    if (d < 0 || d > 0.6) continue;
    const a = im.power * 22 * (1 - d / 0.6) ** 2;
    x += Math.sin(d * 87 + im.t) * a;
    y += Math.cos(d * 71 + im.t) * a * 0.7;
    f = Math.max(f, im.flash * Math.exp(-d * 9));
  }
  return {x, y, f};
};

const draw = (ctx: CanvasRenderingContext2D, s: number) => {
  const frame = Math.round(s * FPS);
  ground(ctx);
  const {x, y, f} = shakeAt(s);
  ctx.save();
  ctx.translate(x, y);
  const sc = LIST.find(({key}) => s >= SCENES[key][0] && s < SCENES[key][1]) ?? LIST[LIST.length - 1];
  sc.draw(ctx, s);
  ctx.restore();
  const idx = Object.keys(SCENES).indexOf(sc.key);
  if (!(sc.key === 'C0' && (s < 4.6 || s > 9.6))) hud(ctx, String(idx).padStart(2, '0'), ONSCREEN.chips[idx], s);
  const cue = CUES.find((c) => s >= c.from && s < c.to);
  if (cue) captionBar(ctx, cue.text, cue.en, s - cue.from, clamp((s - (cue.to - 0.2)) / 0.2));
  finish(ctx, frame);
  if (f > 0) {
    ctx.fillStyle = `rgba(255,255,255,${Math.min(0.5, f)})`;
    ctx.fillRect(0, 0, W, H);
  }
};

const clamp = (v: number) => Math.max(0, Math.min(1, v));

export const Film: React.FC = () => {
  const frame = useCurrentFrame();
  const s = frame / FPS;
  return (
    <AbsoluteFill style={{background: INK.paper}}>
      <Canvas s={s} draw={draw} />
      {/* 只有音效；背景音乐发布时用平台自带的 */}
      <Audio src={staticFile('audio/sfx.wav')} />
    </AbsoluteFill>
  );
};

import React, {useLayoutEffect, useRef} from 'react';
import {AbsoluteFill} from 'remotion';
import {PALETTE as P} from './config';
import {ensureFonts} from './lib/fonts';
import {glow, person, rect, spotlight} from './scenes/stage';

ensureFonts();

/** 竖版封面 1080×1440：一道门，左边前台、右边后台 */
export const Cover: React.FC = () => {
  const ref = useRef<HTMLCanvasElement>(null);
  useLayoutEffect(() => {
    const ctx = ref.current?.getContext('2d');
    if (!ctx) return;
    ctx.fillStyle = '#05060A';
    ctx.fillRect(0, 0, 1080, 1440);
    const lg = ctx.createLinearGradient(0, 0, 540, 0);
    lg.addColorStop(0, '#1C140C');
    lg.addColorStop(1, '#2E2012');
    ctx.fillStyle = lg;
    ctx.fillRect(0, 0, 540, 920);
    const rg = ctx.createLinearGradient(540, 0, 1080, 0);
    rg.addColorStop(0, '#1A0A08');
    rg.addColorStop(1, '#2A0E0A');
    ctx.fillStyle = rg;
    ctx.fillRect(540, 0, 540, 920);
    spotlight(ctx, 280, 860, 460, 1);
    person(ctx, 280, 860, 1.2, {t: 0, yaw: 0.5});
    glow(ctx, 820, 860, 160, P.red, 0.6);
    person(ctx, 800, 860, 1.2, {t: 0, slump: 0.8, yaw: -0.5, color: P.ember});
    ctx.fillStyle = '#3A2614';
    ctx.fillRect(505, 260, 70, 620);
    rect(ctx, 505, 260, 70, 620, P.gold, 4, 1);
    const fade = ctx.createLinearGradient(0, 700, 0, 960);
    fade.addColorStop(0, 'rgba(5,6,10,0)');
    fade.addColorStop(1, 'rgba(5,6,10,1)');
    ctx.fillStyle = fade;
    ctx.fillRect(0, 700, 1080, 260);
  }, []);
  return (
    <AbsoluteFill style={{background: P.bg}}>
      <canvas ref={ref} width={1080} height={1440} style={{position: 'absolute', inset: 0}} />
      <div style={{position: 'absolute', top: 120, width: 1080, display: 'flex', justifyContent: 'space-between', padding: '0 120px', boxSizing: 'border-box', fontFamily: '"Noto Serif SC", serif', fontWeight: 900, fontSize: 44}}>
        <span style={{color: P.ember}}>前台</span>
        <span style={{color: P.red}}>后台</span>
      </div>
      <div style={{position: 'absolute', top: 960, width: 1080, textAlign: 'center'}}>
        <div style={{fontFamily: '"Noto Serif SC", serif', fontWeight: 900, fontSize: 170, letterSpacing: 24, color: P.text, textShadow: `0 0 40px ${P.ember}88`}}>拟剧论</div>
        <div style={{fontFamily: '"Noto Serif SC", serif', fontStyle: 'italic', fontSize: 30, letterSpacing: 14, color: P.gold, marginTop: 4}}>DRAMATURGY</div>
        <div style={{fontFamily: '"Noto Serif SC", serif', fontWeight: 900, fontSize: 52, color: P.ember, marginTop: 30, letterSpacing: 4}}>
          世界是个巨大的<span style={{color: P.red}}>草台班子</span>
        </div>
        <div style={{fontFamily: '"Noto Serif SC", serif', fontSize: 34, color: '#CFC8BA', marginTop: 14, letterSpacing: 6}}>每个人都有后台</div>
      </div>
    </AbsoluteFill>
  );
};

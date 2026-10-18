import React, {useLayoutEffect, useRef} from 'react';
import {AbsoluteFill} from 'remotion';
import {PALETTE as P} from './config';
import {drawPoints} from './lib/points';
import {wings} from './scenes/Scenes1';
import {ensureFonts} from './lib/fonts';

ensureFonts();

/** 竖版封面 1080×1440：发光的吸引子 + 片名 + 钩子 */
export const Cover: React.FC = () => {
  const ref = useRef<HTMLCanvasElement>(null);
  useLayoutEffect(() => {
    const ctx = ref.current?.getContext('2d');
    if (!ctx) return;
    const g = ctx.createLinearGradient(0, 0, 0, 1440);
    g.addColorStop(0, '#05060A');
    g.addColorStop(1, '#0B0C12');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 1080, 1440);
    drawPoints(ctx, wings(), {yaw: 0.08, pitch: 0.05, cx: 540, cy: 500, scale: 0.9, f: 4200, dist: 4200}, {color: P.gold, size: 3.2, alpha: 0.55, t: 0, twinkle: 0.2});
  }, []);
  return (
    <AbsoluteFill style={{background: P.bg}}>
      <canvas ref={ref} width={1080} height={1440} style={{position: 'absolute', inset: 0}} />
      <div style={{position: 'absolute', top: 930, width: 1080, textAlign: 'center'}}>
        <div style={{fontFamily: '"Noto Serif SC", serif', fontWeight: 900, fontSize: 150, letterSpacing: 16, color: P.text, textShadow: `0 0 40px ${P.ember}88`}}>蝴蝶效应</div>
        <div style={{fontFamily: '"Noto Serif SC", serif', fontStyle: 'italic', fontSize: 30, letterSpacing: 12, color: P.gold, marginTop: 6}}>THE BUTTERFLY EFFECT</div>
        <div style={{fontFamily: '"Noto Serif SC", serif', fontWeight: 900, fontSize: 52, color: P.ember, marginTop: 34, letterSpacing: 4}}>
          只差了 <span style={{color: P.red}}>0.000127</span>
        </div>
        <div style={{fontFamily: '"Noto Serif SC", serif', fontSize: 34, color: '#CFC8BA', marginTop: 14, letterSpacing: 4}}>天气，就再也算不准了</div>
      </div>
    </AbsoluteFill>
  );
};

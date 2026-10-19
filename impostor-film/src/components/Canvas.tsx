import React, {useLayoutEffect, useRef} from 'react';
import {H, W} from '../config';

/** 每帧重画的整屏 canvas（Remotion 截图前 useLayoutEffect 已完成） */
export const Canvas: React.FC<{s: number; draw: (ctx: CanvasRenderingContext2D, s: number) => void}> = ({s, draw}) => {
  const ref = useRef<HTMLCanvasElement>(null);
  useLayoutEffect(() => {
    const c = ref.current;
    if (!c) return;
    const ctx = c.getContext('2d');
    if (!ctx) return;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = 'source-over';
    ctx.clearRect(0, 0, W, H);
    draw(ctx, s);
  }, [s, draw]);
  return <canvas ref={ref} width={W} height={H} style={{position: 'absolute', inset: 0}} />;
};

import React from 'react';
import {Composition} from 'remotion';
import {Film} from './Film';
import {DURATION, FPS, H, W} from './config';

export const RemotionRoot: React.FC = () => (
  <Composition id="Absurd" component={Film} durationInFrames={DURATION} fps={FPS} width={W} height={H} />
);

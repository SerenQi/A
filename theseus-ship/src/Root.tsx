import React from 'react';
import {Composition} from 'remotion';
import {Film} from './Film';
import {FPS, H, W} from './lib/theme';
import {TOTAL} from './script';

export const RemotionRoot: React.FC = () => (
  <Composition id="Theseus" component={Film} durationInFrames={TOTAL} fps={FPS} width={W} height={H} />
);

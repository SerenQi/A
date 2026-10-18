import React from 'react';
import {Composition} from 'remotion';
import {Film} from './Film';
import {GLTest} from './gl/Test';
import {DURATION, FPS, H, W} from './config';

export const RemotionRoot: React.FC = () => (
  <>
    <Composition id="Rumination" component={Film} durationInFrames={DURATION} fps={FPS} width={W} height={H} />
    <Composition id="GLTest" component={GLTest} durationInFrames={60} fps={FPS} width={W} height={H} />
  </>
);

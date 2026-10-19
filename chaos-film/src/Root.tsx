import React from 'react';
import {Composition} from 'remotion';
import {Film} from './Film';
import {Cover} from './Cover';
import {Short, SHORT_FRAMES} from './Short';
import {DURATION, FPS, H, W} from './config';

export const RemotionRoot: React.FC = () => (
  <>
    <Composition id="Chaos" component={Film} durationInFrames={DURATION} fps={FPS} width={W} height={H} />
    <Composition id="Short" component={Short} durationInFrames={SHORT_FRAMES} fps={FPS} width={W} height={H} />
    <Composition id="Cover" component={Cover} durationInFrames={1} fps={FPS} width={1080} height={1440} />
  </>
);

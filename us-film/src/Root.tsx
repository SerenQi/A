import React from 'react';
import {Composition} from 'remotion';
import {Concept} from './Concept';

export const RemotionRoot: React.FC = () => <Composition id="Concept" component={Concept} durationInFrames={1} fps={30} width={1920} height={1080} />;

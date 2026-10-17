import React from 'react';
import {AbsoluteFill} from 'remotion';
import {TransitionSeries, linearTiming} from '@remotion/transitions';
import {fade} from '@remotion/transitions/fade';
import {FilmLook} from './components/Atmos';
import {ensureFonts} from './lib/fonts';
import {DUR, TRANSITION} from './script';
import {Intro} from './scenes/Intro';
import {Legend} from './scenes/Legend';
import {Replace} from './scenes/Replace';
import {Question} from './scenes/Question';
import {Hobbes} from './scenes/Hobbes';
import {Answers} from './scenes/Answers';
import {Human} from './scenes/Human';
import {Ending} from './scenes/Ending';

ensureFonts();

const SCENES: [keyof typeof DUR, React.FC][] = [
  ['intro', Intro],
  ['legend', Legend],
  ['replace', Replace],
  ['question', Question],
  ['hobbes', Hobbes],
  ['answers', Answers],
  ['human', Human],
  ['ending', Ending],
];

export const Film: React.FC = () => (
  <AbsoluteFill style={{background: '#000'}}>
    <TransitionSeries>
      {SCENES.flatMap(([key, Comp], i) => {
        const seq = (
          <TransitionSeries.Sequence key={key} durationInFrames={DUR[key]}>
            <Comp />
          </TransitionSeries.Sequence>
        );
        if (i === 0) return [seq];
        return [
          <TransitionSeries.Transition key={`${key}-t`} presentation={fade()} timing={linearTiming({durationInFrames: TRANSITION})} />,
          seq,
        ];
      })}
    </TransitionSeries>
    <FilmLook />
  </AbsoluteFill>
);

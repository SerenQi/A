import React from 'react';
import {Audio, interpolate, staticFile} from 'remotion';
import {DURATION, FPS, MUSIC} from '../config';

export const MusicTrack: React.FC = () => {
  const [i0, i1] = MUSIC.fadeIn;
  const [o0, o1] = MUSIC.fadeOut;
  return (
    <Audio
      src={staticFile(MUSIC.file)}
      trimBefore={Math.round(MUSIC.startFrom * FPS)}
      durationInFrames={DURATION}
      volume={(fr) => MUSIC.level * interpolate(fr / FPS, [i0, i1, o0, o1], [0, 1, 1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'})}
    />
  );
};

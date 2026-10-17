import React from 'react';
import {Audio, interpolate, staticFile} from 'remotion';
import {DURATION, FPS, MUSIC} from '../config';

/** 顶层挂载的伴奏。track 为 null 时不挂音频（画面预览）。 */
export const MusicTrack: React.FC = () => {
  if (!MUSIC.track) return null;
  const [i0, i1] = MUSIC.fadeIn;
  const [o0, o1] = MUSIC.fadeOut;
  return (
    <Audio
      src={staticFile(MUSIC.files[MUSIC.track])}
      trimBefore={Math.round(MUSIC.startFrom * FPS)}
      durationInFrames={DURATION}
      volume={(fr) =>
        MUSIC.level *
        interpolate(fr / FPS, [i0, i1, o0, o1], [0, 1, 1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'})
      }
    />
  );
};

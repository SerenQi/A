import '@fontsource/noto-serif-sc/chinese-simplified-400.css';
import '@fontsource/noto-serif-sc/chinese-simplified-600.css';
import '@fontsource/noto-serif-sc/chinese-simplified-900.css';
import '@fontsource/noto-serif-sc/latin-400.css';
import '@fontsource/noto-serif-sc/latin-600.css';
import '@fontsource/noto-serif-sc/latin-900.css';
import '@fontsource/ma-shan-zheng/chinese-simplified-400.css';
import '@fontsource/ma-shan-zheng/latin-400.css';
import {continueRender, delayRender} from 'remotion';
import {ALL_TEXT} from '../script';

let started = false;

/** 预先加载片中会出现的每一个汉字所在的字体分片，避免渲染时出现回退字体。 */
export const ensureFonts = () => {
  if (started || typeof document === 'undefined') return;
  started = true;
  const handle = delayRender('Loading fonts', {timeoutInMilliseconds: 120000});
  const specs = [
    '400 40px "Noto Serif SC"',
    '600 40px "Noto Serif SC"',
    '900 40px "Noto Serif SC"',
    '400 40px "Ma Shan Zheng"',
  ];
  Promise.all(specs.map((s) => document.fonts.load(s, ALL_TEXT)))
    .then(() => document.fonts.ready)
    .then(() => continueRender(handle))
    .catch((e) => {
      console.error(e);
      continueRender(handle);
    });
};

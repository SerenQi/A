// 用法：node stills.mjs 100 460 900 ...  → out/f<frame>.png（调试用）
import {bundle} from '@remotion/bundler';
import {renderStill, selectComposition} from '@remotion/renderer';
import path from 'node:path';

const frames = process.argv.slice(2).map(Number);
const serveUrl = await bundle({entryPoint: path.resolve('src/index.ts')});
const browserExecutable = process.env.REMOTION_BROWSER ?? null;
const composition = await selectComposition({serveUrl, id: 'Theseus', browserExecutable});
for (const frame of frames) {
  await renderStill({composition, serveUrl, frame, output: `out/f${frame}.jpg`, browserExecutable, imageFormat: 'jpeg', jpegQuality: 80});
  console.log('rendered', frame);
}

// 把 chapters.ts 里的 SFX 时间点导出成 sfx/events.json，给 synth.py 混音用
import {build} from 'esbuild';
import {writeFileSync} from 'node:fs';
import {pathToFileURL} from 'node:url';
import path from 'node:path';

const out = path.resolve('sfx/.events.bundle.mjs');
await build({entryPoints: ['src/scenes/chapters.ts'], bundle: true, format: 'esm', platform: 'node', outfile: out, logLevel: 'error'});
const {SFX} = await import(pathToFileURL(out).href);
writeFileSync('sfx/events.json', JSON.stringify(SFX));
console.log('events', SFX.length);

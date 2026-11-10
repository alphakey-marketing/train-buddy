// 出網頁版去 dist/：expo export + GitHub Pages 需要嘅檔 + 蓋 service worker 版本
import { execSync } from 'node:child_process';
import { copyFileSync, readFileSync, writeFileSync } from 'node:fs';

execSync('npx expo export --platform web --clear', { stdio: 'inherit' });
writeFileSync('dist/.nojekyll', '');
copyFileSync('dist/index.html', 'dist/404.html');
const sw = readFileSync('dist/sw.js', 'utf8').replace('__BUILD__', String(Date.now()));
writeFileSync('dist/sw.js', sw);
console.log('網頁版出好，喺 dist/');

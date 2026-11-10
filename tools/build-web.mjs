// 出網頁版去 dist/：expo export + GitHub Pages 需要嘅檔 + 蓋 service worker 版本
import { execSync } from 'node:child_process';
import { copyFileSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';

execSync('npx expo export --platform web --clear', { stdio: 'inherit' });
writeFileSync('dist/.nojekyll', '');
copyFileSync('dist/index.html', 'dist/404.html');
// 主程式預先存低；3D（TrainerScene）同模型太大，用到先存
const js = readdirSync('dist/_expo/static/js/web')
  .filter((f) => f.startsWith('index-') && f.endsWith('.js'))
  .map((f) => `_expo/static/js/web/${f}`);
const sw = readFileSync('dist/sw.js', 'utf8')
  .replace('train-buddy-__BUILD__', `train-buddy-${Date.now()}`)
  .replace('__PRECACHE__', JSON.stringify(js));
writeFileSync('dist/sw.js', sw);
console.log('網頁版出好，喺 dist/');

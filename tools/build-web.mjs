// 出網頁版去 dist/：expo export + GitHub Pages 需要嘅檔 + 蓋 service worker 版本
import { execSync } from 'node:child_process';
import { copyFileSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';

execSync('npx expo export --platform web --clear', { stdio: 'inherit' });
writeFileSync('dist/.nojekyll', '');
copyFileSync('dist/index.html', 'dist/404.html');
// 預先存低全部程式、3D 模型同縮圖（冇網都要睇到）
const js = readdirSync('dist/_expo/static/js/web')
  .filter((f) => f.endsWith('.js'))
  .map((f) => `_expo/static/js/web/${f}`);
const models = readdirSync('dist/assets', { recursive: true })
  .map((f) => String(f).split(String.fromCharCode(92)).join('/'))
  .filter((f) => f.endsWith('.glb') || f.endsWith('.jpg'))
  .map((f) => `assets/${f}`);
const sw = readFileSync('dist/sw.js', 'utf8')
  .replace('train-buddy-__BUILD__', `train-buddy-${Date.now()}`)
  .replace('__PRECACHE__', JSON.stringify([...js, ...models]));
writeFileSync('dist/sw.js', sw);
console.log('網頁版出好，喺 dist/');

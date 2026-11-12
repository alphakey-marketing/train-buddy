// 開發用：node tools/thumbs.mjs [id...] — 影每個動作一張正方縮圖去 assets/thumbs/<id>.jpg，再寫 src/data/thumbs.ts。
// 要先 npx expo start --web --port 8099
import { spawn } from 'node:child_process';
import { existsSync, mkdirSync, readdirSync, writeFileSync } from 'node:fs';

const only = process.argv.slice(2);
const out = 'assets/thumbs';
mkdirSync(out, { recursive: true });
const port = 9300 + Math.floor(Math.random() * 500);
const proc = spawn('C:/Program Files/Google/Chrome/Application/chrome.exe', [
  '--headless=new', `--remote-debugging-port=${port}`, '--use-gl=angle', '--use-angle=swiftshader',
  '--enable-unsafe-swiftshader', '--user-data-dir=' + process.env.TEMP + '/thumbs-' + port, 'about:blank',
], { stdio: 'ignore' });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let list;
for (let i = 0; i < 40; i++) {
  try { list = await (await fetch(`http://127.0.0.1:${port}/json`)).json(); if (list.find((x) => x.type === 'page')) break; } catch {}
  await sleep(300);
}
const ws = new WebSocket(list.find((x) => x.type === 'page').webSocketDebuggerUrl);
await new Promise((r) => (ws.onopen = r));
let n = 0;
const pending = new Map();
ws.onmessage = (m) => { const d = JSON.parse(m.data); pending.get(d.id)?.(d.result); };
const send = (method, params = {}) => new Promise((r) => { const i = ++n; pending.set(i, r); ws.send(JSON.stringify({ id: i, method, params })); });
const ev = async (expression) => (await send('Runtime.evaluate', { expression }))?.result?.value;
await send('Page.enable');
await send('Emulation.setDeviceMetricsOverride', { width: 320, height: 320, deviceScaleFactor: 1, mobile: false });
await send('Page.navigate', { url: 'http://localhost:8099/?lab=list#list=1' });
let rows;
for (let i = 0; i < 60 && !rows; i++) {
  await sleep(1000);
  const t = await ev('document.body.innerText');
  if (t && t.startsWith('LIST')) rows = JSON.parse(t.slice(4));
}
if (!rows) { console.log('no list'); process.exit(1); }
const todo = only.length ? rows.filter((r) => only.includes(r.id)) : rows;
// 暖身：先切去第一個動作等 3D 載入，避免第一張影到列表文字
await ev(`location.hash='lab=${todo[0].id}&t=1&clean=1'`);
await sleep(6000);
let first = true;
for (const r of todo) {
  // 拉筋：停喺中間；循環動作：去到最大幅度附近
  const t = r.hold ? 15 : +(r.cycle * 0.4).toFixed(2);
  await ev(`location.hash='lab=${r.id}&t=${t}&clean=1'`);
  await sleep(first ? 4000 : 2000); // 第一張要等 3D 模型載入
  first = false;
  const shot = await send('Page.captureScreenshot', { format: 'jpeg', quality: 78 });
  writeFileSync(`${out}/${r.id}.jpg`, Buffer.from(shot.data, 'base64'));
  console.log(r.id);
}
ws.close();
proc.kill();

// 重寫索引：每張相一行 require（Metro 要靜態 require）
const ids = readdirSync(out).filter((f) => f.endsWith('.jpg')).map((f) => f.slice(0, -4)).sort();
const known = new Set(rows.map((r) => r.id));
const lines = ids.filter((id) => known.has(id) && existsSync(`${out}/${id}.jpg`)).map((id) => `  '${id}': require('../../assets/thumbs/${id}.jpg'),`);
writeFileSync(
  'src/data/thumbs.ts',
  `// 自動生成：node tools/thumbs.mjs。每個動作一張縮圖。\nimport type { ImageSourcePropType } from 'react-native';\n\nexport const THUMBS: Record<string, ImageSourcePropType | undefined> = {\n${lines.join('\n')}\n};\n`,
);
console.log('thumbs.ts', lines.length);
process.exit(0);

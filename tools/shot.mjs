// 開發用：node tools/shot.mjs <動作id> <秒> <角度> <輸出.png>
// 要先 npx expo start --web --port 8099。用 headless Chrome 影一張定格相，再讀返頁面上嘅驗證數字。
import { spawn } from 'node:child_process';
import { writeFileSync } from 'node:fs';

const [id, t = '15', v = '', out = 'shot.png'] = process.argv.slice(2);
const chrome = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const port = 9300 + Math.floor(Math.random() * 500);
const proc = spawn(chrome, [
  '--headless=new', `--remote-debugging-port=${port}`, '--use-gl=angle', '--use-angle=swiftshader',
  '--enable-unsafe-swiftshader', '--window-size=420,800', '--user-data-dir=' + process.env.TEMP + '/shot-' + port, 'about:blank',
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
await send('Page.enable');
await send('Emulation.setDeviceMetricsOverride', { width: 420, height: 800, deviceScaleFactor: 1, mobile: false });
await send('Page.navigate', { url: `http://localhost:8099/?lab=${id}&t=${t}${v ? '&v=' + v : ''}` });
let text = '';
for (let i = 0; i < 100; i++) {
  await sleep(1000);
  const r = await send('Runtime.evaluate', { expression: 'document.body.innerText.slice(0,200)' });
  text = r?.result?.value ?? '';
  if (/手離目標=\d/.test(text) && !/最低點離地=0\.0cm/.test(text)) break;
}
await sleep(1500);
const shot = await send('Page.captureScreenshot', { format: 'png' });
writeFileSync(out, Buffer.from(shot.data, 'base64'));
console.log(text.replace(/\n/g, ' '));
ws.close();
proc.kill();
process.exit(0);

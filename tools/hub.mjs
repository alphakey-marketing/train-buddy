// 開發用：node tools/hub.mjs <輸出.png> — 塞一個測試 profile，影主頁。要先 npx expo start --web --port 8099
import { spawn } from 'node:child_process';
import { writeFileSync } from 'node:fs';

const out = process.argv[2] ?? 'hub.png';
const port = 9300 + Math.floor(Math.random() * 500);
const proc = spawn('C:/Program Files/Google/Chrome/Application/chrome.exe', [
  '--headless=new', `--remote-debugging-port=${port}`, '--use-gl=angle', '--use-angle=swiftshader',
  '--enable-unsafe-swiftshader', '--user-data-dir=' + process.env.TEMP + '/hub-' + port, 'about:blank',
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
const ev = (expression) => send('Runtime.evaluate', { expression });
await send('Page.enable');
await send('Emulation.setDeviceMetricsOverride', { width: 420, height: 900, deviceScaleFactor: 1, mobile: false });
await send('Page.navigate', { url: 'http://localhost:8099/' });
await sleep(8000);
await ev(`localStorage.setItem('profile', JSON.stringify({pain:'neck',answers:{},tightness:{neck:0.9,traps:0.8,shoulders:0.6,chest:0.4},at:Date.now()}))`);
await send('Page.navigate', { url: 'http://localhost:8099/' });
await sleep(8000);
// 撳「開始」→ 去 hub
await ev(`[...document.querySelectorAll('div[role=button],div')].find(e=>e.children.length===0&&/身體地圖/.test(e.textContent))?.click()`);
await sleep(2500);
const t = await ev('document.body.innerText.slice(0,400)');
console.log(t?.result?.value);
const shot = await send('Page.captureScreenshot', { format: 'png' });
writeFileSync(out, Buffer.from(shot.data, 'base64'));
ws.close(); proc.kill(); process.exit(0);

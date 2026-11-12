// 開發用：node tools/flow.mjs — 塞測試 profile，由主頁撳去課程第 1 日、播放，逐步印畫面文字同影相。要先 npx expo start --web --port 8099
import { spawn } from 'node:child_process';
import { writeFileSync } from 'node:fs';

const dir = process.env.TEMP + '/shots/';
const port = 9300 + Math.floor(Math.random() * 500);
const proc = spawn('C:/Program Files/Google/Chrome/Application/chrome.exe', [
  '--headless=new', `--remote-debugging-port=${port}`, '--use-gl=angle', '--use-angle=swiftshader',
  '--enable-unsafe-swiftshader', '--user-data-dir=' + process.env.TEMP + '/flow-' + port, 'about:blank',
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
const click = (txt) => ev(`(()=>{const e=[...document.querySelectorAll('div')].filter(e=>e.textContent.includes(${JSON.stringify(txt)})&&getComputedStyle(e).cursor==='pointer').sort((a,b)=>a.textContent.length-b.textContent.length)[0];if(e){e.click();return 'ok'}return 'NOT FOUND'})()`);
const look = async (name, ms = 2500) => {
  await sleep(ms);
  console.log(`--- ${name}\n` + String(await ev('document.body.innerText.slice(0,260)')).replace(/\n+/g, ' | '));
  const shot = await send('Page.captureScreenshot', { format: 'png' });
  writeFileSync(dir + name + '.png', Buffer.from(shot.data, 'base64'));
};

await send('Page.enable');
await send('Emulation.setDeviceMetricsOverride', { width: Number(process.env.W||420), height: Number(process.env.H||900), deviceScaleFactor: 1, mobile: false });
await send('Page.navigate', { url: 'http://localhost:8099/' });
await sleep(6000);
await ev(`localStorage.clear();localStorage.setItem('profile', JSON.stringify({pain:'neck',answers:{},tightness:{neck:0.9,traps:0.8,shoulders:0.6,chest:0.4},at:Date.now()}))`);
await send('Page.navigate', { url: 'http://localhost:8099/' });
await sleep(6000);
console.log(await click('身體地圖'));
await look('f1-hub');
console.log(await click('開始課程'));
await look('f2-detail');
console.log(await click('開始第 1 日'));
await look('f3-preview', 4000);
console.log(await click('開始'));
await look('f4-ready', 3000);
await look('f5-play', 7000);
console.log('done flag:', await ev(`localStorage.getItem('programs')`));
ws.close(); proc.kill(); process.exit(0);

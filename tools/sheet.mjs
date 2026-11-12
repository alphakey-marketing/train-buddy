// 開發用：node tools/sheet.mjs <輸出資料夾> [id...] — 同一個 Chrome 逐個動作影兩幀（循環 30%、65%），印出誤差數字。要先 npx expo start --web --port 8099
import { spawn } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';

const [out, ...only] = process.argv.slice(2);
mkdirSync(out, { recursive: true });
const port = 9300 + Math.floor(Math.random() * 500);
const proc = spawn('C:/Program Files/Google/Chrome/Application/chrome.exe', [
  '--headless=new', `--remote-debugging-port=${port}`, '--use-gl=angle', '--use-angle=swiftshader',
  '--enable-unsafe-swiftshader', '--user-data-dir=' + process.env.TEMP + '/sheet-' + port, 'about:blank',
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
await send('Emulation.setDeviceMetricsOverride', { width: 300, height: 400, deviceScaleFactor: 1, mobile: false });
await send('Page.navigate', { url: 'http://localhost:8099/?lab=list#list=1' });
let rows;
for (let i = 0; i < 60 && !rows; i++) {
  await sleep(1000);
  const t = await ev('document.body.innerText');
  if (t && t.startsWith('LIST')) rows = JSON.parse(t.slice(4));
}
if (!rows) { console.log('no list'); process.exit(1); }
writeFileSync(out + '/list.json', JSON.stringify(rows));
const todo = only.length ? rows.filter((r) => only.includes(r.id)) : rows;
for (const r of todo) {
  for (const [k, f] of [['a', 0.3], ['b', 0.65]]) {
    const t = r.hold ? 15 : +(r.cycle * f).toFixed(2);
    await ev(`location.hash='lab=${r.id}&t=${t}'`);
    await sleep(1800);
    const text = String(await ev('document.body.innerText.slice(0,200)')).replace(/\n/g, ' ');
    const shot = await send('Page.captureScreenshot', { format: 'png' });
    writeFileSync(`${out}/${r.id}_${k}.png`, Buffer.from(shot.data, 'base64'));
    if (k === 'a') console.log(text.replace(/ t=.*? v=/, ' v='));
  }
}
ws.close(); proc.kill(); process.exit(0);

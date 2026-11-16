// Render high-resolution program covers from the current local web build.
const fs = require('node:fs');
const http = require('node:http');
const os = require('node:os');
const path = require('node:path');
const { spawn } = require('node:child_process');
const root = path.resolve('dist');
const output = path.resolve('assets/covers');
const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'train-buddy-covers-'));
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const server = http.createServer((req, res) => {
  let name = decodeURIComponent(new URL(req.url, 'http://localhost').pathname).replace(/^\/train-buddy\/?/, '') || 'index.html';
  const file = path.resolve(root, name);
  if (!file.startsWith(root + path.sep)) { res.writeHead(403).end(); return; }
  const types = { '.html': 'text/html', '.js': 'text/javascript', '.jpg': 'image/jpeg', '.png': 'image/png', '.glb': 'model/gltf-binary' };
  res.setHeader('Content-Type', types[path.extname(file)] || 'application/octet-stream');
  fs.createReadStream(file).on('error', () => res.writeHead(404).end()).pipe(res);
});

(async () => {
  let chrome, ws;
  try {
    fs.mkdirSync(output, { recursive: true });
    await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
    chrome = spawn('C:/Program Files/Google/Chrome/Application/chrome.exe', ['--headless=new', '--remote-debugging-port=0', '--no-first-run', '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', `--user-data-dir=${profile}`, 'about:blank'], { stdio: 'ignore' });
    const portFile = path.join(profile, 'DevToolsActivePort');
    for (let i = 0; i < 100 && !fs.existsSync(portFile); i++) await delay(100);
    const port = fs.readFileSync(portFile, 'utf8').split('\n')[0];
    const pages = await (await fetch(`http://127.0.0.1:${port}/json`)).json();
    ws = new WebSocket(pages.find((p) => p.type === 'page').webSocketDebuggerUrl);
    await new Promise((resolve, reject) => { ws.onopen = resolve; ws.onerror = reject; });
    let id = 0;
    const pending = new Map();
    ws.onmessage = (event) => { const msg = JSON.parse(event.data); if (pending.has(msg.id)) { pending.get(msg.id)(msg); pending.delete(msg.id); } };
    const send = (method, params = {}) => new Promise((resolve, reject) => {
      const key = ++id;
      const timeout = setTimeout(() => reject(Error(`CDP timeout: ${method}`)), 15000);
      pending.set(key, (result) => { clearTimeout(timeout); if (result.error) reject(Error(result.error.message)); else resolve(result.result); });
      ws.send(JSON.stringify({ id: key, method, params }));
    });
    await send('Page.enable');
    await send('Emulation.setDeviceMetricsOverride', { width: 960, height: 960, deviceScaleFactor: 1, mobile: false });
    const covers = ['upper-trap-stretch', 'child-pose', 'seated-figure4', 'wrist-flexor-stretch', 'low-lunge'];
    await send('Page.navigate', { url: `http://127.0.0.1:${server.address().port}/train-buddy/?lab=${covers[0]}&t=15&clean=1` });
    await delay(8000);
    for (const cover of covers) {
      await send('Runtime.evaluate', { expression: `location.hash = ${JSON.stringify(`lab=${cover}&t=15&clean=1`)}` });
      await delay(3500);
      const image = await send('Page.captureScreenshot', { format: 'jpeg', quality: 90 });
      fs.writeFileSync(path.join(output, `${cover}.jpg`), Buffer.from(image.data, 'base64'));
      console.log(`Captured ${cover}`);
    }
  } finally {
    if (ws) ws.close();
    if (chrome) chrome.kill();
    server.close();
  }
})().catch((error) => { console.error(error); process.exitCode = 1; });

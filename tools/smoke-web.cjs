// Exercise the exported GitHub Pages build in an isolated headless browser.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const http = require('node:http');
const os = require('node:os');
const path = require('node:path');
const { spawn } = require('node:child_process');

const root = path.resolve('dist');
const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'train-buddy-smoke-'));
const chromePath = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const server = http.createServer((req, res) => {
  const url = new URL(req.url, 'http://localhost');
  let name = decodeURIComponent(url.pathname).replace(/^\/train-buddy\/?/, '').replace(/^\//, '');
  if (!name) name = 'index.html';
  const file = path.resolve(root, name);
  if (!file.startsWith(root + path.sep)) { res.writeHead(403).end(); return; }
  const types = { '.html': 'text/html', '.js': 'text/javascript', '.json': 'application/json', '.webmanifest': 'application/manifest+json', '.jpg': 'image/jpeg', '.png': 'image/png', '.glb': 'model/gltf-binary' };
  res.setHeader('Content-Type', types[path.extname(file)] || 'application/octet-stream');
  fs.createReadStream(file).on('error', () => res.writeHead(404).end()).pipe(res);
});

(async () => {
  let chrome, ws;
  try {
    await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
    chrome = spawn(chromePath, ['--headless=new', '--remote-debugging-port=0', '--no-first-run', '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', `--user-data-dir=${profile}`, 'about:blank'], { stdio: 'ignore' });
    const portFile = path.join(profile, 'DevToolsActivePort');
    for (let i = 0; i < 100 && !fs.existsSync(portFile); i++) await delay(100);
    const debugPort = fs.readFileSync(portFile, 'utf8').split('\n')[0];
    const pages = await (await fetch(`http://127.0.0.1:${debugPort}/json`)).json();
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
    const evaluate = async (expression) => {
      const result = await send('Runtime.evaluate', { expression, returnByValue: true });
      if (result.exceptionDetails) throw Error(result.exceptionDetails.text);
      return result.result.value;
    };
    const text = () => evaluate('document.body.innerText');
    const waitFor = async (needle) => {
      for (let i = 0; i < 120; i++) { const body = await text(); if (body.includes(needle)) return body; await delay(250); }
      throw Error(`Missing text: ${needle}; body: ${(await text()).slice(0, 600)}`);
    };
    const click = async (label) => {
      const clicked = await evaluate(`(() => { const buttons = [...document.querySelectorAll('[role="button"], [role="radio"]')]; const el = buttons.find(e => e.innerText.trim() === ${JSON.stringify(label)} || e.getAttribute('aria-label') === ${JSON.stringify(label)}); if (!el) return false; el.click(); return true; })()`);
      assert.ok(clicked, `Missing button: ${label}`);
      await delay(400);
    };
    await send('Page.enable');
    await send('Browser.setDownloadBehavior', { behavior: 'allow', downloadPath: profile });
    await send('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 1, mobile: true });
    await send('Page.navigate', { url: `http://127.0.0.1:${server.address().port}/` });
    await waitFor('先試簡單練習');
    await click('先試簡單練習');
    await waitFor('今日練習');
    await click('8 分');
    assert.ok(!(await text()).split('\n').includes('開始'), 'Severe pain must prevent starting');
    await click('唔評分');
    assert.ok(!(await text()).split('\n').includes('開始'), 'Clearing score must not bypass known severe pain');
    await click('返回');
    await waitFor('午休短休息');
    await click('午休短休息');
    await waitFor('今日練習');
    await click('0 分');
    if ((await text()).includes('換另一個相近動作')) {
      await click('換另一個相近動作');
      await waitFor('原定動作已調整');
    }
    await click('開始');
    await waitFor('跳過');
    for (let i = 0; i < 10 && (await text()).includes('跳過'); i++) await click('跳過目前動作');
    await waitFor('唔評分，繼續');
    await click('唔評分，繼續');
    await waitFor('完成 0／');
    assert.equal(await evaluate("JSON.parse(localStorage.getItem('sessions') || '[]').length"), 0);
    await click('返主頁');
    await waitFor('坐低輕鬆郁');
    await waitFor('坐椅全身活動');
    assert.ok(!(await text()).includes('????'), 'Course text must be readable');
    const heroHeight = await evaluate(`(() => { const e = [...document.querySelectorAll('[role="button"]')].find(x => x.innerText.includes('今日推薦')); return e && e.getBoundingClientRect().height })()`);
    assert.ok(heroHeight > 0 && heroHeight < 500, `Hero should fit a mobile screen, got ${heroHeight}px`);
    const homeScreenshot = await send('Page.captureScreenshot', { format: 'png' });
    const homeScreenshotPath = path.join(profile, 'home.png');
    fs.writeFileSync(homeScreenshotPath, Buffer.from(homeScreenshot.data, 'base64'));
    console.log(`Home screenshot: ${homeScreenshotPath}`);
    await send('Emulation.setDeviceMetricsOverride', { width: 320, height: 568, deviceScaleFactor: 1, mobile: true });
    assert.ok(await evaluate('document.documentElement.scrollWidth <= 320'), '320px home must not overflow horizontally');
    await click('基礎鍛鍊教學 展開');
    await waitFor('容易版');
    await send('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 1, mobile: true });
    await click('下載每日提醒');
    await waitFor('已產生日曆檔');
    const calendar = path.join(profile, 'body-relax-reminder.ics');
    for (let i = 0; i < 40 && !fs.existsSync(calendar); i++) await delay(100);
    assert.match(fs.readFileSync(calendar, 'utf8'), /RRULE:FREQ=DAILY/);
    await click('坐椅全身活動');
    await waitFor('坐椅交替抬腿');
    await click('開始');
    await waitFor('跳過');
    await click('跳過目前動作');
    await waitFor('坐椅交替抬腿');
    await delay(7500);
    const screenshot = await send('Page.captureScreenshot', { format: 'png' });
    const screenshotPath = path.join(profile, 'seated-march.png');
    fs.writeFileSync(screenshotPath, Buffer.from(screenshot.data, 'base64'));
    console.log(`Web smoke passed: onboarding, pain gate, substitution, skipped session and new courses. Screenshot: ${screenshotPath}`);
  } finally {
    if (ws) ws.close();
    if (chrome) chrome.kill();
    server.close();
  }
})().catch((error) => { console.error(error); process.exitCode = 1; });

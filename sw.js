// 離線用 service worker
// 頁面：先上網拎新版，冇網先用 cache。其他檔案（JS、圖、模型）：有 cache 用 cache，冇先上網拎再存低。
// CACHE 名喺 build 時加時間，每次發佈都係新 cache，舊嘢會清走。
// PRECACHE 喺 build 時加主程式檔名：一裝好就存低，第二次開即刻有、冇網都用到。
const CACHE = 'train-buddy-1794300195575';
const PRECACHE = ['./', 'manifest.webmanifest', 'icon-192.png'].concat(["_expo/static/js/web/index-9f36748c4be25837cde100e51aa4ac8a.js","_expo/static/js/web/TrainerScene-fe76821d9d00b8c050878e657a5af7f6.js","assets/assets/models/figure.df3bf5efa391a5f784c856648f2362e1.glb"]);

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(PRECACHE)));
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k.startsWith('train-buddy-') && k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== location.origin) return;

  if (req.mode === 'navigate') {
    e.respondWith(
      fetch(req)
        .then((res) => {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put('./', copy));
          return res;
        })
        .catch(() => caches.match('./')),
    );
    return;
  }

  e.respondWith(
    caches.match(req).then(
      (hit) =>
        hit ||
        fetch(req).then((res) => {
          if (res.ok) {
            const copy = res.clone();
            caches.open(CACHE).then((c) => c.put(req, copy));
          }
          return res;
        }),
    ),
  );
});

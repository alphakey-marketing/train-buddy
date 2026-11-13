// 離線用 service worker
// 頁面：先上網拎新版，冇網先用 cache。其他檔案（JS、圖、模型）：有 cache 用 cache，冇先上網拎再存低。
// CACHE 名喺 build 時加時間，每次發佈都係新 cache，舊嘢會清走。
// PRECACHE 喺 build 時加主程式檔名：一裝好就存低，第二次開即刻有、冇網都用到。
const CACHE = 'train-buddy-1794532308504';
const PRECACHE = ['./', 'manifest.webmanifest', 'icon-192.png'].concat(["_expo/static/js/web/index-00f663f1fd7c8e9c07f117caa2288cbb.js","_expo/static/js/web/TrainerScene-5ae8a5b3a7fe59e14cc5107bb09d51f0.js","assets/assets/covers/child-pose.a285035f4a8d3fd37cf3d40faa8b3cc0.jpg","assets/assets/covers/low-lunge.cd84d78e3d782a030d9ba005e0e8dd96.jpg","assets/assets/covers/seated-figure4.bd7a741cdcf8c911af5012aebb37ef1a.jpg","assets/assets/covers/upper-trap-stretch.2fa2763167e086b3d5c0128915097b04.jpg","assets/assets/covers/wrist-flexor-stretch.bace6efac4cdb0843615c9f38f0b6266.jpg","assets/assets/models/coach-f.f9956c411cc3ac83936d66c921ebe096.glb","assets/assets/thumbs/arms-raise-drop.a2b6a997ac8df3e693dde1331ff1df95.jpg","assets/assets/thumbs/child-pose.4b7dede9bc9e4d0c512e467dc6cb3de7.jpg","assets/assets/thumbs/chin-tuck.907638c08bdfc08f00e6e3879d44b43f.jpg","assets/assets/thumbs/cross-arm-circle.c0b682c47fd254552f3bc61844410e6e.jpg","assets/assets/thumbs/cross-body-shoulder.229c0543dea1c0c2e987482605769f74.jpg","assets/assets/thumbs/doorway-pec.5daab8f7b6d3d28b8470d2d11a75aa42.jpg","assets/assets/thumbs/drop-high-knee-jump.534274b5773b5574293ca3e51f22764c.jpg","assets/assets/thumbs/drop-propel-start.0a8b634b808a4163861fa1f83ea9be5b.jpg","assets/assets/thumbs/drop-side-burst.8578d51039c66230dd21247da5bd185d.jpg","assets/assets/thumbs/drop-step-stamp.830b8088f91b0a6f2fcde742a8823064.jpg","assets/assets/thumbs/figure8-spine.01948daefe5aaa756eda031ad716afa4.jpg","assets/assets/thumbs/half-squat-rebound.0ba1649fcb90d14c6bd9ae4b29416243.jpg","assets/assets/thumbs/hamstring-chair.b145c331f0f02752d8b6c458625d336d.jpg","assets/assets/thumbs/hip-catch-reaction.11933138e4bcc43f3a54f7a2915878fa.jpg","assets/assets/thumbs/leg-drop.27c2b85fcbbf97a5e629ce05dc3eb86a.jpg","assets/assets/thumbs/leg-swing-relax.9d0419fddad75bb1e372d23de0c617e0.jpg","assets/assets/thumbs/levator-stretch.0cd554ba082954529485606c5fbac50d.jpg","assets/assets/thumbs/low-lunge.7780ad97530b0217a7c621216c93c3fa.jpg","assets/assets/thumbs/lunge-groin-tap.f567b06eddf17a1f38c96f5a51bc0a61.jpg","assets/assets/thumbs/lunge.94edfbea68f54f9ed38a496f43eea047.jpg","assets/assets/thumbs/pelvis-rotation-punch.d54329b79149bd939933f742b4252b7b.jpg","assets/assets/thumbs/plexus-arm-drop.a0102bb0ba148eef2787b82f4eeb2be5.jpg","assets/assets/thumbs/prone-scapula-spiral.7fa45d9709bc3121e95cf8ec919810b2.jpg","assets/assets/thumbs/scap-squeeze.8186b30a2bdda3d1d9e81c45ff182373.jpg","assets/assets/thumbs/seated-cat-cow.54ca0878c7dbd5e1ae7cde1a975817f7.jpg","assets/assets/thumbs/seated-figure4.5d76937aef51e04a1259053fed761f1a.jpg","assets/assets/thumbs/seated-rotation.793633ba55cfa8f36f62b2982a195763.jpg","assets/assets/thumbs/seated-thoracic-ext.3b41cd503ccb04c139688572fbb60f36.jpg","assets/assets/thumbs/seated-twist.a14825057181d94876d61773e6e96f67.jpg","assets/assets/thumbs/shoulder-press.8a1f3444801cc6e7d076b1434edfa976.jpg","assets/assets/thumbs/shoulder-roll.c50d0a46a6694d1eea07d532c242161a.jpg","assets/assets/thumbs/side-reach.e63c1b1d1d1f88e12ca26fb6f3d55b96.jpg","assets/assets/thumbs/single-arm-drop-rebound.70acaa2e0a646f08ce6541082c36ce3c.jpg","assets/assets/thumbs/single-leg-z-jump.e5916754a6efc9bf4a5f29b8eae6fcbe.jpg","assets/assets/thumbs/single-toe-curl-stand.a07042c60a60493db251c3646bed78eb.jpg","assets/assets/thumbs/slow-breath.5a920520ac97af015d41304cb8ace58d.jpg","assets/assets/thumbs/spine-pelvis-sway.246b0aa8b67345f9bbbd4b9eb520e774.jpg","assets/assets/thumbs/spine-spiral-arm-swing.46cf2f1d7af89627050feeb4c9712d5d.jpg","assets/assets/thumbs/squat-shift-support.7fe1981a3a2f3e86d603be1c8814b032.jpg","assets/assets/thumbs/squat.185a628b51e5b483a6695e2fae9dd8ac.jpg","assets/assets/thumbs/standing-back-ext.a27aa9a52ecadf8b410f97793dc776c5.jpg","assets/assets/thumbs/standing-hip-flexor.f10e8d42ba7374ad54d0973aa168fef1.jpg","assets/assets/thumbs/standing-quad.d67df32e5090e342085802abd64164b8.jpg","assets/assets/thumbs/supine-figure4.85c0560867a6fc737d189e61594c49f9.jpg","assets/assets/thumbs/tiptoe-heel-drop.c950e3a3c81eeba7c51d178ab08089f5.jpg","assets/assets/thumbs/tiptoe-overhead-walk.8019554608fc18fc18a3be617cbe1850.jpg","assets/assets/thumbs/tiptoe-stand.610e01d258a834cbc210e26085c93f1d.jpg","assets/assets/thumbs/toe-curl-grip.8c7bc79101238ebdaa9df9d9164ec0ff.jpg","assets/assets/thumbs/toe-interlace-grip.b81f3a8cd9a6c8ecb15694b762f63a9e.jpg","assets/assets/thumbs/toe-stretch.10caffd434f1f96911f48a422e56e3e2.jpg","assets/assets/thumbs/toe-touch.6e3387e4322b0b5db88b7b6ff5d5c748.jpg","assets/assets/thumbs/unilateral-spiral.be27f8b883adf35139a2f693648a7f0b.jpg","assets/assets/thumbs/upper-rib-roll.a023230c745c550aeefb42589e9e8d09.jpg","assets/assets/thumbs/upper-trap-stretch.b4d4d84fb2beb194c7e712eb4daf69bf.jpg","assets/assets/thumbs/wall-calf-stretch.0c0347103e68e60327ff7c30bdd5ff38.jpg","assets/assets/thumbs/wrist-extensor-stretch.60935c6b4a021caebef24e5545b9d25f.jpg","assets/assets/thumbs/wrist-flexor-stretch.40e6ba0b7de80a770f03e30411402b88.jpg"]);

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

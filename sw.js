const CACHE_NAME = 'sft-calendar-v3';
const ASSETS = [
  './',
  './index.html',
  './SHTCalendar.html',
  './manifest.json',
  './icon.png'
];

// インストール処理：キャッシュ登録 & skipWaiting で即時有効化
self.addEventListener('install', (e) => {
  self.skipWaiting();
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS);
    })
  );
});

// アクティベート処理：古いキャッシュの削除 & クライアントへの即時制御適用
self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Network-First 戦略：常にネットワークから最新アセットを取得し、失敗時のみキャッシュ
self.addEventListener('fetch', (e) => {
  // GETリクエストのみキャッシュ処理
  if (e.request.method !== 'GET') return;

  e.respondWith(
    fetch(e.request)
      .then((networkResponse) => {
        // 正常なレスポンスであればキャッシュを最新化
        if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(e.request, responseToCache);
          });
        }
        return networkResponse;
      })
      .catch(() => {
        // オフライン時はキャッシュから返す
        return caches.match(e.request);
      })
  );
});

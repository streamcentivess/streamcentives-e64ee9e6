const CACHE_NAME = 'streamcentives-v4';

self.addEventListener('install', (event) => {
  // Activate new SW immediately
  self.skipWaiting();
  
  // Notify clients that a new version is available
  event.waitUntil(
    self.clients.matchAll().then(clients => {
      clients.forEach(client => client.postMessage({ type: 'SW_UPDATED' }));
    })
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(keys.map((key) => (key === CACHE_NAME ? Promise.resolve() : caches.delete(key))));
      await self.clients.claim();
    })()
  );
});

function isScriptRequest(request) {
  const url = new URL(request.url);
  return (
    request.destination === 'script' ||
    url.pathname.endsWith('.js') ||
    url.pathname.includes('/node_modules/.vite/deps/') ||
    url.pathname.includes('/assets/')
  );
}

function isHTMLRequest(request) {
  const url = new URL(request.url);
  const sameOrigin = url.origin === self.location.origin;
  return (
    sameOrigin && (
      request.mode === 'navigate' ||
      request.destination === 'document' ||
      url.pathname === '/' ||
      request.headers.get('accept')?.includes('text/html')
    )
  );
}

function isStaticAsset(request) {
  const url = new URL(request.url);
  const sameOrigin = url.origin === self.location.origin;
  return (
    sameOrigin && (
      url.pathname.endsWith('.css') ||
      url.pathname.endsWith('.png') ||
      url.pathname.endsWith('.jpg') ||
      url.pathname.endsWith('.jpeg') ||
      url.pathname.endsWith('.webp') ||
      url.pathname.endsWith('.svg') ||
      url.pathname.endsWith('.ico') ||
      url.pathname.endsWith('.json') ||
      url.pathname.startsWith('/lovable-uploads/') ||
      url.pathname === '/manifest.json'
    )
  );
}

async function networkFirst(event) {
  try {
    const response = await fetch(event.request);
    const cache = await caches.open(CACHE_NAME);
    cache.put(event.request, response.clone());
    return response;
  } catch (err) {
    const cached = await caches.match(event.request);
    if (cached) return cached;
    throw err;
  }
}

async function cacheFirst(event) {
  const cached = await caches.match(event.request);
  if (cached) return cached;
  const response = await fetch(event.request);
  const cache = await caches.open(CACHE_NAME);
  cache.put(event.request, response.clone());
  return response;
}

self.addEventListener('fetch', (event) => {
  // Only handle GET
  if (event.request.method !== 'GET') return;

  // HTML requests - always network-first to get latest version
  if (isHTMLRequest(event.request)) {
    event.respondWith(networkFirst(event));
    return;
  }

  if (isScriptRequest(event.request)) {
    // Network-first for JS and module chunks to avoid stale React duplicates
    event.respondWith(networkFirst(event));
    return;
  }

  if (isStaticAsset(event.request)) {
    // Cache-first for static assets
    event.respondWith(cacheFirst(event));
    return;
  }

  // Default: try network, fallback to cache
  event.respondWith(
    (async () => {
      try {
        return await fetch(event.request);
      } catch {
        const cached = await caches.match(event.request);
        if (cached) return cached;
        throw new Error('Network error and no cache');
      }
    })()
  );
});

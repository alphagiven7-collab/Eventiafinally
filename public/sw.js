const SHELL_CACHE = 'eventia-v2-shell';
const SHELL_URL = '/invitation-offline.html';

async function putShell(cache) {
  const response = await fetch(SHELL_URL, { cache: 'reload' });
  if (!response.ok) throw new Error('shell');
  const body = await response.arrayBuffer();
  await cache.put(SHELL_URL, new Response(body, {
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  }));
}

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(SHELL_CACHE)
      .then((cache) => putShell(cache))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== SHELL_CACHE).map((key) => caches.delete(key))))
      .then(() => caches.open(SHELL_CACHE))
      .then(async (cache) => {
        const requests = await cache.keys();
        await Promise.all(requests.map((request) => {
          const path = new URL(request.url).pathname;
          if (path !== SHELL_URL) return cache.delete(request);
          return Promise.resolve(false);
        }));
      })
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('message', (event) => {
  if (event.data?.type === 'SKIP_WAITING') self.skipWaiting();
});

self.addEventListener('fetch', (event) => {
  const request = event.request;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  if (/\/(api|auth|dashboard|create|admin)\b/.test(url.pathname)) return;

  const invitationNavigation = request.mode === 'navigate' && /^\/e\/[^/]+\/?$/.test(url.pathname);
  if (!invitationNavigation) return;

  event.respondWith((async () => {
    const offline = self.navigator.onLine === false;
    if (offline) {
      const cache = await caches.open(SHELL_CACHE);
      const shell = await cache.match(SHELL_URL);
      if (shell) return shellResponse(shell);
    }
    try {
      return await fetch(request);
    } catch {
      const cache = await caches.open(SHELL_CACHE);
      const shell = await cache.match(SHELL_URL);
      if (shell) return shellResponse(shell);
      return new Response('Hors ligne', {
        status: 503,
        headers: { 'Content-Type': 'text/plain; charset=utf-8' },
      });
    }
  })());
});

function shellResponse(shell) {
  const headers = new Headers(shell.headers);
  headers.set('Content-Type', 'text/html; charset=utf-8');
  headers.set('X-Eventia-Offline', 'invitation');
  return shell.blob().then((body) => new Response(body, { status: 200, headers }));
}

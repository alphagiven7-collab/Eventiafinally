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
      .then((cache) => putShell(cache).catch(() => undefined))
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
          if (path !== SHELL_URL && path !== '/eventia-guest-entry') return cache.delete(request);
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

  const startNavigation = request.mode === 'navigate' && url.pathname === '/';
  const invitationNavigation = request.mode === 'navigate' && /^\/e\/[^/]+\/?$/.test(url.pathname);
  if (!startNavigation && !invitationNavigation) return;

  event.respondWith((async () => {
    if (startNavigation) {
      if (self.navigator.onLine === false) return guestStartResponse();
      try {
        return await fetch(request);
      } catch {
        return guestStartResponse();
      }
    }
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

async function guestStartResponse() {
  const cache = await caches.open(SHELL_CACHE);
  const saved = await cache.match('/eventia-guest-entry');
  const path = saved ? (await saved.text()).trim() : '';
  if (path.startsWith('/e/')) {
    return Response.redirect(new URL(path, self.location.origin).href, 302);
  }
  const html = `<!DOCTYPE html><html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Eventia</title></head><body><script>
    var entry = '';
    try { entry = localStorage.getItem('eventia-guest-entry') || ''; } catch (e) {}
    if (entry.indexOf('/e/') === 0) location.replace(entry);
    else document.body.textContent = 'Ouvrez votre invitation en ligne pour l’installer.';
  </script></body></html>`;
  return new Response(html, { headers: { 'Content-Type': 'text/html; charset=utf-8' } });
}

function shellResponse(shell) {
  const headers = new Headers(shell.headers);
  headers.set('Content-Type', 'text/html; charset=utf-8');
  headers.set('X-Eventia-Offline', 'invitation');
  return shell.blob().then((body) => new Response(body, { status: 200, headers }));
}

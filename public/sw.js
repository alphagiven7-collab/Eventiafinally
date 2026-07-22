// Service Worker désactivé pour corriger le bug de rechargement infini
// sur Safari 15 (iPhone 7 Plus et anciens appareils iOS)

self.addEventListener("install", (e) => {
    // Forcer l'activation immédiate
    self.skipWaiting();
});

self.addEventListener("activate", (e) => {
    // Supprimer tous les caches et se désinstaller
    e.waitUntil(
        caches.keys().then((keys) =>
            Promise.all(keys.map((k) => caches.delete(k)))
        ).then(() => {
            // Se désinstaller soi-même
            return self.registration.unregister();
        }).then(() => {
            // Recharger tous les clients pour qu'ils n'utilisent plus le SW
            return self.clients.matchAll().then((clients) => {
                clients.forEach((client) => client.navigate(client.url));
            });
        })
    );
});

// Ne plus intercepter les requêtes fetch
// (pas de addEventListener "fetch" → toutes les requêtes passent directement au réseau)
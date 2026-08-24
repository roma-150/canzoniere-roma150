const CACHE_NAME = 'canzoniere-v2';

const APP_SHELL = [
  './',
  './index.html',
  './manifest.json',
  './icons/icon-192.png',
  './icons/icon-512.png'
];

// Installazione: mette in cache i file base dell'app (guscio)
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL))
  );
  self.skipWaiting();
});

// Attivazione: elimina cache di versioni precedenti
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((names) =>
      Promise.all(
        names
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      )
    )
  );
  self.clients.claim();
});

// Su richiesta esplicita (pulsante "Cerca aggiornamenti" nell'app),
// svuota la cache del guscio app così il prossimo ricaricamento scarica tutto di nuovo
self.addEventListener('message', (event) => {
  if (event.data === 'CLEAR_APP_SHELL_CACHE') {
    event.waitUntil(
      caches.open(CACHE_NAME).then((cache) =>
        Promise.all(APP_SHELL.map((url) => cache.delete(url)))
      )
    );
  }
});

// Strategie di risposta:
// - songs.json: prova sempre la rete per avere le canzoni aggiornate,
//   se non c'è connessione usa l'ultima copia salvata in cache
// - tutto il resto (guscio app): cache prima, rete come riserva
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  if (url.pathname.endsWith('version.json')) {
    event.respondWith(fetch(event.request));
    return;
  }

  if (url.pathname.endsWith('songs.json')) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
          return response;
        })
        .catch(() => caches.match(event.request))
    );
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cached) => {
      return (
        cached ||
        fetch(event.request).then((response) => {
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
          return response;
        })
      );
    })
  );
});

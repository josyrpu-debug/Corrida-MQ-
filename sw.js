/**
 * Service Worker — Painel da Organização (Corrida N. Sra. do Amparo)
 * -------------------------------------------------------------------------
 * Estratégia:
 *  - App shell (HTML/CSS/JS/ícones) -> "cache-first", com atualização em
 *    segundo plano (stale-while-revalidate) para pegar novas versões sem
 *    quebrar o uso offline.
 *  - Dados em tempo real (Firestore/Auth) NÃO passam por aqui: o próprio
 *    SDK do Firebase cuida do cache/fila offline (ver js/firebase-config.js).
 *
 * IMPORTANTE: sempre que publicar uma nova versão do app, troque o valor
 * de CACHE_VERSION abaixo para forçar a atualização dos celulares da equipe.
 */

const CACHE_VERSION = 'corrida-amparo-v1';

const APP_SHELL = [
  './',
  './index.html',
  './manifest.json',
  './css/style.css',
  './js/main.js',
  './js/firebase-config.js',
  './js/data.js',
  './js/utils.js',
  './js/auth.js',
  './js/theme.js',
  './js/router.js',
  './js/views/dashboard.js',
  './js/views/checklists.js',
  './js/views/timeline.js',
  './js/views/panel.js',
  './js/views/communication.js',
  './js/views/raceday.js',
  './assets/logo.png',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/apple-touch-icon.png',
  './icons/favicon.ico'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_VERSION).then((cache) => cache.addAll(APP_SHELL)).catch(() => {})
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_VERSION).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  const url = new URL(req.url);

  // Nunca interceptar chamadas ao Firebase/Google (Auth, Firestore, fontes) —
  // deixe o navegador/SDK cuidar disso normalmente.
  if (
    url.hostname.includes('googleapis.com') ||
    url.hostname.includes('firebaseio.com') ||
    url.hostname.includes('firestore.googleapis.com') ||
    url.hostname.includes('identitytoolkit') ||
    url.hostname.includes('gstatic.com') && url.pathname.includes('firebasejs')
  ) {
    return;
  }

  if (req.method !== 'GET') return;

  event.respondWith(
    caches.match(req).then((cached) => {
      const network = fetch(req)
        .then((resp) => {
          if (resp && resp.status === 200 && resp.type === 'basic') {
            const clone = resp.clone();
            caches.open(CACHE_VERSION).then((cache) => cache.put(req, clone));
          }
          return resp;
        })
        .catch(() => cached);
      return cached || network;
    })
  );
});

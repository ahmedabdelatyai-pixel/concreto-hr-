// Basic Service Worker to satisfy PWA requirements for 'beforeinstallprompt'
const CACHE_NAME = 'talentflow-cache-v1';

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(clients.claim());
});

self.addEventListener('fetch', (event) => {
  // We can do a pass-through fetch here. We don't want to aggressively cache everything 
  // since we already handled cache-control at the HTML level.
  // This minimal fetch handler is enough to trigger the PWA install prompt in Chrome.
  event.respondWith(fetch(event.request));
});

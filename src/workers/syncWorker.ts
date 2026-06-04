/// <reference lib="webworker" />

// Service Worker for background sync and offline support

declare const swSelf: ServiceWorkerGlobalScope & typeof globalThis & {
  skipWaiting: () => void;
  clients: { claim: () => void };
  addEventListener: (type: string, listener: any) => void;
};

const CACHE_NAME = 'jarvis-v1'
const urlsToCache = [
  '/',
  '/index.html',
  '/App.css'
]

// Cast self properly for service worker context
const serviceSelf = self as unknown as {
  addEventListener: (type: string, listener: (event: any) => void) => void;
  skipWaiting: () => void;
  clients: { claim: () => void };
  caches: { open: (name: string) => Promise<Cache>; delete: (name: string) => Promise<boolean>; keys: () => Promise<string[]> };
};

// Install event - cache assets
serviceSelf.addEventListener('install', (event: any) => {
  event.waitUntil(
    serviceSelf.caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(urlsToCache)
    })
  )
  serviceSelf.skipWaiting()
})

// Activate event - clean up old caches
serviceSelf.addEventListener('activate', (event: any) => {
  event.waitUntil(
    serviceSelf.caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return serviceSelf.caches.delete(cacheName)
          }
        })
      )
    })
  )
  serviceSelf.clients.claim()
})

// Fetch event - serve from cache, fallback to network
serviceSelf.addEventListener('fetch', (event: any) => {
  event.respondWith(
    serviceSelf.caches.match(event.request).then((response) => {
      if (response) {
        return response
      }
      return fetch(event.request).then((response) => {
        if (!response || response.status !== 200 || response.type !== 'basic') {
          return response
        }
        const responseToCache = response.clone()
        serviceSelf.caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseToCache)
        })
        return response
      })
    })
  )
})

// Background sync
serviceSelf.addEventListener('sync', (event: any) => {
  if (event.tag === 'sync-tasks') {
    event.waitUntil(
      Promise.resolve()
    )
  }
})

export {}

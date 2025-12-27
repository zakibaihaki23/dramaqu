const CACHE_NAME = "dramaqu-v1"
const urlsToCache = ["/", "/manifest.json", "/icon-192.png", "/icon-512.png", "/index.html"]

// Install Service Worker
self.addEventListener("install", (event) => {
  console.log("SW: Installing...")
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => {
        console.log("SW: Caching files...")
        return cache.addAll(urlsToCache)
      })
      .then(() => {
        console.log("SW: Files cached successfully")
      })
      .catch((error) => {
        console.error("SW: Cache failed:", error)
      })
  )
  self.skipWaiting()
})

// Activate Service Worker
self.addEventListener("activate", (event) => {
  console.log("SW: Activating...")
  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== CACHE_NAME) {
              console.log("SW: Deleting old cache:", cacheName)
              return caches.delete(cacheName)
            }
          })
        )
      })
      .then(() => {
        console.log("SW: Activation complete")
      })
  )
  self.clients.claim()
})

// Fetch event - serve from cache when offline
self.addEventListener("fetch", (event) => {
  // Only cache GET requests
  if (event.request.method !== "GET") return

  console.log("SW: Fetching:", event.request.url)

  event.respondWith(
    caches
      .match(event.request)
      .then((response) => {
        // Return cached version or fetch from network
        if (response) {
          console.log("SW: Serving from cache:", event.request.url)
          return response
        }

        console.log("SW: Fetching from network:", event.request.url)
        return fetch(event.request)
      })
      .catch((error) => {
        console.error("SW: Fetch failed:", error)
        // Return offline fallback if needed
        return caches.match("/index.html")
      })
  )
})

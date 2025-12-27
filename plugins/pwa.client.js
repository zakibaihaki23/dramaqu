import { defineNuxtPlugin } from "#app"

export default defineNuxtPlugin(() => {
  // Register service worker in production OR localhost for testing
  if (import.meta.client && "serviceWorker" in navigator) {
    const isLocalhost = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1"
    const isProduction = process.env.NODE_ENV === "production"

    if (isProduction || isLocalhost) {
      navigator.serviceWorker
        .register("/sw.js")
        .then((registration) => {
          console.log("Service Worker registered successfully:", registration.scope)
          console.log("PWA ready for testing/installation")
        })
        .catch((error) => {
          console.log("Service Worker registration failed:", error)
        })
    }
  }

  // Handle PWA install prompt
  if (import.meta.client) {
    window.addEventListener("beforeinstallprompt", (e) => {
      // Prevent the mini-infobar from appearing on mobile
      e.preventDefault()
      // Stash the event so it can be triggered later
      // Update UI notify the user they can install the PWA
      console.log("PWA install prompt available")
    })

    // Listen for successful installation
    window.addEventListener("appinstalled", () => {
      console.log("PWA was installed successfully")
    })
  }
})

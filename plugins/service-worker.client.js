// plugins/service-worker.client.js
export default defineNuxtPlugin(async () => {
  if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
    try {
      // Check if service worker is already registered and active
      if (navigator.serviceWorker.controller) {
        console.log('Service Worker controller already available')
        return
      }

      // Unregister existing service workers first (for development)
      const existingRegistrations = await navigator.serviceWorker.getRegistrations()
      for (const registration of existingRegistrations) {
        if (registration.scope === window.location.origin + '/') {
          await registration.unregister()
        }
      }
      
      // Register new service worker
      const registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/',
        updateViaCache: 'none'
      })
      
      console.log('Service Worker registered:', registration.scope)
      
      // Wait for service worker to be ready
      await navigator.serviceWorker.ready
      console.log('Service Worker ready')
      
      // Wait for controller to be available (with longer timeout)
      let retries = 0
      const maxRetries = 50 // 5 seconds
      while (!navigator.serviceWorker.controller && retries < maxRetries) {
        await new Promise(resolve => setTimeout(resolve, 100))
        retries++
      }
      
      if (navigator.serviceWorker.controller) {
        console.log('Service Worker controller ready')
      } else {
        console.warn('Service Worker controller not available after registration')
        // Try to reload the page to activate service worker
        // But only if we're not in a navigation
        if (registration.waiting) {
          registration.waiting.postMessage({ type: 'SKIP_WAITING' })
        }
      }

      // Listen for controller change
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        console.log('Service Worker controller changed')
        // Reload page to use new service worker
        window.location.reload()
      })
    } catch (error) {
      console.error('Service Worker registration failed:', error)
    }
  }
})


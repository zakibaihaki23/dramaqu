// plugins/service-worker.client.js
export default defineNuxtPlugin(async () => {
  if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
    try {
      const registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/'
      })
      
      console.log('Service Worker registered:', registration.scope)
      
      // Wait for service worker to be ready
      await navigator.serviceWorker.ready
      console.log('Service Worker ready')
    } catch (error) {
      console.error('Service Worker registration failed:', error)
    }
  }
})


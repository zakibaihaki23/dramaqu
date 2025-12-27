import { defineNuxtPlugin } from "#app"

export default defineNuxtPlugin((nuxtApp) => {
  // Handle pull-to-refresh prevention for mobile PWA
  if (import.meta.client) {
    let startY = 0
    let isAtTop = false

    const preventPullToRefresh = (e) => {
      const currentY = e.touches[0].clientY
      const deltaY = currentY - startY

      // Only prevent if at top of page and scrolling down (pull-to-refresh gesture)
      if (isAtTop && deltaY > 0) {
        // Allow small movements (threshold) but prevent large pull gestures
        if (deltaY > 50) {
          // 50px threshold
          e.preventDefault()
        }
      }
    }

    const handleTouchStart = (e) => {
      startY = e.touches[0].clientY
      isAtTop = window.scrollY <= 5 // Consider "at top" if within 5px of top
    }

    const enablePullPrevention = () => {
      document.addEventListener("touchstart", handleTouchStart, { passive: true })
      document.addEventListener("touchmove", preventPullToRefresh, { passive: false })
    }

    const disablePullPrevention = () => {
      document.removeEventListener("touchstart", handleTouchStart)
      document.removeEventListener("touchmove", preventPullToRefresh)
    }

    // Check current route and enable/disable accordingly
    const checkRoute = () => {
      const currentPath = window.location.pathname
      const isDetailPage = currentPath.includes("/detail/") || currentPath.includes("/watch")

      if (isDetailPage) {
        enablePullPrevention()
        // Also set CSS properties
        document.body.style.overscrollBehavior = "none"
        document.body.style.touchAction = "pan-x pinch-zoom"
      } else {
        disablePullPrevention()
        // Reset CSS properties
        document.body.style.overscrollBehavior = ""
        document.body.style.touchAction = ""
      }
    }

    // Initial check
    checkRoute()

    // Listen for navigation changes (SPA routing)
    window.addEventListener("popstate", checkRoute)

    // Also listen for Nuxt page changes
    nuxtApp.hook("page:finish", () => {
      setTimeout(checkRoute, 100) // Small delay to ensure DOM is updated
    })

    // Cleanup on unmount
    nuxtApp.hook("app:beforeMount", () => {
      disablePullPrevention()
      document.body.style.overscrollBehavior = ""
      document.body.style.touchAction = ""
      window.removeEventListener("popstate", checkRoute)
    })
  }
})

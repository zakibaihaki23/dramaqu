export default defineNuxtPlugin(() => {
  // Handle pull-to-refresh prevention for mobile PWA
  if (process.client) {
    let startY = 0
    let isAtTop = false

    const preventPullToRefresh = (e: TouchEvent) => {
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

    const handleTouchStart = (e: TouchEvent) => {
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

    // Auto-enable for detail pages, disable for home
    const router = useRouter()
    const currentRoute = router.currentRoute

    watchEffect(() => {
      const isDetailPage = currentRoute.value.path.includes("/detail/") || currentRoute.value.path.includes("/watch")

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
    })

    // Cleanup on unmount
    onUnmounted(() => {
      disablePullPrevention()
      document.body.style.overscrollBehavior = ""
      document.body.style.touchAction = ""
    })
  }
})

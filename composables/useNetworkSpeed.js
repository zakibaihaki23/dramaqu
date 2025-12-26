import { ref, onMounted, onUnmounted } from 'vue'

export const useNetworkSpeed = () => {
  const connectionSpeed = ref('unknown')
  const effectiveType = ref('unknown')
  const downlink = ref(0)

  const detectNetworkSpeed = () => {
    if (typeof navigator === 'undefined') {
      return 'unknown'
    }

    // Check for Network Information API
    const connection = navigator.connection || 
                      navigator.mozConnection || 
                      navigator.webkitConnection

    if (connection) {
      effectiveType.value = connection.effectiveType || 'unknown'
      downlink.value = connection.downlink || 0

      // Map effectiveType to quality
      // effectiveType: 'slow-2g', '2g', '3g', '4g'
      // downlink: Mbps (megabits per second)
      
      if (connection.effectiveType) {
        switch (connection.effectiveType) {
          case 'slow-2g':
          case '2g':
            connectionSpeed.value = 'slow'
            return 'slow' // Use 360p or lower
          case '3g':
            connectionSpeed.value = 'medium'
            return 'medium' // Use 720p
          case '4g':
            connectionSpeed.value = 'fast'
            return 'fast' // Use 1080p
          default:
            connectionSpeed.value = 'medium'
            return 'medium'
        }
      }

      // Fallback to downlink speed if effectiveType not available
      if (connection.downlink) {
        if (connection.downlink < 1) {
          connectionSpeed.value = 'slow'
          return 'slow' // < 1 Mbps = 360p
        } else if (connection.downlink < 5) {
          connectionSpeed.value = 'medium'
          return 'medium' // 1-5 Mbps = 720p
        } else {
          connectionSpeed.value = 'fast'
          return 'fast' // > 5 Mbps = 1080p
        }
      }
    }

    // Fallback: Try to detect via download test (simplified)
    // In production, you might want to use a more sophisticated method
    connectionSpeed.value = 'medium' // Default to medium
    return 'medium'
  }

  const getRecommendedQuality = (availableQualities) => {
    if (!availableQualities || availableQualities.length === 0) {
      return null
    }

    const speed = detectNetworkSpeed()
    
    // Sort qualities descending
    const sortedQualities = [...availableQualities].sort((a, b) => b - a)
    
    switch (speed) {
      case 'slow':
        // For slow connection, prefer 360p or 480p
        return sortedQualities.find(q => q <= 480) || sortedQualities[sortedQualities.length - 1]
      case 'medium':
        // For medium connection, prefer 720p
        return sortedQualities.find(q => q <= 720) || sortedQualities.find(q => q <= 1080) || sortedQualities[0]
      case 'fast':
        // For fast connection, prefer highest available (1080p)
        return sortedQualities[0]
      default:
        // Default to 720p or medium quality
        return sortedQualities.find(q => q <= 720) || sortedQualities[0]
    }
  }

  const updateConnectionInfo = () => {
    detectNetworkSpeed()
  }

  onMounted(() => {
    detectNetworkSpeed()
    
    // Listen for connection changes
    if (typeof navigator !== 'undefined') {
      const connection = navigator.connection || 
                        navigator.mozConnection || 
                        navigator.webkitConnection
      
      if (connection) {
        connection.addEventListener('change', updateConnectionInfo)
      }
    }
  })

  onUnmounted(() => {
    if (typeof navigator !== 'undefined') {
      const connection = navigator.connection || 
                        navigator.mozConnection || 
                        navigator.webkitConnection
      
      if (connection) {
        connection.removeEventListener('change', updateConnectionInfo)
      }
    }
  })

  return {
    connectionSpeed,
    effectiveType,
    downlink,
    detectNetworkSpeed,
    getRecommendedQuality
  }
}


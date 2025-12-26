// composables/useVIP.js
export const useVIP = () => {
  let swRegistration = null
  let messageChannel = null

  // Initialize service worker
  const initServiceWorker = async () => {
    if (typeof window === 'undefined') return null

    try {
      if ('serviceWorker' in navigator) {
        // Register service worker
        const registration = await navigator.serviceWorker.register('/sw.js', {
          scope: '/'
        })
        
        swRegistration = registration
        
        // Wait for service worker to be ready
        await navigator.serviceWorker.ready
        
        // Create message channel for communication
        messageChannel = new MessageChannel()
        
        return registration
      }
    } catch (error) {
      console.error('Service Worker registration failed:', error)
      return null
    }
  }

  // Send message to service worker
  const sendMessage = (type, data = {}) => {
    return new Promise(async (resolve, reject) => {
      // Ensure service worker is initialized
      if (!swRegistration) {
        await initServiceWorker()
      }

      if (!navigator.serviceWorker.controller) {
        // Wait for service worker to be ready
        await navigator.serviceWorker.ready
      }

      if (!navigator.serviceWorker.controller) {
        reject(new Error('Service Worker controller not available'))
        return
      }

      const channel = new MessageChannel()
      
      channel.port1.onmessage = (event) => {
        resolve(event.data)
      }
      
      channel.port1.onmessageerror = (error) => {
        reject(error)
      }

      navigator.serviceWorker.controller.postMessage(
        { type, ...data },
        [channel.port2]
      )
    })
  }

  // Validate VIP code
  const validateCode = async (code) => {
    try {
      const result = await sendMessage('VALIDATE_CODE', { code })
      return result
    } catch (error) {
      console.error('Error validating code:', error)
      return { valid: false, message: 'Error validating code' }
    }
  }

  // Check VIP status
  const checkVIPStatus = async () => {
    try {
      const result = await sendMessage('CHECK_VIP')
      return result?.isVIP || false
    } catch (error) {
      console.error('Error checking VIP status:', error)
      return false
    }
  }

  // Get VIP status (with details)
  const getVIPStatus = async () => {
    try {
      const result = await sendMessage('GET_STATUS')
      return result || { isVIP: false, usedCount: 0 }
    } catch (error) {
      console.error('Error getting VIP status:', error)
      return { isVIP: false, usedCount: 0 }
    }
  }

  // Initialize on mount
  if (process.client) {
    initServiceWorker()
  }

  return {
    validateCode,
    checkVIPStatus,
    getVIPStatus,
    initServiceWorker,
  }
}


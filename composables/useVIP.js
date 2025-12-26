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

  // Wait for service worker controller to be available
  const waitForController = async (maxRetries = 30, delay = 100) => {
    for (let i = 0; i < maxRetries; i++) {
      if (navigator.serviceWorker.controller) {
        return true
      }
      await new Promise(resolve => setTimeout(resolve, delay))
    }
    return false
  }

  // Send message to service worker
  const sendMessage = (type, data = {}) => {
    return new Promise(async (resolve, reject) => {
      // Check if service worker is supported
      if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
        reject(new Error('Service Worker not supported'))
        return
      }

      // Ensure service worker is initialized
      if (!swRegistration) {
        await initServiceWorker()
      }

      // Wait for service worker to be ready
      try {
        await navigator.serviceWorker.ready
      } catch (error) {
        reject(new Error('Service Worker not ready'))
        return
      }

      // Wait for controller to be available
      let controllerAvailable = await waitForController(30, 100)
      
      // For VALIDATE_CODE, wait longer and try to activate service worker
      if (!controllerAvailable && type === 'VALIDATE_CODE') {
        // Try to update service worker
        if (swRegistration) {
          try {
            await swRegistration.update()
            await navigator.serviceWorker.ready
            controllerAvailable = await waitForController(20, 100)
          } catch (error) {
            console.warn('Failed to update service worker:', error)
          }
        }
      }
      
      if (!controllerAvailable) {
        // If controller not available, return default values based on type
        if (type === 'CHECK_VIP') {
          resolve({ isVIP: false })
          return
        } else if (type === 'GET_STATUS') {
          resolve({ isVIP: false, usedCount: 0 })
          return
        } else if (type === 'VALIDATE_CODE') {
          // For validation, we need to reject with a clear message
          reject(new Error('Service Worker controller not available. Please refresh the page and try again.'))
          return
        } else {
          reject(new Error('Service Worker controller not available'))
          return
        }
      }

      const channel = new MessageChannel()
      let resolved = false
      
      // Set timeout for message response
      const timeout = setTimeout(() => {
        if (!resolved) {
          resolved = true
          channel.port1.close()
          channel.port2.close()
          // Return default values on timeout
          if (type === 'CHECK_VIP') {
            resolve({ isVIP: false })
          } else if (type === 'GET_STATUS') {
            resolve({ isVIP: false, usedCount: 0 })
          } else {
            reject(new Error('Service Worker message timeout'))
          }
        }
      }, 5000)
      
      channel.port1.onmessage = (event) => {
        if (!resolved) {
          resolved = true
          clearTimeout(timeout)
          channel.port1.close()
          channel.port2.close()
          resolve(event.data)
        }
      }
      
      channel.port1.onmessageerror = (error) => {
        if (!resolved) {
          resolved = true
          clearTimeout(timeout)
          channel.port1.close()
          channel.port2.close()
          reject(error)
        }
      }

      try {
        navigator.serviceWorker.controller.postMessage(
          { type, ...data },
          [channel.port2]
        )
      } catch (error) {
        if (!resolved) {
          resolved = true
          clearTimeout(timeout)
          channel.port1.close()
          channel.port2.close()
          reject(error)
        }
      }
    })
  }

  // Validate VIP code
  const validateCode = async (code) => {
    try {
      // Check if service worker is supported
      if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
        return { valid: false, message: 'Service Worker not supported' }
      }

      // Ensure service worker is initialized first
      if (!swRegistration) {
        await initServiceWorker()
      }

      // Wait for service worker to be ready
      try {
        await navigator.serviceWorker.ready
      } catch (error) {
        return { valid: false, message: 'Service Worker not ready. Please refresh the page.' }
      }

      // Wait longer for controller (important for validation)
      let controllerAvailable = false
      for (let i = 0; i < 50; i++) {
        if (navigator.serviceWorker.controller) {
          controllerAvailable = true
          break
        }
        await new Promise(resolve => setTimeout(resolve, 100))
      }

      if (!controllerAvailable) {
        // Try to reload service worker
        if (swRegistration) {
          await swRegistration.update()
          await navigator.serviceWorker.ready
          
          // Wait again after update
          for (let i = 0; i < 20; i++) {
            if (navigator.serviceWorker.controller) {
              controllerAvailable = true
              break
            }
            await new Promise(resolve => setTimeout(resolve, 100))
          }
        }

        if (!controllerAvailable) {
          return { valid: false, message: 'Service Worker not available. Please refresh the page and try again.' }
        }
      }

      const result = await sendMessage('VALIDATE_CODE', { code })
      return result || { valid: false, message: 'Invalid response' }
    } catch (error) {
      console.error('Error validating code:', error)
      return { valid: false, message: 'Error validating code. Please refresh the page and try again.' }
    }
  }

  // Check VIP status
  const checkVIPStatus = async () => {
    try {
      // Check if service worker is supported
      if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
        return false
      }

      const result = await sendMessage('CHECK_VIP')
      return result?.isVIP || false
    } catch (error) {
      // Silently fail and return false (non-VIP)
      // Don't log error to avoid console spam
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

  return {
    validateCode,
    checkVIPStatus,
    getVIPStatus,
    initServiceWorker,
  }
}


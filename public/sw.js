// Service Worker for VIP Code Management
// Claim control immediately
self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim())
})

const VIP_CODES = {
  // Admin code (unlimited use)
  'ADMIN2024': { type: 'admin', unlimited: true },
  
  // Normal codes (one-time use)
  'VIP2024': { type: 'normal', unlimited: false },
  'PREMIUM123': { type: 'normal', unlimited: false },
  'ACCESS2024': { type: 'normal', unlimited: false },
  'DRAMA2024': { type: 'normal', unlimited: false },
  'WATCH2024': { type: 'normal', unlimited: false },
  'MOVIE2024': { type: 'normal', unlimited: false },
  'STREAM2024': { type: 'normal', unlimited: false },
  'SERIES2024': { type: 'normal', unlimited: false },
  'SHOW2024': { type: 'normal', unlimited: false },
  'CINEMA2024': { type: 'normal', unlimited: false },
}

// Store used codes in memory (not in localStorage)
let usedCodes = []

// Hash function for code
function hashCode(str) {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash // Convert to 32bit integer
  }
  return hash.toString(36)
}

// Validate VIP code
function validateCode(code) {
  const upperCode = code.toUpperCase().trim()
  
  if (!VIP_CODES[upperCode]) {
    return { valid: false, message: 'Invalid code' }
  }
  
  const codeInfo = VIP_CODES[upperCode]
  const codeHash = hashCode(upperCode)
  
  // Admin code - always valid (unlimited)
  if (codeInfo.type === 'admin' && codeInfo.unlimited) {
    // Add admin hash to used codes if not already there (for status check)
    if (!usedCodes.includes(codeHash)) {
      usedCodes.push(codeHash)
    }
    return { valid: true, isAdmin: true, message: 'VIP access activated!' }
  }
  
  // Normal code - check if already used
  if (usedCodes.includes(codeHash)) {
    return { valid: false, message: 'Code already used' }
  }
  
  // Valid and not used - add to used codes
  usedCodes.push(codeHash)
  return { valid: true, isAdmin: false, message: 'VIP access activated!' }
}

// Check VIP status
function checkVIPStatus() {
  // User is VIP only if any code has been used (including admin)
  // usedCodes will contain the hash of admin code if it was entered
  return usedCodes.length > 0
}

// Listen for messages from main app
self.addEventListener('message', (event) => {
  const { type, code } = event.data
  
  if (type === 'VALIDATE_CODE') {
    const result = validateCode(code)
    event.ports[0].postMessage(result)
  } else if (type === 'CHECK_VIP') {
    const isVIP = checkVIPStatus()
    event.ports[0].postMessage({ isVIP })
  } else if (type === 'GET_STATUS') {
    event.ports[0].postMessage({ 
      isVIP: checkVIPStatus(),
      usedCount: usedCodes.length 
    })
  }
})

// Initialize - check if admin code should be auto-activated (optional)
// For now, admin code needs to be entered manually


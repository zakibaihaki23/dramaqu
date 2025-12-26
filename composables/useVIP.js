// composables/useVIP.js
import { ref } from "vue"

export const useVIP = () => {
  const isVIP = ref(false)

  // VIP Codes with duration (in days)
  const VIP_CODES = {
    // Admin code (unlimited use, duration tidak berpengaruh)
    ADMIN2025: { type: "admin", unlimited: true, duration: 0 }, // 0 = unlimited

    // Normal codes (one-time use with duration in days)
    TRIAL20251DAY: { type: "normal", unlimited: false, duration: 1 }, // 1 day
    TRIAL20251DAY_001: { type: "normal", unlimited: false, duration: 1 }, // 2 days
  }

  // Secret salt for checksum (change this for production)
  const SECRET_SALT = "dramaqu_vip_2024_secret_salt_change_me"

  // Hash function for code
  const hashCode = (str) => {
    let hash = 0
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i)
      hash = (hash << 5) - hash + char
      hash = hash & hash // Convert to 32bit integer
    }
    return hash.toString(36)
  }

  // Generate checksum for data integrity
  const generateChecksum = (data) => {
    // Create a copy without checksum field to avoid circular dependency
    const dataCopy = { ...data }
    delete dataCopy.checksum
    // Create a string from data + secret salt
    const dataStr = JSON.stringify(dataCopy) + SECRET_SALT
    return hashCode(dataStr)
  }

  // Validate checksum
  const validateChecksum = (data, checksum) => {
    const expectedChecksum = generateChecksum(data)
    return expectedChecksum === checksum
  }

  // Open IndexedDB
  const openDB = () => {
    return new Promise((resolve, reject) => {
      if (typeof window === "undefined" || !("indexedDB" in window)) {
        reject(new Error("IndexedDB not supported"))
        return
      }

      const request = indexedDB.open("VIP_DB", 1)

      request.onerror = () => reject(request.error)
      request.onsuccess = () => resolve(request.result)

      request.onupgradeneeded = (event) => {
        const db = event.target.result
        if (!db.objectStoreNames.contains("vip")) {
          db.createObjectStore("vip", { keyPath: "id" })
        }
      }
    })
  }

  // Clear VIP data (if tampered)
  const clearVIPData = async () => {
    try {
      const db = await openDB()
      const transaction = db.transaction(["vip"], "readwrite")
      const store = transaction.objectStore("vip")
      await store.delete("status")
    } catch (error) {
      console.error("Error clearing VIP data:", error)
    }
  }

  // Check VIP status
  const checkVIPStatus = async () => {
    try {
      if (typeof window === "undefined" || !("indexedDB" in window)) {
        isVIP.value = false
        return false
      }

      const db = await openDB()
      const transaction = db.transaction(["vip"], "readonly")
      const store = transaction.objectStore("vip")
      const request = store.get("status")

      return new Promise((resolve) => {
        request.onsuccess = () => {
          const data = request.result

          if (!data) {
            isVIP.value = false
            resolve(false)
            return
          }

          // Validate checksum - if tampered, clear data
          // Skip validation if data doesn't have checksum (new/empty data)
          if (data.checksum) {
            const isValid = validateChecksum(data, data.checksum)
            if (!isValid) {
              console.warn("VIP data checksum invalid - clearing data", {
                expected: generateChecksum(data),
                actual: data.checksum,
              })
              clearVIPData()
              isVIP.value = false
              resolve(false)
              return
            }
          }

          // Check if has used codes and validate expiry
          if (data.usedCodes && data.usedCodes.length > 0) {
            const now = Date.now()
            let hasValidCode = false

            // Check each code for expiry
            for (const codeEntry of data.usedCodes) {
              // If unlimited (admin), always valid - check explicitly for true
              if (codeEntry.unlimited === true) {
                console.log("VIP Status: Found unlimited code:", codeEntry)
                hasValidCode = true
                break
              }

              // Check expiry for normal codes
              if (codeEntry.expiry && codeEntry.expiry > now) {
                console.log("VIP Status: Found valid code with expiry:", codeEntry)
                hasValidCode = true
                break
              }
            }

            console.log("VIP Status check result:", { hasValidCode, usedCodes: data.usedCodes, checksum: data.checksum })

            // Clean expired codes
            if (!hasValidCode) {
              // All codes expired, clear data
              console.log("VIP Status: No valid codes found, clearing data")
              clearVIPData()
              isVIP.value = false
              resolve(false)
              return
            }

            // Remove expired codes
            const validCodes = data.usedCodes.filter((codeEntry) => {
              if (codeEntry.unlimited) return true
              return codeEntry.expiry && codeEntry.expiry > now
            })

            // Update if codes were removed
            if (validCodes.length !== data.usedCodes.length) {
              data.usedCodes = validCodes
              data.checksum = generateChecksum(data)
              // Save updated data (async, don't wait)
              const db = openDB().then((db) => {
                const transaction = db.transaction(["vip"], "readwrite")
                const store = transaction.objectStore("vip")
                store.put(data)
              })
            }

            isVIP.value = true
            resolve(true)
          } else {
            isVIP.value = false
            resolve(false)
          }
        }

        request.onerror = () => {
          isVIP.value = false
          resolve(false)
        }
      })
    } catch (error) {
      isVIP.value = false
      return false
    }
  }

  // Validate VIP code
  const validateCode = async (code) => {
    try {
      if (typeof window === "undefined" || !("indexedDB" in window)) {
        return { valid: false, message: "IndexedDB not supported" }
      }

      const upperCode = code.toUpperCase().trim()

      // Check if code exists
      if (!VIP_CODES[upperCode]) {
        return { valid: false, message: "Invalid code" }
      }

      const codeInfo = VIP_CODES[upperCode]
      const codeHash = hashCode(upperCode)

      // Open database
      const db = await openDB()
      const transaction = db.transaction(["vip"], "readwrite")
      const store = transaction.objectStore("vip")

      // Get current data
      const getRequest = store.get("status")

      return new Promise((resolve) => {
        getRequest.onsuccess = () => {
          let currentData = getRequest.result || { id: "status", usedCodes: [], timestamp: Date.now() }
          let needsMigration = false

          // Ensure usedCodes is array
          if (!Array.isArray(currentData.usedCodes)) {
            currentData.usedCodes = []
            needsMigration = true
          }

          // Check if migration needed (old format: array of strings)
          if (currentData.usedCodes.length > 0 && typeof currentData.usedCodes[0] === "string") {
            needsMigration = true
          }

          // Validate checksum only if data doesn't need migration
          if (!needsMigration && currentData.checksum && !validateChecksum(currentData, currentData.checksum)) {
            // Data tampered, reset
            currentData = { id: "status", usedCodes: [], timestamp: Date.now() }
            needsMigration = false
          }

          // Migrate old format (array of strings) to new format (array of objects)
          if (needsMigration || currentData.usedCodes.some((code) => typeof code === "string" || !code.hash)) {
            currentData.usedCodes = currentData.usedCodes
              .map((code) => {
                if (typeof code === "string") {
                  // Old format - check if it's admin code by checking all admin codes
                  let isAdmin = false
                  for (const [codeKey, codeInfo] of Object.entries(VIP_CODES)) {
                    if (codeInfo.unlimited && code === hashCode(codeKey)) {
                      isAdmin = true
                      break
                    }
                  }
                  return {
                    hash: code,
                    unlimited: isAdmin,
                    expiry: isAdmin ? null : Date.now() + 86400000, // Default 1 day for old codes
                  }
                }
                // Already in new format, ensure it has all required fields
                if (!code.hash) {
                  // Invalid format, skip
                  return null
                }
                return {
                  hash: code.hash,
                  unlimited: code.unlimited || false,
                  expiry: code.unlimited ? null : code.expiry || Date.now() + 86400000,
                }
              })
              .filter((code) => code !== null) // Remove invalid entries
          }

          // Admin code - always valid (unlimited, no expiry)
          if (codeInfo.type === "admin" && codeInfo.unlimited) {
            // Check if admin code already exists
            const existingAdmin = currentData.usedCodes.find((code) => code.hash === codeHash && code.unlimited === true)

            if (!existingAdmin) {
              // Add admin code (unlimited, no expiry)
              currentData.usedCodes.push({
                hash: codeHash,
                unlimited: true,
                expiry: null, // No expiry for unlimited
              })
            }
            currentData.timestamp = Date.now()

            // Generate new checksum (before saving)
            const dataToSave = { ...currentData }
            dataToSave.checksum = generateChecksum(dataToSave)

            // Save to IndexedDB
            const putRequest = store.put(dataToSave)
            putRequest.onsuccess = () => {
              isVIP.value = true
              resolve({ valid: true, isAdmin: true, message: "VIP access activated!" })
            }
            putRequest.onerror = (error) => {
              console.error("Error saving admin code:", error)
              resolve({ valid: false, message: "Error saving code" })
            }
            return
          }

          // Normal code - check if already used
          const existingCode = currentData.usedCodes.find((code) => code.hash === codeHash)
          if (existingCode) {
            // Check if code is still valid (not expired)
            if (existingCode.expiry && existingCode.expiry > Date.now()) {
              resolve({ valid: false, message: "Code already used" })
              return
            }
            // Code expired, remove it and allow reuse
            currentData.usedCodes = currentData.usedCodes.filter((code) => code.hash !== codeHash)
          }

          // Calculate expiry based on duration (in milliseconds)
          const durationMs = codeInfo.duration * 24 * 60 * 60 * 1000 // Convert days to milliseconds
          const expiry = Date.now() + durationMs

          // Valid and not used (or expired) - add to used codes with expiry
          currentData.usedCodes.push({
            hash: codeHash,
            unlimited: false,
            expiry: expiry,
          })
          currentData.timestamp = Date.now()

          // Generate new checksum (before saving)
          const dataToSave = { ...currentData }
          dataToSave.checksum = generateChecksum(dataToSave)

          // Save to IndexedDB
          const putRequest = store.put(dataToSave)
          putRequest.onsuccess = () => {
            isVIP.value = true
            resolve({ valid: true, isAdmin: false, message: "VIP access activated!" })
          }
          putRequest.onerror = (error) => {
            console.error("Error saving normal code:", error)
            resolve({ valid: false, message: "Error saving code" })
          }
        }

        getRequest.onerror = () => {
          resolve({ valid: false, message: "Error checking code" })
        }
      })
    } catch (error) {
      console.error("Error validating code:", error)
      return { valid: false, message: "Error validating code. Please try again." }
    }
  }

  // Get VIP status (with details)
  const getVIPStatus = async () => {
    try {
      const db = await openDB()
      const transaction = db.transaction(["vip"], "readonly")
      const store = transaction.objectStore("vip")
      const request = store.get("status")

      return new Promise((resolve) => {
        request.onsuccess = () => {
          const data = request.result

          if (!data) {
            resolve({ isVIP: false, usedCount: 0 })
            return
          }

          // Validate checksum
          if (!validateChecksum(data, data.checksum)) {
            resolve({ isVIP: false, usedCount: 0 })
            return
          }

          // Count valid codes (not expired)
          const now = Date.now()
          const validCodes = (data.usedCodes || []).filter((codeEntry) => {
            if (codeEntry.unlimited) return true
            return codeEntry.expiry && codeEntry.expiry > now
          })

          resolve({ isVIP: validCodes.length > 0, usedCount: validCodes.length })
        }

        request.onerror = () => {
          resolve({ isVIP: false, usedCount: 0 })
        }
      })
    } catch (error) {
      return { isVIP: false, usedCount: 0 }
    }
  }

  return {
    isVIP,
    validateCode,
    checkVIPStatus,
    getVIPStatus,
  }
}

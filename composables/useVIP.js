// composables/useVIP.js
import { ref } from "vue"
import fs from "fs"
import path from "path"

// Path ke file JSON VIP codes (di folder server)
const VIP_CODES_FILE = path.join(process.cwd(), "server", "vip-codes.json")

// Load VIP codes dari file JSON (atau fallback ke hardcoded jika file belum ada)
let VIP_CODES = []
try {
  const data = fs.readFileSync(VIP_CODES_FILE, "utf8")
  VIP_CODES = JSON.parse(data)
} catch (err) {
  // Fallback ke hardcoded jika file belum ada
  VIP_CODES = [
    { code: "VIP123", duration: "7D", expiredAt: new Date("2025-12-31").toISOString() },
    { code: "PREMIUM456", duration: "30D", expiredAt: new Date("2026-01-15").toISOString() },
  ]
  // Simpan fallback ke file
  saveVipCodesToFile()
}

// Fungsi untuk simpan VIP codes ke file JSON
function saveVipCodesToFile() {
  try {
    fs.writeFileSync(VIP_CODES_FILE, JSON.stringify(VIP_CODES, null, 2))
  } catch (err) {
    console.error("Error saving VIP codes to file:", err)
  }
}

// Fungsi untuk validasi kode VIP
export function validateVipCode(inputCode) {
  const code = VIP_CODES.find((c) => c.code === inputCode.toUpperCase())
  if (!code) return null
  if (new Date() > new Date(code.expiredAt)) return null // Expired
  return code
}

// Fungsi untuk menambah kode VIP baru (dipanggil dari bot)
export function addVipCode(code, duration, expiredAt) {
  const newCode = {
    code: code.toUpperCase(),
    duration: `${duration}D`,
    expiredAt: expiredAt.toISOString(),
  }
  VIP_CODES.push(newCode)
  saveVipCodesToFile() // Persist ke file
  console.log(`VIP code added and saved: ${code} (${duration}D)`)
  return newCode
}

export const useVIP = () => {
  const isVIP = ref(false)

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
    const dataCopy = { ...data }
    delete dataCopy.checksum
    const dataStr = JSON.stringify(dataCopy) + SECRET_SALT
    return hashCode(dataStr)
  }

  // Validate checksum
  const validateChecksum = (data, checksum) => {
    const expectedChecksum = generateChecksum(data)
    return expectedChecksum === checksum
  }

  // Open IndexedDB (untuk client-side storage user VIP status)
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

            for (const codeEntry of data.usedCodes) {
              if (codeEntry.unlimited === true) {
                console.log("VIP Status: Found unlimited code:", codeEntry)
                hasValidCode = true
                break
              }

              if (codeEntry.expiry && codeEntry.expiry > now) {
                console.log("VIP Status: Found valid code with expiry:", codeEntry)
                hasValidCode = true
                break
              }
            }

            console.log("VIP Status check result:", { hasValidCode, usedCodes: data.usedCodes, checksum: data.checksum })

            if (!hasValidCode) {
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

            if (validCodes.length !== data.usedCodes.length) {
              data.usedCodes = validCodes
              data.checksum = generateChecksum(data)
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

  // Validate VIP code (cek dari JSON file)
  const validateCode = async (code) => {
    try {
      if (typeof window === "undefined" || !("indexedDB" in window)) {
        return { valid: false, message: "IndexedDB not supported" }
      }

      const upperCode = code.toUpperCase().trim()

      // Cek dari JSON file (server-side codes)
      const vipCode = validateVipCode(upperCode)
      if (!vipCode) {
        return { valid: false, message: "Invalid code" }
      }

      // Jika valid, simpan ke IndexedDB untuk tracking user
      const db = await openDB()
      const transaction = db.transaction(["vip"], "readwrite")
      const store = transaction.objectStore("vip")

      const getRequest = store.get("status")

      return new Promise((resolve) => {
        getRequest.onsuccess = () => {
          let currentData = getRequest.result || { id: "status", usedCodes: [], timestamp: Date.now() }

          if (!Array.isArray(currentData.usedCodes)) {
            currentData.usedCodes = []
          }

          // Cek jika kode sudah digunakan
          const codeHash = hashCode(upperCode)
          const existingCode = currentData.usedCodes.find((code) => code.hash === codeHash)
          if (existingCode) {
            if (existingCode.expiry && existingCode.expiry > Date.now()) {
              resolve({ valid: false, message: "Code already used" })
              return
            }
            // Kode expired, hapus dan allow reuse
            currentData.usedCodes = currentData.usedCodes.filter((code) => code.hash !== codeHash)
          }

          // Hitung expiry dari JSON
          const expiry = new Date(vipCode.expiredAt).getTime()

          // Tambah ke used codes
          currentData.usedCodes.push({
            hash: codeHash,
            unlimited: false,
            expiry: expiry,
          })
          currentData.timestamp = Date.now()

          const dataToSave = { ...currentData }
          dataToSave.checksum = generateChecksum(dataToSave)

          const putRequest = store.put(dataToSave)
          putRequest.onsuccess = () => {
            isVIP.value = true
            resolve({ valid: true, isAdmin: false, message: "VIP access activated!" })
          }
          putRequest.onerror = (error) => {
            console.error("Error saving code:", error)
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

          if (!validateChecksum(data, data.checksum)) {
            resolve({ isVIP: false, usedCount: 0 })
            return
          }

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


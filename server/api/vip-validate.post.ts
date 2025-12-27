import { defineEventHandler, readBody } from "h3"
import { readFileSync, writeFileSync } from "fs"
import { join } from "path"

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event)
    const { code } = body

    if (!code || typeof code !== "string") {
      return { valid: false, message: "Invalid code format" }
    }

    const upperCode = code.toUpperCase().trim()
    const filePath = join(process.cwd(), "server", "vip-codes.json")

    // Read current codes
    let codes = []
    try {
      const data = readFileSync(filePath, "utf8")
      codes = JSON.parse(data)
      if (!Array.isArray(codes)) codes = []
    } catch (err) {
      console.error("Error reading VIP codes file:", err)
      return { valid: false, message: "Server error" }
    }

    // Find the code
    const codeIndex = codes.findIndex((c) => c.code === upperCode)
    if (codeIndex === -1) {
      return { valid: false, message: "Invalid code" }
    }

    const vipCode = codes[codeIndex]

    // Check if this is an admin code (unlimited)
    const isAdminCode = vipCode.admin === true || vipCode.unlimited === true

    // Check if expired (skip for admin codes)
    if (!isAdminCode && new Date() > new Date(vipCode.expiredAt)) {
      // Remove expired code
      codes.splice(codeIndex, 1)
      writeFileSync(filePath, JSON.stringify(codes, null, 2))
      return { valid: false, message: "Code expired" }
    }

    // For regular codes: remove after use (one-time use)
    // For admin codes: keep them (unlimited use)
    if (!isAdminCode) {
      codes.splice(codeIndex, 1)
      writeFileSync(filePath, JSON.stringify(codes, null, 2))
    }

    return {
      valid: true,
      message: isAdminCode ? "Admin access activated!" : "VIP access activated!",
      code: {
        ...vipCode,
        unlimited: isAdminCode,
      },
    }
  } catch (err) {
    console.error("VIP validation error:", err)
    return { valid: false, message: "Server error" }
  }
})

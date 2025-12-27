import { defineEventHandler } from "h3"
import { readFileSync } from "fs"
import { join } from "path"

export default defineEventHandler(async () => {
  try {
    const filePath = join(process.cwd(), "server", "vip-codes.json")
    const data = readFileSync(filePath, "utf8")
    const codes = JSON.parse(data)
    return Array.isArray(codes) ? codes : []
  } catch {
    return []
  }
})

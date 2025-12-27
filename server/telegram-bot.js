import "dotenv/config"
import { Telegraf, Markup } from "telegraf"
import { customAlphabet } from "nanoid"
import fs from "fs"
import path from "path"
import { fileURLToPath } from "url"

// ES module equivalent of __dirname
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Path ke file JSON VIP codes
const VIP_CODES_FILE = path.join(__dirname, "..", "server", "vip-codes.json")

// Fungsi load VIP codes dari file
function loadVipCodes() {
  try {
    const data = fs.readFileSync(VIP_CODES_FILE, "utf8")
    return JSON.parse(data)
  } catch (err) {
    return [] // Fallback kosong
  }
}

// Fungsi save VIP codes ke file
function saveVipCodes(codes) {
  try {
    fs.writeFileSync(VIP_CODES_FILE, JSON.stringify(codes, null, 2))
  } catch (err) {
    console.error("Error saving VIP codes:", err)
  }
}

// Fungsi add VIP code
function addVipCode(code, duration, expiredAt) {
  const codes = loadVipCodes()
  const newCode = {
    code: code.toUpperCase(),
    duration: `${duration}D`,
    expiredAt: expiredAt.toISOString(),
  }
  codes.push(newCode)
  saveVipCodes(codes)
  console.log(`VIP code added: ${code} (${duration}D)`)
  return newCode
}

// BOT_TOKEN dari env (wajib di-set, tidak ada fallback)
const BOT_TOKEN = process.env.BOT_TOKEN
if (!BOT_TOKEN) {
  console.error("❌ BOT_TOKEN env is missing. Set BOT_TOKEN in environment or .env file.")
  process.exit(1)
}
const bot = new Telegraf(BOT_TOKEN)

// Generator kode
const generateCode = customAlphabet("ABCDEFGHJKLMNPQRSTUVWXYZ23456789", 6)
const DURATIONS = { "1D": 1, "3D": 3, "7D": 7, "14D": 14, "30D": 30, "90D": 90 }

// Helper function untuk generate VIP code
async function generateVipCode(ctx, days) {
  const code = generateCode()
  const now = new Date()
  // Adjust to GMT+7
  const gmt7Time = new Date(now.getTime() + 7 * 60 * 60 * 1000)
  const expiredAt = new Date(gmt7Time.getTime() + days * 24 * 60 * 60 * 1000)
  const newVip = addVipCode(code, days, expiredAt)
  const expDate = expiredAt.toISOString().slice(0, 19).replace("T", " ")

  await ctx.replyWithMarkdown(`🎉 Kode VIP ${days} Hari:\n\n📝 Kode: \`${newVip.code}\`\n⏰ Durasi: ${days} hari\n📅 Expired: ${expDate}\n\nGunakan di app DramaQu!`)
}

bot.start(async (ctx) => {
  await ctx.reply("Pilih durasi VIP code:", Markup.inlineKeyboard([[Markup.button.callback("1 Hari", "DUR_1D"), Markup.button.callback("7 Hari", "DUR_7D")], [Markup.button.callback("14 Hari", "DUR_14D"), Markup.button.callback("30 Hari", "DUR_30D")], [Markup.button.callback("90 Hari", "DUR_90D")]]))
})

bot.on("callback_query", async (ctx) => {
  const action = ctx.update.callback_query.data
  const durStr = action.replace("DUR_", "")
  const days = DURATIONS[durStr]

  if (!days) {
    await ctx.answerCbQuery("Durasi tidak valid.")
    return
  }

  const code = generateCode()
  const now = new Date()
  // Adjust to GMT+7
  const gmt7Time = new Date(now.getTime() + 7 * 60 * 60 * 1000)
  const expiredAt = new Date(gmt7Time.getTime() + days * 24 * 60 * 60 * 1000)
  const newVip = addVipCode(code, days, expiredAt)
  const expDate = expiredAt.toISOString().slice(0, 19).replace("T", " ")

  await ctx.answerCbQuery(`Kode ${durStr} berhasil di-generate!`)
  await ctx.replyWithMarkdown(`🎉 Kode VIP Baru:\n\n📝 Kode: \`${newVip.code}\`\n⏰ Durasi: ${days} hari\n📅 Expired: ${expDate}\n\nGunakan di app DramaQu!`)
})

// Command handlers untuk durasi langsung
bot.command("1d", async (ctx) => {
  await generateVipCode(ctx, 1)
})

bot.command("3d", async (ctx) => {
  await generateVipCode(ctx, 3)
})

bot.command("7d", async (ctx) => {
  await generateVipCode(ctx, 7)
})

bot.command("14d", async (ctx) => {
  await generateVipCode(ctx, 14)
})

bot.command("30d", async (ctx) => {
  await generateVipCode(ctx, 30)
})

bot.command("gen", async (ctx) => {
  const args = (ctx.message.text || "").split(" ").slice(1)
  const durStr = (args[0] || "").toUpperCase()
  const days = DURATIONS[durStr]

  if (!days) {
    await ctx.reply("Format: /gen 1D|3D|7D|14D|30D|90D")
    return
  }

  const code = generateCode()
  const now = new Date()
  // Adjust to GMT+7
  const gmt7Time = new Date(now.getTime() + 7 * 60 * 60 * 1000)
  const expiredAt = new Date(gmt7Time.getTime() + days * 24 * 60 * 60 * 1000)
  const newVip = addVipCode(code, days, expiredAt)
  const expDate = expiredAt.toISOString().slice(0, 19).replace("T", " ")

  await ctx.replyWithMarkdown(`Kode VIP: \`${newVip.code}\`\nDurasi: ${days} hari\nExpired: ${expDate}`)
})

// Jalankan bot
console.log("Starting Telegram bot...")
bot
  .launch()
  .then(() => {
    console.log("✅ Telegram bot started successfully!")
    console.log("Bot is now listening for commands: /1d, /3d, /7d, /14d, /30d")
  })
  .catch((error) => {
    console.error("❌ Failed to start bot:", error.message)
    console.error("Make sure BOT_TOKEN is correct and internet connection is available")
  })

process.once("SIGINT", () => bot.stop("SIGINT"))
process.once("SIGTERM", () => bot.stop("SIGTERM"))


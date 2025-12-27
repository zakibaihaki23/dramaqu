export default defineNuxtConfig({
  devtools: { enabled: true },
  modules: ["@nuxtjs/tailwindcss"],
  ssr: false,
  compatibilityDate: "2025-12-26",

  runtimeConfig: {
    public: {
      apiBaseUrl: process.env.NUXT_PUBLIC_API_BASE_URL || "https://dramabox.sansekai.my.id/api",
      SECRET_SALT: process.env.SECRET_SALT || "change_me_for_vip_checksum",
    },
  },

  // Dev server configuration untuk akses dari perangkat lain
  devServer: {
    host: "0.0.0.0", // Allows access from other devices on the network
    port: 3000,
  },

  nitro: {
    prerender: {
      crawlLinks: false,
    },
    // Proxy untuk mengatasi CORS (dev & production)
    devProxy: {
      "/api": {
        target: "https://dramabox.sansekai.my.id/api",
        changeOrigin: true,
        prependPath: true,
      },
    },
    // Ensure public assets are copied to output
    publicAssets: [
      {
        baseURL: "/",
        dir: "public",
        maxAge: 60 * 60 * 24 * 7, // 7 days
      },
    ],
  },

  // PWA Configuration - Manual approach with existing nitro config

  // Custom app template for PWA
  app: {
    head: {
      title: "DramaQu - Watch Korean Dramas Online",
      meta: [
        { charset: "utf-8" },
        { name: "viewport", content: "width=device-width, initial-scale=1" },
        { name: "theme-color", content: "#000000" },
        { name: "apple-mobile-web-app-capable", content: "yes" },
        { name: "mobile-web-app-capable", content: "yes" },
        { name: "apple-mobile-web-app-status-bar-style", content: "black-translucent" },
        { name: "apple-mobile-web-app-title", content: "DramaQu" },
        { name: "application-name", content: "DramaQu" },
        { name: "description", content: "Watch Korean dramas online for free with high quality streaming" },
      ],
      link: [
        { rel: "icon", type: "image/x-icon", href: "/favicon.ico" },
        { rel: "apple-touch-icon", href: "/icon-192.png" },
        { rel: "manifest", href: "/manifest.json" },
      ],
    },
  },
})

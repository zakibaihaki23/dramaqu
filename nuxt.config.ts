export default defineNuxtConfig({
  devtools: { enabled: true },
  modules: ["@nuxtjs/tailwindcss"],
  ssr: false,
  compatibilityDate: "2025-12-26",

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

  app: {
    head: {
      viewport: "width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no",
      htmlAttrs: {
        lang: "id",
      },
    },
  },
})

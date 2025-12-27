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

  // Temporarily disabled to fix Nuxt manifest conflicts
  // app: {
  //   head: {
  //     title: "DramaQu - Watch Korean Dramas Online",
  //     meta: [
  //       { charset: "utf-8" },
  //       { name: "viewport", content: "width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" },
  //       { name: "theme-color", content: "#000000" },
  //       { name: "apple-mobile-web-app-capable", content: "yes" },
  //       { name: "mobile-web-app-capable", content: "yes" },
  //       { name: "apple-mobile-web-app-status-bar-style", content: "black-translucent" },
  //       { name: "apple-mobile-web-app-title", content: "DramaQu" },
  //       { name: "application-name", content: "DramaQu" },
  //       { name: "msapplication-TileColor", content: "#000000" },
  //       { name: "msapplication-navbutton-color", content: "#000000" },
  //       { name: "description", content: "Watch Korean dramas online for free with high quality streaming" },
  //       { name: "keywords", content: "korean drama, streaming, watch online, free, dramaqu" },
  //       { property: "og:title", content: "DramaQu - Watch Korean Dramas Online" },
  //       { property: "og:description", content: "Watch Korean dramas online for free with high quality streaming" },
  //       { property: "og:type", content: "website" },
  //       { name: "twitter:card", content: "summary" },
  //       { name: "twitter:title", content: "DramaQu - Watch Korean Dramas Online" },
  //       { name: "twitter:description", content: "Watch Korean dramas online for free with high quality streaming" }
  //     ],
  //     link: [
  //       { rel: "icon", type: "image/x-icon", href: "/favicon.ico" },
  //       { rel: "apple-touch-icon", href: "/apple-touch-icon.png" },
  //       { rel: "manifest", href: "/manifest.json" }
  //     ]
  //   }
  // }
})

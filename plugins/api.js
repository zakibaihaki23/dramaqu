import axios from "axios"
import { defineNuxtPlugin } from "#app"

const BASE_URL = "https://dramabox.sansekai.my.id/api"

const apiClient = axios.create({
  baseURL: BASE_URL,
})

export const dramaxAPI = {
  // Get For You dramas
  getForYou: () => apiClient.get("/dramabox/foryou"),

  // Get Latest dramas
  getLatest: () => apiClient.get("/dramabox/latest"),

  // Get Trending dramas
  getTrending: () => apiClient.get("/dramabox/trending"),

  // Get Random drama
  getRandom: () => apiClient.get("/dramabox/randomdrama"),

  // Search dramas
  search: (query) =>
    apiClient.get("/dramabox/search", {
      params: { query },
    }),
}

export default defineNuxtPlugin(() => {
  return {
    provide: {
      dramaxAPI,
    },
  }
})

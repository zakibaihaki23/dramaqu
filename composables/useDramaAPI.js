import axios from "axios"
import { ref } from "vue"
import { useRuntimeConfig } from "#app"

const runtimeConfig = useRuntimeConfig()
const BASE_URL = runtimeConfig.public.apiBaseUrl

// Create axios instance
const apiClient = axios.create({
  baseURL: BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
})

// Add request interceptor to handle CORS
apiClient.interceptors.request.use((config) => {
  config.headers["Access-Control-Allow-Origin"] = "*"
  return config
})

export const useDramaAPI = () => {
  const loading = ref(false)
  const error = ref(null)

  const fetchForYou = async () => {
    loading.value = true
    error.value = null
    try {
      const response = await apiClient.get(`/dramabox/foryou`)
      return response.data?.data || response.data || []
    } catch (err) {
      error.value = "Failed to load content. Please try again."
      console.error("Error fetching For You:", err)
      return []
    } finally {
      loading.value = false
    }
  }

  const fetchLatest = async () => {
    loading.value = true
    error.value = null
    try {
      const response = await apiClient.get(`/dramabox/latest`)
      return response.data?.data || response.data || []
    } catch (err) {
      error.value = "Failed to load latest dramas."
      console.error("Error fetching Latest:", err)
      return []
    } finally {
      loading.value = false
    }
  }

  const fetchTrending = async () => {
    loading.value = true
    error.value = null
    try {
      const response = await apiClient.get(`/dramabox/trending`)
      return response.data?.data || response.data || []
    } catch (err) {
      error.value = "Failed to load trending dramas."
      console.error("Error fetching Trending:", err)
      return []
    } finally {
      loading.value = false
    }
  }

  const fetchRandom = async () => {
    loading.value = true
    error.value = null
    try {
      const response = await apiClient.get(`/dramabox/randomdrama`)
      return response.data?.data || response.data || []
    } catch (err) {
      error.value = "Failed to load random drama."
      console.error("Error fetching Random:", err)
      return []
    } finally {
      loading.value = false
    }
  }

  const searchDramas = async (query) => {
    loading.value = true
    error.value = null
    try {
      const response = await apiClient.get(`/dramabox/search`, {
        params: { query },
      })
      return response.data?.data || response.data || []
    } catch (err) {
      error.value = "Failed to search dramas."
      console.error("Error searching dramas:", err)
      return []
    } finally {
      loading.value = false
    }
  }

  return {
    loading,
    error,
    fetchForYou,
    fetchLatest,
    fetchTrending,
    fetchRandom,
    searchDramas,
  }
}


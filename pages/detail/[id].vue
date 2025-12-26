<template>
  <div class="bg-black text-white min-h-screen pb-20">
    <!-- Back Button -->
    <div class="sticky top-0 z-40 bg-black/95 backdrop-blur-sm border-b border-gray-800 px-4 py-3">
      <button
        @click="$router.back()"
        class="flex items-center gap-2 text-red-600 hover:text-red-500 transition"
      >
        <svg
          class="w-5 h-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M15 19l-7-7 7-7"
          ></path>
        </svg>
        Back
      </button>
    </div>

    <!-- Loading -->
    <LoadingSpinner
      :show="loading"
      text="Loading drama..."
    />

    <!-- Error -->
    <div
      v-if="error"
      class="px-4 py-4 bg-red-900 bg-opacity-50 text-red-200 rounded-lg m-4"
    >
      {{ error }}
    </div>

    <!-- Drama Details -->
    <div v-if="!loading && drama">
      <!-- Video Player & Episode List Section -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-4 px-4 pt-4">
        <!-- Video Player (Left - 2/3) -->
        <div class="lg:col-span-2">
          <div class="bg-gray-900 rounded-lg overflow-hidden">
            <!-- Video Player -->
            <div class="relative aspect-video bg-black">
              <!-- VIP Restricted Overlay -->
              <div
                v-if="!isVIP && currentVideoUrl"
                class="absolute inset-0 z-10 bg-black/80 flex flex-col items-center justify-center gap-4"
              >
                <svg
                  class="w-16 h-16 text-red-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                  ></path>
                </svg>
                <p class="text-white text-lg font-semibold">VIP Access Required</p>
                <p class="text-gray-400 text-sm text-center px-4">Enter VIP code to watch videos</p>
                <button
                  @click="showVIPModal = true"
                  class="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-lg font-medium transition"
                >
                  Enter VIP Code
                </button>
              </div>
              
              <video
                v-if="currentVideoUrl && isVIP"
                ref="videoPlayer"
                :src="currentVideoUrl"
                controls
                class="w-full h-full"
                @ended="playNextEpisode"
              >
                Your browser does not support the video tag.
              </video>
              <div
                v-else-if="!currentVideoUrl"
                class="w-full h-full flex items-center justify-center text-gray-400"
              >
                <p>Select an episode to play</p>
              </div>
              <div
                v-else
                class="w-full h-full flex items-center justify-center text-gray-400"
              >
                <p>VIP access required</p>
              </div>
            </div>

            <!-- Episode Info & Quality Selector -->
            <div class="p-4 space-y-3">
              <div v-if="currentEpisode">
                <h3 class="text-lg font-semibold">{{ currentEpisode.chapterName }}</h3>
                <p class="text-sm text-gray-400">Episode {{ currentEpisode.chapterIndex + 1 }}</p>
              </div>

              <!-- Quality Selector -->
              <div v-if="availableQualities.length > 0">
                <label class="text-sm text-gray-400 block mb-2">Quality:</label>
                <div class="flex gap-2 flex-wrap">
                  <button
                    v-for="quality in availableQualities"
                    :key="quality"
                    @click="handleQualityClick(quality)"
                    :disabled="!isVIP"
                    class="px-3 py-1 rounded text-sm font-medium transition relative"
                    :class="!isVIP ? 'bg-gray-700 text-gray-500 cursor-not-allowed opacity-50' : selectedQuality === quality ? 'bg-red-600 text-white' : 'bg-gray-800 text-gray-300 hover:bg-gray-700'"
                  >
                    {{ quality }}p
                    <svg
                      v-if="!isVIP"
                      class="absolute -top-1 -right-1 w-4 h-4 text-red-600"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fill-rule="evenodd"
                        d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"
                        clip-rule="evenodd"
                      ></path>
                    </svg>
                  </button>
                </div>
                <p
                  v-if="!isVIP"
                  class="text-xs text-gray-500 mt-2"
                >
                  VIP required to change quality
                </p>
              </div>
            </div>
          </div>
        </div>

        <!-- Episode List (Right - 1/3) -->
        <div class="lg:col-span-1">
          <div class="bg-gray-900 rounded-lg p-4">
            <h3 class="text-lg font-semibold mb-3">Episodes ({{ episodes.length }})</h3>
            <div class="space-y-2 max-h-[600px] overflow-y-auto custom-scrollbar">
              <button
                v-for="(episode, index) in episodes"
                :key="episode.chapterId"
                @click="handleEpisodeClick(episode, index)"
                :disabled="!isVIP"
                class="w-full text-left p-3 rounded-lg transition flex items-center gap-3 relative"
                :class="!isVIP ? 'bg-gray-800/50 text-gray-500 cursor-not-allowed opacity-60' : currentEpisodeIndex === index ? 'bg-red-600 text-white' : 'bg-gray-800 hover:bg-gray-700 text-gray-300'"
              >
                <div class="flex-shrink-0">
                  <img
                    v-if="episode.chapterImg"
                    :src="episode.chapterImg"
                    :alt="episode.chapterName"
                    class="w-16 h-12 object-cover rounded"
                  />
                  <div
                    v-else
                    class="w-16 h-12 bg-gray-700 rounded flex items-center justify-center text-xs"
                  >
                    EP {{ index + 1 }}
                  </div>
                </div>
                <div class="flex-1 min-w-0">
                  <p class="font-medium truncate">{{ episode.chapterName }}</p>
                  <p class="text-xs opacity-75">Episode {{ episode.chapterIndex + 1 }}</p>
                </div>
                <svg
                  v-if="!isVIP"
                  class="w-5 h-5 text-red-600 flex-shrink-0"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fill-rule="evenodd"
                    d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"
                    clip-rule="evenodd"
                  ></path>
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Drama Info Section -->
      <div class="px-4 py-6 space-y-6">
        <!-- Title & Stats -->
        <div>
          <h1 class="text-3xl font-bold text-white mb-3">{{ drama?.bookName || drama?.title }}</h1>
          <div class="flex gap-2 text-sm text-gray-400 flex-wrap">
            <span
              v-if="drama?.playCount"
              class="bg-gray-800 px-3 py-1 rounded"
            >
              👁️ {{ drama?.playCount }}
            </span>
            <span
              v-if="drama?.totalChapterNum"
              class="bg-gray-800 px-3 py-1 rounded"
            >
              📺 {{ drama?.totalChapterNum }} Episodes
            </span>
            <span
              v-if="drama?.bookStatus"
              class="bg-gray-800 px-3 py-1 rounded"
            >
              {{ drama?.bookStatus === 1 ? '🔄 Ongoing' : '✅ Completed' }}
            </span>
          </div>
        </div>

        <!-- Synopsis -->
        <div>
          <h3 class="text-lg font-semibold mb-2">Synopsis</h3>
          <p class="text-gray-300 leading-relaxed">
            {{ drama?.introduction || drama?.description || drama?.synopsis || "No description available." }}
          </p>
        </div>

        <!-- Tags -->
        <div v-if="drama?.tags && drama.tags.length > 0">
          <h3 class="text-lg font-semibold mb-2">Tags</h3>
          <div class="flex gap-2 flex-wrap">
            <span
              v-for="(tag, idx) in drama.tags"
              :key="idx"
              class="text-xs bg-gray-800 px-3 py-1 rounded"
            >
              {{ tag }}
            </span>
          </div>
        </div>

        <!-- Info Grid -->
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div class="bg-gray-900 p-4 rounded-lg">
            <p class="text-gray-400 text-sm mb-1">Total Episodes</p>
            <p class="text-white font-semibold">{{ drama?.totalChapterNum || episodes.length || "N/A" }}</p>
          </div>
          <div class="bg-gray-900 p-4 rounded-lg">
            <p class="text-gray-400 text-sm mb-1">Views</p>
            <p class="text-white font-semibold">{{ drama?.playCount || "N/A" }}</p>
          </div>
          <div class="bg-gray-900 p-4 rounded-lg">
            <p class="text-gray-400 text-sm mb-1">In Library</p>
            <p class="text-white font-semibold">{{ drama?.inLibraryCount ? (drama.inLibraryCount / 1000000).toFixed(1) + "M" : "N/A" }}</p>
          </div>
          <div class="bg-gray-900 p-4 rounded-lg">
            <p class="text-gray-400 text-sm mb-1">Country</p>
            <p class="text-white font-semibold">{{ drama?.country || "N/A" }}</p>
          </div>
        </div>
      </div>

      <!-- Recommendations Section -->
      <div
        v-if="recommendations.length > 0"
        class="px-4 py-6"
      >
        <h2 class="text-2xl font-bold mb-4">You May Also Like</h2>
        <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          <NuxtLink
            v-for="rec in recommendations"
            :key="rec.bookId || rec.id"
            :to="`/detail/${rec.bookId || rec.id}`"
            class="group"
          >
            <div class="relative overflow-hidden rounded-lg bg-gray-900">
              <img
                :src="rec?.bookCover || rec?.coverWap || rec?.image || rec?.poster"
                :alt="rec?.bookName || rec?.title"
                class="w-full h-64 object-cover group-hover:scale-110 transition-transform duration-300"
              />
              <div class="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-3">
                <p class="text-white text-sm font-semibold line-clamp-2">{{ rec?.bookName || rec?.title }}</p>
                <p
                  v-if="rec?.playCount"
                  class="text-gray-300 text-xs mt-1"
                >
                  👁️ {{ rec.playCount }}
                </p>
              </div>
            </div>
            <p class="text-white text-sm font-medium mt-2 line-clamp-2">{{ rec?.bookName || rec?.title }}</p>
          </NuxtLink>
        </div>
      </div>
    </div>

    <!-- Not Found -->
    <div
      v-if="!loading && !drama"
      class="px-4 py-8 text-center"
    >
      <p class="text-gray-400">Drama not found</p>
    </div>

    <!-- VIP Code Modal -->
    <VIPCodeModal
      v-model:show="showVIPModal"
      :force-input="false"
      @activated="handleVIPActivated"
    />
  </div>
</template>

<script setup>
  import { ref, onMounted, watch, nextTick, computed, onUnmounted } from "vue"
  import axios from "axios"

  const route = useRoute()
  const dramaId = computed(() => route.params.id)
  const loading = ref(true)
  const error = ref(null)
  const drama = ref(null)
  const episodes = ref([])
  const recommendations = ref([])
  
  const currentEpisode = ref(null)
  const currentEpisodeIndex = ref(0)
  const currentVideoUrl = ref("")
  const selectedQuality = ref(1080)
  const availableQualities = ref([])
  const videoPlayer = ref(null)

  // VIP Management
  const { checkVIPStatus } = useVIP()
  const isVIP = ref(false)
  const showVIPModal = ref(false)

  // Watch history
  const { saveWatchProgress, getWatchProgress } = useWatchHistory()
  let progressSaveInterval = null

  // Menggunakan proxy lokal untuk mengatasi CORS
  const BASE_URL = "/api"

  const fetchDramaDetails = async (id) => {
    try {
      // Fetch drama details from foryou endpoint
      const response = await axios.get(`${BASE_URL}/dramabox/foryou`)
      const allDramas = response.data?.data || response.data || []

      // Find drama by ID
      let foundDrama = allDramas.find((d) => (d.bookId || d.id) == id)

      if (!foundDrama && allDramas.length > 0) {
        // Fallback to first drama if not found
        foundDrama = allDramas[0]
      }

      return foundDrama
    } catch (err) {
      console.error("Error fetching drama details:", err)
      return null
    }
  }

  const fetchEpisodes = async (bookId) => {
    try {
      const response = await axios.get(`${BASE_URL}/dramabox/allepisode`, {
        params: { bookId: bookId },
      })

      const episodesData = response.data?.data || response.data || []
      return Array.isArray(episodesData) ? episodesData : [episodesData]
    } catch (err) {
      console.error("Error fetching episodes:", err)
      return []
    }
  }

  const fetchRecommendations = async () => {
    try {
      const response = await axios.get(`${BASE_URL}/dramabox/foryou`)
      const data = response.data?.data || response.data || []
      return Array.isArray(data) ? data.slice(0, 10) : []
    } catch (err) {
      console.error("Error fetching recommendations:", err)
      return []
    }
  }

  const saveCurrentProgress = () => {
    if (currentEpisode.value && drama.value && videoPlayer.value) {
      const currentTime = videoPlayer.value.currentTime || 0
      // Ensure drama data includes total episodes from episodes array
      const dramaDataWithEpisodes = {
        ...drama.value,
        totalChapterNum: drama.value.totalChapterNum || episodes.value.length,
      }
      saveWatchProgress(
        dramaId.value,
        dramaDataWithEpisodes,
        currentEpisodeIndex.value,
        currentEpisode.value,
        currentTime
      )
    }
  }

  // Check VIP status
  const checkVIP = async () => {
    try {
      isVIP.value = await checkVIPStatus()
    } catch (error) {
      console.error("Error checking VIP status:", error)
      isVIP.value = false
    }
  }

  // Handle episode click with VIP check
  const handleEpisodeClick = (episode, index) => {
    if (!isVIP.value) {
      showVIPModal.value = true
      return
    }
    selectEpisode(episode, index)
  }

  // Handle quality click with VIP check
  const handleQualityClick = (quality) => {
    if (!isVIP.value) {
      showVIPModal.value = true
      return
    }
    changeQuality(quality)
  }

  // Handle VIP activated
  const handleVIPActivated = async () => {
    await checkVIP()
    if (isVIP.value && currentEpisode.value) {
      // Re-select current episode to enable video
      selectEpisode(currentEpisode.value, currentEpisodeIndex.value)
    }
  }

  const selectEpisode = (episode, index) => {
    // Save progress before switching
    saveCurrentProgress()

    currentEpisode.value = episode
    currentEpisodeIndex.value = index

    // Get available qualities
    const cdnList = episode.cdnList || []
    if (cdnList.length > 0) {
      const videoPathList = cdnList[0].videoPathList || []
      availableQualities.value = videoPathList.map((v) => v.quality).sort((a, b) => b - a)

      // Find default quality or use 1080p
      const defaultVideo = videoPathList.find((v) => v.isDefault === 1)
      if (defaultVideo) {
        selectedQuality.value = defaultVideo.quality
        currentVideoUrl.value = defaultVideo.videoPath
      } else {
        // Try 1080p first
        const video1080 = videoPathList.find((v) => v.quality === 1080)
        if (video1080) {
          selectedQuality.value = 1080
          currentVideoUrl.value = video1080.videoPath
        } else {
          // Try 720p as fallback
          const video720 = videoPathList.find((v) => v.quality === 720)
          if (video720) {
            selectedQuality.value = 720
            currentVideoUrl.value = video720.videoPath
          } else {
            // Use first available
            selectedQuality.value = videoPathList[0].quality
            currentVideoUrl.value = videoPathList[0].videoPath
          }
        }
      }
    }

    // Scroll to top of video player
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  const changeQuality = (quality) => {
    if (!currentEpisode.value) return

    const cdnList = currentEpisode.value.cdnList || []
    if (cdnList.length > 0) {
      const videoPathList = cdnList[0].videoPathList || []
      const video = videoPathList.find((v) => v.quality === quality)
      
      if (video) {
        const currentTime = videoPlayer.value?.currentTime || 0
        selectedQuality.value = quality
        currentVideoUrl.value = video.videoPath
        
        // Resume from current time after quality change
        nextTick(() => {
          if (videoPlayer.value) {
            videoPlayer.value.currentTime = currentTime
            videoPlayer.value.play()
          }
        })
      }
    }
  }

  const playNextEpisode = () => {
    if (currentEpisodeIndex.value < episodes.value.length - 1) {
      selectEpisode(episodes.value[currentEpisodeIndex.value + 1], currentEpisodeIndex.value + 1)
    }
  }

  const loadData = async () => {
    loading.value = true
    error.value = null

    try {
      // Fetch drama details
      const dramaData = await fetchDramaDetails(dramaId.value)
      
      if (!dramaData) {
        error.value = "Drama not found"
        loading.value = false
        return
      }

      drama.value = dramaData

      // Fetch episodes and recommendations in parallel
      const [episodesData, recommendationsData] = await Promise.all([
        fetchEpisodes(dramaData.bookId || dramaData.id),
        fetchRecommendations(),
      ])

      episodes.value = episodesData
      recommendations.value = recommendationsData.filter((r) => (r.bookId || r.id) != dramaId.value)

      // Check for watch history (only if VIP)
      if (isVIP.value) {
        const watchProgress = getWatchProgress(dramaId.value)
        
        if (watchProgress && episodes.value.length > 0) {
          // Resume from last watched episode
          const episodeIndex = Math.min(watchProgress.episodeIndex, episodes.value.length - 1)
          selectEpisode(episodes.value[episodeIndex], episodeIndex)
          
          // Resume from last position after video loads
          nextTick(() => {
            if (videoPlayer.value && watchProgress.currentTime) {
              videoPlayer.value.currentTime = watchProgress.currentTime
            }
          })
        } else if (episodes.value.length > 0) {
          // Auto-select first episode
          selectEpisode(episodes.value[0], 0)
        }
      }

      // Setup auto-save progress every 5 seconds
      if (progressSaveInterval) {
        clearInterval(progressSaveInterval)
      }
      progressSaveInterval = setInterval(saveCurrentProgress, 5000)

      console.log("Drama loaded:", drama.value?.bookName, "Episodes:", episodes.value.length)
    } catch (err) {
      error.value = "Failed to load drama details."
      console.error("Error loading data:", err)
    } finally {
      loading.value = false
    }
  }

  // Watch for route changes
  watch(dramaId, (newId) => {
    if (newId) {
      loadData()
    }
  })

  onMounted(async () => {
    await checkVIP()
    loadData()
  })

  onUnmounted(() => {
    // Save progress before leaving
    saveCurrentProgress()
    
    // Clear interval
    if (progressSaveInterval) {
      clearInterval(progressSaveInterval)
    }
  })

  definePageMeta({
    layout: "default",
  })
</script>

<style scoped>
  .custom-scrollbar::-webkit-scrollbar {
    width: 6px;
  }

  .custom-scrollbar::-webkit-scrollbar-track {
    background: #1f2937;
    border-radius: 3px;
  }

  .custom-scrollbar::-webkit-scrollbar-thumb {
    background: #4b5563;
    border-radius: 3px;
  }

  .custom-scrollbar::-webkit-scrollbar-thumb:hover {
    background: #6b7280;
  }
</style>

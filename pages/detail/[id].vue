<template>
  <div
    class="bg-black text-white fixed inset-0 overflow-hidden"
    style="width: 100vw; height: 100dvh; height: 100vh"
  >
    <!-- Loading -->
    <LoadingSpinner
      :show="loading"
      text="Loading drama..."
    />

    <!-- Error -->
    <div
      v-if="error"
      class="absolute inset-0 flex items-center justify-center bg-black"
    >
      <div class="px-4 py-4 bg-red-900 bg-opacity-50 text-red-200 rounded-lg m-4">
        {{ error }}
      </div>
    </div>

    <!-- VIP Restricted Placeholder - Overlay yang block screen -->
    <div
      v-if="vipChecked && !isVIPComputed"
      class="fixed inset-0 z-[200] bg-black/95 backdrop-blur-sm flex flex-col items-center justify-center gap-4"
    >
      <!-- Back Button (Only visible in overlay) -->
      <button
        class="absolute top-4 left-4 flex items-center gap-2 text-white hover:text-gray-300 transition bg-black/40 backdrop-blur-sm px-3 py-2 rounded-lg z-[201]"
        @click="$router.back()"
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
          />
        </svg>
        <span class="text-sm font-medium">Back</span>
      </button>

      <!-- VIP Content -->
      <div class="flex flex-col items-center gap-4 px-8">
        <svg
          class="w-20 h-20 text-red-600"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
          />
        </svg>
        <div class="text-center">
          <p class="text-white text-xl font-bold mb-2">VIP Access Required</p>
          <p class="text-gray-400 text-sm mb-6 max-w-md">Unlock full access to watch all episodes in HD quality. Enter your VIP code to continue.</p>
        </div>
        <button
          class="bg-red-600 hover:bg-red-700 text-white px-8 py-3 rounded-lg font-semibold text-lg transition transform hover:scale-105 shadow-lg relative z-[202]"
          @click="showVIPModal = true"
        >
          Join VIP
        </button>
      </div>
    </div>

    <!-- Full Screen Video Player -->
    <div
      v-if="!loading && drama"
      class="w-full h-full"
    >
      <!-- Video Player (TikTok-like Portrait Mode) -->
      <VideoPlayer
        v-if="currentVideoUrl && isVIPComputed"
        ref="videoPlayer"
        :src="currentVideoUrl"
        :current-episode-index="currentEpisodeIndex"
        :total-episodes="episodes.length"
        :current-episode="currentEpisode"
        :drama-cover="drama?.cover || ''"
        :can-go-next="currentEpisodeIndex < episodes.length - 1"
        :can-go-previous="currentEpisodeIndex > 0"
        :available-qualities="availableQualities"
        :selected-quality="selectedQuality"
        :initial-time="savedCurrentTime"
        :show-overlays="showAllOverlays"
        @next-episode="playNextEpisode"
        @previous-episode="playPreviousEpisode"
        @ended="playNextEpisode"
        @timeupdate="handleTimeUpdate"
        @quality-change="changeQuality"
        @play="handlePlayerPlay"
        @pause="handlePlayerPause"
        @toggle-overlays="showAllOverlays = !showAllOverlays"
        @progress-update="handleProgressUpdate"
      />

      <!-- Episode Selector (Bottom Bar) - Show when paused or overlays visible -->
      <Transition name="fade">
        <EpisodeSelector
          v-if="episodes.length > 0 && (!isPlayerPlaying || !showAllOverlays)"
          :key="`episode-selector-${isVIP}-${episodes.length}-${showAllOverlays}`"
          :episodes="episodes"
          :current-episode-index="currentEpisodeIndex"
          :total-episodes="episodes.length"
          :is-vip="isVIPComputed"
          :drama-title="drama ? drama.bookName || drama.title || '' : ''"
          :drama-caption="drama ? drama.introduction || drama.description || drama.synopsis || '' : ''"
          :is-playing="isPlayerPlaying"
          :show-overlays="showAllOverlays"
          :progress-data="progressData"
          @select-episode="handleEpisodeClick"
          @toggle-overlays="showAllOverlays = !showAllOverlays"
          @seek-video="handleSeekVideo"
        />
      </Transition>
    </div>

    <!-- VIP Code Modal -->
    <VIPCodeModal
      v-model:show="showVIPModal"
      @activated="handleVIPActivated"
    />
  </div>
</template>

<script setup>
  import { ref, onMounted, watch, nextTick, computed, onUnmounted } from "vue"
  import { useRoute } from "vue-router"
  import axios from "axios"

  const route = useRoute()

  // Set viewport untuk mobile - prevent zoom dan auto scroll
  useHead({
    meta: [
      {
        name: "viewport",
        content: "width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover",
      },
    ],
  })

  // Auto scroll to top dan hide address bar
  onMounted(() => {
    // Multiple attempts untuk ensure scroll
    window.scrollTo(0, 0)

    setTimeout(() => {
      window.scrollTo(0, 1) // Scroll 1px untuk trigger address bar hide
      setTimeout(() => {
        window.scrollTo(0, 0) // Back to top
      }, 100)
    }, 100)

    // Force scroll on any touch
    const forceScroll = () => {
      window.scrollTo(0, 0)
    }
    window.addEventListener("touchstart", forceScroll, { once: true })
  })
  // Get ID from URL params (ensure it's a string)
  const dramaId = computed(() => {
    const id = route.params.id
    // Ensure it's a string and handle array case
    return Array.isArray(id) ? id[0] : String(id)
  })
  const loading = ref(true)
  const error = ref(null)
  const drama = ref(null)
  const episodes = ref([])

  const currentEpisode = ref(null)
  const currentEpisodeIndex = ref(0)
  const currentVideoUrl = ref("")
  const selectedQuality = ref(1080)
  const availableQualities = ref([])
  const videoPlayer = ref(null)
  const isPlayerPlaying = ref(false)
  const savedCurrentTime = ref(0)
  const showAllOverlays = ref(false) // Control untuk show/hide semua overlay (false = visible, true = hidden)
  const progressData = ref({ currentTime: 0, duration: 0, percentage: 0, isDragging: false })

  // VIP Management
  const { isVIP, checkVIPStatus } = useVIP()
  const showVIPModal = ref(false)
  const vipChecked = ref(false) // Track if VIP status has been checked

  // Computed untuk memastikan isVIP reactive di template
  const isVIPComputed = computed(() => {
    const vip = Boolean(isVIP.value)
    console.log("Detail page isVIPComputed:", vip, "isVIP.value:", isVIP.value, "vipChecked:", vipChecked.value)
    return vip
  })

  // Watch isVIP untuk debug
  watch(
    isVIP,
    (newVal, oldVal) => {
      console.log("Detail page isVIP changed:", { old: oldVal, new: newVal })
    },
    { immediate: true }
  )

  // Watch history
  const { saveWatchProgress, getWatchProgress } = useWatchHistory()
  let progressSaveInterval = null

  // Network speed detection for auto quality
  const { getRecommendedQuality } = useNetworkSpeed()

  // Menggunakan proxy lokal untuk mengatasi CORS
  const BASE_URL = "/api"

  const fetchDramaDetails = async (id) => {
    try {
      // Ensure ID is string
      const searchId = String(id)
      console.log("Fetching drama details for ID:", searchId)

      // Try to fetch from detail endpoint first (if exists)
      try {
        const detailResponse = await axios.get(`${BASE_URL}/dramabox/detail`, {
          params: { bookId: searchId },
        })
        // Handle different response structures: data.book or data.data or data directly
        let dramaData = null
        if (detailResponse.data?.data?.book) {
          // Structure: { data: { book: {...} } }
          dramaData = detailResponse.data.data.book
        } else if (detailResponse.data?.book) {
          // Structure: { book: {...} }
          dramaData = detailResponse.data.book
        } else if (detailResponse.data?.data) {
          // Structure: { data: {...} }
          dramaData = detailResponse.data.data
        } else if (detailResponse.data) {
          // Structure: {...} directly
          dramaData = detailResponse.data
        }

        if (dramaData) {
          console.log("Found drama from detail endpoint:", dramaData.bookName || dramaData.title)
          console.log("Drama data bookId:", dramaData.bookId, "id:", dramaData.id)
          // Ensure bookId exists in the returned data - use searchId if not present
          if (!dramaData.bookId && !dramaData.id) {
            console.warn("Detail endpoint returned data without bookId/id, using searchId:", searchId)
            dramaData.bookId = searchId
          } else if (!dramaData.bookId && dramaData.id) {
            // If only id exists, use it as bookId
            dramaData.bookId = dramaData.id
          }
          return dramaData
        }
      } catch (detailErr) {
        console.log("Detail endpoint not available, falling back to foryou:", detailErr.message)
      }

      // Fallback: Fetch from foryou endpoint
      const response = await axios.get(`${BASE_URL}/dramabox/foryou`)
      const allDramas = response.data?.data || response.data || []

      // Find drama by ID - try multiple ID fields
      const foundDrama = allDramas.find((d) => {
        const bookId = String(d.bookId || "")
        const idField = String(d.id || "")
        return bookId === searchId || idField === searchId
      })

      if (!foundDrama) {
        console.warn(
          "Drama not found with ID:",
          searchId,
          "Available IDs:",
          allDramas.slice(0, 5).map((d) => ({ bookId: d.bookId, id: d.id }))
        )
        return null
      }

      console.log("Found drama:", foundDrama.bookName || foundDrama.title, "ID:", foundDrama.bookId || foundDrama.id)
      return foundDrama
    } catch (err) {
      console.error("Error fetching drama details:", err)
      return null
    }
  }

  const fetchEpisodes = async (bookId) => {
    try {
      // Validate bookId
      if (!bookId) {
        console.error("fetchEpisodes called without bookId")
        return []
      }

      console.log("Calling allepisode with bookId:", bookId)
      const response = await axios.get(`${BASE_URL}/dramabox/allepisode`, {
        params: { bookId: String(bookId) },
      })

      const episodesData = response.data?.data || response.data || []
      return Array.isArray(episodesData) ? episodesData : [episodesData]
    } catch (err) {
      console.error("Error fetching episodes:", err)
      if (err.response) {
        console.error("Response status:", err.response.status)
        console.error("Response data:", err.response.data)
      }
      return []
    }
  }

  const selectEpisode = (episode, index, resetTime = false) => {
    // Only allow if VIP
    if (!isVIPComputed.value) {
      showVIPModal.value = true
      return
    }

    // Save progress before switching
    saveCurrentProgress()

    // Reset saved time if this is auto-play next episode
    if (resetTime) {
      savedCurrentTime.value = 0
    }

    currentEpisode.value = episode
    currentEpisodeIndex.value = index

    // Get available qualities
    const cdnList = episode.cdnList || []
    if (cdnList.length > 0) {
      const videoPathList = cdnList[0].videoPathList || []
      availableQualities.value = videoPathList.map((v) => v.quality).sort((a, b) => b - a)

      // Auto-select quality based on network speed
      const recommendedQuality = getRecommendedQuality(availableQualities.value)

      if (recommendedQuality) {
        const recommendedVideo = videoPathList.find((v) => v.quality === recommendedQuality)
        if (recommendedVideo) {
          selectedQuality.value = recommendedQuality
          currentVideoUrl.value = recommendedVideo.videoPath
        } else {
          // Fallback to default or first available
          const defaultVideo = videoPathList.find((v) => v.isDefault === 1)
          if (defaultVideo) {
            selectedQuality.value = defaultVideo.quality
            currentVideoUrl.value = defaultVideo.videoPath
          } else {
            selectedQuality.value = videoPathList[0].quality
            currentVideoUrl.value = videoPathList[0].videoPath
          }
        }
      } else {
        // Fallback if no recommendation
        const defaultVideo = videoPathList.find((v) => v.isDefault === 1)
        if (defaultVideo) {
          selectedQuality.value = defaultVideo.quality
          currentVideoUrl.value = defaultVideo.videoPath
        } else {
          selectedQuality.value = videoPathList[0].quality
          currentVideoUrl.value = videoPathList[0].videoPath
        }
      }
    }

    // Auto-play after selecting episode
    nextTick(() => {
      if (videoPlayer.value?.play) {
        // Use Plyr's play method directly
        videoPlayer.value.play().catch((err) => {
          console.log("Auto-play prevented:", err)
        })
      }
    })
  }

  const handleEpisodeClick = (episode, index) => {
    selectEpisode(episode, index)
  }

  const changeQuality = (quality) => {
    // Only allow quality change if VIP
    if (!isVIPComputed.value) {
      showVIPModal.value = true
      return
    }

    if (!currentEpisode.value) return

    const cdnList = currentEpisode.value.cdnList || []
    if (cdnList.length > 0) {
      const videoPathList = cdnList[0].videoPathList || []
      const video = videoPathList.find((v) => v.quality === quality)

      if (video) {
        // Get current time from Video.js player or native video element
        const currentTime = videoPlayer.value?.getCurrentTime?.() || videoPlayer.value?.currentTime || 0
        selectedQuality.value = quality
        currentVideoUrl.value = video.videoPath

        // Resume from current time after quality change
        nextTick(() => {
          if (videoPlayer.value?.setCurrentTime) {
            videoPlayer.value.setCurrentTime(currentTime)
          } else if (videoPlayer.value?.currentTime !== undefined) {
            videoPlayer.value.currentTime = currentTime
          }
          if (videoPlayer.value?.play) {
            videoPlayer.value.play()
          }
        })
      }
    }
  }

  const saveCurrentProgress = () => {
    if (currentEpisode.value && drama.value && videoPlayer.value) {
      // Get current time from Video.js player or native video element
      const currentTime = videoPlayer.value.getCurrentTime?.() || videoPlayer.value.currentTime || 0
      // Ensure drama data includes total episodes from episodes array
      const dramaDataWithEpisodes = {
        ...drama.value,
        totalChapterNum: episodes.value.length,
      }

      saveWatchProgress(dramaId.value, dramaDataWithEpisodes, currentEpisodeIndex.value, currentEpisode.value, currentTime)
    }
  }

  const playNextEpisode = () => {
    // Prevent double call
    if (currentEpisodeIndex.value >= episodes.value.length - 1) {
      return
    }

    // Get next index before any state changes
    const nextIndex = currentEpisodeIndex.value + 1

    // Show overlays when switching to next episode
    showAllOverlays.value = false

    // Reset saved time when auto-playing next episode to avoid looping
    selectEpisode(episodes.value[nextIndex], nextIndex, true)

    // Auto-play next episode
    nextTick(() => {
      if (videoPlayer.value?.play) {
        // Use Plyr's play method directly
        videoPlayer.value.play().catch((err) => {
          console.log("Auto-play prevented:", err)
        })
      }
    })
  }

  const playPreviousEpisode = () => {
    if (currentEpisodeIndex.value > 0) {
      // Get previous index before any state changes
      const prevIndex = currentEpisodeIndex.value - 1

      selectEpisode(episodes.value[prevIndex], prevIndex)

      // Auto-play previous episode
      nextTick(() => {
        if (videoPlayer.value?.play) {
          // Use Plyr's play method directly
          videoPlayer.value.play().catch((err) => {
            console.log("Auto-play prevented:", err)
          })
        }
      })
    }
  }

  const handlePlayerPlay = () => {
    isPlayerPlaying.value = true
    // Reset overlays to visible when video starts playing
    // VideoPlayer will auto-hide after 10 seconds
    showAllOverlays.value = false

    // Save progress immediately when video starts playing
    saveCurrentProgress()
  }

  const handlePlayerPause = () => {
    isPlayerPlaying.value = false
    // Show overlays when paused
    showAllOverlays.value = false
  }

  const handleTimeUpdate = (currentTime) => {
    // Update saved time for resume (only if > 5 seconds to avoid saving at start)
    if (currentTime > 5) {
      savedCurrentTime.value = currentTime
    }
    // Check if player is playing - use isPaused method from VideoPlayer
    if (videoPlayer.value) {
      const paused = videoPlayer.value.isPaused?.() ?? true
      isPlayerPlaying.value = !paused
    }
  }

  const handleProgressUpdate = (data) => {
    progressData.value = data
  }

  const handleSeekVideo = (time) => {
    if (videoPlayer.value && videoPlayer.value.seekTo) {
      videoPlayer.value.seekTo(time)
    }
  }

  // Watch for play/pause events from player
  watch(
    () => videoPlayer.value?.isPaused?.(),
    (paused) => {
      if (paused !== undefined) {
        isPlayerPlaying.value = !paused
      }
    },
    { immediate: true }
  )

  // Handle VIP activated
  const handleVIPActivated = async () => {
    // Check VIP status multiple times to ensure it's updated
    await checkVIPStatus()
    await new Promise((resolve) => setTimeout(resolve, 100)) // Small delay
    await checkVIPStatus()
    console.log("VIP activated, isVIP:", isVIP.value)

    // Force reactivity update - wait for multiple ticks to ensure all updates
    await nextTick()
    await nextTick()
    await nextTick()

    // Force re-render EpisodeSelector by toggling showAllOverlays
    showAllOverlays.value = false
    await nextTick()
    showAllOverlays.value = true
    await nextTick()

    if (isVIPComputed.value) {
      // If we don't have drama data yet (was skipped because not VIP), load it now
      if (!drama.value || episodes.value.length === 0) {
        console.log("VIP activated but no drama data, loading data now...")
        await loadData()
        // Force reactivity update after loading data
        await nextTick()
        await nextTick()
        await nextTick()
      } else {
        // If there's already a selected episode, re-select it to enable video
        if (currentEpisode.value) {
          selectEpisode(currentEpisode.value, currentEpisodeIndex.value)
        } else if (episodes.value.length > 0) {
          // Auto-select first episode if no episode is selected yet
          selectEpisode(episodes.value[0], 0)
        }
      }
    }
  }

  const loadData = async () => {
    loading.value = true
    error.value = null

    try {
      // Check VIP status first before hitting any API
      console.log("Checking VIP status before loading data...")
      await checkVIPStatus()
      vipChecked.value = true // Mark VIP status as checked
      console.log("VIP status checked, isVIP:", isVIP.value, "isVIPComputed:", isVIPComputed.value)

      // If not VIP, don't fetch drama details to prevent API exposure
      if (!isVIPComputed.value) {
        console.log("User is not VIP, skipping API calls to prevent exposure")
        loading.value = false
        return
      }

      // Fetch drama details
      const dramaData = await fetchDramaDetails(dramaId.value)

      if (!dramaData) {
        error.value = "Drama not found"
        loading.value = false
        return
      }

      drama.value = dramaData
      console.log("Drama loaded:", {
        bookName: dramaData.bookName,
        title: dramaData.title,
        introduction: dramaData.introduction,
        description: dramaData.description,
        synopsis: dramaData.synopsis,
        fullData: dramaData,
      })

      // Get bookId from drama data - ensure it exists
      const bookId = dramaData.bookId || dramaData.id
      if (!bookId) {
        console.error("No bookId found in drama data:", dramaData)
        error.value = "Drama data incomplete - missing bookId"
        loading.value = false
        return
      }

      console.log("Fetching episodes for bookId:", bookId)
      // Fetch episodes
      const episodesData = await fetchEpisodes(bookId)
      episodes.value = episodesData

      // Check VIP status
      await checkVIPStatus()

      // Only auto-select episode if VIP
      if (isVIP.value && episodes.value.length > 0) {
        // Check for saved progress
        const savedProgress = getWatchProgress(dramaId.value)

        if (savedProgress && savedProgress.episodeIndex !== undefined) {
          const savedIndex = savedProgress.episodeIndex
          if (savedIndex >= 0 && savedIndex < episodes.value.length) {
            // Set saved time before selecting episode (only if > 5 seconds to avoid looping)
            savedCurrentTime.value = savedProgress.currentTime && savedProgress.currentTime > 5 ? savedProgress.currentTime : 0
            selectEpisode(episodes.value[savedIndex], savedIndex)
          } else {
            // Invalid index, select first episode
            savedCurrentTime.value = 0
            selectEpisode(episodes.value[0], 0)
          }
        } else {
          // No saved progress, select first episode
          savedCurrentTime.value = 0
          selectEpisode(episodes.value[0], 0)
        }
      } else {
        // Reset episode selection if not VIP
        currentEpisode.value = null
        currentEpisodeIndex.value = 0
        currentVideoUrl.value = ""
        availableQualities.value = []
      }

      // Setup auto-save progress every 5 seconds
      if (progressSaveInterval) {
        clearInterval(progressSaveInterval)
      }
      progressSaveInterval = setInterval(() => {
        saveCurrentProgress()
      }, 5000)
    } catch (err) {
      console.error("Error loading data:", err)
      error.value = "Failed to load drama details"
    } finally {
      loading.value = false
    }
  }

  // Watch for route changes
  watch(
    () => route.params.id,
    (newId) => {
      if (newId) {
        loadData()
      }
    },
    { immediate: false }
  )

  onMounted(async () => {
    // Force check VIP status immediately on mount
    console.log("Detail page mounted, checking VIP status...")
    await checkVIPStatus()
    vipChecked.value = true
    console.log("Initial VIP check complete, isVIP:", isVIP.value)

    // Then load data
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
</script>

<style scoped>
  /* Prevent scrolling */
  body {
    overflow: hidden;
  }

  /* Fade transition */
  .fade-enter-active,
  .fade-leave-active {
    transition: opacity 0.3s ease;
  }

  .fade-enter-from,
  .fade-leave-to {
    opacity: 0;
  }
</style>

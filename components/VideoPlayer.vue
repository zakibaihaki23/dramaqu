<template>
  <div
    ref="playerWrapper"
    class="relative w-full h-screen bg-black overflow-hidden"
    style="width: 100vw; height: 100dvh; height: 100vh; margin: 0; padding: 0"
  >
    <!-- Preview Next Episode (di bawah) - Reactive position -->
    <div
      v-if="canGoNext"
      class="absolute left-0 right-0 h-screen z-0"
      :style="{
        top: `calc(100vh + ${dragOffset}px)`,
      }"
    >
      <img
        v-if="props.dramaCover"
        :src="props.dramaCover"
        class="w-full h-full object-cover"
        :style="{
          filter: `blur(${Math.max(0, 20 - Math.abs(dragOffset) / 20)}px)`,
          opacity: Math.min(1, Math.abs(dragOffset) / 200),
        }"
        alt="Next Episode"
      />
      <div
        v-else
        class="w-full h-full bg-gradient-to-br from-gray-900 to-black"
        :style="{
          opacity: Math.min(1, Math.abs(dragOffset) / 200),
        }"
      ></div>
      <div
        class="absolute inset-0 bg-black/60 flex flex-col items-center justify-center"
        :style="{
          opacity: Math.min(1, Math.abs(dragOffset) / 150),
        }"
      >
        <p class="text-white text-4xl font-bold">Episode {{ props.currentEpisodeIndex + 2 }}</p>
      </div>
    </div>

    <!-- Preview Prev Episode (di atas) - Reactive position -->
    <div
      v-if="canGoPrevious"
      class="absolute left-0 right-0 h-screen z-0"
      :style="{
        bottom: `calc(100vh - ${dragOffset}px)`,
      }"
    >
      <img
        v-if="props.dramaCover"
        :src="props.dramaCover"
        class="w-full h-full object-cover"
        :style="{
          filter: `blur(${Math.max(0, 20 - Math.abs(dragOffset) / 20)}px)`,
          opacity: Math.min(1, Math.abs(dragOffset) / 200),
        }"
        alt="Previous Episode"
      />
      <div
        v-else
        class="w-full h-full bg-gradient-to-br from-gray-900 to-black"
        :style="{
          opacity: Math.min(1, Math.abs(dragOffset) / 200),
        }"
      ></div>
      <div
        class="absolute inset-0 bg-black/60 flex flex-col items-center justify-center"
        :style="{
          opacity: Math.min(1, Math.abs(dragOffset) / 150),
        }"
      >
        <p class="text-white text-4xl font-bold">Episode {{ props.currentEpisodeIndex }}</p>
      </div>
    </div>

    <!-- Draggable container - HANYA PLAYER -->
    <div
      ref="videoContainer"
      class="absolute inset-0 z-[1]"
      :style="{
        transform: `translateY(${dragOffset}px)`,
        opacity: isTransitioning ? 0 : 1,
        transition: isSwipeDragging ? 'none' : isTransitioning ? 'opacity 0.3s ease-in-out' : 'transform 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
      }"
    >
      <!-- Plyr Player Container -->
      <div
        ref="playerContainer"
        class="plyr-container w-full h-full"
      >
        <video
          ref="videoElement"
          class="plyr-video w-full h-full"
          playsinline
          webkit-playsinline
        ></video>
      </div>

      <!-- OVERLAY - IKUT SWIPE -->
      <!-- Swipe Indicator - Hide when showOverlays = true -->
      <!-- <div
        v-if="showSwipeIndicator && (isPaused || !props.showOverlays)"
        class="absolute inset-0 flex flex-col items-center justify-center z-20 pointer-events-none transition-opacity duration-300"
      >
        <div class="bg-black/60 rounded-full p-4 mb-4">
          <svg
            v-if="swipeDirection === 'up'"
            class="w-12 h-12 text-white animate-bounce"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M19 14l-7 7m0 0l-7-7m7 7V3"
            />
          </svg>
          <svg
            v-else
            class="w-12 h-12 text-white animate-bounce"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M5 10l7-7m0 0l7 7m-7-7v18"
            />
          </svg>
        </div>
        <p class="text-white text-lg font-semibold">
          {{ swipeDirection === "up" ? "Swipe up for next episode" : "Swipe down for previous episode" }}
        </p>
      </div> -->

      <!-- Top Navigation Bar (Back + Episode + Controls) - Hide when showOverlays = true -->
      <Transition name="fade">
        <div
          v-if="isPaused || !props.showOverlays"
          class="absolute top-0 left-0 right-0 bg-gradient-to-b from-black/80 to-transparent px-4 py-3"
          style="z-index: 150"
        >
          <div class="flex items-center justify-between">
            <!-- Back Button (Left) -->
            <button
              @click.stop="router.back()"
              class="flex items-center gap-2 text-white hover:text-gray-300 transition px-2 py-1"
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

            <!-- Episode Info (Center) -->
            <div class="pointer-events-none">
              <p class="text-white font-semibold text-base">Episode {{ currentEpisodeIndex + 1 }}</p>
            </div>

            <!-- Volume & Quality Controls (Right) -->
            <div class="flex items-center gap-2">
              <!-- Quality Button (HD Icon with Dropdown) -->
              <div
                v-if="props.availableQualities.length > 0"
                class="relative quality-menu-container"
              >
                <button
                  @click.stop="toggleQualityMenu"
                  class="p-2 text-white hover:text-gray-300 transition"
                  :title="`${props.selectedQuality}p`"
                >
                  <Hd class="w-5 h-5" />
                </button>

                <!-- Quality Dropdown Menu -->
                <Transition name="fade">
                  <div
                    v-if="showQualityMenu"
                    class="absolute right-0 top-full mt-2 bg-black/90 backdrop-blur-sm rounded-lg p-2 min-w-[80px] z-[100]"
                    @click.stop
                  >
                    <button
                      v-for="quality in props.availableQualities"
                      :key="quality"
                      @click="selectQuality(quality)"
                      class="w-full text-left px-3 py-2 text-sm text-white hover:bg-white/10 rounded transition"
                      :class="props.selectedQuality === quality ? 'bg-red-600/50' : ''"
                    >
                      {{ quality }}p
                    </button>
                  </div>
                </Transition>
              </div>

              <!-- Speed Button (Next to Quality) -->
              <div class="relative speed-menu-container">
                <button
                  @click.stop="toggleSpeedMenu"
                  class="p-2 text-white hover:text-gray-300 transition"
                  :title="`${playbackSpeed}x`"
                >
                  <FastForward class="w-5 h-5" />
                </button>

                <!-- Speed Dropdown Menu -->
                <Transition name="fade">
                  <div
                    v-if="showSpeedMenu"
                    class="absolute right-0 top-full mt-2 bg-black/90 backdrop-blur-sm rounded-lg p-2 min-w-[80px] z-[100]"
                    @click.stop
                  >
                    <button
                      v-for="speed in [0.5, 0.75, 1, 1.25, 1.5, 2]"
                      :key="speed"
                      @click="selectSpeed(speed)"
                      class="w-full text-left px-3 py-2 text-sm text-white hover:bg-white/10 rounded transition"
                      :class="playbackSpeed === speed ? 'bg-red-600/50' : ''"
                    >
                      {{ speed }}x
                    </button>
                  </div>
                </Transition>
              </div>

              <!-- Volume Icon Button -->
              <div class="relative volume-slider-container">
                <button
                  @click.stop="toggleVolumeSlider"
                  class="p-2 text-white hover:text-gray-300 transition"
                >
                  <VolumeOff
                    v-if="volume === 0"
                    class="w-5 h-5"
                  />
                  <Volume1
                    v-else-if="volume < 0.5"
                    class="w-5 h-5"
                  />
                  <Volume2
                    v-else
                    class="w-5 h-5"
                  />
                </button>

                <!-- Volume Slider (Vertical) - Show when clicked -->
                <Transition name="fade">
                  <div
                    v-if="showVolumeSlider"
                    class="absolute top-full left-1/2 -translate-x-1/2 mt-2 bg-black/90 backdrop-blur-sm rounded-lg overflow-hidden py-4 px-2"
                    @click.stop
                    @touchstart.stop
                    @touchmove.stop
                    @touchend.stop
                  >
                    <!-- Volume bar container -->
                    <div
                      class="relative w-6 h-32 flex items-center justify-center cursor-pointer"
                      @click="handleVolumeBarClick"
                      @touchstart="handleVolumeBarTouch"
                      @touchmove="handleVolumeBarTouch"
                    >
                      <!-- Background track -->
                      <div class="absolute w-1 h-full bg-gray-700 rounded-full"></div>

                      <!-- Filled track -->
                      <div
                        class="absolute w-1 bg-red-600 rounded-full bottom-0"
                        :style="{ height: `${volume * 100}%` }"
                      ></div>

                      <!-- Thumb -->
                      <div
                        class="absolute w-3 h-3 bg-white rounded-full shadow-lg"
                        :style="{ bottom: `${volume * 100}%`, transform: 'translateY(50%)' }"
                      ></div>
                    </div>
                  </div>
                </Transition>
              </div>
            </div>
          </div>
        </div>
      </Transition>

      <!-- Play Button Overlay (Center) - Show when paused -->
      <Transition name="fade">
        <div
          v-if="isPaused"
          class="absolute inset-0 z-[10] flex items-center justify-center pointer-events-none"
        >
          <button
            @click.stop="togglePlayPause"
            class="pointer-events-auto bg-black/60 hover:bg-black/80 rounded-full p-6 transition-all transform hover:scale-110"
          >
            <svg
              class="w-16 h-16 text-white"
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <path d="M8 5v14l11-7z" />
            </svg>
          </button>
        </div>
      </Transition>

      <!-- Progress Bar (Bottom) - Sticky, TikTok-like -->
      <div
        class="absolute bottom-0 left-0 right-0 z-[40] pointer-events-none"
        style="padding: 0; margin: 0"
      >
        <div
          class="relative w-full h-1 bg-white/20 progress-bar-container pointer-events-auto"
          @mousedown="handleProgressDragStart"
          @touchstart="handleProgressDragStart"
        >
          <div
            class="absolute left-0 top-0 h-full bg-white transition-all duration-100"
            :style="{ width: `${progressPercentage}%` }"
          ></div>
        </div>
      </div>

      <!-- Speed Indicator (Center) - Show only 2x when pressed -->
      <Transition name="fade">
        <div
          v-if="showSpeedIndicator && playbackSpeed === 2"
          class="absolute inset-0 z-[30] flex flex-col items-center justify-center pointer-events-none"
        >
          <div class="bg-black/60 rounded-full p-6 mb-2">
            <svg
              class="w-16 h-16 text-white"
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <!-- Double play icon -->
              <path d="M8 5v14l11-7z" />
              <path
                d="M8 5v14l11-7z"
                transform="translate(4, 0)"
              />
            </svg>
          </div>
          <p class="text-white text-2xl font-bold">2x</p>
        </div>
      </Transition>
    </div>

    <!-- Touch/Click Handler Overlay - DI LUAR videoContainer -->
    <!-- Tangkap touch event, tapi biarkan click di button lewat -->
    <!-- Mulai dari bawah top bar (mt-16) agar tidak menutupi button -->
    <div
      class="absolute left-0 right-0 bottom-0"
      style="top: 64px; z-index: 100; pointer-events: auto"
      @touchstart.capture="handleTouchStartWrapper"
      @touchmove.capture="handleTouchMove"
      @touchend.capture="handleTouchEndWrapper"
      @touchcancel.capture="handleTouchEndWrapper"
      @click="handleScreenClick"
    ></div>
  </div>
</template>

<script setup>
  import { ref, computed, onMounted, onUnmounted, watch, nextTick } from "vue"
  import { useRouter } from "vue-router"
  import Plyr from "plyr"
  import "plyr/dist/plyr.css"
  import { Hd, Volume1, Volume2, VolumeOff, FastForward } from "lucide-vue-next"

  const props = defineProps({
    src: {
      type: String,
      required: true,
    },
    currentEpisodeIndex: {
      type: Number,
      default: 0,
    },
    totalEpisodes: {
      type: Number,
      required: true,
    },
    currentEpisode: {
      type: Object,
      default: null,
    },
    dramaCover: {
      type: String,
      default: "",
    },
    canGoNext: {
      type: Boolean,
      default: true,
    },
    canGoPrevious: {
      type: Boolean,
      default: true,
    },
    availableQualities: {
      type: Array,
      default: () => [],
    },
    selectedQuality: {
      type: Number,
      default: 1080,
    },
    showOverlays: {
      type: Boolean,
      default: false, // false = visible, true = hidden
    },
    initialTime: {
      type: Number,
      default: 0,
    },
  })

  const emit = defineEmits(["next-episode", "previous-episode", "ended", "timeupdate", "quality-change", "play", "pause", "toggle-overlays"])

  const playerContainer = ref(null)
  const videoElement = ref(null)
  const playerWrapper = ref(null)
  const player = ref(null)
  const isPaused = ref(true)
  const showSwipeIndicator = ref(true)
  const swipeDirection = ref("up")
  // Load volume from localStorage
  const getStoredVolume = () => {
    if (process.client) {
      const stored = localStorage.getItem("dramaqu_volume")
      if (stored !== null) {
        return parseFloat(stored)
      }
    }
    return 1
  }

  const getStoredMuted = () => {
    if (process.client) {
      const stored = localStorage.getItem("dramaqu_muted")
      return stored === "true"
    }
    return false
  }

  const volume = ref(getStoredVolume())
  const isMuted = ref(getStoredMuted())
  const showVolumeControl = ref(false)
  const showVolumeSlider = ref(false)
  const showQualityMenu = ref(false)
  const showSpeedMenu = ref(false)
  // Load speed from localStorage
  const getStoredSpeed = () => {
    if (process.client) {
      const stored = localStorage.getItem("dramaqu_speed")
      if (stored !== null) {
        return parseFloat(stored)
      }
    }
    return 1
  }

  const playbackSpeed = ref(getStoredSpeed())
  const lastTapTime = ref(0)
  const tapTimeout = ref(null)
  const currentTime = ref(0)
  const duration = ref(0)
  const isDragging = ref(false)
  const showSpeedIndicator = ref(false)
  const isSpeedPressed = ref(false)
  const originalSpeed = ref(1)
  const lastClickTime = ref(0)
  const isHandlingClick = ref(false)
  let autoHideTimeout = null
  let speedPressTimeout = null

  // Router for back navigation
  const router = useRouter()

  // Swipe gesture handling dengan snap animation (TikTok/IG style)
  const touchStartY = ref(0)
  const touchStartTime = ref(0)
  const dragOffset = ref(0) // Offset untuk drag animation
  const isSwiping = ref(false)
  const isSwipeDragging = ref(false)
  const swipeThreshold = 300 // Threshold untuk next/prev (120px agar tidak terlalu sensitif)
  const videoContainer = ref(null)
  const isTransitioning = ref(false) // Flag untuk episode transition

  const canGoNext = computed(() => props.canGoNext && props.currentEpisodeIndex < props.totalEpisodes - 1)
  const canGoPrevious = computed(() => props.canGoPrevious && props.currentEpisodeIndex > 0)

  // Toggle menu functions - only one menu open at a time
  const toggleQualityMenu = () => {
    if (showQualityMenu.value) {
      showQualityMenu.value = false
    } else {
      // Close other menus first
      showSpeedMenu.value = false
      showVolumeSlider.value = false
      showQualityMenu.value = true
    }
  }

  const toggleSpeedMenu = () => {
    if (showSpeedMenu.value) {
      showSpeedMenu.value = false
    } else {
      // Close other menus first
      showQualityMenu.value = false
      showVolumeSlider.value = false
      showSpeedMenu.value = true
    }
  }

  const toggleVolumeSlider = () => {
    if (showVolumeSlider.value) {
      showVolumeSlider.value = false
    } else {
      // Close other menus first
      showQualityMenu.value = false
      showSpeedMenu.value = false
      showVolumeSlider.value = true
    }
  }

  // Close dropdowns when clicking outside
  const handleClickOutside = (e) => {
    if (!showQualityMenu.value && !showVolumeSlider.value && !showSpeedMenu.value) return

    const qualityMenu = e.target.closest(".quality-menu-container")
    const volumeSlider = e.target.closest(".volume-slider-container")
    const speedMenu = e.target.closest(".speed-menu-container")

    if (!qualityMenu && showQualityMenu.value) {
      showQualityMenu.value = false
    }
    if (!volumeSlider && showVolumeSlider.value) {
      showVolumeSlider.value = false
    }
    if (!speedMenu && showSpeedMenu.value) {
      showSpeedMenu.value = false
    }
  }

  // Initialize Plyr player
  onMounted(async () => {
    await nextTick()

    if (!videoElement.value) {
      console.error("Video element not found")
      return
    }

    // Add click outside listener
    document.addEventListener("click", handleClickOutside)

    try {
      // Initialize Plyr with TikTok-like settings
      player.value = new Plyr(videoElement.value, {
        controls: [], // Hide all default controls
        autoplay: true,
        clickToPlay: false, // We handle click ourselves
        keyboard: {
          focused: true,
          global: false,
        },
        fullscreen: {
          enabled: true,
          fallback: true,
          iosNative: false,
        },
        ratio: null, // No fixed aspect ratio for portrait
        settings: [],
        speed: {
          selected: 1,
          options: [1],
        },
      })

      setupPlayer()
    } catch (error) {
      console.error("Error initializing Plyr player:", error)
    }
  })

  // Setup player events
  const setupPlayer = () => {
    if (!player.value || !videoElement.value) return

    // Set video source
    if (props.src) {
      videoElement.value.src = props.src
      videoElement.value.load()
    }

    // Set initial volume, mute state, and speed from localStorage
    if (player.value) {
      player.value.volume = volume.value
      player.value.muted = isMuted.value
      player.value.speed = playbackSpeed.value
    }

    // Prevent looping by tracking if we just set the time
    let isSettingTime = false
    let hasSetInitialTime = false

    // Event listeners
    player.value.on("ready", () => {
      console.log("Plyr player ready")

      // Hide swipe indicator after 3 seconds
      setTimeout(() => {
        showSwipeIndicator.value = false
      }, 1000)

      // Wait for video to be loaded before setting time and playing
      const handleLoadedMetadata = () => {
        // Set initial time if provided (only if > 5 seconds to avoid looping)
        if (props.initialTime > 5 && !hasSetInitialTime) {
          if (player.value && videoElement.value) {
            isSettingTime = true
            hasSetInitialTime = true
            player.value.currentTime = props.initialTime
            setTimeout(() => {
              isSettingTime = false
            }, 1000)
          }
        }

        // Auto-play after metadata is loaded
        setTimeout(() => {
          if (player.value) {
            player.value.play().catch((err) => {
              console.log("Auto-play prevented:", err)
            })
          }
        }, 300)
      }

      if (videoElement.value.readyState >= 1) {
        // Metadata already loaded
        handleLoadedMetadata()
      } else {
        // Wait for metadata
        videoElement.value.addEventListener("loadedmetadata", handleLoadedMetadata, { once: true })
      }
    })

    player.value.on("ended", () => {
      emit("ended")
      // Let parent handle next episode logic
    })

    // Track seeking to prevent looping
    player.value.on("seeked", () => {
      isSettingTime = false
    })

    player.value.on("seeking", () => {
      isSettingTime = true
    })

    player.value.on("timeupdate", () => {
      if (player.value && !isSettingTime && !isDragging.value) {
        const time = player.value.currentTime
        currentTime.value = time
        // Only emit if time is progressing normally (not looping)
        if (time > 0.5) {
          emit("timeupdate", time)
        }
      }
    })

    player.value.on("loadedmetadata", () => {
      if (player.value) {
        duration.value = player.value.duration || 0
      }
    })

    player.value.on("durationchange", () => {
      if (player.value) {
        duration.value = player.value.duration || 0
      }
    })

    player.value.on("play", () => {
      isPaused.value = false
      showVolumeControl.value = false
      // Clear auto-hide timeout when playing starts
      if (autoHideTimeout) {
        clearTimeout(autoHideTimeout)
        autoHideTimeout = null
      }
      // Auto-hide overlays after 10 seconds when video starts playing
      // showOverlays: false = visible, true = hidden
      // Start with visible (showOverlays = false), then hide after 10 seconds
      autoHideTimeout = setTimeout(() => {
        if (!isPaused.value && !props.showOverlays) {
          // Hide overlays (set showOverlays to true = hidden)
          emit("toggle-overlays")
        }
      }, 4000)
      // Emit play event to parent
      emit("play")
    })

    player.value.on("pause", () => {
      isPaused.value = true
      // Clear auto-hide timeout when paused
      if (autoHideTimeout) {
        clearTimeout(autoHideTimeout)
        autoHideTimeout = null
      }
      // Emit pause event to parent
      emit("pause")
    })

    player.value.on("volumechange", () => {
      if (player.value) {
        volume.value = player.value.volume
        isMuted.value = player.value.muted || player.value.volume === 0
      }
    })

    // Set initial volume, mute state, and speed from localStorage
    if (player.value) {
      player.value.volume = volume.value
      player.value.muted = isMuted.value
      player.value.speed = playbackSpeed.value
    }

    // Keyboard shortcuts
    const handleKeyboard = (e) => {
      if (!player.value) return

      // Only handle if player is focused
      const isPlayerFocused = playerWrapper.value?.contains(document.activeElement) || !isPaused.value

      if (!isPlayerFocused) return

      switch (e.key) {
        case "ArrowUp":
        case "w":
        case "W":
          e.preventDefault()
          if (canGoPrevious.value) {
            goToPreviousEpisode()
          }
          break
        case "ArrowDown":
        case "s":
        case "S":
          e.preventDefault()
          if (canGoNext.value) {
            goToNextEpisode()
          }
          break
        case "ArrowLeft":
          e.preventDefault()
          if (player.value) {
            player.value.currentTime = Math.max(0, player.value.currentTime - 10)
          }
          break
        case "ArrowRight":
          e.preventDefault()
          if (player.value) {
            player.value.currentTime = Math.min(player.value.duration, player.value.currentTime + 10)
          }
          break
        case " ":
          if (!document.activeElement.matches("input, textarea, select")) {
            e.preventDefault()
            togglePlayPause()
          }
          break
        case "f":
        case "F":
          e.preventDefault()
          if (player.value) {
            if (player.value.fullscreen.active) {
              player.value.fullscreen.exit()
            } else {
              player.value.fullscreen.enter()
            }
          }
          break
        case "m":
        case "M":
          e.preventDefault()
          toggleMute()
          break
      }
    }

    document.addEventListener("keydown", handleKeyboard)

    // Cleanup keyboard listener on unmount
    onUnmounted(() => {
      document.removeEventListener("keydown", handleKeyboard)
    })
  }

  // Touch/Swipe handlers - Wrapper untuk handle touch start
  const handleTouchStartWrapper = (e) => {
    const touchX = e.touches[0].clientX
    const touchY = e.touches[0].clientY
    const screenWidth = window.innerWidth

    // Check if touch di zona 2x speed (setengah kanan layar)
    const isSpeedZone = touchX > screenWidth / 2

    console.log("🔵 Touch start:", {
      x: touchX,
      y: touchY,
      screenWidth,
      speedZoneStart: screenWidth / 2,
      isSpeedZone,
    })

    // Kalau di speed zone, handle press untuk 2x speed
    if (isSpeedZone) {
      handleScreenPress(e)
      isSwipeDragging.value = false
      return
    }

    // Kalau di swipe zone, handle swipe
    touchStartY.value = touchY
    touchStartTime.value = Date.now()
    isSwiping.value = false
    isSwipeDragging.value = true
  }

  const handleTouchMove = (e) => {
    if (!isSwipeDragging.value) return

    const currentY = e.touches[0].clientY
    const deltaY = currentY - touchStartY.value

    // Kalau geser > 10px, anggap sebagai swipe (cancel press 2x speed)
    if (Math.abs(deltaY) > 10) {
      isSwiping.value = true

      // Cancel press timer kalau mulai swipe
      if (speedPressTimeout) {
        clearTimeout(speedPressTimeout)
        speedPressTimeout = null
        isSpeedPressed.value = false
      }

      // Cancel 2x speed kalau sudah di-set DAN cancel press state
      if (isSpeedPressed.value || playbackSpeed.value === 2) {
        isSpeedPressed.value = false
        if (player.value && playbackSpeed.value === 2) {
          player.value.speed = originalSpeed.value
          playbackSpeed.value = originalSpeed.value
        }
        showSpeedIndicator.value = false
      }

      // Update drag offset - video mengikuti jari FULL (tanpa resistance berlebihan)
      // Tapi tambah sedikit resistance agar tidak terlalu sensitif
      const resistance = 0.7
      dragOffset.value = deltaY * resistance

      console.log("🟢 Dragging:", { deltaY, dragOffset: dragOffset.value })

      // Show swipe indicator
      if (deltaY < -30 && canGoNext.value) {
        showSwipeIndicator.value = true
        swipeDirection.value = "up"
      } else if (deltaY > 30 && canGoPrevious.value) {
        showSwipeIndicator.value = true
        swipeDirection.value = "down"
      } else {
        showSwipeIndicator.value = false
      }
    }
  }

  const handleTouchEndWrapper = (e) => {
    const touchX = e.changedTouches[0].clientX
    const screenWidth = window.innerWidth
    const isSpeedZone = touchX > screenWidth / 2

    // Kalau di speed zone, handle release untuk 2x speed
    if (isSpeedZone) {
      handleScreenRelease(e)
      return
    }

    // Kalau di swipe zone, handle swipe end
    handleTouchEnd(e)
  }

  const handleTouchEnd = (e) => {
    if (!isSwipeDragging.value) return

    const endY = e.changedTouches[0].clientY
    const deltaY = endY - touchStartY.value

    console.log("🔴 Touch end:", {
      deltaY,
      threshold: swipeThreshold,
      isSwiping: isSwiping.value,
    })

    isSwipeDragging.value = false

    // Kalau tidak swipe (static press), biarkan press 2x speed handler yang handle
    if (!isSwiping.value) {
      dragOffset.value = 0
      return
    }

    // Snap decision: swipe dikit langsung next/prev (30px threshold)
    const shouldSnapNext = deltaY < -swipeThreshold && canGoNext.value
    const shouldSnapPrev = deltaY > swipeThreshold && canGoPrevious.value

    if (shouldSnapNext) {
      // Snap ke next episode (swipe up) - slide ke atas lalu fade
      console.log("✅ Snap to next episode")
      dragOffset.value = -window.innerHeight

      // Wait for slide animation, then fade out player
      setTimeout(() => {
        isTransitioning.value = true

        // Fade out selesai, ganti episode
        setTimeout(() => {
          goToNextEpisode()
          dragOffset.value = 0

          // Fade in player baru
          setTimeout(() => {
            isTransitioning.value = false
          }, 50)
        }, 300)
      }, 500)
    } else if (shouldSnapPrev) {
      // Snap ke previous episode (swipe down) - slide ke bawah lalu fade
      console.log("✅ Snap to previous episode")
      dragOffset.value = window.innerHeight

      // Wait for slide animation, then fade out player
      setTimeout(() => {
        isTransitioning.value = true

        // Fade out selesai, ganti episode
        setTimeout(() => {
          goToPreviousEpisode()
          dragOffset.value = 0

          // Fade in player baru
          setTimeout(() => {
            isTransitioning.value = false
          }, 50)
        }, 300)
      }, 500)
    } else {
      // Snap back ke posisi awal (bounce back)
      console.log("⬅️ Snap back to original position")
      dragOffset.value = 0
    }

    // Hide swipe indicator
    setTimeout(() => {
      showSwipeIndicator.value = false
      isSwiping.value = false
    }, 300)
  }

  // Go to previous episode
  const goToPreviousEpisode = () => {
    if (canGoPrevious.value) {
      player.value?.pause()
      emit("previous-episode")
    }
  }

  // Go to next episode
  const goToNextEpisode = () => {
    if (canGoNext.value) {
      player.value?.pause()
      emit("next-episode")
    }
  }

  // Toggle play/pause
  const togglePlayPause = () => {
    if (!player.value) return

    if (isPaused.value) {
      player.value.play().catch((err) => {
        console.log("Play prevented:", err)
      })
    } else {
      player.value.pause()
    }
  }

  // Handle screen click - show overlays if hidden or pause
  const handleScreenClick = (e) => {
    // Close any open menus first
    if (showQualityMenu.value || showSpeedMenu.value || showVolumeSlider.value) {
      showQualityMenu.value = false
      showSpeedMenu.value = false
      showVolumeSlider.value = false
      return
    }

    // Only handle if not from a speed press
    if (!isSpeedPressed.value && !isHandlingClick.value) {
      isHandlingClick.value = true

      // If paused, play the video
      if (isPaused.value) {
        togglePlayPause()
      }
      // If playing and overlays are hidden (showOverlays = true), show overlays
      else if (!isPaused.value && props.showOverlays) {
        emit("toggle-overlays")

        // Auto-hide after 5 seconds if still playing
        if (autoHideTimeout) {
          clearTimeout(autoHideTimeout)
        }

        autoHideTimeout = setTimeout(() => {
          if (!isPaused.value && !props.showOverlays) {
            emit("toggle-overlays")
          }
        }, 5000)
      }
      // If playing and overlays are visible, toggle play/pause
      else if (!isPaused.value && !props.showOverlays) {
        togglePlayPause()
      }

      setTimeout(() => {
        isHandlingClick.value = false
      }, 100)
    }
  }

  // Handle screen press - start press and hold timer (hanya di zona kanan)
  const handleScreenPress = (e) => {
    const touchX = e.touches[0].clientX
    const screenWidth = window.innerWidth

    // Check if touch di zona 2x speed (setengah kanan layar)
    const isSpeedZone = touchX > screenWidth / 2

    console.log("🔥 handleScreenPress called:", {
      x: touchX,
      screenWidth,
      speedZoneStart: screenWidth / 2,
      isSpeedZone,
    })

    // Hanya handle kalau di speed zone
    if (!isSpeedZone) {
      console.log("❌ Not in speed zone, skipping")
      return
    }

    lastClickTime.value = Date.now()

    // If paused, don't handle press for speed
    if (isPaused.value) {
      console.log("⏸️ Video is paused, skipping press handler")
      return
    }

    e.stopPropagation()
    e.preventDefault()

    // If playing, start timer for 2x speed (300ms)
    if (!isPaused.value && !isSpeedPressed.value && player.value) {
      isSpeedPressed.value = true
      originalSpeed.value = playbackSpeed.value
      console.log("⏱️ Starting 300ms timer for 2x speed, original speed:", originalSpeed.value)

      // Clear any existing timeout
      if (speedPressTimeout) {
        clearTimeout(speedPressTimeout)
        speedPressTimeout = null
      }

      // Start timer - set to 2x speed after 300ms
      speedPressTimeout = setTimeout(() => {
        console.log("⏰ 300ms elapsed, checking conditions...")
        // Double check conditions before setting speed AND still in speed zone
        if (isSpeedPressed.value && player.value && !isPaused.value) {
          // Set to 2x speed after 300ms
          player.value.speed = 2
          playbackSpeed.value = 2
          console.log("🚀 Speed set to 2x!")
          // Show speed indicator
          showSpeedIndicator.value = true
        } else {
          console.log("❌ Conditions not met:", {
            isSpeedPressed: isSpeedPressed.value,
            hasPlayer: !!player.value,
            isPlaying: !isPaused.value,
          })
        }
      }, 300)
    } else {
      console.log("❌ Cannot start timer:", {
        isPlaying: !isPaused.value,
        notAlreadyPressed: !isSpeedPressed.value,
        hasPlayer: !!player.value,
      })
    }
  }

  // Handle screen release - restore ke original speed
  const handleScreenRelease = (e) => {
    console.log("🔥 handleScreenRelease called")
    const releaseTime = Date.now()
    const timeDiff = releaseTime - lastClickTime.value

    // If paused, don't handle release
    if (isPaused.value) {
      console.log("⏸️ Video is paused, skipping release handler")
      return
    }

    e.stopPropagation()
    e.preventDefault()

    if (isSpeedPressed.value) {
      console.log("🔄 Releasing press, time held:", timeDiff + "ms")
      isSpeedPressed.value = false

      // Clear timer if still running
      if (speedPressTimeout) {
        console.log("⏹️ Clearing timer (released before 3 seconds)")
        clearTimeout(speedPressTimeout)
        speedPressTimeout = null
      }

      // Restore ke original speed
      if (player.value && playbackSpeed.value === 2) {
        console.log("⬇️ Restoring speed to:", originalSpeed.value)
        player.value.speed = originalSpeed.value
        playbackSpeed.value = originalSpeed.value
        // TIDAK save ke localStorage untuk 2x speed temporary
      }

      // Hide speed indicator
      setTimeout(() => {
        showSpeedIndicator.value = false
      }, 300)

      // If release was quick (less than 300ms), trigger click handler
      if (timeDiff < 300) {
        setTimeout(() => {
          handleScreenClick(e)
        }, 50)
      }
    } else {
      // If not speed press but quick release, trigger click handler
      if (timeDiff < 300) {
        setTimeout(() => {
          handleScreenClick(e)
        }, 50)
      }
    }
  }

  // Volume controls - handle click on volume bar
  const handleVolumeBarClick = (e) => {
    const container = e.currentTarget
    const rect = container.getBoundingClientRect()
    const clickY = e.clientY - rect.top
    const containerHeight = rect.height

    // Invert karena vertical (top = max, bottom = min)
    const newVolume = 1 - clickY / containerHeight
    const clampedVolume = Math.max(0, Math.min(1, newVolume))

    console.log("Volume bar click:", { clickY, containerHeight, newVolume: clampedVolume })

    volume.value = clampedVolume
    if (player.value) {
      player.value.volume = clampedVolume
      player.value.muted = clampedVolume === 0
      isMuted.value = clampedVolume === 0
    }
    // Save to localStorage
    if (process.client) {
      localStorage.setItem("dramaqu_volume", clampedVolume.toString())
      localStorage.setItem("dramaqu_muted", (clampedVolume === 0).toString())
    }
  }

  // Handle touch on volume bar
  const handleVolumeBarTouch = (e) => {
    e.preventDefault()
    const touch = e.touches[0]
    const container = e.currentTarget
    const rect = container.getBoundingClientRect()
    const touchY = touch.clientY - rect.top
    const containerHeight = rect.height

    // Invert karena vertical (top = max, bottom = min)
    const newVolume = 1 - touchY / containerHeight
    const clampedVolume = Math.max(0, Math.min(1, newVolume))

    volume.value = clampedVolume
    if (player.value) {
      player.value.volume = clampedVolume
      player.value.muted = clampedVolume === 0
      isMuted.value = clampedVolume === 0
    }
    // Save to localStorage
    if (process.client) {
      localStorage.setItem("dramaqu_volume", clampedVolume.toString())
      localStorage.setItem("dramaqu_muted", (clampedVolume === 0).toString())
    }
  }

  const toggleMute = () => {
    // Mute only happens when volume = 0, no direct mute button
    if (!player.value) return
    if (volume.value === 0) {
      // Unmute by setting volume to 0.5
      volume.value = 0.5
      player.value.volume = 0.5
      player.value.muted = false
      isMuted.value = false
    } else {
      // Mute by setting volume to 0
      volume.value = 0
      player.value.volume = 0
      player.value.muted = true
      isMuted.value = true
    }
    // Save to localStorage
    if (process.client) {
      localStorage.setItem("dramaqu_volume", volume.value.toString())
      localStorage.setItem("dramaqu_muted", isMuted.value.toString())
    }
  }

  const selectQuality = (quality) => {
    emit("quality-change", quality)
    showQualityMenu.value = false
  }

  // Speed controls
  const selectSpeed = (speed) => {
    playbackSpeed.value = speed
    if (player.value) {
      player.value.speed = speed
    }
    showSpeedMenu.value = false
    // Save to localStorage
    if (process.client) {
      localStorage.setItem("dramaqu_speed", speed.toString())
    }
  }

  // Double tap to toggle 2x speed
  const handleDoubleTap = (e) => {
    if (isPaused.value) return

    const currentTime = Date.now()
    const timeDiff = currentTime - lastTapTime.value

    if (timeDiff < 300 && timeDiff > 0) {
      // Double tap detected
      e.preventDefault()
      e.stopPropagation()

      // Toggle between 1x and 2x speed
      const newSpeed = playbackSpeed.value === 2 ? 1 : 2
      selectSpeed(newSpeed)

      lastTapTime.value = 0
    } else {
      lastTapTime.value = currentTime
    }
  }

  // Progress bar controls
  const progressPercentage = computed(() => {
    if (duration.value === 0) return 0
    return (currentTime.value / duration.value) * 100
  })

  const handleProgressDragStart = (e) => {
    if (!player.value) return

    isDragging.value = true
    // Hide all overlays when dragging
    if (!props.showOverlays) {
      emit("toggle-overlays")
    }

    const progressBar = e.currentTarget.closest(".progress-bar-container")
    if (!progressBar) return

    const handleProgressDrag = (moveEvent) => {
      const rect = progressBar.getBoundingClientRect()
      const clientX = moveEvent.touches ? moveEvent.touches[0].clientX : moveEvent.clientX
      const percent = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width))
      const newTime = percent * duration.value

      if (player.value) {
        player.value.currentTime = newTime
        currentTime.value = newTime
      }
    }

    const handleProgressDragEnd = () => {
      isDragging.value = false
      // Show overlays again after dragging
      if (props.showOverlays) {
        emit("toggle-overlays")
      }
      document.removeEventListener("mousemove", handleProgressDrag)
      document.removeEventListener("mouseup", handleProgressDragEnd)
      document.removeEventListener("touchmove", handleProgressDrag)
      document.removeEventListener("touchend", handleProgressDragEnd)
    }

    // Initial set
    handleProgressDrag(e)

    document.addEventListener("mousemove", handleProgressDrag)
    document.addEventListener("mouseup", handleProgressDragEnd)
    document.addEventListener("touchmove", handleProgressDrag, { passive: false })
    document.addEventListener("touchend", handleProgressDragEnd)
  }

  // Format time helper
  const formatTime = (seconds) => {
    if (!seconds || isNaN(seconds)) return "0:00"
    const hours = Math.floor(seconds / 3600)
    const mins = Math.floor((seconds % 3600) / 60)
    const secs = Math.floor(seconds % 60)

    if (hours > 0) {
      return `${hours}:${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
    }
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  // Handle show overlays with auto-hide
  const handleShowOverlays = () => {
    emit("toggle-overlays")

    // Auto-hide after 3 seconds if still playing
    if (autoHideTimeout) {
      clearTimeout(autoHideTimeout)
    }

    autoHideTimeout = setTimeout(() => {
      if (!isPaused.value) {
        emit("toggle-overlays")
      }
    }, 3000)
  }

  // Watch for source changes
  watch(
    () => props.src,
    (newSrc) => {
      if (player.value && videoElement.value && newSrc) {
        try {
          // Reset initial time when source changes (unless it's the same episode)
          const shouldResume = props.initialTime > 1

          videoElement.value.src = newSrc
          videoElement.value.load()

          // Reset flag when source changes
          let hasSetInitialTime = false
          let isSettingTime = false

          // Wait for video metadata before setting time and playing
          const handleLoadedMetadata = () => {
            // Set initial time only if > 5 seconds and not already set
            if (props.initialTime > 5 && !hasSetInitialTime) {
              if (player.value) {
                isSettingTime = true
                hasSetInitialTime = true
                player.value.currentTime = props.initialTime
                setTimeout(() => {
                  isSettingTime = false
                }, 1000)
              }
            }

            // Auto-play after metadata is loaded
            setTimeout(() => {
              if (player.value) {
                player.value.play().catch((err) => {
                  console.log("Auto-play prevented:", err)
                })
              }
            }, 300)
          }

          if (videoElement.value.readyState >= 1) {
            // Metadata already loaded
            handleLoadedMetadata()
          } else {
            // Wait for metadata
            videoElement.value.addEventListener("loadedmetadata", handleLoadedMetadata, { once: true })
          }
        } catch (err) {
          console.error("Error changing video source:", err)
        }
      }
    }
  )

  // Watch for initialTime changes (only if > 5 seconds to avoid looping)
  watch(
    () => props.initialTime,
    (newTime) => {
      if (player.value && newTime > 5 && videoElement.value.readyState >= 2) {
        // Only set time if video is loaded enough and difference is significant
        const currentTime = player.value.currentTime || 0
        if (Math.abs(currentTime - newTime) > 3) {
          // Only set if difference is more than 3 seconds to avoid looping
          setTimeout(() => {
            if (player.value) {
              isSettingTime = true
              player.value.currentTime = newTime
              setTimeout(() => {
                isSettingTime = false
              }, 1000)
            }
          }, 300)
        }
      }
    }
  )

  // Cleanup
  onUnmounted(() => {
    if (player.value) {
      player.value.destroy()
      player.value = null
    }
    // Remove click outside listener
    document.removeEventListener("click", handleClickOutside)
    // Clear auto-hide timeout
    if (autoHideTimeout) {
      clearTimeout(autoHideTimeout)
      autoHideTimeout = null
    }
  })

  // Expose player methods
  defineExpose({
    player: player,
    play: () => player.value?.play(),
    pause: () => player.value?.pause(),
    getCurrentTime: () => player.value?.currentTime || 0,
    setCurrentTime: (time) => {
      if (player.value) {
        player.value.currentTime = time
      }
    },
    getDuration: () => player.value?.duration || 0,
    isPaused: () => isPaused.value,
    isEnded: () => player.value?.ended || false,
  })
</script>

<style scoped>
  .plyr-container {
    background: #000;
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
  }

  /* Plyr styling for portrait mode - Full size */
  :deep(.plyr) {
    width: 100% !important;
    height: 100% !important;
    position: absolute;
    top: 0;
    left: 0;
    padding: 0 !important;
  }

  :deep(.plyr__video-wrapper) {
    width: 100% !important;
    height: 100% !important;
    position: relative;
    padding: 0 !important;
  }

  :deep(.plyr__video) {
    width: 100% !important;
    height: 100% !important;
    object-fit: cover; /* Cover instead of contain for full size */
    position: absolute;
    top: 0;
    left: 0;
  }

  /* Hide Plyr controls completely */
  :deep(.plyr__controls) {
    display: none !important;
  }

  :deep(.plyr__poster) {
    background-size: cover;
    background-position: center;
    background-repeat: no-repeat;
    width: 100% !important;
    height: 100% !important;
  }

  /* Volume slider styling */
  .volume-slider::-webkit-slider-thumb {
    appearance: none;
    width: 12px;
    height: 12px;
    border-radius: 50%;
    background: #ef4444;
    cursor: pointer;
  }

  .volume-slider::-moz-range-thumb {
    width: 12px;
    height: 12px;
    border-radius: 50%;
    background: #ef4444;
    cursor: pointer;
    border: none;
  }

  /* Vertical slider styling */
  .vertical-slider {
    width: 2px;
    height: 96px;
  }

  .vertical-slider::-webkit-slider-thumb {
    width: 12px;
    height: 12px;
    margin-left: 5px;
    margin-top: 0;
  }

  .vertical-slider::-moz-range-thumb {
    width: 12px;
    height: 12px;
    border: none;
    margin-left: 5px;
  }

  .vertical-slider::-webkit-slider-runnable-track {
    width: 2px;
    background: #374151;
  }

  .vertical-slider::-moz-range-track {
    width: 2px;
    background: #374151;
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

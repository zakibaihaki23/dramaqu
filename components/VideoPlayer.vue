<template>
  <div 
    ref="playerWrapper"
    class="relative w-full h-screen bg-black overflow-hidden"
    style="width: 100vw; height: 100vh; margin: 0; padding: 0;"
    @touchstart="handleTouchStart"
    @touchmove="handleTouchMove"
    @touchend="handleTouchEnd"
  >
    <!-- Plyr Player Container -->
    <div ref="playerContainer" class="plyr-container w-full h-full">
      <video
        ref="videoElement"
        class="plyr-video w-full h-full"
        playsinline
        webkit-playsinline
      ></video>
    </div>
    
    <!-- Swipe Indicator -->
    <div 
      v-if="showSwipeIndicator"
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
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 14l-7 7m0 0l-7-7m7 7V3" />
        </svg>
        <svg 
          v-else
          class="w-12 h-12 text-white animate-bounce" 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 10l7-7m0 0l7 7m-7-7v18" />
        </svg>
      </div>
      <p class="text-white text-lg font-semibold">
        {{ swipeDirection === 'up' ? 'Swipe up for next episode' : 'Swipe down for previous episode' }}
      </p>
    </div>

    <!-- Episode Info Overlay (Top) - Fade out when playing -->
    <Transition name="fade">
      <div 
        v-if="isPaused"
        class="absolute top-0 left-0 right-0 z-[10] bg-gradient-to-b from-black/80 to-transparent p-4 pointer-events-none"
      >
        <div class="flex items-center justify-between">
          <div>
            <p class="text-white font-semibold text-base">
              Episode {{ currentEpisodeIndex + 1 }}
            </p>
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
          <svg class="w-16 h-16 text-white" fill="currentColor" viewBox="0 0 24 24">
            <path d="M8 5v14l11-7z"/>
          </svg>
        </button>
      </div>
    </Transition>

    <!-- Volume Slider (Top Right) - Fade out when playing -->
    <Transition name="fade">
      <div 
        v-if="isPaused || showVolumeControl"
        class="absolute top-4 right-4 z-[50] bg-black/60 backdrop-blur-sm rounded-lg p-3 pointer-events-auto"
        @mouseenter="showVolumeControl = true"
        @mouseleave="showVolumeControl = false"
      >
        <div class="flex items-center gap-3">
          <!-- Volume Icon -->
          <button
            @click.stop="toggleMute"
            class="text-white hover:text-gray-300 transition"
          >
            <svg v-if="isMuted || volume === 0" class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38.31 2.81.48 4.25.48 1.74 0 3.36-.49 4.75-1.35l1.5 1.5L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z"/>
            </svg>
            <svg v-else-if="volume < 0.5" class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M18.5 12c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM5 9v6h4l5 5V4L9 9H5z"/>
            </svg>
            <svg v-else class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/>
            </svg>
          </button>
          
          <!-- Volume Slider -->
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            :value="volume"
            @input="handleVolumeChange"
            @click.stop
            class="w-24 h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer volume-slider"
          />
        </div>
      </div>
    </Transition>

    <!-- Click to Play/Pause (TikTok-like) - Overlay -->
    <div 
      class="absolute inset-0 z-[1] cursor-pointer"
      @click.stop="togglePlayPause"
    ></div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch, nextTick } from 'vue'
import Plyr from 'plyr'
import 'plyr/dist/plyr.css'

const props = defineProps({
  src: {
    type: String,
    required: true
  },
  currentEpisodeIndex: {
    type: Number,
    default: 0
  },
  totalEpisodes: {
    type: Number,
    required: true
  },
  currentEpisode: {
    type: Object,
    default: null
  },
  canGoNext: {
    type: Boolean,
    default: true
  },
  canGoPrevious: {
    type: Boolean,
    default: true
  },
  availableQualities: {
    type: Array,
    default: () => []
  },
  selectedQuality: {
    type: Number,
    default: 1080
  },
  initialTime: {
    type: Number,
    default: 0
  }
})

const emit = defineEmits(['next-episode', 'previous-episode', 'ended', 'timeupdate', 'quality-change', 'play', 'pause'])

const playerContainer = ref(null)
const videoElement = ref(null)
const playerWrapper = ref(null)
const player = ref(null)
const isPaused = ref(true)
const showSwipeIndicator = ref(true)
const swipeDirection = ref('up')
// Load volume from localStorage
const getStoredVolume = () => {
  if (process.client) {
    const stored = localStorage.getItem('dramaqu_volume')
    if (stored !== null) {
      return parseFloat(stored)
    }
  }
  return 1
}

const getStoredMuted = () => {
  if (process.client) {
    const stored = localStorage.getItem('dramaqu_muted')
    return stored === 'true'
  }
  return false
}

const volume = ref(getStoredVolume())
const isMuted = ref(getStoredMuted())
const showVolumeControl = ref(false)

// Swipe gesture handling
const touchStartY = ref(0)
const touchStartTime = ref(0)
const minSwipeDistance = 50
const maxSwipeTime = 500

const canGoNext = computed(() => props.canGoNext && props.currentEpisodeIndex < props.totalEpisodes - 1)
const canGoPrevious = computed(() => props.canGoPrevious && props.currentEpisodeIndex > 0)

// Initialize Plyr player
onMounted(async () => {
  await nextTick()
  
  if (!videoElement.value) {
    console.error('Video element not found')
    return
  }

  try {
    // Initialize Plyr with TikTok-like settings
    player.value = new Plyr(videoElement.value, {
      controls: [], // Hide all default controls
      autoplay: true,
      clickToPlay: false, // We handle click ourselves
      keyboard: {
        focused: true,
        global: false
      },
      fullscreen: {
        enabled: true,
        fallback: true,
        iosNative: false
      },
      ratio: null, // No fixed aspect ratio for portrait
      settings: [],
      speed: {
        selected: 1,
        options: [1]
      }
    })

    setupPlayer()
  } catch (error) {
    console.error('Error initializing Plyr player:', error)
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

  // Set initial volume and mute state from localStorage
  if (player.value) {
    player.value.volume = volume.value
    player.value.muted = isMuted.value
  }

  // Prevent looping by tracking if we just set the time
  let isSettingTime = false
  let hasSetInitialTime = false

  // Event listeners
  player.value.on('ready', () => {
    console.log('Plyr player ready')
    
    // Hide swipe indicator after 3 seconds
    setTimeout(() => {
      showSwipeIndicator.value = false
    }, 3000)
    
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
          player.value.play().catch(err => {
            console.log('Auto-play prevented:', err)
          })
        }
      }, 300)
    }
    
    if (videoElement.value.readyState >= 1) {
      // Metadata already loaded
      handleLoadedMetadata()
    } else {
      // Wait for metadata
      videoElement.value.addEventListener('loadedmetadata', handleLoadedMetadata, { once: true })
    }
  })

  player.value.on('ended', () => {
    emit('ended')
    // Auto-play next episode
    if (canGoNext.value) {
      setTimeout(() => {
        goToNextEpisode()
      }, 500)
    }
  })

  // Track seeking to prevent looping
  player.value.on('seeked', () => {
    isSettingTime = false
  })
  
  player.value.on('seeking', () => {
    isSettingTime = true
  })

  player.value.on('timeupdate', () => {
    if (player.value && !isSettingTime) {
      const currentTime = player.value.currentTime
      // Only emit if time is progressing normally (not looping)
      if (currentTime > 0.5) {
        emit('timeupdate', currentTime)
      }
    }
  })

  player.value.on('play', () => {
    isPaused.value = false
    showVolumeControl.value = false
    // Emit play event to parent
    emit('play')
  })

  player.value.on('pause', () => {
    isPaused.value = true
    // Emit pause event to parent
    emit('pause')
  })

  player.value.on('volumechange', () => {
    if (player.value) {
      volume.value = player.value.volume
      isMuted.value = player.value.muted
      // Save to localStorage
      if (process.client) {
        localStorage.setItem('dramaqu_volume', player.value.volume.toString())
        localStorage.setItem('dramaqu_muted', player.value.muted.toString())
      }
    }
  })
  
  // Set initial volume and mute state from localStorage
  if (player.value) {
    player.value.volume = volume.value
    player.value.muted = isMuted.value
  }

  // Keyboard shortcuts
  const handleKeyboard = (e) => {
    if (!player.value) return

    // Only handle if player is focused
    const isPlayerFocused = playerWrapper.value?.contains(document.activeElement) || 
                           !isPaused.value

    if (!isPlayerFocused) return

    switch (e.key) {
      case 'ArrowUp':
      case 'w':
      case 'W':
        e.preventDefault()
        if (canGoPrevious.value) {
          goToPreviousEpisode()
        }
        break
      case 'ArrowDown':
      case 's':
      case 'S':
        e.preventDefault()
        if (canGoNext.value) {
          goToNextEpisode()
        }
        break
      case 'ArrowLeft':
        e.preventDefault()
        if (player.value) {
          player.value.currentTime = Math.max(0, player.value.currentTime - 10)
        }
        break
      case 'ArrowRight':
        e.preventDefault()
        if (player.value) {
          player.value.currentTime = Math.min(player.value.duration, player.value.currentTime + 10)
        }
        break
      case ' ':
        if (!document.activeElement.matches('input, textarea, select')) {
          e.preventDefault()
          togglePlayPause()
        }
        break
      case 'f':
      case 'F':
        e.preventDefault()
        if (player.value) {
          if (player.value.fullscreen.active) {
            player.value.fullscreen.exit()
          } else {
            player.value.fullscreen.enter()
          }
        }
        break
      case 'm':
      case 'M':
        e.preventDefault()
        toggleMute()
        break
    }
  }

  document.addEventListener('keydown', handleKeyboard)

  // Cleanup keyboard listener on unmount
  onUnmounted(() => {
    document.removeEventListener('keydown', handleKeyboard)
  })
}

// Touch/Swipe handlers
const handleTouchStart = (e) => {
  touchStartY.value = e.touches[0].clientY
  touchStartTime.value = Date.now()
}

const handleTouchMove = (e) => {
  const currentY = e.touches[0].clientY
  const deltaY = touchStartY.value - currentY
  
  // Show swipe indicator if swiping
  if (Math.abs(deltaY) > 20) {
    if (deltaY > 0 && canGoNext.value) {
      // Swipe up - next episode
      showSwipeIndicator.value = true
      swipeDirection.value = 'up'
    } else if (deltaY < 0 && canGoPrevious.value) {
      // Swipe down - previous episode
      showSwipeIndicator.value = true
      swipeDirection.value = 'down'
    } else {
      showSwipeIndicator.value = false
    }
  } else {
    showSwipeIndicator.value = false
  }
}

const handleTouchEnd = (e) => {
  const endY = e.changedTouches[0].clientY
  const deltaY = touchStartY.value - endY
  const deltaTime = Date.now() - touchStartTime.value

  // Check if it's a valid swipe
  if (Math.abs(deltaY) > minSwipeDistance && deltaTime < maxSwipeTime) {
    if (deltaY > 0 && canGoNext.value) {
      // Swipe up - next episode
      goToNextEpisode()
    } else if (deltaY < 0 && canGoPrevious.value) {
      // Swipe down - previous episode
      goToPreviousEpisode()
    }
  }

  // Hide swipe indicator
  setTimeout(() => {
    showSwipeIndicator.value = false
  }, 300)
}

// Go to previous episode
const goToPreviousEpisode = () => {
  if (canGoPrevious.value) {
    player.value?.pause()
    emit('previous-episode')
  }
}

// Go to next episode
const goToNextEpisode = () => {
  if (canGoNext.value) {
    player.value?.pause()
    emit('next-episode')
  }
}

// Toggle play/pause
const togglePlayPause = () => {
  if (!player.value) return
  
  if (isPaused.value) {
    player.value.play().catch(err => {
      console.log('Play prevented:', err)
    })
  } else {
    player.value.pause()
  }
}

// Volume controls
const handleVolumeChange = (e) => {
  const newVolume = parseFloat(e.target.value)
  volume.value = newVolume
  if (player.value) {
    player.value.volume = newVolume
    player.value.muted = newVolume === 0
    isMuted.value = newVolume === 0
  }
  // Save to localStorage
  if (process.client) {
    localStorage.setItem('dramaqu_volume', newVolume.toString())
    localStorage.setItem('dramaqu_muted', (newVolume === 0).toString())
  }
}

const toggleMute = () => {
  if (!player.value) return
  player.value.muted = !player.value.muted
  isMuted.value = player.value.muted
  if (!player.value.muted && volume.value === 0) {
    volume.value = 0.5
    player.value.volume = 0.5
  }
  // Save to localStorage
  if (process.client) {
    localStorage.setItem('dramaqu_muted', player.value.muted.toString())
    if (!player.value.muted && volume.value === 0) {
      localStorage.setItem('dramaqu_volume', '0.5')
    }
  }
}

// Watch for source changes
watch(() => props.src, (newSrc) => {
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
            player.value.play().catch(err => {
              console.log('Auto-play prevented:', err)
            })
          }
        }, 300)
      }
      
      if (videoElement.value.readyState >= 1) {
        // Metadata already loaded
        handleLoadedMetadata()
      } else {
        // Wait for metadata
        videoElement.value.addEventListener('loadedmetadata', handleLoadedMetadata, { once: true })
      }
    } catch (err) {
      console.error('Error changing video source:', err)
    }
  }
})

// Watch for initialTime changes (only if > 5 seconds to avoid looping)
watch(() => props.initialTime, (newTime) => {
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
})

// Cleanup
onUnmounted(() => {
  if (player.value) {
    player.value.destroy()
    player.value = null
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
  isEnded: () => player.value?.ended || false
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

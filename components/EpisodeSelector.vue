<template>
  <div>
    <!-- Bottom Bar -->
    <div class="fixed bottom-0 left-0 right-0 z-[180] bg-gradient-to-t from-black via-black/95 to-transparent px-4 pt-4 pb-2">
      <!-- Drama Title and Caption - Always show, hide when playing -->
      <div
        v-if="(dramaTitle && dramaTitle.trim()) || (dramaCaption && dramaCaption.trim())"
        class="mb-6 pb-2"
      >
        <!-- Title -->
        <Transition name="fade">
          <h2
            v-if="dramaTitle && dramaTitle.trim() && !showOverlays"
            class="text-white font-bold text-lg mb-2"
          >
            {{ dramaTitle }}
          </h2>
        </Transition>

        <!-- Caption with Read More -->
        <Transition name="fade">
          <div
            v-if="dramaCaption && dramaCaption.trim() && !showOverlays"
            class="text-gray-300 text-sm"
          >
            <p :class="showFullCaption ? '' : 'line-clamp-2'">{{ dramaCaption }}</p>
            <button
              v-if="dramaCaption && dramaCaption.length > 100"
              @click="showFullCaption = !showFullCaption"
              class="text-red-500 hover:text-red-400 mt-1 text-xs font-medium transition"
            >
              {{ showFullCaption ? "Read less" : "Read more" }}
            </button>
          </div>
        </Transition>
      </div>

      <!-- Progress Bar (persis di bawah caption) -->
      <div
        v-if="!showOverlays"
        class="mb-3"
      >
        <div
          ref="progressBarRef"
          class="relative w-full h-0.5 bg-white/20 cursor-pointer"
          @mousedown="handleProgressDragStart"
          @touchstart.stop.prevent="handleProgressDragStart"
        >
          <div
            class="absolute left-0 top-0 h-full bg-white"
            :class="isDraggingProgress ? '' : 'transition-all duration-100'"
            :style="{ width: `${localPercentage}%` }"
          ></div>

          <!-- Draggable thumb (visible when dragging) -->
          <div
            v-if="isDraggingProgress"
            class="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full shadow-lg"
            :style="{ left: `${localPercentage}%`, transform: 'translate(-50%, -50%)' }"
          ></div>
        </div>
      </div>

      <div class="flex items-center justify-between">
        <!-- Current Episode Info -->
        <div class="flex items-center gap-3">
          <button
            @click="showPopup = !showPopup"
            class="flex items-center gap-2 bg-black/60 hover:bg-black/80 text-white px-4 py-2 rounded-lg transition"
          >
            <span class="text-sm font-medium">Episode {{ currentEpisodeIndex + 1 }}</span>
            <svg
              class="w-4 h-4 transition-transform"
              :class="showPopup ? 'rotate-180' : ''"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </button>
        </div>

        <!-- Total Episodes -->
        <div class="flex items-center gap-3">
          <div class="text-white text-sm opacity-75">{{ totalEpisodes }} Episodes</div>
        </div>
      </div>
    </div>

    <!-- Episode Popup -->
    <Transition name="slide-up">
      <div
        v-if="showPopup"
        class="fixed inset-0 z-[200] bg-black/95 flex flex-col"
        @click.self="showPopup = false"
      >
        <!-- Header -->
        <div class="flex items-center justify-between p-4 border-b border-gray-800">
          <h3 class="text-white text-lg font-semibold">Select Episode</h3>
          <button
            @click="showPopup = false"
            class="text-white hover:text-gray-300 transition"
          >
            <svg
              class="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        <!-- Episode Grid (Numbers Only - Compact) -->
        <div class="flex-1 overflow-y-auto p-4">
          <div class="grid grid-cols-8 sm:grid-cols-10 md:grid-cols-12 lg:grid-cols-15 gap-2">
            <button
              v-for="(episode, index) in episodes"
              :key="episode.chapterId || index"
              @click="selectEpisode(episode, index)"
              class="relative aspect-square bg-gray-800 rounded-lg transition-all hover:scale-105 flex items-center justify-center cursor-pointer"
              :class="currentEpisodeIndex === index ? 'ring-2 ring-red-600 bg-red-600 scale-105' : 'hover:ring-2 hover:ring-white/50 bg-gray-800'"
            >
              <!-- Episode Number Only -->
              <p class="text-white font-bold text-sm">{{ index + 1 }}</p>

              <!-- Current Episode Indicator -->
              <div
                v-if="currentEpisodeIndex === index"
                class="absolute -top-1 -right-1 bg-red-600 rounded-full w-5 h-5 flex items-center justify-center"
              >
                <svg
                  class="w-3 h-3 text-white"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fill-rule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clip-rule="evenodd"
                  />
                </svg>
              </div>
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup>
  import { ref, computed, watch } from "vue"

  const props = defineProps({
    episodes: {
      type: Array,
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
    isVIP: {
      type: Boolean,
      default: false,
    },
    dramaTitle: {
      type: String,
      default: "",
    },
    dramaCaption: {
      type: String,
      default: "",
    },
    isPlaying: {
      type: Boolean,
      default: false,
    },
    showOverlays: {
      type: Boolean,
      default: true,
    },
    progressData: {
      type: Object,
      default: () => ({ currentTime: 0, duration: 0, percentage: 0, isDragging: false }),
    },
  })

  const emit = defineEmits(["select-episode", "close", "toggle-overlays", "seek-video"])

  const showPopup = ref(false)
  const showFullCaption = ref(false)
  const progressBarRef = ref(null)
  const isDraggingProgress = ref(false)
  const localPercentage = ref(0)

  // Watch progressData untuk update local percentage
  watch(
    () => props.progressData.percentage,
    (newVal) => {
      if (!isDraggingProgress.value) {
        localPercentage.value = newVal
      }
    }
  )

  // Progress bar drag handlers
  const handleProgressDragStart = (e) => {
    if (!progressBarRef.value || !props.progressData.duration) return

    isDraggingProgress.value = true

    const handleDrag = (moveEvent) => {
      if (!progressBarRef.value) return

      moveEvent.preventDefault()

      const rect = progressBarRef.value.getBoundingClientRect()
      const clientX = moveEvent.touches ? moveEvent.touches[0].clientX : moveEvent.clientX
      const percent = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width))
      const newTime = percent * props.progressData.duration

      // Update local percentage for real-time visual feedback
      localPercentage.value = percent * 100

      emit("seek-video", newTime)
    }

    const handleDragEnd = () => {
      isDraggingProgress.value = false

      document.removeEventListener("mousemove", handleDrag)
      document.removeEventListener("mouseup", handleDragEnd)
      document.removeEventListener("touchmove", handleDrag)
      document.removeEventListener("touchend", handleDragEnd)
    }

    // Initial seek
    handleDrag(e)

    // Add listeners
    document.addEventListener("mousemove", handleDrag)
    document.addEventListener("mouseup", handleDragEnd)
    document.addEventListener("touchmove", handleDrag, { passive: false })
    document.addEventListener("touchend", handleDragEnd)
  }

  // Debug props
  watch(
    () => [props.dramaTitle, props.dramaCaption],
    ([title, caption]) => {
      console.log("EpisodeSelector props:", { title, caption, isPlaying: props.isPlaying })
    },
    { immediate: true }
  )

  // Watch isVIP prop changes and log
  watch(
    () => props.isVIP,
    (newVal, oldVal) => {
      console.log("EpisodeSelector isVIP changed:", { old: oldVal, new: newVal })
    },
    { immediate: true }
  )

  // Remove all VIP validation - sudah di-handle di overlay VIP
  const selectEpisode = (episode, index) => {
    emit("select-episode", episode, index)
    showPopup.value = false
  }
</script>

<style scoped>
  .slide-up-enter-active,
  .slide-up-leave-active {
    transition: all 0.3s ease;
  }

  .slide-up-enter-from {
    opacity: 0;
    transform: translateY(100%);
  }

  .slide-up-leave-to {
    opacity: 0;
    transform: translateY(100%);
  }

  /* Custom grid for more columns */
  @media (min-width: 1024px) {
    .grid-cols-15 {
      grid-template-columns: repeat(15, minmax(0, 1fr));
    }
  }
</style>

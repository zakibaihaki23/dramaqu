<template>
  <div class="w-full">
    <h3 class="text-xl font-bold text-white mb-4 px-4">{{ title }}</h3>
    <div class="flex gap-3 overflow-x-auto pb-4 scrollbar-hide px-4">
      <NuxtLink
        v-for="item in items"
        :key="item.dramaId"
        :to="`/detail/${item.dramaId}`"
        class="flex-shrink-0 w-32 rounded-lg overflow-hidden hover:scale-105 transition-transform cursor-pointer relative group"
      >
        <div class="relative w-32 h-48 bg-gray-900">
          <img
            v-if="item.dramaCover"
            :src="item.dramaCover"
            :alt="item.dramaName"
            class="w-full h-full object-cover"
            loading="lazy"
            @error="handleImageError"
          />
          <div
            v-else
            class="w-full h-full bg-gray-800 flex items-center justify-center"
          >
            <svg
              class="w-16 h-16 text-gray-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
          </div>
          <!-- Progress Bar -->
          <div class="absolute bottom-0 left-0 right-0 h-1 bg-gray-700">
            <div
              class="h-full bg-red-600"
              :style="{ width: `${((item.episodeIndex + 1) / item.totalEpisodes) * 100}%` }"
            />
          </div>
          <!-- Episode Info Overlay -->
          <div class="absolute top-2 right-2 bg-black/80 backdrop-blur-sm px-2 py-1 rounded text-xs">EP {{ item.episodeIndex + 1 }}/{{ item.totalEpisodes }}</div>
          <!-- Overlay with title on hover -->
          <div class="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-2">
            <p class="text-white text-xs font-semibold line-clamp-2">{{ item.dramaName }}</p>
            <p
              v-if="item.episodeName"
              class="text-gray-300 text-xs mt-1"
            >
              {{ item.episodeName }}
            </p>
          </div>
        </div>
      </NuxtLink>
    </div>
  </div>
</template>

<script setup>
  defineProps({
    title: {
      type: String,
      required: true,
    },
    items: {
      type: Array,
      default: () => [],
    },
  })

  const handleImageError = (event) => {
    console.warn("Continue watching image failed to load:", event.target.src, "for drama:", event.target.alt)
    // Hide the broken image
    event.target.style.display = "none"
  }
</script>

<style scoped>
  .scrollbar-hide {
    -ms-overflow-style: none;
    scrollbar-width: none;
  }
  .scrollbar-hide::-webkit-scrollbar {
    display: none;
  }
</style>

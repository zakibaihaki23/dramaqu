<template>
  <div class="w-full h-64 md:h-96 bg-gradient-to-b from-gray-900 to-black rounded-lg overflow-hidden relative">
    <!-- Blurred Background Image -->
    <div
      v-if="drama?.bookCover || drama?.coverWap || drama?.image || drama?.poster"
      class="absolute inset-0"
    >
      <img
        :src="drama?.bookCover || drama?.coverWap || drama?.image || drama?.poster"
        :alt="drama?.bookName || drama?.title"
        class="w-full h-full object-cover blur-xl scale-110 opacity-40"
      >
    </div>

    <!-- Main Image (Portrait - Centered and Contained) -->
    <div class="absolute inset-0 flex items-center justify-center">
      <img
        v-if="drama?.bookCover || drama?.coverWap || drama?.image || drama?.poster"
        :src="drama?.bookCover || drama?.coverWap || drama?.image || drama?.poster"
        :alt="drama?.bookName || drama?.title"
        class="h-full object-contain"
      >
      <div
        v-else
        class="w-full h-full bg-gray-700 flex items-center justify-center"
      >
        <span class="text-gray-400">No Image</span>
      </div>
    </div>

    <!-- Gradient Overlay with Content -->
    <div class="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent flex flex-col justify-end p-4">
      <h2 class="text-xl font-bold text-white mb-2 drop-shadow-lg">{{ drama?.bookName || drama?.title }}</h2>
      <p class="text-gray-200 text-sm line-clamp-2 drop-shadow-md">{{ drama?.introduction || drama?.description || drama?.synopsis }}</p>
      <div
        v-if="drama?.tags"
        class="flex gap-2 mt-2 flex-wrap"
      >
        <span
          v-for="(tag, idx) in drama.tags.slice(0, 3)"
          :key="idx"
          class="text-xs bg-gray-800/80 backdrop-blur-sm px-2 py-1 rounded"
        >
          {{ tag }}
        </span>
      </div>
      <NuxtLink
        :to="`/detail/${drama?.bookId || drama?.id}`"
        class="mt-3 bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded inline-block w-full text-center transition shadow-lg"
      >
        Play Now
      </NuxtLink>
    </div>
  </div>
</template>

<script setup>
  defineProps({
    drama: {
      type: Object,
      default: () => ({}),
    },
  })
</script>

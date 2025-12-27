<template>
  <div class="w-full">
    <h3 class="text-xl font-bold text-white mb-4 px-4">{{ title }}</h3>
    <div class="flex gap-3 overflow-x-auto pb-4 scrollbar-hide px-4">
      <NuxtLink
        v-for="drama in dramas"
        :key="drama.bookId || drama.id"
        :to="`/detail/${drama.bookId || drama.id}`"
        class="flex-shrink-0 w-32 h-48 rounded-lg overflow-hidden hover:scale-105 transition-transform cursor-pointer relative group"
      >
        <img
          :src="drama.bookCover || drama.coverWap || drama.image || drama.poster"
          :alt="drama.bookName || drama.title"
          class="w-full h-full object-cover"
          loading="lazy"
        >
        <!-- Overlay with title -->
        <div class="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-2">
          <p class="text-white text-xs font-semibold line-clamp-2">{{ drama.bookName || drama.title }}</p>
          <p
            v-if="drama.playCount"
            class="text-gray-300 text-xs mt-1"
          >
            {{ drama.playCount }}
          </p>
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
    dramas: {
      type: Array,
      default: () => [],
    },
  })
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

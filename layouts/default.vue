<template>
  <div class="min-h-screen bg-black text-white">
    <main class="flex-1">
      <slot />
    </main>
    <!-- FAB Search Button (Hide on detail page) -->
    <button
      v-if="!isDetailPage"
      class="fixed bottom-6 right-6 z-[100] bg-red-600 hover:bg-red-700 text-white rounded-full p-4 shadow-2xl transition-all hover:scale-110 flex items-center justify-center ring-2 ring-red-500/50 w-14 h-14"
      @click="showSearch = true"
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
          d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
        />
      </svg>
    </button>
    <SearchPopup v-model:show="showSearch" />
  </div>
</template>

<script setup>
  import { ref, computed } from "vue"

  const route = useRoute()
  const showSearch = ref(false)
  
  // Hide FAB on detail page
  const isDetailPage = computed(() => {
    if (import.meta.client) {
      return route.path.startsWith('/detail/')
    }
    return false
  })
</script>

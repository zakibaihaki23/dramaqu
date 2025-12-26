<template>
  <div>
    <!-- Floating Bottom Navigation -->
    <nav
      class="fixed bottom-0 left-0 right-0 z-40 bg-gray-800/95 border-t-2 border-red-600/30 flex justify-around items-center h-16 shadow-2xl backdrop-blur-lg transition-transform duration-300"
      :class="isVisible ? 'translate-y-0' : 'translate-y-full'"
    >
      <NuxtLink
        to="/"
        class="flex flex-col items-center justify-center flex-1 h-full text-xs font-medium transition-all"
        :class="isActive('/') ? 'text-red-500 bg-red-500/20 border-t-2 border-red-500' : 'text-gray-200 hover:text-white hover:bg-gray-700'"
      >
        <svg
          class="w-6 h-6 mb-1"
          fill="currentColor"
          viewBox="0 0 24 24"
        >
          <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V20a2 2 0 002 2h12a2 2 0 002-2v-9.586l.707.707a1 1 0 001.414-1.414l-7-7z"></path>
        </svg>
        <span>Home</span>
      </NuxtLink>

      <NuxtLink
        to="/search"
        class="flex flex-col items-center justify-center flex-1 h-full text-xs font-medium transition-all"
        :class="isActive('/search') ? 'text-red-500 bg-red-500/20 border-t-2 border-red-500' : 'text-gray-200 hover:text-white hover:bg-gray-700'"
      >
        <svg
          class="w-6 h-6 mb-1"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          ></path>
        </svg>
        <span>Search</span>
      </NuxtLink>

      <button
        @click="toggleFavorites"
        class="flex flex-col items-center justify-center flex-1 h-full text-xs font-medium transition-all"
        :class="showFavorites ? 'text-red-500 bg-red-500/20 border-t-2 border-red-500' : 'text-gray-200 hover:text-white hover:bg-gray-700'"
      >
        <svg
          class="w-6 h-6 mb-1"
          :fill="showFavorites ? 'currentColor' : 'none'"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
          ></path>
        </svg>
        <span>Favorites</span>
      </button>
    </nav>
  </div>
</template>

<script setup>
  import { ref, onMounted, onUnmounted } from "vue"

  const route = useRoute()
  const showFavorites = ref(false)
  const isVisible = ref(true)
  let lastScrollY = 0
  let scrollTimeout = null

  const isActive = (path) => {
    return route.path === path || route.path.startsWith(path + "/")
  }

  const toggleFavorites = () => {
    showFavorites.value = !showFavorites.value
    // TODO: Implement favorites view
  }

  const handleScroll = () => {
    const currentScrollY = window.scrollY

    // Clear previous timeout
    if (scrollTimeout) {
      clearTimeout(scrollTimeout)
    }

    // Hide when scrolling down, show when scrolling up
    if (currentScrollY > lastScrollY && currentScrollY > 100) {
      isVisible.value = false
    } else {
      isVisible.value = true
    }

    lastScrollY = currentScrollY

    // Show navigation after 2 seconds of no scrolling
    scrollTimeout = setTimeout(() => {
      isVisible.value = true
    }, 2000)
  }

  onMounted(() => {
    window.addEventListener("scroll", handleScroll, { passive: true })
  })

  onUnmounted(() => {
    window.removeEventListener("scroll", handleScroll)
    if (scrollTimeout) {
      clearTimeout(scrollTimeout)
    }
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

  .slide-up-enter-active,
  .slide-up-leave-active {
    transition: all 0.3s ease;
  }

  .slide-up-enter-from {
    opacity: 0;
  }

  .slide-up-enter-from .absolute {
    transform: translateY(100%);
  }

  .slide-up-leave-to {
    opacity: 0;
  }

  .slide-up-leave-to .absolute {
    transform: translateY(100%);
  }
</style>

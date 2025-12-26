<template>
  <div class="bg-black text-white min-h-screen">
    <!-- Search Input -->
    <div class="sticky top-16 z-40 bg-black border-b border-gray-800 px-4 py-4">
      <input
        v-model="searchQuery"
        @keyup.enter="handleSearch"
        type="text"
        placeholder="Search drama..."
        class="w-full bg-gray-800 text-white px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-600"
        autofocus
      />
    </div>

    <!-- Loading State -->
    <LoadingSpinner
      :show="loading"
      text="Searching..."
    />

    <!-- No Results -->
    <div
      v-if="!loading && searchPerformed && results.length === 0"
      class="px-4 py-8 text-center"
    >
      <p class="text-gray-400">No results found for "{{ searchQuery }}"</p>
    </div>

    <!-- Results Grid -->
    <div
      v-if="!loading && results.length > 0"
      class="px-4 py-6"
    >
      <p class="text-gray-400 mb-4">Found {{ results.length }} result(s)</p>
      <div class="grid grid-cols-2 gap-4">
        <NuxtLink
          v-for="drama in results"
          :key="drama.bookId || drama.id"
          :to="`/detail/${drama.bookId || drama.id}`"
          class="relative group overflow-hidden rounded-lg"
        >
          <img
            :src="drama?.bookCover || drama?.coverWap || drama?.image || drama?.poster"
            :alt="drama?.bookName || drama?.title"
            class="w-full h-64 object-cover group-hover:scale-110 transition-transform"
          />
          <div class="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent flex flex-col justify-end p-3 group-hover:opacity-100">
            <p class="text-white text-sm font-semibold line-clamp-2">{{ drama?.bookName || drama?.title }}</p>
            <p
              v-if="drama?.playCount"
              class="text-gray-300 text-xs mt-1"
            >
              {{ drama.playCount }}
            </p>
          </div>
        </NuxtLink>
      </div>
    </div>

    <!-- Initial State -->
    <div
      v-if="!searchPerformed"
      class="px-4 py-8 text-center"
    >
      <p class="text-gray-400">Enter a search term to find dramas</p>
    </div>
  </div>
</template>

<script setup>
  import { ref, onMounted } from "vue"
  import axios from "axios"

  const route = useRoute()
  const searchQuery = ref("")
  const results = ref([])
  const loading = ref(false)
  const searchPerformed = ref(false)

  // Menggunakan proxy lokal untuk mengatasi CORS
  const BASE_URL = "/api"

  const handleSearch = async () => {
    if (!searchQuery.value.trim()) return

    loading.value = true
    searchPerformed.value = true

    try {
      const response = await axios.get(`${BASE_URL}/dramabox/search`, {
        params: { query: searchQuery.value },
      })

      results.value = response.data?.data || response.data || []

      // Ensure it's an array
      if (!Array.isArray(results.value)) {
        results.value = [results.value]
      }

      console.log("Search results:", results.value.length)
    } catch (err) {
      console.error("Error searching:", err)
      results.value = []
    } finally {
      loading.value = false
    }
  }

  onMounted(() => {
    const q = route.query.q
    if (q) {
      searchQuery.value = q
      handleSearch()
    }
  })

  definePageMeta({
    layout: "default",
  })
</script>

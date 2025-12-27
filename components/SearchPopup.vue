<template>
  <!-- Search Popup -->
  <Transition name="fade">
    <div
      v-if="showSearch"
      class="fixed inset-0 z-50 bg-gray-900"
      @click="closeSearch"
    >
      <div
        class="h-full w-full flex flex-col bg-gray-900"
        @click.stop
      >
        <!-- Search Header -->
        <div class="px-4 py-4 border-b border-gray-800">
          <div class="flex items-center gap-3 mb-3">
            <button
              class="p-2 hover:bg-gray-800 rounded-lg transition text-gray-400 hover:text-white"
              title="Close"
              @click="closeSearch"
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
            <h2 class="text-xl font-bold text-white">Search</h2>
          </div>
          <div class="relative">
            <input
              ref="searchInput"
              v-model="searchQuery"
              type="text"
              placeholder="Search drama, actor..."
              class="w-full bg-gray-800 text-white px-4 py-3 pl-12 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-600"
              @input="handleSearchInput"
            />
            <svg
              class="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400"
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
            <button
              v-if="searchQuery"
              class="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
              @click="clearSearch"
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
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        </div>

        <!-- Search Results -->
        <div class="flex-1 overflow-y-auto px-4 py-4 custom-scrollbar">
          <!-- Loading -->
          <div
            v-if="searching"
            class="py-8 text-center"
          >
            <div class="inline-block w-8 h-8 border-4 border-gray-700 border-t-red-600 rounded-full animate-spin" />
            <p class="text-gray-400 mt-2">Searching...</p>
          </div>

          <!-- No Results -->
          <div
            v-else-if="searchPerformed && results.length === 0"
            class="py-8 text-center"
          >
            <p class="text-gray-400">No results found for "{{ searchQuery }}"</p>
          </div>

          <!-- Results Grid -->
          <div
            v-else-if="results.length > 0"
            class="space-y-2"
          >
            <p class="text-gray-400 text-sm mb-3">Found {{ results.length }} result(s)</p>

            <!-- Drama Results -->
            <div
              v-for="item in results"
              :key="item.bookId || item.id || item.performerId || item.id"
              class="flex gap-3 p-3 bg-gray-800 hover:bg-gray-700 rounded-lg transition"
            >
              <!-- Actor Type -->
              <template v-if="item.type === 'actor'">
                <div class="flex gap-3 w-full">
                  <img
                    :src="item.performerAvatar || item.cover"
                    :alt="item.performerName"
                    class="w-16 h-16 object-cover rounded-full"
                  />
                  <div class="flex-1 min-w-0">
                    <p class="text-white font-medium line-clamp-2">{{ item.performerName }}</p>
                    <p class="text-gray-400 text-sm mt-1">🎭 {{ item.videoCountText || `${item.videoCount} Film` }}</p>
                  </div>
                </div>
              </template>

              <!-- Drama Type or Default -->
              <template v-else>
                <NuxtLink
                  :to="`/detail/${item.bookId || item.id}`"
                  class="flex gap-3 w-full"
                  @click="closeSearch"
                >
                  <img
                    :src="item?.bookCover || item?.coverWap || item?.image || item?.poster || item?.cover"
                    :alt="item?.bookName || item?.title"
                    class="w-20 h-28 object-cover rounded flex-shrink-0"
                  />
                  <div class="flex-1 min-w-0 flex flex-col gap-1">
                    <p class="text-white font-medium line-clamp-1">{{ item?.bookName || item?.title }}</p>

                    <!-- Introduction -->
                    <p
                      v-if="item?.introduction"
                      class="text-gray-400 text-xs line-clamp-2 mt-1"
                    >
                      {{ item.introduction }}
                    </p>

                    <!-- Protagonist -->
                    <p
                      v-if="item?.protagonist"
                      class="text-gray-400 text-xs mt-1"
                    >
                      <span class="text-gray-500">Protagonist:</span>
                      {{ item.protagonist }}
                    </p>

                    <!-- TagsName -->
                    <div
                      v-if="item?.tagNames && Array.isArray(item.tagNames) && item.tagNames.length > 0"
                      class="flex gap-1 mt-1 flex-wrap"
                    >
                      <span
                        v-for="(tagName, idx) in item.tagNames"
                        :key="idx"
                        class="text-xs bg-gray-700/50 px-2 py-0.5 rounded text-gray-300"
                      >
                        {{ tagName }}
                      </span>
                    </div>

                    <!-- Stats -->
                    <div class="flex gap-2 text-xs text-gray-500 mt-1 flex-wrap">
                      <span v-if="item?.totalChapterNum">📺 {{ item.totalChapterNum }} Episodes</span>
                    </div>
                  </div>
                </NuxtLink>
              </template>
            </div>
          </div>

          <!-- Initial State -->
          <div
            v-else
            class="py-8 text-center"
          >
            <p class="text-gray-400">Type to search dramas...</p>
          </div>
        </div>
      </div>
    </div>
  </Transition>
</template>

<script setup>
  import { ref, watch, nextTick, computed } from "vue"
  import axios from "axios"

  const props = defineProps({
    show: {
      type: Boolean,
      default: false,
    },
  })

  const emit = defineEmits(["update:show", "close"])

  const searchQuery = ref("")
  const results = ref([])
  const searching = ref(false)
  const searchPerformed = ref(false)
  const searchInput = ref(null)
  let searchTimeout = null

  const BASE_URL = "/api"

  const showSearch = computed({
    get: () => props.show,
    set: (value) => emit("update:show", value),
  })

  const closeSearch = () => {
    showSearch.value = false
    emit("close")
    searchQuery.value = ""
    results.value = []
    searchPerformed.value = false
  }

  const clearSearch = () => {
    searchQuery.value = ""
    results.value = []
    searchPerformed.value = false
  }

  const performSearch = async () => {
    if (!searchQuery.value.trim()) {
      results.value = []
      searchPerformed.value = false
      return
    }

    searching.value = true
    searchPerformed.value = true

    try {
      const response = await axios.get(`${BASE_URL}/dramabox/search`, {
        params: { query: searchQuery.value },
      })

      let searchResults = response.data?.data || response.data || []

      // Ensure it's an array
      if (!Array.isArray(searchResults)) {
        searchResults = [searchResults]
      }

      // Enrich drama results with full details (including tags) from foryou endpoint
      const dramaResults = searchResults.filter((item) => item.type !== "actor" && (item.bookId || item.id))

      if (dramaResults.length > 0) {
        try {
          // Fetch all dramas from foryou to get full details including tags
          const forYouResponse = await axios.get(`${BASE_URL}/dramabox/foryou`)
          const allDramas = forYouResponse.data?.data || forYouResponse.data || []
          const dramasArray = Array.isArray(allDramas) ? allDramas : [allDramas]

          // Enrich search results with full drama details
          searchResults = searchResults.map((item) => {
            if (item.type === "actor") {
              return item // Keep actor results as is
            }

            // Find matching drama in foryou data
            const dramaId = item.bookId || item.id
            const fullDrama = dramasArray.find((d) => (d.bookId || d.id) == dramaId)

            if (fullDrama) {
              // Merge search result with full drama details, prioritizing fullDrama data
              return {
                ...fullDrama,
                ...item,
                // Ensure we keep the IDs from search result
                bookId: item.bookId || fullDrama.bookId,
                id: item.id || fullDrama.id,
                // Ensure tagsName and other fields from fullDrama are preserved
                tagNames: fullDrama.tagNames || item.tagNames,
                introduction: fullDrama.introduction || item.introduction,
                protagonist: fullDrama.protagonist || item.protagonist,
              }
            }

            return item
          })
        } catch (err) {
          console.error("Error enriching search results:", err)
          // Continue with original results if enrichment fails
        }
      }

      results.value = searchResults

      console.log("Search results:", results.value.length)
    } catch (err) {
      console.error("Error searching:", err)
      results.value = []
    } finally {
      searching.value = false
    }
  }

  const handleSearchInput = () => {
    // Clear previous timeout
    if (searchTimeout) {
      clearTimeout(searchTimeout)
    }

    // Set new timeout for debounce (500ms)
    searchTimeout = setTimeout(() => {
      performSearch()
    }, 500)
  }

  watch(
    () => props.show,
    (newVal) => {
      if (newVal) {
        nextTick(() => {
          searchInput.value?.focus()
        })
      } else {
        searchQuery.value = ""
        results.value = []
        searchPerformed.value = false
      }
    }
  )
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

  .fade-enter-active,
  .fade-leave-active {
    transition: opacity 0.3s ease;
  }

  .fade-enter-from,
  .fade-leave-to {
    opacity: 0;
  }
</style>

<template>
  <div class="bg-black text-white min-h-screen">
    <!-- Hero Banner -->
    <section
      v-if="topPicks.length > 0"
      class="px-4 pt-4 pb-6"
    >
      <BannerHero :drama="topPicks[0]" />
    </section>

    <!-- Continue Watching Section -->
    <section
      v-if="continueWatching.length > 0"
      class="px-4 pb-6"
    >
      <h2 class="text-2xl font-bold mb-4">Continue Watching</h2>
      <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        <NuxtLink
          v-for="item in continueWatching"
          :key="item.dramaId"
          :to="`/detail/${item.dramaId}`"
          class="group relative"
        >
          <div class="relative overflow-hidden rounded-lg bg-gray-900">
            <img
              :src="item.dramaCover"
              :alt="item.dramaName"
              class="w-full h-64 object-cover group-hover:scale-110 transition-transform duration-300"
            />
            <!-- Progress Bar -->
            <div class="absolute bottom-0 left-0 right-0 h-1 bg-gray-700">
              <div
                class="h-full bg-red-600"
                :style="{ width: `${((item.episodeIndex + 1) / item.totalEpisodes) * 100}%` }"
              ></div>
            </div>
            <!-- Episode Info Overlay -->
            <div class="absolute top-2 right-2 bg-black/80 backdrop-blur-sm px-2 py-1 rounded text-xs">
              EP {{ item.episodeIndex + 1 }}/{{ item.totalEpisodes }}
            </div>
          </div>
          <p class="text-white text-sm font-medium mt-2 line-clamp-2">{{ item.dramaName }}</p>
          <p class="text-gray-400 text-xs">{{ item.episodeName }}</p>
        </NuxtLink>
      </div>
    </section>

    <!-- Loading State -->
    <LoadingSpinner
      :show="loading"
      text="Loading content..."
    />

    <!-- Error State -->
    <div
      v-if="error"
      class="px-4 py-4 bg-red-900 bg-opacity-50 text-red-200 rounded-lg m-4"
    >
      {{ error }}
    </div>

    <!-- Main Content -->
    <div
      v-if="!loading"
      class="space-y-8 px-4"
    >
      <!-- For You Section -->
      <section v-if="forYou.length > 0">
        <DramaCarousel
          title="For You"
          :dramas="forYou"
        />
      </section>

      <!-- Latest Drama Section -->
      <section v-if="latest.length > 0">
        <DramaCarousel
          title="Latest Drama"
          :dramas="latest"
        />
      </section>

      <!-- Trending Section -->
      <section v-if="trending.length > 0">
        <DramaCarousel
          title="Trending Now"
          :dramas="trending"
        />
      </section>

      <!-- Random Section -->
      <section v-if="random.length > 0">
        <DramaCarousel
          title="Random Pick"
          :dramas="random"
        />
      </section>
    </div>
  </div>
</template>

<script setup>
  import { ref, onMounted } from "vue"
  import axios from "axios"

  const loading = ref(true)
  const error = ref(null)
  const topPicks = ref([])
  const forYou = ref([])
  const latest = ref([])
  const trending = ref([])
  const random = ref([])
  const continueWatching = ref([])

  const BASE_URL = "/api"
  const { getWatchHistory } = useWatchHistory()

  const fetchData = async () => {
    loading.value = true
    error.value = null

    try {
      const [forYouRes, latestRes, trendingRes, randomRes] = await Promise.all([axios.get(`${BASE_URL}/dramabox/foryou`), axios.get(`${BASE_URL}/dramabox/latest`), axios.get(`${BASE_URL}/dramabox/trending`), axios.get(`${BASE_URL}/dramabox/randomdrama`)])

      // Handle different response formats
      forYou.value = forYouRes.data?.data || forYouRes.data || []
      latest.value = latestRes.data?.data || latestRes.data || []
      trending.value = trendingRes.data?.data || trendingRes.data || []
      random.value = randomRes.data?.data || randomRes.data || []

      // Ensure we have arrays
      if (!Array.isArray(forYou.value)) forYou.value = [forYou.value]
      if (!Array.isArray(latest.value)) latest.value = [latest.value]
      if (!Array.isArray(trending.value)) trending.value = [trending.value]
      if (!Array.isArray(random.value)) random.value = [random.value]

      // Set top picks from for you (first drama)
      topPicks.value = forYou.value.slice(0, 1)

      // Load watch history and enrich with total episodes
      const history = getWatchHistory().slice(0, 8)
      
      // Enrich history with total episodes from drama data
      for (const item of history) {
        // Try to find drama in fetched data to get total episodes
        const dramaData = [...forYou.value, ...latest.value, ...trending.value, ...random.value].find(
          (d) => (d.bookId || d.id) == item.dramaId
        )
        
        if (dramaData && dramaData.totalChapterNum) {
          item.totalEpisodes = dramaData.totalChapterNum
        } else if (!item.totalEpisodes || item.totalEpisodes === 0) {
          // If still no total episodes, try to fetch from API
          try {
            const episodeRes = await axios.get(`${BASE_URL}/dramabox/allepisode`, {
              params: { bookId: item.dramaId },
            })
            const episodesData = episodeRes.data?.data || episodeRes.data || []
            item.totalEpisodes = Array.isArray(episodesData) ? episodesData.length : 1
          } catch (err) {
            // If fetch fails, use episodes.length from history or default to 1
            item.totalEpisodes = item.totalEpisodes || 1
          }
        }
      }
      
      continueWatching.value = history

      console.log("Data loaded:", { forYou: forYou.value.length, latest: latest.value.length, trending: trending.value.length, random: random.value.length, continueWatching: continueWatching.value.length })
    } catch (err) {
      error.value = "Failed to load content. Please try again later."
      console.error("Error fetching data:", err)
    } finally {
      loading.value = false
    }
  }

  onMounted(() => {
    fetchData()
  })

  definePageMeta({
    layout: "default",
  })
</script>

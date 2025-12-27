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
      class="pb-6"
    >
      <ContinueWatchingCarousel
        title="Continue Watching"
        :items="continueWatching"
      />
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
      let history = getWatchHistory().slice(0, 8)
      console.log("Raw watch history:", history)

      // Enrich history with total episodes and cover from drama data
      for (const item of history) {
        console.log("Processing watch history item:", item.dramaName, "ID:", item.dramaId, "episode:", item.episodeIndex, "time:", item.currentTime)
        // Try to find drama in fetched data to get total episodes and cover
        const dramaData = [...forYou.value, ...latest.value, ...trending.value, ...random.value].find((d) => (d.bookId || d.id) == item.dramaId)

        if (dramaData) {
          console.log("Found drama data for", item.dramaName, "- totalEpisodes:", dramaData.totalChapterNum)
          // Update total episodes
          if (dramaData.totalChapterNum) {
            item.totalEpisodes = dramaData.totalChapterNum
          }
          // Update cover if missing
          if (!item.dramaCover || item.dramaCover === "") {
            let coverUrl = dramaData.bookCover || dramaData.coverWap || dramaData.image || dramaData.poster || dramaData.cover || ""

            // If cover URL is relative (doesn't start with http), add base URL
            if (coverUrl && !coverUrl.startsWith("http")) {
              coverUrl = `https://dramabox.sansekai.my.id${coverUrl.startsWith("/") ? "" : "/"}${coverUrl}`
            }

            item.dramaCover = coverUrl
            console.log("Updated cover for", item.dramaName, ":", item.dramaCover, "from dramaData:", {
              bookCover: dramaData.bookCover,
              coverWap: dramaData.coverWap,
              image: dramaData.image,
              poster: dramaData.poster,
              cover: dramaData.cover,
            })
          }
          // Update name if missing
          if (!item.dramaName || item.dramaName === "") {
            item.dramaName = dramaData.bookName || dramaData.title || ""
          }
        } else if (!item.totalEpisodes || item.totalEpisodes === 0) {
          // If still no total episodes, try to fetch from API
          try {
            const episodeRes = await axios.get(`${BASE_URL}/dramabox/allepisode`, {
              params: { bookId: item.dramaId },
            })
            const episodesData = episodeRes.data?.data || episodeRes.data || []
            item.totalEpisodes = Array.isArray(episodesData) ? episodesData.length : 1
          } catch {
            // If fetch fails, use episodes.length from history or default to 1
            item.totalEpisodes = item.totalEpisodes || 1
          }
        } else {
          console.log("Drama data NOT found for", item.dramaName, "ID:", item.dramaId, "- will try API fetch")
        }
      }

      // Filter out dramas that are fully watched (current episode index + 1 >= total episodes)
      history = history.filter((item) => {
        const isFullyWatched = item.episodeIndex + 1 >= item.totalEpisodes
        console.log("Checking filter for", item.dramaName, "- episode:", item.episodeIndex + 1, "/", item.totalEpisodes, "- fully watched:", isFullyWatched)
        if (isFullyWatched) {
          console.log("Removing fully watched drama from continue watching:", item.dramaName, `(Episode ${item.episodeIndex + 1}/${item.totalEpisodes})`)
        }
        return !isFullyWatched
      })

      console.log("After filtering, continue watching items:", history.length)

      // Limit to 8 items after filtering
      history = history.slice(0, 8)

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

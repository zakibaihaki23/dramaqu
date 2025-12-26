<template>
  <header class="sticky top-0 z-50 bg-black border-b border-gray-800">
    <div class="px-4 py-3 flex items-center justify-between">
      <NuxtLink
        to="/"
        class="text-2xl font-bold text-red-600"
      >
        DramaQu
      </NuxtLink>
      <button
        @click="showSearch = true"
        class="p-2 hover:bg-gray-800 rounded-lg transition text-red-600 hover:text-red-500"
        title="Search"
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
          ></path>
        </svg>
      </button>
    </div>
    <SearchPopup v-model:show="showSearch" />
  </header>
</template>

<script setup>
  import { ref } from "vue"

  const showSearch = ref(false)
</script>

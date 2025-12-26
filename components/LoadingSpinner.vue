<template>
  <div
    v-if="show"
    class="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-sm"
  >
    <div class="flex flex-col items-center gap-3 bg-gray-900/90 px-4 py-3 rounded-lg">
      <!-- Spinner -->
      <div class="inline-block w-8 h-8 border-4 border-gray-700 border-t-red-600 rounded-full animate-spin"></div>
      <!-- Text -->
      <p
        v-if="text"
        class="text-gray-400 text-sm"
      >
        {{ text }}
      </p>
    </div>
  </div>
</template>

<script setup>
  defineProps({
    show: {
      type: Boolean,
      default: false,
    },
    text: {
      type: String,
      default: "Loading...",
    },
  })
</script>

<template>
  <Transition name="fade">
    <div
      v-if="show"
      class="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-sm"
      @click.self="handleClose"
    >
      <div
        class="bg-gray-900 rounded-lg p-6 w-full max-w-md mx-4 border border-gray-800"
        @click.stop
      >
        <!-- Header -->
        <div class="flex items-center justify-between mb-4">
          <h2 class="text-xl font-bold text-white">VIP Access Required</h2>
          <button
            v-if="!forceInput"
            @click="handleClose"
            class="text-gray-400 hover:text-white transition"
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
              ></path>
            </svg>
          </button>
        </div>

        <!-- Message -->
        <p class="text-gray-400 text-sm mb-4">
          Enter your VIP code to access full content including episodes, quality selection, and video playback.
        </p>

        <!-- Input -->
        <div class="space-y-4">
          <div class="relative">
            <input
              ref="codeInput"
              v-model="code"
              type="text"
              placeholder="Enter VIP code"
              class="w-full bg-gray-800 text-white px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-600"
              @keyup.enter="handleSubmit"
              :disabled="validating"
            />
          </div>

          <!-- Error Message -->
          <div
            v-if="error"
            class="bg-red-900/50 border border-red-700 text-red-200 px-4 py-2 rounded text-sm"
          >
            {{ error }}
          </div>

          <!-- Success Message -->
          <div
            v-if="success"
            class="bg-green-900/50 border border-green-700 text-green-200 px-4 py-2 rounded text-sm"
          >
            {{ success }}
          </div>

          <!-- Submit Button -->
          <button
            @click="handleSubmit"
            :disabled="validating || !code.trim()"
            class="w-full bg-red-600 hover:bg-red-700 text-white font-medium py-3 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span v-if="validating">Validating...</span>
            <span v-else>Activate VIP</span>
          </button>
        </div>
      </div>
    </div>
  </Transition>
</template>

<script setup>
  import { ref, watch, nextTick } from "vue"

  const props = defineProps({
    show: {
      type: Boolean,
      default: false,
    },
    forceInput: {
      type: Boolean,
      default: false, // If true, user cannot close without entering code
    },
  })

  const emit = defineEmits(["update:show", "close", "activated"])

  const { validateCode } = useVIP()
  const code = ref("")
  const error = ref("")
  const success = ref("")
  const validating = ref(false)
  const codeInput = ref(null)

  const showModal = computed({
    get: () => props.show,
    set: (value) => emit("update:show", value),
  })

  const handleClose = () => {
    if (!props.forceInput) {
      showModal.value = false
      emit("close")
    }
  }

  const handleSubmit = async () => {
    if (!code.value.trim() || validating.value) return

    error.value = ""
    success.value = ""
    validating.value = true

    try {
      const result = await validateCode(code.value)

      if (result.valid) {
        success.value = result.message || "VIP access activated!"
        code.value = ""
        
        // Wait a bit then close and emit activated
        setTimeout(() => {
          showModal.value = false
          emit("activated")
        }, 1500)
      } else {
        error.value = result.message || "Invalid code. Please try again."
      }
    } catch (err) {
      error.value = "Error validating code. Please try again."
      console.error("Validation error:", err)
    } finally {
      validating.value = false
    }
  }

  watch(() => props.show, (newVal) => {
    if (newVal) {
      code.value = ""
      error.value = ""
      success.value = ""
      nextTick(() => {
        codeInput.value?.focus()
      })
    }
  })
</script>

<style scoped>
  .fade-enter-active,
  .fade-leave-active {
    transition: opacity 0.3s ease;
  }

  .fade-enter-from,
  .fade-leave-to {
    opacity: 0;
  }
</style>


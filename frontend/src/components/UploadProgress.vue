<template>
  <transition name="fade">
    <div
      v-if="progress.visible"
      class="fixed bottom-4 right-4 bg-white text-gray-800 shadow-md rounded-md p-4 w-64 z-50"
    >
      <button
        v-if="progress.current >= progress.total"
        @click="progress.close"
        class="absolute top-1 right-1 text-gray-400 hover:text-black text-sm"
      >
        ✕
      </button>
      <div class="text-sm mb-1">
        <span v-if="progress.type === 'sector'">Сектор</span>
        <span v-else-if="progress.type === 'bonus'">Бонус</span>
        <span v-else></span>
        {{ progress.current }} / {{ progress.total }}
      </div>
      <div class="text-xs text-gray-500 mb-2">{{ progress.title }}</div>
      <div class="w-full bg-gray-200 h-2 rounded">
        <div
          class="h-full bg-blue-500 rounded"
          :style="{ width: progress.percent + '%' }"
        ></div>
      </div>
      <div class="text-right text-xs mt-1">{{ progress.percent.toFixed(0) }}%</div>
    </div>
  </transition>
</template>

<script setup lang="ts">
import { useProgressStore } from '../store/progress'
const progress = useProgressStore()
</script>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>

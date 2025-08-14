<template>
  <transition name="fade">
    <div v-if="show" class="fixed inset-0 bg-gray-600 bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50">
      <div class="bg-[#1d1d1d] text-white rounded-md p-6 w-[90%] max-w-3xl space-y-4 relative">
        <button @click="$emit('update:show', false)" class="absolute top-2 right-2 text-gray-400 hover:text-white cursor-pointer">✕</button>
        <h2 class="text-xl font-semibold">Предпросмотр</h2>
        <div class="flex gap-2 mb-4">
          <button :class="previewMode === 'closed' ? 'bg-blue-500 text-white' : 'bg-gray-400 text-black'" class="px-4 py-2 rounded-md cursor-pointer" @click="$emit('update:previewMode', 'closed')">Закрытая</button>
          <button :class="previewMode === 'open' ? 'bg-blue-500 text-white' : 'bg-gray-400 text-black'" class="px-4 py-2 rounded-md cursor-pointer" @click="$emit('update:previewMode', 'open')">Открытая</button>
        </div>
        <div class="overflow-auto max-h-[60vh]">
          <div v-html="html"></div>
        </div>
      </div>
    </div>
  </transition>
</template>

<script setup lang="ts">
defineProps<{ show: boolean; previewMode: 'closed' | 'open'; html: string }>()
defineEmits<{
  (e: 'update:show', val: boolean): void
  (e: 'update:previewMode', val: 'closed' | 'open'): void
}>()
</script>

<script lang="ts">
export default {}
</script>

<style>
.fade-enter-active,
.fade-leave-active { transition: opacity 0.2s; }
.fade-enter-from,
.fade-leave-to { opacity: 0; }
</style>



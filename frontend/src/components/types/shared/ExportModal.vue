<template>
  <transition name="fade">
    <div v-if="show" class="fixed inset-0 bg-gray-600 bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50">
      <div class="bg-white p-6 rounded-md w-[90%] max-w-sm space-y-4 relative">
        <button @click="$emit('update:show', false)" type="button" class="absolute top-2 right-2 text-gray-400 hover:text-black cursor-pointer">✕</button>
        <h3 class="text-lg font-medium">Экспортировать как…</h3>
        <div class="flex gap-2 justify-end">
          <button @click="$emit('export-json')" class="form-button h-10 px-4">JSON</button>
          <button @click="$emit('export-csv')" class="form-button h-10 px-4">CSV</button>
        </div>
      </div>
    </div>
  </transition>
</template>

<script setup lang="ts">
defineProps<{ show: boolean }>()
defineEmits<{
  (e: 'update:show', val: boolean): void
  (e: 'export-json'): void
  (e: 'export-csv'): void
}>()
</script>

<script lang="ts">
export default {}
</script>

<style>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>



<template>
  <div v-if="error" class="error-display bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
    <strong>Ошибка:</strong>
    <span>{{ typeof error === 'string' ? error : JSON.stringify(error) }}</span>
  </div>
</template>

<script setup lang="ts">
interface Props {
  error?: string | Error | any
}

defineProps<Props>()
</script>

<style scoped>
.error-display {
  margin-bottom: 1rem;
}
</style>


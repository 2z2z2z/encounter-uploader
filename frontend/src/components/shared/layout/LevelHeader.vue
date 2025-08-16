<template>
  <div class="level-header">
    <h1 class="text-2xl font-bold mb-4">{{ type }}</h1>
    <div class="header-info text-sm text-gray-600 mb-4">
      <span>автор: <strong>{{ author }}</strong>, </span>
      <span>домен: <strong>{{ domain }}</strong>, </span>
      <span>игра: <strong>{{ gameId }}</strong>, </span>
      <span>уровень: <strong>{{ levelId }}</strong></span>
    </div>
  </div>
</template>

<script setup lang="ts">
interface Props {
  type: string
  author: string
  domain: string
  gameId: string | number
  levelId: string | number
}

defineProps<Props>()
</script>

<style scoped>
.level-header {
  margin-bottom: 1rem;
}

.header-info {
  color: #666;
}
</style>


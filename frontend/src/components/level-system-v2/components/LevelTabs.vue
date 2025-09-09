<template>
  <div class="level-tabs">
    <!-- Блоки/табы -->
    <!-- Будет реализовано в Шаге 7 -->
    <div v-if="showTabs">Табы будут здесь</div>
  </div>
</template>

<script setup lang="ts">
/**
 * Компонент блоков/табов
 * Будет реализовано в Шаге 7
 */
import { computed } from 'vue'
import { useLevelV2Store } from '../store'

const store = useLevelV2Store()

// Показывать табы только для типов с isMultiBlocks: true
const showTabs = computed(() => {
	// Реализация в Шаге 7
	return false
})
</script>



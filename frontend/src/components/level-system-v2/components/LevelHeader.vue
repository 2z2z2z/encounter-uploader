<template>
  <div class="level-header">
    <!-- Шапка с названием и мета-данными -->
    <!-- Будет реализовано в Шаге 6 -->
    <h1>{{ title }}</h1>
  </div>
</template>

<script setup lang="ts">
/**
 * Компонент шапки страницы загрузки
 * Будет реализовано в Шаге 6
 */
import { computed } from 'vue'
import { useLevelV2Store } from '../store'

const store = useLevelV2Store()

const title = computed(() => store.levelType || 'Новая архитектура v2')
</script>



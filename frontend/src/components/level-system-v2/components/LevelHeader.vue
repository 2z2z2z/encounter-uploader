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

// Формирование заголовка с учетом типа и подтипа
const title = computed(() => {
	if (!store.levelType) return 'Новая архитектура v2'
	
	const baseTitle = store.levelType === 'olymp' ? 'Олимпийка' : '100500 секторов и бонусов'
	
	// Добавляем информацию о подтипе для Олимпийки
	if (store.levelType === 'olymp' && store.subtypeId) {
		const dimensionText = store.dimension ? ` (${store.dimension})` : ''
		return `${baseTitle}${dimensionText}`
	}
	
	return baseTitle
})
</script>



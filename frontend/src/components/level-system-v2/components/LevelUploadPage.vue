<template>
  <div class="min-h-screen flex items-center justify-center bg-surface-50 p-4">
    <div class="w-full max-w-[1920px]">
      <Card>
        <template #content>
          <!-- Слот 1: LevelHeader - шапка с названием и мета-данными -->
          <LevelHeader :type-id="typeId" :subtype="subtype" />

          <!-- Слот 2: LevelTabs - блоки/табы (новый слот) -->  
          <LevelTabs />

          <!-- Слот 3: LevelControlPanel - контрол-панель -->
          <div class="flex flex-wrap justify-between items-end gap-x-8 gap-y-10 mt-8 mb-6 rounded-2xl bg-violet-50 py-10 px-5">
            <LevelControlPanel />
          </div>

          <!-- Слот 4: LevelContent - таблица с данными -->
          <LevelContent />

          <!-- Слот 5: LevelFooter - подвал с кнопками -->
          <LevelFooter />
        </template>
      </Card>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useLevelV2Store } from '../store'

// PrimeVue components
import Card from 'primevue/card'

// Level system v2 components
import LevelHeader from './LevelHeader.vue'
import LevelTabs from './LevelTabs.vue'
import LevelControlPanel from './LevelControlPanel.vue'
import LevelContent from './LevelContent.vue'
import LevelFooter from './LevelFooter.vue'

const route = useRoute()
const levelV2Store = useLevelV2Store()

/**
 * Получаем параметр levelType из роута
 */
const levelType = computed(() => route.params.levelType as string)

/**
 * Парсинг levelType на typeId и subtype
 * olymp15 -> typeId: 'olymp', subtype: '15'
 * type100500 -> typeId: 'type100500', subtype: undefined
 */
const typeId = computed(() => {
  if (levelType.value?.startsWith('olymp')) {
    return 'olymp'
  }
  if (levelType.value === 'type100500') {
    return 'type100500'
  }
  return levelType.value
})

const subtype = computed(() => {
  if (levelType.value?.startsWith('olymp')) {
    return levelType.value.replace('olymp', '')
  }
  return undefined
})

/**
 * Инициализация store при монтировании компонента
 */
onMounted(() => {
  // Устанавливаем тип уровня и подтип в store
  if (typeId.value && typeId.value !== levelV2Store.levelType) {
    // TODO: Здесь будет логика инициализации типа уровня через configs
    // levelV2Store.setLevelType(typeId.value, subtype.value)
  }
})
</script>



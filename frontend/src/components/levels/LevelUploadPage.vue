<template>
  <div class="min-h-screen flex items-start justify-center bg-surface-50 p-4">
    <div class="w-full max-w-[2000px] flex flex-col gap-4">
      <LevelHeader v-if="typeId" :type-id="typeId" :subtype="resolvedSubtype" />

      <Card>
        <template #content>
          <LevelControlPanel />
          <LevelTabs />
          <LevelContent />
          <LevelFooter />
        </template>
      </Card>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useLevelStore } from '@/store/levels'
import { parseRouteParams } from '@/entities/level/configs'
import type { LevelTypeId } from '@/entities/level/types'

// PrimeVue components
import Card from 'primevue/card'

// Level system v2 components
import LevelHeader from './LevelHeader.vue'
import LevelTabs from './LevelTabs.vue'
import LevelControlPanel from './LevelControlPanel.vue'
import LevelContent from './LevelContent.vue'
import LevelFooter from './LevelFooter.vue'

const route = useRoute()
const router = useRouter()
const levelV2Store = useLevelStore()

const levelTypeParam = computed(() => route.params.levelType as string | undefined)
const subtypeParam = computed(() => route.params.subtype as string | undefined)

const compositeRouteKey = computed(() => {
  if (!levelTypeParam.value) return undefined
  return subtypeParam.value ? `${levelTypeParam.value}${subtypeParam.value}` : levelTypeParam.value
})

const parsedRoute = computed(() => {
  if (!compositeRouteKey.value) {
    return { typeId: undefined }
  }
  return parseRouteParams(compositeRouteKey.value)
})

const typeId = computed(() => parsedRoute.value.typeId ?? levelTypeParam.value)
const inferredSubtype = computed(() => parsedRoute.value.subtypeId)
const resolvedSubtype = computed(() => subtypeParam.value ?? inferredSubtype.value)
const config = computed(() => parsedRoute.value.config)
const subtypeConfig = computed(() => parsedRoute.value.subtypeConfig)

function ensureBaseCredentials() {
  if (!levelV2Store.domain) {
    levelV2Store.domain = 'test'
  }
  if (!levelV2Store.gameId) {
    levelV2Store.gameId = 'test'
  }
  if (!levelV2Store.levelId) {
    levelV2Store.levelId = '1'
  }
}

function initializeLevel(loadFromStorage = true) {
  if (!typeId.value || !config.value) {
    console.error(
      `[LevelUploadPage] Unknown route parameters: ${levelTypeParam.value ?? 'undefined'}/${subtypeParam.value ?? 'undefined'}`
    )
    router.replace({ name: 'settings' }).catch(() => undefined)
    return
  }

  ensureBaseCredentials()

  levelV2Store.initializeLevelType(
    typeId.value as LevelTypeId,
    subtypeConfig.value || resolvedSubtype.value,
    loadFromStorage
  )
}

onMounted(() => {
  initializeLevel(true)
})

watch(
  () => [typeId.value, resolvedSubtype.value],
  ([_nextType, _nextSubtype], [_prevType, _prevSubtype]) => {
    if (_nextType === _prevType && _nextSubtype === _prevSubtype) {
      return
    }
    initializeLevel(true)
  }
)
</script>




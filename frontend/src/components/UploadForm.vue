<template>
  <div class="min-h-screen flex items-center justify-center bg-surface-50">
    <span class="text-surface-500">Перенаправление на новую страницу загрузки…</span>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useLevelV2Store } from './level-system-v2/store'

const router = useRouter()
const levelV2Store = useLevelV2Store()

function resolveLevelRoute(): string {
  const typeId = levelV2Store.levelType || 'olymp'
  const subtype = levelV2Store.subtypeId || (typeId === 'olymp' ? '15' : undefined)

  return subtype ? `/v2/${typeId}/${subtype}` : `/v2/${typeId}`
}

onMounted(() => {
  const path = resolveLevelRoute()
  router.replace(path).catch(() => undefined)
})
</script>

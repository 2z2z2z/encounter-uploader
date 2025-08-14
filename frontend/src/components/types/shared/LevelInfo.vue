<template>
  <div class="mt-6 grid grid-cols-1 md:grid-cols-4 gap-4">
    <div>
      <div class="text-gray-500 text-sm">Автор</div>
      <div class="font-medium break-all">{{ auth.username || '—' }}</div>
    </div>
    <div>
      <div class="text-gray-500 text-sm">Домен</div>
      <div class="font-medium break-all">{{ store.domain || '—' }}</div>
    </div>
    <div>
      <div class="text-gray-500 text-sm">Игра</div>
      <div class="font-medium break-all">{{ store.gameId || '—' }}</div>
    </div>
    <div>
      <div class="text-gray-500 text-sm">Уровень</div>
      <div class="font-medium break-all">{{ store.levelId || '—' }}</div>
    </div>
  </div>
  
</template>

<script setup lang="ts">
import { useUploadStore } from '../../../store'
import { useAuthStore } from '../../../store/auth'

const store = useUploadStore()
const auth = useAuthStore()
</script>

<script lang="ts">
export default {}
</script>



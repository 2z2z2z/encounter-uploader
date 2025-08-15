<template>
  <OlympBase :type-config="typeConfig" />
</template>

<script setup lang="ts">
import OlympBase from '../base/OlympBase.vue'
import type { OlympTypeConfig } from '../base/types'

const typeConfig: OlympTypeConfig = {
  sectors: 15,
  type: 'olymp',
  label: 'Олимпийка (15 секторов)'
}
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

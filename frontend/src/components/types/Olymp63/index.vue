<template>
  <OlympBase :type-config="typeConfig" />
</template>

<script setup lang="ts">
import OlympBase from '../base/OlympBase.vue'
import type { OlympTypeConfig } from '../base/types'

const typeConfig: OlympTypeConfig = {
  sectors: 63,
  type: 'olymp63',
  label: 'Олимпийка (63 сектора)'
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

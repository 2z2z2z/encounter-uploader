<template>
  <div class="container min-h-screen py-6">
    <router-view />
  </div>
  <UploadProgress />
</template>
<script setup lang="ts">
import UploadProgress from './components/UploadProgress.vue'
</script>

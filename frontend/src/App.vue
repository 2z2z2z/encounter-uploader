<template>
  <div>
    <div class="container max-w-[120rem] min-h-screen py-6">
      <router-view />
      <VersionLabel />
    </div>
    <UploadProgress />
  </div>
</template>
<script setup lang="ts">
import UploadProgress from './components/UploadProgress.vue'
import VersionLabel from './components/VersionLabel.vue'
</script>

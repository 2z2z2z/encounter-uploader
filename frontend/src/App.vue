<template>
  <div>
    <div class="container max-w-[120rem] min-h-screen py-6">
      <router-view />
      <VersionLabel />
    </div>
    <UploadProgress />
    <ToastNotification />
    <ConfirmDialog />
  </div>
</template>
<script setup lang="ts">
import UploadProgress from './components/UploadProgress.vue'
import VersionLabel from './components/VersionLabel.vue'
import ToastNotification from './components/common/notifications/ToastNotification.vue'
import ConfirmDialog from './components/common/notifications/ConfirmDialog.vue'
</script>

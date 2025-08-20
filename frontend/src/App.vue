<template>
  <div>
    <section class="lg:px-20">
      <router-view />
      <!--<VersionLabel />-->
    </section>
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

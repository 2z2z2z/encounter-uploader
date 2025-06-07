<template>
  <div class="min-h-screen flex items-center justify-center bg-blue-50 py-8">
    <div class="bg-white p-8 rounded-lg shadow-md max-w-md mx-auto">
      <h1 class="text-2xl font-semibold mb-6">Вход в Encounter</h1>
      <form @submit.prevent="onSubmit" class="flex flex-wrap items-center gap-4">
        <input
          v-model="username"
          placeholder="Логин"
          class="form-input h-10 px-4"
        />
        <input
          v-model="password"
          type="password"
          placeholder="Пароль"
          class="form-input h-10 px-4"
        />
        <button type="submit" class="form-button h-10 px-6 flex-1">Войти</button>
      </form>
      <div v-if="authStore.error" class="text-red-500 text-sm mt-2">
        {{ authStore.error }}
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../store/auth'

const username = ref('')
const password = ref('')

const authStore = useAuthStore()
const router = useRouter()

function onSubmit() {
  // сохраняем в Pinia
  authStore.setCredentials(username.value, password.value)
  // переходим к настройкам
  router.push('/settings')
}
</script>

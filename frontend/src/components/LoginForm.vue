<template>
  <!-- Tailwind layout utilities для responsive центрирования -->
  <div class="min-h-screen flex flex-col items-center justify-center bg-surface-50 p-4">
      <!-- PrimeVue Card с Tailwind shadow и rounded -->
      <Card>
        <template #title>Вход в Encounter</template>
        <template #content>
          <!-- Tailwind spacing utilities -->
          <form @submit.prevent="onSubmit" class="space-y-6">
            <!-- Tailwind spacing для form fields -->
            <div class="space-y-1">
              <FloatLabel variant="on">
                <InputText
                  id="username"
                  v-model="username"
                  :invalid="!!authStore.error"
                  fluid
                  class="transition-all duration-200"
                  autocomplete="username"
                />
                <label for="username">Логин</label>
              </FloatLabel>
            </div>
            <div class="space-y-1">
              <FloatLabel variant="on">
                <Password
                  id="password"
                  v-model="password"
                  :feedback="false"
                  :invalid="!!authStore.error"
                  toggle-mask
                  fluid
                  class="transition-all duration-200"
                  :input-props="{ autocomplete: 'current-password' }"
                />
                <label for="password">Пароль</label>
              </FloatLabel>
            </div>
            
            <!-- Tailwind hover и focus utilities -->
            <Button 
              type="submit" 
              label="Войти"
              fluid
              class="transition-all duration-200"
              icon="pi pi-user"
            />
          </form>
          
          <!-- Tailwind spacing и animation -->
          <Transition
            enter-active-class="animate-fadein"
            leave-active-class="animate-fadeout"
          >
            <Message 
              v-if="authStore.error" 
              severity="error" 
              :closable="false"
              class="mt-6"
            >
              {{ authStore.error }}
            </Message>
          </Transition>
        </template>
      </Card>
      
      <!-- Дополнительная информация с Tailwind utilities -->
      <div class="mt-8 text-center">
        <p class="text-muted-color text-sm">
          Введенный логин и пароль хранятся локально в браузере.
        </p>
      </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../store/auth'
import Card from 'primevue/card'
import InputText from 'primevue/inputtext'
import Password from 'primevue/password'
import Button from 'primevue/button'
import Message from 'primevue/message'
import FloatLabel from 'primevue/floatlabel'

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

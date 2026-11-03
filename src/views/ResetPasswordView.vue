<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute } from 'vue-router'
import { KeyRound } from 'lucide-vue-next'
import BaseCard from '../components/ui/BaseCard.vue'
import BaseButton from '../components/ui/BaseButton.vue'
import BaseNotice from '../components/ui/BaseNotice.vue'
import PasswordField from '../components/ui/PasswordField.vue'
import AuthPreferences from '../components/layout/AuthPreferences.vue'
import { confirmReset } from '../api/session'
import { useI18n } from '../i18n'

const { t } = useI18n()
const route = useRoute()
const email = computed(() => typeof route.query.email === 'string' ? route.query.email : '')
const token = computed(() => typeof route.query.token === 'string' ? route.query.token : '')
const password = ref('')
const confirm = ref('')
const busy = ref(false)
const message = ref('')
const error = ref('')

async function submit() {
  if (busy.value) return
  if (password.value !== confirm.value) {
    error.value = t('mismatch')
    return
  }
  busy.value = true
  error.value = ''
  message.value = ''
  try {
    message.value = await confirmReset({
      email: email.value, token: token.value,
      password: password.value, password_confirmation: confirm.value
    })
    password.value = ''
    confirm.value = ''
  } catch (cause) {
    error.value = cause instanceof Error ? cause.message : t('operationError')
  } finally {
    busy.value = false
  }
}
const logoSrc = import.meta.env.BASE_URL + 'brand/toir-gear.svg'
</script>

<template>
  <main class="auth-page">
    <div class="auth-wrap">
      <AuthPreferences />
      <header class="auth-brand">
        <img :src="logoSrc" alt="ITP ТОиР" width="58" height="58" />
        <div><strong>{{ t('product') }}</strong><span>{{ t('subtitle') }}</span></div>
      </header>
      <BaseCard>
        <div class="auth-title-icon"><KeyRound :size="20" aria-hidden="true" /></div>
        <h1>{{ t('newPassword') }}</h1>
        <p class="muted auth-description">{{ t('passwordRequirements') }}</p>
        <BaseNotice v-if="!token || !email" tone="error">{{ t('operationError') }}</BaseNotice>
        <BaseNotice v-if="message" tone="success">{{ message }}</BaseNotice>
        <BaseNotice v-if="error" tone="error">{{ error }}</BaseNotice>
        <form v-if="token && email && !message" class="auth-form" @submit.prevent="submit">
          <PasswordField v-model="password" :label="t('newPassword')" autocomplete="new-password"
            required :disabled="busy" />
          <PasswordField v-model="confirm" :label="t('confirmPassword')" autocomplete="new-password"
            required :disabled="busy" />
          <BaseButton type="submit" :disabled="busy || !password || !confirm">{{ t('resetAction') }}</BaseButton>
        </form>
        <RouterLink class="auth-back" to="/login">{{ t('backLogin') }}</RouterLink>
      </BaseCard>
    </div>
  </main>
</template>

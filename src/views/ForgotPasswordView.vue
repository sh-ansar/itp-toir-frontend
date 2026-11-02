<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { KeyRound } from 'lucide-vue-next'
import BaseCard from '../components/ui/BaseCard.vue'
import BaseButton from '../components/ui/BaseButton.vue'
import BaseNotice from '../components/ui/BaseNotice.vue'
import BaseFormField from '../components/ui/BaseFormField.vue'
import AuthPreferences from '../components/layout/AuthPreferences.vue'
import { requestReset, recoveryAvailable } from '../api/session'
import { useI18n } from '../i18n'

const { t } = useI18n()
const email = ref('')
const busy = ref(false)
const recoveryReady = ref(false)
const checked = ref(false)
onMounted(async () => { recoveryReady.value = await recoveryAvailable(); checked.value = true })
const message = ref('')
const error = ref('')

async function submit() {
  if (busy.value || !recoveryReady.value) return
  busy.value = true
  error.value = ''
  message.value = ''
  try {
    message.value = await requestReset(email.value.trim())
  } catch (cause) {
    error.value = cause instanceof Error ? cause.message : t('operationError')
  } finally {
    busy.value = false
  }
}
</script>

<template>
  <main class="auth-page">
    <div class="auth-wrap">
      <AuthPreferences />
      <header class="auth-brand">
        <img src="/brand/itp-mark.svg" alt="ITP" width="62" height="47" />
        <div><strong>{{ t('product') }}</strong><span>{{ t('subtitle') }}</span></div>
      </header>
      <BaseCard>
        <div class="auth-title-icon"><KeyRound :size="21" aria-hidden="true" /></div>
        <h1>{{ t('resetTitle') }}</h1>
        <p class="muted auth-description">{{ t('resetHint') }}</p>
        <BaseNotice v-if="checked && !recoveryReady" tone="warning">{{ t('recoveryUnavailable') }}</BaseNotice>
        <BaseNotice v-if="message" tone="success">{{ message }}</BaseNotice>
        <BaseNotice v-if="error" tone="error">{{ error }}</BaseNotice>
        <form class="auth-form" @submit.prevent="submit">
          <BaseFormField v-model="email" :label="t('email')" type="email"
            autocomplete="email" required :disabled="busy" />
          <BaseButton type="submit" :disabled="busy || !recoveryReady || !email.trim()">{{ t('sendLink') }}</BaseButton>
        </form>
        <RouterLink class="auth-back" to="/login">{{ t('backLogin') }}</RouterLink>
      </BaseCard>
    </div>
  </main>
</template>

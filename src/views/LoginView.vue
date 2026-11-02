<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ArrowRight, LockKeyhole, ShieldCheck } from 'lucide-vue-next'
import BaseCard from '../components/ui/BaseCard.vue'
import BaseButton from '../components/ui/BaseButton.vue'
import BaseNotice from '../components/ui/BaseNotice.vue'
import BaseFormField from '../components/ui/BaseFormField.vue'
import PasswordField from '../components/ui/PasswordField.vue'
import AuthPreferences from '../components/layout/AuthPreferences.vue'
import { apiHealth } from '../api/session'
import { useSessionStore } from '../stores/session'
import { useI18n } from '../i18n'

const { t } = useI18n()
const router = useRouter()
const route = useRoute()
const session = useSessionStore()
const email = ref('')
const password = ref('')
const message = ref('')
const online = ref<boolean | null>(null)
onMounted(async () => {
  online.value = await apiHealth()
  if (!session.checked) await session.refresh()
  if (session.session) await router.replace({ name: 'home' })
})

async function submit() {
  if (session.loading) return
  message.value = ''
  try {
    await session.login(email.value, password.value)
    password.value = ''
    const requested = route.query.redirect
    const destination = typeof requested === 'string' && requested.startsWith('/') &&
      !requested.startsWith('//') && !requested.includes('\\') ? requested : '/'
    await router.replace(destination)
  } catch (error) {
    password.value = ''
    message.value = error instanceof Error ? error.message : t('operationError')
  }
}
const logoSrc = import.meta.env.BASE_URL + 'brand/itp-mark.svg'
</script>

<template>
  <main class="auth-page">
    <div class="auth-wrap">
      <AuthPreferences />
      <header class="auth-brand">
        <img :src="logoSrc" alt="ITP" width="62" height="47" />
        <div>
          <strong>{{ t('product') }}</strong>
          <span>{{ t('subtitle') }}</span>
        </div>
      </header>
      <BaseCard>
        <div class="auth-title-icon"><LockKeyhole :size="20" aria-hidden="true" /></div>
        <h1>{{ t('signIn') }}</h1>
        <p class="muted auth-description">{{ t('signInHint') }}</p>

        <BaseNotice v-if="online === false" tone="warning">{{ t('checkServer') }}</BaseNotice>
        <BaseNotice v-if="message" tone="error">{{ message }}</BaseNotice>

        <form class="auth-form" @submit.prevent="submit">
          <BaseFormField v-model="email" :label="t('email')" type="email"
            autocomplete="username" required :disabled="session.loading" />
          <PasswordField v-model="password" :label="t('password')"
            autocomplete="current-password" required :disabled="session.loading" />
          <div class="auth-form-footer">
            <RouterLink to="/forgot-password">{{ t('forgot') }}</RouterLink>
          </div>
          <BaseButton type="submit" :disabled="session.loading || !email.trim() || !password">
            {{ session.loading ? t('entering') : t('signInAction') }}
            <ArrowRight :size="17" aria-hidden="true" />
          </BaseButton>
        </form>
      </BaseCard>
      <div class="auth-footnote"><ShieldCheck :size="15" aria-hidden="true" />{{ t('independent') }}</div>
    </div>
  </main>
</template>

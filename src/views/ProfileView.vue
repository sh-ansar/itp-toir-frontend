<script setup lang="ts">
import { ref } from 'vue'
import { Shield, UserRound } from 'lucide-vue-next'
import BaseCard from '../components/ui/BaseCard.vue'
import BaseButton from '../components/ui/BaseButton.vue'
import BaseNotice from '../components/ui/BaseNotice.vue'
import BasePageHeading from '../components/ui/BasePageHeading.vue'
import PasswordField from '../components/ui/PasswordField.vue'
import { changePassword } from '../api/session'
import { useSessionStore } from '../stores/session'
import { useI18n } from '../i18n'

const { t } = useI18n()
const auth = useSessionStore()
const currentPassword = ref('')
const password = ref('')
const confirmation = ref('')
const busy = ref(false)
const success = ref('')
const error = ref('')

async function submit() {
  if (busy.value) return
  if (password.value !== confirmation.value) {
    error.value = t('mismatch')
    return
  }
  busy.value = true
  success.value = ''
  error.value = ''
  try {
    success.value = await changePassword({
      current_password: currentPassword.value,
      password: password.value,
      password_confirmation: confirmation.value
    })
    currentPassword.value = ''
    password.value = ''
    confirmation.value = ''
  } catch (cause) {
    error.value = cause instanceof Error ? cause.message : t('operationError')
  } finally {
    busy.value = false
  }
}
</script>

<template>
  <div class="page-body">
    <BasePageHeading :eyebrow="t('security')" :title="t('profileTitle')" :description="t('profileHint')" />
    <div class="profile-grid">
      <BaseCard>
        <div class="card-section-heading"><UserRound :size="19" /><h2>{{ t('account') }}</h2></div>
        <dl class="profile-properties">
          <dt>{{ t('email') }}</dt><dd>{{ auth.session?.user.email || '—' }}</dd>
          <dt>{{ t('role') }}</dt><dd>{{ auth.session?.active_role || '—' }}</dd>
        </dl>
        <h3 class="subheading">{{ t('availableCompanies') }}</h3>
        <div class="company-list">
          <div v-for="company in auth.session?.companies" :key="company.id">
            <span>{{ company.name }}</span>
            <small>{{ company.role }}</small>
          </div>
        </div>
      </BaseCard>
      <BaseCard>
        <div class="card-section-heading"><Shield :size="19" /><h2>{{ t('changePassword') }}</h2></div>
        <p class="muted password-help">{{ t('passwordRequirements') }}</p>
        <BaseNotice v-if="success" tone="success">{{ success }}</BaseNotice>
        <BaseNotice v-if="error" tone="error">{{ error }}</BaseNotice>
        <form class="profile-form" @submit.prevent="submit">
          <PasswordField v-model="currentPassword" :label="t('currentPassword')"
            autocomplete="current-password" required :disabled="busy" />
          <PasswordField v-model="password" :label="t('newPassword')"
            autocomplete="new-password" required :disabled="busy" />
          <PasswordField v-model="confirmation" :label="t('confirmPassword')"
            autocomplete="new-password" required :disabled="busy" />
          <BaseButton type="submit" :disabled="busy || !currentPassword || !password || !confirmation">
            {{ busy ? t('saving') : t('savePassword') }}
          </BaseButton>
        </form>
      </BaseCard>
    </div>
  </div>
</template>

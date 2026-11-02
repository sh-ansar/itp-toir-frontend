<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { Eye, EyeOff, LogOut, Menu, Moon, Sun, UserRound } from 'lucide-vue-next'
import { useSessionStore } from '../../stores/session'
import { usePreferencesStore, type Locale } from '../../stores/preferences'
import { useI18n } from '../../i18n'
import { usePreviewStore } from '../../stores/preview'

defineEmits<{ 'open-menu': [] }>()
const router = useRouter()
const session = useSessionStore()
const ui = usePreferencesStore()
const preview = usePreviewStore()
const { t } = useI18n()
const error = ref('')
const active = computed(() => session.session?.companies.find(
  company => company.id === session.session?.active_company_id
))

async function companyChanged(event: Event) {
  const id = Number((event.target as HTMLSelectElement).value)
  error.value = ''
  try {
    await session.chooseCompany(id)
    preview.setEnabled(false)
  } catch (cause) {
    error.value = cause instanceof Error ? cause.message : t('operationError')
    ;(event.target as HTMLSelectElement).value = String(session.session?.active_company_id || '')
  }
}

async function logout() {
  error.value = ''
  try {
    await session.logout()
    preview.setEnabled(false)
    await router.replace({ name: 'login' })
  } catch (cause) {
    error.value = cause instanceof Error ? cause.message : t('operationError')
  }
}
</script>

<template>
  <header class="topbar toir-topbar">
    <div class="topbar-start">
      <button type="button" class="icon-control mobile-hamburger"
        :aria-label="t('openMenu')" @click="$emit('open-menu')">
        <Menu :size="21" aria-hidden="true" />
      </button>
      <span class="topbar-heading">{{ t('product') }}</span>
    </div>
    <div class="topbar-actions">
      <div class="topbar-company">
        <label class="visually-hidden" for="topbar-company">{{ t('company') }}</label>
        <select v-if="(session.session?.companies.length || 0) > 1" id="topbar-company"
          :value="session.session?.active_company_id || ''" :disabled="session.loading"
          @change="companyChanged">
          <option v-for="company in session.session?.companies" :key="company.id" :value="company.id">
            {{ company.name }}
          </option>
        </select>
        <span v-else class="company-name">{{ active?.name || t('company') }}</span>
      </div>
      <button type="button" class="preview-toggle" :class="{ 'preview-toggle--active': preview.enabled }"
        :aria-pressed="preview.enabled" :title="preview.enabled ? t('previewActive') : t('previewMode')"
        @click="preview.toggle()">
        <EyeOff v-if="preview.enabled" :size="16" aria-hidden="true" />
        <Eye v-else :size="16" aria-hidden="true" />
        <span>{{ preview.enabled ? t('previewActive') : t('previewMode') }}</span>
      </button>
      <label class="visually-hidden" for="topbar-language">{{ t('language') }}</label>
      <select id="topbar-language" class="topbar-language" :value="ui.locale"
        @change="ui.locale = ($event.target as HTMLSelectElement).value as Locale">
        <option value="ru">RU</option><option value="en">EN</option><option value="ka">GE</option>
      </select>
      <button type="button" class="icon-control" :aria-label="t('theme')"
        :aria-pressed="ui.theme === 'dark'" @click="ui.toggleTheme()">
        <Sun v-if="ui.theme === 'dark'" :size="19" aria-hidden="true"/>
        <Moon v-else :size="19" aria-hidden="true"/>
      </button>
      <RouterLink class="icon-control profile-toplink" to="/profile" :title="t('profile')"
        :aria-label="t('profile')"><UserRound :size="19" aria-hidden="true" /></RouterLink>
      <button class="icon-control" type="button" :aria-label="t('logout')" :title="t('logout')"
        :disabled="session.loading" @click="logout">
        <LogOut :size="19" aria-hidden="true"/>
      </button>
    </div>
    <p v-if="error" class="topbar-error" role="alert">{{ error }}</p>
  </header>
</template>

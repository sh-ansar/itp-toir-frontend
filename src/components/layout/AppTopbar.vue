<script setup lang="ts">
import BaseSelect from '../ui/BaseSelect.vue'
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { LogOut, Menu, Moon, Sun, UserRound } from 'lucide-vue-next'
import { useSessionStore } from '../../stores/session'
import { usePreferencesStore, type Locale } from '../../stores/preferences'
import { useI18n } from '../../i18n'

defineEmits<{ 'open-menu': [] }>()
const router = useRouter()
const session = useSessionStore()
const ui = usePreferencesStore()
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
  } catch (cause) {
    error.value = cause instanceof Error ? cause.message : t('operationError')
    ;(event.target as HTMLSelectElement).value = String(session.session?.active_company_id || '')
  }
}

async function logout() {
  error.value = ''
  try {
    await session.logout()
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
    </div>
    <div class="topbar-actions">
      <div class="topbar-company">
        <label class="visually-hidden" for="topbar-company">{{ t('company') }}</label>
        <BaseSelect v-if="(session.session?.companies.length || 0) > 1" id="topbar-company"
          :value="session.session?.active_company_id || ''" :disabled="session.loading"
          @change="companyChanged">
          <option v-for="company in session.session?.companies" :key="company.id" :value="company.id">
            {{ company.name }}
          </option>
        </BaseSelect>
        <span v-else class="company-name">{{ active?.name || t('company') }}</span>
      </div>
      <label class="visually-hidden" for="topbar-language">{{ t('language') }}</label>
      <BaseSelect id="topbar-language" class="topbar-language" :value="ui.locale"
        @change="ui.locale = ($event.target as HTMLSelectElement).value as Locale">
        <option value="ru">RU</option><option value="en">EN</option><option value="ka">GE</option>
      </BaseSelect>
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

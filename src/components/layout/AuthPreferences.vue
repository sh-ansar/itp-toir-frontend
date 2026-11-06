<script setup lang="ts">
import BaseSelect from '../ui/BaseSelect.vue'
import { Moon, Sun } from 'lucide-vue-next'
import { usePreferencesStore, type Locale } from '../../stores/preferences'
const ui = usePreferencesStore()
</script>

<template>
  <div class="auth-preferences">
    <label class="visually-hidden" for="auth-locale">Language</label>
    <BaseSelect id="auth-locale" :value="ui.locale"
      @change="ui.locale = ($event.target as HTMLSelectElement).value as Locale">
      <option value="ru">RU</option>
      <option value="en">EN</option>
      <option value="ka">GE</option>
    </BaseSelect>
    <button type="button" :aria-label="ui.theme === 'dark' ? 'Light' : 'Dark'"
      :aria-pressed="ui.theme === 'dark'" @click="ui.toggleTheme()">
      <Sun v-if="ui.theme === 'dark'" :size="18" aria-hidden="true" />
      <Moon v-else :size="18" aria-hidden="true" />
    </button>
  </div>
</template>

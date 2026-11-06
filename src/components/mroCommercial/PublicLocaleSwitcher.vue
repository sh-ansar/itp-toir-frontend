<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import BaseSelect from '../ui/BaseSelect.vue'
import { usePreferencesStore } from '../../stores/preferences'
const { locale } = useI18n()
const prefs = usePreferencesStore()
const options = [['ru','Русский'],['en','English'],['ka','ქართული'],['de','Deutsch'],['fr','Français'],['es','Español']]
function change(event: Event) {
  const value = (event.target as HTMLSelectElement).value
  locale.value = value
  if (value === 'ru' || value === 'en' || value === 'ka') prefs.locale = value
  try { localStorage.setItem('mro-public-locale', value) } catch {}
}
</script>
<template><label class="mro-language"><span class="sr-only">Language</span><BaseSelect :model-value="locale" aria-label="Language / Язык" @change="change"><option v-for="[key,name] in options" :key="key" :value="key">{{name}}</option></BaseSelect></label></template>
<style scoped>.mro-language{display:block;width:100%;min-width:0}.sr-only{position:absolute;width:1px;height:1px;overflow:hidden;clip-path:inset(50%)}.mro-language :deep(select){appearance:none;width:100%;border:1px solid #d4e0e6;border-radius:8px;background:#fff;color:#173c50;padding:11px 28px 11px 12px;font:inherit;font-size:13px;cursor:pointer}.mro-language :deep(select:focus-visible){outline:2px solid #028ac5;outline-offset:2px}</style>
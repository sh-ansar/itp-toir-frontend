<script setup lang="ts">
import { usePreferencesStore } from '../../stores/preferences'
const prefs = usePreferencesStore()
</script>
<template><button type="button" class="mro-theme" @click="prefs.toggleTheme()">{{ prefs.theme === 'dark' ? '☀' : '◐' }} {{ prefs.theme === 'dark' ? 'Светлая тема' : 'Тёмная тема' }}</button></template>
<style scoped>.mro-theme{border:1px solid #dce8ef;border-radius:7px;padding:10px 12px;background:#fff;color:#243d4a;cursor:pointer}</style>
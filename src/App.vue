<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute } from 'vue-router'
import { useSessionStore } from './stores/session'
import { usePreviewStore } from './stores/preview'
import { useI18n } from './i18n'
import AppSidebar from './components/layout/AppSidebar.vue'
import AppTopbar from './components/layout/AppTopbar.vue'

const route = useRoute()
const session = useSessionStore()
const preview = usePreviewStore()
const { t } = useI18n()
const mobileOpen = ref(false)
const showShell = computed(() => !!route.meta.auth && !!session.session)
</script>

<template>
  <div v-if="showShell" class="app-shell">
    <AppSidebar v-model:mobile-open="mobileOpen" />
    <div class="main">
      <AppTopbar @open-menu="mobileOpen = true" />
      <div v-if="preview.enabled" class="demo-banner" role="status">
        <span class="demo-banner-label">{{ t('previewActive') }}</span>
        <span>{{ t('previewNotice') }}</span>
        <button type="button" @click="preview.setEnabled(false)" :aria-label="t('previewMode')">×</button>
      </div>
      <main id="main-content" class="content"><RouterView /></main>
    </div>
  </div>
  <RouterView v-else />
</template>

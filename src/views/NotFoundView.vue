<script setup lang="ts">
import BaseButton from '../components/ui/BaseButton.vue'
import { useI18n } from '../i18n'
const { t } = useI18n()
</script>
<template>
  <main class="auth-page">
    <div class="not-found">
      <strong>404</strong>
      <h1>{{ t('pageNotFound') }}</h1>
      <RouterLink to="/"><BaseButton>{{ t('goHome') }}</BaseButton></RouterLink>
    </div>
  </main>
</template>

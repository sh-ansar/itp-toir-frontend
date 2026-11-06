<script setup lang="ts">
import { computed } from 'vue'
import { Alert } from '@itpmining/vue-basic-components'
const props = withDefaults(defineProps<{ tone?: 'error' | 'warning' | 'info' | 'success' }>(), { tone:'info' })
const role = computed(() => props.tone === 'error' ? 'alert' : 'status')
const sharedColor = computed(() => ({ error:'danger', warning:'warning', info:'primary', success:'success' })[props.tone])
</script>
<template>
  <div class="base-notice" :class="'base-notice--'+tone" :role="role">
    <Alert :color="sharedColor"><slot /></Alert>
  </div>
</template>
<style scoped>
.base-notice :deep(.alert) { margin:0; width:100% }
.base-notice--error :deep(.alert) { color:var(--color-danger);background:var(--color-danger-surface) }
.base-notice--success :deep(.alert) { color:var(--color-success);background:var(--color-success-surface) }
.base-notice--warning :deep(.alert) { color:var(--color-warning);background:var(--color-warning-surface) }
</style>

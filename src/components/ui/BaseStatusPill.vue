<script setup lang="ts">
import { Pill } from '@itpmining/vue-basic-components'
withDefaults(defineProps<{ tone?: 'success'|'warning'|'danger'|'info'|'neutral'; dot?:boolean }>(), {tone:'neutral', dot:false})
</script>
<template>
  <Pill class="base-status-pill" :class="'base-status-pill--'+tone" color="secondary" size="small" rounded>
    <span v-if="dot" class="base-status-pill__dot" aria-hidden="true"></span><slot/>
  </Pill>
</template>
<style scoped>
.base-status-pill :deep(.pill) { font-weight:500 }
.base-status-pill--success { color:var(--color-success) }
.base-status-pill--warning { color:var(--color-warning) }
.base-status-pill--danger { color:var(--color-danger) }
.base-status-pill--info { color:var(--color-primary) }
.base-status-pill__dot { display:inline-block;width:6px;height:6px;border-radius:50%;background:currentColor }
</style>

<script setup lang="ts">
import { SearchBar } from '@itpmining/vue-basic-components'
withDefaults(defineProps<{ modelValue: string; label: string; placeholder?: string; disabled?: boolean }>(), { disabled: false })
const emit = defineEmits<{ 'update:modelValue': [value: string] }>()
</script>
<template>
  <SearchBar class="registry-search" :model-value="modelValue" :search-label="label"
    :placeholder="placeholder || label" :disabled="disabled"
    @update:model-value="emit('update:modelValue', String($event))"
    @clear="emit('update:modelValue','')" />
</template>
<style scoped>
.registry-search { flex: 1 1 240px; width:100%; min-width:0; max-width:420px }
@media (max-width:650px) { .registry-search { max-width:none } }
</style>

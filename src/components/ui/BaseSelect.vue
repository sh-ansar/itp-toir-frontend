<script setup lang="ts">
import { useAttrs } from 'vue'

defineOptions({ inheritAttrs: false })
type SelectModel = string | number | readonly (string | number)[] | null | undefined
const props = defineProps<{
  modelValue?: SelectModel
  modelModifiers?: { number?: boolean; trim?: boolean }
}>()
const attrs = useAttrs()
const emit = defineEmits<{
  'update:modelValue': [value: SelectModel]
  change: [event: Event]
}>()

function onChange(event: Event) {
  const element = event.target as HTMLSelectElement
  const coerce = (value: string): string | number => {
    if (!props.modelModifiers?.number || value === '') return props.modelModifiers?.trim ? value.trim() : value
    const number = Number(value)
    return Number.isNaN(number) ? value : number
  }
  const value = element.multiple
    ? Array.from(element.selectedOptions, option => coerce(option.value))
    : coerce(element.value)
  emit('update:modelValue', value)
  emit('change', event)
}
</script>

<template>
  <select
    v-bind="attrs"
    :value="props.modelValue === undefined ? attrs.value : props.modelValue ?? ''"
    @change="onChange"
  >
    <slot />
  </select>
</template>

<script setup lang="ts">
import { computed, useAttrs, useSlots } from 'vue'
import { UnifiedSelect } from '@itpmining/vue-basic-components'

defineOptions({ inheritAttrs: false })
type Value = string | number | null
type SelectModel = Value | readonly Value[] | undefined
const props = defineProps<{ modelValue?: SelectModel; modelModifiers?: { number?: boolean; trim?: boolean } }>()
const emit = defineEmits<{ 'update:modelValue': [value: SelectModel]; change: [event: Event] }>()
const attrs = useAttrs()
const slots = useSlots()

// Adapt existing <option> slots to the shared component without replacing domain-specific forms.
function textOf(node: any): string {
  if (typeof node === 'string' || typeof node === 'number') return String(node)
  if (!node) return ''
  if (typeof node.children === 'string') return node.children
  if (Array.isArray(node.children)) return node.children.map(textOf).join('')
  return ''
}
function optionsFromSlot() {
  const options: Array<{ value: Value; label: string; disabled?: boolean }> = []
  function visit(nodes: any[]) {
    for (const node of nodes || []) {
      if (!node || typeof node !== 'object') continue
      if (node.type === 'option') {
        const value: Value = node.props?.value ?? null
        options.push({ value, label: textOf(node).trim(), disabled: Boolean(node.props?.disabled) })
      } else if (Array.isArray(node.children)) visit(node.children)
    }
  }
  visit(slots.default?.() || [])
  return options
}
function update(value: SelectModel) {
  const coerce = (v: Value): Value => {
    if (v === null) return v
    if (props.modelModifiers?.number && v !== '') {
      const n = Number(v)
      return Number.isNaN(n) ? v : n
    }
    return props.modelModifiers?.trim && typeof v === 'string' ? v.trim() : v
  }
  const next = Array.isArray(value) ? value.map(coerce) : coerce(value as Value)
  emit('update:modelValue', next)
  // Preserve the legacy @change handlers that read event.target.value.
  emit('change', { target: { value: Array.isArray(next) ? next : String(next ?? '') } } as unknown as Event)
}
function truthy(value: unknown): boolean { return value === '' || value === true || value === 'true' }
const currentValue=computed<string|number|null|(string|number)[]|undefined>(()=>{
  const val=props.modelValue === undefined ? attrs.value as SelectModel : props.modelValue
  if(Array.isArray(val))return (val as readonly Value[]).filter((v):v is string|number=>v!==null)
  return val as string|number|null|undefined
})
const controlSize=computed<'small'|'medium'|'large'>(()=>{
  const val=String(attrs.size || '')
  return val==='small'||val==='large'?val:'medium'
})
</script>

<template>
  <UnifiedSelect
    v-bind="attrs"
    :model-value="currentValue"
    :options="optionsFromSlot()"
    value-key="value" label-key="label"
    :multiple="truthy(attrs.multiple)"
    :required="truthy(attrs.required)"
    :disabled="truthy(attrs.disabled)"
    :name="typeof attrs.name === 'string' ? attrs.name : undefined"
    :label="String(attrs['aria-label'] || '')" hide-label
    :size="controlSize"
    :searchable="optionsFromSlot().length > 12"
    :placeholder="optionsFromSlot().find(option => option.value === '' || option.value === null)?.label || 'Выберите'"
    @update:model-value="update"
  />
</template>

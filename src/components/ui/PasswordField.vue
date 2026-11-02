<script setup lang="ts">
import { computed, ref, useId } from 'vue'
import { Eye, EyeOff } from 'lucide-vue-next'

const props = withDefaults(defineProps<{
  modelValue: string
  label: string
  autocomplete?: string
  required?: boolean
  disabled?: boolean
  error?: string
}>(), { required: false, disabled: false, error: '' })
defineEmits<{ 'update:modelValue': [value: string] }>()
const id = useId()
const revealed = ref(false)
const inputType = computed(() => revealed.value ? 'text' : 'password')
</script>

<template>
  <div class="field password-field">
    <label :for="id">{{ label }}<span v-if="required" aria-hidden="true"> *</span></label>
    <div class="password-input">
      <input :id="id" :type="inputType" :value="modelValue"
        :required="required" :disabled="disabled" :autocomplete="autocomplete"
        :aria-invalid="!!error"
        @input="$emit('update:modelValue', ($event.target as HTMLInputElement).value)" />
      <button class="reveal-button" type="button" :disabled="disabled"
        :aria-label="revealed ? 'Скрыть пароль' : 'Показать пароль'"
        @click="revealed = !revealed">
        <EyeOff v-if="revealed" :size="17" aria-hidden="true" />
        <Eye v-else :size="17" aria-hidden="true" />
      </button>
    </div>
    <p v-if="error" class="field-error" role="alert">{{ error }}</p>
  </div>
</template>

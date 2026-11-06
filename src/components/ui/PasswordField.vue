<script setup lang="ts">
import { computed,ref,useId } from 'vue'
import { Eye,EyeOff } from 'lucide-vue-next'
import { TextInput,Button } from '@itpmining/vue-basic-components'
const props=withDefaults(defineProps<{modelValue:string;label:string;autocomplete?:string;required?:boolean;disabled?:boolean;error?:string}>(),{required:false,disabled:false,error:''})
const emit=defineEmits<{ 'update:modelValue':[value:string] }>()
const id=useId(),revealed=ref(false)
const kind=computed(()=>revealed.value?'text':'password')
</script>
<template>
  <div class="field password-field">
    <label :for="id">{{label}}<span v-if="required" aria-hidden="true"> *</span></label>
    <div class="password-input">
      <TextInput :id="id" :model-value="modelValue" :type="kind" :required="required"
        :disabled="disabled" :autocomplete="autocomplete" :aria-invalid="!!error"
        @update:model-value="emit('update:modelValue',String($event))"/>
      <Button class="reveal-button" type="button" color="secondary" :disabled="disabled"
        :aria-label="revealed?'Скрыть пароль':'Показать пароль'" @click="revealed=!revealed">
        <EyeOff v-if="revealed" :size="17" aria-hidden="true"/>
        <Eye v-else :size="17" aria-hidden="true"/>
      </Button>
    </div>
    <p v-if="error" class="field-error" role="alert">{{error}}</p>
  </div>
</template>
<style scoped>
.password-input :deep(.textinput__field) { padding-right:48px }
.password-input .reveal-button {position:absolute;right:4px;top:50%;transform:translateY(-50%);width:35px;min-width:35px;height:35px;padding:0;display:grid;place-items:center}
</style>

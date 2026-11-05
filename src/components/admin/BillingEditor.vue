<script setup>
import {reactive,ref} from 'vue'
import {Button,TextInput,Select} from '@itpmining/vue-basic-components'
import {useI18n} from 'vue-i18n'
const props=defineProps({profile:Object,busy:Boolean,assets:Boolean});const emit=defineEmits(['save','asset']);const {t}=useI18n()
const fields=['legal_name','registration_number','address','bank','iban','bic','kbe','payment_code','signatory','tax_label','service_name','prefix','valid_days','tax_basis_points']
const value=reactive({...Object.fromEntries(fields.map(k=>[k,''])),currency:'KZT',...props.profile})
const stampApproved=ref(false)
const tax=ref(String(Number(value.tax_basis_points||0)/100))
function save(){const m=/^(\d{1,3})(?:[.,](\d{1,2}))?$/.exec(tax.value);if(!m)return;emit('save',{...value,tax_basis_points:Number(m[1])*100+Number((m[2]||'').padEnd(2,'0'))})}
</script>
<template><form class="editor" @submit.prevent="save"><div class="form-grid"><label v-for="key in fields" :key="key">{{t('adminPortal.billing_'+key)}}<TextInput :model-value="key==='tax_basis_points'?tax:value[key]" @update:model-value="key==='tax_basis_points'?tax=$event:value[key]=$event" :type="key==='valid_days'?'number':'text'" :required="!['kbe','payment_code'].includes(key)" /></label><label>{{t('adminPortal.currency')}}<Select v-model="value.currency" :options="['KZT','GEL','USD','EUR'].map(v=>({id:v,name:v}))" value-key="id" /></label></div><p class="muted">{{t('adminPortal.taxNotice')}}</p><fieldset v-if="assets"><legend>{{t('adminPortal.brandAssets')}}</legend><label>{{t('adminPortal.logo')}}<input type="file" accept="image/png,image/jpeg" @change="$emit('asset',{kind:'logo',file:$event.target.files[0]})" /></label><label><input v-model="stampApproved" type="checkbox" />{{t('adminPortal.stampConsent')}}</label><label>{{t('adminPortal.stamp')}}<input type="file" accept="image/png,image/jpeg" :disabled="!stampApproved" @change="$emit('asset',{kind:'stamp',file:$event.target.files[0],approved:stampApproved})" /></label></fieldset><Button type="submit" :text="t('adminPortal.save')" :disabled="busy" /></form></template>

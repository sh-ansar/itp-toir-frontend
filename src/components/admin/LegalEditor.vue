<script setup>
import {reactive} from 'vue'
import {Button,TextInput,Select,Switch} from '@itpmining/vue-basic-components'
import {useI18n} from 'vue-i18n'
const props=defineProps({document:Object,busy:Boolean});const emit=defineEmits(['save']);const {t}=useI18n()
const value=reactive({type:'offer',locale:'ru',jurisdiction:'KZ',title:'',body:'',acceptance:'accepted',required:false,effective_at:null,...props.document})
const options=values=>values.map(id=>({id,name:t('adminPortal.'+id)}))
function save(){const {type,locale,jurisdiction,title,body,acceptance,required,effective_at}=value;emit('save',{type,locale,jurisdiction,title,body,acceptance,required,effective_at})}
</script>
<template><form class="editor" @submit.prevent="save"><p class="muted">{{t('adminPortal.legalDraftNotice')}}</p><div class="form-grid"><label>{{t('adminPortal.documentType')}}<Select v-model="value.type" :options="options(['offer','tariff_policy','acceptable_use','personal_data_consent','privacy'])" value-key="id" /></label><label>{{t('adminPortal.language')}}<Select v-model="value.locale" :options="['ru','en','ge','de','fr','es'].map(id=>({id,name:id.toUpperCase()}))" value-key="id" /></label><label>{{t('adminPortal.jurisdiction')}}<Select v-model="value.jurisdiction" :options="['KZ','GE'].map(id=>({id,name:id}))" value-key="id" /></label></div><label>{{t('adminPortal.title')}}<TextInput v-model="value.title" required /></label><label>{{t('adminPortal.content')}}<textarea v-model="value.body" rows="16" required /></label><div class="form-grid"><label>{{t('adminPortal.acceptance')}}<Select v-model="value.acceptance" :options="options(['accepted','acknowledged','consented'])" value-key="id" /></label><label>{{t('adminPortal.effectiveAt')}}<TextInput v-model="value.effective_at" type="datetime-local" /></label><Switch v-model="value.required" :text="t('adminPortal.required')" /></div><Button type="submit" :text="t('adminPortal.saveDraft')" :disabled="busy" /></form></template>

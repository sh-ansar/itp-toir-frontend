<script setup>
import { reactive, ref } from 'vue'
import { Button,TextInput,Switch,Select } from '@itpmining/vue-basic-components'
import {useI18n} from 'vue-i18n'
const props=defineProps({plan:Object,modules:Array,busy:Boolean});const emit=defineEmits(['save']);const {t}=useI18n()
const value=reactive(props.plan?{...JSON.parse(JSON.stringify(props.plan.terms)),code:props.plan.code,is_public:props.plan.is_public,display_order:props.plan.display_order}:{code:'',names:{ru:'',en:'',ge:''},description:'',price_minor:0,currency:'KZT',period_months:1,is_public:false,display_order:0,limits:{users:null,companies:null,storage_bytes:null,max_file_bytes:null},modules:Object.fromEntries((props.modules||[]).map(k=>[k,true]))})
const units={users:1,companies:1,storage_bytes:1073741824,max_file_bytes:1048576}
const price=ref((Number(value.price_minor)/100).toFixed(2))
function save(){const m=/^(\d{1,10})(?:[.,](\d{1,2}))?$/.exec(price.value);if(!m)return;value.price_minor=Number(m[1])*100+Number((m[2]||'').padEnd(2,'0'));emit('save',value)}
function limit(key,e){value.limits[key]=e===''?null:Math.round(Number(e)*units[key])}
</script>
<template><form class="editor" @submit.prevent="save">
<label>{{t('adminPortal.code')}}<TextInput v-model="value.code" required /></label>
<div class="form-grid"><label v-for="lang in ['ru','en','ge']" :key="lang">{{t('adminPortal.name')}} ({{lang.toUpperCase()}})<TextInput v-model="value.names[lang]" required /></label></div>
<label>{{t('adminPortal.description')}}<textarea v-model="value.description" rows="3" /></label>
<div class="form-grid"><label>{{t('adminPortal.priceMinor')}}<TextInput v-model="price" type="text" inputmode="decimal" required /></label><label>{{t('adminPortal.currency')}}<Select v-model="value.currency" :options="['KZT','GEL','USD','EUR'].map(v=>({id:v,name:v}))" value-key="id" /></label><label>{{t('adminPortal.periodMonths')}}<TextInput v-model="value.period_months" type="number" min="1" max="120" required /></label></div>
<div class="form-grid"><label v-for="key in Object.keys(units)" :key="key">{{t('adminPortal.limit_'+key)}}<TextInput :model-value="value.limits[key]===null?'':String(value.limits[key]/units[key])" type="number" min="0.000001" @update:model-value="limit(key,$event)" /><span class="muted">{{t('adminPortal.unlimitedHint')}}</span></label></div>
<fieldset><legend>{{t('adminPortal.modules')}}</legend><div class="form-grid"><Switch v-for="key in modules" :key="key" v-model="value.modules[key]" :text="t('portalConfig.moduleNames.'+key)" /></div></fieldset>
<div class="form-grid"><Switch v-model="value.is_public" :text="t('adminPortal.publicPlan')" /><label>{{t('adminPortal.displayOrder')}}<TextInput v-model="value.display_order" type="number" /></label></div>
<p class="muted">{{t('adminPortal.versionNotice')}}</p><Button type="submit" :text="t('adminPortal.saveDraft')" :disabled="busy" /></form></template>

<script setup>
import {onMounted,ref,watch} from 'vue'
import {useI18n} from 'vue-i18n'
import api from '@/api'
const props=defineProps({modelValue:Object,documentLocale:String});const emit=defineEmits(['update:modelValue']);const {locale,t}=useI18n(),docs=ref([])
async function load(){docs.value=(await api.get('/portal/legal',{params:{locale:props.documentLocale||locale.value,jurisdiction:'KZ'}})).data.data;emit('update:modelValue',{})}
watch(locale,load);onMounted(load)
function change(type,value){emit('update:modelValue',{...props.modelValue,[type]:value})}
</script>
<template><div class="legal-choices"><label v-for="d in docs" :key="d.id"><input type="checkbox" :checked="!!modelValue?.[d.type]" :required="!!d.required" @change="change(d.type,$event.target.checked)" /><span>{{t('adminPortal.'+d.acceptance)}}: <router-link :to="'/legal/'+d.id" target="_blank">{{d.title}}</router-link></span></label><router-link to="/legal" target="_blank">{{t('adminPortal.documents')}}</router-link></div></template>
<style scoped>.legal-choices{display:flex;flex-direction:column;gap:12px;margin:16px 0;font-size:13px}.legal-choices label{display:flex;align-items:flex-start;gap:10px;line-height:1.5}.legal-choices input{min-width:20px;height:20px;accent-color:var(--accent-base,#069bdd)}</style>

<script setup>
import {onMounted,ref} from 'vue'
import {useI18n} from 'vue-i18n'
import {useRouter} from 'vue-router'
import {Button,Icon} from '@itpmining/vue-basic-components'
import {useSessionStore} from '@/stores/session'

import api from '@/api/mroCommercialAdapter'
const {t,locale}=useI18n(),router=useRouter(),auth=useSessionStore(),plans=ref([]),loading=ref(true),failed=ref(false)
async function load(){loading.value=true;failed.value=false;try{plans.value=(await api.get('/public/plans',{silent:true})).data.data}catch{failed.value=true}finally{loading.value=false}}
onMounted(load)
const name=p=>p.terms.names[locale.value==='ka'?'ge':locale.value]||p.terms.names.en||p.code
const money=p=>new Intl.NumberFormat(locale.value==='ge'?'ka':locale.value,{style:'currency',currency:p.terms.currency,maximumFractionDigits:0}).format(p.terms.price_minor/100)
const limit=(n,cap)=>{const value=Math.min(Number(n??cap),cap);return (value>=1073741824?(value/1073741824).toLocaleString(locale.value==='ge'?'ka':locale.value,{maximumFractionDigits:2})+' GiB':(value/1048576).toLocaleString(locale.value==='ge'?'ka':locale.value,{maximumFractionDigits:2})+' MiB')}
function choose(plan){
  try { sessionStorage.setItem('mro-selected-plan', plan.code) } catch {}
  router.push(auth.session?{path:'/billing',query:{plan:plan.code}}:{path:'/register',query:{plan:plan.code}})
}
</script>
<template><div class="public-tariffs" :aria-busy="loading">
 <p v-if="loading" role="status">{{t('adminPortal.loading')}}</p><div v-else-if="failed" role="alert"><p>{{t('adminPortal.loadFailed')}}</p><Button :text="t('publicPortal.retry')" color="secondary" @click="load" /></div><p v-else-if="!plans.length">{{t('mroPublic.noPublishedPlans')}}</p>
 <div v-else class="public-tariff-grid"><article v-for="plan in plans" :key="plan.id" class="public-tariff" :data-plan="plan.code"><h3>{{name(plan)}}</h3><p class="public-tariff-price">{{money(plan)}}</p><p class="public-tariff-note">{{t('adminPortal.monthlyTaxIncluded')}}</p><ul class="public-tariff-limits"><li>{{t('adminPortal.limit_users')}}: {{plan.terms.limits.users??t('mroPublic.unlimited')}}</li><li>{{t('adminPortal.limit_companies')}}: {{plan.terms.limits.companies??t('mroPublic.unlimited')}}</li><li>{{t('adminPortal.storagePerCompany')}}: {{limit(plan.terms.limits.storage_bytes,1073741824)}}</li><li>{{t('adminPortal.fileLimit')}}: {{limit(plan.terms.limits.max_file_bytes,36700160)}}</li></ul><ul class="public-tariff-modules"><li v-for="(enabled,key) in plan.terms.modules" :key="key"><Icon :icon="enabled?'Done':'Hide'" /><span>{{t('portalConfig.moduleNames.'+key)}}</span><span v-if="!enabled">—</span></li></ul><Button :text="t('publicPortal.selectPlan')" @click="choose(plan)" /></article></div>
 <p class="public-tariff-help">{{t('publicPortal.paymentHint')}} <router-link to="/legal/tariff-policy">{{t('publicPortal.tariffPolicy')}}</router-link></p>
</div></template>
<style scoped>
.public-tariffs{text-align:left;min-width:0}.public-tariff-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:24px}.public-tariff{display:flex;flex-direction:column;padding:28px;gap:12px;border:1px solid var(--border-base,#dce9ef);border-radius:12px;background:var(--surface-base,#fff);color:var(--text-base,#102b36);min-width:0}.public-tariff h3{font-size:24px;font-weight:500;margin:0}.public-tariff-price{font-size:clamp(26px,3vw,36px);font-weight:500;letter-spacing:-.04em;margin:0!important}.public-tariff-note{font-size:13px;color:var(--text-weak,#688696);margin:0!important}.public-tariff ul{padding:0;list-style:none;margin:8px 0;font-size:14px;line-height:1.7}.public-tariff-limits{padding-bottom:14px!important;border-bottom:1px solid var(--border-base,#dce9ef)}.public-tariff-modules li{display:flex;align-items:center;gap:8px;margin:6px 0}.public-tariff-modules :deep(svg){width:18px;height:18px;flex-shrink:0;color:var(--accent-base,#009cde)}.public-tariff :deep(button){margin-top:auto;width:100%}.public-tariff-help{font-size:14px;line-height:1.7;margin:24px 0 0!important}.public-tariff-help a{color:var(--accent-base,#009cde)}@media(max-width:760px){.public-tariff-grid{grid-template-columns:1fr}.public-tariff{padding:24px}}
</style>

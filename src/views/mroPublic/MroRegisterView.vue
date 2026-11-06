<script setup lang="ts">
import { reactive, ref, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import api from '../../api/mroCommercialAdapter'
import PublicSiteHeader from '../../components/public/PublicSiteHeader.vue'
import PublicSiteFooter from '../../components/public/PublicSiteFooter.vue'
const { t, locale } = useI18n()
const route = useRoute(), router = useRouter()
const form = reactive({ name:'',email:'',company_name:'' })
const legalChoices=reactive<Record<string, boolean>>({})
const plan = computed(() => typeof route.query.plan==='string'?route.query.plan:'')
const busy=ref(false),error=ref(''),sent=ref(false)
const checking=ref(true),enabled=ref(false)
type PublicLegal = { id:number; type:string; title:string; sha256:string; required:boolean }
const legalDocs=ref<PublicLegal[]>([])
const legalReady=computed(()=>enabled.value && ['offer','privacy'].every(type=>legalDocs.value.some(doc=>doc.type===type)))
const acceptedRequired=computed(()=>legalDocs.value.filter(doc=>doc.required || ['offer','privacy'].includes(doc.type)).every(doc=>legalChoices[doc.type]===true))
let request=0
async function checkReadiness(){
 const current=++request
 checking.value=true
 try {
  const language=locale.value==='ka'?'ge':locale.value
  const [plans,legal]=await Promise.all([
   api.get('/public/plans'),
   api.get('/public/legal',{params:{locale:language,jurisdiction:'KZ'}})
  ])
  if(current!==request)return
  enabled.value=plans.data?.registration_enabled === true
  legalDocs.value=Array.isArray(legal.data?.data)?legal.data.data:[]
  for(const doc of legalDocs.value) {
   if(!(doc.type in legalChoices))legalChoices[doc.type]=false
  }
 } catch {
  if(current===request){enabled.value=false;legalDocs.value=[]}
 } finally {if(current===request)checking.value=false}
}
onMounted(checkReadiness)
watch(locale,checkReadiness)
async function submit(){
 if(busy.value || !legalReady.value || !acceptedRequired.value) return
 busy.value=true;error.value=''
 try {
  await api.post('/public/register/start',{...form,consent:true,legal_choices:{...legalChoices},locale:locale.value,plan:plan.value||undefined})
  sent.value=true
 } catch(cause) { error.value=cause instanceof Error?cause.message:t('mroPublic.failed') }
 finally{busy.value=false}
}
</script>
<template>
<div class="mro-public-page">
 <PublicSiteHeader />
 <main class="mro-register-main">
  <div class="mro-register-copy">
   <span class="eyebrow">ITP ТОиР</span>
   <h1>{{t('mroPublic.registration')}}</h1>
   <p>{{t('mroPublic.regHint')}}</p>
   <RouterLink to="/pricing">{{t('adminPortal.plans')}}</RouterLink>
  </div>
  <section class="mro-form-card" aria-labelledby="mro-register-title">
   <template v-if="sent">
    <h2 id="mro-register-title">{{t('mroPublic.emailSent')}}</h2>
    <p>{{t('mroPublic.mailInstruction')}}</p>
    <RouterLink to="/login">{{t('mroPublic.backLogin')}}</RouterLink>
   </template>
   <template v-else-if="checking">
    <h2 id="mro-register-title">{{t('adminPortal.loading')}}</h2>
   </template>
   <template v-else-if="!legalReady">
    <h2 id="mro-register-title">{{t('mroPublic.registrationUnavailable')}}</h2>
    <p>{{t('mroPublic.registrationUnavailableHint')}}</p>
    <RouterLink to="/legal">{{t('mroPublic.legalDocs')}}</RouterLink>
   </template>
   <template v-else>
    <h2 id="mro-register-title">{{t('mroPublic.companyAccess')}}</h2>
    <p v-if="plan" class="muted">{{t('adminPortal.plan')}}: {{plan}}</p>
    <form @submit.prevent="submit">
     <label>{{t('mroPublic.name')}}<input v-model.trim="form.name" autocomplete="name" required minlength="2" maxlength="120"/></label>
     <label>{{t('mroPublic.email')}}<input v-model.trim="form.email" type="email" autocomplete="email" required/></label>
     <label>{{t('mroPublic.company')}}<input v-model.trim="form.company_name" autocomplete="organization" required minlength="2" maxlength="200"/></label>
     <div class="mro-legal-versions">
      <p>{{t('mroPublic.reviewLegal')}}:</p>
      <ul><li v-for="doc in legalDocs" :key="doc.id">
       <label class="mro-consent">
        <input v-model="legalChoices[doc.type]" type="checkbox" :required="doc.required || ['offer','privacy'].includes(doc.type)"/>
        <span><RouterLink :to="'/legal/version/'+doc.id" target="_blank">{{doc.title}}</RouterLink><span v-if="doc.required || ['offer','privacy'].includes(doc.type)"> *</span></span>
       </label>
      </li></ul>
      <p>{{t('mroPublic.acceptTerms')}}</p>
     </div>
     <p v-if="error" role="alert" class="mro-error">{{error}}</p>
     <button type="submit" :disabled="busy||!acceptedRequired">{{busy?t('adminPortal.loading'):t('mroPublic.send')}}</button>
    </form>
    <p class="muted">{{t('mroPublic.haveAccount')}} <RouterLink to="/login">{{t('mroPublic.backLogin')}}</RouterLink></p>
   </template>
  </section>
 </main>
 <PublicSiteFooter />
</div>
</template>
<style scoped>
.mro-public-page{background:#f5f9fa;min-height:100dvh;color:#123441;display:flex;flex-direction:column}
.mro-register-main{width:100%;max-width:1120px;margin:0 auto;padding:80px 24px 100px;box-sizing:border-box;display:grid;grid-template-columns:1fr 440px;gap:72px;align-items:start;flex:1}
.mro-register-copy h1{font-size:clamp(36px,4.5vw,64px);line-height:1.05;font-weight:600;letter-spacing:-.05em;margin:16px 0}
.mro-register-copy p{font-size:18px;line-height:1.7;color:#587381;max-width:500px}
.mro-register-main a{color:#078fd1;text-decoration:none}
.eyebrow{font-size:13px;text-transform:uppercase;letter-spacing:.1em;color:#078fd1;font-weight:600}
.mro-form-card{background:#fff;border:1px solid #dfe9ee;border-radius:14px;padding:34px;box-shadow:0 14px 36px #12465c0d}
.mro-form-card h2{margin:0 0 22px;font-size:23px;font-weight:600}
.mro-form-card form{display:grid;gap:18px}
.mro-form-card label{display:grid;gap:7px;font-size:14px;font-weight:500}
.mro-form-card input:not([type=checkbox]){width:100%;box-sizing:border-box;min-height:44px;padding:12px;border:1px solid #cbdfe7;border-radius:8px;font:inherit}
.mro-form-card input:focus-visible{outline:2px solid #078fd1;outline-offset:2px}
.mro-form-card button{width:100%;border:0;border-radius:8px;background:#078fd1;color:#fff;padding:14px;cursor:pointer;font:inherit}
.mro-form-card button:disabled{opacity:.6;cursor:not-allowed}
.mro-form-card .mro-consent{display:flex;align-items:flex-start;font-size:13px;gap:9px;line-height:1.5}
.mro-consent input{margin-top:4px}
.mro-legal-versions{font-size:13px;line-height:1.6}
.mro-legal-versions p{margin:0 0 6px;color:#536b78}
.mro-legal-versions ul{margin:0;padding-left:20px}
.mro-legal-versions li{margin:4px 0;list-style:none}
.mro-legal-versions ul{padding-left:0}
.mro-legal-versions .mro-consent{display:flex;align-items:flex-start;gap:8px}.muted{font-size:13px;color:#68818c}.mro-error{color:#ad333a;font-size:14px}
@media(max-width:850px){.mro-register-main{grid-template-columns:1fr;gap:28px;padding:38px 20px 64px}.mro-form-card{max-width:560px}}
@media(max-width:460px){.mro-register-main{padding:26px 14px 42px}.mro-form-card{padding:22px}}
</style>

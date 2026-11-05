<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import api from '../../api/mroCommercialAdapter'
const {t,locale}=useI18n()
interface Plan { id:number;code:string;terms:{names:Record<string,string>;price_minor:number;currency:string;period_months:number} }
interface Invoice { id:number;number:string|null;status:string;currency:string;total_minor:number;due_date:string }
interface Legal { type:string;title:string;required:boolean }
const plans=ref<Plan[]>([]),subscription=ref<any>(null),invoices=ref<Invoice[]>([]),legal=ref<Legal[]>([])
const selected=ref(0),months=ref(1),date=ref(new Date().toISOString().slice(0,10)),approved=ref<Record<string,boolean>>({})
const loading=ref(true),busy=ref(false),message=ref(''),error=ref(''),canBilling=ref(false),canInvoice=ref(false)
const active= computed(()=>plans.value.find(x=>x.id===selected.value))
const money=(p:number,c:string)=>new Intl.NumberFormat(locale.value==='ka'?'ka':locale.value,{style:'currency',currency:c}).format(p/100)
const name=(p:Plan)=>p.terms.names[locale.value==='ka'?'ge':locale.value]||p.terms.names.ru||p.code
const pdf=(id:number)=>api.defaults.baseURL+'/commercial/invoices/'+id+'/pdf'
async function refresh(){
 loading.value=true;error.value=''
 try{
  const [p,s,i,d]=await Promise.all([
    api.get('/public/plans'),api.get('/commercial/subscription'),
    api.get('/commercial/invoices'),api.get('/public/legal',{params:{locale:locale.value==='ka'?'ge':locale.value,jurisdiction:'KZ'}})
  ])
  plans.value=p.data?.data||[]
  subscription.value=s.data?.data
  canBilling.value=Boolean(s.data?.can_manage_billing)
  canInvoice.value=Boolean(s.data?.can_generate_invoice && s.data?.invoice_issuance_enabled)
  invoices.value=i.data?.data||[]
  legal.value=d.data?.data||[]
  for(const v of legal.value) approved.value[v.type]=false
  if(!selected.value && plans.value.length)selected.value=plans.value[0].id
 }catch(e){error.value=e instanceof Error?e.message:t('mroPublic.failed')}
 finally{loading.value=false}
}
async function createInvoice(){
 if(!active.value||busy.value||!canInvoice.value)return
 busy.value=true;error.value='';message.value=''
 try{
  const result=await api.post('/commercial/invoices',{plan_version_id:active.value.id,months:months.value,starts_on:date.value,request_id:crypto.randomUUID(),legal_choices:approved.value})
  message.value=t('mroPublic.invoiceCreated')+' '+String(result.data?.data?.number||'')
  await refresh()
 }catch(e){error.value=e instanceof Error?e.message:t('mroPublic.failed')}
 finally{busy.value=false}
}
async function upload(invoice:number,event:Event){
 const input=event.target as HTMLInputElement
 const file=input.files?.[0]
 if(!file)return
 const form=new FormData();form.set('file',file)
 busy.value=true;error.value=''
 try{await api.post('/commercial/invoices/'+invoice+'/proof',form);message.value=t('mroPublic.proofSent')}
 catch(e){error.value=e instanceof Error?e.message:t('mroPublic.failed')}
 finally{busy.value=false;input.value=''}
}
onMounted(refresh)
</script>
<template>
<section class="billing-page">
 <header><h1>{{t('mroPublic.billing')}}</h1><p>{{t('mroPublic.billingHint')}}</p></header>
 <p v-if="loading" role="status">{{t('adminPortal.loading')}}</p>
 <p v-if="error" role="alert" class="billing-error">{{error}}</p>
 <p v-if="message" role="status" class="billing-success">{{message}}</p>
 <template v-if="!loading">
  <div class="billing-grid">
   <article class="billing-card">
    <h2>{{t('mroPublic.currentPlan')}}</h2>
    <p v-if="subscription"><strong>{{subscription.snapshot?.terms?.names?.[locale==='ka'?'ge':locale]||subscription.snapshot?.code}}</strong></p>
    <p v-else>{{t('mroPublic.noPlan')}}</p>
    <p v-if="subscription">{{t('mroPublic.status')}}: {{subscription.status}} <span v-if="subscription.ends_at"> — {{subscription.ends_at}}</span></p>
   </article>
   <article class="billing-card">
    <h2>{{t('mroPublic.choosePlan')}}</h2>
    <div v-for="plan in plans" :key="plan.id" class="plan-radio">
     <label><input v-model="selected" type="radio" :value="plan.id"/><span><strong>{{name(plan)}}</strong><small>{{money(plan.terms.price_minor,plan.terms.currency)}} / {{plan.terms.period_months}} {{t('mroPublic.months')}}</small></span></label>
    </div>
    <p v-if="!plans.length">{{t('mroPublic.noPublishedPlans')}}</p>
    <template v-if="active">
     <label class="billing-field">{{t('mroPublic.months')}}<input v-model.number="months" type="number" min="1" max="120"/></label>
     <label class="billing-field">{{t('mroPublic.startDate')}}<input v-model="date" type="date"/></label>
     <div v-for="doc in legal" :key="doc.type" class="legal-choice">
      <label><input v-model="approved[doc.type]" type="checkbox"/><span>{{doc.title}}</span></label>
     </div>
     <button :disabled="!canBilling||!canInvoice||busy||legal.some(doc=>doc.required&&!approved[doc.type])" @click="createInvoice">{{t('mroPublic.createInvoice')}}</button>
     <p v-if="!canInvoice" class="billing-muted">{{t('mroPublic.billingUnavailable')}}</p>
    </template>
   </article>
  </div>
  <article class="billing-card">
   <h2>{{t('mroPublic.invoiceHistory')}}</h2>
   <div class="invoice-list">
    <div v-for="inv in invoices" :key="inv.id" class="invoice-row">
     <div><strong>{{inv.number||'#'+inv.id}}</strong><small>{{inv.status}} · {{money(inv.total_minor,inv.currency)}} · {{inv.due_date}}</small></div>
     <div class="invoice-actions">
      <a v-if="inv.number" :href="pdf(inv.id)" target="_blank" rel="noopener">{{t('mroPublic.openPdf')}}</a>
      <label v-if="['issued','awaiting_payment','overdue'].includes(inv.status)" class="upload">{{t('mroPublic.uploadProof')}}<input type="file" accept=".pdf,.jpg,.jpeg,.png" :disabled="busy" @change="upload(inv.id,$event)" /></label>
     </div>
    </div>
    <p v-if="!invoices.length">{{t('mroPublic.noInvoices')}}</p>
   </div>
  </article>
 </template>
</section>
</template>
<style scoped>
.billing-page{max-width:1180px;margin:0 auto;padding:12px 0 64px;color:var(--text-main,#173441)}
.billing-page>header h1{font-size:30px;font-weight:600;margin:0 0 8px}.billing-page>header p{color:#67818f;margin:0 0 32px}
.billing-grid{display:grid;grid-template-columns:1fr 1.3fr;gap:24px;margin-bottom:24px}
.billing-card{background:var(--surface,#fff);padding:24px;border:1px solid #dce8ee;border-radius:12px;min-width:0}
.billing-card h2{font-size:20px;font-weight:600;margin:0 0 22px}
.plan-radio{padding:12px 0;border-bottom:1px solid #e4edf1}.plan-radio label,.legal-choice label{display:flex;align-items:flex-start;gap:12px;cursor:pointer}
.plan-radio input{margin-top:7px}.plan-radio small,.invoice-row small{display:block;color:#6a8794;font-size:13px;margin-top:6px}
.billing-field{display:grid;gap:6px;margin:18px 0;font-size:14px}.billing-field input{max-width:320px;border:1px solid #c9dce5;border-radius:7px;padding:11px;color:inherit;font:inherit}
.legal-choice{margin:12px 0;font-size:13px}.billing-card button{border:0;border-radius:8px;background:#078fd1;color:#fff;padding:12px 18px;cursor:pointer;margin-top:12px}
.billing-card button:disabled{opacity:.5;cursor:not-allowed}
.invoice-row{display:flex;align-items:center;justify-content:space-between;gap:20px;padding:18px 0;border-top:1px solid #e7eef2}
.invoice-actions{display:flex;align-items:center;gap:18px;font-size:14px}.invoice-actions a,.upload{color:#078fd1;text-decoration:none;cursor:pointer}.upload input{display:block;width:180px;font-size:12px}
.billing-error{color:#ba3343}.billing-success{color:#24825b}.billing-muted{font-size:13px;color:#6b8795}
@media(max-width:850px){.billing-grid{grid-template-columns:1fr}.invoice-row{align-items:flex-start;flex-direction:column}}
</style>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { AccountMenu, CompanySwitcher, AppSwitcher, Switch } from '@itpmining/vue-basic-components'
import { useSessionStore } from '../../stores/session'
import { usePreferencesStore } from '../../stores/preferences'
import api from '../../api/mroCommercialAdapter'

const emit = defineEmits<{ error:[message:string] }>()
const auth = useSessionStore()
const ui = usePreferencesStore()
const router = useRouter()
const busy = ref(false)
const isPlatformAdmin = ref(false)
const localMute = ref(false)
const localOffline = ref(false)
const menu = ref<{ close:(restore?:boolean)=>void }|null>(null)
const dict = {
  ru: { menu:'Меню пользователя',company:'Компания',system:'Система',
    portal:'Портал',hrm:'Кадры',inventory:'Инвентаризация',mro:'ТОиР',
    profile:'Мой кабинет',settings:'Настройки компании',admin:'Супер-админка',
    mute:'Не беспокоить (в этом браузере)',offline:'Не в сети (локально)',
    logout:'Выйти',online:'Онлайн',error:'Не удалось переключить компанию' },
  en: { menu:'Account menu',company:'Company',system:'System',
    portal:'Portal',hrm:'HRM',inventory:'Inventory',mro:'Maintenance',
    profile:'My profile',settings:'Company settings',admin:'Platform admin',
    mute:'Do not disturb (this browser)',offline:'Appear offline (local)',
    logout:'Sign out',online:'Online',error:'Cannot switch company' },
  ka: { menu:'მომხმარებლის მენიუ',company:'კომპანია',system:'სისტემა',
    portal:'პორტალი',hrm:'კადრები',inventory:'ინვენტარიზაცია',mro:'ტექნიკური მომსახურება',
    profile:'ჩემი პროფილი',settings:'კომპანიის პარამეტრები',admin:'სუპერადმინი',
    mute:'არ შემაწუხოთ (ამ ბრაუზერში)',offline:'ოფლაინ (ლოკალურად)',
    logout:'გასვლა',online:'ონლაინ',error:'კომპანიის შეცვლა ვერ მოხერხდა' }
} as const
const labels = computed(()=>dict[ui.locale])
const user = computed(()=>({name:auth.session?.user.name || 'ITP',email:auth.session?.user.email || ''}))
const companyOptions = computed(()=>(auth.session?.companies||[]).map(x=>({id:x.id,label:x.name})))
const systems = computed(()=>[
  {id:'portal',label:labels.value.portal},
  {id:'hrm',label:labels.value.hrm},
  {id:'inventory',label:labels.value.inventory},
  {id:'mro',label:labels.value.mro}
])
const paths:Record<string,string> = {portal:'/',hrm:'/hrm/',inventory:'/inventory/',mro:'/mro/'}
const canManageCompany = computed(()=>['owner','admin'].includes(auth.session?.active_role||''))
const menuItems = computed(()=>[
  {id:'profile',label:labels.value.profile,icon:'User'},
  ...(canManageCompany.value?[{id:'settings',label:labels.value.settings,icon:'Settings'}]:[]),
  ...(isPlatformAdmin.value?[{id:'admin',label:labels.value.admin,icon:'Shield'}]:[]),
  {id:'separator',label:'',separator:true},
  {id:'logout',label:labels.value.logout,icon:'Logout',danger:true,disabled:busy.value}
])
function readStored(){
  try{
    localMute.value=localStorage.getItem('mro-header-mute')==='true'
    localOffline.value=localStorage.getItem('mro-header-offline')==='true'
  }catch{/* Private browsing may disable storage. */}
}
function setMute(value:boolean){
  localMute.value=value
  try{localStorage.setItem('mro-header-mute',String(value))}catch{}
}
function setOffline(value:boolean){
  localOffline.value=value
  try{localStorage.setItem('mro-header-offline',String(value))}catch{}
}
async function verifyAdmin(){
  isPlatformAdmin.value=false
  const id=auth.session?.user.id
  if(!id)return
  try {
    await api.get('/platform-admin/access')
    if(auth.session?.user.id===id)isPlatformAdmin.value=true
  }catch{isPlatformAdmin.value=false}
}
function onOpen(open:boolean){
  if(open){readStored();void verifyAdmin()}
}
watch(()=>auth.session?.user.id,()=>{isPlatformAdmin.value=false})
async function chooseCompany(value:string|number){
  const id=Number(value)
  if(busy.value||!Number.isInteger(id)||id===auth.session?.active_company_id)return
  busy.value=true
  try{
    await auth.chooseCompany(id)
    menu.value?.close()
    await router.push('/dashboard')
  }catch(cause){
    emit('error',cause instanceof Error?cause.message:labels.value.error)
  }finally{busy.value=false}
}
function switchSystem(value:string|number){
  const id=String(value)
  if(id==='mro'||!Object.hasOwn(paths,id))return
  // User explicitly chose a different application; tenant authorization remains server-side.
  window.location.assign(paths[id])
}
async function onAction(item:{id:string|number},event:Event){
  event.preventDefault()
  const id=String(item.id)
  if(id==='profile'||id==='settings'||id==='admin'){
    await router.push('/'+id)
    return
  }
  if(id!=='logout'||busy.value)return
  busy.value=true
  try{
    await auth.logout()
    await router.replace({name:'login'})
  }catch(cause){
    emit('error',cause instanceof Error?cause.message:labels.value.logout)
  }finally{busy.value=false}
}
onMounted(readStored)
</script>
<template>
  <div class="mro-account-anchor">
    <AccountMenu ref="menu" :user="user" :items="menuItems"
      :menu-label="labels.menu" :status="localOffline ? labels.offline : labels.online"
      @open-change="onOpen" @action="onAction">
      <template #context>
        <div class="mro-account-context" @keydown.esc="menu?.close(true)" @keydown.stop>
          <CompanySwitcher :model-value="auth.session?.active_company_id ?? ''"
            :options="companyOptions" :label="labels.company" :disabled="busy"
            @update:model-value="chooseCompany"/>
          <AppSwitcher model-value="mro" :options="systems" :label="labels.system"
            @update:model-value="switchSystem"/>
          <div class="mro-account-context__switch">
            <Switch :model-value="localMute" @update:model-value="setMute">{{labels.mute}}</Switch>
          </div>
          <div class="mro-account-context__switch">
            <Switch :model-value="localOffline" @update:model-value="setOffline">{{labels.offline}}</Switch>
          </div>
        </div>
      </template>
    </AccountMenu>
  </div>
</template>
<style scoped>
.mro-account-anchor{position:relative;min-width:0;flex:none}
.mro-account-context{display:grid;gap:12px;min-width:0;padding:8px 0}
.mro-account-context__switch{display:flex;align-items:center;gap:9px;cursor:pointer;font-size:12px;line-height:1.4;color:var(--color-text)}
.mro-account-anchor :deep(.itp-ui-account__panel){z-index:150;min-width:300px;max-width:min(350px,calc(100vw - 24px));max-height:calc(100dvh - 76px);overflow-y:auto;color:var(--color-text);background:var(--color-surface-raised)}
@media(max-width:650px){.mro-account-anchor :deep(.itp-ui-account__panel){right:0;min-width:0;width:min(320px,calc(100vw - 16px))}.mro-account-anchor :deep(.itp-ui-account__name){display:none}}
</style>

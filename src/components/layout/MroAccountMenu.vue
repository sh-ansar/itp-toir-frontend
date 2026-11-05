<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  BellOff, Building2, Check, ChevronDown, ChevronRight, LayoutDashboard,
  LogOut, Package, ShieldCheck, UsersRound, Wrench, X,
} from 'lucide-vue-next'
import { useSessionStore } from '../../stores/session'
import { usePreferencesStore } from '../../stores/preferences'
import api from '../../api/mroCommercialAdapter'

const props = defineProps<{ open: boolean }>()
const emit = defineEmits<{ close: []; toggle: []; error: [message: string] }>()
const auth = useSessionStore()
const ui = usePreferencesStore()
const router = useRouter()
const route = useRoute()
const busy = ref(false)
const sub = ref<'status' | 'company' | 'system' | null>(null)
const status = ref<'online' | 'offline'>('online')
const localMute = ref(false)
const isPlatformAdmin = ref(false)

const dict = {
  ru: { status:'Статус', online:'Онлайн', offline:'Офлайн', company:'Компания',
    system:'Система', portal:'Портал', hrm:'Кадры', inventory:'Инвентаризация', mro:'ТОиР',
    mute:'Отключить уведомления', local:'Временно только в этом браузере',
    companySettings:'Настройки компании', admin:'Супер-админка', logout:'Выход',
    noCompanies:'Нет доступных компаний', error:'Не удалось переключить компанию' },
  en: { status:'Status', online:'Online', offline:'Offline', company:'Company',
    system:'System', portal:'Portal', hrm:'HRM', inventory:'Inventory', mro:'Maintenance',
    mute:'Mute notifications', local:'Temporarily local to this browser',
    companySettings:'Company settings', admin:'Platform admin', logout:'Sign out',
    noCompanies:'No available companies', error:'Cannot switch company' },
  ka: { status:'სტატუსი', online:'ონლაინ', offline:'ოფლაინ', company:'კომპანია',
    system:'სისტემა', portal:'პორტალი', hrm:'კადრები', inventory:'ინვენტარიზაცია', mro:'ტექნიკური მომსახურება',
    mute:'შეტყობინებების გამორთვა', local:'ამ ეტაპზე მხოლოდ ამ ბრაუზერში',
    companySettings:'კომპანიის პარამეტრები', admin:'პლატფორმის ადმინისტრირება', logout:'გასვლა',
    noCompanies:'ხელმისაწვდომი კომპანიები არ არის', error:'კომპანიის შეცვლა ვერ მოხერხდა' },
} as const
const labels = computed(() => dict[ui.locale])
const user = computed(() => auth.session?.user)
const companies = computed(() => auth.session?.companies || [])
const active = computed(() => companies.value.find(x => x.id === auth.session?.active_company_id))
const initials = computed(() => (user.value?.name || 'ITP').split(/\s+/).slice(0,2)
  .map(x => x[0]?.toUpperCase()).join(''))
const canManageCompany = computed(() => ['owner','admin'].includes(auth.session?.active_role || ''))
const systems = [
  { id:'portal',label:'portal',href:'/',icon:LayoutDashboard },
  { id:'hrm',label:'hrm',href:'/hrm/',icon:UsersRound },
  { id:'inventory',label:'inventory',href:'/inventory/',icon:Package },
  { id:'mro',label:'mro',href:'/mro/',icon:Wrench },
] as const
function readMute() {
  try { return localStorage.getItem('mro-header-mute') === 'true' } catch { return false }
}
function toggleMute() {
  localMute.value = !localMute.value
  try { localStorage.setItem('mro-header-mute', String(localMute.value)) } catch {}
}
async function verifyAdmin() {
  isPlatformAdmin.value = false
  if (!auth.session?.user) return
  const id = auth.session.user.id
  try {
    await api.get('/platform-admin/access')
    if (auth.session?.user.id === id) isPlatformAdmin.value = true
  } catch { isPlatformAdmin.value = false }
}
watch(() => props.open, open => {
  if (!open) { sub.value = null; return }
  localMute.value = readMute()
  void verifyAdmin()
})
watch(() => route.fullPath, () => emit('close'))
onMounted(() => { localMute.value = readMute() })
async function chooseCompany(id: number) {
  if (busy.value || id === auth.session?.active_company_id) { sub.value = null; return }
  busy.value = true
  try {
    await auth.chooseCompany(id) // Server validates membership and changes the active tenant.
    emit('close')
    await router.push('/dashboard')
  } catch (cause) {
    emit('error', cause instanceof Error ? cause.message : labels.value.error)
  } finally {
    busy.value = false
  }
}
async function leave() {
  busy.value = true
  try {
    await auth.logout()
    emit('close')
    await router.replace({name:'login'})
  } catch (cause) { emit('error', cause instanceof Error ? cause.message : labels.value.logout) }
  finally { busy.value = false }
}
async function go(path: string) { emit('close'); await router.push(path) }
function toggleSection(name: 'status' | 'company' | 'system') { sub.value = sub.value === name ? null : name }
</script>

<template>
  <div class="mro-account-anchor">
    <button type="button" class="mro-account-trigger" :aria-expanded="open" aria-haspopup="dialog"
      aria-controls="mro-account-popover" @click="emit('toggle')">
      <span class="mro-avatar">{{ initials }}</span>
      <span class="mro-trigger-copy"><strong>{{ user?.name || 'ITP' }}</strong><small>{{ active?.name || labels.company }}</small></span>
      <ChevronDown :size="15" aria-hidden="true"/>
    </button>
    <section v-if="open" id="mro-account-popover" class="mro-account-popover" role="dialog" :aria-label="labels.company">
      <header class="mro-pop-head">
        <span class="mro-avatar">{{ initials }}</span>
        <span class="mro-trigger-copy"><strong>{{ user?.name || 'ITP' }}</strong><small>{{ active?.name || labels.company }}</small></span>
        <button type="button" class="mro-close" aria-label="Close" @click="emit('close')"><X :size="18"/></button>
      </header>
      <div class="mro-selectors">
        <div>
          <button class="mro-selector" type="button" :aria-expanded="sub === 'status'" @click="toggleSection('status')">
            <span class="mro-online" :class="{'mro-online--off':status==='offline'}"/>
            {{ labels[status] }} <ChevronDown :size="16" class="mro-end"/>
          </button>
          <div v-if="sub==='status'" class="mro-options">
            <button v-for="s in (['online','offline'] as const)" :key="s" type="button" @click="status=s;sub=null">
              <span class="mro-online" :class="{'mro-online--off':s==='offline'}"/>{{ labels[s] }}
              <Check v-if="status===s" :size="15" class="mro-end"/>
            </button>
            <small>{{ labels.local }}</small>
          </div>
        </div>
        <div>
          <button class="mro-selector" type="button" :aria-expanded="sub === 'company'" @click="toggleSection('company')">
            <Building2 :size="18" class="mro-accent"/><span class="mro-ellipsis">{{ active?.name || labels.company }}</span>
            <ChevronDown :size="16" class="mro-end"/>
          </button>
          <div v-if="sub==='company'" class="mro-options">
            <small v-if="!companies.length">{{ labels.noCompanies }}</small>
            <button v-for="company in companies" :key="company.id" type="button"
              :aria-pressed="company.id===auth.session?.active_company_id" :disabled="busy"
              @click="chooseCompany(company.id)">
              <Building2 :size="17"/><span class="mro-ellipsis">{{ company.name }}</span>
              <Check v-if="company.id===auth.session?.active_company_id" :size="15" class="mro-end"/>
            </button>
          </div>
        </div>
        <div>
          <button class="mro-selector" type="button" :aria-expanded="sub === 'system'" @click="toggleSection('system')">
            <UsersRound :size="18" class="mro-accent"/>{{ labels.mro }} <ChevronDown :size="16" class="mro-end"/>
          </button>
          <div v-if="sub==='system'" class="mro-options">
            <a v-for="sys in systems" :key="sys.id" :href="sys.href"
              :aria-current="sys.id==='mro'?'page':undefined">
              <component :is="sys.icon" :size="17"/>{{ labels[sys.label] }}
              <Check v-if="sys.id==='mro'" :size="15" class="mro-end"/>
            </a>
          </div>
        </div>
      </div>
      <div class="mro-actions">
        <button type="button" class="mro-action" role="switch" :aria-checked="localMute"
          @click="toggleMute"><BellOff :size="18"/><span>{{ labels.mute }}</span>
          <span class="mro-switch" :class="{'mro-switch--on':localMute}"><i/></span></button>
        <button v-if="canManageCompany" type="button" class="mro-action" @click="go('/settings')">
          <Building2 :size="18"/><span>{{ labels.companySettings }}</span><ChevronRight :size="15" class="mro-end"/></button>
        <button v-if="isPlatformAdmin" type="button" class="mro-action" @click="go('/admin')">
          <ShieldCheck :size="18"/><span>{{ labels.admin }}</span><ChevronRight :size="15" class="mro-end"/></button>
      </div>
      <footer><button type="button" class="mro-signout" :disabled="busy" @click="leave">
        <LogOut :size="17"/>{{ labels.logout }}</button></footer>
    </section>
  </div>
</template>

<style scoped>
.mro-account-anchor{position:relative;flex:none}
.mro-account-trigger{display:flex;align-items:center;gap:9px;height:40px;padding:3px 7px;
  max-width:225px;border:1px solid transparent;border-radius:9px;background:transparent;
  color:var(--color-text);font:inherit;cursor:pointer;text-align:left}
.mro-account-trigger:hover,.mro-account-trigger[aria-expanded="true"]{border-color:var(--color-stroke);background:var(--color-hover)}
.mro-avatar{width:34px;height:34px;flex:0 0 34px;display:grid;place-items:center;
  background:var(--color-accent-soft);border:1px solid var(--color-primary-stroke);
  color:var(--color-primary);border-radius:50%;font-size:11px;font-weight:700}
.mro-trigger-copy{flex:1;min-width:0;display:grid;gap:2px}
.mro-trigger-copy strong,.mro-trigger-copy small{white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.mro-trigger-copy strong{font-size:12px;font-weight:650}
.mro-trigger-copy small{font-size:11px;color:var(--color-muted)}
.mro-account-popover{position:absolute;z-index:121;top:calc(100% + 12px);right:0;
  width:min(350px,calc(100vw - 24px));max-height:calc(100dvh - 80px);overflow-y:auto;
  border:1px solid var(--color-stroke);border-radius:12px;padding:12px;
  background:rgba(255,255,255,.89);
  background:color-mix(in srgb,var(--color-surface-raised) 85%,transparent);
  -webkit-backdrop-filter:blur(16px) saturate(1.18);backdrop-filter:blur(16px) saturate(1.18);
  box-shadow:0 14px 36px rgba(13,40,56,.16);color:var(--color-text)}
.mro-pop-head{display:flex;align-items:center;gap:9px;min-width:0;padding:4px 4px 14px;border-bottom:1px solid var(--color-stroke)}
.mro-close{margin-left:auto;display:grid;place-items:center;width:29px;height:29px;background:transparent;
  border:0;color:var(--color-muted);border-radius:6px;cursor:pointer}
.mro-selectors{display:grid;gap:6px;padding:13px 0;border-bottom:1px solid var(--color-stroke)}
.mro-selector{display:flex;align-items:center;gap:10px;width:100%;min-height:42px;padding:9px 11px;
  border:1px solid var(--color-stroke);border-radius:8px;background:var(--color-surface);
  color:var(--color-text);box-shadow:var(--shadow-control);font:inherit;font-size:13px;text-align:left;cursor:pointer}
.mro-selector:hover{border-color:var(--color-primary-stroke)}
.mro-ellipsis{white-space:nowrap;min-width:0;overflow:hidden;text-overflow:ellipsis}
.mro-online{flex:0 0 8px;width:8px;height:8px;border-radius:50%;background:#15a552}
.mro-online--off{background:#a9b9c2}
.mro-accent{color:var(--color-primary)}
.mro-end{margin-left:auto;flex:none;color:var(--color-muted)}
.mro-options{display:grid;gap:1px;padding:4px;border:1px solid var(--color-stroke);border-radius:8px;background:var(--color-surface)}
.mro-options button,.mro-options a{display:flex;align-items:center;gap:10px;min-height:37px;width:100%;
  padding:8px 10px;background:transparent;border:0;border-radius:6px;color:var(--color-text);
  font:inherit;font-size:12px;text-decoration:none;text-align:left;cursor:pointer}
.mro-options button:hover,.mro-options a:hover{background:var(--color-hover)}
.mro-options small{padding:5px 8px;color:var(--color-muted);font-size:11px}
.mro-actions{display:grid;gap:2px;padding:11px 0}
.mro-action{display:flex;align-items:center;gap:11px;min-height:43px;width:100%;padding:9px;
  border:0;border-radius:7px;background:transparent;color:var(--color-text);
  font:inherit;font-size:12px;font-weight:550;text-align:left;cursor:pointer}
.mro-action:hover{background:var(--color-hover)}
.mro-action>svg:first-child{color:var(--color-muted)}
.mro-action>span:nth-child(2){flex:1}
.mro-switch{display:flex;align-items:center;flex:0 0 31px;width:31px;height:18px;
  padding:2px;border-radius:16px;background:var(--color-stroke)}
.mro-switch i{display:block;width:14px;height:14px;border-radius:50%;background:#fff;box-shadow:0 1px 3px #0002}
.mro-switch--on{background:var(--color-primary)}
.mro-switch--on i{transform:translateX(13px)}
.mro-account-popover footer{padding-top:11px;border-top:1px solid var(--color-stroke)}
.mro-signout{display:flex;align-items:center;justify-content:center;gap:8px;min-height:38px;
  width:100%;border:1px solid var(--color-stroke);border-radius:8px;background:var(--color-surface);
  color:var(--color-text);font:inherit;font-size:12px;font-weight:650;cursor:pointer}
.mro-signout:hover{border-color:var(--color-primary-stroke);color:var(--color-primary)}
.mro-account-popover button:focus-visible,.mro-account-popover a:focus-visible,.mro-account-trigger:focus-visible{
  outline:2px solid var(--color-primary);outline-offset:2px}
@media(max-width:800px){.mro-account-trigger{width:44px;padding:4px}.mro-account-trigger>.mro-trigger-copy,.mro-account-trigger>svg{display:none}}
</style>

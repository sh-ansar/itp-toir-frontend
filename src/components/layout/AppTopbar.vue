<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Bell, Menu, Moon, Search, Sun, X } from 'lucide-vue-next'
import { usePreferencesStore } from '../../stores/preferences'
import MroAccountMenu from './MroAccountMenu.vue'

defineEmits<{ 'open-menu': [] }>()
const router = useRouter()
const route = useRoute()
const ui = usePreferencesStore()
const search = ref('')
const searchInput = ref<HTMLInputElement | null>(null)
const accountOpen = ref(false)
const shell = ref<HTMLElement|null>(null)
const error = ref('')
const placeholder = computed(() => ({
  ru:'Поиск по объектам и работам',en:'Search assets and work orders',ka:'ობიექტებისა და სამუშაოების ძიება',
})[ui.locale])
const searchLabel = computed(() => ({ru:'Поиск',en:'Search',ka:'ძიება'})[ui.locale])
const openMenuLabel = computed(() => ({ru:'Открыть меню',en:'Open menu',ka:'მენიუს გახსნა'})[ui.locale])
const themeLabel = computed(() => ({ru:'Сменить тему',en:'Switch theme',ka:'თემის შეცვლა'})[ui.locale])
const notificationsLabel = computed(() => ({ru:'Уведомления',en:'Notifications',ka:'შეტყობინებები'})[ui.locale])
function doSearch() {
  const q = search.value.trim()
  const target = ['/assets','/work-orders','/employees','/projects','/supplies'].includes(route.path)
    ? route.path : '/assets'
  void router.push({path:target,query:q?{search:q}:{}})
}
function clearSearch() {
  search.value=''
  doSearch()
  void nextTick(()=>searchInput.value?.focus())
}
function onPointer(event:PointerEvent) {
  if (!(event.target instanceof Element)) return
  if (!event.target.closest('.mro-account-anchor')) accountOpen.value=false
}
function onKey(event:KeyboardEvent) {
  if(event.key==='Escape' && accountOpen.value){accountOpen.value=false;return}
  if(event.key!=='/' || event.ctrlKey || event.metaKey || event.altKey || event.shiftKey)return
  if((event.target as Element|null)?.closest?.('input,textarea,select,[contenteditable="true"]'))return
  event.preventDefault()
  searchInput.value?.focus()
}
watch(()=>route.fullPath,()=>{
 accountOpen.value=false
 search.value=typeof route.query.search==='string'?route.query.search:''
},{immediate:true})
onMounted(()=>{document.addEventListener('pointerdown',onPointer);window.addEventListener('keydown',onKey)})
onBeforeUnmount(()=>{document.removeEventListener('pointerdown',onPointer);window.removeEventListener('keydown',onKey)})
</script>

<template>
  <header ref="shell" class="topbar toir-topbar mro-unified-header">
    <button class="icon-control mobile-hamburger" type="button"
      :aria-label="openMenuLabel" @click="$emit('open-menu')">
      <Menu :size="21" aria-hidden="true"/>
    </button>
    <form class="mro-unified-search" role="search" @submit.prevent="doSearch">
      <div class="mro-search-field">
        <Search :size="17" aria-hidden="true"/>
        <input ref="searchInput" v-model="search" type="search" :placeholder="placeholder"
          :aria-label="searchLabel" autocomplete="off"/>
        <button v-if="search" class="mro-search-clear" type="button" :aria-label="searchLabel" @click="clearSearch">
          <X :size="15" aria-hidden="true"/>
        </button>
      </div>
      <button class="mro-search-submit" type="submit" :aria-label="searchLabel" :title="searchLabel">
        <Search :size="18" aria-hidden="true"/>
      </button>
    </form>
    <div class="topbar-actions mro-header-actions">
      <RouterLink class="mro-header-icon" to="/notifications" :aria-label="notificationsLabel" :title="notificationsLabel">
        <Bell :size="20" aria-hidden="true"/>
      </RouterLink>
      <button class="mro-header-icon" type="button" :aria-label="themeLabel"
        :aria-pressed="ui.theme==='dark'" @click="ui.toggleTheme()">
        <Sun v-if="ui.theme==='dark'" :size="20" aria-hidden="true"/>
        <Moon v-else :size="20" aria-hidden="true"/>
      </button>
      <MroAccountMenu :open="accountOpen" @toggle="accountOpen=!accountOpen"
        @close="accountOpen=false" @error="error=$event"/>
    </div>
    <p v-if="error" role="alert" class="topbar-error">{{ error }}</p>
  </header>
</template>

<style scoped>
.mro-unified-header{display:flex;align-items:center;justify-content:space-between;gap:18px;
  min-height:64px;max-width:100%;padding:0 24px;background:transparent;z-index:28}
.mro-unified-search{display:flex;align-items:center;gap:8px;flex:0 1 455px;
  width:100%;min-width:0;margin-right:auto}
.mro-search-field{display:flex;align-items:center;gap:9px;flex:1;min-width:0;height:38px;
  padding:0 11px;border:1px solid var(--color-stroke);border-radius:8px;
  background:var(--color-surface);box-shadow:var(--shadow-control);color:var(--color-muted)}
.mro-search-field:focus-within{border-color:var(--color-primary-stroke)}
.mro-search-field input{display:block;flex:1;min-width:0;width:100%;height:100%;border:0;
  background:transparent;color:var(--color-text);outline:0;font:inherit;font-size:13px}
.mro-search-field input::placeholder{color:var(--color-muted)}
.mro-search-field input::-webkit-search-cancel-button{display:none}
.mro-search-clear{border:0;background:transparent;color:var(--color-muted);cursor:pointer}
.mro-search-submit{display:grid;place-items:center;width:38px;height:38px;flex:none;
  border:1px solid var(--color-primary);border-radius:7px;color:var(--color-on-primary);
  background:var(--color-primary);cursor:pointer}
.mro-header-actions{display:flex;align-items:center;justify-content:flex-end;gap:8px;margin-left:auto}
.mro-header-icon{display:grid;place-items:center;width:38px;height:38px;flex:none;
  border:1px solid transparent;border-radius:8px;background:transparent;color:var(--color-muted);cursor:pointer}
.mro-header-icon:hover,.mro-header-icon.router-link-active{background:var(--color-hover);color:var(--color-primary)}
.mro-header-icon:focus-visible,.mro-search-submit:focus-visible{
 outline:2px solid var(--color-primary);outline-offset:2px}
@media(max-width:860px){
 .mro-unified-header{padding:0 14px;gap:8px}
 .mobile-hamburger{display:grid}
 .mro-unified-search{flex:1 1 0;width:auto;max-width:none}
 .mro-header-actions{gap:3px}
}
@media(max-width:520px){
 .mro-unified-header{padding:0 10px;gap:5px}
 .mro-unified-search{gap:5px}
 .mro-search-field{padding:0 7px;gap:6px;height:36px}
 .mro-search-submit{width:36px;height:36px}
 .mro-header-actions{gap:0}
 .mro-header-icon{width:32px;height:34px}
}
</style>

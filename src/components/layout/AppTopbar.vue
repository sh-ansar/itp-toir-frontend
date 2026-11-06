<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRoute,useRouter } from 'vue-router'
import { AppTopbar as SharedAppTopbar } from '@itpmining/vue-basic-components'
import { usePreferencesStore } from '../../stores/preferences'
import MroAccountMenu from './MroAccountMenu.vue'

const emit=defineEmits<{ 'open-menu': [] }>()
const router=useRouter(),route=useRoute(),ui=usePreferencesStore()
const search=ref(''),accountOpen=ref(false),error=ref('')
const header=ref<{focusSearch:()=>void}|null>(null)
const translate=(ru:string,en:string,ka:string)=>({ru,en,ka})[ui.locale]
const placeholder=computed(()=>translate('Поиск по объектам и работам','Search assets and work orders','ობიექტებისა და სამუშაოების ძიება'))
const searchLabel=computed(()=>translate('Поиск','Search','ძიება'))
const openMenuLabel=computed(()=>translate('Открыть меню','Open navigation','მენიუს გახსნა'))
const themeLabel=computed(()=>translate('Сменить тему','Switch theme','თემის შეცვლა'))
const notificationsLabel=computed(()=>translate('Уведомления','Notifications','შეტყობინებები'))
function doSearch(){
  const q=search.value.trim()
  const target=['/assets','/work-orders','/employees','/projects','/supplies'].includes(route.path)?route.path:'/assets'
  void router.push({path:target,query:q?{search:q}:{}})
}
function onPointer(event:PointerEvent){
  if(event.target instanceof Element&&!event.target.closest('.mro-account-anchor'))accountOpen.value=false
}
function onKey(event:KeyboardEvent){
  if(event.key==='Escape'&&accountOpen.value){accountOpen.value=false;return}
  if(event.key!=='/'||event.ctrlKey||event.metaKey||event.altKey||event.shiftKey)return
  if((event.target as Element|null)?.closest?.('input,textarea,select,[contenteditable="true"]'))return
  event.preventDefault();header.value?.focusSearch()
}
watch(()=>route.fullPath,()=>{
  accountOpen.value=false
  search.value=typeof route.query.search==='string'?route.query.search:''
},{immediate:true})
// Clearing the shared SearchBar must also reset a search already applied to the route.
watch(search,(value,previous)=>{
  if(!value && previous && typeof route.query.search==='string')doSearch()
})
onMounted(()=>{document.addEventListener('pointerdown',onPointer);window.addEventListener('keydown',onKey)})
onBeforeUnmount(()=>{document.removeEventListener('pointerdown',onPointer);window.removeEventListener('keydown',onKey)})
</script>
<template>
  <div class="mro-topbar-wrapper">
    <SharedAppTopbar ref="header" class="mro-unified-header"
      v-model="search" :search-placeholder="placeholder" :search-label="searchLabel"
      :navigation-label="openMenuLabel" :notifications-label="notificationsLabel"
      :theme-label="themeLabel" :theme="ui.theme"
      @toggle-navigation="emit('open-menu')" @search="doSearch"
      @notifications="router.push('/notifications')" @toggle-theme="ui.toggleTheme()">
      <template #account>
        <MroAccountMenu :open="accountOpen" @toggle="accountOpen=!accountOpen"
          @close="accountOpen=false" @error="error=$event" />
      </template>
    </SharedAppTopbar>
    <p v-if="error" role="alert" class="topbar-error">{{error}}</p>
  </div>
</template>
<style scoped>
.mro-topbar-wrapper{width:100%;min-width:0}
.mro-unified-header{width:100%;min-height:64px;background:var(--color-surface-raised)}
.topbar-error{padding:6px 16px;color:var(--color-danger);font-size:13px;margin:0}
</style>

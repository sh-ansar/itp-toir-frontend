<script setup>
import { computed } from 'vue'
import {useRouter} from 'vue-router'
import {useI18n} from 'vue-i18n'
import {SiteHeader, } from '@itpmining/vue-basic-components'
import LocaleSwitcher from '@/components/mroCommercial/PublicLocaleSwitcher.vue'
import MroBrand from '@/components/mroCommercial/MroBrand.vue'
const {t}=useI18n(),router=useRouter()
const nav=computed(()=>[{href:'/#product',label:t('publicPortal.product')},{href:'/#modules',label:t('publicPortal.modules')},{href:'/#knowledge',label:t('publicPortal.resources')},{href:'/pricing',label:t('adminPortal.plans')}].map(item=>({...item,href:router.resolve(item.href).href})))
function navigate(item,event){if(event.button!==0||event.ctrlKey||event.metaKey||event.shiftKey||event.altKey)return;event.preventDefault();const base=router.options.history.base||'';router.push(base&&item.href.startsWith(base)?item.href.slice(base.length)||'/':item.href)}
</script>
<template><SiteHeader :home-href="router.resolve('/').href" :home-label="'ITP ТОиР'" :nav="nav" :login-href="router.resolve('/login').href" :signup-href="router.resolve('/register').href" :login-label="t('adminPortal.login')" :signup-label="t('publicPortal.getStarted')" :mobile-label="t('publicPortal.menu')" :nav-label="t('publicPortal.menu')" :mobile-nav-label="t('publicPortal.menu')" auto-hide @navigate="navigate"><template #brand><MroBrand class="shared-site-brand"/></template><template #language><LocaleSwitcher :persist-remote="false" compact/></template></SiteHeader></template>
<style scoped>.shared-site-brand{width:120px;max-height:40px}@media(max-width:360px){.shared-site-brand{width:90px}}</style>

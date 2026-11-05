<script setup>
import { ref, watch, onMounted, onBeforeUnmount } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { Button, Icon, IconButton } from '@itpmining/vue-basic-components'
import LocaleSwitcher from '@/components/mroCommercial/PublicLocaleSwitcher.vue'
import MroBrand from '@/components/mroCommercial/MroBrand.vue'

const { t } = useI18n()
const route = useRoute()
const router = useRouter()
const menuOpen = ref(false)
const headerHidden = ref(false)
const headerScrolled = ref(false)
let lastScrollY = 0
function onPageScroll() {
  const currentY = Math.max(0, window.scrollY || 0)
  headerScrolled.value = currentY > 16
  if (currentY < 96 || menuOpen.value) {
    headerHidden.value = false
    lastScrollY = currentY
    return
  }
  const delta = currentY - lastScrollY
  // Ignore single-pixel oscillation from touchpads and momentum scrolling.
  if (Math.abs(delta) < 4) return
  headerHidden.value = delta > 0
  lastScrollY = currentY
}
onMounted(() => {
  lastScrollY = window.scrollY || 0
  onPageScroll()
  window.addEventListener('scroll', onPageScroll, { passive: true })
})
onBeforeUnmount(() => window.removeEventListener('scroll', onPageScroll))
watch(menuOpen, open => { if (open) headerHidden.value = false })
function section(id) { return '/#' + id }
function go(path) { menuOpen.value = false; router.push(path) }
watch(() => route.fullPath, () => { menuOpen.value = false })
</script>

<template>
  <header class="public-site-header"
          :class="{ 'public-site-header--hidden': headerHidden, 'public-site-header--scrolled': headerScrolled }">
    <router-link class="public-brand" to="/" aria-label="ITP ТОиР"><MroBrand /></router-link>
    <nav class="public-primary-nav" :aria-label="t('publicPortal.menu')">
      <router-link :to="section('product')">{{ t('publicPortal.product') }}</router-link>
      <router-link :to="section('modules')">{{ t('publicPortal.modules') }}</router-link>
      <router-link :to="section('knowledge')">{{ t('publicPortal.resources') }}</router-link>
      <router-link to="/pricing">{{ t('adminPortal.plans') }}</router-link>
    </nav>
    <div class="public-header-actions">
      <div class="public-locale-wrap"><LocaleSwitcher class="public-locale" :persist-remote="false" compact />
        <Icon icon="Chevron Down" class="public-locale-chevron" aria-hidden="true" /></div>
      <Button class="public-login" :text="t('adminPortal.login')" color="secondary" @click="go('/login')" />
      <Button class="public-signup" :text="t('publicPortal.getStarted')" @click="go('/register')" />
      <IconButton class="public-menu-toggle" icon="Menu" :title="t('publicPortal.menu')"
                  :aria-expanded="menuOpen" aria-controls="mro-public-mobile-nav"
                  @click="menuOpen = !menuOpen" />
    </div>
    <nav v-if="menuOpen" id="mro-public-mobile-nav" class="public-mobile-nav"
         :aria-label="t('publicPortal.menu')">
      <router-link :to="section('product')" @click="menuOpen = false">{{ t('publicPortal.product') }}</router-link>
      <router-link :to="section('modules')" @click="menuOpen = false">{{ t('publicPortal.modules') }}</router-link>
      <router-link :to="section('possibilities')" @click="menuOpen = false">{{ t('publicPortal.possibilities') }}</router-link>
      <router-link to="/pricing" @click="menuOpen = false">{{ t('adminPortal.plans') }}</router-link>
      <router-link to="/login" @click="menuOpen = false">{{ t('adminPortal.login') }}</router-link>
      <router-link to="/register" @click="menuOpen = false">{{ t('publicPortal.getStarted') }}</router-link>
    </nav>
  </header>
</template>

<style scoped>
.public-site-header { box-sizing:border-box; height:80px; padding:12px max(24px,calc((100% - 1400px)/2)); display:grid;grid-template-columns:minmax(120px,1fr) auto minmax(360px,1fr);align-items:center;gap:16px;position:sticky;top:0;z-index:30;background:#fff;border-bottom:1px solid var(--border-base,#e1eaed);color:var(--text-base,#102b36);transition:transform .22s ease,box-shadow .22s ease;will-change:transform; }
.public-site-header--scrolled {box-shadow:0 6px 18px rgba(11,40,54,.10);}
.public-site-header--hidden:not(:focus-within) {transform:translateY(calc(-100% - 2px));pointer-events:none;}
@media(prefers-reduced-motion:reduce){.public-site-header{transition:none;}}
.public-brand { display:flex;align-items:center;flex:0 0 120px;width:120px;min-width:0; }
.public-brand :deep(svg) { display:block;width:100%;max-height:40px;height:auto; }
.public-primary-nav,.public-header-actions {display:flex;align-items:center;gap:16px;min-width:0;}
.public-primary-nav {gap:22px;justify-self:center;margin:0;white-space:nowrap;}
.public-primary-nav a,.public-mobile-nav a {font-size:14px;text-decoration:none;color:inherit;line-height:1.3;}
.public-primary-nav a:hover,.public-mobile-nav a:hover {color:#426d80;text-decoration:none;} .public-primary-nav a,.public-mobile-nav a {text-decoration:none!important;border-bottom:0!important;}
 .public-header-actions {gap:12px;justify-self:end;flex:0 0 auto;min-width:max-content;width:max-content;}
.public-locale-wrap{position:relative;flex:0 0 124px;width:124px;min-width:124px;max-width:124px;}
.public-locale{width:100%;}
.public-locale-chevron{position:absolute;right:10px;top:50%;transform:translateY(-50%);width:14px;height:14px;pointer-events:none;color:#6a93a7;}
.public-locale-wrap :deep(.dropdown__toggle){padding-right:14px;}
.public-locale :deep(.menu-item){white-space:nowrap;}
.public-menu-toggle {display:none;}
.public-mobile-nav {position:absolute;right:16px;top:calc(100% + 6px);min-width:240px;max-width:calc(100vw - 32px);max-height:calc(100dvh - 90px);overflow-y:auto;display:grid;gap:4px;padding:12px;background:var(--surface-raised,#fff);border:1px solid var(--border-base,#e1eaed);border-radius:12px;box-shadow:0 15px 35px #0b263b20;}
.public-mobile-nav a {padding:11px 12px;border-radius:8px;}
.public-mobile-nav a:hover {background:var(--surface-secondary,#eaf4f8);}
@media(max-width:1160px){.public-site-header{gap:10px;padding-inline:20px;grid-template-columns:minmax(106px,1fr) auto minmax(300px,1fr)}.public-primary-nav{gap:12px}.public-primary-nav a{font-size:13px}.public-header-actions{gap:6px}}
@media(max-width:900px){.public-site-header{height:70px;padding-inline:16px;display:flex}.public-primary-nav{display:none}.public-header-actions{margin-left:auto;gap:8px}.public-menu-toggle{display:inline-flex}.public-signup{display:none}}
@media(max-width:500px){.public-site-header{height:64px;gap:8px}.public-brand{flex-basis:106px;width:106px}.public-login{display:none}.public-header-actions{gap:0}}
@media(max-width:360px){.public-site-header{padding-inline:10px;gap:4px}.public-brand{flex-basis:86px;width:86px}}
</style>
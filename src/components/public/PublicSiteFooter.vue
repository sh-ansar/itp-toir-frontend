<script setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import PublicLegalLinks from '@/components/public/PublicLegalLinks.vue'
import { publicModules, modulePath, sectorPath } from './publicCatalog.js'
const { t } = useI18n()
const modules = computed(() => publicModules.map(item => ({key:item.key,name:t('portalConfig.moduleNames.' + item.key)})))
const features = computed(() => ['team','people','knowledge','chat'].map(key => ({key,title:t('publicPortal.feature_' + key + '_title')})))
</script>
<template>
  <footer class="public-site-footer">
    <div class="footer-columns">
      <nav :aria-label="t('publicPortal.product')" class="footer-column">
        <h2>{{ t('publicPortal.product') }}</h2>
        <router-link to="/#product">{{ t('publicPortal.home') }}</router-link>
        <router-link to="/#possibilities">{{ t('publicPortal.possibilities') }}</router-link>
        <router-link to="/login">{{ t('adminPortal.login') }}</router-link>
        <router-link to="/register">{{ t('publicPortal.getStarted') }}</router-link>
      </nav>
      <nav :aria-label="t('publicPortal.modules')" class="footer-column">
        <h2>{{ t('publicPortal.modules') }}</h2>
        <router-link v-for="module in modules" :key="module.key" :to="modulePath(module.key)">{{ module.name }}</router-link>
      </nav>
      <nav :aria-label="t('publicPortal.possibilities')" class="footer-column">
        <h2>{{ t('publicPortal.possibilities') }}</h2>
        <router-link v-for="feature in features" :key="feature.key" :to="'/#'+feature.key">{{ feature.title }}</router-link>
      </nav>
      <nav :aria-label="t('publicPortal.resources')" class="footer-column">
        <h2>{{ t('publicPortal.resources') }}</h2>
        <router-link :to="modulePath('wiki')">{{ t('portalConfig.moduleNames.wiki') }}</router-link>
        <router-link to="/#interactive-demo">{{ t('publicPortal.possibilities') }}</router-link>
        <router-link to="/#how-it-works">{{ t('publicPortal.howTitle') }}</router-link>
        <router-link to="/pricing">{{ t('adminPortal.plans') }}</router-link>
      </nav>
      <nav :aria-label="t('publicPortal.audience')" class="footer-column">
        <h2>{{ t('publicPortal.audience') }}</h2>
        <router-link :to="modulePath('dashboard')">{{ t('publicPortal.corporate') }}</router-link>
        <router-link :to="sectorPath('it')">{{ t('publicPortal.it') }}</router-link>
        <router-link :to="sectorPath('manufacturing')">{{ t('publicPortal.manufacturing') }}</router-link>
        <router-link :to="sectorPath('education')">{{ t('publicPortal.education') }}</router-link>
        <router-link :to="sectorPath('services')">{{ t('publicPortal.services') }}</router-link>
      </nav>
      <div class="footer-column">
        <h2>{{ t('adminPortal.documents') }}</h2>
        <PublicLegalLinks />
      </div>
    </div>
    <div class="footer-bottom">
      <span>© {{ new Date().getFullYear() }} ITP Mining</span>
      <router-link to="/pricing">{{ t('adminPortal.plans') }}</router-link>
    </div>
  </footer>
</template>
<style scoped>
.public-site-footer {background:#e6f0f4;color:#153642;min-width:0;}
.footer-columns {max-width:1440px;margin:auto;padding:52px 24px 38px;display:grid;
  grid-template-columns:repeat(6,minmax(0,1fr));gap:25px;box-sizing:border-box;}
.footer-column {display:flex;flex-direction:column;align-items:flex-start;min-width:0;}
.footer-column h2 {font-size:14px;font-weight:670;margin:0 0 18px;color:#587b8b;letter-spacing:0;}
.footer-column>a {font-size:13px;line-height:1.5;color:inherit;text-decoration:none!important;
  margin:7px 0;overflow-wrap:anywhere;border:0!important;transition:color .18s ease;}
.footer-column>a:hover,.footer-bottom a:hover {text-decoration:none!important;color:#466d7b;}
.footer-column>a:focus-visible,.footer-bottom a:focus-visible {outline:2px solid #536e79;outline-offset:3px;}
.footer-bottom {max-width:1440px;margin:auto;display:flex;gap:16px;justify-content:space-between;
  padding:20px 24px 28px;border-top:1px solid #d1e2e8;font-size:13px;color:#668894;box-sizing:border-box;}
.footer-bottom a {color:inherit;text-decoration:none!important;}
@media(max-width:1180px){.footer-columns{grid-template-columns:repeat(3,minmax(0,1fr));gap:32px;}}
@media(max-width:650px){.footer-columns{grid-template-columns:repeat(2,minmax(0,1fr));padding:36px 16px;gap:26px 18px}
.footer-bottom{padding:18px 16px 24px;flex-wrap:wrap;}}
@media(max-width:350px){.footer-columns{grid-template-columns:1fr;gap:22px;}}
@media(prefers-reduced-motion:reduce){.footer-column>a{transition:none!important;}}
</style>

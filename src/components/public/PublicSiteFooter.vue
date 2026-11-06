<script setup>
import { SiteFooter } from "@itpmining/vue-basic-components"
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import PublicLegalLinks from '@/components/public/PublicLegalLinks.vue'
import { publicModules, modulePath, sectorPath } from './publicCatalog.js'
const { t } = useI18n()
const modules = computed(() => publicModules.map(item => ({key:item.key,name:t('portalConfig.moduleNames.' + item.key)})))
const features = computed(() => ['team','people','knowledge','chat'].map(key => ({key,title:t('publicPortal.feature_' + key + '_title')})))
</script>
<template>
  <SiteFooter>
    <template #columns>
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
    </template>
<template #bottom>
      <span>© {{ new Date().getFullYear() }} ITP Mining</span>
      <router-link to="/pricing">{{ t('adminPortal.plans') }}</router-link>
    </template>
</SiteFooter>
</template>

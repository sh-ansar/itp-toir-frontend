<script setup>
import { useI18n } from 'vue-i18n'
import PublicTariffs from '@/components/public/PublicTariffs.vue'
import PublicSiteHeader from '@/components/public/PublicSiteHeader.vue'
import PublicSiteFooter from '@/components/public/PublicSiteFooter.vue'
const { t } = useI18n()
</script>
<template>
  <div class="pricing-site">
    <PublicSiteHeader />
    <main class="pricing-main">
      <nav class="pricing-breadcrumb">
        <router-link to="/">{{t('publicPortal.home')}}</router-link><span>/</span><span>{{t('adminPortal.plans')}}</span>
      </nav>
      <header class="pricing-intro"><h1>{{t('adminPortal.plans')}}</h1><p>{{t('publicPortal.pricingIntro')}}</p></header>
      <PublicTariffs />
    </main>
    <PublicSiteFooter />
  </div>
</template>
<style scoped>
.pricing-site{background:var(--body-background,#f5f9fa);color:var(--text-base,#102b36);min-height:100dvh;display:flex;flex-direction:column;}
.pricing-main{width:100%;max-width:1200px;box-sizing:border-box;margin:0 auto;padding:44px 24px 90px;flex:1;}
.pricing-breadcrumb{display:flex;gap:12px;font-size:13px;color:var(--text-weak,#718995);margin-bottom:44px;}
.pricing-breadcrumb a{color:inherit;text-decoration:none;}
.pricing-intro{margin-bottom:36px;}
.pricing-intro h1{font-size:clamp(32px,4vw,48px);letter-spacing:-.04em;font-weight:650;margin:0 0 16px;}
.pricing-intro p{line-height:1.7;max-width:700px;color:var(--text-weak,#6e8b99);margin:0;}
@media(max-width:700px){.pricing-main{padding:24px 16px 56px;}.pricing-breadcrumb{margin-bottom:26px;}}
</style>
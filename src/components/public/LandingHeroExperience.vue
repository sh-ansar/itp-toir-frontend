<script setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import { Button } from '@itpmining/vue-basic-components'
import MroHeroLiveDemo from './MroHeroLiveDemo.vue'
import { landingCopy } from './landingCopy.js'

const { t, locale } = useI18n()
const router = useRouter()
const copy = computed(() => landingCopy[locale.value] || landingCopy.en)
function showDemo() {
  document.getElementById('interactive-demo')?.scrollIntoView({
    behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth',
    block: 'start',
  })
}
</script>

<template>
  <section id="product" class="portal-hero" aria-labelledby="portal-hero-heading">
    <div class="portal-hero__inner">
      <!-- Actual Vue components with local example data, not a screenshot or production tenant API. -->
      <MroHeroLiveDemo />
      <div class="portal-hero__copy">
        <h1 id="portal-hero-heading">{{ t('publicPortal.heroFirst') }}<br>{{ t('publicPortal.heroSecond') }}</h1>
        <p>{{ t('publicPortal.heroText') }}</p>
        <div class="portal-hero__actions">
          <Button :text="t('publicPortal.getStarted')" @click="router.push('/register')" />
          <Button color="secondary" :text="copy.explore" @click="showDemo" />
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.portal-hero { position:relative; overflow:clip; background:#f5f9fa; color:#102b36; scroll-margin-top:82px; }
.portal-hero__inner { max-width:1552px; padding:24px 20px 70px; margin:auto; box-sizing:border-box; }
.portal-hero__copy { position:relative; z-index:1; text-align:center; max-width:980px; margin:56px auto 0; }
.portal-hero__copy h1 { color:#102d3c; font-size:clamp(43px,6.4vw,88px); font-weight:720; line-height:1.02; letter-spacing:-.05em; margin:0; text-wrap:balance; }
.portal-hero__copy p { margin:22px auto 26px; max-width:720px; color:#5d7c8b; font-size:clamp(16px,1.35vw,18px); line-height:1.6; text-wrap:pretty; }
.portal-hero__actions { display:flex; justify-content:center; flex-wrap:wrap; gap:12px; }
.portal-hero__actions :deep(button) { min-height:48px; min-width:190px; padding-inline:20px; border-radius:10px; font-weight:650; }
@media(max-width:900px) {
 .portal-hero__inner{padding:16px 16px 50px}
 .portal-hero__copy{margin-top:40px}
 .portal-hero__copy h1{font-size:clamp(43px,7.2vw,70px)}
}
@media(max-width:600px) {
 .portal-hero__inner{padding:12px 12px 36px}
 .portal-hero__copy{margin-top:28px}
 .portal-hero__copy h1{font-size:clamp(38px,10.3vw,55px)}
 .portal-hero__copy p{margin:16px auto 24px}
 .portal-hero__actions{max-width:330px;flex-direction:column;margin:auto}
 .portal-hero__actions :deep(button){width:100%}
}
</style>

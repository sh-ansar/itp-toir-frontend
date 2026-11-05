<script setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import { Button } from '@itpmining/vue-basic-components'
import heroImage from '@/assets/img/landing-hero-clean.webp'
import leftShape from '@/assets/img/landing-shape-left-clean.webp'
import rightShape from '@/assets/img/landing-shape-right-clean.webp'
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
      <!-- The clean 1440x480 panorama is a single continuous image. Only the two
           transparent diamond layers float, never the interface itself. -->
      <div class="portal-hero__visual" role="img"
           :aria-label="[copy.sceneWorkspace, copy.scenePeople, copy.sceneTasks].join(', ') + ' — ITP ТОиР'">
        <img class="portal-hero__panorama" :src="heroImage" alt="" aria-hidden="true"
             width="1440" height="480" loading="eager" fetchpriority="high" decoding="async">
        <img class="portal-hero__diamond portal-hero__diamond--left" :src="leftShape"
             alt="" aria-hidden="true" width="280" height="280" decoding="async">
        <img class="portal-hero__diamond portal-hero__diamond--right" :src="rightShape"
             alt="" aria-hidden="true" width="280" height="280" decoding="async">
      </div>
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
.portal-hero__eyebrows { display:flex; align-items:center; justify-content:center; gap:8px; flex-wrap:wrap; }
.portal-hero__eyebrows span { padding:7px 13px; color:#0780b8; font-size:13px; font-weight:600; border-radius:40px; background:#e5f6fc; }
.portal-hero__copy h1 { color:#102d3c; font-size:clamp(43px,6.4vw,88px); font-weight:720; line-height:1.02; letter-spacing:-.05em; margin:0; text-wrap:balance; }
.portal-hero__copy p { margin:22px auto 26px; max-width:720px; color:#5d7c8b; font-size:clamp(16px,1.35vw,18px); line-height:1.6; text-wrap:pretty; }
.portal-hero__actions { display:flex; justify-content:center; flex-wrap:wrap; gap:12px; }
.portal-hero__actions :deep(button) { min-height:48px; min-width:190px; padding-inline:20px; border-radius:10px; font-weight:650; }
.portal-hero__visual {
  position:relative; isolation:isolate; width:100%; height:auto; aspect-ratio:3 / 1;
  border-radius:20px; overflow:hidden;
  background:linear-gradient(115deg,#fb3382 1%,#ffbf9c 34%,#f5e4d3 55%,#b4d8e8 82%,#a6c5f9 100%);
  box-shadow:0 22px 56px #19506b18;
}
.portal-hero__panorama {
  display:block; width:100%; height:100%; object-fit:cover; object-position:center;
}
.portal-hero__diamond {
  position:absolute; z-index:2; width:20%; height:auto;
  object-fit:contain; pointer-events:none; filter:drop-shadow(0 12px 24px #34536616);
  will-change:transform;
}
.portal-hero__diamond--left { left:23%; top:38%; animation:portal-diamond-left 7.5s ease-in-out infinite alternate; }
.portal-hero__diamond--right { right:3.5%; top:10%; animation:portal-diamond-right 8.2s ease-in-out infinite alternate; }
@keyframes portal-diamond-left { from{transform:translateY(-15px)}to{transform:translateY(14px)} }
@keyframes portal-diamond-right { from{transform:translateY(13px)}to{transform:translateY(-17px)} }
@media(max-width:900px) {
 .portal-hero__inner{padding:16px 16px 50px}
 .portal-hero__copy{margin-top:40px}
 .portal-hero__copy h1{font-size:clamp(43px,7.2vw,70px)}
 .portal-hero__visual{border-radius:14px}
}
@media(max-width:600px) {
 .portal-hero__inner{padding:12px 12px 36px}
 .portal-hero__copy{margin-top:28px}
 .portal-hero__copy h1{font-size:clamp(38px,10.3vw,55px)}
 .portal-hero__copy p{margin:16px auto 24px}
 .portal-hero__actions{max-width:330px;flex-direction:column;margin:auto}
 .portal-hero__actions :deep(button){width:100%}
 .portal-hero__visual{aspect-ratio:3 / 1;max-height:none;border-radius:10px}
 .portal-hero__panorama{object-fit:contain;object-position:center}
 .portal-hero__diamond{width:20%;opacity:.95}
 .portal-hero__diamond--left{left:23%;top:32%}
 .portal-hero__diamond--right{right:4%;top:8%}
}
@media(max-width:600px) { @keyframes portal-diamond-left { from{transform:translateY(-5px)}to{transform:translateY(5px)} } @keyframes portal-diamond-right { from{transform:translateY(5px)}to{transform:translateY(-5px)} } }
@media(prefers-reduced-motion:reduce) {
 .portal-hero__diamond{animation:none!important;will-change:auto!important}
}
</style>

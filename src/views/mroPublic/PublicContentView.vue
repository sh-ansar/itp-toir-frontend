<script setup>
import { computed, watch, onMounted, onBeforeUnmount } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { Button, Icon } from '@itpmining/vue-basic-components'
import PublicSiteHeader from '@/components/public/PublicSiteHeader.vue'
import PublicSiteFooter from '@/components/public/PublicSiteFooter.vue'
import LandingInteractiveDemo from '@/components/public/LandingInteractiveDemo.vue'
import { catalogUi, catalogDescription, publicModules, publicSectors, modulePath, sectorPath } from '@/components/public/publicCatalog.js'
import { sectorSteps } from '@/components/public/publicExperienceCopy.js'

const route = useRoute()
const router = useRouter()
const { t, locale } = useI18n()
const isModule = computed(() => route.name === 'public.module')
const key = computed(() => String(isModule.value ? route.params.module : route.params.sector))
const entry = computed(() => (isModule.value ? publicModules : publicSectors).find(item => item.key === key.value))
const ui = computed(() => catalogUi[locale.value] || catalogUi.en)
const words = computed(() => (catalogDescription[locale.value] || catalogDescription.en)[key.value] || catalogDescription.en[key.value] || [])
const heading = computed(() => isModule.value
  ? t('portalConfig.moduleNames.' + key.value) : t('publicPortal.' + key.value))
const suggested = computed(() => {
  const preferred = isModule.value
    ? publicModules.filter(item => item.key !== key.value)
    : publicModules.filter(item => ['projects','tasks','wiki','messenger'].includes(item.key))
  // Stable, contextual suggestions: show four, not the entire catalog again.
  const idx = Math.max(0,preferred.findIndex(item => item.family === entry.value?.family))
  return [...preferred.slice(idx),...preferred.slice(0,idx)].slice(0,4)
})
const steps = computed(() => isModule.value
  ? ui.value.steps[entry.value?.family || 'overview'] || ui.value.steps.overview
  : (sectorSteps[locale.value] || sectorSteps.en)[key.value] || ui.value.steps.sector)
const defaultDemo = computed(() => entry.value?.demo || 'tasks')
const missingHeading = computed(() => ({
  ru:'Раздел не найден', en:'Page not found', ka:'გვერდი ვერ მოიძებნა', ge:'გვერდი ვერ მოიძებნა',
  de:'Seite nicht gefunden', fr:'Page introuvable', es:'Página no encontrada'
})[locale.value] || 'Page not found')

function toDemo() {
  document.getElementById('detail-interactive')?.scrollIntoView({
    behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth',
    block:'start'
  })
}
function updateTitle() { document.title = (entry.value ? heading.value : missingHeading.value) + ' — ITP ТОиР' }
onMounted(updateTitle)
watch([key,locale], updateTitle)
onBeforeUnmount(() => { document.title='ITP ТОиР' })
</script>

<template>
<div v-if="entry" class="public-details">
  <PublicSiteHeader />
  <main>
    <div class="public-details__breadcrumbs">
      <router-link to="/">{{ ui.home }}</router-link>
      <Icon icon="Chevron Right" />
      <router-link :to="isModule ? '/#modules' : '/#possibilities'">{{ isModule ? ui.modules : ui.sectors }}</router-link>
      <Icon icon="Chevron Right" />
      <span aria-current="page">{{ heading }}</span>
    </div>

    <section class="public-details__hero" aria-labelledby="public-details-heading">
      <div class="public-details__copy">
        <h1 id="public-details-heading">{{ heading }}</h1>
        <h2>{{ words[0] }}</h2>
        <p>{{ words[1] }}</p>
        <div class="public-details__buttons">
          <Button :text="ui.seeDemo" @click="toDemo" />
          <Button color="secondary" :text="ui.getStarted" @click="router.push('/register')" />
        </div>
      </div>
      <div class="public-details__preview" aria-label="ITP ТОиР demo">
        <div class="public-details__preview-top">
          <span class="public-details__preview-logo">ITP</span>
          <strong>ТОиР</strong>
          <span class="public-details__preview-tag">{{ ui.sample }}</span>
        </div>
        <div class="public-details__preview-layout">
          <div class="public-details__preview-nav">
            <router-link v-for="link in publicModules.slice(0,6)" :key="link.key"
                         :to="modulePath(link.key)" :aria-label="t('portalConfig.moduleNames.'+link.key)"
                         :class="{'is-selected':link.key === key}">
              <Icon :icon="link.icon" />
            </router-link>
          </div>
          <div class="public-details__preview-main">
            <div class="public-details__preview-title"><Icon :icon="entry.icon" /><strong>{{ heading }}</strong></div>
            <div class="public-details__preview-stats">
              <span><Icon icon="Done" /> {{ steps[0] }}</span>
              <span><Icon icon="Search" /> {{ steps[1] }}</span>
              <span><Icon icon="Messaging" /> {{ steps[2] }}</span>
            </div>
            <div class="public-details__preview-rows">
              <div v-for="(label,index) in steps" :key="index">
                <span class="public-details__preview-bullet" :class="'tone-'+index"></span>
                <span>{{ label }}</span>
                <Icon icon="Done" />
              </div>
            </div>
          </div>
        </div>
        <div class="public-details__preview-wash" aria-hidden="true"></div>
      </div>
    </section>

    <section class="public-details__benefits" aria-labelledby="public-details-benefits-title">
      <div class="public-details__section-head">
        <h2 id="public-details-benefits-title">{{ ui.highlights }}</h2>
        <p>{{ ui.highlightsSub }}</p>
      </div>
      <div class="public-details__benefits-grid">
        <article v-for="(step,index) in steps" :key="step">
          <div class="public-details__benefit-icon">
            <Icon :icon="['Done','Search','Business'][index]" />
          </div>
          <strong>{{ step }}</strong>
          <span>0{{ index + 1 }}</span>
        </article>
      </div>
    </section>

    <section id="detail-interactive" class="public-details__interactive" aria-labelledby="public-details-preview-title">
      <div class="public-details__section-head">
        <h2 id="public-details-preview-title">{{ ui.preview }}</h2>
        <p>{{ ui.previewSub }}</p>
      </div>
      <LandingInteractiveDemo :key="key" :active-tab="defaultDemo" />
    </section>

    <section class="public-details__related" aria-labelledby="public-details-related-title">
      <div class="public-details__section-head">
        <h2 id="public-details-related-title">{{ ui.related }}</h2>
      </div>
      <div class="public-details__related-grid">
        <router-link v-for="item in suggested" :key="item.key" :to="modulePath(item.key)">
          <span><Icon :icon="item.icon" /></span>
          <strong>{{ t('portalConfig.moduleNames.' + item.key) }}</strong>
          <p>{{ (catalogDescription[locale] || catalogDescription.en)[item.key]?.[0] }}</p>
          <span class="public-details__more">{{ ui.learnMore }} <Icon icon="Arrow Right" /></span>
        </router-link>
      </div>
    </section>

    <aside class="public-details__privacy">
      <Icon icon="Lock" />
      <div><strong>{{ ui.security }}</strong><p>{{ ui.securityText }}</p></div>
    </aside>

    <section class="public-details__cta">
      <div><h2>{{ ui.ctaTitle }}</h2><p>{{ ui.ctaText }}</p></div>
      <div class="public-details__cta-actions">
        <Button color="secondary" :text="ui.begin" @click="router.push('/register')" />
        <router-link to="/pricing">{{ ui.pricing }} <Icon icon="Arrow Right" /></router-link>
      </div>
    </section>
  </main>
  <PublicSiteFooter />
</div>
<div v-else class="public-details public-details--missing">
  <PublicSiteHeader />
  <main class="public-details__missing" aria-labelledby="public-details-missing-heading">
    <span class="public-details__missing-code">404</span>
    <h1 id="public-details-missing-heading">{{ missingHeading }}</h1>
    <router-link to="/" class="public-details__missing-link">{{ ui.backHome }}</router-link>
  </main>
  <PublicSiteFooter />
</div>
</template>

<style scoped>
.public-details { background:#f6f9fb;min-height:100dvh;color:#102d3c;overflow-x:clip }
.public-details--missing{display:flex;flex-direction:column}
.public-details--missing .public-details__missing{width:100%;flex:1;min-height:420px;display:flex;flex-direction:column;gap:18px;align-items:center;justify-content:center;text-align:center;padding:48px 18px}
.public-details__missing-code{color:var(--color-primary,#0697e0);font-size:42px;font-weight:700}
.public-details__missing-link{display:inline-flex;padding:11px 18px;border-radius:8px;color:#fff;background:var(--color-primary,#0697e0);text-decoration:none}
.public-details main { max-width:1440px;margin:auto; }
.public-details__breadcrumbs { display:flex;gap:10px;align-items:center;padding:24px 24px 12px;font-size:12px;color:#6a8b9c; }
.public-details__breadcrumbs a { color:inherit;text-decoration:none; }
.public-details__breadcrumbs a:hover { color:#008dcf }
.public-details__breadcrumbs :deep(svg) { width:13px;height:13px }
.public-details__hero { display:grid;grid-template-columns:.96fr 1.04fr;gap:42px;align-items:center;padding:40px 24px 62px; }
.public-details__copy,.public-details__preview { min-width:0; }
.public-details__eyebrow { display:none; }
.public-details__eyebrow :deep(svg) { width:16px;height:16px }
.public-details h1 { font-size:clamp(44px,5.6vw,78px);line-height:1.02;letter-spacing:-.055em;margin:0 0 16px;font-weight:740;text-wrap:balance; }
.public-details__copy h2 { font-size:clamp(21px,2.3vw,29px);line-height:1.3;font-weight:580;color:#225065;margin:0 0 18px;letter-spacing:-.025em; }
.public-details__copy p { font-size:16px;line-height:1.8;color:#5b7e8e;max-width:565px;margin:0; }
.public-details__buttons { display:flex;flex-wrap:wrap;gap:10px;margin-top:30px; }
.public-details__buttons :deep(button) { border-radius:10px;min-height:47px;padding-inline:19px;font-weight:650; }
.public-details__preview { height:410px;border:1px solid #dcecf1;border-radius:18px;background:#fff;position:relative;overflow:hidden;box-shadow:0 25px 54px #1a506815; }
.public-details__preview-top { height:58px;display:flex;align-items:center;gap:7px;padding:0 21px;border-bottom:1px solid #e5eef2; }
.public-details__preview-logo { background:#009cde;color:white;font-size:13px;font-weight:750;border-radius:7px;padding:6px 7px; }
.public-details__preview-top strong { font-size:21px;letter-spacing:-.03em; }
.public-details__preview-tag { margin-left:auto;font-size:11px;border-radius:50px;background:#edf7fa;color:#6c93a4;padding:7px 10px; }
.public-details__preview-layout { display:grid;grid-template-columns:64px 1fr;height:calc(100% - 58px); }
.public-details__preview-nav { display:flex;flex-direction:column;gap:12px;padding:18px 15px;background:#eef6f9;border-right:1px solid #e2ebf1; }
.public-details__preview-nav a { display:grid;place-items:center;background:white;width:33px;height:33px;border-radius:9px;color:#789bac; }
.public-details__preview-nav a.is-selected { background:#d0effd;color:#009cde; }
.public-details__preview-nav :deep(svg) { width:17px;height:17px }
.public-details__preview-main { padding:25px 24px;min-width:0; }
.public-details__preview-title { display:flex;align-items:center;gap:11px;font-size:22px;letter-spacing:-.02em; }
.public-details__preview-title :deep(svg) { width:24px;height:24px;color:#009cde; }
.public-details__preview-stats { display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:9px;margin:20px 0; }
.public-details__preview-stats span { min-height:69px;background:#f3f9fb;border-radius:8px;display:flex;align-items:flex-start;gap:6px;flex-direction:column;font-size:10px;line-height:1.25;color:#668899;padding:12px; }
.public-details__preview-stats :deep(svg) { width:15px;height:15px;color:#009cde }
.public-details__preview-rows>div { display:flex;align-items:center;gap:11px;border-top:1px solid #ebf2f5;padding:13px 2px;color:#557785;font-size:12px; }
.public-details__preview-rows>div span:nth-child(2) { flex:1; }
.public-details__preview-rows :deep(svg) { width:15px;height:15px;color:#22ab96 }
.public-details__preview-bullet { flex:0 0 9px;width:9px;height:9px;background:#61bddf;border-radius:50%; }
.public-details__preview-bullet.tone-1 { background:#7ca9e9 }.public-details__preview-bullet.tone-2 { background:#35b9a2 }
.public-details__preview-wash { position:absolute;left:0;right:0;bottom:0;height:50px;background:linear-gradient(transparent,rgba(215,245,254,.85));pointer-events:none }
.public-details__benefits,.public-details__related { padding:46px 24px 70px; }
.public-details__section-head { max-width:760px; }
.public-details__section-head h2 { font-size:clamp(27px,3vw,42px);margin:13px 0 11px;letter-spacing:-.04em;line-height:1.16; }
.public-details__section-head p { color:#5b7f8e;font-size:15px;line-height:1.7;margin:0 }
.public-details__benefits-grid { display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:17px;margin-top:28px; }
.public-details__benefits-grid article { position:relative;min-height:175px;border:1px solid #e0ebf0;background:white;border-radius:13px;padding:23px;display:flex;flex-direction:column;gap:20px;box-shadow:0 8px 24px #16526909; }
.public-details__benefit-icon { display:grid;place-items:center;background:#e8f7fd;color:#009cde;width:43px;height:43px;border-radius:11px; }
.public-details__benefit-icon :deep(svg) { width:23px;height:23px; }
.public-details__benefits-grid strong { font-size:17px;font-weight:650;line-height:1.4; }
.public-details__benefits-grid article>span { position:absolute;top:20px;right:22px;color:#c3d7df;font-size:18px; }
.public-details__interactive { scroll-margin-top:100px;padding:36px 0 0; }
.public-details__interactive>.public-details__section-head { padding:0 24px; }
.public-details__interactive :deep(.landing-demo) { padding-top:0;margin-top:24px; }
.public-details__related-grid { display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:15px;margin-top:25px; }
.public-details__related-grid a { display:flex;flex-direction:column;gap:10px;padding:20px;text-decoration:none;color:#183d4f;background:white;border:1px solid #e0ebef;border-radius:12px;min-height:205px;transition:transform .2s,box-shadow .2s; }
.public-details__related-grid a:hover { transform:translateY(-4px);box-shadow:0 13px 26px #17547114; }
.public-details__related-grid a>span:first-child { display:grid;place-items:center;width:38px;height:38px;background:#e4f6fd;border-radius:10px;color:#009cde; }
.public-details__related-grid a>span:first-child :deep(svg) { width:21px;height:21px }
.public-details__related-grid strong { font-size:16px; }
.public-details__related-grid p { color:#6d8a98;font-size:12px;line-height:1.5;margin:0; }
.public-details__more { display:flex;align-items:center;gap:6px;color:#008fca;font-size:12px;font-weight:650;margin-top:auto; }
.public-details__more :deep(svg) { width:15px;height:15px; }
.public-details__privacy { display:flex;align-items:flex-start;gap:17px;margin:0 24px 65px;padding:20px 24px;border-radius:12px;background:#e8f4f8;color:#456d80; }
.public-details__privacy> :deep(svg) { width:21px;height:21px;flex:0 0 21px;color:#008bc1; }
.public-details__privacy strong { display:block;font-size:14px; }
.public-details__privacy p { margin:7px 0 0;font-size:13px;line-height:1.6; }
.public-details__cta { background:#009cde;border-radius:18px 18px 0 0;padding:50px 56px;color:white;display:flex;align-items:center;justify-content:space-between;gap:25px; }
.public-details__cta h2 { font-size:clamp(28px,3.2vw,41px);letter-spacing:-.04em;margin:0 0 10px }
.public-details__cta p { margin:0;line-height:1.6;max-width:550px;font-size:14px;opacity:.9; }
.public-details__cta-actions { display:flex;align-items:center;gap:15px;flex-wrap:wrap; }
.public-details__cta-actions :deep(button) { min-width:145px; }
.public-details__cta-actions a { display:flex;align-items:center;gap:8px;font-size:13px;text-decoration:none;color:white;font-weight:650; }
.public-details__cta-actions a :deep(svg) { width:16px;height:16px; }
@media(max-width:1030px) { .public-details__hero { gap:24px; }.public-details__related-grid {grid-template-columns:repeat(2,minmax(0,1fr));}.public-details__preview{height:370px;} }
@media(max-width:760px) {
 .public-details__hero{grid-template-columns:1fr;padding:24px 20px 48px;gap:28px;}
 .public-details__breadcrumbs{padding:20px 20px 0;}
 .public-details h1{font-size:clamp(38px,8vw,62px);}
 .public-details__copy h2{font-size:24px;}
 .public-details__preview{height:365px;}
 .public-details__benefits,.public-details__related{padding:34px 20px 55px;}
 .public-details__interactive>.public-details__section-head{padding:0 20px;}
 .public-details__benefits-grid{grid-template-columns:1fr;gap:12px;}
 .public-details__benefits-grid article{min-height:105px;gap:12px;}
 .public-details__privacy{margin:0 20px 44px;}
 .public-details__cta{padding:36px 24px;flex-direction:column;align-items:flex-start;}
}
@media(max-width:420px) {
 .public-details__hero{padding:22px 16px 32px;}
 .public-details__breadcrumbs{padding-inline:16px;gap:6px;flex-wrap:wrap;}
 .public-details__buttons{flex-direction:column;}
 .public-details__buttons :deep(button){width:100%;}
 .public-details__preview{height:300px;}
 .public-details__preview-layout{grid-template-columns:47px 1fr;}
 .public-details__preview-nav{padding:10px 7px;gap:10px;}
 .public-details__preview-nav span{width:30px;height:30px;}
 .public-details__preview-main{padding:17px 12px;}
 .public-details__preview-title{font-size:18px;}
 .public-details__preview-stats{gap:5px;margin:13px 0;}
 .public-details__preview-stats span{padding:8px;font-size:9px;min-height:69px;}
 .public-details__preview-rows>div{padding:9px 0;font-size:10px;}
 .public-details__benefits,.public-details__related{padding:30px 16px 45px;}
 .public-details__related-grid{grid-template-columns:1fr;}
 .public-details__related-grid a{min-height:140px;}
 .public-details__interactive>.public-details__section-head{padding:0 16px;}
 .public-details__privacy{margin:0 16px 40px;}
 .public-details__cta{border-radius:0;}
}
@media(prefers-reduced-motion:reduce) { .public-details__related-grid a{transition:none!important;} }
</style>

<style scoped>
.public-details__preview-nav a{text-decoration:none!important;border:1px solid transparent;}
.public-details__preview-nav a:hover{border-color:#c5d9e5;color:#426778;}
.public-details__preview-nav a:focus-visible{outline:2px solid #657f8e;outline-offset:2px;}
.public-details__related-grid a{border-bottom:1px solid #e0ebef;text-decoration:none!important;}
.public-details__related-grid a:hover{text-decoration:none!important;}
</style>

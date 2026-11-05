<script setup>
import { ref,computed } from "vue"
import { Button, Icon } from "@itpmining/vue-basic-components"
import {useI18n} from 'vue-i18n'
import PublicTariffs from '@/components/public/PublicTariffs.vue'
import PublicSiteHeader from '@/components/public/PublicSiteHeader.vue'
import PublicSiteFooter from '@/components/public/PublicSiteFooter.vue'
import LandingHeroExperience from '@/components/public/LandingHeroExperience.vue'
import LandingModulesInteractive from '@/components/public/LandingModulesInteractive.vue'
import LandingInteractiveDemo from '@/components/public/LandingInteractiveDemo.vue'
import LandingFeaturePreview from '@/components/public/LandingFeaturePreview.vue'
import { modulePath } from '@/components/public/publicCatalog.js'
const {t}=useI18n()
const demoTab = ref('tasks')
const vReveal = {
  mounted(el) {
    if (!('IntersectionObserver' in window) || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    el.classList.add('landing-reveal')
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible')
          observer.unobserve(entry.target)
        }
      })
    }, { threshold:.09, rootMargin:'0px 0px -16px 0px' })
    el.__landingRevealObserver = observer
    observer.observe(el)
  },
  unmounted(el) { el.__landingRevealObserver?.disconnect() }
}
function moduleDemoTab(key) {
  if (['storage','wiki','documents'].includes(key)) return 'wiki'
  if (['employees','dashboard'].includes(key)) return 'search'
  if (['messenger','feed'].includes(key)) return 'messages'
  return 'tasks'
}
const modules=computed(()=>[['dashboard','Dashboard'],['feed','Activity Feed'],['employees','Resume'],['projects','Business'],['tasks','Task'],['storage','Folder'],['wiki','Read'],['documents','Document'],['messenger','Messaging']].map(([key,icon])=>[t('portalConfig.moduleNames.'+key),icon,key]))
const features=computed(()=>[['team','tasks'],['people','people'],['knowledge','wiki'],['chat','chat']].map(([id,kind])=>({id,kind,title:t('publicPortal.feature_'+id+'_title'),text:t('publicPortal.feature_'+id+'_text')})))
</script>
<template>
<div class="public-site">
<PublicSiteHeader />
<main>
<LandingHeroExperience />
<section id="possibilities" class="landing-container bento-layout">
 <div class="choose-card" v-reveal><LandingModulesInteractive /></div>
 <div class="small-feature-stack">
 <article class="small-feature" v-reveal>
    <div class="color-preview"><Icon icon="Settings" /><span>{{t('publicPortal.color')}}</span>
      <input :aria-label="t('publicPortal.color')" type="color" value="#009cde"
        @input="$event.currentTarget.closest('.small-feature').style.setProperty('--preview-color', $event.target.value)" /></div>
    <h2>{{t('publicPortal.appearanceTitle')}}</h2>
    <p>{{t('publicPortal.appearanceText')}}</p>
    <router-link to="/#interactive-demo" @click="demoTab='appearance'">{{t('publicPortal.possibilities')}} <Icon icon="Arrow Right" /></router-link>
  </article>
 <article class="small-feature" v-reveal>
    <Icon icon="Messaging" /><h2>{{t('publicPortal.contactTitle')}}</h2>
    <p>{{t('publicPortal.contactText')}}</p>
    <router-link :to="modulePath('messenger')">{{t('publicPortal.possibilities')}} <Icon icon="Arrow Right" /></router-link>
  </article>
 <article class="small-feature" v-reveal>
    <Icon icon="Activity Feed" /><h2>{{t('publicPortal.newsTitle')}}</h2>
    <p>{{t('publicPortal.newsText')}}</p>
    <router-link :to="modulePath('feed')">{{t('publicPortal.possibilities')}} <Icon icon="Arrow Right" /></router-link>
  </article>
 </div>
 <article v-for="feature in features" v-reveal :id="feature.id" :key="feature.id" class="feature-card"><div class="feature-copy"><span class="eyebrow">ITP ТОиР</span><h2>{{feature.title}}</h2><p>{{feature.text}}</p><router-link :to="modulePath(feature.kind === 'people' ? 'employees' : feature.kind === 'wiki' ? 'wiki' : feature.kind === 'chat' ? 'messenger' : 'projects')">Подробнее <span aria-hidden="true">→</span></router-link></div><router-link class="feature-preview feature-preview--link"
    :to="modulePath(feature.kind==='people' ? 'employees' : feature.kind==='wiki' ? 'wiki' : feature.kind==='chat' ? 'messenger' : 'projects')"
    :aria-label="feature.title">
    <LandingFeaturePreview :kind="feature.kind" />
  </router-link></article>
 <section id="modules" class="modules-section" v-reveal><h2>{{t('publicPortal.modulesTitle')}}</h2><p>{{t('publicPortal.modulesText')}}</p><div class="modules-grid"><router-link v-for="item in modules" :key="item[0]" :to="modulePath(item[2])"><Icon :icon="item[1]" /><span>{{item[0]}}</span></router-link></div></section>
 </section>
 <LandingInteractiveDemo :active-tab="demoTab" @update:active-tab="demoTab = $event" />
 <section id="how-it-works" class="public-how" v-reveal><h2>{{t('publicPortal.howTitle')}}</h2><ol><li v-for="step in ['register','verify','company','invoice']" :key="step"><h3>{{t('publicPortal.step_'+step)}}</h3><p>{{t('publicPortal.step_'+step+'_text')}}</p></li></ol></section>
 <section id="plans" class="public-plans" v-reveal><h2>{{t('publicPortal.pricingTitle')}}</h2><p>{{t('publicPortal.pricingIntro')}}</p><PublicTariffs /><router-link class="public-pricing-link" to="/pricing">{{t('publicPortal.allPlans')}}</router-link></section>
 <section class="landing-cta" v-reveal><h2>{{t('publicPortal.getStarted')}}</h2><Button color="secondary" :text="t('publicPortal.getStarted')" @click="$router.push('/register')" /></section>
</main>
<PublicSiteFooter />
</div>
</template>
<style scoped>
.public-site{--landing-blue:#009cde;background:#f5f9fa;color:#102b36;min-height:100vh;font-family:inherit}.public-site h1,.public-site h2,.public-site h3{color:inherit;margin:0;font-weight:650;letter-spacing:-.035em}.public-site p{line-height:1.6;margin:16px 0 24px}.public-header{height:80px;display:flex;align-items:center;justify-content:space-between;padding:16px max(24px,calc((100% - 1200px)/2));background:#fff;gap:28px;position:sticky;top:0;z-index:20;border-bottom:1px solid #e1eaed}.public-header nav,.public-actions{display:flex;align-items:center;gap:24px}.public-header a{color:inherit;text-decoration:none}.public-header :deep(.logo){width:122px}.public-mobile-nav{position:fixed;top:80px;right:16px;z-index:21;padding:20px;background:#fff;border:1px solid #e1eaed;border-radius:12px;display:grid;gap:18px}.landing-hero{max-width:1440px;margin:auto;min-height:650px;padding:80px max(24px,calc((100% - 1200px)/2));display:grid;grid-template-columns:1fr 1.25fr;gap:56px;align-items:center;overflow:hidden}.hero-copy h1{font-size:clamp(42px,4.5vw,72px);line-height:1.02;margin:22px 0}.hero-copy p{font-size:18px;max-width:480px}.eyebrow{display:inline-block;background:#daf4ff;color:#009cde;font-size:13px;padding:7px 11px;border-radius:6px;margin:0 6px 4px 0}.hero-product{background:linear-gradient(130deg,#ffd2dc,#d9f5ff 50%,#a0b3ff);border-radius:24px;padding:32px 0 0 24px;box-shadow:0 28px 70px #007acb1a;min-width:0}.product-window{background:#fff;border:1px solid #d6e6ec;border-radius:12px 0 0;min-height:400px;overflow:hidden;box-shadow:0 16px 40px #18698122}.window-top{display:flex;align-items:center;justify-content:space-between;padding:16px;border-bottom:1px solid #e3edf0;font-size:13px;gap:12px}.window-top :deep(.logo){width:86px}.window-layout{display:grid;grid-template-columns:130px 1fr}.window-layout aside{background:#edf5f8;padding:8px;overflow:hidden}.window-layout aside :deep(.menu-item){font-size:11px;min-width:0}.window-body{padding:20px;min-width:0}.window-body h2{font-size:26px}.window-tools{display:flex;align-items:center;gap:12px;font-size:10px;margin:16px 0}.board{display:grid;grid-template-columns:repeat(3,1fr);gap:8px}.board-column{background:#eef7fa;border-radius:6px;padding:8px;min-width:0}.board-column>small{color:#6f8b96}.demo-task{padding:10px 8px;margin-top:10px;background:white;border-radius:6px;font-size:11px;line-height:1.5;box-shadow:0 2px 6px #15394809}.demo-task small{display:block;color:#7b9099;font-size:9px;margin:8px 0}.demo-dot{display:block;width:24px;height:4px;background:#73d7f8;margin-bottom:8px}.demo-avatars{color:#009cde;font-size:9px}.landing-container{max-width:1200px;margin:auto;padding:24px}.choose-card{display:grid;grid-template-columns:1fr 1fr;gap:72px;background:#edf5f8;border-radius:20px;padding:48px;margin-bottom:32px}.public-site h2{font-size:clamp(28px,3vw,44px);line-height:1.1}.choose-controls{background:#fff;padding:16px;border-radius:12px;box-shadow:0 8px 24px #123a4d0c}.module-toggle{display:flex;align-items:center;gap:16px;padding:16px 4px;border-top:1px solid #eef4f6}.module-toggle span{flex:1}.demo-pills{display:flex;gap:8px;white-space:nowrap;font-size:11px;overflow:hidden;padding:10px 0}.demo-pills span{padding:6px 10px;border-radius:20px;background:#edf5f8}.demo-pills span:first-child{background:#009cde;color:white}.feature-card{display:grid;grid-template-columns:1fr 1fr;gap:56px;align-items:center;border-radius:20px;background:#eaf3f7;padding:48px;margin:32px 0;overflow:hidden;min-height:400px}.feature-card:nth-of-type(even) .feature-copy{order:2}.feature-copy a{color:#008dca;font-weight:600;text-decoration:none}.feature-preview{min-width:0;background:white;border-radius:12px;box-shadow:0 12px 40px #145e7812;overflow:hidden}.feature-preview img{display:block;width:100%;height:300px;object-fit:cover;object-position:top left}.feature-blue{background:#009cde;color:white}.feature-blue .eyebrow{background:#ffffff25;color:white}.feature-blue .feature-copy a{color:white}.demo-conversation{min-height:300px;padding:0 16px 16px;background:repeating-linear-gradient(90deg,#edf5f8,#edf5f8 2px,#f8fbfc 2px,#f8fbfc 10px);color:#173844}.demo-conversation p{background:white;border-radius:10px;padding:12px;width:82%;font-size:13px;margin:18px 0}.demo-conversation p:nth-of-type(2){background:#009cde;color:white;margin-left:auto}.demo-input{background:white;border-radius:20px;padding:10px;font-size:12px;color:#78909b}.demo-knowledge{padding:0 20px 20px;color:#12333f}.knowledge-cover{height:100px;background:linear-gradient(110deg,#fff3d6,#f4a8c3,#b8d9ff);margin:0 -20px 18px}.demo-knowledge h3{font-size:24px}.demo-knowledge p{font-size:12px}.skeleton{height:8px;background:#e3edf1;margin:12px 0;border-radius:5px}.skeleton.short{width:66%}.demo-project{padding:8px 16px;min-height:280px}.project-row{display:flex;align-items:center;gap:12px;border-top:1px solid #edf2f5;padding:18px 0;font-size:12px}.project-row small{margin-left:auto;color:#6e8b98}.modules-section{padding:64px 0}.modules-grid{display:grid;grid-template-columns:repeat(6,1fr);gap:16px;margin-top:32px}.modules-grid>a,.soon-module{min-height:120px;border:1px solid #e1ebef;border-radius:10px;background:#fff;display:flex;align-items:center;justify-content:center;flex-direction:column;gap:14px;text-decoration:none;color:inherit;font-size:14px;padding:16px;position:relative}.modules-grid :deep(.icon){color:#009cde}.soon-module{opacity:.55}.soon-module .eyebrow{font-size:10px;position:absolute;right:4px;top:4px;padding:3px 6px}.landing-cta{text-align:center;background:#009cde;color:white;padding:72px 24px}.landing-cta h2{margin-bottom:28px}.landing-footer{background:#e6f0f4}.footer-columns{max-width:1200px;margin:auto;padding:48px 24px;display:grid;grid-template-columns:repeat(5,1fr);gap:32px}.footer-columns h3{font-size:16px;color:#749aac;margin-bottom:18px;letter-spacing:0}.footer-columns a{display:block;color:#153642;text-decoration:none;font-size:14px;margin:12px 0;line-height:1.4}.footer-bottom{display:flex;justify-content:space-between;background:#dfebf0;padding:24px max(24px,calc((100% - 1152px)/2));font-size:13px;color:#688f9f;gap:24px}.footer-bottom button{background:none;border:0;color:inherit;cursor:pointer}section,article{scroll-margin-top:100px}.public-site main a:hover{text-decoration:none}
@media(max-width:900px){.public-header nav{display:none}.landing-hero{grid-template-columns:1fr;padding-top:32px;gap:36px}.hero-product{order:-1;max-height:300px}.hero-copy h1{font-size:48px}.choose-card,.feature-card{gap:28px;padding:28px}.modules-grid{grid-template-columns:repeat(4,1fr)}.footer-columns{grid-template-columns:repeat(3,1fr)}}
@media(max-width:600px){.public-header{height:64px;padding:12px 16px}.public-mobile-nav{top:64px}.public-actions{gap:8px}.landing-hero{padding:0 16px 32px;gap:28px}.hero-product{margin:0 -16px;border-radius:0;padding:20px 0 0 12px;max-height:240px}.product-window{min-width:440px;transform:scale(.84);transform-origin:top left;margin-bottom:-60px}.hero-copy h1{font-size:42px}.hero-copy p{font-size:16px}.landing-container{padding:8px 16px}.choose-card,.feature-card{grid-template-columns:1fr;gap:24px;padding:24px;margin:16px 0}.feature-card:nth-of-type(even) .feature-copy{order:0}.feature-preview img{height:260px}.modules-section{padding:40px 0}.modules-grid{grid-template-columns:repeat(2,1fr);gap:12px}.modules-grid>a,.soon-module{min-height:112px}.landing-cta{padding:48px 24px}.footer-columns{grid-template-columns:repeat(2,1fr);padding:32px 16px;gap:24px}.footer-bottom{padding:24px 16px;flex-direction:column;gap:14px}.window-layout{grid-template-columns:110px 1fr}}
</style>

<style scoped>
.public-site{overflow-x:clip}.public-header>a{display:block;width:120px;flex-shrink:0}.public-header>a :deep(svg){width:120px;height:auto;max-height:36px}.window-top :deep(svg){max-width:90px;max-height:28px}.feature-preview{min-width:0}.hero-copy,.feature-copy,.choose-card>div{min-width:0}.public-header>.public-actions{min-width:0}.public-site :deep(.logo){max-width:100%}
</style>

<style scoped>
.landing-hero-art{width:100%;overflow:hidden;background:#eaf3f7}.landing-hero-art img{display:block;width:100%;height:auto;min-height:230px;object-fit:cover;object-position:center}
.landing-hero{display:block;min-height:0;text-align:center;padding:72px 24px 56px;max-width:1100px}.hero-copy h1{font-size:clamp(44px,6.8vw,96px);line-height:1;letter-spacing:-.055em}.hero-copy p{max-width:800px;margin:28px auto;font-size:18px}.hero-copy .eyebrow{font-size:14px}
.bento-layout{display:grid;grid-template-columns:repeat(12,minmax(0,1fr));gap:24px;max-width:1280px;padding:0 24px 48px}
.choose-card{grid-column:1 / span 7;grid-row:1;display:flex;flex-direction:column;gap:20px;margin:0;padding:28px;border:1px solid #dfebf0;background:#fff;overflow:hidden;min-width:0}
.choose-controls{box-shadow:0 6px 18px #133b4c10;margin:0;padding:12px;max-height:250px;overflow:hidden}.choose-card h2,.feature-card h2,.small-feature h2{font-size:28px}.choose-card p,.feature-card p,.small-feature p{font-size:15px;margin:12px 0}.choose-card>.eyebrow{display:none}
.feature-card{grid-column:span 5;display:flex;flex-direction:column;gap:20px;justify-content:space-between;align-items:stretch;padding:24px;margin:0;min-width:0;min-height:0;border:1px solid #dce9ef;border-radius:8px}.feature-card .eyebrow,.choose-card .eyebrow{display:none}.feature-card .feature-copy{order:2!important}.feature-preview{box-shadow:0 8px 18px #1c4f6912;border-radius:8px;min-width:0}.feature-card#team{grid-column:8 / 13;grid-row:1}.feature-card#knowledge{grid-column:6 / 13;grid-row:2;justify-content:start;background:#eaf3f7;color:#102b36}.feature-card#knowledge .feature-copy{order:0!important}.feature-card#knowledge .feature-preview{min-height:260px;flex:1}.feature-card#people{grid-column:1 / 8;grid-row:3}.feature-card#people .feature-copy{order:0!important}.feature-card#chat{grid-column:8 / 13;grid-row:3}
.small-feature-stack{grid-column:1 / 6;grid-row:2;display:flex;flex-direction:column;gap:16px}.small-feature{padding:20px;background:#eaf3f7;border:1px solid #dce9ef;border-radius:8px}.small-feature h2{font-size:22px;margin:12px 0 0}.small-feature :deep(.icon){color:#009cde}.color-preview{display:flex;align-items:center;gap:12px;padding:20px;background:white;border-radius:8px;box-shadow:0 6px 18px #133b4c10;border-bottom:4px solid var(--preview-color,#009cde);font-size:13px}.color-preview input{width:36px;height:28px;margin-left:auto;border:0;background:transparent}
.modules-section{grid-column:1/-1;text-align:center;padding:48px 0 0}.modules-section h2{font-size:34px}.modules-section h2 br{display:none}.modules-grid{gap:20px}.modules-grid>a,.soon-module{border-radius:8px;box-shadow:0 3px 6px #12334008;min-height:120px}.modules-grid :deep(.icon){width:32px;height:32px}.soon-module{background:#cbdfe9;opacity:1;color:#7196a7}.soon-module .eyebrow{background:#009cde;color:white;right:-6px;top:-8px;font-size:12px;padding:5px 8px}
.public-plans{max-width:900px;margin:0 auto;padding:32px 24px 56px;text-align:center}.public-plans h2{font-size:32px}.landing-cta h2{font-size:48px}.landing-cta{padding:68px 24px}.landing-cta :deep(button){min-width:240px;padding:24px}
@media(max-width:900px){.public-header{gap:12px}.public-header>.public-actions:nth-child(2){margin-right:auto}.landing-hero-art img{min-height:200px}.landing-hero{padding:44px 24px}.hero-copy h1{font-size:64px}.bento-layout{gap:16px;padding:0 20px 32px}.feature-card h2,.choose-card h2{font-size:24px}.feature-card,.choose-card{padding:20px}}
@media(max-width:600px){.public-header>.public-actions:last-child :deep(button:nth-child(2)){display:none}.public-header>a{width:110px}.public-header>.public-actions{gap:4px}.landing-hero-art img{height:230px;width:690px;max-width:none;position:relative;left:50%;transform:translateX(-50%)}.landing-hero{padding:32px 16px}.hero-copy h1{font-size:44px}.hero-copy p{font-size:16px;line-height:1.5;margin:20px auto}.hero-copy .eyebrow{font-size:12px}.bento-layout{display:flex;flex-direction:column;padding:0 16px 32px;gap:16px}.choose-card{order:0}.feature-card#team{order:1}.small-feature-stack{order:2}.feature-card#knowledge{order:3}.feature-card#people{order:4}.feature-card#chat{order:5}.modules-section{order:6}.feature-card,.choose-card{border-radius:8px}.modules-section h2{font-size:28px;text-align:left}.modules-grid{gap:12px}.landing-cta h2{font-size:36px}.landing-cta{padding:44px 24px}.public-plans{padding:20px 24px 36px}}
</style>

<style scoped>
.feature-preview{color:#102b36}.public-header>a{background:#fff;border-radius:6px;padding:4px}
</style>
<style scoped>
.public-plans{max-width:1200px;padding:56px 24px;text-align:left}.public-plans>p{max-width:720px}.public-pricing-link{display:inline-block;color:#009cde;margin-top:24px}.public-how,.public-documents{max-width:1200px;margin:auto;padding:48px 24px;box-sizing:border-box}.public-how ol{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:24px;list-style:decimal-leading-zero;padding:0;counter-reset:steps}.public-how li{list-style:none;counter-increment:steps;min-width:0}.public-how li:before{content:counter(steps,decimal-leading-zero);display:block;color:#009cde;margin:24px 0 16px;font-size:24px}.public-how h3{font-size:20px;font-weight:500}.public-how p,.public-documents p{font-size:15px}.footer-legal{max-width:1200px;padding:24px;margin:auto}.public-preferences :deep(.select){width:72px;min-width:72px}.public-header nav{gap:16px}.public-documents h2{font-size:32px}.public-how h2{font-size:32px}
@media(max-width:1000px){.public-header nav{display:none}.public-how ol{grid-template-columns:repeat(2,minmax(0,1fr))}}
@media(max-width:600px){.public-header{gap:8px}.public-header .public-login,.public-header .public-signup{display:none!important}.public-header .public-menu-toggle{display:inline-flex!important}.public-preferences{margin-right:0!important;gap:4px}.public-how,.public-documents,.public-plans{padding:32px 16px}.public-how ol{grid-template-columns:1fr;gap:0}.footer-legal{padding:24px 16px}.public-preferences :deep(.select){width:66px;min-width:66px}}
</style>

<style scoped>
/* Public landing-only overrides: keep the shared header and inner Portal untouched. */
.choose-card { display:block; padding:24px; min-height:0; }
.choose-card :deep(.landing-modules) { width:100%; }
.landing-reveal { opacity:0; transform:translateY(19px); transition:opacity .5s ease,transform .5s ease; }
.landing-reveal.is-visible { opacity:1; transform:translateY(0); }
@media(max-width:600px) { .choose-card { padding:18px; } }
@media(prefers-reduced-motion:reduce) { .landing-reveal { opacity:1; transform:none; transition:none; } }
</style>

<style scoped>
.feature-preview--link{display:block;color:inherit;text-decoration:none!important;}
.feature-preview--link:hover{transform:translateY(-3px);box-shadow:0 14px 36px #17567518;}
.feature-preview--link:focus-visible{outline:2px solid #687f8d;outline-offset:3px;}
.small-feature>a{display:inline-flex;align-items:center;gap:7px;color:#436c7f;
  font-size:13px;font-weight:650;text-decoration:none!important;margin-top:8px;}
.small-feature>a:hover{color:#173c50;text-decoration:none!important;}
.small-feature>a :deep(svg){width:15px;height:15px;}
.public-site .feature-card#knowledge{background:#eaf3f7!important;color:#102b36!important;}
.public-site .feature-card#knowledge .feature-copy a{color:#315e77!important;}
@media(prefers-reduced-motion:reduce){.feature-preview--link{transition:none!important;}}
</style>

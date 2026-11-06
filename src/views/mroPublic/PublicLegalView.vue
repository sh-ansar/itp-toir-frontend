<script setup>
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute, useRouter } from 'vue-router'
import { Button, Icon, SiteLegalContent } from '@itpmining/vue-basic-components'
import api from '@/api/mroCommercialAdapter'
import PublicSiteHeader from '@/components/public/PublicSiteHeader.vue'
import PublicSiteFooter from '@/components/public/PublicSiteFooter.vue'

const { t, locale } = useI18n()
const route = useRoute()
const router = useRouter()
function navigateLegal(item,event){if(event.button!==0||event.ctrlKey||event.metaKey||event.shiftKey||event.altKey)return;event.preventDefault();router.push("/legal")}
const documents = ref([])
const currentDocument = ref(null)
const loading = ref(false)
const error = ref('')
let generation = 0
const labels = computed(() => ({
  ru: { published:'Опубликованные документы', back:'Все юридические документы', version:'Версия', updated:'Действует с', download:'Скачать PDF', integrity:'Контрольная сумма', legal:'Правовая информация', details:'Сведения о документе' },
  en: { published:'Published documents', back:'All legal documents', version:'Version', updated:'Effective from', download:'Download PDF', integrity:'Checksum', legal:'Legal information', details:'Document information' },
  ge: { published:'გამოქვეყნებული დოკუმენტები', back:'ყველა იურიდიული დოკუმენტი', version:'ვერსია', updated:'ძალაში შესვლის თარიღი', download:'PDF ჩამოტვირთვა', integrity:'საკონტროლო ჯამი', legal:'იურიდიული ინფორმაცია', details:'დოკუმენტის ინფორმაცია' }
})[locale.value === 'ka' ? 'ge' : locale.value] || {
  published:'Published documents',back:'All legal documents',version:'Version',updated:'Effective from',download:'Download PDF',integrity:'Checksum',legal:'Legal information',details:'Document information'
})
const isDocument = computed(() => Boolean(route.params.document || route.params.version))
const paragraphs = computed(() => String(currentDocument.value?.body || '')
  .split(/\r?\n+/).map(text => text.trim()).filter(Boolean).map(text => ({
    text, heading: /^(?:\d+(?:\.\d+)*[.)]?\s+)?[А-ЯЁA-Z][А-ЯЁA-Z0-9\s,()«»"—–.-]{6,}$/.test(text) && text.length < 130,
  })))
const pdfUrl = computed(() => currentDocument.value?.id
  ? api.defaults.baseURL + '/public/legal/' + encodeURIComponent(currentDocument.value.id) + '/pdf'
  : '')
async function load() {
  const request = ++generation
  loading.value = true
  error.value = ''
  currentDocument.value = null
  try {
    const response = await api.get('/public/legal', { params: { locale: locale.value === 'ka' ? 'ge' : locale.value, jurisdiction: 'KZ' }, silent: true })
    const items = response.data?.data || []
    const type = route.params.document?.replaceAll('-', '_')
    const id = route.params.version || items.find(item => item.type === type)?.id
    const selected = id ? (await api.get('/public/legal/' + encodeURIComponent(id), { silent: true })).data?.data : null
    if (generation !== request) return
    documents.value = items
    currentDocument.value = selected
    if (isDocument.value && !selected) error.value = t('adminPortal.noPublishedDocuments')
  } catch {
    if (generation === request) error.value = t('adminPortal.loadFailed')
  } finally {
    if (generation === request) loading.value = false
  }
}
watch([() => route.params.version, () => route.params.document, locale], load, { immediate: true })
</script>
<template>
  <div class="legal-site">
    <PublicSiteHeader />
    <main class="legal-main">
      <nav class="legal-breadcrumb" :aria-label="labels.legal">
        <router-link to="/">{{ t('publicPortal.home') }}</router-link>
        <span aria-hidden="true">/</span>
        <router-link v-if="isDocument" to="/legal">{{ t('adminPortal.documents') }}</router-link>
        <span v-if="isDocument" aria-hidden="true">/</span>
        <span aria-current="page">{{ isDocument ? (currentDocument?.title || t('adminPortal.documents')) : t('adminPortal.documents') }}</span>
      </nav>
      <header v-if="!currentDocument" class="legal-intro">
        <p class="legal-kicker">{{ labels.legal }}</p>
        <h1>{{ currentDocument?.title || t('adminPortal.documents') }}</h1>
        <p v-if="!isDocument">{{t('publicPortal.legalIntro')}}</p>
      </header>
      <p v-if="error" class="legal-status" role="alert">{{ error }}</p>
      <p v-if="loading" class="legal-status" role="status">{{t('adminPortal.loading')}}</p>
      <template v-if="!loading && currentDocument">
        <div class="legal-document-toolbar">
          <div class="legal-document-meta">
            <span>{{ labels.version }} {{ currentDocument.version }}</span>
            <span v-if="currentDocument.effective_at">{{ labels.updated }} {{ currentDocument.effective_at }}</span>
            <span>{{ currentDocument.jurisdiction }}</span>
          </div>
          <a :href="pdfUrl" target="_blank" rel="noopener noreferrer" class="legal-pdf">
            <Icon icon="Document" /> {{ labels.download }}
          </a>
        </div>
        <SiteLegalContent :title="currentDocument.title" :back-href="router.resolve('/legal').href" :back-label="labels.back" @navigate="navigateLegal">
          <template v-for="(part,index) in paragraphs" :key="index">
            <h2 v-if="part.heading" class="legal-document-section">{{ part.text }}</h2>
            <p v-else>{{ part.text }}</p>
          </template>
        </SiteLegalContent>
        <details class="legal-integrity">
          <summary>{{ labels.details }}</summary>
          <p>{{ labels.integrity }} (SHA-256): <code>{{ currentDocument.sha256 }}</code></p>
        </details>
        <router-link class="legal-back" to="/legal"><Icon icon="Back" /> {{ labels.back }}</router-link>
      </template>
      <div v-else-if="!loading && !isDocument && documents.length" class="legal-card-grid">
        <router-link v-for="item in documents" :key="item.id" class="legal-card"
                     :to="'/legal/' + item.type.replaceAll('_','-')">
          <div class="legal-card-icon"><Icon icon="Document" /></div>
          <h2>{{ item.title || t('publicPortal.legal_' + item.type) }}</h2>
          <p>{{ labels.version }} {{ item.version }} <span v-if="item.effective_at">· {{ item.effective_at }}</span></p>
          <span class="legal-card-open"><Icon icon="Arrow Right" /></span>
        </router-link>
      </div>
      <p v-else-if="!loading && !isDocument && !error" class="legal-status">{{t('adminPortal.noPublishedDocuments')}}</p>
      <router-link v-if="error && !isDocument" to="/pricing">{{ t('adminPortal.plans') }}</router-link>
      <Button v-if="error" :text="t('publicPortal.retry')" color="secondary" @click="load" />
    </main>
    <PublicSiteFooter />
  </div>
</template>
<style scoped>
.legal-site {min-height:100dvh;background:var(--body-background,#f5f9fa);color:var(--text-base,#102b36);display:flex;flex-direction:column;}
.legal-main {max-width:1200px;margin:0 auto;width:100%;box-sizing:border-box;padding:44px 24px 90px;flex:1;}
.legal-breadcrumb {display:flex;flex-wrap:wrap;align-items:center;gap:10px;font-size:13px;color:var(--text-weak,#6b8796);margin-bottom:48px;}
.legal-breadcrumb a {color:inherit;text-decoration:none;}
.legal-breadcrumb a:hover {text-decoration:underline;}
.legal-breadcrumb [aria-current] {color:var(--text-base,#102b36);}
.legal-intro {max-width:960px;margin-bottom:32px;}
.legal-kicker {font-size:13px;font-weight:650;text-transform:uppercase;letter-spacing:.12em;color:var(--accent-base,#009cde);margin:0 0 12px;}
.legal-intro h1 {font-size:clamp(30px,4vw,48px);line-height:1.17;letter-spacing:-.035em;font-weight:650;margin:0 0 16px;overflow-wrap:anywhere;}
.legal-intro>p:last-child {line-height:1.65;max-width:720px;color:var(--text-weak,#637f8e);margin:0;}
.legal-status {padding:18px 24px;border:1px solid var(--border-base,#dbe7ec);border-radius:10px;}
.legal-card-grid {display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:16px;}
.legal-card {position:relative;display:block;text-decoration:none;color:inherit;padding:28px 56px 28px 28px;border:1px solid var(--border-base,#dbe7ec);background:var(--surface-base,#fff);border-radius:12px;min-height:170px;box-sizing:border-box;transition:box-shadow .2s,border-color .2s;}
.legal-card:hover,.legal-card:focus-visible {border-color:var(--accent-base,#009cde);box-shadow:0 12px 24px #18374913;}
.legal-card-icon {width:38px;height:38px;border-radius:9px;background:var(--surface-secondary,#e8f5fc);color:var(--accent-base,#009cde);display:grid;place-items:center;margin-bottom:16px;}
.legal-card-icon :deep(svg),.legal-card-open :deep(svg){width:19px;height:19px;}
.legal-card h2 {font-size:18px;font-weight:650;line-height:1.4;margin:0 0 12px;overflow-wrap:anywhere;}
.legal-card p {font-size:13px;color:var(--text-weak,#728d99);margin:0;}
.legal-card-open {position:absolute;top:34px;right:26px;color:var(--accent-base,#009cde);}
.legal-document-toolbar {display:flex;align-items:center;justify-content:space-between;gap:16px;flex-wrap:wrap;margin:0 0 20px;}
.legal-document-meta {display:flex;gap:8px 18px;flex-wrap:wrap;font-size:13px;color:var(--text-weak,#708996);}
.legal-pdf {display:inline-flex;align-items:center;justify-content:center;gap:8px;padding:11px 18px;border-radius:9px;background:var(--accent-base,#009cde);color:white;text-decoration:none;font-weight:600;font-size:14px;white-space:nowrap;}
.legal-pdf:hover {filter:brightness(.94);}
.legal-pdf :deep(svg){width:18px;height:18px;}
.legal-document {max-width:960px;background:var(--surface-base,#fff);border:1px solid var(--border-base,#dbe7ec);border-radius:12px;padding:clamp(20px,4vw,52px);font-size:15px;line-height:1.85;box-sizing:border-box;overflow-wrap:anywhere;}
.legal-document p {margin:0 0 1.25em;white-space:pre-wrap;}
.legal-document p:last-child{margin-bottom:0;}
.legal-document-section {font-size:17px;line-height:1.5;font-weight:700;margin:1.75em 0 .9em;letter-spacing:0;}
.legal-document-section:first-child{margin-top:0;}
.legal-integrity {max-width:960px;padding:14px 2px 24px;color:var(--text-weak,#708996);font-size:12px;overflow-wrap:anywhere;}
.legal-integrity summary{cursor:pointer;max-width:max-content;}
.legal-integrity code{word-break:break-all;}
.legal-back {display:inline-flex;align-items:center;gap:10px;color:var(--accent-base,#009cde);font-size:14px;text-decoration:none;margin-top:6px;}
.legal-back :deep(svg){width:17px;height:17px;}
@media(max-width:700px){.legal-main{padding:24px 16px 56px}.legal-breadcrumb{margin-bottom:28px}.legal-card-grid{grid-template-columns:1fr}.legal-card{min-height:145px;padding:24px 52px 24px 22px}.legal-document-toolbar{align-items:flex-start}.legal-pdf{width:100%;box-sizing:border-box}.legal-document{border-radius:9px;}.legal-intro h1{font-size:30px;}}
</style>

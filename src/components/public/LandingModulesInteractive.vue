<script setup>
import { computed, reactive, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { Icon, Switch } from '@itpmining/vue-basic-components'
import { landingCopy, moduleCategories } from './landingCopy.js'

const { t, locale } = useI18n()
const c = computed(() => landingCopy[locale.value] || landingCopy.en)
const category = ref('all')
const moduleIds = ['dashboard', 'feed', 'employees', 'projects', 'tasks', 'storage', 'wiki', 'documents', 'messenger']
const icons = { dashboard:'Dashboard',feed:'Activity Feed',employees:'Resume',projects:'Business',tasks:'Task',storage:'Folder',wiki:'Read',documents:'Document',messenger:'Messaging' }
const enabled = reactive(Object.fromEntries(moduleIds.map(id => [id, true])))
const filters = computed(() => [
  { id:'all', label:c.value.all },
  { id:'communication', label:c.value.communication },
  { id:'information', label:c.value.information },
  { id:'workflows', label:c.value.workflows },
])
const visible = computed(() => moduleIds.filter(id => category.value === 'all' || moduleCategories[id] === category.value))
const selected = computed(() => moduleIds.filter(id => enabled[id]).length)
function reset() {
  category.value = 'all'
  moduleIds.forEach(id => { enabled[id] = true })
}
function jumpDemo() {
  document.getElementById('interactive-demo')?.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' })
}
</script>
<template>
  <section class="landing-modules" aria-labelledby="landing-modules-title">
    <div class="landing-modules__intro">
      <h2 id="landing-modules-title">{{ c.filterTitle }}</h2>
      <p>{{ c.filterText }}</p>
    </div>
    <div class="landing-modules__panel">
      <div class="landing-modules__tabs" role="tablist" :aria-label="c.filterTitle">
        <button v-for="tab in filters" :key="tab.id" type="button" role="tab"
                :id="'landing-tab-' + tab.id"
                :aria-selected="category === tab.id"
                aria-controls="landing-module-list"
                :class="{ 'is-selected': category === tab.id }"
                @click="category = tab.id">{{ tab.label }}</button>
      </div>
      <div class="landing-modules__panel-head">
        <div><strong>{{ c.configLabel }}</strong><small>{{ selected }} {{ c.of }} {{ moduleIds.length }} · {{ c.selected }}</small></div>
        <button type="button" class="landing-modules__reset" @click="reset">{{ c.reset }}</button>
      </div>
      <div id="landing-module-list" role="tabpanel" class="landing-modules__list"
           :aria-labelledby="'landing-tab-' + category">
        <div v-for="id in visible" :key="id" class="landing-modules__row" :class="{ 'is-off': !enabled[id] }">
          <div class="landing-modules__icon"><Icon :icon="icons[id]" /></div>
          <span class="landing-modules__name">{{ t('portalConfig.moduleNames.' + id) }}</span>
          <Switch v-model="enabled[id]" :aria-label="t('portalConfig.moduleNames.' + id)" />
        </div>
      </div>
      <button class="landing-modules__try" type="button" @click="jumpDemo">
        {{ c.preview }} <Icon icon="Arrow Right" />
      </button>
    </div>
  </section>
</template>
<style scoped>
.landing-modules { display:grid;grid-template-columns:.85fr 1.15fr;gap:22px;align-items:start;min-width:0; }
.landing-modules__intro { padding:4px 5px 0;min-width:0; }
.landing-modules__eyebrow { display:inline-flex;background:#e5f7ff;color:#007db4;border-radius:24px;font-size:12px;font-weight:650;padding:7px 12px; }
.landing-modules__intro h2 { font-size:clamp(23px,2.8vw,33px);line-height:1.11;letter-spacing:-.04em;margin:18px 0 14px;font-weight:720;color:#102b36; }
.landing-modules__intro p { font-size:14px;line-height:1.65;color:#637e8b;margin:0; }
.landing-modules__panel { min-width:0;background:#fff;padding:16px;border:1px solid #e3edf1;border-radius:13px;box-shadow:0 10px 25px #1547610b; }
.landing-modules__tabs { display:flex;flex-wrap:wrap;gap:6px;margin-bottom:17px; }
.landing-modules__tabs button { font:inherit;font-size:11px;line-height:1.25;border:1px solid #e2eaf0;background:#f3f8fa;color:#537688;border-radius:30px;padding:8px 11px;min-height:34px;cursor:pointer;transition:background .18s,border .18s,color .18s; }
.landing-modules__tabs button:hover { background:#e4f6ff;color:#087ba9; }
.landing-modules__tabs button.is-selected { border-color:#009cde;background:#009cde;color:white; }
.landing-modules__tabs button:focus-visible { outline:2px solid #009cde;outline-offset:2px; }
.landing-modules__panel-head { display:flex;align-items:center;justify-content:space-between;gap:10px;margin-bottom:10px; }
.landing-modules__panel-head strong { display:block;font-size:13px;color:#153441; }
.landing-modules__panel-head small { display:block;font-size:11px;color:#7392a0;margin-top:3px; }
.landing-modules__reset { color:#007eb7;background:transparent;border:0;font:inherit;font-size:12px;cursor:pointer;padding:8px; }
.landing-modules__reset:hover { text-decoration:underline; }
.landing-modules__list { display:grid;max-height:230px;overflow-y:auto;overscroll-behavior:contain;scrollbar-color:#c9dfe8 transparent; }
.landing-modules__row { display:flex;align-items:center;gap:10px;border-top:1px solid #ecf3f6;min-height:48px;padding:7px 4px;transition:opacity .2s; }
.landing-modules__row.is-off { opacity:.52; }
.landing-modules__icon { display:grid;place-items:center;width:28px;height:28px;border-radius:8px;color:#049adb;background:#effaff;flex:0 0 28px; }
.landing-modules__icon :deep(svg) { width:17px;height:17px; }
.landing-modules__name { flex:1 1 auto;min-width:0;font-weight:550;font-size:12px;overflow-wrap:anywhere; }
.landing-modules__row :deep(.switch) { flex-shrink:0; }
.landing-modules__try { display:flex;align-items:center;justify-content:center;gap:8px;margin-top:12px;width:100%;min-height:40px;cursor:pointer;border:1px solid #b6e9fa;border-radius:9px;background:#e4f7ff;color:#007fb7;font:inherit;font-weight:650;font-size:12px; }
.landing-modules__try:hover { background:#d5f1ff; }
.landing-modules__try :deep(svg) { width:16px;height:16px; }
@media(max-width:1160px){.landing-modules{grid-template-columns:1fr;gap:14px}.landing-modules__intro h2{font-size:26px}}
@media(max-width:600px){.landing-modules__panel{padding:12px}.landing-modules__intro h2{font-size:25px}.landing-modules__tabs button{font-size:11px;padding:8px 9px}}
@media(prefers-reduced-motion:reduce){.landing-modules *{transition:none!important}}
</style>

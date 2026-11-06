<script setup>
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { Icon } from '@itpmining/vue-basic-components'
import { landingCopy } from './landingCopy.js'
import { experienceCopy } from './publicExperienceCopy.js'
import LandingTasksDemo from './LandingTasksDemo.vue'
import LandingEmployeesDemo from './LandingEmployeesDemo.vue'

const props = defineProps({ activeTab: { type:String, default:'tasks' } })
const emit = defineEmits(['update:activeTab'])
const { locale } = useI18n()
const c = computed(() => landingCopy[locale.value] || landingCopy.en)
const x = computed(() => experienceCopy[locale.value] || experienceCopy.en)
const active = ref(props.activeTab)
const demoKey = ref(0)
watch(() => props.activeTab, v => { if (v) active.value = v })
function selectTab(tab) { active.value = tab; emit('update:activeTab',tab) }
function onTabKeydown(event,index) {
  const ids = tabs.value.map(tab=>tab.id)
  let next = index
  if (event.key==='ArrowRight') next = (index+1) % ids.length
  else if (event.key==='ArrowLeft') next = (index+ids.length-1) % ids.length
  else if (event.key==='Home') next=0
  else if (event.key==='End') next=ids.length-1
  else return
  event.preventDefault()
  selectTab(ids[next])
  event.currentTarget.parentElement.querySelectorAll('[role="tab"]')[next]?.focus()
}
const tabs = computed(() => [
  ['tasks','Task'],['employees','Resume'],['search','Search'],['wiki','Read'],['messages','Messaging'],['appearance','Settings']
].map(([id,icon]) => ({id,icon,label:id==='employees' ? x.value.staff : c.value[id]})))

const query = ref('')
const searchCategory = ref('all')
const categories = computed(() => ['all','employees','projects','tasks'].map(id => ({id,label:c.value[id]})))
const searchItems = computed(() => [
  {id:1,type:'employees',name:c.value.personOne,sub:c.value.personOneRole,icon:'User'},
  {id:2,type:'employees',name:c.value.personTwo,sub:c.value.personTwoRole,icon:'User'},
  {id:3,type:'projects',name:c.value.projectOne,sub:c.value.progress,icon:'Business'},
  {id:4,type:'projects',name:c.value.projectTwo,sub:c.value.backlog,icon:'Business'},
  {id:5,type:'tasks',name:c.value.taskOne,sub:c.value.backlog,icon:'Task'},
  {id:6,type:'tasks',name:c.value.taskThree,sub:c.value.done,icon:'Done'},
])
const results = computed(() => searchItems.value.filter(x =>
  (searchCategory.value==='all' || x.type===searchCategory.value) &&
  (x.name+' '+x.sub).toLowerCase().includes(query.value.trim().toLowerCase())))
const wikiActive = ref('wikiOne')
const wikiPages = computed(() => ['wikiOne','wikiTwo','wikiThree'].map(id =>
  ({id,title:c.value[id],body:c.value[id+'Text']})))
const wikiPage = computed(() => wikiPages.value.find(x=>x.id===wikiActive.value) || wikiPages.value[0])
const defaultMessages = () => [{id:1,from:'colleague',key:'helloOne'},{id:2,from:'you',key:'helloTwo'}]
const chat = ref(defaultMessages())
const draft = ref('')
let nextMessageId = 3
function sendMessage() {
  const message = draft.value.trim().slice(0,240)
  if (!message) return
  chat.value = [...chat.value.slice(-7),{id:nextMessageId++,from:'you',message}]
  draft.value = ''
}
const accent = ref('#009cde')
const swatches = ['#009cde','#35b1a2','#5868d9','#ff8c66','#975fd2']
function reset() {
  demoKey.value += 1;query.value='';searchCategory.value='all'
  wikiActive.value='wikiOne';chat.value=defaultMessages();draft.value=''
  accent.value='#009cde'
}
</script>

<template>
<section id="interactive-demo" class="landing-demo" :style="{'--demo-accent':accent}" aria-labelledby="landing-demo-title">
  <div class="landing-demo__heading">
    <div><span class="landing-demo__intro-text">{{ c.demoBadge }}</span>
      <h2 id="landing-demo-title">{{ c.demoTitle }}</h2><p>{{ c.demoSubtitle }}</p></div>
    <button type="button" class="landing-demo__reset" @click="reset"><Icon icon="Refresh Cw"/> {{ c.demoReset }}</button>
  </div>
  <div class="landing-demo__shell">
    <div class="landing-demo__tabs" role="tablist" :aria-label="c.demoBadge">
      <button v-for="(tab,index) in tabs" :key="tab.id" type="button" role="tab"
              :id="'landing-tab-demo-'+tab.id" :aria-selected="active===tab.id"
              :tabindex="active===tab.id ? 0 : -1"
              :class="{'is-active':active===tab.id}" @click="selectTab(tab.id)" @keydown="onTabKeydown($event,index)">
        <Icon :icon="tab.icon"/> {{ tab.label }}
      </button>
    </div>
    <div class="landing-demo__body">
      <span class="landing-demo__safe"><Icon icon="Info"/> {{ c.sampleData }}</span>

      <div v-if="active==='tasks'" role="tabpanel" aria-labelledby="landing-tab-demo-tasks">
        <LandingTasksDemo :key="'tasks-'+demoKey" />
      </div>
      <div v-else-if="active==='employees'" role="tabpanel" aria-labelledby="landing-tab-demo-employees">
        <LandingEmployeesDemo :key="'employees-'+demoKey" />
      </div>

      <div v-else-if="active==='search'" role="tabpanel" aria-labelledby="landing-tab-demo-search">
        <p class="landing-demo__tip">{{ c.searchTip }}</p>
        <label class="landing-demo__search"><Icon icon="Search"/>
          <input v-model="query" type="search" autocomplete="off" maxlength="100"
                 :aria-label="c.search" :placeholder="c.searchPlaceholder"/>
        </label>
        <div class="landing-demo__filter" role="group" :aria-label="c.search">
          <button v-for="type in categories" :key="type.id" type="button"
                  :aria-pressed="searchCategory===type.id" :class="{'is-active':searchCategory===type.id}"
                  @click="searchCategory=type.id">{{ type.label }}</button>
        </div>
        <div class="landing-demo__results" aria-live="polite">
          <strong>{{ c.results }} · {{ results.length }}</strong>
          <p v-if="results.length===0">{{ c.emptyResults }}</p>
          <div v-for="item in results" :key="item.id" class="landing-demo__result">
            <Icon :icon="item.icon"/><div><strong>{{ item.name }}</strong><small>{{ item.sub }}</small></div>
          </div>
        </div>
      </div>

      <div v-else-if="active==='wiki'" role="tabpanel" aria-labelledby="landing-tab-demo-wiki">
        <p class="landing-demo__tip">{{ c.wikiTip }}</p>
        <div class="landing-demo__wiki">
          <div class="landing-demo__wiki-nav">
            <strong><Icon icon="Folder"/> {{ c.wiki }}</strong>
            <button v-for="page in wikiPages" :key="page.id" type="button"
                    :class="{'is-active':wikiActive===page.id}"
                    :aria-current="wikiActive===page.id ? 'page' : undefined"
                    @click="wikiActive=page.id"><Icon icon="Document"/> {{ page.title }}</button>
          </div>
          <article class="landing-demo__wiki-article" aria-live="polite">
            <div class="landing-demo__wiki-cover"></div>
            <small>{{ c.sampleArticle }}</small><h3>{{ wikiPage.title }}</h3><p>{{ wikiPage.body }}</p>
            <span>ITP ТОиР Wiki</span>
          </article>
        </div>
      </div>

      <div v-else-if="active==='messages'" role="tabpanel" aria-labelledby="landing-tab-demo-messages">
        <p class="landing-demo__tip">{{ c.messageTip }}</p>
        <div class="landing-demo__chat">
          <div class="landing-demo__chat-head"><span>ITP</span><strong>{{ c.colleague }}</strong></div>
          <div class="landing-demo__thread" role="log" :aria-label="c.messages">
            <div v-for="msg in chat" :key="msg.id" class="landing-demo__bubble" :class="{'from-me':msg.from==='you'}">
              <small>{{ msg.from==='you' ? c.you : c.colleague }}</small>
              {{ msg.message || c[msg.key] }}
            </div>
          </div>
          <form class="landing-demo__composer" @submit.prevent="sendMessage">
            <input v-model="draft" type="text" maxlength="240" autocomplete="off"
                   :placeholder="c.messageInput" :aria-label="c.messageInput"/>
            <button type="submit" :disabled="!draft.trim()">{{ c.send }} <Icon icon="Send"/></button>
          </form>
        </div>
      </div>

      <div v-else-if="active==='appearance'" role="tabpanel" aria-labelledby="landing-tab-demo-appearance">
        <p class="landing-demo__tip">{{ c.appearanceTip }}</p>
        <div class="landing-demo__appearance">
          <div class="landing-demo__palette">
            <strong>{{ c.chooseColor }}</strong>
            <div role="group" :aria-label="c.chooseColor">
              <button v-for="color in swatches" :key="color" type="button"
                      :style="{background:color}" :aria-label="color" :aria-pressed="accent===color"
                      :class="{'is-active':accent===color}" @click="accent=color">
                <Icon v-if="accent===color" icon="Done"/>
              </button>
            </div>
          </div>
          <div class="landing-demo__preview">
            <small><span></span> ITP ТОиР</small><h3>{{ c.yourWorkspace }}</h3>
            <p>{{ c.sceneWorkspaceText }}</p>
            <button type="button" @click="selectTab('tasks')">{{ c.viewTasks }} <Icon icon="Arrow Right"/></button>
          </div>
        </div>
      </div>
    </div>
  </div>
  <div class="landing-demo__footer">
    <span>{{ c.actionHint }}</span>
    <router-link to="/pricing">{{ c.openPricing }} <Icon icon="Arrow Right"/></router-link>
  </div>
</section>
</template>
<style scoped>
.landing-demo{width:min(1280px,100%);margin:42px auto 78px;padding:0 24px;box-sizing:border-box;scroll-margin-top:90px;color:#103341}
.landing-demo__heading{display:flex;align-items:end;justify-content:space-between;gap:18px;margin-bottom:24px}
.landing-demo__heading>div{max-width:840px}
.landing-demo__intro-text{display:block;color:#567784;font-size:12px;font-weight:600;letter-spacing:.035em;}
.landing-demo__eyebrow :deep(svg){width:15px;height:15px}
.landing-demo h2{margin:14px 0 10px;font-size:clamp(30px,3.6vw,44px);letter-spacing:-.04em;line-height:1.12}
.landing-demo__heading p{margin:0;font-size:15px;line-height:1.65;color:#587988}
.landing-demo__reset{display:flex;align-items:center;gap:8px;flex-shrink:0;border:1px solid #dceaf0;border-radius:9px;background:white;color:#557789;padding:10px 15px;font:inherit;font-size:12px;cursor:pointer}
.landing-demo__reset :deep(svg){width:16px;height:16px}
.landing-demo__shell{border:1px solid #dcebf0;background:#fff;border-radius:18px;overflow:hidden;box-shadow:0 18px 45px #174f6811}
.landing-demo__tabs{display:flex;flex-wrap:wrap;gap:7px;padding:15px;background:#f4f9fb;border-bottom:1px solid #e3edf1}
.landing-demo__tabs button{display:flex;align-items:center;justify-content:center;gap:8px;min-height:42px;padding:9px 15px;border:1px solid #e2ecf0;border-radius:9px;background:#fff;color:#4b7080;font:inherit;font-size:13px;cursor:pointer}
.landing-demo__tabs button.is-active{background:var(--demo-accent);color:#fff;border-color:var(--demo-accent)}
.landing-demo__tabs :deep(svg){width:16px;height:16px}
.landing-demo button:focus-visible{outline:2px solid var(--demo-accent);outline-offset:2px}
.landing-demo__body{min-height:290px;padding:24px}
.landing-demo__safe{display:inline-flex;align-items:center;gap:7px;color:#8299a4;font-size:11px}
.landing-demo__safe :deep(svg){width:14px;height:14px}
.landing-demo__tip{font-size:14px;color:#5b7b8b;line-height:1.5;margin:12px 0 19px}
.landing-demo__progress{height:6px;border-radius:8px;background:#eaf2f6;overflow:hidden;margin-bottom:17px}
.landing-demo__progress span{display:block;height:100%;border-radius:8px;background:var(--demo-accent);transition:width .22s}
.landing-demo__board{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:13px}
.landing-demo__column{min-width:0;min-height:180px;border-radius:10px;background:#f3f8fa;padding:12px}
.landing-demo__column-heading{display:flex;align-items:center;gap:8px;font-size:12px;margin-bottom:13px}
.landing-demo__column-heading span{background:#94a8b3;width:8px;height:8px;border-radius:50%}
.landing-demo__column-heading .state-progress{background:#009cde}.landing-demo__column-heading .state-done{background:#2aa88c}
.landing-demo__column-heading strong{flex:1}.landing-demo__column-heading small{background:#e2ecf0;padding:2px 7px;border-radius:14px}
.landing-demo__task{padding:14px;margin-bottom:9px;border:1px solid #e1ebef;border-radius:9px;background:#fff;box-shadow:0 5px 13px #0d475708}
.landing-demo__task>:deep(svg){width:16px;height:16px;color:var(--demo-accent)}
.landing-demo__task h3{font-size:13px;line-height:1.5;margin:8px 0 16px;min-height:34px}
.landing-demo__task-actions{display:flex;justify-content:space-between;gap:5px}
.landing-demo__task-actions button{display:flex;align-items:center;gap:3px;border:0;background:#eaf8fd;color:#087ead;border-radius:6px;padding:7px;font:inherit;font-size:11px;cursor:pointer}
.landing-demo__task-actions button:disabled{opacity:.25;cursor:not-allowed}
.landing-demo__task-actions :deep(svg){width:13px;height:13px}
.landing-demo__search{display:flex;align-items:center;gap:10px;border:1px solid #d5e8ed;background:#f9fcfd;border-radius:10px;padding:0 14px;min-height:46px}
.landing-demo__search>:deep(svg){width:18px;height:18px;color:#7394a1}
.landing-demo__search input{flex:1;min-width:0;border:0;outline:none;background:transparent;color:#123540;font:inherit;font-size:15px}
.landing-demo__filter{display:flex;flex-wrap:wrap;gap:7px;margin:12px 0 20px}
.landing-demo__filter button{border:1px solid #e0ebf0;border-radius:25px;padding:8px 13px;background:white;color:#5b7b88;font:inherit;font-size:12px;cursor:pointer}
.landing-demo__filter button.is-active{background:var(--demo-accent);color:#fff;border-color:var(--demo-accent)}
.landing-demo__results{max-width:780px}.landing-demo__results>strong{display:block;font-size:13px;margin-bottom:10px}
.landing-demo__results>p{padding:26px;border-radius:9px;background:#f5f9fb;color:#7592a0;text-align:center}
.landing-demo__result{display:flex;align-items:center;gap:11px;border:1px solid #e4edf1;border-radius:9px;padding:11px 14px;margin-bottom:7px}
.landing-demo__result>:deep(svg){width:19px;height:19px;color:var(--demo-accent)}
.landing-demo__result strong,.landing-demo__result small{display:block;font-size:13px}
.landing-demo__result small{color:#7c96a1;font-size:12px;margin-top:3px}
.landing-demo__wiki{display:grid;grid-template-columns:220px 1fr;min-height:310px;border:1px solid #e2ecf0;border-radius:10px;overflow:hidden}
.landing-demo__wiki-nav{display:flex;flex-direction:column;gap:4px;padding:14px;background:#edf5f8}
.landing-demo__wiki-nav>strong{display:flex;align-items:center;gap:6px;font-size:13px;margin:0 4px 12px}
.landing-demo__wiki-nav button{display:flex;align-items:center;gap:7px;border:0;background:transparent;color:#547688;padding:10px 9px;border-radius:7px;text-align:left;font:inherit;font-size:12px;cursor:pointer}
.landing-demo__wiki-nav button.is-active{background:white;color:#007dad}
.landing-demo__wiki-nav :deep(svg){width:16px;height:16px;flex-shrink:0}
.landing-demo__wiki-article{padding:0 25px 25px;min-width:0}
.landing-demo__wiki-cover{height:85px;margin:0 -25px 18px;background:linear-gradient(120deg,#e4f8ff,#c2e9fb,#ece0f8)}
.landing-demo__wiki-article small{font-size:11px;color:#7693a1}
.landing-demo__wiki-article h3{font-size:26px;margin:10px 0;line-height:1.2}
.landing-demo__wiki-article p{font-size:14px;line-height:1.7;color:#5c7c88}
.landing-demo__wiki-article>span{display:inline-block;color:#279ec3;font-size:12px;margin-top:12px}
.landing-demo__chat{max-width:680px;margin:auto;border:1px solid #dfebf0;border-radius:11px;overflow:hidden}
.landing-demo__chat-head{display:flex;align-items:center;gap:12px;background:#f4f9fa;padding:12px 15px;border-bottom:1px solid #e3edf1;font-size:13px}
.landing-demo__chat-head span{display:grid;place-items:center;width:36px;height:36px;border-radius:50%;background:var(--demo-accent);color:white;font-size:11px;font-weight:700}
.landing-demo__thread{display:flex;flex-direction:column;gap:9px;max-height:260px;min-height:176px;overflow-y:auto;background:#f1f8fa;padding:16px}
.landing-demo__bubble{align-self:flex-start;max-width:82%;background:#fff;border:1px solid #e2ecf0;border-radius:11px;padding:11px 13px;line-height:1.5;font-size:13px;overflow-wrap:anywhere}
.landing-demo__bubble.from-me{align-self:flex-end;background:#dff5ff}
.landing-demo__bubble small{display:block;font-size:11px;color:#6797a8;margin-bottom:4px}
.landing-demo__composer{display:flex;align-items:center;gap:8px;padding:10px;background:#fff}
.landing-demo__composer input{flex:1;min-width:0;min-height:40px;padding:8px 12px;border:1px solid #dbe9ee;border-radius:8px;font:inherit;font-size:14px}
.landing-demo__composer button{display:flex;align-items:center;gap:7px;border:0;background:var(--demo-accent);color:white;border-radius:8px;min-height:40px;padding:9px 13px;cursor:pointer;font:inherit;font-size:12px}
.landing-demo__composer button:disabled{opacity:.5;cursor:not-allowed}
.landing-demo__composer :deep(svg){width:15px;height:15px}
.landing-demo__appearance{display:grid;grid-template-columns:1fr 1.2fr;gap:17px;max-width:850px}
.landing-demo__palette,.landing-demo__preview{border:1px solid #e3edf1;border-radius:10px;padding:23px;background:#f9fcfd}
.landing-demo__palette>strong{font-size:14px;display:block;margin-bottom:20px}
.landing-demo__palette>div{display:flex;flex-wrap:wrap;gap:10px}
.landing-demo__palette button{width:34px;height:34px;border:3px solid white;box-shadow:0 0 0 1px #cbdce4;color:white;border-radius:50%;display:grid;place-items:center;cursor:pointer}
.landing-demo__palette button.is-active{box-shadow:0 0 0 2px var(--demo-accent)}
.landing-demo__palette :deep(svg){width:17px;height:17px}
.landing-demo__preview{background:white}
.landing-demo__preview small{display:flex;align-items:center;gap:7px;font-size:12px}
.landing-demo__preview small span{width:19px;height:19px;border-radius:6px;background:var(--demo-accent)}
.landing-demo__preview h3{font-size:23px;margin:22px 0 10px}
.landing-demo__preview p{font-size:13px;line-height:1.6;color:#5d8190}
.landing-demo__preview button{display:flex;align-items:center;gap:7px;border:0;border-radius:7px;background:var(--demo-accent);padding:10px 15px;color:white;font:inherit;font-size:12px;cursor:pointer}
.landing-demo__preview button :deep(svg){width:15px;height:15px}
.landing-demo__footer{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-top:17px;font-size:13px;color:#7792a1}
.landing-demo__footer a{display:flex;align-items:center;gap:7px;color:#0488bc;text-decoration:none;font-weight:600}
.landing-demo__footer a :deep(svg){width:15px;height:15px}
@media(max-width:800px){.landing-demo__board{gap:7px}.landing-demo__column{padding:8px}.landing-demo__task{padding:10px}}
@media(max-width:600px){.landing-demo{padding:0 16px;margin:32px auto 52px}
 .landing-demo__heading{flex-direction:column;align-items:stretch}.landing-demo__reset{align-self:flex-start}
 .landing-demo__tabs{padding:10px;gap:6px}.landing-demo__tabs button{flex:1 1 40%;font-size:12px;padding:8px}
 .landing-demo__body{padding:15px}.landing-demo__board{display:flex;flex-direction:column}
 .landing-demo__column{min-height:75px}.landing-demo__task h3{min-height:0}
 .landing-demo__wiki{grid-template-columns:1fr}.landing-demo__wiki-nav{flex-direction:row;flex-wrap:wrap}
 .landing-demo__wiki-nav>strong{width:100%}.landing-demo__wiki-article{padding:0 17px 21px}
 .landing-demo__wiki-cover{margin-inline:-17px}.landing-demo__appearance{grid-template-columns:1fr}
 .landing-demo__footer{flex-direction:column;align-items:flex-start}
}
@media(prefers-reduced-motion:reduce){.landing-demo *{transition:none!important}}
</style>

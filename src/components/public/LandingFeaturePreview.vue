<script setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { Icon } from '@itpmining/vue-basic-components'
import { landingCopy } from './landingCopy.js'
import { experienceCopy } from './publicExperienceCopy.js'

const props = defineProps({ kind: { type:String,required:true } })
const { locale } = useI18n()
const c = computed(() => landingCopy[locale.value] || landingCopy.en)
const x = computed(() => experienceCopy[locale.value] || experienceCopy.en)
const staff = computed(() => x.value.staffData.slice(0,3))
const titles = computed(() => {
  if (props.kind==='people') return x.value.staff
  if (props.kind==='wiki') return c.value.wiki
  if (props.kind==='chat') return c.value.messages
  return c.value.tasks
})
</script>
<template>
  <div class="landing-feature-preview">
    <div class="landing-feature-preview__top">
      <span class="landing-feature-preview__brand">ITP</span>
      <strong>{{ titles }}</strong>
      <Icon icon="More Horizontal" />
    </div>
    <div v-if="kind==='people'" class="landing-feature-preview__rows">
      <div v-for="person in staff" :key="person.id" class="landing-feature-preview__row">
        <span class="landing-feature-preview__avatar">{{ person.initials }}</span>
        <div><strong>{{ person.name }}</strong><small>{{ person.role }}</small></div>
        <Icon icon="Chevron Right" />
      </div>
    </div>
    <div v-else-if="kind==='chat'" class="landing-feature-preview__chat">
      <span>{{ c.helloOne }}</span><span>{{ c.helloTwo }}</span>
      <div class="landing-feature-preview__chat-input">{{ c.messageInput }}</div>
    </div>
    <div v-else-if="kind==='wiki'" class="landing-feature-preview__wiki">
      <div class="landing-feature-preview__wiki-cover"></div>
      <h3>{{ c.wikiOne }}</h3><p>{{ c.wikiOneText }}</p>
      <div v-for="article in [c.wikiTwo,c.wikiThree]" :key="article" class="landing-feature-preview__row">
        <Icon icon="Document" /><span>{{ article }}</span><Icon icon="Chevron Right" />
      </div>
    </div>
    <div v-else class="landing-feature-preview__board">
      <div v-for="(status,index) in [c.backlog,c.progress,c.done]" :key="status">
        <strong><span class="landing-feature-preview__dot"></span>{{ status }}</strong>
        <p>{{ x.tasksExtra[[0,1,2][index]] }}</p>
        <p v-if="index===0">{{ x.tasksExtra[3] }}</p>
      </div>
    </div>
  </div>
</template>
<style scoped>
.landing-feature-preview{width:100%;height:100%;min-height:282px;background:white;color:#193b4a;text-align:left;overflow:hidden}
.landing-feature-preview__top{height:48px;display:flex;align-items:center;gap:9px;padding:0 16px;background:#f8fbfd;border-bottom:1px solid #e6edf1}
.landing-feature-preview__brand{background:#009cde;color:white;border-radius:5px;padding:4px 5px;font-weight:800;font-size:10px}
.landing-feature-preview__top strong{font-size:13px;font-weight:650;flex:1}
.landing-feature-preview__top :deep(svg){width:15px;height:15px;color:#7a9ba7}
.landing-feature-preview__rows{padding:9px 14px}
.landing-feature-preview__row{display:flex;align-items:center;gap:10px;padding:13px 4px;border-bottom:1px solid #ebf1f4;min-width:0}
.landing-feature-preview__row>div{flex:1;min-width:0}
.landing-feature-preview__row strong,.landing-feature-preview__row small{display:block;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.landing-feature-preview__row strong{font-size:12px}.landing-feature-preview__row small{font-size:10px;color:#75919c;margin-top:4px}
.landing-feature-preview__row :deep(svg){width:16px;height:16px;color:#8199a6;flex-shrink:0}
.landing-feature-preview__avatar{width:34px;height:34px;display:grid;place-items:center;background:#e3f4fd;border-radius:50%;color:#1489bd;font-size:11px;font-weight:650;flex-shrink:0}
.landing-feature-preview__chat{padding:18px;display:flex;flex-direction:column;gap:13px;background:#f6fbfd;min-height:232px}
.landing-feature-preview__chat span{max-width:82%;background:white;border:1px solid #e3edf1;padding:13px;border-radius:10px;font-size:12px;line-height:1.45}
.landing-feature-preview__chat span:nth-child(2){align-self:flex-end;background:#e1f7ff}
.landing-feature-preview__chat-input{margin-top:auto;border:1px solid #e2eaf1;border-radius:20px;padding:12px;background:white;font-size:11px;color:#8296a0}
.landing-feature-preview__wiki{padding:0 18px 14px}
.landing-feature-preview__wiki-cover{height:62px;margin:0 -18px 14px;background:linear-gradient(105deg,#d6effb,#eee8fa)}
.landing-feature-preview__wiki h3{font-size:18px;margin:0 0 8px;color:#183a49}
.landing-feature-preview__wiki p{font-size:11px;line-height:1.55;color:#577481;margin:0 0 9px;display:-webkit-box;-webkit-box-orient:vertical;-webkit-line-clamp:2;overflow:hidden}
.landing-feature-preview__wiki .landing-feature-preview__row{font-size:11px;padding:9px 3px}
.landing-feature-preview__wiki .landing-feature-preview__row span{flex:1}
.landing-feature-preview__board{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px;padding:14px;min-height:200px}
.landing-feature-preview__board>div{min-width:0;background:#eff7fa;padding:9px;border-radius:7px}
.landing-feature-preview__board strong{display:flex;align-items:center;gap:5px;font-size:10px;line-height:1.3}
.landing-feature-preview__dot{width:7px;height:7px;background:#009cde;border-radius:50%;flex-shrink:0}
.landing-feature-preview__board p{font-size:10px;line-height:1.5;margin:11px 0 0;background:white;padding:9px 7px;border-radius:6px;overflow-wrap:anywhere}
@media(max-width:540px){.landing-feature-preview{min-height:250px}.landing-feature-preview__board{gap:5px;padding:10px}.landing-feature-preview__board>div{padding:7px}.landing-feature-preview__board p{padding:6px}}
</style>

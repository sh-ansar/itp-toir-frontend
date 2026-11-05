<script setup>
import { computed,ref,watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { Icon } from '@itpmining/vue-basic-components'
import { landingCopy } from './landingCopy.js'
import { experienceCopy } from './publicExperienceCopy.js'
import { printPublicDemo } from './printPublicDemo.js'
const { locale } = useI18n()
const c = computed(() => landingCopy[locale.value] || landingCopy.en)
const x = computed(() => experienceCopy[locale.value] || experienceCopy.en)
const view = ref('list')
const dept = ref('all')
const keyword = ref('')
const selectedId = ref('irina')
const departments = computed(() => ['all','office','operations','it'].map(id => ({
  id,label:id==='all' ? x.value.allDepartments : x.value[id]
})))
const filtered = computed(() => x.value.staffData.filter(person =>
  (dept.value==='all' || dept.value===person.dept) &&
  (person.name+' '+person.role+' '+x.value[person.dept]).toLowerCase().includes(keyword.value.trim().toLowerCase())))
const selected = computed(() => x.value.staffData.find(person => person.id===selectedId.value) || x.value.staffData[0])
function printPeople() {
  printPublicDemo({
    title:x.value.staff,lang:locale.value,note:c.value.sampleData,
    headers:[x.value.staff,x.value.position,x.value.department],
    rows:filtered.value.map(person => [person.name,person.role,x.value[person.dept]])
  })
}
watch(locale,()=>{keyword.value=''})
</script>
<template>
  <div class="demo-people">
    <p class="demo-people__tip">{{ x.staffTip }}</p>
    <div class="demo-people__toolbar">
      <div class="demo-people__toggle" role="group" :aria-label="x.staff">
        <button type="button" :class="{'selected':view==='list'}" :aria-pressed="view==='list'" @click="view='list'">
          <Icon icon="List" /> {{ x.list }}</button>
        <button type="button" :class="{'selected':view==='org'}" :aria-pressed="view==='org'" @click="view='org'">
          <Icon icon="Users" /> {{ x.org }}</button>
      </div>
      <label class="demo-people__search"><Icon icon="Search" />
        <input v-model="keyword" type="search" maxlength="100" autocomplete="off"
               :placeholder="x.staffSearchPlaceholder" :aria-label="x.staffSearch"/>
      </label>
      <button type="button" class="demo-people__print" @click="printPeople"><Icon icon="Printer" /> {{ x.print }}</button>
    </div>
    <div class="demo-people__filters" role="group" :aria-label="x.department">
      <button v-for="item in departments" :key="item.id" type="button" :aria-pressed="dept===item.id"
              :class="{'selected':dept===item.id}" @click="dept=item.id">{{ item.label }}</button>
    </div>
    <div class="demo-people__count">{{ x.teamCount }}: {{ filtered.length }}</div>
    <div class="demo-people__layout">
      <div :class="['demo-people__directory',{'is-org':view==='org'}]">
        <button v-for="person in filtered" :key="person.id" type="button"
                :aria-pressed="selectedId===person.id" :class="{'is-selected':selectedId===person.id}"
                @click="selectedId=person.id">
          <span class="demo-people__avatar">{{ person.initials }}</span>
          <span class="demo-people__name"><strong>{{ person.name }}</strong>
            <small>{{ person.role }}</small></span>
          <Icon icon="Chevron Right" />
        </button>
        <p v-if="filtered.length===0" class="demo-people__empty">{{ x.emptyStaff }}</p>
      </div>
      <aside class="demo-people__profile" aria-live="polite">
        <span class="demo-people__profile-avatar">{{ selected.initials }}</span>
        <small>{{ x.card }}</small>
        <h3>{{ selected.name }}</h3>
        <p>{{ selected.role }}</p>
        <div><span>{{ x.department }}</span><strong>{{ x[selected.dept] }}</strong></div>
        <div><span>{{ x.position }}</span><strong>{{ selected.role }}</strong></div>
      </aside>
    </div>
  </div>
</template>
<style scoped>
.demo-people{min-width:0;color:#1b3d4b}
.demo-people__tip{margin:12px 0 19px;color:#5b7b8b;line-height:1.55;font-size:14px}
.demo-people__toolbar{display:flex;align-items:center;gap:9px;flex-wrap:wrap;margin-bottom:12px}
.demo-people button{font:inherit;cursor:pointer}
.demo-people__toggle{display:flex;gap:4px;padding:4px;background:#f6fafc;border:1px solid #e1ecf0;border-radius:9px}
.demo-people__toggle button,.demo-people__print{display:flex;align-items:center;justify-content:center;gap:6px;min-height:36px;
  padding:8px 11px;border:0;border-radius:6px;background:transparent;color:#55778a;font-size:12px}
.demo-people__toggle button.selected{background:white;color:#234a5b;box-shadow:0 2px 7px #17445912}
.demo-people :deep(svg){width:16px;height:16px;flex-shrink:0}
.demo-people__search{display:flex;align-items:center;gap:8px;min-height:43px;flex:1;min-width:165px;
  border:1px solid #dce8ee;background:white;border-radius:9px;padding:0 12px;color:#7a95a0}
.demo-people__search input{flex:1;min-width:0;border:0;outline:0;background:transparent;color:#15394a;font:inherit;font-size:13px}
.demo-people__print{border:1px solid #dce8ee;background:white;border-radius:9px;min-height:43px;padding:8px 14px}
.demo-people__print:hover{background:#f3f9fb}
.demo-people__filters{display:flex;flex-wrap:wrap;gap:7px;margin:0 0 17px}
.demo-people__filters button{font-size:12px;border:1px solid #e0ebef;background:white;color:#5c7b89;
  border-radius:24px;padding:8px 12px}
.demo-people__filters button.selected{background:#e8f4fa;color:#24596f;border-color:#bcd9e7}
.demo-people__count{font-size:12px;color:#7b95a1;margin:-5px 0 13px}
.demo-people__layout{display:grid;grid-template-columns:minmax(0,1.4fr) minmax(235px,.8fr);gap:16px}
.demo-people__directory{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:9px;align-content:start;min-width:0}
.demo-people__directory>button{min-width:0;display:flex;align-items:center;gap:10px;background:#fff;
  border:1px solid #e1ebef;border-radius:10px;padding:12px;text-align:left;color:#234758}
.demo-people__directory>button:hover{border-color:#99bfcd}
.demo-people__directory>button.is-selected{background:#f0f8fb;border-color:#aed3e2}
.demo-people__avatar{width:37px;height:37px;min-width:37px;display:grid;place-items:center;border-radius:50%;
  background:#e2f1f9;color:#1384b8;font-size:11px;font-weight:700}
.demo-people__name{flex:1;min-width:0}
.demo-people__name strong,.demo-people__name small{display:block;white-space:nowrap;text-overflow:ellipsis;overflow:hidden}
.demo-people__name strong{font-size:12px;line-height:1.45}
.demo-people__name small{font-size:10px;color:#7a95a1;margin-top:4px}
.demo-people__directory>button :deep(svg){width:15px;height:15px;color:#8ba7b5}
.demo-people__directory.is-org{display:flex;flex-direction:column;gap:9px;align-items:stretch;
  border-radius:12px;padding:18px;background:#f3f8fa;max-height:500px;overflow-y:auto}
.demo-people__directory.is-org>button{max-width:390px;width:100%;margin:0 auto;position:relative}
.demo-people__directory.is-org>button+button:before{content:"";position:absolute;top:-10px;left:27px;height:9px;width:1px;background:#b2ccdb}
.demo-people__profile{background:#f5fafc;border:1px solid #dcebf1;border-radius:12px;padding:22px;min-width:0;
  display:flex;flex-direction:column;align-items:flex-start;overflow-wrap:anywhere}
.demo-people__profile-avatar{display:grid;place-items:center;background:#d9f0fa;color:#148abc;border-radius:15px;
  width:64px;height:64px;font-size:19px;font-weight:700;margin-bottom:15px}
.demo-people__profile>small{font-size:11px;color:#829ba8}
.demo-people__profile h3{font-size:22px;line-height:1.24;margin:10px 0}
.demo-people__profile p{font-size:13px;color:#5c7e8d;margin:0 0 23px}
.demo-people__profile>div{display:flex;flex-direction:column;gap:5px;font-size:12px;margin-bottom:14px}
.demo-people__profile>div span{color:#839ca6}
.demo-people__profile>div strong{font-weight:600;color:#375b6c}
.demo-people__empty{text-align:center;font-size:13px;color:#7996a5;padding:26px}
.demo-people button:focus-visible{outline:2px solid #597b8c;outline-offset:2px}
@media(max-width:850px){.demo-people__layout{grid-template-columns:1fr}.demo-people__profile{padding:17px}}
@media(max-width:580px){.demo-people__directory{grid-template-columns:1fr}.demo-people__search{order:2;flex-basis:100%}
.demo-people__toggle{flex:1;justify-content:center}.demo-people__print{flex-shrink:0}}
</style>

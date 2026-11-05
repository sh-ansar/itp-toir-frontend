<script setup>
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { Icon } from '@itpmining/vue-basic-components'
import { landingCopy } from './landingCopy.js'
import { experienceCopy } from './publicExperienceCopy.js'
import { printPublicDemo } from './printPublicDemo.js'

const { locale } = useI18n()
const c = computed(() => landingCopy[locale.value] || landingCopy.en)
const x = computed(() => experienceCopy[locale.value] || experienceCopy.en)
const states = ['backlog','progress','done']
const initial = () => [
  { id:1,index:0,state:'backlog',owner:'alex' },
  { id:2,index:1,state:'progress',owner:'maria' },
  { id:3,index:2,state:'done',owner:'dana' },
  { id:4,index:3,state:'backlog',owner:'dana' },
  { id:5,index:4,state:'backlog',owner:'irina' },
  { id:6,index:5,state:'progress',owner:'timur' },
  { id:7,index:6,state:'done',owner:'andrey' },
  { id:8,index:7,state:'backlog',owner:'aliya' },
]
const tasks = ref(initial())
const view = ref('board')
const keyword = ref('')
const status = ref('all')
const done = computed(() => tasks.value.filter(t => t.state==='done').length)
const filtered = computed(() => tasks.value.filter(t =>
  (status.value==='all' || t.state===status.value) &&
  x.value.tasksExtra[t.index].toLowerCase().includes(keyword.value.trim().toLowerCase())))
const assignee = task => x.value.staffData.find(p => p.id===task.owner)?.name || ''
function move(id,delta) {
  tasks.value = tasks.value.map(task => task.id===id ? {
    ...task,state:states[Math.max(0,Math.min(2,states.indexOf(task.state)+delta))]
  } : task)
}
function printTasks() {
  printPublicDemo({
    title:c.value.tasks,lang:locale.value,note:c.value.sampleData,
    headers:[c.value.tasks,x.value.status,x.value.assignee],
    rows:filtered.value.map(t => [x.value.tasksExtra[t.index],c.value[t.state],assignee(t)])
  })
}
watch(locale,()=>{keyword.value=''})
</script>
<template>
  <div class="demo-tasks">
    <p class="demo-tasks__tip">{{ c.taskTip }}</p>
    <div class="demo-tasks__toolbar">
      <div class="demo-tasks__toggle" role="group" :aria-label="x.board">
        <button type="button" :aria-pressed="view==='board'" :class="{'selected':view==='board'}" @click="view='board'">
          <Icon icon="Layout Dashboard" /> {{ x.board }}</button>
        <button type="button" :aria-pressed="view==='list'" :class="{'selected':view==='list'}" @click="view='list'">
          <Icon icon="List" /> {{ x.list }}</button>
      </div>
      <label class="demo-tasks__search"><Icon icon="Search" />
        <input v-model="keyword" type="search" maxlength="100" autocomplete="off"
               :placeholder="x.taskSearchPlaceholder" :aria-label="x.taskSearch" />
      </label>
      <button type="button" class="demo-tasks__print" @click="printTasks">
        <Icon icon="Printer" /> {{ x.print }}
      </button>
    </div>
    <div class="demo-tasks__filters" role="group" :aria-label="x.status">
      <button v-for="state in ['all',...states]" :key="state" type="button"
              :aria-pressed="status===state" :class="{'selected':status===state}"
              @click="status=state">{{ state==='all' ? c.all : c[state] }}</button>
    </div>
    <div class="landing-demo__progress" role="progressbar" :aria-label="c.done"
         :aria-valuenow="done" aria-valuemin="0" :aria-valuemax="tasks.length">
      <span :style="{width:100*done/tasks.length+'%'}"></span>
    </div>
    <div v-if="view==='board'" class="landing-demo__board">
      <div v-for="state in states" :key="state" class="landing-demo__column">
        <div class="demo-tasks__column-head">
          <span :class="'state-'+state"></span><strong>{{ c[state] }}</strong>
          <small>{{ filtered.filter(t=>t.state===state).length }}</small>
        </div>
        <article v-for="task in filtered.filter(t=>t.state===state)" :key="task.id" class="landing-demo__task">
          <Icon icon="Task" />
          <h3>{{ x.tasksExtra[task.index] }}</h3>
          <small class="demo-tasks__owner">{{ assignee(task) }}</small>
          <div class="landing-demo__task-actions">
            <button type="button" :disabled="state==='backlog'" :aria-label="c.moveBack+' · '+x.tasksExtra[task.index]"
                    @click="move(task.id,-1)"><Icon icon="Chevron Left" />{{ c.moveBack }}</button>
            <button type="button" :disabled="state==='done'" :aria-label="c.moveNext+' · '+x.tasksExtra[task.index]"
                    @click="move(task.id,1)">{{ c.moveNext }}<Icon icon="Chevron Right" /></button>
          </div>
        </article>
      </div>
    </div>
    <div v-else class="demo-tasks__table-wrap">
      <table class="demo-tasks__table">
        <thead><tr><th>{{ c.tasks }}</th><th>{{ x.assignee }}</th><th>{{ x.status }}</th><th></th></tr></thead>
        <tbody><tr v-for="task in filtered" :key="task.id">
          <td>{{ x.tasksExtra[task.index] }}</td>
          <td>{{ assignee(task) }}</td>
          <td><span class="demo-tasks__status">{{ c[task.state] }}</span></td>
          <td class="demo-tasks__table-actions">
            <button type="button" :disabled="task.state==='backlog'" :aria-label="c.moveBack"
                    @click="move(task.id,-1)"><Icon icon="Chevron Left" /></button>
            <button type="button" :disabled="task.state==='done'" :aria-label="c.moveNext"
                    @click="move(task.id,1)"><Icon icon="Chevron Right" /></button>
          </td>
        </tr></tbody>
      </table>
    </div>
    <p v-if="filtered.length===0" class="demo-tasks__empty">{{ c.emptyResults }}</p>
  </div>
</template>
<style scoped>
.demo-tasks{min-width:0;color:#1b3d4c}
.demo-tasks__tip{color:#5b7b8b;font-size:14px;margin:12px 0 19px;line-height:1.55}
.demo-tasks__toolbar{display:flex;flex-wrap:wrap;gap:9px;align-items:center;margin-bottom:12px}
.demo-tasks__toggle{display:flex;gap:4px;padding:4px;background:#f6fafc;border:1px solid #e1ecf0;border-radius:9px}
.demo-tasks button{font:inherit;cursor:pointer}
.demo-tasks__toggle button,.demo-tasks__print{display:flex;align-items:center;justify-content:center;gap:6px;min-height:36px;padding:8px 11px;
  font-size:12px;border:0;border-radius:6px;background:transparent;color:#55778a}
.demo-tasks__toggle button.selected{background:white;color:#234a5b;box-shadow:0 2px 7px #17445912}
.demo-tasks :deep(svg){width:16px;height:16px;flex-shrink:0}
.demo-tasks__search{display:flex;align-items:center;gap:8px;flex:1;min-width:160px;padding:0 12px;min-height:43px;
  border:1px solid #dce8ee;border-radius:9px;color:#7a95a0;background:#fff}
.demo-tasks__search input{flex:1;min-width:0;outline:none;border:0;background:transparent;font:inherit;font-size:13px;color:#15394a}
.demo-tasks__print{background:white;border:1px solid #dce8ee;min-height:43px;padding:8px 14px}
.demo-tasks__print:hover{background:#f3f9fb}
.demo-tasks__filters{display:flex;flex-wrap:wrap;gap:7px;margin:0 0 17px}
.demo-tasks__filters button{font-size:12px;padding:8px 12px;border-radius:30px;border:1px solid #e0ebef;background:#fff;color:#5c7b89}
.demo-tasks__filters button.selected{background:#e8f4fa;color:#24596f;border-color:#bcd9e7}
.landing-demo__progress{height:6px;background:#eaf2f5;border-radius:8px;overflow:hidden;margin-bottom:18px}
.landing-demo__progress span{display:block;height:100%;background:#009cde;transition:width .22s}
.landing-demo__board{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px}
.landing-demo__column{background:#f2f7f9;border-radius:10px;min-height:180px;padding:11px;min-width:0}
.demo-tasks__column-head{display:flex;align-items:center;gap:8px;font-size:12px;margin-bottom:12px}
.demo-tasks__column-head span{background:#a1b6c0;width:8px;height:8px;border-radius:50%}
.demo-tasks__column-head .state-progress{background:#199ed5}.demo-tasks__column-head .state-done{background:#29a995}
.demo-tasks__column-head strong{flex:1}.demo-tasks__column-head small{background:#dfecf1;padding:3px 7px;border-radius:14px}
.landing-demo__task{background:#fff;border:1px solid #e2ecf0;border-radius:9px;padding:12px;margin-bottom:9px;box-shadow:0 2px 7px #1f50640a;min-width:0}
.landing-demo__task>:deep(svg){width:16px;height:16px;color:#148ac0}
.landing-demo__task h3{font-size:12px;line-height:1.5;margin:8px 0 9px;overflow-wrap:anywhere}
.demo-tasks__owner{font-size:10px;color:#7796a3;display:block;margin-bottom:14px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.landing-demo__task-actions{display:flex;justify-content:space-between;gap:5px}
.landing-demo__task-actions button{display:flex;align-items:center;gap:3px;border:0;border-radius:6px;background:#eaf5fa;color:#327a98;
  padding:6px;font-size:10px}
.landing-demo__task-actions button:disabled,.demo-tasks__table-actions button:disabled{opacity:.28;cursor:not-allowed}
.landing-demo__task-actions :deep(svg){width:12px;height:12px}
.demo-tasks__table-wrap{overflow-x:auto;border:1px solid #e1ebef;border-radius:9px}
.demo-tasks__table{border-collapse:collapse;width:100%;min-width:550px;font-size:12px}
.demo-tasks__table th{text-align:left;padding:13px;background:#f2f7fa;color:#597b8a;font-weight:650}
.demo-tasks__table td{padding:12px;border-top:1px solid #ebf1f4}
.demo-tasks__status{background:#ecf3f7;border-radius:5px;padding:6px 8px;color:#497283}
.demo-tasks__table-actions{white-space:nowrap;text-align:right}
.demo-tasks__table-actions button{border:1px solid #dce9ee;border-radius:5px;background:white;color:#4f8198;margin-left:4px;padding:5px}
.demo-tasks__empty{text-align:center;padding:24px;color:#8299a5}
.demo-tasks button:focus-visible{outline:2px solid #5c7a88;outline-offset:2px}
@media(max-width:650px){.landing-demo__board{grid-template-columns:1fr}.landing-demo__column{min-height:65px}
.demo-tasks__search{order:2;flex-basis:100%}.demo-tasks__toggle{flex:1}}
@media(prefers-reduced-motion:reduce){.landing-demo__progress span{transition:none}}
</style>

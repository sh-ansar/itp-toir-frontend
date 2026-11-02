<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { ChevronLeft, ChevronRight, CalendarDays, RefreshCcw, Search, X, ArrowUpRight } from 'lucide-vue-next'
import BasePageHeading from '../../components/ui/BasePageHeading.vue'
import BaseNotice from '../../components/ui/BaseNotice.vue'
import BaseStatusPill from '../../components/ui/BaseStatusPill.vue'
import { loadSchedule } from '../../api/resources'
import { STATUS_LABELS } from '../../config/toirModules'
import { useSessionStore } from '../../stores/session'
import { usePreviewStore } from '../../stores/preview'
import type { ToirRecord } from '../../types/toir'

const session=useSessionStore()
const preview=usePreviewStore()
const offset=ref(0)
const orders=ref<ToirRecord[]>([])
const loading=ref(false)
const error=ref('')
const search=ref('')
const selected=ref<ToirRecord|null>(null)

function iso(dt:Date){return dt.getFullYear()+'-'+String(dt.getMonth()+1).padStart(2,'0')+'-'+String(dt.getDate()).padStart(2,'0')}
const days=computed(()=>{
  const start=new Date()
  const weekday=start.getDay()
  start.setDate(start.getDate()-(weekday===0?6:weekday-1)+offset.value*7)
  return Array.from({length:7},(_,i)=>{
    const d=new Date(start);d.setDate(start.getDate()+i)
    return {date:iso(d),label:d.toLocaleDateString('ru-RU',{weekday:'short'}),
      num:d.toLocaleDateString('ru-RU',{day:'2-digit',month:'2-digit'}),
      today:iso(d)===iso(new Date())}
  })
})
const team=computed(()=>{
  const needle=search.value.trim().toLocaleLowerCase('ru')
  return [...new Set(orders.value.map(order=>order.employee?.name||'Без исполнителя'))]
    .filter(name=>!needle||
      name.toLocaleLowerCase('ru').includes(needle)||
      orders.value.some(order=>(order.employee?.name||'Без исполнителя')===name
        &&(order.title||'').toLocaleLowerCase('ru').includes(needle)))
    .sort((a,b)=>a.localeCompare(b,'ru'))
})
const weeklyCount=computed(()=>orders.value.filter(order=>
  !!order.planned_start&&order.planned_start.slice(0,10)>=days.value[0].date
  &&order.planned_start.slice(0,10)<=days.value[6].date).length)
function matching(name:string,date:string){
  return orders.value.filter(order=>(order.employee?.name||'Без исполнителя')===name
    &&order.planned_start?.slice(0,10)===date)
}
function tone(value?:string):'success'|'warning'|'danger'|'info'|'neutral'{
  if(value==='closed')return 'success'
  if(value==='overdue')return 'danger'
  if(value==='waiting')return 'warning'
  if(value==='in_progress')return 'info'
  return 'neutral'
}
async function load(){
  loading.value=true;error.value=''
  try{orders.value=(await loadSchedule()).orders}
  catch(cause){error.value=cause instanceof Error?cause.message:'Не удалось загрузить расписание'}
  finally{loading.value=false}
}
function shift(amount:number){offset.value+=amount;selected.value=null}
watch(()=>session.session?.active_company_id,()=>{selected.value=null;void load()})
watch(()=>preview.enabled,()=>{selected.value=null;void load()})
onMounted(()=>void load())
</script>

<template>
  <div class="schedule-page">
    <div class="toir-breadcrumb">Ремонт и обслуживание / Расписание</div>
    <BasePageHeading title="Расписание" />
    <BaseNotice v-if="error" tone="error">{{ error }}</BaseNotice>
    <div class="registry-toolbar">
      <div class="toolbar-leading">
        <div class="schedule-controls">
          <button type="button" aria-label="Предыдущая неделя" @click="shift(-1)"><ChevronLeft :size="18"/></button>
          <button type="button" @click="offset=0;selected=null">Сегодня</button>
          <button type="button" aria-label="Следующая неделя" @click="shift(1)"><ChevronRight :size="18"/></button>
        </div>
        <strong class="schedule-period">{{ days[0]?.num }} — {{ days[6]?.num }}</strong>
        <span class="schedule-count">{{ weeklyCount }} работ</span>
      </div>
      <div class="toolbar-actions">
        <label class="schedule-search"><Search :size="15" aria-hidden="true"/>
          <input v-model="search" type="search" placeholder="Поиск по сотрудникам" aria-label="Поиск в расписании" />
        </label>
        <button type="button" class="toolbar-icon" aria-label="Обновить" :disabled="loading" @click="load">
          <RefreshCcw :size="18"/>
        </button>
      </div>
    </div>
    <div class="schedule-layout" :class="{'schedule-layout--inspecting':!!selected}">
      <div class="schedule-scroll">
        <div class="schedule-grid">
          <div class="schedule-cell team-head">Рабочие группы / сотрудники</div>
          <div v-for="day in days" :key="day.date" class="schedule-cell day-head" :class="{today:day.today}">
            <span>{{ day.label }}</span><strong>{{ day.num }}</strong>
          </div>
          <template v-for="name in team" :key="name">
            <div class="schedule-cell employee-head">{{ name }}</div>
            <div v-for="day in days" :key="name+day.date"
              class="schedule-cell day-slot" :class="{today:day.today}">
              <button v-for="order in matching(name,day.date)" :key="order.id" type="button"
                class="schedule-event" :class="{'schedule-event--selected':selected?.id===order.id}"
                :title="order.title" @click="selected=order">
                <strong>{{ order.number }}</strong><span>{{ order.title }}</span>
              </button>
            </div>
          </template>
        </div>
        <div v-if="!team.length&&!loading" class="schedule-empty">
          <CalendarDays :size="28"/><strong>Расписание пока пустое</strong>
          <p>Добавьте наряды с плановым временем и исполнителями.</p>
        </div>
      </div>
      <aside v-if="selected" class="planning-inspector schedule-inspector" aria-label="Детали наряда">
        <header><small>{{ selected.number }}</small>
          <button type="button" aria-label="Закрыть просмотр" @click="selected=null"><X :size="18"/></button>
        </header>
        <h2>{{ selected.title }}</h2>
        <BaseStatusPill :tone="tone(selected.status)">{{ STATUS_LABELS[selected.status||'']||selected.status }}</BaseStatusPill>
        <dl class="inspector-dl">
          <dt>Исполнитель</dt><dd>{{ selected.employee?.name||'Не назначен' }}</dd>
          <dt>Актив</dt><dd>{{ selected.asset?.name||'Не выбран' }}</dd>
          <dt>Плановое начало</dt><dd>{{ selected.planned_start?.replace('T',' ').slice(0,16)||'—' }}</dd>
          <dt>Плановое завершение</dt><dd>{{ selected.planned_end?.replace('T',' ').slice(0,16)||'—' }}</dd>
        </dl>
        <RouterLink class="inspector-open" :to="'/work-orders/'+selected.id">
          Открыть наряд <ArrowUpRight :size="16"/>
        </RouterLink>
      </aside>
    </div>
  </div>
</template>

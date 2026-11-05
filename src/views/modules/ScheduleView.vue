<script setup lang="ts">
import BaseSearchField from '../../components/ui/BaseSearchField.vue'
import { computed, onMounted, ref, watch } from 'vue'
import { ChevronLeft, ChevronRight, CalendarDays, RefreshCcw, Search, X, ArrowUpRight, Clock3 } from 'lucide-vue-next'
import BasePageHeading from '../../components/ui/BasePageHeading.vue'
import BaseNotice from '../../components/ui/BaseNotice.vue'
import BaseStatusPill from '../../components/ui/BaseStatusPill.vue'
import { loadSchedule } from '../../api/resources'
import { getShifts, type CrewShift } from '../../api/operations'
import { STATUS_LABELS } from '../../config/toirModules'
import { useSessionStore } from '../../stores/session'
import type { ToirRecord } from '../../types/toir'

type GroupMode='crew'|'employee'
interface ScheduleRow {id:string;label:string;type:'crew'|'employee'|'unassigned';sourceId:number|null}
const session=useSessionStore()
const offset=ref(0)
const mode=ref<GroupMode>('crew')
const orders=ref<ToirRecord[]>([])
const shifts=ref<CrewShift[]>([])
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
function identity(order:ToirRecord):ScheduleRow{
  if(mode.value==='crew'){
    if(order.crew_id)return {id:'c-'+order.crew_id,label:order.crew?.name||'Бригада №'+order.crew_id,
      type:'crew',sourceId:order.crew_id}
    if(order.employee_id)return {id:'e-'+order.employee_id,label:'Исполнитель: '+(order.employee?.name||'№'+order.employee_id),
      type:'employee',sourceId:order.employee_id}
  }else{
    if(order.employee_id)return {id:'e-'+order.employee_id,label:order.employee?.name||'Сотрудник №'+order.employee_id,
      type:'employee',sourceId:order.employee_id}
    if(order.crew_id)return {id:'c-'+order.crew_id,label:'Бригада: '+(order.crew?.name||'№'+order.crew_id),
      type:'crew',sourceId:order.crew_id}
  }
  return {id:'unassigned',label:'Без исполнителя',type:'unassigned',sourceId:null}
}
const weeklyOrders=computed(()=>orders.value.filter(o=>{
  const day=o.planned_start?.slice(0,10)||''
  return day>=days.value[0].date && day<=days.value[6].date
}))
const groups=computed(()=>{
  const byKey=new Map<string,ScheduleRow>()
  for(const o of weeklyOrders.value){
    const row=identity(o)
    if(!byKey.has(row.id))byKey.set(row.id,row)
  }
  if(mode.value==='crew'){
    for(const shift of shifts.value){
      if(!byKey.has('c-'+shift.crew_id))byKey.set('c-'+shift.crew_id,{
        id:'c-'+shift.crew_id,label:shift.crew?.name||'Бригада №'+shift.crew_id,
        type:'crew',sourceId:shift.crew_id
      })
    }
  }
  const needle=search.value.trim().toLocaleLowerCase('ru')
  return Array.from(byKey.values()).filter(row=>!needle||
    row.label.toLocaleLowerCase('ru').includes(needle)||
    weeklyOrders.value.some(o=>identity(o).id===row.id
      &&((o.title||'')+' '+(o.asset?.name||'')).toLocaleLowerCase('ru').includes(needle)))
    .sort((a,b)=>a.label.localeCompare(b.label,'ru'))
})
function matching(row:ScheduleRow,day:string){
  return weeklyOrders.value.filter(o=>identity(o).id===row.id&&o.planned_start?.slice(0,10)===day)
}
function shiftsFor(row:ScheduleRow,day:string){
  if(mode.value!=='crew'||row.type!=='crew')return []
  return shifts.value.filter(s=>s.crew_id===row.sourceId&&s.work_date===day)
}
function tone(value?:string):'success'|'warning'|'danger'|'info'|'neutral'{
  if(value==='closed')return 'success'
  if(value==='overdue')return 'danger'
  if(value==='waiting')return 'warning'
  if(value==='in_progress')return 'info'
  return 'neutral'
}
async function load(){
  const start=days.value[0]?.date
  const end=days.value[6]?.date
  if(!start||!end)return
  loading.value=true;error.value=''
  try{
    const [work,crewShifts]=await Promise.all([loadSchedule({from:start,to:end}),getShifts(start,end)])
    orders.value=work.orders
    shifts.value=crewShifts
  }catch(cause){error.value=cause instanceof Error?cause.message:'Не удалось загрузить календарь работ'}
  finally{loading.value=false}
}
function shift(amount:number){offset.value+=amount;selected.value=null;void load()}
watch(()=>session.session?.active_company_id,()=>{selected.value=null;void load()})
onMounted(()=>void load())
</script>

<template>
  <div class="schedule-page">
    <div class="toir-breadcrumb">Ремонт и обслуживание / Календарь работ</div>
    <BasePageHeading title="Календарь работ"
      description="Наряды и подтверждённые смены бригад по дням недели. Переключайтесь между бригадами и исполнителями."/>
    <BaseNotice v-if="error" tone="error">{{ error }}</BaseNotice>
    <div class="registry-toolbar">
      <div class="toolbar-leading">
        <div class="schedule-controls">
          <button type="button" aria-label="Предыдущая неделя" @click="shift(-1)"><ChevronLeft :size="18"/></button>
          <button type="button" @click="offset=0;selected=null;load()">Сегодня</button>
          <button type="button" aria-label="Следующая неделя" @click="shift(1)"><ChevronRight :size="18"/></button>
        </div>
        <strong class="schedule-period">{{ days[0]?.num }} — {{ days[6]?.num }}</strong>
        <span class="schedule-count">{{ weeklyOrders.length }} нарядов</span>
        <div class="switch-tabs" role="group" aria-label="Показать календарь по">
          <button type="button" :class="{active:mode==='crew'}" @click="mode='crew'">Бригады</button>
          <button type="button" :class="{active:mode==='employee'}" @click="mode='employee'">Исполнители</button>
        </div>
      </div>
      <div class="toolbar-actions">
        <BaseSearchField v-model="search" label="Поиск в календаре" placeholder="Поиск по работам и сотрудникам" />
        <button type="button" class="toolbar-icon" aria-label="Обновить календарь" :disabled="loading" @click="load">
          <RefreshCcw :size="18"/>
        </button>
      </div>
    </div>
    <div class="schedule-layout" :class="{'schedule-layout--inspecting':!!selected}">
      <div class="schedule-scroll">
        <div class="schedule-grid">
          <div class="schedule-cell team-head">{{ mode==='crew'?'Бригады / исполнители':'Сотрудники / бригады' }}</div>
          <div v-for="day in days" :key="day.date" class="schedule-cell day-head" :class="{today:day.today}">
            <span>{{ day.label }}</span><strong>{{ day.num }}</strong>
          </div>
          <template v-for="row in groups" :key="row.id">
            <div class="schedule-cell employee-head">{{ row.label }}</div>
            <div v-for="day in days" :key="row.id+day.date"
              class="schedule-cell day-slot" :class="{today:day.today}">
              <div v-for="crewShift in shiftsFor(row,day.date)" :key="'s-'+crewShift.id"
                class="schedule-shift" :title="'Подтверждённая смена бригады '+crewShift.crew?.name">
                <Clock3 :size="12" />
                {{ crewShift.starts_at.slice(0,5) }}–{{ crewShift.ends_at.slice(0,5) }}
              </div>
              <button v-for="order in matching(row,day.date)" :key="order.id" type="button"
                class="schedule-event" :class="{'schedule-event--selected':selected?.id===order.id}"
                :title="order.title" @click="selected=order">
                <strong>{{ order.number }}</strong><span>{{ order.title }}</span>
              </button>
            </div>
          </template>
        </div>
        <div v-if="!groups.length&&!loading" class="schedule-empty">
          <CalendarDays :size="28"/><strong>На выбранную неделю график пуст</strong>
          <p>Создайте бригады и смены, затем сформируйте наряды по регламентам.</p>
          <RouterLink to="/crews">Перейти к графикам бригад</RouterLink>
        </div>
      </div>
      <aside v-if="selected" class="planning-inspector schedule-inspector" aria-label="Детали наряда">
        <header><small>{{ selected.number }}</small>
          <button type="button" aria-label="Закрыть детали" @click="selected=null"><X :size="18"/></button>
        </header>
        <h2>{{ selected.title }}</h2>
        <BaseStatusPill :tone="tone(selected.status)">{{ STATUS_LABELS[selected.status||'']||selected.status }}</BaseStatusPill>
        <dl class="inspector-dl">
          <dt>Бригада</dt><dd>{{ selected.crew?.name||'Не назначена' }}</dd>
          <dt>Исполнитель</dt><dd>{{ selected.employee?.name||'Не назначен индивидуально' }}</dd>
          <dt>Объект / узел</dt><dd>{{ selected.asset?.name||'Не указан' }}</dd>
          <dt>Начало</dt><dd>{{ selected.planned_start?.replace('T',' ').slice(0,16)||'—' }}</dd>
          <dt>Окончание</dt><dd>{{ selected.planned_end?.replace('T',' ').slice(0,16)||'—' }}</dd>
        </dl>
        <RouterLink class="inspector-open" :to="'/work-orders/'+selected.id">
          Открыть наряд <ArrowUpRight :size="16"/>
        </RouterLink>
      </aside>
    </div>
  </div>
</template>

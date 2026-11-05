<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { ChevronLeft, ChevronRight, Plus, RefreshCcw, CalendarDays, X, ArrowUpRight } from 'lucide-vue-next'
import BaseButton from '../../components/ui/BaseButton.vue'
import BasePageHeading from '../../components/ui/BasePageHeading.vue'
import BaseNotice from '../../components/ui/BaseNotice.vue'
import BaseStatusPill from '../../components/ui/BaseStatusPill.vue'
import ToirRegistryTable from '../../components/toir/ToirRegistryTable.vue'
import ToirEditorDrawer from '../../components/toir/ToirEditorDrawer.vue'
import { loadSchedule } from '../../api/resources'
import { specs, canEdit, STATUS_LABELS } from '../../config/toirModules'
import { useSessionStore } from '../../stores/session'
import type { ToirRecord } from '../../types/toir'

interface TimelineItem {
  key:string
  id:number
  kind:'plan'|'order'
  title:string
  number:string
  asset:string
  employee:string
  status:string
  start:string
  end:string
  url:string
}
const session=useSessionStore()
const editable=computed(()=>canEdit(session.session?.active_role,'plans'))
const plans=ref<ToirRecord[]>([])
const orders=ref<ToirRecord[]>([])
const date=ref(new Date())
const loading=ref(false)
const error=ref('')
const editor=ref(false)
const mode=ref<'gantt'|'list'>('gantt')
const includeOrders=ref(true)
const rowLimit=ref(24)
const selected=ref<TimelineItem|null>(null)

function dateKey(dt:Date):string {
  const y=dt.getFullYear()
  return y+'-'+String(dt.getMonth()+1).padStart(2,'0')+'-'+String(dt.getDate()).padStart(2,'0')
}
const days=computed(()=>{
  const start=new Date(date.value)
  const weekday=start.getDay()
  start.setDate(start.getDate()-(weekday===0?6:weekday-1))
  return Array.from({length:21},(_,i)=>{
    const d=new Date(start)
    d.setDate(start.getDate()+i)
    return {key:dateKey(d),number:d.getDate(),week:d.toLocaleDateString('ru-RU',{weekday:'short'}),
      month:d.toLocaleDateString('ru-RU',{month:'short'}),today:dateKey(d)===dateKey(new Date())}
  })
})
const timeline=computed<TimelineItem[]>(()=>{
  const result:TimelineItem[]=plans.value.map(item=>({
    key:'plan-'+item.id,id:item.id,kind:'plan',title:item.title||'План ТО',number:'ТО',
    asset:item.asset?.name||'Актив не указан',employee:item.employee?.name||'Без исполнителя',
    status:item.status||'planned',start:item.next_due_date||'',end:item.next_due_date||'',
    url:'/plans/'+item.id,
  }))
  if(includeOrders.value){
    result.push(...orders.value.map(item=>({
      key:'order-'+item.id,id:item.id,kind:'order' as const,title:item.title||'Наряд',number:item.number||'НЗ',
      asset:item.asset?.name||'Актив не указан',employee:item.employee?.name||'Без исполнителя',
      status:item.status||'waiting',
      start:item.planned_start?.slice(0,10)||'',end:item.planned_end?.slice(0,10)||item.planned_start?.slice(0,10)||'',
      url:'/work-orders/'+item.id,
    })))
  }
  const first=days.value[0]?.key||''
  const last=days.value[days.value.length-1]?.key||''
  return result
    .filter(item=>item.start && item.end>=first && item.start<=last)
    .sort((a,b)=>a.start.localeCompare(b.start)||a.title.localeCompare(b.title,'ru'))
})
const shownRows=computed(()=>timeline.value.slice(0,rowLimit.value))
function contains(item:TimelineItem,day:string):boolean {return day>=item.start&&day<=item.end}
function tone(status:string):'success'|'danger'|'warning'|'info'{
  if(['completed','closed'].includes(status))return 'success'
  if(status==='overdue')return 'danger'
  if(['waiting','paused'].includes(status))return 'warning'
  return 'info'
}
async function load(){
  loading.value=true;error.value=''
  try{
    const result=await loadSchedule({from:days.value[0].key,to:days.value[days.value.length-1].key})
    plans.value=result.plans
    orders.value=result.orders
  }catch(cause){error.value=cause instanceof Error?cause.message:'Не удалось загрузить планы'}
  finally{loading.value=false}
}
function shift(amount:number){
  const next=new Date(date.value)
  next.setDate(next.getDate()+amount)
  date.value=next
  selected.value=null
  rowLimit.value=24
  void load()
}
watch(()=>session.session?.active_company_id,()=>{selected.value=null;void load()})
watch(includeOrders,()=>rowLimit.value=24)
onMounted(()=>void load())
</script>

<template>
  <div class="planning-page">
    <div class="toir-breadcrumb">Ремонт и обслуживание / Планирование</div>
    <BasePageHeading title="Планирование" />
    <BaseNotice v-if="error" tone="error">{{ error }}</BaseNotice>
    <div class="registry-toolbar">
      <div class="toolbar-leading">
        <div class="switch-tabs" role="group" aria-label="Вид планирования">
          <button type="button" :class="{active:mode==='gantt'}" @click="mode='gantt'">График</button>
          <button type="button" :class="{active:mode==='list'}" @click="mode='list'">Список</button>
        </div>
        <label v-if="mode==='gantt'" class="planning-orders-toggle">
          <input v-model="includeOrders" type="checkbox" />
          Показывать наряды
        </label>
      </div>
      <div class="toolbar-actions">
        <BaseButton v-if="editable" type="button" @click="editor=true"><Plus :size="16" />Создать мероприятие</BaseButton>
        <button type="button" class="toolbar-icon" title="Обновить" :disabled="loading" @click="load">
          <RefreshCcw :size="18" />
        </button>
      </div>
    </div>

    <div v-if="mode==='gantt'" class="planning-shell" :class="{'planning-shell--inspecting':!!selected}">
      <div class="gantt-wrap">
        <div class="gantt-main">
          <div class="gantt-row gantt-head">
            <div class="gantt-name"><strong>Плановые мероприятия</strong><small>{{ timeline.length }} записей в периоде</small></div>
            <div class="gantt-days">
              <div v-for="day in days" :key="day.key" :class="{today:day.today}">
                <strong>{{ day.number }}</strong><span>{{ day.week }}</span>
              </div>
            </div>
          </div>
          <div v-for="item in shownRows" :key="item.key" class="gantt-row">
            <button class="gantt-name" type="button" :class="{selected:selected?.key===item.key}"
              @click="selected=item">
              <strong>{{ item.title }}</strong><small>{{ item.asset }}</small>
            </button>
            <div class="gantt-days">
              <div v-for="day in days" :key="day.key" :class="{today:day.today}">
                <button v-if="contains(item,day.key)" type="button"
                  class="gantt-block" :class="[
                    'gantt-block--'+tone(item.status),
                    {'gantt-block--start':day.key===item.start,'gantt-block--end':day.key===item.end}
                  ]" :aria-label="item.title+', '+day.key" :title="item.title+' — '+day.key"
                  @click="selected=item">
                  <span v-if="day.key===item.start">{{ item.kind==='plan'?'ТО':item.number }}</span>
                </button>
              </div>
            </div>
          </div>
          <div v-if="!timeline.length&&!loading" class="gantt-empty">
            <CalendarDays :size="29"/>
            <strong>На выбранные даты работ нет</strong>
            <p>Измените период или создайте плановое мероприятие.</p>
          </div>
        </div>
        <footer class="gantt-footer">
          <button type="button" aria-label="Предыдущие три недели" @click="shift(-21)">
            <ChevronLeft :size="17" />
          </button>
          <strong>{{ days[0]?.key }} — {{ days[20]?.key }}</strong>
          <button type="button" aria-label="Следующие три недели" @click="shift(21)">
            <ChevronRight :size="17" />
          </button>
          <button type="button" @click="date=new Date();selected=null">Сегодня</button>
          <button v-if="timeline.length>shownRows.length" type="button" @click="rowLimit+=24">Ещё {{ timeline.length-shownRows.length }}</button>
        </footer>
      </div>
      <aside v-if="selected" class="planning-inspector" aria-label="Просмотр мероприятия">
        <header><small>{{ selected.kind==='plan'?'План ТО':'Наряд-задание' }}</small>
          <button type="button" aria-label="Закрыть просмотр" @click="selected=null"><X :size="18"/></button>
        </header>
        <h2>{{ selected.title }}</h2>
        <BaseStatusPill :tone="tone(selected.status)">{{ STATUS_LABELS[selected.status]||selected.status }}</BaseStatusPill>
        <dl class="inspector-dl">
          <dt>Актив</dt><dd>{{ selected.asset }}</dd>
          <dt>Ответственный</dt><dd>{{ selected.employee }}</dd>
          <dt>Начало</dt><dd>{{ selected.start }}</dd>
          <dt>Завершение</dt><dd>{{ selected.end }}</dd>
        </dl>
        <RouterLink class="inspector-open" :to="selected.url">Открыть карточку <ArrowUpRight :size="16" /></RouterLink>
      </aside>
    </div>

    <ToirRegistryTable v-else :rows="plans" :columns="specs.plans.columns" :selectable="false"
      @open="$router.push('/plans/'+$event)" />
    <ToirEditorDrawer :open="editor" :spec="specs.plans"
      @close="editor=false" @saved="id=>{editor=false;load();$router.push('/plans/'+id)}" />
  </div>
</template>

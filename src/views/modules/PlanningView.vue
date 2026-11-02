<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { ChevronLeft, ChevronRight, Plus, RefreshCcw, CalendarDays } from 'lucide-vue-next'
import BaseButton from '../../components/ui/BaseButton.vue'
import BasePageHeading from '../../components/ui/BasePageHeading.vue'
import BaseNotice from '../../components/ui/BaseNotice.vue'
import ToirRegistryTable from '../../components/toir/ToirRegistryTable.vue'
import ToirEditorDrawer from '../../components/toir/ToirEditorDrawer.vue'
import { loadSchedule, listResources } from '../../api/resources'
import { specs,canEdit } from '../../config/toirModules'
import { useSessionStore } from '../../stores/session'
import type { ToirRecord } from '../../types/toir'

const router=useRouter()
const session=useSessionStore()
const editable=computed(()=>canEdit(session.session?.active_role,'plans'))
const plans=ref<ToirRecord[]>([])
const allOrders=ref<ToirRecord[]>([])
const date=ref(new Date())
const loading=ref(false)
const error=ref('')
const editor=ref(false)
const mode=ref<'gantt'|'list'>('gantt')
function ymd(dt:Date){return dt.toISOString().slice(0,10)}
const days=computed(()=>{
  const start=new Date(date.value)
  start.setDate(start.getDate()-start.getDay()+1)
  return Array.from({length:21},(_,i)=>{
    const d=new Date(start);d.setDate(start.getDate()+i)
    return {key:ymd(d),number:d.getDate(),week:d.toLocaleDateString('ru-RU',{weekday:'short'}),today:ymd(d)===ymd(new Date())}
  })
})
function positioned(row:ToirRecord){
  const planned=row.next_due_date||row.planned_start?.slice(0,10)
  if(!planned)return -1
  return days.value.findIndex(x=>x.key===planned.slice(0,10))
}
async function load(){
  loading.value=true;error.value=''
  try{const result=await loadSchedule();plans.value=result.plans;allOrders.value=result.orders}
  catch(cause){error.value=cause instanceof Error?cause.message:'Не удалось получить планы'}
  finally{loading.value=false}
}
function shift(days:number){const d=new Date(date.value);d.setDate(d.getDate()+days);date.value=d}
watch(()=>session.session?.active_company_id,()=>void load())
onMounted(()=>void load())
</script>
<template>
  <div class="planning-page">
    <div class="toir-breadcrumb">Ремонт и обслуживание / Планирование</div>
    <BasePageHeading title="Планирование" />
    <BaseNotice v-if="error" tone="error">{{ error }}</BaseNotice>
    <div class="registry-toolbar">
      <div class="toolbar-leading">
        <div class="switch-tabs"><button type="button" :class="{active:mode==='gantt'}" @click="mode='gantt'">График</button>
          <button type="button" :class="{active:mode==='list'}" @click="mode='list'">Список</button></div>
      </div>
      <div class="toolbar-actions">
        <BaseButton v-if="editable" @click="editor=true"><Plus :size="16" />Создать мероприятие</BaseButton>
        <button class="toolbar-icon" type="button" title="Обновить" @click="load"><RefreshCcw :size="18"/></button>
      </div>
    </div>
    <div v-if="mode==='gantt'" class="gantt-wrap">
      <div class="gantt-main">
        <div class="gantt-row gantt-head">
          <div class="gantt-name">Плановые мероприятия</div>
          <div class="gantt-days"><div v-for="day in days" :key="day.key"
            :class="{today:day.today}"><strong>{{ day.number }}</strong><span>{{ day.week }}</span></div></div>
        </div>
        <div v-for="plan in plans" :key="'plan-'+plan.id" class="gantt-row">
          <button class="gantt-name" type="button" @click="router.push('/plans/'+plan.id)">
            <strong>{{ plan.title }}</strong><small>{{ plan.asset?.name||'Без актива' }}</small>
          </button>
          <div class="gantt-days"><div v-for="(day,i) in days" :key="day.key" :class="{today:day.today}">
            <button v-if="positioned(plan)===i" type="button" class="gantt-block"
              :title="plan.title+' — '+day.key" @click="router.push('/plans/'+plan.id)">ТО</button>
          </div></div>
        </div>
        <div v-if="!plans.length&&!loading" class="gantt-empty">
          <CalendarDays :size="29"/><strong>Планы обслуживания не созданы</strong>
          <p>Добавьте мероприятие и выберите актив, периодичность и дату следующего ТО.</p>
        </div>
      </div>
      <footer class="gantt-footer"><button type="button" @click="shift(-21)"><ChevronLeft :size="17" /></button>
        <strong>{{ days[0]?.key }} — {{ days[20]?.key }}</strong>
        <button type="button" @click="shift(21)"><ChevronRight :size="17" /></button>
        <button type="button" @click="date=new Date()">Сегодня</button>
      </footer>
    </div>
    <ToirRegistryTable v-else :rows="plans" :columns="specs.plans.columns" :selectable="false"
      @open="id=>router.push('/plans/'+id)" />
    <ToirEditorDrawer :open="editor" :spec="specs.plans" @close="editor=false"
      @saved="id=>{editor=false;load();router.push('/plans/'+id)}" />
  </div>
</template>

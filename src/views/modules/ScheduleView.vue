<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { ChevronLeft, ChevronRight, CalendarDays, RefreshCcw } from 'lucide-vue-next'
import BasePageHeading from '../../components/ui/BasePageHeading.vue'
import BaseNotice from '../../components/ui/BaseNotice.vue'
import { loadSchedule } from '../../api/resources'
import { useSessionStore } from '../../stores/session'
import type { ToirRecord } from '../../types/toir'

const router=useRouter()
const session=useSessionStore()
const offset=ref(0)
const orders=ref<ToirRecord[]>([])
const loading=ref(false)
const error=ref('')
const days=computed(()=>{
  const first=new Date();const day=first.getDay()
  first.setDate(first.getDate()-(day===0?6:day-1)+offset.value*7);first.setHours(12,0,0,0)
  return Array.from({length:7},(_,i)=>{
    const d=new Date(first);d.setDate(first.getDate()+i)
    return {date:d.toISOString().slice(0,10),label:d.toLocaleDateString('ru-RU',{weekday:'short'}),
      num:d.toLocaleDateString('ru-RU',{day:'2-digit',month:'2-digit'})}
  })
})
const team=computed(()=>[...new Set(orders.value.map(o=>o.employee?.name||'Без исполнителя'))])
function matching(name:string,day:string){return orders.value.filter(o=>
  (o.employee?.name||'Без исполнителя')===name&&o.planned_start?.slice(0,10)===day
)}
async function load(){
  loading.value=true;error.value=''
  try {orders.value=(await loadSchedule()).orders}
  catch(cause){error.value=cause instanceof Error?cause.message:'Не удалось загрузить расписание'}
  finally{loading.value=false}
}
watch(()=>session.session?.active_company_id,()=>void load())
onMounted(()=>void load())
</script>
<template>
  <div class="schedule-page">
    <div class="toir-breadcrumb">Ремонт и обслуживание / Расписание</div>
    <BasePageHeading title="Расписание" />
    <BaseNotice v-if="error" tone="error">{{ error }}</BaseNotice>
    <div class="registry-toolbar">
      <div class="toolbar-leading"><div class="schedule-controls">
        <button type="button" @click="offset--"><ChevronLeft :size="18" /></button>
        <button type="button" @click="offset=0">Сегодня</button>
        <button type="button" @click="offset++"><ChevronRight :size="18" /></button>
      </div><strong>{{ days[0]?.num }} — {{ days[6]?.num }}</strong></div>
      <div class="toolbar-actions"><button class="toolbar-icon" type="button" aria-label="Обновить"
        @click="load"><RefreshCcw :size="17" /></button></div>
    </div>
    <div class="schedule-scroll">
      <div class="schedule-grid">
        <div class="schedule-cell team-head">Рабочие группы / сотрудники</div>
        <div v-for="day in days" :key="day.date" class="schedule-cell day-head">
          <span>{{ day.label }}</span><strong>{{ day.num }}</strong>
        </div>
        <template v-for="name in team" :key="name">
          <div class="schedule-cell employee-head">{{ name }}</div>
          <div v-for="day in days" :key="name+day.date" class="schedule-cell day-slot">
            <button v-for="order in matching(name,day.date)" :key="order.id" type="button"
              class="schedule-event" @click="router.push('/work-orders/'+order.id)">
              <strong>{{ order.number }}</strong><span>{{ order.title }}</span>
            </button>
          </div>
        </template>
      </div>
      <div v-if="!team.length&&!loading" class="schedule-empty">
        <CalendarDays :size="28" /><strong>Расписание пока пустое</strong>
        <p>Добавьте наряды с плановым временем и исполнителями.</p>
      </div>
    </div>
  </div>
</template>

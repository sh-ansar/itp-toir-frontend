<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { BarChart3, Users, Package, History, BadgeCheck, RefreshCcw, AlertTriangle } from 'lucide-vue-next'
import BasePageHeading from '../../components/ui/BasePageHeading.vue'
import BaseNotice from '../../components/ui/BaseNotice.vue'
import BaseCard from '../../components/ui/BaseCard.vue'
import ToirRegistryTable from '../../components/toir/ToirRegistryTable.vue'
import { loadOverview, listResources } from '../../api/resources'
import { specs } from '../../config/toirModules'
import { useSessionStore } from '../../stores/session'
import { usePreviewStore } from '../../stores/preview'
import type { Overview, ToirRecord } from '../../types/toir'

const props=defineProps<{report:string}>()
const session=useSessionStore()
const preview=usePreviewStore()
const router=useRouter()
const overview=ref<Overview|null>(null)
const orders=ref<ToirRecord[]>([])
const employees=ref<ToirRecord[]>([])
const supplies=ref<ToirRecord[]>([])
const busy=ref(false)
const error=ref('')
const reports=[
  {id:'repairs',label:'Отчет по ремонтам',icon:BarChart3},
  {id:'employees',label:'Рейтинг сотрудников',icon:Users},
  {id:'warehouse',label:'Наличие запчастей на складе',icon:Package},
  {id:'quality',label:'Отчет по качеству ремонта',icon:BadgeCheck},
  {id:'history',label:'История ремонта',icon:History}
]
const selected=computed(()=>reports.find(x=>x.id===props.report)||reports[0])
const reportPage=ref(1)
const reportPageSize=ref(15)
const rows=computed(()=>{
  if(props.report==='employees')return employees.value.map(emp=>{
    const assigned=orders.value.filter(o=>o.employee_id===emp.id)
    return {id:emp.id,company_id:emp.company_id,name:emp.name,position:emp.position,department:emp.department,
      total:assigned.length,closed:assigned.filter(o=>o.status==='closed').length}
  })
  if(props.report==='warehouse')return supplies.value.map(x=>({...x,amount:Number(x.quantity||0)*Number(x.unit_price||0)}))
  return orders.value
})
const columns=computed(()=>{
  if(props.report==='employees')return [
    {key:'name',label:'Сотрудник',width:230},{key:'position',label:'Должность',width:200},
    {key:'department',label:'Подразделение',width:190},{key:'total',label:'Всего работ',width:135},
    {key:'closed',label:'Завершено',width:135}]
  if(props.report==='warehouse')return [
    {key:'name',label:'Номенклатура',width:245},{key:'quantity',label:'Количество',width:140},
    {key:'unit',label:'Единица',width:100},{key:'status',label:'Статус',width:150},
    {key:'amount',label:'Сумма',width:165}]
  return specs['work-orders'].columns.slice(0,6)
})
const reportMeta=computed(()=>({
  total:rows.value.length,
  current_page:reportPage.value,
  last_page:Math.max(1,Math.ceil(rows.value.length/reportPageSize.value)),
  per_page:reportPageSize.value
}))
const shownRows=computed(()=>rows.value.slice((reportPage.value-1)*reportPageSize.value,reportPage.value*reportPageSize.value))
watch(()=>props.report,()=>{reportPage.value=1})
const stats=computed(()=>{
  const o=overview.value
  return props.report==='warehouse'
    ? [{label:'Позиции в реестре',value:supplies.value.length},{label:'Заявки на склад',value:o?.supplies_requested||0},
       {label:'Поставлено',value:supplies.value.filter(r=>r.status==='delivered').length}]
    : props.report==='employees'
    ?[{label:'Сотрудников',value:o?.employees||0},{label:'Всего нарядов',value:o?.work_orders||0},
       {label:'Закрыто работ',value:o?.closed||0}]
    :[{label:'Всего нарядов',value:o?.work_orders||0},{label:'В работе',value:o?.in_progress||0},
       {label:'Просрочено',value:o?.overdue||0},{label:'Завершено',value:o?.closed||0}]
})
const chart=computed(()=>[
  {name:'Ожидают',n:overview.value?.waiting||0,color:'var(--color-muted)'},
  {name:'В работе',n:overview.value?.in_progress||0,color:'var(--color-primary)'},
  {name:'Просрочено',n:overview.value?.overdue||0,color:'var(--color-danger)'},
  {name:'Закрыты',n:overview.value?.closed||0,color:'var(--color-success)'}
])
const maxBar=computed(()=>Math.max(1,...chart.value.map(x=>x.n)))
async function refresh(){
  busy.value=true;error.value=''
  try{
    const [o,wo,em,su]=await Promise.all([
      loadOverview(),listResources('work-orders',{per_page:100}),
      listResources('employees',{per_page:100}),listResources('supplies',{per_page:100})
    ])
    overview.value=o;orders.value=wo.data;employees.value=em.data;supplies.value=su.data
  }catch(cause){error.value=cause instanceof Error?cause.message:'Не удалось загрузить отчёт'}
  finally{busy.value=false}
}
watch(()=>session.session?.active_company_id,()=>void refresh())
watch(()=>preview.enabled,()=>void refresh())
onMounted(()=>void refresh())
</script>
<template>
  <div class="reports-page">
    <div class="toir-breadcrumb">Отчеты / {{ selected.label }}</div>
    <BasePageHeading :title="selected.label">
      <button class="toolbar-icon" type="button" aria-label="Обновить отчёт" @click="refresh">
        <RefreshCcw :size="18" /></button>
    </BasePageHeading>
    <BaseNotice v-if="error" tone="error">{{ error }}</BaseNotice>
    <nav class="report-tabs" aria-label="Виды отчетов">
      <RouterLink v-for="item in reports" :key="item.id" :to="'/reports/'+item.id"
        :class="{active:report===item.id}"><component :is="item.icon" :size="16" />{{ item.label }}</RouterLink>
    </nav>
    <div class="report-kpis">
      <BaseCard v-for="item in stats" :key="item.label">
        <span>{{ item.label }}</span><strong>{{ busy?'…':item.value }}</strong>
      </BaseCard>
    </div>
    <BaseCard v-if="report==='repairs'||report==='quality'" >
      <div class="report-heading"><h2>{{ report==='repairs'?'Состояние нарядов':'Результаты завершения работ' }}</h2>
        <p>Рассчитано по данным текущей компании</p></div>
      <div v-for="bar in chart" :key="bar.name" class="report-chart-row">
        <span>{{ bar.name }}</span>
        <div class="bar-track"><div :style="{width:(bar.n/maxBar*100)+'%',background:bar.color}"></div></div>
        <strong>{{ bar.n }}</strong>
      </div>
      <p v-if="report==='quality'" class="report-note"><AlertTriangle :size="16" />
        Подробные показатели качества появятся после добавления актов приёмки и повторных ремонтов.
      </p>
    </BaseCard>
    <div class="report-table">
      <h2>{{ report==='warehouse'?'Запчасти и материалы':report==='employees'?'Работы сотрудников':'Реестр работ' }}</h2>
      <p class="muted">В таблице показаны первые 100 записей. Полные выгрузки реализуются в модуле отчётности.</p>
      <ToirRegistryTable :rows="shownRows" :columns="columns" :meta="reportMeta" :selectable="false" :loading="busy"
        @page="reportPage=$event" @page-size="reportPageSize=$event;reportPage=1"
        @open="id=>router.push(report==='employees'?'/employees/'+id:report==='warehouse'?'/supplies/'+id:'/work-orders/'+id)" />
    </div>
  </div>
</template>

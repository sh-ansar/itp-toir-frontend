<script setup lang="ts">
import { Button as SharedButton } from "@itpmining/vue-basic-components";
import { Table as SharedTable } from "@itpmining/vue-basic-components";
import { computed, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { BarChart3, Users, Package, History, BadgeCheck, RefreshCcw, AlertTriangle } from 'lucide-vue-next'
import BasePageHeading from '../../components/ui/BasePageHeading.vue'
import BaseNotice from '../../components/ui/BaseNotice.vue'
import BaseCard from '../../components/ui/BaseCard.vue'
import ToirRegistryTable from '../../components/toir/ToirRegistryTable.vue'
import { loadOverview, listResources, loadWorkControl, type WorkControl } from '../../api/resources'
import { getStock, type StockItem } from '../../api/stock'
import { specs } from '../../config/toirModules'
import { useSessionStore } from '../../stores/session'
import type { Overview, ToirRecord } from '../../types/toir'

const props=defineProps<{report:string}>()
const session=useSessionStore()
const router=useRouter()
const overview=ref<Overview|null>(null)
const workControl=ref<WorkControl|null>(null)
const orders=ref<ToirRecord[]>([])
const employees=ref<ToirRecord[]>([])
const stockItems=ref<StockItem[]>([])
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
  if(props.report==='warehouse')return stockItems.value.map(x=>({...x,amount:Number(x.quantity_on_hand||0)*Number(x.unit_cost||0)}))
  return orders.value
})
const columns=computed(()=>{
  if(props.report==='employees')return [
    {key:'name',label:'Сотрудник',width:230},{key:'position',label:'Должность',width:200},
    {key:'department',label:'Подразделение',width:190},{key:'total',label:'Всего работ',width:135},
    {key:'closed',label:'Завершено',width:135}]
  if(props.report==='warehouse')return [
    {key:'sku',label:'Артикул',width:130},{key:'name',label:'Номенклатура',width:245},
    {key:'quantity_on_hand',label:'В наличии',width:110},{key:'quantity_reserved',label:'Резерв',width:100},
    {key:'available_quantity',label:'Доступно',width:110},{key:'unit',label:'Ед.',width:80},
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
    ? [{label:'Позиции на складе',value:stockItems.value.length},{label:'Требуют пополнения',value:stockItems.value.filter(r=>Number(r.available_quantity)<=Number(r.minimum_quantity)).length},
       {label:'Стоимость остатков',value:Math.round(stockItems.value.reduce((v,r)=>v+Number(r.quantity_on_hand)*Number(r.unit_cost),0))}]
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
    const [o,wo,em,st]=await Promise.all([
      loadOverview(),listResources('work-orders',{per_page:100}),
      listResources('employees',{per_page:100}),getStock({per_page:100})
    ])
    overview.value=o;orders.value=wo.data;employees.value=em.data;stockItems.value=st.data
    workControl.value=await loadWorkControl()
  }catch(cause){error.value=cause instanceof Error?cause.message:'Не удалось загрузить отчёт'}
  finally{busy.value=false}
}
watch(()=>session.session?.active_company_id,()=>void refresh())
onMounted(()=>void refresh())
</script>
<template>
  <div class="reports-page">
    <BasePageHeading :title="selected.label">
      <SharedButton class="toolbar-icon" type="button" aria-label="Обновить отчёт" @click="refresh">
        <RefreshCcw :size="18" /></SharedButton>
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
    <section v-if="report==='repairs'&&workControl" class="work-control-report" aria-label="Контроль исполнения нарядов">
      <div class="report-heading"><h2>Контроль сроков, назначений и затрат</h2>
        <p>По текущей компании. Просрочка определяется по плановому сроку даже до изменения статуса наряда.</p></div>
      <div class="report-kpis">
        <BaseCard><span>Незакрытые работы</span><strong>{{ workControl.summary.open_orders }}</strong></BaseCard>
        <BaseCard><span>Нарушены сроки</span><strong>{{ workControl.summary.late_orders }}</strong></BaseCard>
        <BaseCard><span>Без исполнителя</span><strong>{{ workControl.summary.unassigned_orders }}</strong></BaseCard>
        <BaseCard><span>Ожидают приёмки</span><strong>{{ workControl.summary.awaiting_acceptance }}</strong></BaseCard>
      </div>
      <div class="report-kpis">
        <BaseCard><span>Фактические материалы</span><strong>{{ Number(workControl.summary.recorded_material_cost).toLocaleString('ru-RU') }}</strong><small>Учтённая стоимость списаний, без расчётной зарплаты</small></BaseCard>
        <BaseCard><span>Учтённое время</span><strong>{{ (workControl.summary.recorded_labor_minutes/60).toLocaleString('ru-RU',{maximumFractionDigits:2}) }} ч</strong><small>Только по {{ workControl.summary.orders_with_labor_recorded }} нарядам</small></BaseCard>
      </div>
      <h3>Приоритетные незакрытые наряды</h3>
      <p class="muted">До {{ workControl.limit }} записей: сначала критические, затем ближайшие сроки.</p>
      <div class="toir-table-scroll"><SharedTable class="toir-table"><template #header><tr><th>Наряд</th><th>Оборудование</th><th>Приоритет</th><th>Плановый срок</th><th>Исполнитель</th><th>Статус</th><th>Материалы</th></tr></template>
          <tr v-for="item in workControl.orders" :key="item.id">
            <td><RouterLink :to="'/work-orders/'+item.id">{{ item.number||'#'+item.id }}</RouterLink></td>
            <td>{{ item.asset?.name||'Не указано' }}</td>
            <td>{{ item.priority===1?'Критический':item.priority===2?'Высокий':item.priority===3?'Обычный':'P'+item.priority }}</td>
            <td :class="{'danger-text':item.is_late}">{{ item.planned_end?new Date(item.planned_end).toLocaleString('ru-RU'):'Не назначен' }}{{ item.is_late?' · просрочено':'' }}</td>
            <td>{{ item.employee?.name||'Не назначен' }}</td><td>{{ item.status==='awaiting_acceptance'?'На приёмке':item.status==='in_progress'?'В работе':item.status==='overdue'?'Просрочено':'Ожидает' }}</td>
            <td>{{ Number(item.actual_material_cost||0).toLocaleString('ru-RU') }}</td>
          </tr>
          <tr v-if="!workControl.orders.length"><td colspan="7">Нет незакрытых нарядов.</td></tr>
        </SharedTable></div>
    </section>
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
        @open="id=>router.push(report==='employees'?'/employees/'+id:report==='warehouse'?'/warehouse':'/work-orders/'+id)" />
    </div>
  </div>
</template>

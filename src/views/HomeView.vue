<script setup lang="ts">
import { Button as SharedButton } from "@itpmining/vue-basic-components";
import { onMounted, ref, watch } from 'vue'
import { RouterLink } from 'vue-router'
import { Wrench, Package, CalendarDays, ClipboardList, AlertTriangle, ArrowUpRight, RefreshCcw } from 'lucide-vue-next'
import BasePageHeading from '../components/ui/BasePageHeading.vue'
import BaseNotice from '../components/ui/BaseNotice.vue'
import BaseCard from '../components/ui/BaseCard.vue'
import { loadOverview, listResources } from '../api/resources'
import { getRisks, getForecast, type RiskResponse, type ForecastRow } from '../api/operations'
import type { Overview, ToirRecord } from '../types/toir'
import { useSessionStore } from '../stores/session'

const session=useSessionStore()
const data=ref<Overview|null>(null)
const orders=ref<ToirRecord[]>([])
const risk=ref<RiskResponse|null>(null)
const upcoming=ref<ForecastRow[]>([])
const busy=ref(false)
const error=ref('')
async function refresh(){
  busy.value=true;error.value=''
  try{
    const [overview,ordersResponse,riskReport,forecastReport]=await Promise.all([
      loadOverview(),listResources('work-orders',{per_page:5}),getRisks(),getForecast(30)
    ])
    data.value=overview;orders.value=ordersResponse.data
    risk.value=riskReport
    upcoming.value=forecastReport.data.filter(row=>row.due==='overdue'||row.due==='soon').slice(0,4)
  }catch(cause){error.value=cause instanceof Error?cause.message:'Сервер ТОИР недоступен'}
  finally{busy.value=false}
}
watch(()=>session.session?.active_company_id,()=>void refresh())
onMounted(()=>void refresh())
const tiles=[
  {label:'Всего активов',icon:Package,key:'assets' as const,to:'/assets'},
  {label:'Открытые наряды',icon:ClipboardList,key:'waiting' as const,to:'/work-orders'},
  {label:'В работе',icon:Wrench,key:'in_progress' as const,to:'/work-orders?status=in_progress'},
  {label:'Просроченное ТО',icon:AlertTriangle,key:'plans_overdue' as const,to:'/plans'},
]
</script>
<template>
  <div class="toir-dashboard">
    <BasePageHeading title="Рабочий стол">
      <SharedButton class="toolbar-icon" type="button" aria-label="Обновить показатели" :disabled="busy" @click="refresh">
        <RefreshCcw :size="18" />
      </SharedButton>
    </BasePageHeading>
    <BaseNotice v-if="error" tone="error">{{ error }}</BaseNotice>
    <div class="dashboard-metrics">
      <RouterLink v-for="tile in tiles" :key="tile.key" class="metric-tile" :to="tile.to">
        <span class="metric-icon"><component :is="tile.icon" :size="20"/></span>
        <span class="metric-label">{{ tile.label }}</span>
        <strong>{{ busy?'…':data?.[tile.key]??0 }}</strong>
        <ArrowUpRight :size="16" class="metric-arrow"/>
      </RouterLink>
    </div>
    <div class="operations-two-pane dashboard-operations-panels">
      <BaseCard>
        <div class="panel-heading">
          <div><h2>Объекты в зоне риска</h2></div>
          <RouterLink to="/risk">Все риски <ArrowUpRight :size="15"/></RouterLink>
        </div>
        <div class="dashboard-risk-summary">
          <span>Критические: <strong>{{ risk?.summary.critical??0 }}</strong></span>
          <span>Высокие: <strong>{{ risk?.summary.high??0 }}</strong></span>
          <span>Недостаточно данных: <strong>{{ risk?.summary.incomplete_data??0 }}</strong></span>
        </div>
        <RouterLink v-for="row in (risk?.data||[]).filter(x=>x.level==='critical'||x.level==='high').slice(0,4)"
          :key="row.id" :to="'/assets/'+row.id" class="dashboard-risk-item">
          <span class="operations-risk-chip" :class="'risk-'+row.level">{{ row.score }}</span>
          <span><strong>{{ row.name }}</strong><small>{{ row.code }} · {{ row.reasons[0]||'Требует обследования' }}</small></span>
          <ArrowUpRight :size="16"/>
        </RouterLink>
        <div v-if="!risk?.data.length" class="operations-empty">
          <strong>Нет цифровой структуры оборудования</strong>
          <RouterLink to="/asset-tree">Создать первый объект</RouterLink>
        </div>
        <p v-else-if="!risk.data.some(x=>x.level==='critical'||x.level==='high')" class="operations-muted">
          По текущим правилам высокий риск не выявлен. Это не подтверждает отсутствие неисправностей.
        </p>
      </BaseCard>
      <BaseCard>
        <div class="panel-heading">
          <div><h2>Ближайшее плановое ТО</h2></div>
          <RouterLink to="/crews">Графики бригад <ArrowUpRight :size="15"/></RouterLink>
        </div>
        <RouterLink v-for="(row,i) in upcoming" :key="row.plan_id+'-'+row.date+'-'+i"
          :to="'/plans/'+row.plan_id" class="dashboard-risk-item">
          <CalendarDays :size="19" class="dashboard-due-icon"/>
          <span><strong>{{ row.title }}</strong><small>{{ row.asset_name }} · {{ row.date }}</small></span>
          <span class="operations-due" :class="'due-'+row.due">
            {{ row.due==='overdue'?'Просрочено':'Скоро' }}
          </span>
        </RouterLink>
        <div v-if="!upcoming.length" class="operations-empty">
          <strong>Нет ближайших плановых работ</strong>
          <RouterLink to="/plans/list">Открыть регламенты ТО</RouterLink>
        </div>
      </BaseCard>
    </div>
    <div class="dashboard-panels">
      <BaseCard>
        <div class="panel-heading"><div><h2>Последние наряды</h2></div>
          <RouterLink to="/work-orders">Все наряды <ArrowUpRight :size="15" /></RouterLink>
        </div>
        <div v-if="!orders.length" class="blank-panel">
          <ClipboardList :size="32" />
          <strong>Нарядов пока нет</strong>
          <span>Создайте первое наряд-задание, чтобы видеть ход выполнения работ.</span>
          <RouterLink class="blank-link" to="/work-orders">Перейти к нарядам</RouterLink>
        </div>
        <RouterLink v-for="order in orders" v-else :key="order.id" class="home-order"
          :to="'/work-orders/'+order.id">
          <span>{{ order.number }}</span><strong>{{ order.title }}</strong>
          <small>{{ order.status==='closed'?'Закрыт':order.status==='in_progress'?'В работе':'Ожидает' }}</small>
          <ArrowUpRight :size="16" /></RouterLink>
      </BaseCard>
      <BaseCard>
        <div class="panel-heading"><div><h2>Быстрые действия</h2></div></div>
        <div class="quick-actions">
          <RouterLink to="/work-orders"><ClipboardList :size="20" />Наряд-задания<ArrowUpRight :size="16" /></RouterLink>
          <RouterLink to="/assets"><Package :size="20" />Реестр активов<ArrowUpRight :size="16" /></RouterLink>
          <RouterLink to="/plans"><Wrench :size="20" />Планы ТО<ArrowUpRight :size="16" /></RouterLink>
          <RouterLink to="/schedule"><CalendarDays :size="20" />Расписание<ArrowUpRight :size="16" /></RouterLink>
        </div>
      </BaseCard>
    </div>
  </div>
</template>

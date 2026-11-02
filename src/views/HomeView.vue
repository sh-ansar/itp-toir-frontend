<script setup lang="ts">
import { onMounted, ref, watch } from 'vue'
import { RouterLink } from 'vue-router'
import { Wrench, Package, CalendarDays, ClipboardList, AlertTriangle, ArrowUpRight, RefreshCcw } from 'lucide-vue-next'
import BasePageHeading from '../components/ui/BasePageHeading.vue'
import BaseNotice from '../components/ui/BaseNotice.vue'
import BaseCard from '../components/ui/BaseCard.vue'
import { loadOverview, listResources } from '../api/resources'
import type { Overview, ToirRecord } from '../types/toir'
import { useSessionStore } from '../stores/session'

const session=useSessionStore()
const data=ref<Overview|null>(null)
const orders=ref<ToirRecord[]>([])
const busy=ref(false)
const error=ref('')
async function refresh(){
  busy.value=true;error.value=''
  try{
    const [overview,ordersResponse]=await Promise.all([
      loadOverview(),listResources('work-orders',{per_page:5})
    ])
    data.value=overview;orders.value=ordersResponse.data
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
    <div class="toir-breadcrumb">Ремонт и обслуживание / Рабочий стол</div>
    <BasePageHeading title="Рабочий стол" description="Контроль работ и оборудования компании">
      <button class="toolbar-icon" type="button" aria-label="Обновить показатели" :disabled="busy" @click="refresh">
        <RefreshCcw :size="18" />
      </button>
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
    <div class="dashboard-panels">
      <BaseCard>
        <div class="panel-heading"><div><h2>Последние наряды</h2><p>Актуальные работы по выбранной компании</p></div>
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
        <div class="panel-heading"><div><h2>Быстрые действия</h2><p>Основные разделы технического обслуживания</p></div></div>
        <div class="quick-actions">
          <RouterLink to="/work-orders"><ClipboardList :size="20" />Наряд-задания<ArrowUpRight :size="16" /></RouterLink>
          <RouterLink to="/assets"><Package :size="20" />Реестр активов<ArrowUpRight :size="16" /></RouterLink>
          <RouterLink to="/plans"><Wrench :size="20" />Планы ТО<ArrowUpRight :size="16" /></RouterLink>
          <RouterLink to="/schedule"><CalendarDays :size="20" />Расписание<ArrowUpRight :size="16" /></RouterLink>
        </div>
        <div class="company-hint">Текущая компания: <strong>{{ session.session?.companies.find(c=>c.id===session.session?.active_company_id)?.name||'Не выбрана' }}</strong></div>
      </BaseCard>
    </div>
  </div>
</template>

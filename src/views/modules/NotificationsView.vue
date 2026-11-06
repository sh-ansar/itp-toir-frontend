<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { RouterLink } from 'vue-router'
import { Bell, AlertTriangle, CalendarClock, ArrowUpRight } from 'lucide-vue-next'
import BasePageHeading from '../../components/ui/BasePageHeading.vue'
import BaseNotice from '../../components/ui/BaseNotice.vue'
import BaseCard from '../../components/ui/BaseCard.vue'
import { listResources } from '../../api/resources'
import { useSessionStore } from '../../stores/session'
import type { ToirRecord } from '../../types/toir'

const session=useSessionStore()
const alerts=ref<{name:string;link:string;hint:string;kind:'order'|'plan'}[]>([])
const busy=ref(false)
const error=ref('')
async function load(){
  busy.value=true;error.value=''
  try{
    const [orders,plans]=await Promise.all([
      listResources('work-orders',{status:'overdue',per_page:100}),listResources('plans',{per_page:100})
    ])
    const today=new Date().toISOString().slice(0,10)
    alerts.value=[
      ...orders.data.map(o=>({name:o.title||o.number||'Наряд',link:'/work-orders/'+o.id,
        hint:'Просроченный наряд '+o.number,kind:'order' as const})),
      ...plans.data.filter(p=>!!p.next_due_date&&p.next_due_date<today&&p.status!=='completed').map(p=>({
        name:p.title||'Мероприятие',link:'/plans/'+p.id,hint:'Срок ТО '+p.next_due_date,kind:'plan' as const}))
    ]
  }catch(cause){error.value=cause instanceof Error?cause.message:'Не удалось загрузить задачи'}
  finally{busy.value=false}
}
watch(()=>session.session?.active_company_id,()=>void load())
onMounted(()=>void load())
</script>
<template>
  <div class="notifications-page">
    <BasePageHeading title="Уведомления" description="Задачи и сроки, требующие внимания" />
    <BaseNotice v-if="error" tone="error">{{ error }}</BaseNotice>
    <BaseCard>
      <div class="panel-heading"><div><h2>Контроль сроков</h2><p>По данным нарядов и планов ТО</p></div>
        <span class="notice-count">{{ alerts.length }}</span></div>
      <div v-if="!busy&&!alerts.length" class="blank-panel"><Bell :size="28" /><strong>Срочных задач пока нет</strong>
        <span>Здесь появляются просроченные работы и планы ТО с истекшим сроком.</span></div>
      <RouterLink v-for="alert in alerts" v-else :key="alert.link" class="notification-item" :to="alert.link">
        <AlertTriangle v-if="alert.kind==='order'" :size="20" /><CalendarClock v-else :size="20" />
        <div><strong>{{ alert.name }}</strong><small>{{ alert.hint }}</small></div>
        <ArrowUpRight :size="17"/>
      </RouterLink>
    </BaseCard>
  </div>
</template>

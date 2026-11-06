<script setup lang="ts">
import BaseSelect from '../../components/ui/BaseSelect.vue'
import { computed, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { ChevronLeft, Pencil, Trash2, ClipboardList, History, Package, FileText, Link2, Wrench, Play, CheckCircle2, RotateCcw, CalendarPlus, X, Users } from 'lucide-vue-next'
import BaseButton from '../../components/ui/BaseButton.vue'
import BaseNotice from '../../components/ui/BaseNotice.vue'
import BasePageHeading from '../../components/ui/BasePageHeading.vue'
import BaseStatusPill from '../../components/ui/BaseStatusPill.vue'
import ToirEditorDrawer from '../../components/toir/ToirEditorDrawer.vue'
import ToirRegistryTable from '../../components/toir/ToirRegistryTable.vue'
import ToirOrderMaterials from '../../components/toir/ToirOrderMaterials.vue'
import ToirChecklistPanel from '../../components/toir/ToirChecklistPanel.vue'
import { getStock, receiveSupply, type StockItem } from '../../api/stock'
import { loadResource, loadAssetPassport, listResources, deleteResource, reportAssetFault, dispatchWorkOrder, reviewWorkOrder, transitionWorkOrder, issuePlanOrder, type WorkOrderAction, type AssetPassport } from '../../api/resources'
import { specs, STATUS_LABELS, canEdit } from '../../config/toirModules'
import { useSessionStore } from '../../stores/session'
import type { ResourceName, ToirRecord } from '../../types/toir'

const props=defineProps<{resource:ResourceName;id:string}>()
const router=useRouter()
const session=useSessionStore()
const spec=computed(()=>specs[props.resource])
const record=ref<ToirRecord|null>(null)
const busy=ref(false)
const error=ref('')
const editor=ref(false)
const tab=ref('overview')
const workflowAction=ref<WorkOrderAction|'issue'|null>(null)
const workflowNote=ref('')
const workflowLaborMinutes=ref<number|null>(null)
const workflowBusy=ref(false)
const workflowError=ref('')
const dispatchDialog=ref(false)
const dispatchEmployee=ref<number|null>(null)
const dispatchEmployees=ref<ToirRecord[]>([])
const dispatchComment=ref('')
const dispatchStart=ref('')
const dispatchEnd=ref('')
const dispatchBusy=ref(false)
const dispatchError=ref('')
const reviewDecision=ref<'accept'|'reject'|null>(null)
const reviewComment=ref('')
const reviewBusy=ref(false)
const reviewError=ref('')
const faultDialog=ref(false)
const faultTitle=ref('')
const faultDescription=ref('')
const faultPriority=ref<'normal'|'high'|'critical'>('normal')
const faultBusy=ref(false)
const faultError=ref('')
const supplyDialog=ref(false)
const stockChoices=ref<StockItem[]>([])
const stockTarget=ref<number|null>(null)
const supplyBusy=ref(false)
const related=ref<{orders:ToirRecord[];plans:ToirRecord[];assets:ToirRecord[]}>({orders:[],plans:[],assets:[]})
const passport=ref<AssetPassport|null>(null)
const editable=computed(()=>canEdit(session.session?.active_role,props.resource))
const canEditDetails=computed(()=>editable.value&&!(props.resource==='work-orders'&&['closed','awaiting_acceptance'].includes(record.value?.status||''))
  && !(props.resource==='supplies'&&record.value?.status==='delivered'))
const canReceiveSupply=computed(()=>props.resource==='supplies' && record.value &&
  ['requested','ordered'].includes(record.value.status||'') &&
  ['owner','admin','manager'].includes(session.session?.active_role||''))
const canOperateOrder=computed(()=>{
  const role=session.session?.active_role
  if(['owner','admin','manager','engineer'].includes(role||''))return true
  return role==='technician' && (
    record.value?.employee?.user_id===session.session?.user.id
      && record.value?.employee?.status==='active'
    || !!record.value?.crew?.members?.some(m=>
      m.user_id===session.session?.user.id&&m.status==='active')
  )
})
const canDispatch=computed(()=>props.resource==='work-orders'&&['waiting','overdue'].includes(record.value?.status||'')
  && ['owner','admin','manager','engineer'].includes(session.session?.active_role||''))
const canReview=computed(()=>props.resource==='work-orders'&&record.value?.status==='awaiting_acceptance'
  && ['owner','admin','manager'].includes(session.session?.active_role||'')
  && record.value?.employee?.user_id!==session.session?.user.id
  && !record.value?.crew?.members?.some(m=>m.user_id===session.session?.user.id))
const canDeleteDetails=computed(()=>canEditDetails.value &&
  !(props.resource==='work-orders' && (record.value?.maintenance_plan_id ||
    ['in_progress','awaiting_acceptance'].includes(record.value?.status||''))))
const canReopen=computed(()=>['owner','admin','manager'].includes(session.session?.active_role||'')
  && !record.value?.maintenance_plan_id)
const canIssuePlan=computed(()=>['owner','admin','manager','engineer'].includes(session.session?.active_role||'')
  && ['planned','active'].includes(record.value?.status||''))
const title=computed(()=>record.value?.title||record.value?.name||record.value?.number||'Запись '+props.id)
const infoTabs=computed(()=>{
  if(props.resource==='work-orders')return [
    {key:'overview',name:'Общее'},{key:'checklist',name:'Чек-лист'},{key:'events',name:'Операции к заданию'},
    {key:'assets',name:'Связанные активы'},{key:'resources',name:'Ресурсы'},
    {key:'files',name:'Приложенные файлы'},{key:'log',name:'Log'}]
  if(props.resource==='assets')return [
    {key:'overview',name:'Общее'},{key:'children',name:'Связанные активы'},
    {key:'orders',name:'Планирование и обслуживание'},{key:'history',name:'История ремонта'},
    {key:'files',name:'Документы'}]
  if(props.resource==='plans')return [{key:'checklist',name:'Технологическая карта'},{key:'overview',name:'Общее'},{key:'orders',name:'Выпущенные наряды'}]
  return [{key:'overview',name:'Общее'},{key:'history',name:'История'}]
})
const displayFields=computed(()=>spec.value.fields.filter(f=>f.key!=='name'&&f.key!=='title'))
let stamp=0
async function refresh(){
  const run=++stamp
  busy.value=true;error.value='';passport.value=null;related.value={orders:[],plans:[],assets:[]}
  try{
    const row=await loadResource(props.resource,Number(props.id))
    if(run!==stamp)return
    record.value=row
    if(props.resource==='plans'){
      const res=await listResources('work-orders',{per_page:100,maintenance_plan_id:row.id})
      if(run===stamp)related.value={orders:res.data,plans:[],assets:[]}
    }
    if(props.resource==='assets'){
      const [history,assets]=await Promise.all([
        loadAssetPassport(row.id),
        listResources('assets',{per_page:100}),
      ])
      if(run===stamp){
        passport.value=history
        related.value={orders:history.orders,plans:history.plans,assets:assets.data.filter(x=>x.parent_id===row.id)}
      }
    }
  }catch(cause){if(run===stamp){record.value=null;error.value=cause instanceof Error?cause.message:'Не удалось загрузить запись'}}
  finally{if(run===stamp)busy.value=false}
}
watch(()=>[props.resource,props.id,session.session?.active_company_id],()=>{
  tab.value='overview';void refresh()
})
onMounted(()=>void refresh())
function textOf(field:string):string{
  const row=record.value
  if(!row)return '—'
  if(['asset_id','employee_id','project_id','parent_id'].includes(field)){
    const r=({asset_id:'asset',employee_id:'employee',project_id:'project',parent_id:'parent'} as Record<string,string>)[field]
    const linked=row[r] as ToirRecord|null|undefined
    return linked?.name||linked?.title||(row[field]?'#'+row[field]:'—')
  }
  const value=row[field]
  if(value===null||value===undefined||value==='')return '—'
  if(field==='priority')return ({1:'Критический',2:'Высокий',3:'Обычный',4:'Низкий',5:'Минимальный'} as Record<number,string>)[Number(value)]||String(value)
  if(field.endsWith('_date')||field.endsWith('_at')||field.startsWith('planned_')||field.startsWith('actual_')){
    const date=new Date(String(value));if(Number.isFinite(date.getTime()))return date.toLocaleString('ru-RU')
  }
  return STATUS_LABELS[String(value)]||String(value)
}
async function remove(){
  if(!record.value||!editable.value)return
  if(!window.confirm('Перенести запись в архив?'))return
  try{await deleteResource(props.resource,record.value.id);await router.replace('/'+props.resource)}
  catch(cause){error.value=cause instanceof Error?cause.message:'Не удалось архивировать запись'}
}
function saved(){editor.value=false;void refresh()}
async function openDispatch(){
  if(!record.value)return
  dispatchError.value='';dispatchComment.value=''
  dispatchStart.value=record.value.planned_start?String(record.value.planned_start).slice(0,16).replace(' ','T'):''
  dispatchEnd.value=record.value.planned_end?String(record.value.planned_end).slice(0,16).replace(' ','T'):''
  dispatchEmployee.value=Number(record.value.employee_id)||null
  dispatchDialog.value=true
  try{dispatchEmployees.value=(await listResources('employees',{per_page:100,status:'active'})).data}
  catch(cause){dispatchError.value=cause instanceof Error?cause.message:'Не удалось загрузить исполнителей'}
}
async function submitDispatch(){
  if(!record.value||!dispatchEmployee.value||dispatchBusy.value)return
  dispatchBusy.value=true;dispatchError.value=''
  try{
    await dispatchWorkOrder(record.value.id,{
      employee_id:dispatchEmployee.value,comment:dispatchComment.value.trim(),
      ...(dispatchStart.value?{planned_start:dispatchStart.value}:{}),
      ...(dispatchEnd.value?{planned_end:dispatchEnd.value}:{}),
    })
    dispatchDialog.value=false;await refresh()
  }catch(cause){dispatchError.value=cause instanceof Error?cause.message:'Не удалось назначить исполнителя'}
  finally{dispatchBusy.value=false}
}
async function submitReview(){
  if(!record.value||!reviewDecision.value||reviewBusy.value)return
  reviewBusy.value=true;reviewError.value=''
  try{
    await reviewWorkOrder(record.value.id,reviewDecision.value,reviewComment.value.trim())
    reviewDecision.value=null;await refresh();tab.value='events'
  }catch(cause){reviewError.value=cause instanceof Error?cause.message:'Не удалось провести приёмку'}
  finally{reviewBusy.value=false}
}
async function submitFault(){
  if(!record.value||faultBusy.value)return
  faultBusy.value=true;faultError.value=''
  try{
    const order=await reportAssetFault(record.value.id,{
      title:faultTitle.value.trim(),description:faultDescription.value.trim(),priority:faultPriority.value
    })
    faultDialog.value=false
    await router.push('/work-orders/'+order.id)
  }catch(cause){faultError.value=cause instanceof Error?cause.message:'Не удалось зарегистрировать неисправность'}
  finally{faultBusy.value=false}
}
async function openSupplyReceipt(){
  if(!record.value||props.resource!=='supplies')return
  stockTarget.value=null;error.value=''
  try{
    stockChoices.value=(await getStock({per_page:100})).data
      .filter(item=>item.unit===record.value?.unit)
    supplyDialog.value=true
  }catch(e){error.value=e instanceof Error?e.message:'Не удалось загрузить склад'}
}
async function submitSupplyReceipt(){
  if(!record.value||!stockTarget.value||supplyBusy.value)return
  supplyBusy.value=true;error.value=''
  try{
    await receiveSupply(record.value.id,stockTarget.value)
    supplyDialog.value=false
    await refresh()
  }catch(e){error.value=e instanceof Error?e.message:'Не удалось принять заявку'}
  finally{supplyBusy.value=false}
}
const operationLabel=computed(()=>({
  start:'Начать работы',complete:'Завершить работы',reopen:'Открыть повторно',issue:'Выпустить наряд'
})[workflowAction.value||'start'])
function openOperation(action:WorkOrderAction|'issue'){
  workflowNote.value=''
  workflowLaborMinutes.value=null
  workflowError.value=''
  workflowAction.value=action
}
function closeOperation(){
  if(workflowBusy.value)return
  workflowAction.value=null
  workflowError.value=''
}
async function confirmOperation(){
  if(!record.value||!workflowAction.value||workflowBusy.value)return
  const action=workflowAction.value
  const note=workflowNote.value.trim()
  if(['complete','reopen'].includes(action)&&note.length<3){
    workflowError.value='Введите результат работ или причину (не менее 3 символов).'
    return
  }
  workflowBusy.value=true
  workflowError.value=''
  try{
    if(action==='issue'){
      const issued=await issuePlanOrder(record.value.id)
      workflowAction.value=null
      await router.push('/work-orders/'+issued.data.id)
    }else{
      await transitionWorkOrder(record.value.id,action,note,
        action==='complete'&&Number.isInteger(workflowLaborMinutes.value)&&Number(workflowLaborMinutes.value)>=0
          ?Number(workflowLaborMinutes.value):undefined)
      workflowAction.value=null
      await refresh()
      tab.value='events'
    }
  }catch(cause){
    workflowError.value=cause instanceof Error?cause.message:'Не удалось выполнить операцию'
  }finally{
    workflowBusy.value=false
  }
}
</script>

<template>
  <div class="detail-page">
    <div class="toir-breadcrumb">{{ spec.breadcrumb }} / {{ title }}</div>
    <div class="detail-page-head">
      <button class="detail-back" type="button" aria-label="Назад к списку" @click="router.push('/'+resource)">
        <ChevronLeft :size="22" />
      </button>
      <BasePageHeading :title="resource==='work-orders'?'Наряд-задание: '+(record?.number||id):title" />
    </div>
    <p v-if="record?.created_at" class="detail-created">Дата создания: {{ new Date(record.created_at).toLocaleDateString('ru-RU') }}</p>
    <BaseNotice v-if="error" tone="error">{{ error }}</BaseNotice>
    <div v-if="record" class="detail-actions">
      <BaseButton v-if="resource==='assets'&&record.status!=='retired'&&record.status!=='disposed'"
        type="button"  @click="faultTitle='';faultDescription='';faultPriority='normal';faultError='';faultDialog=true">
        <Wrench :size="16" />Сообщить о неисправности
      </BaseButton>
      <BaseButton v-if="canEditDetails" type="button" @click="editor=true"><Pencil :size="16" />Редактировать</BaseButton>
      <BaseButton v-if="canDispatch" type="button" variant="secondary"  @click="openDispatch">
        <Users :size="16" />Назначить исполнителя
      </BaseButton>
      <BaseButton v-if="canReview" type="button"  @click="reviewDecision='accept';reviewComment='';reviewError=''">
        <CheckCircle2 :size="16" />Принять работы
      </BaseButton>
      <BaseButton v-if="canReview" type="button" variant="secondary"  @click="reviewDecision='reject';reviewComment='';reviewError=''">
        <RotateCcw :size="16" />Вернуть на доработку
      </BaseButton>
      <BaseButton v-if="resource==='work-orders'&&record&&canOperateOrder&&['waiting','overdue'].includes(record.status||'')"
        type="button" @click="openOperation('start')"><Play :size="16"/>Начать работы</BaseButton>
      <BaseButton v-if="resource==='work-orders'&&record?.status==='in_progress'&&canOperateOrder"
        type="button" @click="openOperation('complete')"><CheckCircle2 :size="16"/>Завершить работы</BaseButton>
      <BaseButton v-if="resource==='work-orders'&&record?.status==='closed'&&canReopen"
        type="button" variant="secondary" @click="openOperation('reopen')"><RotateCcw :size="16"/>Открыть повторно</BaseButton>
      <BaseButton v-if="canReceiveSupply" type="button" variant="secondary" @click="openSupplyReceipt">
        <Package :size="16"/>Принять на склад
      </BaseButton>
      <BaseButton v-if="resource==='plans'&&canIssuePlan"
        type="button" @click="openOperation('issue')"><CalendarPlus :size="16"/>Выпустить наряд</BaseButton>
      <BaseButton v-if="canDeleteDetails" variant="secondary" type="button" @click="remove"><Trash2 :size="16" />Удалить</BaseButton>
      <BaseStatusPill v-if="record.status" :tone="['closed','completed','active'].includes(record.status)?'success':'info'">
        {{ STATUS_LABELS[record.status]||record.status }}
      </BaseStatusPill>
    </div>
    <div v-if="busy" class="loading-panel">Загрузка данных…</div>
    <template v-else-if="record">
      <section class="detail-summary">
        <div class="detail-asset-icon"><Wrench v-if="resource==='work-orders'" :size="38" />
          <Package v-else :size="38" /></div>
        <div><small>Наименование</small><strong>{{ title }}</strong><span>{{ record.description||spec.description }}</span></div>
        <div><small>Компания</small><strong>{{ session.session?.companies.find(c=>c.id===session.session?.active_company_id)?.name }}</strong>
          <span>Внутренний идентификатор: {{ record.code||record.number||record.id }}</span></div>
      </section>
      <div class="detail-tabs" role="tablist" aria-label="Разделы карточки">
        <button v-for="item in infoTabs" :key="item.key" role="tab"
          :aria-selected="tab===item.key" :class="{active:tab===item.key}" @click="tab=item.key">{{ item.name }}</button>
      </div>
      <section v-if="tab==='overview'" class="detail-fields">
        <div class="detail-column">
          <h2><FileText :size="18" /> Общие данные</h2>
          <div class="detail-description"><span>Описание</span><p>{{ record.description||'Описание не заполнено' }}</p></div>
        </div>
        <div class="detail-column">
          <h2>Параметры {{ spec.singular.toLowerCase() }}</h2>
          <dl class="detail-dl"><template v-for="field in displayFields" :key="field.key">
            <dt>{{ field.label }}</dt><dd>{{ textOf(field.key) }}</dd>
          </template>
            <template v-if="resource==='work-orders'">
              <dt>Фактические трудозатраты</dt>
              <dd>{{ record.actual_labor_minutes===null||record.actual_labor_minutes===undefined?'Не учтены':Number(record.actual_labor_minutes).toLocaleString('ru-RU')+' мин' }}</dd>
            </template>
          </dl>
        </div>
      </section>
      <section v-else-if="tab==='checklist'&&(resource==='plans'||resource==='work-orders')" class="detail-panel">
        <ToirChecklistPanel :entity="resource" :id="record.id" :status="record.status||''"
          :can-manage="resource==='plans'?editable:canOperateOrder"
          @changed="refresh"/>
      </section>
      <section v-else-if="tab==='history'&&resource==='assets'" class="detail-panel">
        <h2><History :size="18" /> История обслуживания и ремонтов</h2>
        <template v-if="passport">
          <div class="asset-history-summary">
            <div><small>Всего нарядов</small><strong>{{ passport.summary.total_orders }}</strong></div>
            <div><small>Завершено</small><strong>{{ passport.summary.completed_orders }}</strong></div>
            <div><small>Незакрытые работы</small><strong>{{ passport.summary.open_orders }}</strong></div>
            <div><small>Планы ТО</small><strong>{{ passport.summary.plan_count }}</strong></div>
          </div>
          <ToirRegistryTable :rows="passport.orders" :columns="specs['work-orders'].columns.slice(0,6)"
            :selectable="false" @open="id=>router.push('/work-orders/'+id)" />
          <h2>История измерений</h2>
          <p class="muted">Всего показаний: {{ passport.summary.reading_count }}. Отображаются последние 50.</p>
          <div v-if="passport.readings.length" class="asset-reading-list">
            <div v-for="reading in passport.readings" :key="reading.id" class="event-row">
              <span>{{ new Date(reading.recorded_at).toLocaleString('ru-RU') }}</span>
              <strong>{{ reading.meter==='operating_hours'?'Наработка, ч':'Состояние, %' }}: {{ reading.value }}</strong>
              <p v-if="reading.note">{{ reading.note }}</p>
            </div>
          </div>
          <p v-else class="muted">Показаний пока нет.</p>
        </template>
        <p v-else class="muted">История оборудования недоступна.</p>
      </section>
      <section v-else-if="tab==='events'||tab==='log'||tab==='history'" class="detail-panel">
        <h2><History :size="18" /> История действий</h2>
        <template v-if="record.events?.length">
          <div v-for="item in record.events" :key="item.id" class="event-row">
            <span>{{ new Date(item.created_at).toLocaleString('ru-RU') }}</span>
            <strong>{{ ({
              created:'Создано',updated:'Изменено',deleted:'Удалено',
              start:'Начало работ',complete:'Работы завершены',reopen:'Повторное открытие',
              issued_from_plan:'Выпущен из плана ТО',issued_from_meter:'ТО по наработке',checklist_step_updated:'Результат чек-листа',overdue:'Срок выполнения истёк',
              assigned:'Назначен исполнитель',accepted:'Работы приняты',rejected:'Возврат на доработку',fault_reported:'Неисправность зарегистрирована',
              material_reserve:'Резерв материалов',material_consume:'Списание материалов',material_release:'Снятие резерва'
            } as Record<string,string>)[item.action]||item.action }}</strong>
            <span v-if="item.changes?.to" class="event-state">{{ STATUS_LABELS[String(item.changes.to)]||item.changes.to }}</span>
            <p v-if="item.message">{{ item.message }}</p>
          </div>
        </template>
        <p v-else class="muted">Записей пока нет.</p>
      </section>
      <section v-else-if="tab==='children'" class="detail-panel">
        <h2><Link2 :size="18" /> Вложенные активы</h2>
        <ToirRegistryTable :rows="related.assets" :columns="specs.assets.columns.slice(0,4)" :selectable="false"
          @open="id=>router.push('/assets/'+id)" />
      </section>
      <section v-else-if="tab==='orders'&&resource==='plans'" class="detail-panel">
        <h2><ClipboardList :size="18" /> Выпущенные наряды</h2>
        <p class="muted">Наряды связаны с циклами обслуживания. Следующая дата ТО сдвигается после завершения работ.</p>
        <ToirRegistryTable :rows="related.orders" :columns="specs['work-orders'].columns.slice(0,6)"
          :selectable="false" @open="id=>router.push('/work-orders/'+id)" />
      </section>
      <section v-else-if="tab==='orders'" class="detail-panel">
        <h2><ClipboardList :size="18" /> Работы по активу</h2>
        <ToirRegistryTable :rows="related.orders" :columns="specs['work-orders'].columns.slice(0,6)" :selectable="false"
          @open="id=>router.push('/work-orders/'+id)" />
        <h2>Планы обслуживания</h2>
        <ToirRegistryTable :rows="related.plans" :columns="specs.plans.columns.slice(0,4)" :selectable="false"
          @open="id=>router.push('/plans/'+id)" />
      </section>
      <section v-else-if="tab==='resources'&&resource==='work-orders'" class="detail-panel">
        <ToirOrderMaterials :order-id="record.id" :status="record.status||''"
          :can-operate="canOperateOrder" @changed="refresh" />
      </section>
      <section v-else-if="tab==='assets'" class="detail-panel">
        <h2>Связанный актив</h2>
        <p v-if="record.asset"><RouterLink class="detail-link" :to="'/assets/'+record.asset.id">
          {{ record.asset.name }} ({{ record.asset.code }})</RouterLink></p>
        <p v-else class="muted">Актив пока не указан.</p>
        <p v-if="record.maintenance_plan_id" class="detail-plan-link">План ТО:
          <RouterLink class="detail-link" :to="'/plans/'+record.maintenance_plan_id">
            {{ record.maintenance_plan?.title||'Открыть план' }}
          </RouterLink>
        </p>
      </section>
      <section v-else class="detail-panel">
        <h2>{{ infoTabs.find(i=>i.key===tab)?.name }}</h2>
        <p class="muted">Раздел создан. Операции и вложения подключаются в следующем этапе; вымышленные данные не отображаются.</p>
      </section>
    </template>
    <ToirEditorDrawer :open="editor" :spec="spec" :record="record"
      @close="editor=false" @saved="saved" />
    <Teleport to="body">
      <div v-if="dispatchDialog" class="category-backdrop" @click.self="!dispatchBusy&&(dispatchDialog=false)">
        <section class="category-dialog workflow-dialog" role="dialog" aria-modal="true" aria-label="Назначить исполнителя">
          <header class="category-dialog-head"><div class="category-dialog-icon"><Users :size="19"/></div>
            <button class="drawer-close" type="button" aria-label="Закрыть" :disabled="dispatchBusy" @click="dispatchDialog=false"><X :size="18"/></button>
          </header>
          <h2>Назначить исполнителя</h2>
          <p>Назначение сохраняется в журнале наряда. После назначения можно начать работы.</p>
          <BaseNotice v-if="dispatchError" tone="error">{{ dispatchError }}</BaseNotice>
          <form class="workflow-form" @submit.prevent="submitDispatch">
            <label for="dispatch-employee">Действующий исполнитель *
              <BaseSelect id="dispatch-employee" v-model="dispatchEmployee" required :disabled="dispatchBusy">
                <option :value="null" disabled>Выберите сотрудника</option>
                <option v-for="employee in dispatchEmployees" :key="employee.id" :value="employee.id">{{ employee.name }}</option>
              </BaseSelect>
            </label>
            <label for="dispatch-start">Планируемое начало
              <input id="dispatch-start" v-model="dispatchStart" type="datetime-local" :disabled="dispatchBusy" />
            </label>
            <label for="dispatch-end">Планируемое завершение
              <input id="dispatch-end" v-model="dispatchEnd" type="datetime-local" :min="dispatchStart||undefined" :disabled="dispatchBusy" />
            </label>
            <label for="dispatch-comment">Комментарий
              <textarea id="dispatch-comment" v-model="dispatchComment" rows="2" maxlength="2000" :disabled="dispatchBusy" />
            </label>
            <div class="category-dialog-footer">
              <BaseButton type="button" variant="secondary" :disabled="dispatchBusy" @click="dispatchDialog=false">Отмена</BaseButton>
              <BaseButton type="submit" :disabled="dispatchBusy||!dispatchEmployee||!!(dispatchStart&&dispatchEnd&&dispatchEnd<dispatchStart)">{{ dispatchBusy?'Сохранение…':'Назначить' }}</BaseButton>
            </div>
          </form>
        </section>
      </div>
    </Teleport>
    <Teleport to="body">
      <div v-if="reviewDecision" class="category-backdrop" @click.self="!reviewBusy&&(reviewDecision=null)">
        <section class="category-dialog workflow-dialog" role="dialog" aria-modal="true" aria-label="Приёмка ремонта">
          <header class="category-dialog-head"><div class="category-dialog-icon"><CheckCircle2 :size="19"/></div>
            <button class="drawer-close" type="button" aria-label="Закрыть" :disabled="reviewBusy" @click="reviewDecision=null"><X :size="18"/></button>
          </header>
          <h2>{{ reviewDecision==='accept'?'Принять выполненные работы':'Вернуть на доработку' }}</h2>
          <p>{{ reviewDecision==='accept'?'Подтвердите результат проверки. После приёмки наряд будет закрыт.':'Укажите замечания. Наряд вернётся исполнителю в работу.' }}</p>
          <BaseNotice v-if="reviewError" tone="error">{{ reviewError }}</BaseNotice>
          <form class="workflow-form" @submit.prevent="submitReview">
            <label for="review-comment">{{ reviewDecision==='accept'?'Результат приёмки':'Замечания' }} *
              <textarea id="review-comment" v-model="reviewComment" rows="4" minlength="3" maxlength="2000" required :disabled="reviewBusy" />
            </label>
            <div class="category-dialog-footer">
              <BaseButton type="button" variant="secondary" :disabled="reviewBusy" @click="reviewDecision=null">Отмена</BaseButton>
              <BaseButton type="submit" :disabled="reviewBusy||reviewComment.trim().length<3">{{ reviewBusy?'Проведение…':'Подтвердить' }}</BaseButton>
            </div>
          </form>
        </section>
      </div>
    </Teleport>
    <Teleport to="body">
      <div v-if="faultDialog" class="category-backdrop" @click.self="!faultBusy&&(faultDialog=false)">
        <section class="category-dialog workflow-dialog" role="dialog" aria-modal="true" aria-label="Регистрация неисправности">
          <header class="category-dialog-head">
            <div class="category-dialog-icon"><Wrench :size="19" /></div>
            <button type="button" class="drawer-close" aria-label="Закрыть" :disabled="faultBusy" @click="faultDialog=false"><X :size="18" /></button>
          </header>
          <h2>Сообщить о неисправности</h2>
          <p>Для оборудования будет создан аварийный наряд. Исполнитель назначается при планировании работ.</p>
          <BaseNotice v-if="faultError" tone="error">{{ faultError }}</BaseNotice>
          <form class="workflow-form" @submit.prevent="submitFault">
            <label for="fault-title">Наименование неисправности *
              <input id="fault-title" v-model="faultTitle" type="text" minlength="3" maxlength="255" required :disabled="faultBusy" placeholder="Например, утечка на соединении" />
            </label>
            <label for="fault-description">Описание и признаки неисправности *
              <textarea id="fault-description" v-model="faultDescription" rows="4" minlength="10" maxlength="5000" required :disabled="faultBusy" placeholder="Что произошло и при каких условиях" />
            </label>
            <label for="fault-priority">Приоритет *
              <BaseSelect id="fault-priority" v-model="faultPriority" :disabled="faultBusy">
                <option value="normal">Обычный</option><option value="high">Высокий</option><option value="critical">Критический</option>
              </BaseSelect>
            </label>
            <div class="category-dialog-footer">
              <BaseButton type="button" variant="secondary" :disabled="faultBusy" @click="faultDialog=false">Отмена</BaseButton>
              <BaseButton type="submit" :disabled="faultBusy||faultTitle.trim().length<3||faultDescription.trim().length<10">
                {{ faultBusy?'Регистрация…':'Зарегистрировать' }}
              </BaseButton>
            </div>
          </form>
        </section>
      </div>
    </Teleport>
    <Teleport to="body">
      <div v-if="workflowAction" class="category-backdrop" @click.self="closeOperation" @keydown.esc="closeOperation">
        <section class="category-dialog workflow-dialog" role="dialog" aria-modal="true" :aria-label="operationLabel">
          <header class="category-dialog-head">
            <div class="category-dialog-icon"><Wrench :size="19" /></div>
            <button type="button" class="drawer-close" aria-label="Закрыть окно" :disabled="workflowBusy"
              @click="closeOperation"><X :size="18"/></button>
          </header>
          <h2>{{ operationLabel }}</h2>
          <p v-if="workflowAction==='issue'">Создать наряд по текущему плановому циклу. Если наряд уже есть, откроется существующий.</p>
          <p v-else-if="workflowAction==='start'">Начать выполнение работ. У наряда должны быть актив и назначенный исполнитель.</p>
          <p v-else-if="workflowAction==='complete'">Подтвердите выполненные работы и опишите результат. История сохранится в журнале наряда.</p>
          <p v-else>Укажите причину повторного открытия. У нарядов, выпущенных из плана ТО, повторное открытие недоступно.</p>
          <BaseNotice v-if="workflowError" tone="error">{{ workflowError }}</BaseNotice>
          <form class="workflow-form" @submit.prevent="confirmOperation">
            <label v-if="workflowAction==='complete'" for="workflow-labor">Фактические трудозатраты, минут
              <input id="workflow-labor" v-model.number="workflowLaborMinutes" type="number" min="0" max="1000000" step="1"
                :disabled="workflowBusy" placeholder="Укажите по табелю или факту" />
              <small>Не заполняйте, если время не учтено. В отчётах оно не будет рассчитываться приблизительно.</small>
            </label>
            <label v-if="workflowAction==='complete'||workflowAction==='reopen'" for="workflow-comment">
              {{ workflowAction==='complete'?'Результат работ':'Причина' }} *
              <textarea id="workflow-comment" v-model="workflowNote" rows="4" maxlength="2000"
                :disabled="workflowBusy" required placeholder="Опишите выполненные работы или причину"></textarea>
            </label>
            <div class="category-dialog-footer">
              <BaseButton type="button" variant="secondary" :disabled="workflowBusy" @click="closeOperation">Отмена</BaseButton>
              <BaseButton type="submit" :disabled="workflowBusy||(
                ['complete','reopen'].includes(workflowAction)&&workflowNote.trim().length<3
              )">{{ workflowBusy?'Выполняется…':'Подтвердить' }}</BaseButton>
            </div>
          </form>
        </section>
      </div>
    </Teleport>
    <Teleport to="body">
      <div v-if="supplyDialog" class="category-backdrop" @click.self="!supplyBusy&&(supplyDialog=false)">
        <section class="category-dialog warehouse-dialog" role="dialog" aria-modal="true" aria-label="Принять на склад">
          <header class="category-dialog-head">
            <div class="category-dialog-icon"><Package :size="19"/></div>
            <button type="button" class="drawer-close" aria-label="Закрыть" :disabled="supplyBusy" @click="supplyDialog=false"><X :size="18"/></button>
          </header>
          <h2>Принять заявку на склад</h2>
          <p>Количество из заявки будет оприходовано один раз, с записью в журнале.
            Учётная цена обновится как средневзвешенная.</p>
          <form class="warehouse-form" @submit.prevent="submitSupplyReceipt">
            <label>Позиция склада с той же единицей измерения *
              <BaseSelect v-model="stockTarget" required>
                <option :value="null" disabled>Выберите позицию</option>
                <option v-for="item in stockChoices" :key="item.id" :value="item.id">
                  {{ item.sku }} — {{ item.name }}
                </option>
              </BaseSelect>
            </label>
            <p v-if="!stockChoices.length" class="muted">
              Совпадающих позиций на первой странице нет.
              <RouterLink class="detail-link" to="/warehouse">Добавьте позицию на складе</RouterLink>.
            </p>
            <div class="category-dialog-footer">
              <BaseButton type="button" variant="secondary" :disabled="supplyBusy" @click="supplyDialog=false">Отмена</BaseButton>
              <BaseButton type="submit" :disabled="!stockTarget||supplyBusy">
                {{ supplyBusy?'Проведение…':'Провести приход' }}
              </BaseButton>
            </div>
          </form>
        </section>
      </div>
    </Teleport>
  </div>
</template>

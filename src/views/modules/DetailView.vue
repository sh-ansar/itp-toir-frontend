<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { ChevronLeft, Pencil, Trash2, ClipboardList, History, Package, FileText, Link2, Wrench, Play, CheckCircle2, RotateCcw, CalendarPlus, X } from 'lucide-vue-next'
import BaseButton from '../../components/ui/BaseButton.vue'
import BaseNotice from '../../components/ui/BaseNotice.vue'
import BasePageHeading from '../../components/ui/BasePageHeading.vue'
import BaseStatusPill from '../../components/ui/BaseStatusPill.vue'
import ToirEditorDrawer from '../../components/toir/ToirEditorDrawer.vue'
import ToirRegistryTable from '../../components/toir/ToirRegistryTable.vue'
import { loadResource, listResources, deleteResource, transitionWorkOrder, issuePlanOrder, type WorkOrderAction } from '../../api/resources'
import { specs, STATUS_LABELS, canEdit } from '../../config/toirModules'
import { useSessionStore } from '../../stores/session'
import { usePreviewStore } from '../../stores/preview'
import type { ResourceName, ToirRecord } from '../../types/toir'

const props=defineProps<{resource:ResourceName;id:string}>()
const router=useRouter()
const session=useSessionStore()
const preview=usePreviewStore()
const spec=computed(()=>specs[props.resource])
const record=ref<ToirRecord|null>(null)
const busy=ref(false)
const error=ref('')
const editor=ref(false)
const tab=ref('overview')
const workflowAction=ref<WorkOrderAction|'issue'|null>(null)
const workflowNote=ref('')
const workflowBusy=ref(false)
const workflowError=ref('')
const related=ref<{orders:ToirRecord[];plans:ToirRecord[];assets:ToirRecord[]}>({orders:[],plans:[],assets:[]})
const editable=computed(()=>canEdit(session.session?.active_role,props.resource))
const canEditDetails=computed(()=>editable.value&&!(props.resource==='work-orders'&&record.value?.status==='closed'))
const canOperateOrder=computed(()=>{
  const role=session.session?.active_role
  if(['owner','admin','manager','engineer'].includes(role||''))return true
  return role==='technician' && record.value?.employee?.user_id===session.session?.user.id
    && record.value?.employee?.status==='active'
})
const canReopen=computed(()=>['owner','admin','manager'].includes(session.session?.active_role||'')
  && !record.value?.maintenance_plan_id)
const canIssuePlan=computed(()=>['owner','admin','manager','engineer'].includes(session.session?.active_role||'')
  && ['planned','active'].includes(record.value?.status||''))
const title=computed(()=>record.value?.title||record.value?.name||record.value?.number||'Запись '+props.id)
const infoTabs=computed(()=>{
  if(props.resource==='work-orders')return [
    {key:'overview',name:'Общее'},{key:'events',name:'Операции к заданию'},
    {key:'assets',name:'Связанные активы'},{key:'resources',name:'Ресурсы'},
    {key:'files',name:'Приложенные файлы'},{key:'log',name:'Log'}]
  if(props.resource==='assets')return [
    {key:'overview',name:'Общее'},{key:'children',name:'Связанные активы'},
    {key:'orders',name:'Планирование и обслуживание'},{key:'history',name:'История ремонта'},
    {key:'files',name:'Документы'}]
  if(props.resource==='plans')return [{key:'overview',name:'Общее'},{key:'orders',name:'Выпущенные наряды'}]
  return [{key:'overview',name:'Общее'},{key:'history',name:'История'}]
})
const displayFields=computed(()=>spec.value.fields.filter(f=>f.key!=='name'&&f.key!=='title'))
let stamp=0
async function refresh(){
  const run=++stamp
  busy.value=true;error.value=''
  try{
    const row=await loadResource(props.resource,Number(props.id))
    if(run!==stamp)return
    record.value=row
    if(props.resource==='plans'){
      const res=await listResources('work-orders',{per_page:100,maintenance_plan_id:row.id})
      if(run===stamp)related.value={orders:res.data,plans:[],assets:[]}
    }
    if(props.resource==='assets'){
      const [orders,plans,assets]=await Promise.all([
        listResources('work-orders',{per_page:100,asset_id:row.id}),
        listResources('plans',{per_page:100,asset_id:row.id}),
        listResources('assets',{per_page:100}),
      ])
      if(run===stamp)related.value={orders:orders.data,plans:plans.data,assets:assets.data.filter(x=>x.parent_id===row.id)}
    }
  }catch(cause){if(run===stamp){record.value=null;error.value=cause instanceof Error?cause.message:'Не удалось загрузить запись'}}
  finally{if(run===stamp)busy.value=false}
}
watch(()=>[props.resource,props.id,session.session?.active_company_id,preview.enabled],()=>{
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
  if(field.endsWith('_date')||field.endsWith('_at')||field.startsWith('planned_')||field.startsWith('actual_')){
    const date=new Date(String(value));if(Number.isFinite(date.getTime()))return date.toLocaleString('ru-RU')
  }
  return STATUS_LABELS[String(value)]||String(value)
}
async function remove(){
  if(!record.value||!editable.value||preview.enabled)return
  if(!window.confirm('Перенести запись в архив?'))return
  try{await deleteResource(props.resource,record.value.id);await router.replace('/'+props.resource)}
  catch(cause){error.value=cause instanceof Error?cause.message:'Не удалось архивировать запись'}
}
function saved(){editor.value=false;void refresh()}
const operationLabel=computed(()=>({
  start:'Начать работы',complete:'Завершить работы',reopen:'Открыть повторно',issue:'Выпустить наряд'
})[workflowAction.value||'start'])
function openOperation(action:WorkOrderAction|'issue'){
  workflowNote.value=''
  workflowError.value=''
  workflowAction.value=action
}
function closeOperation(){
  if(workflowBusy.value)return
  workflowAction.value=null
  workflowError.value=''
}
async function confirmOperation(){
  if(!record.value||!workflowAction.value||workflowBusy.value||preview.enabled)return
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
      await transitionWorkOrder(record.value.id,action,note)
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
      <BaseButton v-if="canEditDetails" type="button" @click="editor=true"><Pencil :size="16" />Редактировать</BaseButton>
      <BaseButton v-if="resource==='work-orders'&&record&&canOperateOrder&&['waiting','overdue'].includes(record.status||'')"
        type="button" @click="openOperation('start')"><Play :size="16"/>Начать работы</BaseButton>
      <BaseButton v-if="resource==='work-orders'&&record?.status==='in_progress'&&canOperateOrder"
        type="button" @click="openOperation('complete')"><CheckCircle2 :size="16"/>Завершить работы</BaseButton>
      <BaseButton v-if="resource==='work-orders'&&record?.status==='closed'&&canReopen"
        type="button" variant="secondary" @click="openOperation('reopen')"><RotateCcw :size="16"/>Открыть повторно</BaseButton>
      <BaseButton v-if="resource==='plans'&&canIssuePlan"
        type="button" @click="openOperation('issue')"><CalendarPlus :size="16"/>Выпустить наряд</BaseButton>
      <BaseButton v-if="canEditDetails&&!preview.enabled" variant="secondary" type="button" @click="remove"><Trash2 :size="16" />Удалить</BaseButton>
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
          </template></dl>
        </div>
      </section>
      <section v-else-if="tab==='events'||tab==='log'||tab==='history'" class="detail-panel">
        <h2><History :size="18" /> История действий</h2>
        <template v-if="record.events?.length">
          <div v-for="item in record.events" :key="item.id" class="event-row">
            <span>{{ new Date(item.created_at).toLocaleString('ru-RU') }}</span>
            <strong>{{ ({
              created:'Создано',updated:'Изменено',deleted:'Удалено',
              start:'Начало работ',complete:'Работы завершены',reopen:'Повторное открытие',
              issued_from_plan:'Выпущен из плана ТО',overdue:'Срок выполнения истёк'
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
    <ToirEditorDrawer :open="editor" :spec="spec" :record="record" :preview="preview.enabled"
      @close="editor=false" @saved="saved" />
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
          <BaseNotice v-if="preview.enabled" tone="warning">Демо-режим: операции не сохраняются. Выключите просмотр макета.</BaseNotice>
          <BaseNotice v-if="workflowError" tone="error">{{ workflowError }}</BaseNotice>
          <form class="workflow-form" @submit.prevent="confirmOperation">
            <label v-if="workflowAction==='complete'||workflowAction==='reopen'" for="workflow-comment">
              {{ workflowAction==='complete'?'Результат работ':'Причина' }} *
              <textarea id="workflow-comment" v-model="workflowNote" rows="4" maxlength="2000"
                :disabled="workflowBusy||preview.enabled" required placeholder="Опишите выполненные работы или причину"></textarea>
            </label>
            <div class="category-dialog-footer">
              <BaseButton type="button" variant="secondary" :disabled="workflowBusy" @click="closeOperation">Отмена</BaseButton>
              <BaseButton type="submit" :disabled="workflowBusy||preview.enabled||(
                ['complete','reopen'].includes(workflowAction)&&workflowNote.trim().length<3
              )">{{ workflowBusy?'Выполняется…':'Подтвердить' }}</BaseButton>
            </div>
          </form>
        </section>
      </div>
    </Teleport>
  </div>
</template>

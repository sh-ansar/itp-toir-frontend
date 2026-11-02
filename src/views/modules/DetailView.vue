<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { ChevronLeft, Pencil, Trash2, ClipboardList, History, Package, FileText, Link2, Wrench } from 'lucide-vue-next'
import BaseButton from '../../components/ui/BaseButton.vue'
import BaseNotice from '../../components/ui/BaseNotice.vue'
import BasePageHeading from '../../components/ui/BasePageHeading.vue'
import BaseStatusPill from '../../components/ui/BaseStatusPill.vue'
import ToirEditorDrawer from '../../components/toir/ToirEditorDrawer.vue'
import ToirRegistryTable from '../../components/toir/ToirRegistryTable.vue'
import { loadResource, listResources, deleteResource } from '../../api/resources'
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
const related=ref<{orders:ToirRecord[];plans:ToirRecord[];assets:ToirRecord[]}>({orders:[],plans:[],assets:[]})
const editable=computed(()=>canEdit(session.session?.active_role,props.resource))
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
      <BaseButton v-if="editable" @click="editor=true"><Pencil :size="16" />Редактировать</BaseButton>
      <BaseButton v-if="editable" variant="secondary" @click="remove"><Trash2 :size="16" />Удалить</BaseButton>
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
            <strong>{{ {created:'Создано',updated:'Изменено',deleted:'Удалено'}[item.action as 'created'|'updated'|'deleted']||item.action }}</strong>
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
      </section>
      <section v-else class="detail-panel">
        <h2>{{ infoTabs.find(i=>i.key===tab)?.name }}</h2>
        <p class="muted">Раздел создан. Операции и вложения подключаются в следующем этапе; вымышленные данные не отображаются.</p>
      </section>
    </template>
    <ToirEditorDrawer :open="editor" :spec="spec" :record="record" @close="editor=false" @saved="saved" />
  </div>
</template>

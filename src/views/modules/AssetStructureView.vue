<script setup lang="ts">
import BaseSearchField from '../../components/ui/BaseSearchField.vue'
import { computed, onMounted, ref, watch } from 'vue'
import { RouterLink } from 'vue-router'
import { Boxes, ChevronDown, ChevronRight, Plus, RefreshCcw, Activity, ClipboardList, Layers3, X } from 'lucide-vue-next'
import BaseButton from '../../components/ui/BaseButton.vue'
import BaseCard from '../../components/ui/BaseCard.vue'
import BaseNotice from '../../components/ui/BaseNotice.vue'
import BasePageHeading from '../../components/ui/BasePageHeading.vue'
import ToirEditorDrawer from '../../components/toir/ToirEditorDrawer.vue'
import { specs } from '../../config/toirModules'
import { getAssetTree, getRisks, getReadings, recordReading,
  type AssetNode, type RiskNode, type MeterReading } from '../../api/operations'
import { listResources } from '../../api/resources'
import { usePreviewStore } from '../../stores/preview'
import { useSessionStore } from '../../stores/session'
import type { ToirRecord } from '../../types/toir'

const preview=usePreviewStore()
const session=useSessionStore()
const loading=ref(false),saving=ref(false),error=ref(''),success=ref('')
const nodes=ref<AssetNode[]>([])
const risks=ref<RiskNode[]>([])
const selectedId=ref<number|null>(null)
const expanded=ref(new Set<number>())
const search=ref('')
const drawer=ref(false)
const parentForCreate=ref<number|null>(null)
const meterDialog=ref(false),meter=ref<'operating_hours'|'condition_score'>('condition_score')
const meterValue=ref(''),meterNote=ref('')
const readings=ref<MeterReading[]>([])
const plans=ref<ToirRecord[]>([])
const editable=computed(()=>['owner','admin','manager'].includes(session.session?.active_role||''))
const canReadMeter=computed(()=>['owner','admin','manager','engineer'].includes(session.session?.active_role||''))
const selected=computed(()=>nodes.value.find(n=>n.id===selectedId.value)||null)
const riskIndex=computed(()=>new Map(risks.value.map(r=>[r.id,r])))
const selectedRisk=computed(()=>selectedId.value?riskIndex.value.get(selectedId.value):undefined)
const typeLabel:Record<string,string>={
  object:'Объект',system:'Система',equipment:'Оборудование',
  aggregate:'Агрегат',assembly:'Узел',component:'Компонент'
}
const levelLabel:Record<string,string>={critical:'Критический',high:'Высокий',medium:'Средний',low:'Низкий'}
const index=computed(()=>new Map(nodes.value.map(n=>[n.id,n])))
const children=computed(()=>{
  const groups=new Map<number,AssetNode[]>()
  for(const node of nodes.value){
    const p=node.parent_id && index.value.has(node.parent_id) && node.parent_id!==node.id?node.parent_id:0
    const found=groups.get(p)||[]
    found.push(node);groups.set(p,found)
  }
  for(const group of groups.values())group.sort((a,b)=>(a.name||'').localeCompare(b.name||'','ru'))
  return groups
})
const visible=computed(()=>{
  const result:{node:AssetNode;depth:number;hasChildren:boolean}[]=[]
  const needle=search.value.trim().toLocaleLowerCase('ru')
  const matching=new Set<number>()
  if(needle){
    for(const node of nodes.value){
      if((node.name+' '+(node.code||'')).toLocaleLowerCase('ru').includes(needle)){
        const seen=new Set<number>()
        let current:AssetNode|undefined=node
        while(current&&!seen.has(current.id)){
          seen.add(current.id);matching.add(current.id)
          current=current.parent_id?index.value.get(current.parent_id):undefined
        }
      }
    }
  }
  const visited=new Set<number>()
  const add=(n:AssetNode,depth:number)=>{
    if(depth>30||visited.has(n.id)||needle&&!matching.has(n.id))return
    visited.add(n.id)
    const offspring=children.value.get(n.id)||[]
    result.push({node:n,depth,hasChildren:offspring.length>0})
    if(needle||expanded.value.has(n.id))for(const child of offspring)add(child,depth+1)
  }
  for(const n of children.value.get(0)||[])add(n,0)
  for(const n of nodes.value)if(!visited.has(n.id)&&!needle)add(n,0)
  return result
})
const parents=computed(()=>{
  const trail:AssetNode[]=[];let a:AssetNode|null|undefined=selected.value
  const seen=new Set<number>()
  while(a&&!seen.has(a.id)){seen.add(a.id);trail.unshift(a);a=a.parent_id?index.value.get(a.parent_id):undefined}
  return trail
})
const metrics=computed(()=>({
  objects:nodes.value.filter(n=>!n.parent_id).length,
  assemblies:nodes.value.filter(n=>['aggregate','assembly','component'].includes(n.node_type||'')).length,
  atRisk:risks.value.filter(n=>['critical','high'].includes(n.level)).length,
  incomplete:risks.value.filter(n=>n.data_quality.length>0).length,
}))
const defaults=computed<Record<string,string>>(()=>{
  const fields:Record<string,string>=parentForCreate.value
    ?{category:'equipment',node_type:'aggregate',criticality:'3'}
    :{category:'premises',node_type:'object',criticality:'3'}
  if(parentForCreate.value)fields.parent_id=String(parentForCreate.value)
  return fields
})
function toggle(id:number){
  const next=new Set(expanded.value)
  if(next.has(id))next.delete(id)
  else next.add(id)
  expanded.value=next
}
function openCreate(parent:number|null){parentForCreate.value=parent;drawer.value=true}
async function load(){
  const previous=selectedId.value
  loading.value=true;error.value=''
  try{
    const [assetList,riskReport]=await Promise.all([getAssetTree(),getRisks()])
    nodes.value=assetList;risks.value=riskReport.data
    if(!expanded.value.size)expanded.value=new Set(assetList.map(x=>x.id))
    selectedId.value=assetList.some(x=>x.id===previous)?previous:assetList[0]?.id??null
  }catch(e){error.value=e instanceof Error?e.message:'Не удалось загрузить структуру оборудования'}
  finally{loading.value=false}
}
async function loadDetails(){
  readings.value=[];plans.value=[]
  if(!selectedId.value)return
  const id=selectedId.value
  try{
    const [r,p]=await Promise.all([getReadings(id),listResources('plans',{asset_id:id,per_page:100})])
    if(selectedId.value===id){readings.value=r;plans.value=p.data}
  }catch{/* Reading privileges may differ from asset viewing permissions. */}
}
function onSaved(id:number){
  drawer.value=false;selectedId.value=id;void load()
}
function openMeter(type:'condition_score'|'operating_hours'){
  if(!selected.value)return
  meter.value=type
  meterValue.value=String(type==='condition_score'?selected.value.condition_score??'':selected.value.operating_hours??'')
  meterNote.value='';error.value='';meterDialog.value=true
}
async function submitReading(){
  if(!selected.value||saving.value||preview.enabled)return
  const value=Number(meterValue.value)
  if(!Number.isFinite(value)||value<0||(meter.value==='condition_score'&&(value>100||!Number.isInteger(value)))){
    error.value='Введите допустимое значение показания.';return
  }
  saving.value=true;error.value=''
  try{
    await recordReading(selected.value.id,meter.value,value,meterNote.value)
    meterDialog.value=false
    success.value='Показание сохранено, оценка риска пересчитана.'
    await load()
    await loadDetails()
  }catch(e){error.value=e instanceof Error?e.message:'Не удалось сохранить показание'}
  finally{saving.value=false}
}
watch(selectedId,()=>void loadDetails())
watch(()=>session.session?.active_company_id,()=>{expanded.value=new Set();void load()})
watch(()=>preview.enabled,()=>{expanded.value=new Set();void load()})
onMounted(()=>void load())
</script>

<template>
  <div class="operations-page asset-structure-page">
    <div class="toir-breadcrumb">Активы / Цифровая структура оборудования</div>
    <BasePageHeading title="Цифровая структура оборудования"
      description="Объекты, системы, агрегаты и детали в едином дереве. Регламенты и показания привязаны к конкретному узлу."/>
    <BaseNotice v-if="error" tone="error">{{ error }}</BaseNotice>
    <BaseNotice v-if="success" tone="success">{{ success }}</BaseNotice>
    <div class="operations-metrics">
      <BaseCard><span>Объекты</span><strong>{{ metrics.objects }}</strong><small>Корневые площадки</small></BaseCard>
      <BaseCard><span>Узлы и агрегаты</span><strong>{{ metrics.assemblies }}</strong><small>Иерархия любой глубины</small></BaseCard>
      <BaseCard><span>В зоне внимания</span><strong>{{ metrics.atRisk }}</strong><small>Высокий или критический риск</small></BaseCard>
      <BaseCard><span>Не хватает данных</span><strong>{{ metrics.incomplete }}</strong><small>Показания не заполнены или устарели</small></BaseCard>
    </div>
    <div class="registry-toolbar">
      <BaseSearchField v-model="search" label="Поиск по дереву оборудования"
        placeholder="Найти объект, узел, инвентарный код" />
      <div class="toolbar-actions">
        <BaseButton v-if="editable" @click="openCreate(null)"><Plus :size="16"/> Создать объект</BaseButton>
        <button class="toolbar-icon" type="button" aria-label="Обновить дерево" :disabled="loading" @click="load"><RefreshCcw :size="17"/></button>
      </div>
    </div>
    <div class="operations-two-pane">
      <BaseCard>
        <header class="operations-panel-heading"><h2><Layers3 :size="18"/> Структура объектов</h2>
          <small>{{ nodes.length }} элементов</small></header>
        <div class="asset-tree-scroll">
          <div v-for="entry in visible" :key="entry.node.id"
            class="asset-node-row" :class="{selected:selectedId===entry.node.id}"
            :style="{paddingLeft:(10+entry.depth*19)+'px'}">
            <button v-if="entry.hasChildren" class="asset-tree-toggle" type="button"
              :aria-label="expanded.has(entry.node.id)?'Свернуть состав':'Развернуть состав'"
              @click="toggle(entry.node.id)">
              <ChevronDown v-if="expanded.has(entry.node.id)" :size="16"/><ChevronRight v-else :size="16"/>
            </button>
            <span v-else class="asset-tree-spacer"></span>
            <button type="button" class="asset-node-link" @click="selectedId=entry.node.id">
              <strong>{{ entry.node.name }}</strong>
              <small>{{ entry.node.code }} · {{ typeLabel[entry.node.node_type||'equipment']||'Узел' }}</small>
            </button>
            <span v-if="riskIndex.get(entry.node.id)" class="operations-risk-chip"
              :class="'risk-'+riskIndex.get(entry.node.id)?.level"
              :title="'Индекс риска: '+riskIndex.get(entry.node.id)?.score">
              {{ riskIndex.get(entry.node.id)?.score }}
            </span>
          </div>
          <div v-if="!visible.length&&!loading" class="operations-empty">
            <Boxes :size="32"/>
            <strong>{{ search?'Совпадений нет':'Структура пока пуста' }}</strong>
            <p>{{ search?'Попробуйте другой код или название':'Создайте объект, затем последовательно добавьте системы, агрегаты, узлы и детали.' }}</p>
          </div>
        </div>
      </BaseCard>
      <BaseCard>
        <template v-if="selected">
          <div class="operations-path">{{ parents.map(x=>x.name).join(' / ') }}</div>
          <div class="asset-inspector-head">
            <div><small>{{ selected.code }} · {{ typeLabel[selected.node_type||'equipment'] }}</small>
              <h2>{{ selected.name }}</h2>
              <p>{{ selected.manufacturer||'Производитель не указан' }} {{ selected.model||'' }}</p></div>
            <span v-if="selectedRisk" class="operations-risk-chip" :class="'risk-'+selectedRisk.level">
              {{ levelLabel[selectedRisk.level] }} · {{ selectedRisk.score }}
            </span>
          </div>
          <div class="operations-info-grid">
            <div><span>Критичность</span><strong>{{ selected.criticality||3 }} / 5</strong></div>
            <div><span>Техническое состояние</span><strong>{{ selected.condition_score??'Нет данных' }}<template v-if="selected.condition_score!=null"> / 100</template></strong></div>
            <div><span>Наработка</span><strong>{{ Number(selected.operating_hours||0).toLocaleString('ru-RU') }} ч</strong></div>
            <div><span>Текущих регламентов</span><strong>{{ plans.length }}</strong></div>
          </div>
          <div class="toolbar-actions asset-inspector-actions">
            <BaseButton v-if="editable" @click="openCreate(selected.id)"><Plus :size="16"/> Добавить узел</BaseButton>
            <BaseButton v-if="canReadMeter" variant="secondary" @click="openMeter('operating_hours')">
              <Activity :size="16"/> Моточасы</BaseButton>
            <BaseButton v-if="canReadMeter" variant="secondary" @click="openMeter('condition_score')">
              <Activity :size="16"/> Состояние</BaseButton>
          </div>
          <div v-if="selectedRisk" class="operations-reasons">
            <h3>Факторы риска</h3>
            <p v-for="reason in selectedRisk.reasons" :key="reason">{{ reason }}</p>
            <small v-if="selectedRisk.data_quality.length">Оценка неполная: отсутствуют или устарели измерения.</small>
          </div>
          <div class="operations-linked">
            <h3><ClipboardList :size="16"/> Регламенты узла</h3>
            <div v-for="plan in plans" :key="plan.id" class="operations-linked-row">
              <RouterLink :to="'/plans/'+plan.id">{{ plan.title }}</RouterLink>
              <span>{{ plan.next_due_date }}</span>
            </div>
            <p v-if="!plans.length" class="operations-muted">Регламенты ещё не назначены для этого узла.</p>
            <h3>Последние измерения</h3>
            <div v-for="r in readings.slice(0,5)" :key="r.id" class="operations-linked-row">
              <span>{{ r.meter==='condition_score'?'Состояние':'Моточасы' }} — {{ r.value }}</span>
              <small>{{ new Date(r.recorded_at).toLocaleDateString('ru-RU') }}</small>
            </div>
            <p v-if="!readings.length" class="operations-muted">Показаний пока нет.</p>
          </div>
          <RouterLink class="inspector-open" :to="'/assets/'+selected.id">
            Открыть паспорт узла <ChevronRight :size="16"/>
          </RouterLink>
        </template>
        <div v-else class="operations-empty"><Boxes :size="30"/><p>Выберите объект в структуре слева.</p></div>
      </BaseCard>
    </div>
    <BaseNotice tone="info">Индекс риска — объяснимая оценка приоритетов обслуживания, а не математическая вероятность отказа.</BaseNotice>
    <ToirEditorDrawer :open="drawer" :spec="specs.assets" :defaults="defaults" :preview="preview.enabled"
      @close="drawer=false" @saved="onSaved"/>
    <Teleport to="body">
      <div v-if="meterDialog" class="category-backdrop" @click.self="!saving&&(meterDialog=false)">
        <section class="category-dialog warehouse-dialog" role="dialog" aria-modal="true" aria-label="Записать показание">
          <header class="category-dialog-head"><div class="category-dialog-icon"><Activity :size="19"/></div>
            <button type="button" class="drawer-close" aria-label="Закрыть" @click="meterDialog=false"><X :size="18"/></button></header>
          <h2>{{ meter==='condition_score'?'Оценка состояния узла':'Показание моточасов' }}</h2>
          <p>Показание сохраняется с датой, автором и историей. Последующие значения наработки не могут уменьшаться.</p>
          <form class="warehouse-form" @submit.prevent="submitReading">
            <label>{{ meter==='condition_score'?'Оценка, 0–100':'Наработка, часов' }} *
              <input v-model="meterValue" type="number" :min="0" :max="meter==='condition_score'?100:999999999"
                :step="meter==='condition_score'?1:0.01" required :disabled="saving"/>
            </label>
            <label>Примечание<textarea v-model="meterNote" rows="2" maxlength="255"/></label>
            <div class="category-dialog-footer">
              <BaseButton variant="secondary" @click="meterDialog=false">Отмена</BaseButton>
              <BaseButton type="submit" :disabled="saving||preview.enabled||!meterValue">Сохранить</BaseButton>
            </div>
          </form>
        </section>
      </div>
    </Teleport>
  </div>
</template>

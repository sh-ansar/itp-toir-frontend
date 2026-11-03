<script setup lang="ts">
import BaseSearchField from '../../components/ui/BaseSearchField.vue'
import { computed, onMounted, ref, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { Plus, Search, SlidersHorizontal, Settings2, Trash2, RotateCcw, ArrowDownToLine, AlertCircle } from 'lucide-vue-next'
import BasePageHeading from '../../components/ui/BasePageHeading.vue'
import BaseButton from '../../components/ui/BaseButton.vue'
import BaseNotice from '../../components/ui/BaseNotice.vue'
import ToirRegistryTable from '../../components/toir/ToirRegistryTable.vue'
import ToirEditorDrawer from '../../components/toir/ToirEditorDrawer.vue'
import ToirCategoryDialog from '../../components/toir/ToirCategoryDialog.vue'
import { specs, canEdit } from '../../config/toirModules'
import { listResources, deleteResource } from '../../api/resources'
import { useSessionStore } from '../../stores/session'
import { usePreviewStore } from '../../stores/preview'
import type { ResourceName, ToirRecord, PageMeta } from '../../types/toir'

const props=defineProps<{resource:ResourceName}>()
const session=useSessionStore()
const preview=usePreviewStore()
const router=useRouter()
const route=useRoute()
const spec=computed(()=>specs[props.resource])
const search=ref('')
const tab=ref('all')
const page=ref(1)
const perPage=ref(15)
const meta=ref<PageMeta|null>(null)
const rows=ref<ToirRecord[]>([])
const busy=ref(false)
const error=ref('')
const selected=ref<number[]>([])
const editorOpen=ref(false)
const categoryDialog=ref(false)
const defaults=ref<Record<string,string>>({})
const filtersOpen=ref(false)
const columnsOpen=ref(false)
const selectedColumns=ref<string[]>([])
const editable=computed(()=>canEdit(session.session?.active_role,props.resource))
const shownColumns=computed(()=>spec.value.columns.filter(col=>selectedColumns.value.includes(col.key)))
let sequence=0
let searchTimer:ReturnType<typeof setTimeout>|undefined

async function load(){
  const ticket=++sequence
  busy.value=true;error.value=''
  try {
    const result=await listResources(props.resource,{
      search:search.value.trim(),page:page.value,per_page:perPage.value,
      ...(tab.value!=='all'?props.resource==='assets'?{category:tab.value}:{status:tab.value}:{})
    })
    if(ticket!==sequence)return
    rows.value=result.data
    meta.value=result.meta
    selected.value=[]
  }catch(cause){
    if(ticket!==sequence)return
    rows.value=[];meta.value=null
    error.value=cause instanceof Error?cause.message:'Не удалось загрузить реестр'
  }finally{if(ticket===sequence)busy.value=false}
}
watch(()=>props.resource,()=>{
  page.value=1;tab.value='all';search.value=''
  selectedColumns.value=spec.value.columns.map(c=>c.key)
  void load()
})
watch(()=>session.session?.active_company_id,()=>{page.value=1;void load()})
watch(()=>preview.enabled,()=>{page.value=1;editorOpen.value=false;void load()})
watch([page,perPage,tab],()=>void load())
watch(search,()=>{
  if(searchTimer)clearTimeout(searchTimer)
  page.value=1
  searchTimer=setTimeout(()=>void load(),300)
})
function syncUrlFilters(){
  const next=props.resource==='assets'?route.query.category:route.query.status
  const value=typeof next==='string'?next:'all'
  tab.value=spec.value.tabs?.some(x=>x.key===value)?value:'all'
  search.value=typeof route.query.search==='string'?route.query.search:''
  page.value=1
}
watch(()=>route.fullPath,()=>{syncUrlFilters();void load()})
onMounted(()=>{selectedColumns.value=spec.value.columns.map(c=>c.key);syncUrlFilters();void load()})
function goTo(id:number){void router.push('/'+props.resource+'/'+id)}
function beginCreate(){
  defaults.value={}
  if(props.resource==='assets'){categoryDialog.value=true;return}
  editorOpen.value=true
}
function categorySelected(category:string){
  defaults.value={category}
  categoryDialog.value=false
  editorOpen.value=true
}
function resetFilters(){search.value='';tab.value='all';page.value=1;filtersOpen.value=false;void load()}
function csv(){
  const columns=shownColumns.value
  const escape=(v:unknown)=>'"'+String(v===null||v===undefined?'':v).replaceAll('"','""')+'"'
  const lines=[columns.map(c=>escape(c.label)).join(';')]
  for(const r of rows.value)lines.push(columns.map(c=>escape(c.key==='asset'||c.key==='employee'||c.key==='project'
    ?r[c.key]?.name:r[c.key])).join(';'))
  const data=new Blob(['\ufeff'+lines.join('\r\n')],{type:'text/csv;charset=utf-8'})
  const url=URL.createObjectURL(data)
  const a=document.createElement('a');a.href=url;a.download='toir-'+props.resource+'-page-'+page.value+'.csv';a.click()
  URL.revokeObjectURL(url)
}
async function removeSelected(){
  if(!editable.value||!selected.value.length||busy.value)return
  if(!window.confirm('Удалить '+selected.value.length+' выбранных записей? Действие перенесёт их в архив.'))return
  busy.value=true;error.value=''
  try {
    for(const id of selected.value)await deleteResource(props.resource,id)
    selected.value=[]
    await load()
  }catch(cause){error.value=cause instanceof Error?cause.message:'Не удалось удалить записи';busy.value=false}
}
function saved(id:number){editorOpen.value=false;page.value=1;void load();void router.push('/'+props.resource+'/'+id)}
</script>

<template>
  <div class="toir-registry-page">
    <div class="toir-breadcrumb">{{ spec.breadcrumb }}</div>
    <BasePageHeading :title="spec.title" />
    <BaseNotice v-if="error" tone="error">{{ error }}</BaseNotice>
    <div class="registry-toolbar">
      <div class="toolbar-leading">
        <button class="toir-toolbar-btn" type="button" :aria-expanded="filtersOpen"
          @click="filtersOpen=!filtersOpen"><SlidersHorizontal :size="16" />Поиск и фильтрация</button>
        <div class="column-wrap">
          <button class="toir-toolbar-btn" type="button" :aria-expanded="columnsOpen"
            @click="columnsOpen=!columnsOpen"><Settings2 :size="16" />Настройка колонок</button>
          <div v-if="columnsOpen" class="columns-popover">
            <h3>Показать колонки</h3>
            <label v-for="column in spec.columns" :key="column.key">
              <input type="checkbox" :checked="selectedColumns.includes(column.key)"
                @change="selectedColumns=($event.target as HTMLInputElement).checked
                  ?[...selectedColumns,column.key]:selectedColumns.filter(k=>k!==column.key)" />
              {{ column.label }}
            </label>
            <button type="button" @click="columnsOpen=false">Готово</button>
          </div>
        </div>
      </div>
      <nav v-if="spec.tabs?.length" class="status-tabs" aria-label="Категории записей">
        <button v-for="item in spec.tabs" :key="item.key" type="button"
          :class="{active:tab===item.key}" @click="tab=item.key;page=1">{{ item.label }}</button>
      </nav>
      <div class="toolbar-actions">
        <BaseButton v-if="editable" type="button" @click="beginCreate"><Plus :size="16" />Создать</BaseButton>
        <BaseButton v-if="editable" variant="secondary" type="button"
          :disabled="selected.length===0||busy||preview.enabled" @click="removeSelected"><Trash2 :size="16" />Удалить</BaseButton>
        <button class="toolbar-icon" type="button" title="Экспортировать текущую страницу в CSV"
          aria-label="Экспорт CSV" @click="csv"><ArrowDownToLine :size="19" /></button>
      </div>
    </div>
    <section v-if="filtersOpen" class="filter-strip">
      <BaseSearchField v-model="search" label="Поиск" placeholder="Поиск по реестру" />
      <button class="toir-toolbar-btn" type="button" @click="resetFilters"><RotateCcw :size="16" />Сбросить</button>
      <span class="filter-help"><AlertCircle :size="14" />Поиск выполняется по текущей компании</span>
    </section>
    <ToirRegistryTable :columns="shownColumns" :rows="rows" :meta="meta" :loading="busy"
      :tree-mode="resource==='assets'&&tab==='all'"
      v-model:selected="selected" @open="goTo" @page="page=$event" @page-size="perPage=$event;page=1" />
    <ToirCategoryDialog :open="categoryDialog" @close="categoryDialog=false" @choose="categorySelected" />
    <ToirEditorDrawer :open="editorOpen" :spec="spec" :preview="preview.enabled" :defaults="defaults"
      @close="editorOpen=false" @saved="saved" />
  </div>
</template>

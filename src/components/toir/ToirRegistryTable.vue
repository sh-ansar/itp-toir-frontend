<script setup lang="ts">
import BaseSelect from '../ui/BaseSelect.vue'
import { computed, ref, watch } from 'vue'
import { ChevronUp, ChevronDown, ChevronRight, Inbox } from 'lucide-vue-next'
import BaseStatusPill from '../ui/BaseStatusPill.vue'
import type { PageMeta, ToirRecord } from '../../types/toir'
import { STATUS_LABELS } from '../../config/toirModules'

interface Column { key:string; label:string; width?:number }
const props = withDefaults(defineProps<{
  columns:Column[]
  rows:ToirRecord[]
  meta?:PageMeta|null
  loading?:boolean
  selected?:number[]
  selectable?:boolean
  emptyText?:string
  treeMode?:boolean
}>(),{loading:false,selected:()=>[],selectable:true,emptyText:'Пока нет записей',treeMode:false})
const emit=defineEmits<{
  open:[id:number]
  'update:selected':[ids:number[]]
  page:[page:number]
  pageSize:[size:number]
}>()
const sortKey=ref('')
const sortAsc=ref(true)
const sorted=computed(()=>{
  if(!sortKey.value)return props.rows
  const key=sortKey.value
  return [...props.rows].sort((a,b)=>{
    const x=rawValue(a,key),y=rawValue(b,key)
    return (sortAsc.value?1:-1)*new Intl.Collator('ru',{numeric:true,sensitivity:'base'}).compare(x,y)
  })
})
const expanded=ref<Set<number>>(new Set())
watch(()=>props.rows,rows=>{expanded.value=new Set(rows.map(row=>row.id))},{immediate:true})
const visibleRows=computed(()=>{
  if(!props.treeMode)return sorted.value
  const byId=new Map(sorted.value.map(row=>[row.id,row]))
  const children=new Map<number,ToirRecord[]>()
  const roots:ToirRecord[]=[]
  for(const row of sorted.value){
    const parentId=typeof row.parent_id==='number'?row.parent_id:undefined
    if(parentId!==undefined&&parentId!==row.id&&byId.has(parentId)){
      const group=children.get(parentId)||[]
      group.push(row)
      children.set(parentId,group)
    }else{roots.push(row)}
  }
  const visited=new Set<number>()
  const result:ToirRecord[]=[]
  function add(row:ToirRecord){
    if(visited.has(row.id))return
    visited.add(row.id)
    result.push(row)
    if(expanded.value.has(row.id))for(const child of children.get(row.id)||[])add(child)
  }
  for(const row of roots)add(row)
  // Preserve records even if the current page contains broken parent cycles.
  for(const row of sorted.value)if(!visited.has(row.id)&&!byId.has(Number(row.parent_id)))add(row)
  return result
})
const parentIndex=computed(()=>new Map(props.rows.map(row=>[row.id,row])))
function depth(row:ToirRecord):number{
  if(!props.treeMode)return 0
  let current=row;let count=0
  const seen=new Set<number>([row.id])
  while(typeof current.parent_id==='number'&&parentIndex.value.has(current.parent_id)&&count<5){
    if(seen.has(current.parent_id))break
    seen.add(current.parent_id)
    current=parentIndex.value.get(current.parent_id)!
    count++
  }
  return count*16
}
function hasChildren(id:number):boolean{
  return props.rows.some(row=>row.parent_id===id)
}
function toggleExpanded(id:number){
  const next=new Set(expanded.value)
  if(next.has(id))next.delete(id)
  else next.add(id)
  expanded.value=next
}
const selectedSet=computed(()=>new Set(props.selected))
const allSelected=computed(()=>props.rows.length>0&&props.rows.every(r=>selectedSet.value.has(r.id)))
function rawValue(row:ToirRecord,key:string):string{
  if(key==='asset'||key==='employee'||key==='project')return row[key]?.name?.toString()||'—'
  return row[key]===null||row[key]===undefined?'':String(row[key])
}
function sort(key:string){if(sortKey.value===key)sortAsc.value=!sortAsc.value;else{sortKey.value=key;sortAsc.value=true}}
function toggle(id:number,checked:boolean){
  const values=new Set(props.selected)
  checked?values.add(id):values.delete(id)
  emit('update:selected',Array.from(values))
}
function toggleAll(checked:boolean){
  const next=new Set(props.selected)
  for(const row of props.rows) checked?next.add(row.id):next.delete(row.id)
  emit('update:selected',Array.from(next))
}
function format(row:ToirRecord,key:string){
  const value=rawValue(row,key)
  if(!value)return '—'
  if(key==='priority')return ({'1':'Критический','2':'Высокий','3':'Обычный','4':'Низкий','5':'Минимальный'} as Record<string,string>)[value]||value
  if(['created_at','planned_start','planned_end','next_due_date','start_date','end_date','deadline_at','requested_at'].includes(key)){
    const date=new Date(value)
    return Number.isFinite(date.getTime())?date.toLocaleDateString('ru-RU'):value
  }
  if(['estimated_cost','purchase_value','budget','unit_price'].includes(key)){
    const n=Number(value)
    return Number.isFinite(n)?n.toLocaleString('ru-RU',{maximumFractionDigits:2}):value
  }
  return STATUS_LABELS[value]||value
}
function tone(status:string):'success'|'warning'|'danger'|'info'|'neutral'{
  if(['closed','completed','active','delivered'].includes(status))return 'success'
  if(['overdue','cancelled','retired'].includes(status))return 'danger'
  if(['waiting','planned','paused','requested'].includes(status))return 'warning'
  if(['in_progress','awaiting_acceptance','ordered','published'].includes(status))return 'info'
  return 'neutral'
}
</script>

<template>
  <section class="toir-table-shell" :aria-busy="loading">
    <div class="toir-table-scroll">
      <table class="toir-table">
        <thead>
          <tr>
            <th v-if="selectable" class="check-column">
              <input type="checkbox" aria-label="Выбрать все на странице" :checked="allSelected"
                @change="toggleAll(($event.target as HTMLInputElement).checked)" />
            </th>
            <th v-for="c in columns" :key="c.key" :style="{minWidth: c.width ? c.width+'px':undefined}"
              scope="col">
              <button class="col-sort" type="button" @click="sort(c.key)">
                {{ c.label }}
                <component :is="sortKey===c.key && !sortAsc?ChevronUp:ChevronDown"
                  :size="14" aria-hidden="true" />
              </button>
            </th>
            <th class="row-last"></th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="loading"><td :colspan="columns.length+(selectable?2:1)" class="empty-row">Загрузка данных…</td></tr>
          <tr v-else-if="visibleRows.length===0">
            <td :colspan="columns.length+(selectable?2:1)" class="empty-row">
              <div class="empty-holder"><Inbox :size="26" /><strong>{{ emptyText }}</strong>
                <span>Измените фильтры или создайте новую запись.</span></div>
            </td>
          </tr>
          <tr v-for="row in (loading?[]:visibleRows)" :key="row.id" class="data-row">
            <td v-if="selectable" class="check-column" @click.stop>
              <input type="checkbox" :aria-label="'Выбрать запись '+row.id"
                :checked="selectedSet.has(row.id)" @change="toggle(row.id,($event.target as HTMLInputElement).checked)" />
            </td>
            <td v-for="c in columns" :key="c.key" :title="format(row,c.key)">
              <BaseStatusPill v-if="c.key==='status'" :tone="tone(String(row.status||''))">{{ format(row,c.key) }}</BaseStatusPill>
              <span v-else-if="c.key==='type' && row.type==='emergency'" class="danger-text">{{ format(row,c.key) }}</span>
              <div v-else-if="treeMode&&c.key==='name'" class="tree-cell" :style="{paddingLeft:depth(row)+'px'}">
                <button v-if="hasChildren(row.id)" type="button" class="tree-toggle"
                  :aria-label="expanded.has(row.id)?'Свернуть дочерние активы':'Показать дочерние активы'"
                  :aria-expanded="expanded.has(row.id)" @click.stop="toggleExpanded(row.id)">
                  <ChevronRight :size="15" :class="{open:expanded.has(row.id)}"/>
                </button>
                <span v-else class="tree-spacer" aria-hidden="true"></span>
                <button class="row-link" type="button" @click="emit('open',row.id)">{{ format(row,c.key) }}</button>
              </div>
              <button v-else-if="['name','title','number'].includes(c.key)" class="row-link" type="button"
                @click="emit('open',row.id)">{{ format(row,c.key) }}</button>
              <span v-else class="cell-clip">{{ format(row,c.key) }}</span>
            </td>
            <td><button class="row-arrow" type="button" :aria-label="'Открыть запись '+row.id"
              @click="emit('open',row.id)"><ChevronRight :size="17" aria-hidden="true" /></button></td>
          </tr>
        </tbody>
      </table>
    </div>
    <div v-if="meta" class="registry-pagination">
      <div>Всего {{ meta.total.toLocaleString('ru-RU') }} записей ·
        <BaseSelect :value="meta.per_page" aria-label="Записей на странице"
          @change="emit('pageSize',Number(($event.target as HTMLSelectElement).value))">
          <option :value="15">15 на странице</option><option :value="25">25 на странице</option>
          <option :value="50">50 на странице</option>
        </BaseSelect>
      </div>
      <nav class="page-list" aria-label="Страницы">
        <button type="button" :disabled="meta.current_page<=1" @click="emit('page',meta.current_page-1)">‹</button>
        <button type="button" class="current-page" aria-current="page">{{ meta.current_page }}</button>
        <span>из {{ meta.last_page }}</span>
        <button type="button" :disabled="meta.current_page>=meta.last_page" @click="emit('page',meta.current_page+1)">›</button>
      </nav>
    </div>
  </section>
</template>

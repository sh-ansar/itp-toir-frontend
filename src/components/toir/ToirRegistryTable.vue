<script setup lang="ts">
import { computed,ref,watch } from 'vue'
import { DataTable } from '@itpmining/vue-basic-components'
import { ChevronRight } from 'lucide-vue-next'
import BaseStatusPill from '../ui/BaseStatusPill.vue'
import type { PageMeta,ToirRecord } from '../../types/toir'
import { STATUS_LABELS } from '../../config/toirModules'

interface Column { key:string;label:string;width?:number }
const props=withDefaults(defineProps<{
  columns:Column[];rows:ToirRecord[];meta?:PageMeta|null;loading?:boolean;
  selected?:number[];selectable?:boolean;emptyText?:string;treeMode?:boolean
}>(),{loading:false,selected:()=>[],selectable:true,emptyText:'Пока нет записей',treeMode:false})
const emit=defineEmits<{
  open:[id:number];'update:selected':[ids:number[]];page:[page:number];pageSize:[size:number]
}>()
const sortKey=ref(''),sortAsc=ref(true)
const expanded=ref<Set<number>>(new Set())
watch(()=>props.rows,rows=>{expanded.value=new Set(rows.map(row=>row.id))},{immediate:true})
const tableColumns=computed(()=>[
  ...props.columns.map(c=>({key:c.key,label:c.label,width:c.width?c.width+'px':undefined,sortable:true})),
  {key:'__actions',label:'',width:'48px',sortable:false}
])
function rawValue(row:ToirRecord,key:string):string {
  if(key==='asset'||key==='employee'||key==='project')return row[key]?.name?.toString()||'—'
  return row[key]===null||row[key]===undefined?'':String(row[key])
}
const sorted=computed(()=>{
  if(!sortKey.value)return props.rows
  const key=sortKey.value
  return [...props.rows].sort((a,b)=>(sortAsc.value?1:-1)*
    new Intl.Collator('ru',{numeric:true,sensitivity:'base'}).compare(rawValue(a,key),rawValue(b,key)))
})
const visibleRows=computed(()=>{
  if(!props.treeMode)return sorted.value
  const byId=new Map(sorted.value.map(row=>[row.id,row]))
  const children=new Map<number,ToirRecord[]>(),roots:ToirRecord[]=[]
  for(const row of sorted.value){
    const parent=typeof row.parent_id==='number'?row.parent_id:undefined
    if(parent!==undefined&&parent!==row.id&&byId.has(parent)){
      const branch=children.get(parent)||[]
      branch.push(row);children.set(parent,branch)
    }else roots.push(row)
  }
  const visited=new Set<number>(),result:ToirRecord[]=[]
  function add(row:ToirRecord){
    if(visited.has(row.id))return
    visited.add(row.id);result.push(row)
    if(expanded.value.has(row.id))for(const child of children.get(row.id)||[])add(child)
  }
  for(const row of roots)add(row)
  for(const row of sorted.value)if(!visited.has(row.id)&&!byId.has(Number(row.parent_id)))add(row)
  return result
})
const parentIndex=computed(()=>new Map(props.rows.map(row=>[row.id,row])))
function depth(row:ToirRecord):number {
  if(!props.treeMode)return 0
  let current=row,count=0
  const seen=new Set<number>([row.id])
  while(typeof current.parent_id==='number'&&parentIndex.value.has(current.parent_id)&&count<5){
    if(seen.has(current.parent_id))break
    seen.add(current.parent_id)
    current=parentIndex.value.get(current.parent_id)!
    count++
  }
  return count*16
}
function hasChildren(id:number){return props.rows.some(row=>row.parent_id===id)}
function toggleExpanded(id:number){
  const next=new Set(expanded.value)
  if(next.has(id))next.delete(id);else next.add(id)
  expanded.value=next
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
function sort(payload:{key:string;direction:string}){
  sortKey.value=payload.key;sortAsc.value=payload.direction!=='desc'
}
</script>
<template>
  <section class="toir-table-shell" :aria-busy="loading">
    <DataTable :columns="tableColumns" :rows="visibleRows" row-key="id" variant="auto"
      processing="server" :loading="loading" :selected="selected" :selectable="selectable"
      :empty-text="emptyText" :sort-key="sortKey" :sort-direction="sortAsc?'asc':'desc'"
      :total="meta?.total??null" :paginated="!!meta" :page="meta?.current_page??1"
      :page-size="meta?.per_page??15" :page-size-options="[15,25,50]"
      :show-page-size="!!meta" :show-filter-chips="false"
      @sort="sort" @update:selected="emit('update:selected',$event as number[])"
      @update:page="emit('page',$event)" @update:page-size="emit('pageSize',$event)">
      <template v-for="c in columns" :key="c.key" #[`cell-${c.key}`]="{row}">
        <BaseStatusPill v-if="c.key==='status'" :tone="tone(String(row.status||''))">{{format(row,c.key)}}</BaseStatusPill>
        <span v-else-if="c.key==='type'&&row.type==='emergency'" class="danger-text">{{format(row,c.key)}}</span>
        <div v-else-if="treeMode&&c.key==='name'" class="tree-cell" :style="{paddingLeft:depth(row)+'px'}">
          <button v-if="hasChildren(row.id)" class="tree-toggle" type="button"
            :aria-label="expanded.has(row.id)?'Свернуть дочерние активы':'Показать дочерние активы'"
            :aria-expanded="expanded.has(row.id)" @click.stop="toggleExpanded(row.id)">
            <ChevronRight :size="15" :class="{open:expanded.has(row.id)}"/>
          </button>
          <span v-else class="tree-spacer" aria-hidden="true"></span>
          <button class="row-link" type="button" @click="emit('open',row.id)">{{format(row,c.key)}}</button>
        </div>
        <button v-else-if="['name','title','number'].includes(c.key)" class="row-link"
          type="button" @click="emit('open',row.id)">{{format(row,c.key)}}</button>
        <span v-else class="cell-clip" :title="format(row,c.key)">{{format(row,c.key)}}</span>
      </template>
      <template #cell-__actions="{row}">
        <button class="row-arrow" type="button" :aria-label="'Открыть запись '+row.id"
          @click="emit('open',row.id)"><ChevronRight :size="17" aria-hidden="true"/></button>
      </template>
    </DataTable>
  </section>
</template>

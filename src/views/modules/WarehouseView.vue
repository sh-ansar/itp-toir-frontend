<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { Package, Plus, Search, RefreshCcw, ArrowDownToLine, History, X, AlertTriangle, Pencil } from 'lucide-vue-next'
import BasePageHeading from '../../components/ui/BasePageHeading.vue'
import BaseButton from '../../components/ui/BaseButton.vue'
import BaseNotice from '../../components/ui/BaseNotice.vue'
import BaseCard from '../../components/ui/BaseCard.vue'
import ToirRegistryTable from '../../components/toir/ToirRegistryTable.vue'
import { getStock, getStockMovements, createStockItem, updateStockItem, receiveStock, type StockItem, type StockMovement } from '../../api/stock'
import { useSessionStore } from '../../stores/session'
import { usePreviewStore } from '../../stores/preview'
import type { PageMeta } from '../../types/toir'

const session=useSessionStore()
const preview=usePreviewStore()
const canManage=computed(()=>['owner','admin','manager'].includes(session.session?.active_role||''))
const items=ref<StockItem[]>([])
const meta=ref<PageMeta|null>(null)
const busy=ref(false),saving=ref(false),error=ref(''),notice=ref('')
const search=ref(''),lowOnly=ref(false),page=ref(1),perPage=ref(20)
const selected=ref<StockItem|null>(null)
const movementRows=ref<StockMovement[]>([])
const viewBusy=ref(false)
const modal=ref<'create'|'edit'|'receive'|null>(null)
const form=ref({sku:'',name:'',unit:'шт.',unit_cost:'0.00',minimum_quantity:'0.000',quantity:'1.000',note:''})
const columns=[
  {key:'sku',label:'Артикул',width:150},{key:'name',label:'Номенклатура',width:290},
  {key:'quantity_on_hand',label:'В наличии',width:120},{key:'quantity_reserved',label:'Резерв',width:110},
  {key:'available_quantity',label:'Доступно',width:120},{key:'unit',label:'Ед.',width:76},
  {key:'unit_cost',label:'Цена за ед.',width:140},{key:'minimum_quantity',label:'Мин. остаток',width:130},
]
const total=computed(()=>meta.value?.total||0)
const available=computed(()=>items.value.filter(item=>Number(item.available_quantity||0)>0).length)
const low=computed(()=>items.value.filter(item=>Number(item.available_quantity||0)<=Number(item.minimum_quantity)).length)
const value=computed(()=>items.value.reduce((acc,item)=>acc+Number(item.quantity_on_hand)*Number(item.unit_cost),0))
let request=0,searchTimer:ReturnType<typeof setTimeout>|undefined
async function load(){
  const ticket=++request
  busy.value=true;error.value=''
  try{
    const data=await getStock({search:search.value.trim(),low_stock:lowOnly.value,page:page.value,per_page:perPage.value})
    if(ticket!==request)return
    items.value=data.data;meta.value=data.meta
  }catch(e){if(ticket===request)error.value=e instanceof Error?e.message:'Не удалось загрузить склад'}
  finally{if(ticket===request)busy.value=false}
}
watch(search,()=>{if(searchTimer)clearTimeout(searchTimer);page.value=1;searchTimer=setTimeout(()=>void load(),300)})
watch([lowOnly,page,perPage],()=>void load())
watch(()=>session.session?.active_company_id,()=>{selected.value=null;page.value=1;void load()})
watch(()=>preview.enabled,()=>{selected.value=null;page.value=1;void load()})
onMounted(()=>void load())
async function showItem(id:number){
  selected.value=items.value.find(row=>row.id===id)||null
  if(!selected.value)return
  movementRows.value=[]
  viewBusy.value=true
  try{movementRows.value=(await getStockMovements(id)).data}
  catch(e){error.value=e instanceof Error?e.message:'Не удалось загрузить журнал'}
  finally{viewBusy.value=false}
}
function startCreate(){form.value={sku:'',name:'',unit:'шт.',unit_cost:'0.00',minimum_quantity:'0.000',quantity:'1.000',note:''};modal.value='create'}
function startEdit(){
  if(!selected.value)return
  form.value={sku:selected.value.sku,name:selected.value.name,unit:selected.value.unit,
    unit_cost:String(selected.value.unit_cost),minimum_quantity:String(selected.value.minimum_quantity),
    quantity:'1.000',note:''};modal.value='edit'
}
function startReceipt(){
  form.value={...form.value,quantity:'1.000',note:''}
  modal.value='receive'
}
async function save(){
  if(saving.value||preview.enabled)return
  saving.value=true;error.value='';notice.value=''
  try{
    if(modal.value==='create'){
      await createStockItem({sku:form.value.sku,name:form.value.name,unit:form.value.unit,
        unit_cost:form.value.unit_cost,minimum_quantity:form.value.minimum_quantity})
      notice.value='Позиция добавлена в справочник. Остаток пока нулевой.'
    }else if(modal.value==='edit'&&selected.value){
      await updateStockItem(selected.value.id,{sku:form.value.sku,name:form.value.name,unit:form.value.unit,
        unit_cost:form.value.unit_cost,minimum_quantity:form.value.minimum_quantity})
      notice.value='Параметры номенклатуры обновлены.'
    }else if(modal.value==='receive'&&selected.value){
      await receiveStock(selected.value.id,form.value.quantity,form.value.note)
      notice.value='Приход проведён и записан в журнал.'
    }
    modal.value=null
    const id=selected.value?.id
    await load()
    if(id)await showItem(id)
  }catch(e){error.value=e instanceof Error?e.message:'Не удалось сохранить операцию'}
  finally{saving.value=false}
}
function money(n:number){return n.toLocaleString('ru-RU',{maximumFractionDigits:2,minimumFractionDigits:2})}
function csv(){
  const cols=columns
  const q=(x:unknown)=>'"'+String(x??'').replaceAll('"','""')+'"'
  const lines=[cols.map(c=>q(c.label)).join(';'),...items.value.map(item=>cols.map(c=>q(item[c.key])).join(';'))]
  const url=URL.createObjectURL(new Blob(['\ufeff'+lines.join('\r\n')],{type:'text/csv;charset=utf-8'}))
  const a=document.createElement('a');a.href=url;a.download='toir-stock-page.csv';a.click();URL.revokeObjectURL(url)
}
const actionLabel:Record<string,string>={receipt:'Приход',reserve:'Резерв',release:'Снятие резерва',consume:'Списание'}
</script>

<template>
  <div class="toir-registry-page warehouse-page">
    <div class="toir-breadcrumb">Поставки / Склад и остатки</div>
    <BasePageHeading title="Склад и остатки" description="Номенклатура, доступное количество и журнал фактических движений." />
    <BaseNotice v-if="error" tone="error">{{ error }}</BaseNotice>
    <BaseNotice v-if="notice" tone="success">{{ notice }}</BaseNotice>
    <div class="warehouse-kpis">
      <BaseCard><span>Номенклатура</span><strong>{{ total }}</strong><small>Позиций в реестре</small></BaseCard>
      <BaseCard><span>Есть в наличии</span><strong>{{ available }}</strong><small>Позиций с доступным остатком на текущей странице</small></BaseCard>
      <BaseCard><span>Ниже минимума</span><strong>{{ low }}</strong><small>Позиций на текущей странице</small></BaseCard>
      <BaseCard><span>Стоимость остатков</span><strong>{{ money(value) }}</strong><small>По учётным ценам, текущая страница</small></BaseCard>
    </div>
    <div class="registry-toolbar">
      <div class="toolbar-leading">
        <label class="warehouse-search"><Search :size="16"/><input v-model="search" type="search" aria-label="Поиск по складу"
          placeholder="Поиск по артикулу или названию"/></label>
        <label class="planning-orders-toggle"><input v-model="lowOnly" type="checkbox"/>Ниже минимального остатка</label>
      </div>
      <div class="toolbar-actions">
        <BaseButton v-if="canManage" type="button" @click="startCreate"><Plus :size="16"/>Новая позиция</BaseButton>
        <button type="button" class="toolbar-icon" aria-label="Экспорт текущей страницы" @click="csv"><ArrowDownToLine :size="17"/></button>
        <button type="button" class="toolbar-icon" aria-label="Обновить склад" :disabled="busy" @click="load"><RefreshCcw :size="17"/></button>
      </div>
    </div>
    <ToirRegistryTable :rows="items" :columns="columns" :meta="meta" :loading="busy" :selectable="false"
      empty-text="Пока нет номенклатуры. Создайте позицию и оформите приход."
      @open="showItem" @page="page=$event" @page-size="perPage=$event;page=1" />
    <BaseCard v-if="selected" >
      <div class="warehouse-detail-head">
        <div><h2>{{ selected.name }}</h2><p>{{ selected.sku }} · {{ selected.unit }}</p></div>
        <div class="toolbar-actions">
          <BaseButton v-if="canManage" variant="secondary" type="button" @click="startEdit"><Pencil :size="16"/>Изменить</BaseButton>
          <BaseButton v-if="canManage" type="button" @click="startReceipt"><Plus :size="16"/>Оформить приход</BaseButton>
          <button type="button" class="toolbar-icon" aria-label="Закрыть карточку склада" @click="selected=null"><X :size="16"/></button>
        </div>
      </div>
      <div class="warehouse-balance">
        <span>В наличии: <strong>{{ selected.quantity_on_hand }} {{ selected.unit }}</strong></span>
        <span>Резерв: <strong>{{ selected.quantity_reserved }}</strong></span>
        <span>Доступно: <strong>{{ selected.available_quantity }}</strong></span>
      </div>
      <h3><History :size="17"/> Журнал движений</h3>
      <p v-if="preview.enabled" class="muted">Демонстрационные остатки. Настоящий журнал появляется после складских операций.</p>
      <p v-if="viewBusy" class="muted">Загрузка журнала…</p>
      <div v-else class="toir-table-scroll">
        <table class="toir-table warehouse-history-table">
          <thead><tr><th>Дата</th><th>Операция</th><th>Количество</th><th>Наряд</th><th>Комментарий</th></tr></thead>
          <tbody>
            <tr v-for="m in movementRows" :key="m.id"><td>{{ new Date(m.created_at).toLocaleString('ru-RU') }}</td>
              <td>{{ actionLabel[m.action]||m.action }}</td><td>{{ m.quantity }}</td>
              <td><RouterLink v-if="m.work_order_id" class="detail-link" :to="'/work-orders/'+m.work_order_id">Наряд #{{ m.work_order_id }}</RouterLink><span v-else>—</span></td>
              <td>{{ m.note||'—' }}</td></tr>
            <tr v-if="!movementRows.length"><td colspan="5" class="empty-row">Движений пока нет.</td></tr>
          </tbody>
        </table>
      </div>
    </BaseCard>
    <Teleport to="body">
      <div v-if="modal" class="category-backdrop" @click.self="!saving&&(modal=null)">
        <section class="category-dialog warehouse-dialog" role="dialog" aria-modal="true"
          :aria-label="modal==='create'?'Новая позиция':modal==='edit'?'Редактировать позицию':'Оформить приход'">
          <header class="category-dialog-head"><div class="category-dialog-icon"><Package :size="19"/></div>
            <button class="drawer-close" type="button" aria-label="Закрыть" :disabled="saving" @click="modal=null"><X :size="17"/></button></header>
          <h2>{{ modal==='create'?'Новая позиция':modal==='edit'?'Редактирование':'Приход на склад' }}</h2>
          <BaseNotice v-if="preview.enabled" tone="warning">Просмотр макета. Сохранение недоступно.</BaseNotice>
          <form class="warehouse-form" @submit.prevent="save">
            <template v-if="modal!=='receive'">
              <label>Артикул *<input v-model.trim="form.sku" required maxlength="80" :disabled="saving"/></label>
              <label>Наименование *<input v-model.trim="form.name" required maxlength="255" :disabled="saving"/></label>
              <label>Единица измерения *<input v-model.trim="form.unit" required maxlength="24" :disabled="saving"/></label>
              <label>Учетная цена *<input v-model="form.unit_cost" type="number" min="0" step="0.01" required :disabled="saving"/></label>
              <label>Минимальный остаток<input v-model="form.minimum_quantity" type="number" min="0" step="0.001" :disabled="saving"/></label>
            </template>
            <template v-else>
              <p>{{ selected?.name }}</p>
              <label>Количество к поступлению *<input v-model="form.quantity" type="number" min="0.001" step="0.001" required :disabled="saving"/></label>
              <label>Основание / комментарий<textarea v-model="form.note" maxlength="500" rows="3" :disabled="saving"></textarea></label>
            </template>
            <div class="category-dialog-footer">
              <BaseButton type="button" variant="secondary" :disabled="saving" @click="modal=null">Отмена</BaseButton>
              <BaseButton type="submit" :disabled="saving||preview.enabled">{{ saving?'Сохранение…':modal==='receive'?'Провести приход':'Сохранить' }}</BaseButton>
            </div>
          </form>
        </section>
      </div>
    </Teleport>
  </div>
</template>

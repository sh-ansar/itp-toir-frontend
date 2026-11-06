<script setup lang="ts">
import BaseSelect from '../ui/BaseSelect.vue'
import { computed, onMounted, ref, watch } from 'vue'
import { Package, Plus, RefreshCcw, X } from 'lucide-vue-next'
import BaseButton from '../ui/BaseButton.vue'
import BaseNotice from '../ui/BaseNotice.vue'
import { getStock, getOrderMaterials, operateMaterial,
  type StockItem, type OrderMaterial } from '../../api/stock'

const props=defineProps<{orderId:number;status:string;canOperate:boolean}>()
const emit=defineEmits<{changed:[]}>()
const busy=ref(false),saving=ref(false),error=ref(''),success=ref('')
const lines=ref<OrderMaterial[]>([])
const items=ref<StockItem[]>([])
const cost=ref('0.00')
const modal=ref<'reserve'|'consume'|'release'|null>(null)
const selectedItem=ref('')
const quantity=ref('1.000')
const options=computed(()=>{
  if(modal.value==='release')return lines.value.filter(x=>Number(x.quantity_reserved)>0).map(x=>x.item)
  if(modal.value==='consume')return items.value
  return items.value.filter(x=>Number(x.available_quantity)>0)
})
const writable=computed(()=>props.canOperate&&['waiting','overdue','in_progress'].includes(props.status))
const operationLabels={reserve:'Зарезервировать',consume:'Списать на наряд',release:'Снять резерв'}
let counter=0
async function load(){
  const token=++counter
  busy.value=true;error.value=''
  try{
    const [m,s]=await Promise.all([getOrderMaterials(props.orderId),getStock({per_page:100})])
    if(token!==counter)return
    lines.value=m.data;cost.value=m.actual_material_cost
    items.value=s.data
  }catch(e){if(token===counter)error.value=e instanceof Error?e.message:'Не удалось загрузить материалы'}
  finally{if(token===counter)busy.value=false}
}
watch(()=>[props.orderId],()=>void load())
onMounted(()=>void load())
function open(action:'reserve'|'consume'|'release'){
  error.value='';selectedItem.value='';quantity.value='1.000';modal.value=action
}
async function submit(){
  if(!modal.value||!selectedItem.value||saving.value||!writable.value)return
  saving.value=true;error.value='';success.value=''
  try{
    await operateMaterial(props.orderId,Number(selectedItem.value),modal.value,quantity.value)
    success.value='Операция проведена и записана в историю наряда.'
    modal.value=null
    await load()
    emit('changed')
  }catch(e){error.value=e instanceof Error?e.message:'Не удалось провести операцию'}
  finally{saving.value=false}
}
</script>

<template>
  <section class="order-materials">
    <div class="warehouse-detail-head">
      <div><h2><Package :size="18"/> Материалы и запчасти наряда</h2>
        <p>Резервирование, фактическое списание и стоимость по учётной цене на момент операции.</p></div>
      <div class="toolbar-actions">
        <BaseButton v-if="canOperate&&['waiting','overdue','in_progress'].includes(status)"
          variant="secondary" type="button" @click="open('reserve')"><Plus :size="16"/>Резерв</BaseButton>
        <BaseButton v-if="canOperate&&status==='in_progress'"
          type="button" @click="open('consume')">Списать</BaseButton>
        <BaseButton v-if="canOperate&&['waiting','overdue','in_progress'].includes(status)"
          variant="secondary" type="button" @click="open('release')">Снять резерв</BaseButton>
        <button type="button" class="toolbar-icon" aria-label="Обновить материалы" :disabled="busy" @click="load"><RefreshCcw :size="17"/></button>
      </div>
    </div>
    <BaseNotice v-if="error" tone="error">{{ error }}</BaseNotice>
    <BaseNotice v-if="success" tone="success">{{ success }}</BaseNotice>
    <p v-if="busy" class="muted">Загрузка материалов…</p>
    <div v-else class="toir-table-scroll">
      <table class="toir-table warehouse-history-table">
        <thead><tr><th>Артикул</th><th>Номенклатура</th><th>Зарезервировано</th>
          <th>Израсходовано</th><th>Стоимость</th></tr></thead>
        <tbody>
          <tr v-for="line in lines" :key="line.id">
            <td>{{ line.item.sku }}</td><td>{{ line.item.name }}</td>
            <td>{{ line.quantity_reserved }} {{ line.item.unit }}</td>
            <td>{{ line.quantity_used }} {{ line.item.unit }}</td>
            <td>{{ line.actual_cost }}</td>
          </tr>
          <tr v-if="!lines.length"><td colspan="5" class="empty-row">Материалы не прикреплены. Добавьте резерв или спишите материалы на наряд.</td></tr>
        </tbody>
      </table>
    </div>
    <div class="order-cost-line"><span>Фактическая стоимость материалов</span><strong>{{ cost }}</strong></div>
    <BaseNotice v-if="status==='in_progress'&&lines.some(l=>Number(l.quantity_reserved)>0)" tone="warning">
      Перед закрытием наряда необходимо списать или снять весь оставшийся резерв.
    </BaseNotice>
    <Teleport to="body">
      <div v-if="modal" class="category-backdrop" @click.self="!saving&&(modal=null)">
        <section class="category-dialog warehouse-dialog" role="dialog" aria-modal="true" :aria-label="operationLabels[modal]">
          <header class="category-dialog-head"><div class="category-dialog-icon"><Package :size="19"/></div>
            <button class="drawer-close" type="button" aria-label="Закрыть" :disabled="saving" @click="modal=null"><X :size="18"/></button></header>
          <h2>{{ operationLabels[modal] }}</h2>
          <p>{{ modal==='reserve'?'Резерв удерживает доступное количество до списания или освобождения.':
            modal==='consume'?'Списание уменьшает складской остаток и фиксирует стоимость ремонта.':
            'Снятие резерва возвращает материалы в доступный остаток.' }}</p>
          <BaseNotice v-if="error" tone="error">{{ error }}</BaseNotice>
          <form class="warehouse-form" @submit.prevent="submit">
            <label>Номенклатура *
              <BaseSelect v-model="selectedItem" required :disabled="saving">
                <option value="" disabled>Выберите позицию</option>
                <option v-for="item in options" :key="item.id" :value="String(item.id)">
                  {{ item.sku }} — {{ item.name }} (доступно {{ item.available_quantity||item.quantity_on_hand }} {{ item.unit }})
                </option>
              </BaseSelect>
            </label>
            <label>Количество *<input v-model="quantity" type="number" min="0.001" step="0.001" required :disabled="saving"/></label>
            <div class="category-dialog-footer">
              <BaseButton type="button" variant="secondary" :disabled="saving" @click="modal=null">Отмена</BaseButton>
              <BaseButton type="submit" :disabled="saving||!writable||!selectedItem||Number(quantity)<=0">
                {{ saving?'Проведение…':'Подтвердить' }}</BaseButton>
            </div>
          </form>
        </section>
      </div>
    </Teleport>
  </section>
</template>

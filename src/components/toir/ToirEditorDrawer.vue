<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import { X, Save } from 'lucide-vue-next'
import BaseButton from '../ui/BaseButton.vue'
import BaseNotice from '../ui/BaseNotice.vue'
import BaseFormField from '../ui/BaseFormField.vue'
import type { ModuleSpec } from '../../config/toirModules'
import type { ResourceName, ToirRecord } from '../../types/toir'
import { createResource, updateResource, listResources } from '../../api/resources'

const props=defineProps<{open:boolean;spec:ModuleSpec;record?:ToirRecord|null;preview?:boolean;defaults?:Record<string,string>}>()
const emit=defineEmits<{close:[];saved:[id:number]}>()
const form=reactive<Record<string,string>>({})
const reference=ref<Record<string,ToirRecord[]>>({})
const busy=ref(false)
const error=ref('')
const ready=computed(()=>props.open&&!busy.value)
const isEdit=computed(()=>!!props.record?.id)
const numeric=new Set(['asset_id','employee_id','parent_id','project_id','periodicity_days','purchase_value','estimated_cost','quantity','unit_price','budget'])
const linked:Record<string,ResourceName>={asset:'assets',parent:'assets',employee:'employees',project:'projects'}

watch(()=>[props.open,props.record?.id,props.spec.resource],async ()=>{
  if(!props.open)return
  error.value=''
  for(const f of props.spec.fields){
    const value=props.record?.[f.key] ?? props.defaults?.[f.key]
    form[f.key]=value===null||value===undefined?'':String(value).replace(' ','T').slice(0,f.type==='datetime-local'?16:undefined)
  }
  const needed=[...new Set(props.spec.fields.map(f=>linked[f.type||'']).filter(Boolean))]
  for(const resource of needed){
    try { const data=await listResources(resource,{per_page:100});reference.value[resource]=data.data }
    catch { reference.value[resource]=[] }
  }
},{immediate:true})

function optionsFor(field:string){
  const resource=linked[field]
  return (reference.value[resource]||[]).filter(r=>
    !(props.spec.resource==='assets' && resource==='assets' && r.id===props.record?.id)
  )
}
function convert(){
  const result:Record<string,unknown>={}
  for(const f of props.spec.fields){
    const value=(form[f.key]||'').trim()
    if(!value){if(isEdit.value)result[f.key]=null;continue}
    result[f.key]=numeric.has(f.key)?Number(value):value
  }
  return result
}
async function submit(){
  if(busy.value||props.preview)return
  busy.value=true
  error.value=''
  try{
    const payload=convert()
    const row=isEdit.value&&props.record
      ?await updateResource(props.spec.resource,props.record.id,payload)
      :await createResource(props.spec.resource,payload)
    emit('saved',row.id)
  }catch(cause){error.value=cause instanceof Error?cause.message:'Не удалось сохранить данные.'}
  finally{busy.value=false}
}
</script>

<template>
  <Teleport to="body">
    <div v-if="open" class="editor-backdrop" @click.self="emit('close')">
      <aside class="editor-drawer" role="dialog" aria-modal="true" :aria-label="isEdit?'Редактировать '+spec.singular:'Создать '+spec.singular">
        <header class="editor-head">
          <div><small>{{ spec.breadcrumb }}</small><h2>{{ isEdit?'Редактировать':'Создать' }} {{ spec.singular.toLowerCase() }}</h2></div>
          <button class="drawer-close" type="button" aria-label="Закрыть" @click="emit('close')"><X :size="21" /></button>
        </header>
        <form id="toir-editor" class="editor-body" @submit.prevent="submit">
          <BaseNotice v-if="preview" tone="info">Предпросмотр формы. Сохранение в демонстрационном режиме отключено.</BaseNotice>
          <BaseNotice v-if="error" tone="error">{{ error }}</BaseNotice>
          <template v-for="field in spec.fields" :key="field.key">
            <div v-if="field.type==='select'||field.type==='asset'||field.type==='employee'||field.type==='project'||field.type==='parent'"
              class="editor-control">
              <label :for="'edit-'+field.key">{{ field.label }}<span v-if="field.required"> *</span></label>
              <select :id="'edit-'+field.key" v-model="form[field.key]" :required="field.required" :disabled="busy">
                <option value="">{{ field.required?'Выберите':'Не задано' }}</option>
                <template v-if="field.type==='select'">
                  <option v-for="o in field.options" :key="o.value" :value="o.value">{{ o.label }}</option>
                </template>
                <template v-else>
                  <option v-for="o in optionsFor(field.type||'')" :key="o.id" :value="String(o.id)">
                    {{ o.name || o.title }} {{ o.code?'('+o.code+')':'' }}
                  </option>
                </template>
              </select>
            </div>
            <div v-else-if="field.type==='datetime-local'" class="editor-control">
              <label :for="'edit-'+field.key">{{ field.label }}</label>
              <input :id="'edit-'+field.key" v-model="form[field.key]" type="datetime-local" :disabled="busy" />
            </div>
            <div v-else-if="field.type==='textarea'" class="editor-control">
              <label :for="'edit-'+field.key">{{ field.label }}</label>
              <textarea :id="'edit-'+field.key" v-model="form[field.key]" rows="5" :disabled="busy"></textarea>
            </div>
            <BaseFormField v-else v-model="form[field.key]" :label="field.label"
              :type="field.type==='date'||field.type==='number'||field.type==='email'?field.type:'text'"
              :required="field.required" :disabled="busy" />
          </template>
        </form>
        <footer class="editor-footer">
          <BaseButton variant="secondary" type="button" :disabled="busy" @click="emit('close')">Отмена</BaseButton>
          <BaseButton type="submit" :disabled="!ready||preview" @click="submit">
            <Save :size="17" />{{ busy?'Сохранение…':'Сохранить' }}
          </BaseButton>
        </footer>
      </aside>
    </div>
  </Teleport>
</template>

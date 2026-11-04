<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { ClipboardCheck, Plus, Pencil, Trash2, CheckCircle2, Circle, AlertTriangle,
  Activity, RotateCcw, X, ShieldCheck } from 'lucide-vue-next'
import BaseButton from '../ui/BaseButton.vue'
import BaseNotice from '../ui/BaseNotice.vue'
import { createPlanStep, deletePlanStep, getOrderSteps, getPlanSteps, recordWorkStep,
  updatePlanStep, type TemplateStep, type WorkStep, type StepKind,
  type StepDefinition, type StepStatus } from '../../api/checklist'
import { usePreviewStore } from '../../stores/preview'
import { useSessionStore } from '../../stores/session'

const props=defineProps<{
  entity:'plans'|'work-orders'
  id:number
  status:string
  canManage:boolean
}>()
const emit=defineEmits<{changed:[]}>()
const preview=usePreviewStore(),session=useSessionStore()
const steps=ref<Array<TemplateStep|WorkStep>>([])
const loading=ref(false),saving=ref(false),error=ref(''),message=ref('')
const editorOpen=ref(false),editId=ref<number|null>(null)
const def=ref<StepDefinition>({
  title:'',kind:'inspection',is_required:true,instructions:null,unit:null,
})
const editStepId=ref<number|null>(null),resultStatus=ref<StepStatus>('done')
const numericValue=ref(''),resultComment=ref('')
const isPlan=computed(()=>props.entity==='plans')
const canEditTemplate=computed(()=>isPlan.value&&props.canManage&&
  props.status!=='completed'&&!preview.enabled)
const canExecute=computed(()=>!isPlan.value&&props.canManage&&
  props.status==='in_progress'&&!preview.enabled)
const requiredCount=computed(()=>steps.value.filter(s=>s.is_required).length)
const completedRequired=computed(()=>steps.value.filter(s=>s.is_required&&'status' in s&&s.status==='done').length)
const doneCount=computed(()=>steps.value.filter(s=>'status' in s&&s.status==='done').length)
const progress=computed(()=>requiredCount.value?Math.round(100*completedRequired.value/requiredCount.value):100)
const kindNames:Record<StepKind,string>={
  inspection:'Осмотр',service:'Обслуживание',safety:'Безопасность',measurement:'Измерение',
}
const statusNames:Record<StepStatus,string>={pending:'Не выполнено',done:'Выполнено',skipped:'Пропущено'}
function work(s:TemplateStep|WorkStep):WorkStep|null {
  return 'status' in s?s as WorkStep:null
}
async function load(){
  loading.value=true;error.value=''
  try{
    const loaded=isPlan.value?await getPlanSteps(props.id):await getOrderSteps(props.id)
    steps.value=loaded
  }catch(e){error.value=e instanceof Error?e.message:'Не удалось загрузить чек-лист'}
  finally{loading.value=false}
}
function openEditor(s?:TemplateStep|WorkStep){
  if(!canEditTemplate.value)return
  editId.value=s?.id??null
  def.value=s?{
    title:s.title,kind:s.kind,is_required:s.is_required,
    instructions:s.instructions,unit:s.unit,
  }:{title:'',kind:'inspection',is_required:true,instructions:null,unit:null}
  editorOpen.value=true;editStepId.value=null;error.value='';message.value=''
}
async function saveTemplate(){
  if(!canEditTemplate.value||saving.value)return
  if(def.value.title.trim().length<3){error.value='Название должно содержать минимум 3 символа.';return}
  const data={...def.value,title:def.value.title.trim(),
    unit:def.value.kind==='measurement'?(def.value.unit?.trim()||null):null,
    instructions:def.value.instructions?.trim()||null}
  saving.value=true;error.value=''
  try{
    if(editId.value)await updatePlanStep(props.id,editId.value,data)
    else await createPlanStep(props.id,data)
    editorOpen.value=false
    message.value='Шаблон сохранён. Ранее выпущенные наряды не изменились.'
    await load()
    emit('changed')
  }catch(e){error.value=e instanceof Error?e.message:'Не удалось сохранить операцию'}
  finally{saving.value=false}
}
async function deleteTemplate(s:TemplateStep|WorkStep){
  if(!canEditTemplate.value||saving.value)return
  if(!window.confirm('Удалить операцию из шаблона будущих нарядов? Ранее созданные записи останутся.'))return
  saving.value=true;error.value=''
  try{
    await deletePlanStep(props.id,s.id)
    message.value='Операция удалена из шаблона.'
    await load();emit('changed')
  }catch(e){error.value=e instanceof Error?e.message:'Не удалось удалить операцию'}
  finally{saving.value=false}
}
function beginResult(s:TemplateStep|WorkStep,status:StepStatus){
  if(!canExecute.value)return
  editStepId.value=s.id;editorOpen.value=false
  resultStatus.value=status
  const active=work(s)
  numericValue.value=active?.numeric_value??''
  resultComment.value=active?.comment??''
  error.value='';message.value=''
}
function closeForms(){editStepId.value=null;editorOpen.value=false;error.value=''}
async function submitResult(s:TemplateStep|WorkStep){
  if(!canExecute.value||saving.value||editStepId.value!==s.id)return
  if(resultStatus.value==='skipped'&&s.is_required){
    error.value='Обязательную операцию нельзя пропустить.';return
  }
  if(resultStatus.value==='skipped'&&resultComment.value.trim().length<3){
    error.value='Укажите причину пропуска операции.';return
  }
  if(resultStatus.value==='done'&&s.kind==='measurement'&&
    (!numericValue.value.trim()||!Number.isFinite(Number(numericValue.value)))){
    error.value='Для измерения требуется числовой результат.';return
  }
  saving.value=true;error.value=''
  try{
    await recordWorkStep(props.id,s.id,{
      status:resultStatus.value,
      numeric_value:resultStatus.value==='done'&&s.kind==='measurement'?Number(numericValue.value):null,
      comment:resultComment.value.trim()||null,
    })
    editStepId.value=null
    message.value='Результат сохранён в журнале наряда.'
    await load();emit('changed')
  }catch(e){error.value=e instanceof Error?e.message:'Не удалось записать результат'}
  finally{saving.value=false}
}
watch(()=>[props.id,props.entity,session.session?.active_company_id,preview.enabled],()=>{
  closeForms();void load()
})
onMounted(()=>void load())
</script>

<template>
  <section class="toir-checklist-panel">
    <div class="checklist-top">
      <div>
        <h2><ClipboardCheck :size="19"/> {{ isPlan?'Шаблон регламентных операций':'Чек-лист выполнения наряда' }}</h2>
        <p v-if="isPlan" class="operations-muted">
          Составьте технологическую карту. При выпуске нового наряда операции копируются и больше не меняются вместе с шаблоном.
        </p>
        <p v-else class="operations-muted">
          Исполнитель фиксирует факты, результаты измерений и причины пропусков. Закрытие наряда возможно только после обязательных пунктов.
        </p>
      </div>
      <BaseButton v-if="canEditTemplate" @click="openEditor()"><Plus :size="16"/> Добавить операцию</BaseButton>
    </div>
    <BaseNotice v-if="error" tone="error">{{ error }}</BaseNotice>
    <BaseNotice v-if="message" tone="success">{{ message }}</BaseNotice>
    <BaseNotice v-if="preview.enabled" tone="info">Демонстрационный образец. Изменения и отметки не сохраняются.</BaseNotice>
    <div v-if="!isPlan&&steps.length" class="checklist-progress">
      <div><span>Обязательные операции</span>
        <strong>{{ completedRequired }} / {{ requiredCount }} выполнено</strong></div>
      <div class="checklist-progress-track" role="progressbar" :aria-valuenow="completedRequired"
        :aria-valuemax="requiredCount||1" aria-valuemin="0" aria-label="Выполнение обязательных операций">
        <span :style="{width:progress+'%'}"></span>
      </div>
      <small>{{ doneCount }} выполнено из {{ steps.length }} всего
        <template v-if="completedRequired<requiredCount"> · Закрытие наряда пока запрещено</template>
      </small>
    </div>
    <div v-if="loading" class="operations-muted">Загрузка технологической карты…</div>
    <div v-else-if="!steps.length" class="operations-empty checklist-empty">
      <ClipboardCheck :size="29"/>
      <strong>{{ isPlan?'Операции пока не добавлены':'В этом наряде нет чек-листа' }}</strong>
      <p>{{ isPlan?'Добавьте шаги осмотра, работы, допуски и контрольные измерения.':
        'Для этого наряда не назначены операции. Если регламент создан раньше, история исполнения не меняется.' }}</p>
    </div>
    <div v-else class="checklist-list">
      <article v-for="step in steps" :key="step.id" class="checklist-step">
        <div class="checklist-step-index">{{ step.position }}</div>
        <div class="checklist-step-body">
          <div class="checklist-step-heading">
            <strong>{{ step.title }}</strong>
            <span class="operations-small-tag">{{ kindNames[step.kind] }}</span>
            <span v-if="step.is_required" class="checklist-required"><ShieldCheck :size="13"/> Обязательно</span>
            <span v-else class="operations-muted">По необходимости</span>
          </div>
          <p v-if="step.instructions" class="operations-muted">{{ step.instructions }}</p>
          <div v-if="work(step)" class="checklist-step-result">
            <span class="checklist-state" :class="'checklist-state--'+work(step)?.status">
              <CheckCircle2 v-if="work(step)?.status==='done'" :size="16"/>
              <AlertTriangle v-else-if="work(step)?.status==='skipped'" :size="16"/>
              <Circle v-else :size="16"/>
              {{ statusNames[work(step)!.status] }}
            </span>
            <span v-if="work(step)?.numeric_value!==null">
              <Activity :size="14"/> {{ work(step)?.numeric_value }} {{ step.unit||'' }}
            </span>
            <span v-if="work(step)?.performed_at">
              {{ work(step)?.performer?.name||'Исполнитель' }} ·
              {{ new Date(work(step)!.performed_at!).toLocaleString('ru-RU') }}
            </span>
          </div>
          <p v-if="work(step)?.comment" class="checklist-comment">{{ work(step)?.comment }}</p>
          <div v-if="canEditTemplate" class="checklist-actions">
            <button type="button" class="toolbar-icon" :aria-label="'Изменить '+step.title"
              @click="openEditor(step)"><Pencil :size="16"/></button>
            <button type="button" class="toolbar-icon" :aria-label="'Удалить '+step.title"
              @click="deleteTemplate(step)"><Trash2 :size="16"/></button>
          </div>
          <div v-else-if="canExecute&&editStepId!==step.id" class="checklist-actions">
            <BaseButton variant="secondary" @click="beginResult(step,'done')"><CheckCircle2 :size="15"/> Выполнено</BaseButton>
            <BaseButton v-if="!step.is_required" variant="secondary" @click="beginResult(step,'skipped')">Пропустить</BaseButton>
            <button v-if="work(step)?.status!=='pending'" type="button" class="toolbar-icon"
              title="Сбросить результат" :aria-label="'Сбросить '+step.title"
              @click="beginResult(step,'pending')"><RotateCcw :size="16"/></button>
          </div>
          <form v-if="!isPlan&&canExecute&&editStepId===step.id" class="checklist-inline-form"
            @submit.prevent="submitResult(step)">
            <div class="checklist-form-heading">
              <strong>Результат операции</strong>
              <button type="button" class="toolbar-icon" aria-label="Отмена" @click="closeForms"><X :size="15"/></button>
            </div>
            <label>Статус
              <select v-model="resultStatus" :disabled="saving">
                <option value="done">Выполнено</option>
                <option v-if="!step.is_required" value="skipped">Пропущено</option>
                <option value="pending">Не выполнено</option>
              </select>
            </label>
            <label v-if="step.kind==='measurement'&&resultStatus==='done'">
              Фактическое измерение{{ step.unit?' ('+step.unit+')':'' }} *
              <input v-model="numericValue" type="number" step="any" required :disabled="saving"
                placeholder="Введите число"/>
            </label>
            <label>Комментарий {{ resultStatus==='skipped'?'*':'' }}
              <textarea v-model="resultComment" rows="2" maxlength="2000" :disabled="saving"
                :required="resultStatus==='skipped'" placeholder="Фактический результат или причина отклонения"/>
            </label>
            <div class="checklist-inline-actions">
              <BaseButton variant="secondary" :disabled="saving" @click="closeForms">Отмена</BaseButton>
              <BaseButton type="submit" :disabled="saving">Сохранить результат</BaseButton>
            </div>
          </form>
        </div>
      </article>
    </div>
    <form v-if="isPlan&&editorOpen&&canEditTemplate" class="warehouse-form checklist-template-form"
      @submit.prevent="saveTemplate">
      <div class="checklist-form-heading"><h3>{{ editId?'Редактировать операцию':'Добавить операцию регламента' }}</h3>
        <button type="button" class="toolbar-icon" aria-label="Закрыть редактор" @click="closeForms"><X :size="16"/></button>
      </div>
      <label>Наименование операции *
        <input v-model="def.title" required minlength="3" maxlength="200"
          placeholder="Например, проверить уровень вибрации"/>
      </label>
      <div class="operations-form-two">
        <label>Вид операции
          <select v-model="def.kind">
            <option value="inspection">Осмотр</option>
            <option value="service">Обслуживание</option>
            <option value="safety">Безопасность / допуск</option>
            <option value="measurement">Контрольное измерение</option>
          </select>
        </label>
        <label v-if="def.kind==='measurement'">Единица измерения
          <input v-model="def.unit" maxlength="30" placeholder="бар, °C, мм/с"/>
        </label>
      </div>
      <label>Технологическая инструкция
        <textarea v-model="def.instructions" rows="3" maxlength="4000"
          placeholder="Как именно провести эту операцию"/>
      </label>
      <label class="checklist-required-toggle">
        <input v-model="def.is_required" type="checkbox"/>
        Обязательный пункт — без выполнения нельзя закрыть наряд
      </label>
      <div class="checklist-inline-actions">
        <BaseButton variant="secondary" :disabled="saving" @click="closeForms">Отмена</BaseButton>
        <BaseButton type="submit" :disabled="saving||def.title.trim().length<3">
          {{ editId?'Сохранить':'Добавить операцию' }}
        </BaseButton>
      </div>
    </form>
    <BaseNotice v-if="!isPlan&&status==='closed'&&steps.length" tone="info">
      Чек-лист закрытого наряда доступен только для просмотра. Результаты и авторы сохранены в истории.
    </BaseNotice>
  </section>
</template>

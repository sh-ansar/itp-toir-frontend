<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { RouterLink } from 'vue-router'
import { UsersRound, CalendarClock, ClipboardList, RefreshCcw, Plus, X, UserPlus, Trash2, ChevronRight } from 'lucide-vue-next'
import BaseButton from '../../components/ui/BaseButton.vue'
import BaseCard from '../../components/ui/BaseCard.vue'
import BaseNotice from '../../components/ui/BaseNotice.vue'
import BasePageHeading from '../../components/ui/BasePageHeading.vue'
import { getCrews, getShifts, getForecast, createCrew, addCrewMember, removeCrewMember,
  createRecurringShifts, removeShift, generateOrders,
  type Crew, type CrewShift, type ForecastRow, type GenerateResult } from '../../api/operations'
import { listResources } from '../../api/resources'
import { useSessionStore } from '../../stores/session'
import { usePreviewStore } from '../../stores/preview'
import type { ToirRecord } from '../../types/toir'

const session=useSessionStore(),preview=usePreviewStore()
const editable=computed(()=>['owner','admin','manager'].includes(session.session?.active_role||''))
const planner=computed(()=>editable.value||session.session?.active_role==='engineer')
const activeTab=ref<'teams'|'shifts'|'forecast'>('teams')
const loading=ref(false),saving=ref(false),error=ref(''),notice=ref('')
const crews=ref<Crew[]>([]),employees=ref<ToirRecord[]>([])
const shifts=ref<CrewShift[]>([]),forecast=ref<ForecastRow[]>([])
const selectedCrewId=ref<number|null>(null)
const selectedCrew=computed(()=>crews.value.find(c=>c.id===selectedCrewId.value)||null)
const modal=ref<'crew'|'member'|'shift'|'generate'|null>(null)
const crewName=ref(''),crewCode=ref(''),crewLead=ref(''),memberId=ref('')
const rangeDays=ref(30)
const weekdays=ref<number[]>([1,2,3,4,5])
const shiftStart=ref('08:00'),shiftEnd=ref('17:00'),shiftNote=ref('')
const result=ref<GenerateResult|null>(null)
const dayNames=['Пн','Вт','Ср','Чт','Пт','Сб','Вс']
function dateKey(offset=0){
  const d=new Date();d.setDate(d.getDate()+offset)
  return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0')
}
const shiftFrom=ref(dateKey()),shiftTo=ref(dateKey(14)),shiftCrew=ref('')
const availableEmployees=computed(()=>employees.value.filter(x=>x.status==='active'))
const unassignedEmployees=computed(()=>availableEmployees.value.filter(x=>!selectedCrew.value?.members.some(m=>m.id===x.id)))
const forecastCounts=computed(()=>({
  overdue:forecast.value.filter(f=>f.due==='overdue').length,
  upcoming:forecast.value.filter(f=>f.due==='soon').length,
  meter:forecast.value.filter(f=>f.trigger==='operating_hours').length,
}))
const matchedShifts=computed(()=>shifts.value.filter(s=>!selectedCrewId.value||s.crew_id===selectedCrewId.value))
const forecastVisible=computed(()=>forecast.value.filter(f=>!selectedCrewId.value||f.crew_id===selectedCrewId.value))

async function load(){
  loading.value=true;error.value=''
  try{
    const [c,emp,s,f]=await Promise.all([
      getCrews(),listResources('employees',{per_page:100}),
      getShifts(dateKey(),dateKey(60)),getForecast(rangeDays.value)
    ])
    crews.value=c;employees.value=emp.data;shifts.value=s;forecast.value=f.data
    if(!selectedCrewId.value||!c.some(v=>v.id===selectedCrewId.value))
      selectedCrewId.value=c[0]?.id??null
  }catch(cause){error.value=cause instanceof Error?cause.message:'Не удалось загрузить планирование'}
  finally{loading.value=false}
}
function openCrew(){crewName.value='';crewCode.value='';crewLead.value='';modal.value='crew';error.value=''}
function openShift(){
  shiftCrew.value=String(selectedCrewId.value||crews.value[0]?.id||'')
  shiftFrom.value=dateKey();shiftTo.value=dateKey(14)
  weekdays.value=[1,2,3,4,5];shiftStart.value='08:00';shiftEnd.value='17:00';shiftNote.value=''
  modal.value='shift';error.value=''
}
function openMember(){memberId.value='';modal.value='member';error.value=''}
async function submitCrew(){
  if(saving.value||preview.enabled)return
  saving.value=true;error.value=''
  try{
    const row=await createCrew({name:crewName.value.trim(),code:crewCode.value.trim(),
      lead_employee_id:crewLead.value?Number(crewLead.value):null})
    selectedCrewId.value=row.id;modal.value=null;notice.value='Бригада создана.'
    await load()
  }catch(cause){error.value=cause instanceof Error?cause.message:'Не удалось создать бригаду'}
  finally{saving.value=false}
}
async function submitMember(){
  if(!selectedCrew.value||!memberId.value||saving.value||preview.enabled)return
  saving.value=true;error.value=''
  try{
    await addCrewMember(selectedCrew.value.id,Number(memberId.value))
    modal.value=null;notice.value='Сотрудник добавлен в бригаду.';await load()
  }catch(e){error.value=e instanceof Error?e.message:'Не удалось добавить сотрудника'}
  finally{saving.value=false}
}
async function removeMember(id:number){
  if(!selectedCrew.value||preview.enabled||!window.confirm('Исключить сотрудника из бригады?'))return
  try{await removeCrewMember(selectedCrew.value.id,id);await load()}
  catch(e){error.value=e instanceof Error?e.message:'Не удалось удалить участника'}
}
async function submitShifts(){
  if(saving.value||preview.enabled||!shiftCrew.value||!weekdays.value.length)return
  saving.value=true;error.value=''
  try{
    const response=await createRecurringShifts({crew_id:Number(shiftCrew.value),
      from:shiftFrom.value,to:shiftTo.value,
      weekdays:weekdays.value,starts_at:shiftStart.value,ends_at:shiftEnd.value,
      note:shiftNote.value.trim()})
    modal.value=null
    notice.value='Создано смен: '+response.created+'. Уже были: '+response.existing+
      '. Конфликтов: '+response.blocked.length+'.'
    selectedCrewId.value=Number(shiftCrew.value)
    await load()
  }catch(e){error.value=e instanceof Error?e.message:'Не удалось составить смены'}
  finally{saving.value=false}
}
async function cancelShift(id:number){
  if(preview.enabled||!window.confirm('Удалить смену? Если есть наряды, удаление будет запрещено.'))return
  try{await removeShift(id);await load()}
  catch(e){error.value=e instanceof Error?e.message:'Не удалось удалить смену'}
}
async function previewGeneration(){
  if(preview.enabled||saving.value)return
  saving.value=true;error.value='';result.value=null
  try{result.value=await generateOrders(rangeDays.value,true);modal.value='generate'}
  catch(e){error.value=e instanceof Error?e.message:'Не удалось рассчитать план'}
  finally{saving.value=false}
}
async function confirmGeneration(){
  if(preview.enabled||saving.value)return
  saving.value=true;error.value=''
  try{
    const data=await generateOrders(rangeDays.value,false)
    notice.value='Сформировано нарядов: '+data.created+'. Уже существуют: '+data.existing+
      '. Без назначения: '+data.blocked.length+'.'
    result.value=data;modal.value=null;await load();activeTab.value='forecast'
  }catch(e){error.value=e instanceof Error?e.message:'Не удалось сформировать наряды'}
  finally{saving.value=false}
}
function dueLabel(row:ForecastRow){return row.due==='overdue'?'Просрочено':row.due==='soon'?'Скоро':'План'}
watch(()=>session.session?.active_company_id,()=>void load())
watch(()=>preview.enabled,()=>void load())
watch(rangeDays,()=>void load())
onMounted(()=>void load())
</script>

<template>
  <div class="operations-page workforce-page">
    <div class="toir-breadcrumb">Ремонт и обслуживание / Бригады и графики</div>
    <BasePageHeading title="Бригады и планирование работ"
      description="Состав бригад, подтверждённые смены, прогноз ТО и распределение нарядов без пересечений."/>
    <BaseNotice v-if="error" tone="error">{{ error }}</BaseNotice>
    <BaseNotice v-if="notice" tone="success">{{ notice }}</BaseNotice>
    <div class="operations-metrics">
      <BaseCard><span>Бригады</span><strong>{{ crews.length }}</strong><small>Команды исполнителей</small></BaseCard>
      <BaseCard><span>Смены</span><strong>{{ shifts.length }}</strong><small>Следующие 60 дней</small></BaseCard>
      <BaseCard><span>Просроченное ТО</span><strong>{{ forecastCounts.overdue }}</strong><small>Требует назначения</small></BaseCard>
      <BaseCard><span>ТО по наработке</span><strong>{{ forecastCounts.meter }}</strong><small>Расчёт по показаниям</small></BaseCard>
    </div>
    <div class="registry-toolbar">
      <div class="switch-tabs" role="tablist" aria-label="Разделы планирования">
        <button type="button" role="tab" :aria-selected="activeTab==='teams'" :class="{active:activeTab==='teams'}" @click="activeTab='teams'">Бригады</button>
        <button type="button" role="tab" :aria-selected="activeTab==='shifts'" :class="{active:activeTab==='shifts'}" @click="activeTab='shifts'">Графики смен</button>
        <button type="button" role="tab" :aria-selected="activeTab==='forecast'" :class="{active:activeTab==='forecast'}" @click="activeTab='forecast'">Прогноз ТО</button>
      </div>
      <div class="toolbar-actions">
        <BaseButton v-if="editable&&activeTab==='teams'" @click="openCrew"><Plus :size="16"/>Бригада</BaseButton>
        <BaseButton v-if="editable&&activeTab==='shifts'" @click="openShift"><CalendarClock :size="16"/>Создать график</BaseButton>
        <BaseButton v-if="planner&&activeTab==='forecast'" @click="previewGeneration"><ClipboardList :size="16"/>Сформировать наряды</BaseButton>
        <button type="button" class="toolbar-icon" aria-label="Обновить планирование" :disabled="loading" @click="load"><RefreshCcw :size="17"/></button>
      </div>
    </div>
    <div v-if="activeTab==='teams'" class="operations-two-pane operations-crews-layout">
      <BaseCard>
        <header class="operations-panel-heading"><h2><UsersRound :size="18"/> Рабочие бригады</h2><small>{{ crews.length }} команд</small></header>
        <button v-for="crew in crews" :key="crew.id" type="button"
          class="operations-crew-list-item" :class="{selected:selectedCrewId===crew.id}"
          @click="selectedCrewId=crew.id">
          <span class="operations-crew-avatar"><UsersRound :size="18"/></span>
          <span><strong>{{ crew.name }}</strong><small>{{ crew.code }} · {{ crew.members.length }} сотрудников</small></span>
          <ChevronRight :size="17"/>
        </button>
        <div v-if="!crews.length" class="operations-empty"><UsersRound :size="28"/>
          <strong>Бригады не созданы</strong><p>Сначала заведите сотрудников, затем сформируйте бригаду.</p>
          <RouterLink to="/employees">Справочник сотрудников</RouterLink>
        </div>
      </BaseCard>
      <BaseCard>
        <template v-if="selectedCrew">
          <div class="asset-inspector-head"><div><small>{{ selectedCrew.code }}</small><h2>{{ selectedCrew.name }}</h2>
            <p>Руководитель: {{ selectedCrew.lead?.name||'Не назначен' }}</p></div></div>
          <header class="operations-panel-heading"><h3>Участники бригады</h3>
            <BaseButton v-if="editable" variant="secondary" @click="openMember"><UserPlus :size="16"/>Добавить</BaseButton>
          </header>
          <div v-for="member in selectedCrew.members" :key="member.id" class="operations-member-row">
            <span class="operations-member-avatar">{{ member.name.slice(0,1) }}</span>
            <div><strong>{{ member.name }}</strong><small>{{ member.position||'Сотрудник' }}</small></div>
            <span v-if="selectedCrew.lead_employee_id===member.id" class="operations-small-tag">Мастер</span>
            <button v-else-if="editable" type="button" class="toolbar-icon" title="Исключить из бригады"
              :aria-label="'Исключить '+member.name" @click="removeMember(member.id)"><Trash2 :size="15"/></button>
          </div>
          <p v-if="!selectedCrew.members.length" class="operations-muted">Нет участников. Добавьте сотрудников, чтобы назначать смены.</p>
          <div class="operations-crew-hint"><CalendarClock :size="18"/>
            <p>Создайте график для этой бригады. Система подберёт свободный интервал ТО в пределах подтверждённой смены.</p>
          </div>
          <BaseButton variant="secondary" @click="activeTab='shifts'">Перейти к графику <ChevronRight :size="16"/></BaseButton>
        </template>
        <div v-else class="operations-empty">Выберите бригаду.</div>
      </BaseCard>
    </div>
    <template v-else-if="activeTab==='shifts'">
      <div class="registry-toolbar">
        <span class="operations-muted">Подтверждённые смены. Загрузка проверяется перед назначением наряда.</span>
        <select v-model="selectedCrewId" class="operations-select" aria-label="Фильтр по бригаде">
          <option :value="null">Все бригады</option>
          <option v-for="crew in crews" :key="crew.id" :value="crew.id">{{ crew.name }}</option>
        </select>
      </div>
      <div class="toir-table-scroll"><table class="toir-table operations-table">
        <thead><tr><th>Дата</th><th>Бригада</th><th>Начало</th><th>Окончание</th><th>Статус</th><th>Управление</th></tr></thead>
        <tbody>
          <tr v-for="shift in matchedShifts" :key="shift.id">
            <td>{{ shift.work_date }}</td><td>{{ shift.crew?.name||crews.find(x=>x.id===shift.crew_id)?.name||'—' }}</td>
            <td>{{ shift.starts_at.slice(0,5) }}</td><td>{{ shift.ends_at.slice(0,5) }}</td>
            <td>Подтверждена</td>
            <td><button v-if="editable" type="button" class="toolbar-icon" aria-label="Удалить смену"
              @click="cancelShift(shift.id)"><Trash2 :size="15"/></button></td>
          </tr>
          <tr v-if="!matchedShifts.length"><td colspan="6" class="operations-empty-cell">Смен пока нет. Создайте график работы бригады.</td></tr>
        </tbody>
      </table></div>
    </template>
    <template v-else>
      <div class="registry-toolbar">
        <span class="operations-muted">Прогнозные сроки — ещё не наряды. Работы появятся после формирования.</span>
        <label class="operations-inline-select">Горизонт:
          <select v-model.number="rangeDays" class="operations-select" aria-label="Горизонт прогноза">
            <option :value="14">14 дней</option><option :value="30">30 дней</option>
            <option :value="60">60 дней</option><option :value="90">90 дней</option>
          </select>
        </label>
      </div>
      <div class="toir-table-scroll"><table class="toir-table operations-table">
        <thead><tr><th>Дата</th><th>Регламент</th><th>Узел</th><th>Бригада</th><th>Источник срока</th><th>Приоритет</th><th></th></tr></thead>
        <tbody>
          <tr v-for="row in forecastVisible" :key="row.plan_id+'-'+row.trigger+'-'+row.date">
            <td><strong>{{ row.date }}</strong><small class="operations-due" :class="'due-'+row.due">{{ dueLabel(row) }}</small></td>
            <td>{{ row.title }}</td><td>{{ row.asset_name }}<small>{{ row.asset_code }}</small></td>
            <td>{{ row.crew_name||row.employee_name||'Не назначен' }}</td>
            <td>{{ row.trigger==='operating_hours'?(row.estimated?'Прогноз моточасов':'Достигнут порог'):'Календарное ТО' }}</td>
            <td>{{ row.priority }} / 5</td>
            <td><RouterLink :to="'/plans/'+row.plan_id">Открыть</RouterLink></td>
          </tr>
          <tr v-if="!forecastVisible.length"><td colspan="7" class="operations-empty-cell">Нет активных регламентов в этом горизонте. <RouterLink to="/plans/list">Добавьте план ТО</RouterLink>.</td></tr>
        </tbody>
      </table></div>
      <BaseNotice tone="info">Прогноз по моточасам появляется при двух показаниях. Это линейная оценка, не обученная ML-модель. Автоматическое распределение проверяет календарные сроки, смены и загрузку.</BaseNotice>
    </template>
    <Teleport to="body">
      <div v-if="modal" class="category-backdrop" @click.self="!saving&&(modal=null)">
        <section class="category-dialog operations-dialog" role="dialog" aria-modal="true"
          :aria-label="modal==='crew'?'Создать бригаду':modal==='member'?'Добавить участника':modal==='shift'?'Создать график смен':'Сформировать наряды'">
          <header class="category-dialog-head"><div class="category-dialog-icon">
            <UsersRound v-if="modal==='crew'||modal==='member'" :size="19"/><CalendarClock v-else :size="19"/>
          </div><button class="drawer-close" type="button" aria-label="Закрыть" @click="modal=null"><X :size="18"/></button></header>
          <template v-if="modal==='crew'">
            <h2>Новая бригада</h2><p>Бригады назначаются на регламенты, наряды и рабочие смены.</p>
            <form class="warehouse-form" @submit.prevent="submitCrew">
              <label>Название *<input v-model="crewName" required maxlength="200" placeholder="Механическая бригада №1"/></label>
              <label>Уникальный код *<input v-model="crewCode" required maxlength="64" placeholder="MECH-01"/></label>
              <label>Мастер бригады<select v-model="crewLead">
                <option value="">Не назначен</option>
                <option v-for="emp in availableEmployees" :key="emp.id" :value="String(emp.id)">{{ emp.name }}</option>
              </select></label>
              <div class="category-dialog-footer">
                <BaseButton variant="secondary" @click="modal=null">Отмена</BaseButton>
                <BaseButton type="submit" :disabled="saving||preview.enabled">Создать</BaseButton>
              </div>
            </form>
          </template>
          <template v-else-if="modal==='member'">
            <h2>Добавить участника</h2>
            <form class="warehouse-form" @submit.prevent="submitMember">
              <label>Сотрудник *<select v-model="memberId" required>
                <option value="">Выберите сотрудника</option>
                <option v-for="emp in unassignedEmployees" :key="emp.id" :value="String(emp.id)">{{ emp.name }}</option>
              </select></label>
              <div class="category-dialog-footer">
                <BaseButton variant="secondary" @click="modal=null">Отмена</BaseButton>
                <BaseButton type="submit" :disabled="saving||preview.enabled||!memberId">Добавить</BaseButton>
              </div>
            </form>
          </template>
          <template v-else-if="modal==='shift'">
            <h2>Повторяющийся график смен</h2><p>Конфликтующие смены не создаются; период до 62 дней.</p>
            <form class="warehouse-form" @submit.prevent="submitShifts">
              <label>Бригада *<select v-model="shiftCrew" required>
                <option value="">Выберите бригаду</option>
                <option v-for="crew in crews" :key="crew.id" :value="String(crew.id)">{{ crew.name }}</option>
              </select></label>
              <div class="operations-form-two">
                <label>С *<input v-model="shiftFrom" type="date" required/></label>
                <label>По *<input v-model="shiftTo" type="date" :min="shiftFrom" required/></label>
                <label>Начало *<input v-model="shiftStart" type="time" required/></label>
                <label>Окончание *<input v-model="shiftEnd" type="time" required/></label>
              </div>
              <fieldset class="operations-weekdays"><legend>Рабочие дни недели *</legend>
                <label v-for="(day,i) in dayNames" :key="i">
                  <input v-model="weekdays" type="checkbox" :value="i+1"/>{{ day }}
                </label>
              </fieldset>
              <label>Примечание<input v-model="shiftNote" maxlength="255" placeholder="Основная смена"/></label>
              <div class="category-dialog-footer">
                <BaseButton variant="secondary" @click="modal=null">Отмена</BaseButton>
                <BaseButton type="submit" :disabled="saving||preview.enabled||!weekdays.length">Создать смены</BaseButton>
              </div>
            </form>
          </template>
          <template v-else>
            <h2>Сформировать плановые наряды</h2>
            <p>Предварительный расчёт проверяет дубликаты, подтверждённые смены и свободное время бригад.</p>
            <div class="operations-generate-summary">
              <div><span>К созданию</span><strong>{{ result?.created??0 }}</strong></div>
              <div><span>Уже есть</span><strong>{{ result?.existing??0 }}</strong></div>
              <div><span>Не назначены</span><strong>{{ result?.blocked?.length??0 }}</strong></div>
            </div>
            <BaseNotice v-if="result?.blocked?.length" tone="warning">Не все работы помещаются в график. Создайте смены или устраните конфликты.</BaseNotice>
            <div class="category-dialog-footer">
              <BaseButton variant="secondary" @click="modal=null">Отмена</BaseButton>
              <BaseButton :disabled="saving||preview.enabled||!result?.created" @click="confirmGeneration">
                Создать {{ result?.created||0 }} нарядов
              </BaseButton>
            </div>
          </template>
        </section>
      </div>
    </Teleport>
  </div>
</template>

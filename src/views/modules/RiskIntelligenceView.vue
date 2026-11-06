<script setup lang="ts">
import { Button as SharedButton } from "@itpmining/vue-basic-components";
import BaseSelect from '../../components/ui/BaseSelect.vue'
import BaseSearchField from '../../components/ui/BaseSearchField.vue'
import { computed, onMounted, ref, watch } from 'vue'
import { RouterLink } from 'vue-router'
import { ShieldAlert, Search, RefreshCcw, ArrowUpRight, Activity, CalendarClock, Gauge, Info } from 'lucide-vue-next'
import BaseCard from '../../components/ui/BaseCard.vue'
import BaseNotice from '../../components/ui/BaseNotice.vue'
import BasePageHeading from '../../components/ui/BasePageHeading.vue'
import { getRisks, getForecast, type RiskNode, type RiskResponse, type ForecastRow } from '../../api/operations'
import { useSessionStore } from '../../stores/session'

const session=useSessionStore()
const response=ref<RiskResponse|null>(null)
const forecasts=ref<ForecastRow[]>([])
const loading=ref(false),error=ref('')
const selectedId=ref<number|null>(null)
const search=ref('')
const level=ref<'all'|'critical'|'high'|'medium'|'low'>('all')
const selected=computed(()=>response.value?.data.find(r=>r.id===selectedId.value)||null)
const filtered=computed(()=>{
  const needle=search.value.toLocaleLowerCase('ru').trim()
  return (response.value?.data||[]).filter(r=>
    (level.value==='all'||r.level===level.value)&&
    (!needle||(r.name+' '+r.code).toLocaleLowerCase('ru').includes(needle)))
})
const associatedPlans=computed(()=>forecasts.value.filter(f=>f.asset_id===selectedId.value).slice(0,8))
const labels:Record<string,string>={critical:'Критический',high:'Высокий',medium:'Средний',low:'Низкий'}
const methodDescription='Индекс риска по правилам: критичность узла, оценка технического состояния, просроченные регламенты, порог наработки, аварийные и просроченные наряды. Риски дочерних узлов повышают оценку объекта.'
const summaryItems=computed(()=>[
  {key:'critical',label:'Критический',count:response.value?.summary.critical||0},
  {key:'high',label:'Высокий',count:response.value?.summary.high||0},
  {key:'medium',label:'Средний',count:response.value?.summary.medium||0},
  {key:'low',label:'Низкий',count:response.value?.summary.low||0},
])
async function load(){
  loading.value=true;error.value=''
  try{
    const [r,f]=await Promise.all([getRisks(),getForecast(60)])
    response.value=r;forecasts.value=f.data
    if(!r.data.some(x=>x.id===selectedId.value))selectedId.value=r.data[0]?.id??null
  }catch(e){error.value=e instanceof Error?e.message:'Не удалось пересчитать аналитику'}
  finally{loading.value=false}
}
watch(()=>session.session?.active_company_id,()=>void load())
onMounted(()=>void load())
</script>

<template>
  <div class="operations-page risk-intelligence-page">
    <BasePageHeading title="Техническое состояние и зоны риска"
      description="Объяснимый приоритет обследования объектов и агрегатов на основе доступных фактов."/>
    <BaseNotice v-if="error" tone="error">{{ error }}</BaseNotice>
    <div class="operations-metrics">
      <BaseCard v-for="item in summaryItems" :key="item.key">
        <span>{{ item.label }}</span><strong>{{ item.count }}</strong>
        <small>Узлов с таким индексом</small>
        <div class="operations-risk-meter" :class="'risk-'+item.key">
          <span :style="{width:(response?.data.length?100*item.count/response.data.length:0)+'%'}"></span>
        </div>
      </BaseCard>
    </div>
    <div class="registry-toolbar">
      <div class="toolbar-leading">
        <BaseSearchField v-model="search" label="Поиск по аналитике" placeholder="Название или код оборудования" />
        <BaseSelect v-model="level" class="operations-select" aria-label="Фильтр по уровню риска">
          <option value="all">Все уровни риска</option>
          <option value="critical">Критический</option><option value="high">Высокий</option>
          <option value="medium">Средний</option><option value="low">Низкий</option>
        </BaseSelect>
      </div>
      <div class="toolbar-actions">
        <RouterLink class="toir-toolbar-btn" to="/asset-tree"><Activity :size="16"/>Структура активов</RouterLink>
        <SharedButton type="button" class="toolbar-icon" aria-label="Обновить расчёт рисков" :disabled="loading" @click="load">
          <RefreshCcw :size="17"/>
        </SharedButton>
      </div>
    </div>
    <div class="operations-two-pane">
      <BaseCard>
        <header class="operations-panel-heading"><h2><ShieldAlert :size="18"/> Реестр оценки рисков</h2>
          <small>{{ filtered.length }} узлов</small></header>
        <div class="risk-list">
          <button v-for="row in filtered" :key="row.id" type="button"
            class="risk-row" :class="{selected:selectedId===row.id}" @click="selectedId=row.id">
            <span class="risk-score-ring" :class="'risk-'+row.level">{{ row.score }}</span>
            <span class="risk-row-description">
              <strong>{{ row.name }}</strong>
              <small>{{ row.code }} · {{ labels[row.level] }} риск · критичность {{ row.criticality }}/5</small>
            </span>
            <span v-if="row.data_quality.length" class="operations-data-warning" title="Неполные данные"><Info :size="15"/></span>
          </button>
          <div v-if="!filtered.length&&!loading" class="operations-empty"><ShieldAlert :size="28"/>
            <strong>{{ search||level!=='all'?'Не найдено совпадений':'Активы ещё не оцифрованы' }}</strong>
            <p>Добавьте структуру и показания состояния, чтобы увидеть приоритеты обслуживания.</p>
            <RouterLink to="/asset-tree">Перейти к структуре</RouterLink>
          </div>
        </div>
      </BaseCard>
      <BaseCard>
        <template v-if="selected">
          <div class="operations-path">Анализ технического состояния / {{ selected.code }}</div>
          <div class="asset-inspector-head">
            <div><small>Индекс риска · {{ labels[selected.level] }}</small><h2>{{ selected.name }}</h2>
              <p>Состояние: {{ selected.condition_score??'нет показаний' }} · Критичность: {{ selected.criticality }} / 5</p></div>
            <span class="risk-score-ring risk-score-ring--large" :class="'risk-'+selected.level">{{ selected.score }}</span>
          </div>
          <div class="operations-info-grid">
            <div><span>Индекс самого узла</span><strong>{{ selected.own_score }} / 100</strong></div>
            <div><span>С учётом дочерних узлов</span><strong>{{ selected.score }} / 100</strong></div>
            <div><span>Наработка</span><strong>{{ selected.operating_hours.toLocaleString('ru-RU') }} ч</strong></div>
            <div><span>Полнота измерений</span><strong>{{ selected.data_quality.length?'Недостаточно':'Есть измерения' }}</strong></div>
          </div>
          <section class="operations-reasons">
            <h3>Почему такой риск?</h3>
            <p v-for="reason in selected.reasons" :key="reason">{{ reason }}</p>
            <small v-if="selected.highest_risk_descendant_id">На показатель повлиял риск одного из дочерних узлов.</small>
          </section>
          <section class="operations-linked">
            <h3><CalendarClock :size="17"/> Ближайшие работы</h3>
            <div v-for="plan in associatedPlans" :key="plan.plan_id+'-'+plan.trigger+'-'+plan.date" class="operations-linked-row">
              <span>{{ plan.title }}</span>
              <small>{{ plan.date }} · {{ plan.crew_name||'Без бригады' }}</small>
            </div>
            <p v-if="!associatedPlans.length" class="operations-muted">Нет активных регламентов для выбранного узла в ближайшие 60 дней.</p>
            <RouterLink class="inspector-open" :to="'/assets/'+selected.id">
              Паспорт оборудования <ArrowUpRight :size="16"/>
            </RouterLink>
          </section>
        </template>
        <div v-else class="operations-empty"><Gauge :size="28"/>Выберите объект из списка слева.</div>
      </BaseCard>
    </div>
    <BaseNotice tone="info">
      {{ methodDescription }} Эта оценка не является сертифицированной вероятностью отказа.
      Без истории отказов и измерений модель машинного обучения не обучена.
      Неполные данные отмечены отдельно; отсутствие тревог не подтверждает исправность.
    </BaseNotice>
  </div>
</template>

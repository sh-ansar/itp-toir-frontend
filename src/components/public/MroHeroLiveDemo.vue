<script setup>
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import {
  Activity, AlertTriangle, CalendarDays, CheckCircle2, ClipboardList,
  Factory, Gauge, Layers, ListTodo, Settings2, Wrench,
} from 'lucide-vue-next'
import { mroHeroDemoCopy } from './mroHeroDemoCopy.js'

const { locale } = useI18n()
const copy = computed(() => mroHeroDemoCopy[locale.value] || mroHeroDemoCopy.en)
const panel = ref('equipment')
const view = ref('structure')
const selectedAssetId = ref('pump')
const orderFilter = ref('filterAll')

const assets = [
  { id:'compressor', label:'compressor', shop:'shopA', status:'running', risk:'normal', next:'thu' },
  { id:'pump', label:'pump', shop:'shopA', status:'due', risk:'moderate', next:'tue' },
  { id:'generator', label:'generator', shop:'shopB', status:'fault', risk:'critical', next:'wed' },
  { id:'fan', label:'fan', shop:'shopB', status:'running', risk:'normal', next:'fri' },
]
const orders = [
  { id:'MRO-00458', job:'planned', assetId:'pump', phase:'inProgress' },
  { id:'MRO-00457', job:'replace', assetId:'compressor', phase:'new' },
  { id:'MRO-00456', job:'inspect', assetId:'generator', phase:'overdue' },
  { id:'MRO-00455', job:'repair', assetId:'fan', phase:'inProgress' },
]
const weekdays = ['mon','tue','wed','thu','fri']
const schedule = [
  { assetId:'compressor', start:0, span:2 },
  { assetId:'pump', start:1, span:2 },
  { assetId:'generator', start:3, span:2 },
  { assetId:'fan', start:2, span:2 },
]
const selectedAsset = computed(() => assets.find(item => item.id === selectedAssetId.value) || assets[0])
const visibleOrders = computed(() => orders.filter(item => orderFilter.value === 'filterAll'
  || (orderFilter.value === 'filterActive' && item.phase === 'inProgress')
  || (orderFilter.value === 'filterOverdue' && item.phase === 'overdue')))
function selectAsset(id) {
  selectedAssetId.value = id
  panel.value = 'equipment'
  view.value = 'structure'
}
function selectOrder(order) {
  selectAsset(order.assetId)
}
function selectPanel(id) {
  panel.value = id
}
function resetDemo() {
  selectedAssetId.value = 'pump'
  panel.value = 'equipment'
  view.value = 'structure'
  orderFilter.value = 'filterAll'
}
</script>

<template>
  <section class="mro-live" :aria-label="copy.content" data-mro-live-demo>
    <div class="mro-live__topline">
      <span class="mro-live__sample"><span class="mro-live__pulse" aria-hidden="true"></span>{{ copy.example }}</span>
      <button type="button" class="mro-live__reset" @click="resetDemo">
        <Settings2 :size="14" aria-hidden="true" /> {{ copy.overview }}
      </button>
    </div>
    <nav class="mro-live__screen-tabs" :aria-label="copy.navigation">
      <button v-for="screen in ['overview','equipment','orders']" :key="screen"
        type="button" :class="{ 'is-active': panel === screen }"
        :aria-pressed="panel === screen" @click="selectPanel(screen)">
        {{ copy[screen] }}
      </button>
    </nav>

    <div class="mro-live__panels" :data-current-panel="panel">
      <!-- Real Vue components, not images. Public values are explicitly synthetic. -->
      <section class="mro-live__panel mro-live__panel--summary" :class="{ 'is-current': panel === 'overview' }"
        :aria-label="copy.overview">
        <header class="mro-live__panel-head">
          <div class="mro-live__brand"><span class="mro-live__brand-box">ITP</span><strong>ТОиР</strong></div>
          <strong>{{ copy.overview }}</strong>
          <Activity :size="17" class="mro-live__head-icon" aria-hidden="true" />
        </header>
        <div class="mro-live__stats">
          <div class="mro-live__stat">
            <Gauge :size="18" aria-hidden="true" />
            <span>{{ copy.assets }}</span>
            <strong>128</strong>
          </div>
          <div class="mro-live__stat mro-live__stat--good">
            <CheckCircle2 :size="18" aria-hidden="true" />
            <span>{{ copy.available }}</span>
            <strong>94%</strong>
          </div>
          <div class="mro-live__stat">
            <ClipboardList :size="18" aria-hidden="true" />
            <span>{{ copy.today }}</span>
            <strong>6</strong>
          </div>
        </div>
        <div class="mro-live__activity">
          <div class="mro-live__list-head"><strong>{{ copy.recent }}</strong><span>{{ copy.earlier }}</span></div>
          <button type="button" class="mro-live__activity-line" @click="selectAsset('pump')">
            <CheckCircle2 :size="16" class="mro-live__success" aria-hidden="true" />
            <span>{{ copy.eventOne }}</span><small>{{ copy.justNow }}</small>
          </button>
          <button type="button" class="mro-live__activity-line" @click="selectAsset('compressor')">
            <Wrench :size="16" class="mro-live__accent" aria-hidden="true" />
            <span>{{ copy.eventTwo }}</span><small>{{ copy.earlier }}</small>
          </button>
          <button type="button" class="mro-live__activity-line" @click="selectAsset('generator')">
            <CalendarDays :size="16" class="mro-live__warning" aria-hidden="true" />
            <span>{{ copy.eventThree }}</span><small>{{ copy.earlier }}</small>
          </button>
        </div>
        <div class="mro-live__summary-foot"><Factory :size="22" aria-hidden="true" />{{ copy.plant }} <span>●</span></div>
      </section>

      <section class="mro-live__panel mro-live__panel--equipment" :class="{ 'is-current': panel === 'equipment' }"
        :aria-label="copy.equipment">
        <div class="mro-live__application">
          <aside class="mro-live__app-rail" :aria-label="copy.navigation">
            <div class="mro-live__brand mro-live__rail-brand"><span class="mro-live__brand-box">ITP</span><strong>ТОиР</strong></div>
            <button type="button" :aria-label="copy.overview" @click="selectPanel('overview')"><Gauge :size="17" aria-hidden="true" /></button>
            <button type="button" class="is-selected" :aria-label="copy.equipment" @click="selectPanel('equipment')"><Layers :size="17" aria-hidden="true" /></button>
            <button type="button" :aria-label="copy.orders" @click="selectPanel('orders')"><ClipboardList :size="17" aria-hidden="true" /></button>
            <button type="button" :aria-label="copy.schedule" @click="view = 'schedule'"><CalendarDays :size="17" aria-hidden="true" /></button>
            <button type="button" :aria-label="copy.risks" @click="view = 'risks'"><AlertTriangle :size="17" aria-hidden="true" /></button>
          </aside>
          <div class="mro-live__app-main">
            <header class="mro-live__app-head">
              <span>{{ copy.plant }} / {{ copy.equipment }}</span>
              <div><Layers :size="18" aria-hidden="true" /><strong>{{ copy.equipment }}</strong></div>
            </header>
            <nav class="mro-live__view-tabs" :aria-label="copy.content">
              <button v-for="v in ['structure','schedule','risks']" :key="v" type="button"
                :aria-pressed="view === v" :class="{ 'is-active': view === v }" @click="view = v">{{ copy[v] }}</button>
            </nav>

            <div v-if="view === 'structure'" class="mro-live__tree-content" data-mro-demo-structure>
              <div class="mro-live__tree-title"><strong>{{ copy.equipmentTree }}</strong><small>{{ copy.viewAsset }}</small></div>
              <div class="mro-live__tree">
                <div class="mro-live__tree-root"><Factory :size="19" aria-hidden="true" /><span><strong>{{ copy.plant }}</strong><small>{{ copy.production }}</small></span></div>
                <div class="mro-live__branches">
                  <div v-for="shop in ['shopA','shopB']" :key="shop" class="mro-live__branch">
                    <div class="mro-live__shop"><Layers :size="15" aria-hidden="true" /><span><strong>{{ copy[shop] }}</strong><small>{{ copy[shop === 'shopA' ? 'mainShop' : 'utilityShop'] }}</small></span></div>
                    <div class="mro-live__equipment-list">
                      <button v-for="asset in assets.filter(a => a.shop === shop)" :key="asset.id" type="button"
                        class="mro-live__asset" :class="{ 'is-selected': selectedAssetId === asset.id }"
                        :aria-pressed="selectedAssetId === asset.id"
                        @click="selectAsset(asset.id)">
                        <Wrench :size="16" aria-hidden="true" />
                        <span>{{ copy[asset.label] }}</span>
                        <span class="mro-live__status-dot" :data-status="asset.status" :aria-label="copy[asset.status]"></span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
              <div class="mro-live__asset-inspector">
                <span><strong>{{ copy.selectedAsset }}</strong><small>{{ copy[selectedAsset.label] }}</small></span>
                <span class="mro-live__status" :data-status="selectedAsset.status">{{ copy[selectedAsset.status] }}</span>
              </div>
            </div>

            <div v-else-if="view === 'schedule'" class="mro-live__schedule" data-mro-demo-schedule>
              <div class="mro-live__tree-title"><strong>{{ copy.workload }}</strong><small>{{ copy.week }}</small></div>
              <div class="mro-live__schedule-header"><span>{{ copy.asset }}</span><span v-for="day in weekdays" :key="day">{{ copy[day] }}</span></div>
              <div v-for="entry in schedule" :key="entry.assetId" class="mro-live__schedule-row">
                <span>{{ copy[assets.find(a => a.id === entry.assetId).label] }}</span>
                <span v-for="day in 5" :key="day" class="mro-live__schedule-cell"></span>
                <button type="button" class="mro-live__schedule-bar"
                  :style="{ gridColumn: String(entry.start + 2) + ' / span ' + entry.span }"
                  :aria-label="copy.planned + ': ' + copy[assets.find(a => a.id === entry.assetId).label]"
                  @click="selectAsset(entry.assetId)"><Wrench :size="12" aria-hidden="true" /></button>
              </div>
            </div>

            <div v-else class="mro-live__risks" data-mro-demo-risks>
              <div class="mro-live__tree-title"><strong>{{ copy.riskTitle }}</strong><small>{{ copy.riskHint }}</small></div>
              <button v-for="asset in assets" :key="asset.id" type="button" class="mro-live__risk-row"
                @click="selectAsset(asset.id)">
                <span><Gauge :size="17" aria-hidden="true" />{{ copy[asset.label] }}</span>
                <span class="mro-live__status" :data-status="asset.status">{{ copy[asset.risk] }}</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      <section class="mro-live__panel mro-live__panel--orders" :class="{ 'is-current': panel === 'orders' }"
        :aria-label="copy.orders">
        <header class="mro-live__panel-head">
          <div><ClipboardList :size="19" class="mro-live__accent" aria-hidden="true" /><strong>{{ copy.orders }}</strong></div>
          <span class="mro-live__panel-head-note">ITP ТОиР</span>
        </header>
        <div class="mro-live__order-stats">
          <span><small>{{ copy.new }}</small><strong>6</strong></span>
          <span><small>{{ copy.inProgress }}</small><strong>12</strong></span>
          <span class="mro-live__overdue"><small>{{ copy.overdue }}</small><strong>2</strong></span>
        </div>
        <div class="mro-live__order-filters" :aria-label="copy.orders">
          <button v-for="f in ['filterAll','filterActive','filterOverdue']" :key="f" type="button"
            :aria-pressed="orderFilter === f" :class="{ 'is-active': orderFilter === f }"
            @click="orderFilter = f">{{ copy[f] }}</button>
        </div>
        <div class="mro-live__order-list">
          <div class="mro-live__order-heading"><span>{{ copy.work }}</span><span>{{ copy.status }}</span></div>
          <button v-for="order in visibleOrders" :key="order.id" type="button" class="mro-live__order-row"
            @click="selectOrder(order)">
            <span><strong>{{ copy[order.job] }}</strong><small>{{ order.id }} · {{ copy[assets.find(a => a.id === order.assetId).label] }}</small></span>
            <span class="mro-live__status" :data-status="order.phase">{{ copy[order.phase] }}</span>
          </button>
          <p v-if="!visibleOrders.length" class="mro-live__empty">{{ copy.noOrders }}</p>
        </div>
        <p class="mro-live__disclaimer">{{ copy.onlyDemo }}</p>
      </section>
    </div>
  </section>
</template>

<style scoped>
.mro-live{width:100%;min-width:0;padding:13px 14px 17px;border-radius:20px;overflow:hidden;box-shadow:0 22px 56px #19506b17;background:linear-gradient(111deg,#fc3b96 0%,#ffb0ac 30%,#ffe4be 52%,#8ee7ef 77%,#6097f6 100%);color:#143546;font-family:Golos,"Golos Text","Segoe UI",sans-serif;text-align:left;font-size:12px;line-height:1.35}
.mro-live *{box-sizing:border-box}.mro-live button{font:inherit;cursor:pointer}.mro-live button:focus-visible{outline:2px solid #167bb8;outline-offset:2px}
.mro-live__topline{display:flex;align-items:center;justify-content:space-between;gap:12px;min-height:28px;padding:0 3px 9px;color:#173e54}
.mro-live__sample{display:flex;align-items:center;gap:7px;padding:6px 11px;background:#fff9;border:1px solid #ffffff8c;border-radius:100px;font-size:11px}
.mro-live__pulse{width:7px;height:7px;border-radius:50%;background:#12a879;box-shadow:0 0 0 4px #20ba7540}
.mro-live__reset{display:flex;align-items:center;gap:6px;border:1px solid #fff8;background:#fff8;color:#335870;border-radius:8px;padding:6px 10px}
.mro-live__screen-tabs{display:none;align-items:center;gap:5px;padding:5px;background:#ffffffae;border-radius:11px;margin-bottom:10px}
.mro-live__screen-tabs button{flex:1;min-width:0;padding:9px 5px;border:0;border-radius:7px;background:transparent;color:#496b7b;font-weight:600}
.mro-live__screen-tabs button.is-active{background:#fff;color:#007bbd;box-shadow:0 2px 5px #21415117}
.mro-live__panels{display:grid;grid-template-columns:minmax(220px,.95fr) minmax(430px,2fr) minmax(230px,.95fr);gap:13px;align-items:stretch;min-height:416px;max-height:440px}
.mro-live__panel{min-width:0;min-height:0;background:#ffffffed;border:1px solid #d9e7ed;border-radius:12px;box-shadow:0 10px 24px #34617917;overflow:hidden;display:flex;flex-direction:column}
.mro-live__panel--summary,.mro-live__panel--orders{padding:14px;gap:13px}
.mro-live__panel-head{display:flex;align-items:center;gap:9px;min-height:32px;justify-content:space-between;font-size:14px}
.mro-live__panel-head>div{display:flex;align-items:center;gap:7px}
.mro-live__panel-head-note{font-size:10px;font-weight:600;color:#84a0ac}.mro-live__head-icon{color:#84a9bd}
.mro-live__brand{display:flex;align-items:center;gap:5px;white-space:nowrap;font-size:13px;font-weight:700}
.mro-live__brand-box{background:#079cd8;color:white;padding:2px 4px;border-radius:5px;font-size:10px;font-weight:800;letter-spacing:-.02em}
.mro-live__stats{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:6px}
.mro-live__stat{display:flex;flex-direction:column;gap:4px;min-width:0;min-height:95px;padding:10px 7px;background:#eef5f9;border-radius:10px}
.mro-live__stat>svg{color:#0997d8}.mro-live__stat--good>svg{color:#12a878}
.mro-live__stat>span{font-size:10px;color:#618296;min-height:25px}.mro-live__stat strong{font-size:25px;line-height:1;letter-spacing:-.05em}
.mro-live__activity{flex:1;background:#fff;border:1px solid #e1ebef;border-radius:11px;padding:12px 10px;min-height:0}
.mro-live__list-head{display:flex;justify-content:space-between;align-items:center;gap:8px;margin-bottom:9px;font-size:12px}.mro-live__list-head>span{font-size:10px;color:#789aaa}
.mro-live__activity-line{width:100%;display:grid;grid-template-columns:18px minmax(0,1fr);column-gap:7px;align-items:center;text-align:left;row-gap:1px;padding:8px 0;border:0;border-top:1px solid #eaf0f3;background:transparent;color:inherit}
.mro-live__activity-line>span{font-size:10px;font-weight:600}.mro-live__activity-line small{grid-column:2;color:#7793a0;font-size:9px}
.mro-live__success{color:#18a377}.mro-live__accent{color:#0799dd}.mro-live__warning{color:#e29e34}
.mro-live__summary-foot{display:flex;align-items:center;gap:9px;min-height:49px;padding:12px;border-radius:10px;background:linear-gradient(110deg,#e9f4fa,#d5eff8);font-weight:600}
.mro-live__summary-foot>svg{color:#1586b7}.mro-live__summary-foot>span{margin-left:auto;color:#1db985}
.mro-live__application{display:grid;grid-template-columns:48px minmax(0,1fr);flex:1;min-height:0}
.mro-live__app-rail{display:flex;align-items:center;flex-direction:column;gap:8px;padding:12px 6px;background:#f2f8fb;border-right:1px solid #e0ecf1}
.mro-live__rail-brand{margin-bottom:9px;font-size:11px}
.mro-live__app-rail button{display:flex;align-items:center;justify-content:center;width:34px;height:34px;background:transparent;border:0;color:#7899a9;border-radius:8px}
.mro-live__app-rail button.is-selected,.mro-live__app-rail button:hover{background:#dff0fd;color:#058dd0}
.mro-live__app-main{display:flex;flex-direction:column;min-width:0;padding:16px 17px 12px;gap:11px}
.mro-live__app-head>span{display:block;color:#7998a7;font-size:10px;margin-bottom:7px}
.mro-live__app-head>div{display:flex;align-items:center;gap:9px;font-size:19px;color:#163b51}
.mro-live__app-head svg{color:#078fcd}
.mro-live__view-tabs{display:flex;gap:6px;align-items:center;padding-bottom:10px;border-bottom:1px solid #e4eef3;white-space:nowrap;overflow-x:auto}
.mro-live__view-tabs button{border:1px solid transparent;padding:7px 10px;border-radius:7px;background:#f2f7fa;color:#517181;font-size:11px}
.mro-live__view-tabs button.is-active{border-color:#b9e2f8;color:#067eb5;background:#e5f5fe;font-weight:650}
.mro-live__tree-content,.mro-live__schedule,.mro-live__risks{flex:1;min-width:0;overflow:auto}
.mro-live__tree-title{display:flex;align-items:center;justify-content:space-between;gap:10px;margin:2px 0 9px;min-height:23px}
.mro-live__tree-title strong{font-size:12px}.mro-live__tree-title small{font-size:9px;color:#7999a7}
.mro-live__tree{display:grid;grid-template-columns:minmax(114px,.78fr) minmax(0,1.65fr);align-items:center;gap:10px;min-height:216px;border-radius:9px;padding:12px;background:radial-gradient(circle,#d5e5ed 0.75px,transparent 0.75px);background-size:13px 13px}
.mro-live__tree-root,.mro-live__shop{display:flex;align-items:center;gap:8px;min-width:0;padding:10px 8px;background:#fff;border:1px solid #dce8ee;border-radius:9px;box-shadow:0 2px 7px #35627d0c}
.mro-live__tree-root svg,.mro-live__shop svg{color:#148cd0;flex-shrink:0}
.mro-live__tree-root span,.mro-live__shop span{display:flex;flex-direction:column;min-width:0;gap:3px}
.mro-live__tree-root strong,.mro-live__shop strong{font-size:11px;overflow-wrap:anywhere}
.mro-live__tree-root small,.mro-live__shop small{font-size:9px;color:#7292a2}
.mro-live__branches{display:flex;flex-direction:column;gap:10px;padding-left:16px;border-left:2px solid #c5d9e2}
.mro-live__branch{display:grid;grid-template-columns:minmax(94px,.8fr) minmax(110px,1.25fr);gap:8px;align-items:center}
.mro-live__shop{min-height:55px}
.mro-live__equipment-list{display:flex;flex-direction:column;gap:5px}
.mro-live__asset{display:flex;align-items:center;gap:6px;min-width:0;width:100%;padding:7px;border:1px solid #e0eaf0;border-radius:8px;background:#fff;color:#234455;text-align:left;font-size:10px}
.mro-live__asset:hover,.mro-live__asset.is-selected{border-color:#4cade6;background:#eaf7ff}
.mro-live__asset svg{flex-shrink:0;color:#138ec4}.mro-live__asset>span:nth-child(2){min-width:0;overflow-wrap:anywhere}
.mro-live__status-dot{flex-shrink:0;width:7px;height:7px;margin-left:auto;border-radius:50%;background:#1ab37b}
.mro-live__status-dot[data-status="due"]{background:#e9ae3b}.mro-live__status-dot[data-status="fault"]{background:#ed6977}
.mro-live__asset-inspector{display:flex;justify-content:space-between;align-items:center;gap:10px;padding:9px 12px;margin-top:7px;background:#f2f8fa;border-radius:9px}
.mro-live__asset-inspector>span:first-child{display:flex;flex-direction:column;gap:3px;font-size:10px}
.mro-live__asset-inspector small{color:#658a9a;font-size:10px}
.mro-live__status{display:inline-block;flex-shrink:0;padding:5px 7px;border-radius:6px;font-size:9px;font-weight:650;white-space:nowrap;background:#e3f7ed;color:#137f58}
.mro-live__status[data-status="due"],.mro-live__status[data-status="moderate"],.mro-live__status[data-status="new"]{background:#fff2d9;color:#a97617}
.mro-live__status[data-status="fault"],.mro-live__status[data-status="critical"],.mro-live__status[data-status="overdue"]{background:#ffe5e9;color:#b53b57}
.mro-live__schedule-header,.mro-live__schedule-row{display:grid;grid-template-columns:minmax(116px,1.5fr) repeat(5,minmax(22px,1fr));gap:3px;align-items:center;position:relative}
.mro-live__schedule-header{background:#edf5f9;border-radius:7px;padding:9px 6px;font-size:10px;color:#5d7d8d}
.mro-live__schedule-header>span:not(:first-child){text-align:center}
.mro-live__schedule-row{min-height:44px;padding:3px 6px;border-bottom:1px solid #e4edf3;font-size:10px}
.mro-live__schedule-row>span:first-child{overflow-wrap:anywhere}
.mro-live__schedule-cell{height:24px;border-left:1px dashed #e0eaf0;grid-row:1}
.mro-live__schedule-bar{grid-row:1;position:relative;z-index:1;display:flex;align-items:center;justify-content:center;height:21px;border:1px solid #60b6ea;border-radius:5px;background:#b6e1fe;color:#086eaf;min-width:0}
.mro-live__risk-row{width:100%;display:flex;align-items:center;justify-content:space-between;gap:8px;border:0;border-bottom:1px solid #e1edf3;background:#fff;padding:12px;text-align:left}
.mro-live__risk-row>span:first-child{display:flex;align-items:center;gap:7px;font-size:11px;color:#244c5c}.mro-live__risk-row svg{color:#248cbb}
.mro-live__order-stats{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:6px}
.mro-live__order-stats>span{display:flex;align-items:center;flex-direction:column;gap:5px;min-width:0;padding:11px 4px;border-radius:9px;background:#edf5f9}
.mro-live__order-stats small{font-size:10px;color:#5d7d8d;text-align:center}.mro-live__order-stats strong{font-size:26px;line-height:1;color:#117cab}
.mro-live__order-stats .mro-live__overdue strong{color:#da5364}
.mro-live__order-filters{display:flex;gap:5px;overflow-x:auto}
.mro-live__order-filters button{flex-shrink:0;border:1px solid #dceaf0;border-radius:7px;padding:6px 7px;background:#fff;color:#597688;font-size:10px}
.mro-live__order-filters button.is-active{background:#e5f4fd;color:#007ebd;border-color:#9ed7f4}
.mro-live__order-list{min-height:0;flex:1;overflow-y:auto;border:1px solid #e1eaf0;border-radius:9px}
.mro-live__order-heading{display:flex;justify-content:space-between;gap:5px;background:#edf5f9;padding:8px;color:#678594;font-size:10px}
.mro-live__order-row{display:flex;align-items:center;justify-content:space-between;gap:5px;width:100%;padding:11px 8px;border:0;border-top:1px solid #e5edf1;background:#fff;text-align:left;color:#244556}
.mro-live__order-row:hover{background:#eef8fe}.mro-live__order-row>span:first-child{display:flex;flex-direction:column;min-width:0;gap:4px}
.mro-live__order-row strong{font-size:11px}.mro-live__order-row small{font-size:9px;color:#75919e}
.mro-live__empty{padding:12px;color:#7494a0}
.mro-live__disclaimer{margin:0;color:#7594a4;font-size:9px;line-height:1.3}
@media(max-width:1180px){
 .mro-live__screen-tabs{display:flex}
 .mro-live__panels{display:block;height:475px;max-height:none;min-height:0}
 .mro-live__panel{display:none;height:100%}
 .mro-live__panel.is-current{display:flex}
 .mro-live__app-main{padding:17px 20px}
 .mro-live__tree{grid-template-columns:minmax(130px,.6fr) minmax(0,1.4fr)}
 .mro-live__branch{grid-template-columns:minmax(125px,.7fr) minmax(0,1.3fr)}
}
@media(max-width:620px){
 .mro-live{padding:9px 9px 12px;border-radius:12px}
 .mro-live__topline{align-items:center}
 .mro-live__sample{font-size:9px;padding:6px 8px}
 .mro-live__panels{height:490px}
 .mro-live__app-rail{width:40px;padding:11px 3px}
 .mro-live__application{grid-template-columns:40px minmax(0,1fr)}
 .mro-live__rail-brand{flex-direction:column;font-size:9px}
 .mro-live__app-main{padding:13px 11px}
 .mro-live__app-head>div{font-size:16px}
 .mro-live__view-tabs button{padding:7px}
 .mro-live__tree-title{flex-direction:column;align-items:flex-start;gap:2px}
 .mro-live__tree{display:block;padding:10px}
 .mro-live__tree-root{margin-bottom:10px}
 .mro-live__branches{padding-left:9px}
 .mro-live__branch{grid-template-columns:minmax(0,1fr);gap:5px}
 .mro-live__equipment-list{padding-left:10px}
 .mro-live__summary-foot{margin-top:auto}
 .mro-live__panel--summary,.mro-live__panel--orders{padding:12px;gap:10px}
}
@media(prefers-reduced-motion:reduce){.mro-live__pulse{box-shadow:none}}
</style>

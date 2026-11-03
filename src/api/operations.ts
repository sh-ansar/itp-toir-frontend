import { api } from './client'
import { usePreviewStore } from '../stores/preview'
import type { ToirRecord } from '../types/toir'

export interface AssetNode extends ToirRecord {
  node_type?:string
  criticality?:number
  condition_score?:number|null
  operating_hours?:string|number
  condition_recorded_at?:string|null
}
export interface RiskNode {
  id:number;parent_id:number|null;name:string;code:string;node_type:string
  status:string;criticality:number;condition_score:number|null
  operating_hours:number;own_score:number;score:number
  level:'low'|'medium'|'high'|'critical'
  reasons:string[];data_quality:string[]
  highest_risk_descendant_id:number|null
  children_count:number
  risk_method:string
}
export interface RiskResponse {
  data:RiskNode[]
  summary:{critical:number;high:number;medium:number;low:number;incomplete_data:number}
  method:string;as_of:string;disclaimer:string
}
export interface MeterReading {
  id:number;asset_id:number;meter:'operating_hours'|'condition_score'
  value:string;recorded_at:string;source:string;note:string|null
}
export interface CrewMember {id:number;name:string;position:string|null;status:string;user_id?:number|null}
export interface Crew {
  id:number;name:string;code:string;status:string
  lead_employee_id:number|null;lead?:CrewMember|null
  members:CrewMember[];shifts_count:number
}
export interface CrewShift {
  id:number;crew_id:number;work_date:string;starts_at:string
  ends_at:string;note:string|null;status:string;crew?:Crew
}
export interface ForecastRow {
  plan_id:number;title:string;asset_id:number;asset_name:string;asset_code:string
  date:string;due:'overdue'|'soon'|'future';trigger:'calendar'|'operating_hours'
  crew_id:number|null;crew_name:string|null
  employee_id:number|null;employee_name:string|null
  priority:number;duration_minutes:number;estimated:boolean
  hours_remaining?:number;daily_hours_estimate?:number|null
}
export interface GenerateResult {
  created:number;existing:number;blocked:{plan_id?:number;date:string;reason:string}[]
  created_orders?:number[];preview?:boolean
}

const demoNodes:AssetNode[]=[
  {id:101,company_id:1,parent_id:null,name:'Насосная станция №1',code:'ST-001',category:'premises',node_type:'object',status:'active',criticality:4,condition_score:null,operating_hours:0},
  {id:102,company_id:1,parent_id:101,name:'Линия перекачки А',code:'LINE-A',category:'equipment',node_type:'system',status:'active',criticality:4,condition_score:null,operating_hours:0},
  {id:103,company_id:1,parent_id:102,name:'Насос Н-101',code:'P-101',category:'equipment',node_type:'aggregate',status:'active',criticality:5,condition_score:43,operating_hours:8350},
  {id:104,company_id:1,parent_id:103,name:'Электродвигатель 75 кВт',code:'M-101',category:'equipment',node_type:'assembly',status:'active',criticality:4,condition_score:71,operating_hours:8300},
  {id:105,company_id:1,parent_id:103,name:'Подшипниковый узел',code:'BR-101',category:'equipment',node_type:'component',status:'maintenance',criticality:5,condition_score:28,operating_hours:8347},
  {id:106,company_id:1,parent_id:103,name:'Торцевое уплотнение',code:'SL-101',category:'equipment',node_type:'component',status:'active',criticality:3,condition_score:82,operating_hours:8310},
  {id:107,company_id:1,parent_id:102,name:'Насос Н-102',code:'P-102',category:'equipment',node_type:'aggregate',status:'active',criticality:3,condition_score:89,operating_hours:3900},
  {id:108,company_id:1,parent_id:null,name:'Компрессорный цех',code:'CS-002',category:'premises',node_type:'object',status:'active',criticality:4,condition_score:null,operating_hours:0},
  {id:109,company_id:1,parent_id:108,name:'Компрессор К-7',code:'C-007',category:'equipment',node_type:'aggregate',status:'active',criticality:4,condition_score:57,operating_hours:6600},
]
const reasonMap:Record<number,string[]>={
  105:['Низкая оценка состояния','Просрочен регламент проверки подшипника','Есть открытый аварийный наряд'],
  103:['Приближается ТО по наработке','Унаследованный риск дочернего узла'],
  101:['Унаследованный риск дочернего узла'],102:['Унаследованный риск дочернего узла'],
  109:['Низкая оценка состояния','Следующее ТО в течение 7 дней'],
  108:['Унаследованный риск дочернего узла'],
}
const scores:Record<number,number>={101:81,102:87,103:91,104:39,105:96,106:19,107:15,108:54,109:60}
const todayKey=(offset=0)=>{
  const d=new Date();d.setDate(d.getDate()+offset)
  return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0')
}
const demoCrews:Crew[]=[
  {id:101,name:'Механическая бригада №1',code:'MECH-01',status:'active',lead_employee_id:11,
    members:[{id:11,name:'Александр Петров',position:'Мастер',status:'active'},
      {id:12,name:'Дмитрий Ковалёв',position:'Механик',status:'active'}],shifts_count:12},
  {id:102,name:'Электротехническая бригада',code:'ELEC-01',status:'active',lead_employee_id:13,
    members:[{id:13,name:'Игорь Сергеев',position:'Электромонтёр',status:'active'}],shifts_count:8},
]
const demoForecast:ForecastRow[]=[
  {plan_id:111,title:'Диагностика подшипников',asset_id:105,asset_name:'Подшипниковый узел',
    asset_code:'BR-101',date:todayKey(-2),due:'overdue',trigger:'calendar',crew_id:101,
    crew_name:'Механическая бригада №1',employee_id:null,employee_name:null,
    priority:5,duration_minutes:180,estimated:false},
  {plan_id:112,title:'ТО насоса Н-101 (250 моточасов)',asset_id:103,asset_name:'Насос Н-101',
    asset_code:'P-101',date:todayKey(3),due:'soon',trigger:'operating_hours',crew_id:101,
    crew_name:'Механическая бригада №1',employee_id:null,employee_name:null,
    priority:4,duration_minutes:240,estimated:true,hours_remaining:21,daily_hours_estimate:7},
  {plan_id:113,title:'Регламентный осмотр двигателя',asset_id:104,asset_name:'Электродвигатель 75 кВт',
    asset_code:'M-101',date:todayKey(8),due:'future',trigger:'calendar',crew_id:102,
    crew_name:'Электротехническая бригада',employee_id:null,employee_name:null,
    priority:3,duration_minutes:120,estimated:false},
]
const demoShifts:CrewShift[]=Array.from({length:8},(_,i)=>({
  id:1000+i,crew_id:i%2?102:101,work_date:todayKey(i),
  starts_at:'08:00:00',ends_at:'17:00:00',status:'confirmed',note:null,
  crew:demoCrews[i%2?1:0]
}))

function demoRisk():RiskResponse{
  const data:RiskNode[]=demoNodes.map(a=>{
    const score=scores[a.id]??24
    return {id:a.id,parent_id:a.parent_id??null,name:a.name||'',code:a.code||'',
      node_type:a.node_type||'equipment',status:a.status||'active',criticality:a.criticality||3,
      condition_score:a.condition_score??null,operating_hours:Number(a.operating_hours||0),
      own_score:score,score,level:score>=80?'critical':score>=60?'high':score>=30?'medium':'low',
      reasons:reasonMap[a.id]||['Наблюдение в пределах регламента'],
      data_quality:a.condition_score==null?['condition_missing']:[],
      highest_risk_descendant_id:[101,102,103].includes(a.id)?105:null,
      children_count:demoNodes.filter(i=>i.parent_id===a.id).length,
      risk_method:'transparent_rules_v1'}
  })
  data.sort((a,b)=>b.score-a.score)
  return {data,summary:{critical:data.filter(a=>a.level==='critical').length,
    high:data.filter(a=>a.level==='high').length,
    medium:data.filter(a=>a.level==='medium').length,
    low:data.filter(a=>a.level==='low').length,
    incomplete_data:data.filter(a=>a.data_quality.length>0).length},
    method:'transparent_rules_v1',as_of:new Date().toISOString(),
    disclaimer:'Демо-оценка по правилам, не вероятность отказа и не обученная ML-модель.'}
}
const deny=()=>{if(usePreviewStore().enabled)throw new Error('В режиме макета операции не сохраняются.')}

export async function getAssetTree():Promise<AssetNode[]>{
  if(usePreviewStore().enabled)return demoNodes
  return (await api<{data:AssetNode[]}>('/api/v1/operations/asset-tree')).data
}
export async function getRisks():Promise<RiskResponse>{
  if(usePreviewStore().enabled)return demoRisk()
  return api('/api/v1/operations/risk')
}
export async function getForecast(days=60):Promise<{data:ForecastRow[];range:{from:string;to:string};method:string;disclaimer:string}>{
  if(usePreviewStore().enabled)return {data:demoForecast,range:{from:todayKey(),to:todayKey(days)},
    method:'demo',disclaimer:'Демонстрационные прогнозные даты.'}
  return api('/api/v1/operations/forecast?days='+days)
}
export async function getReadings(id:number):Promise<MeterReading[]>{
  if(usePreviewStore().enabled)return [{id:1,asset_id:id,meter:'condition_score',
    value:String(demoNodes.find(x=>x.id===id)?.condition_score||70),
    recorded_at:new Date().toISOString(),note:null,source:'manual'}]
  return (await api<{data:MeterReading[]}>('/api/v1/operations/assets/'+id+'/readings')).data
}
export async function recordReading(id:number,meter:MeterReading['meter'],value:number,note:string):Promise<MeterReading>{
  deny()
  return (await api<{data:MeterReading}>('/api/v1/operations/assets/'+id+'/readings',{
    method:'POST',body:{meter,value,note:note.trim()||null,recorded_at:new Date().toISOString()}
  })).data
}
export async function getCrews():Promise<Crew[]>{
  if(usePreviewStore().enabled)return demoCrews
  return (await api<{data:Crew[]}>('/api/v1/operations/crews')).data
}
export async function createCrew(data:{name:string;code:string;lead_employee_id:number|null}):Promise<Crew>{
  deny();return (await api<{data:Crew}>('/api/v1/operations/crews',{method:'POST',body:data})).data
}
export async function addCrewMember(crewId:number,employee_id:number):Promise<Crew>{
  deny();return (await api<{data:Crew}>('/api/v1/operations/crews/'+crewId+'/members',{
    method:'POST',body:{employee_id}
  })).data
}
export async function removeCrewMember(crewId:number,employeeId:number):Promise<Crew>{
  deny();return (await api<{data:Crew}>('/api/v1/operations/crews/'+crewId+'/members/'+employeeId,{
    method:'DELETE'
  })).data
}
export async function getShifts(from:string,to:string):Promise<CrewShift[]>{
  if(usePreviewStore().enabled)return demoShifts.filter(x=>x.work_date>=from&&x.work_date<=to)
  return (await api<{data:CrewShift[]}>('/api/v1/operations/shifts?from='+from+'&to='+to)).data
}
export async function createRecurringShifts(data:{
  crew_id:number;from:string;to:string;weekdays:number[];starts_at:string;ends_at:string;note?:string
}):Promise<{created:number;existing:number;blocked:{date:string;reason:string}[]}>{
  deny();return (await api<{data:{created:number;existing:number;blocked:{date:string;reason:string}[]}}>(
    '/api/v1/operations/shifts/generate',{method:'POST',body:data})).data
}
export async function removeShift(id:number):Promise<void>{
  deny();await api('/api/v1/operations/shifts/'+id,{method:'DELETE'})
}
export async function generateOrders(days:number,dry_run=true):Promise<GenerateResult>{
  deny();return (await api<{data:GenerateResult}>('/api/v1/operations/generate',{
    method:'POST',body:{days,dry_run}
  })).data
}

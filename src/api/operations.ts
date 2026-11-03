import { api } from './client'
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

export async function getAssetTree():Promise<AssetNode[]>{
  return (await api<{data:AssetNode[]}>('/api/v1/operations/asset-tree')).data
}
export async function getRisks():Promise<RiskResponse>{
  return api('/api/v1/operations/risk')
}
export async function getForecast(days=60):Promise<{data:ForecastRow[];range:{from:string;to:string};method:string;disclaimer:string}>{
  return api('/api/v1/operations/forecast?days='+days)
}
export async function getReadings(id:number):Promise<MeterReading[]>{
  return (await api<{data:MeterReading[]}>('/api/v1/operations/assets/'+id+'/readings')).data
}
export async function recordReading(id:number,meter:MeterReading['meter'],value:number,note:string):Promise<MeterReading>{
  return (await api<{data:MeterReading}>('/api/v1/operations/assets/'+id+'/readings',{
    method:'POST',body:{meter,value,note:note.trim()||null,recorded_at:new Date().toISOString()}
  })).data
}
export async function getCrews():Promise<Crew[]>{
  return (await api<{data:Crew[]}>('/api/v1/operations/crews')).data
}
export async function createCrew(data:{name:string;code:string;lead_employee_id:number|null}):Promise<Crew>{
  return (await api<{data:Crew}>('/api/v1/operations/crews',{method:'POST',body:data})).data
}
export async function addCrewMember(crewId:number,employee_id:number):Promise<Crew>{
  return (await api<{data:Crew}>('/api/v1/operations/crews/'+crewId+'/members',{
    method:'POST',body:{employee_id}
  })).data
}
export async function removeCrewMember(crewId:number,employeeId:number):Promise<Crew>{
  return (await api<{data:Crew}>('/api/v1/operations/crews/'+crewId+'/members/'+employeeId,{
    method:'DELETE'
  })).data
}
export async function getShifts(from:string,to:string):Promise<CrewShift[]>{
  return (await api<{data:CrewShift[]}>('/api/v1/operations/shifts?from='+from+'&to='+to)).data
}
export async function createRecurringShifts(data:{
  crew_id:number;from:string;to:string;weekdays:number[];starts_at:string;ends_at:string;note?:string
}):Promise<{created:number;existing:number;blocked:{date:string;reason:string}[]}>{
  return (await api<{data:{created:number;existing:number;blocked:{date:string;reason:string}[]}}>(
    '/api/v1/operations/shifts/generate',{method:'POST',body:data})).data
}
export async function removeShift(id:number):Promise<void>{
  await api('/api/v1/operations/shifts/'+id,{method:'DELETE'})
}
export async function generateOrders(days:number,dry_run=true):Promise<GenerateResult>{
  return (await api<{data:GenerateResult}>('/api/v1/operations/generate',{
    method:'POST',body:{days,dry_run}
  })).data
}

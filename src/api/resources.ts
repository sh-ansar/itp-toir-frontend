import { api } from './client'
import type { Overview, PageMeta, ResourceName, ScheduleResponse, ToirRecord } from '../types/toir'

export interface ResourceQuery {
  search?: string
  status?: string
  category?: string
  asset_id?: number
  employee_id?: number
  maintenance_plan_id?: number
  page?: number
  per_page?: number
}

export async function listResources(
  resource:ResourceName, filters:ResourceQuery = {}
):Promise<{data:ToirRecord[];meta:PageMeta}> {
  const query = new URLSearchParams()
  for (const [key, value] of Object.entries(filters)) {
    if (value !== undefined && value !== null && value !== '') query.set(key, String(value))
  }
  const suffix=query.size>0?'?'+query.toString():''
  return api('/api/v1/resources/'+resource+suffix)
}
export interface AssetPassport {
  asset: ToirRecord
  summary: { total_orders:number; completed_orders:number; open_orders:number; plan_count:number; reading_count:number }
  orders: ToirRecord[]
  plans: ToirRecord[]
  readings: Array<{id:number;meter:string;value:number;recorded_at:string;note?:string|null}>
}
export async function loadAssetPassport(id:number):Promise<AssetPassport> {
  const result=await api<{data:AssetPassport}>('/api/v1/assets/'+id+'/passport')
  return result.data
}
export async function loadResource(resource:ResourceName,id:number):Promise<ToirRecord> {
  const result=await api<{data:ToirRecord}>('/api/v1/resources/'+resource+'/'+id)
  return result.data
}

export async function createResource(resource:ResourceName,payload:Record<string,unknown>):Promise<ToirRecord>{
  const result=await api<{data:ToirRecord}>('/api/v1/resources/'+resource,{method:'POST',body:payload})
  return result.data
}
export async function updateResource(resource:ResourceName,id:number,payload:Record<string,unknown>):Promise<ToirRecord>{
  const result=await api<{data:ToirRecord}>('/api/v1/resources/'+resource+'/'+id,{method:'PATCH',body:payload})
  return result.data
}
export async function deleteResource(resource:ResourceName,id:number):Promise<void>{
  await api('/api/v1/resources/'+resource+'/'+id,{method:'DELETE'})
}
export async function reportAssetFault(id:number,payload:{title:string;description:string;priority:'normal'|'high'|'critical'}):Promise<ToirRecord>{
  const result=await api<{data:ToirRecord}>('/api/v1/assets/'+id+'/faults',{method:'POST',body:payload})
  return result.data
}
export async function dispatchWorkOrder(id:number,payload:{employee_id:number;planned_start?:string;planned_end?:string;comment?:string}):Promise<ToirRecord>{
  const result=await api<{data:ToirRecord}>('/api/v1/work-orders/'+id+'/dispatch',{method:'POST',body:payload})
  return result.data
}
export async function reviewWorkOrder(id:number,decision:'accept'|'reject',comment:string):Promise<ToirRecord>{
  const result=await api<{data:ToirRecord}>('/api/v1/work-orders/'+id+'/review',{method:'POST',body:{decision,comment}})
  return result.data
}
export interface WorkControlSummary {open_orders:number;late_orders:number;unassigned_orders:number;awaiting_acceptance:number;recorded_material_cost:number;recorded_labor_minutes:number;orders_with_labor_recorded:number}
export interface WorkControl {summary:WorkControlSummary;orders:Array<ToirRecord & {is_late:boolean;actual_material_cost?:string|number|null}>;limit:number}
export async function loadWorkControl():Promise<WorkControl>{
  const result=await api<{data:WorkControl}>('/api/v1/operations/work-control')
  return result.data
}
export type WorkOrderAction = 'start' | 'complete' | 'reopen'

export async function transitionWorkOrder(
  id:number, action:WorkOrderAction, comment?:string, actualLaborMinutes?:number
):Promise<ToirRecord> {
  const result=await api<{data:ToirRecord}>('/api/v1/work-orders/'+id+'/transition',{
    method:'POST',body:{action,comment:comment||null,...(actualLaborMinutes===undefined?{}:{actual_labor_minutes:actualLaborMinutes})}
  })
  return result.data
}

export async function issuePlanOrder(id:number):Promise<{data:ToirRecord;created:boolean}> {
  return api('/api/v1/plans/'+id+'/issue',{method:'POST',body:{}})
}

export async function loadOverview():Promise<Overview>{
  const result=await api<{data:Overview}>('/api/v1/overview')
  return result.data
}
export async function loadSchedule(range?:{from:string;to:string}):Promise<ScheduleResponse>{
  const query=range?'?'+new URLSearchParams(range).toString():''
  const result=await api<{data:ScheduleResponse}>('/api/v1/schedule'+query)
  return result.data
}

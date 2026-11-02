import { api } from './client'
import { usePreviewStore } from '../stores/preview'
import { demoFind, demoList, demoOverview, demoSchedule } from '../demo/toirDemo'
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
  if(usePreviewStore().enabled)return demoList(resource,filters)
  const query = new URLSearchParams()
  for (const [key, value] of Object.entries(filters)) {
    if (value !== undefined && value !== null && value !== '') query.set(key, String(value))
  }
  const suffix=query.size>0?'?'+query.toString():''
  return api('/api/v1/resources/'+resource+suffix)
}
export async function loadResource(resource:ResourceName,id:number):Promise<ToirRecord> {
  if(usePreviewStore().enabled)return demoFind(resource,id)
  const result=await api<{data:ToirRecord}>('/api/v1/resources/'+resource+'/'+id)
  return result.data
}
function assertWriteAllowed():void {
  if(usePreviewStore().enabled)throw new Error('Демо-режим не сохраняет изменения. Отключите просмотр макета для работы с реальными записями.')
}
export async function createResource(resource:ResourceName,payload:Record<string,unknown>):Promise<ToirRecord>{
  assertWriteAllowed()
  const result=await api<{data:ToirRecord}>('/api/v1/resources/'+resource,{method:'POST',body:payload})
  return result.data
}
export async function updateResource(resource:ResourceName,id:number,payload:Record<string,unknown>):Promise<ToirRecord>{
  assertWriteAllowed()
  const result=await api<{data:ToirRecord}>('/api/v1/resources/'+resource+'/'+id,{method:'PATCH',body:payload})
  return result.data
}
export async function deleteResource(resource:ResourceName,id:number):Promise<void>{
  assertWriteAllowed()
  await api('/api/v1/resources/'+resource+'/'+id,{method:'DELETE'})
}
export type WorkOrderAction = 'start' | 'complete' | 'reopen'

export async function transitionWorkOrder(
  id:number, action:WorkOrderAction, comment?:string
):Promise<ToirRecord> {
  assertWriteAllowed()
  const result=await api<{data:ToirRecord}>('/api/v1/work-orders/'+id+'/transition',{
    method:'POST',body:{action,comment:comment||null}
  })
  return result.data
}

export async function issuePlanOrder(id:number):Promise<{data:ToirRecord;created:boolean}> {
  assertWriteAllowed()
  return api('/api/v1/plans/'+id+'/issue',{method:'POST',body:{}})
}

export async function loadOverview():Promise<Overview>{
  if(usePreviewStore().enabled)return demoOverview()
  const result=await api<{data:Overview}>('/api/v1/overview')
  return result.data
}
export async function loadSchedule():Promise<ScheduleResponse>{
  if(usePreviewStore().enabled)return demoSchedule()
  const result=await api<{data:ScheduleResponse}>('/api/v1/schedule')
  return result.data
}

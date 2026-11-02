import { api } from './client'
import type { Overview, PageMeta, ResourceName, ScheduleResponse, ToirRecord } from '../types/toir'

export interface ResourceQuery {
  search?: string
  status?: string
  category?: string
  asset_id?: number
  employee_id?: number
  page?: number
  per_page?: number
}

export async function listResources(resource: ResourceName, filters: ResourceQuery = {}):
Promise<{ data:ToirRecord[]; meta:PageMeta }> {
  const query = new URLSearchParams()
  for (const [key, value] of Object.entries(filters)) {
    if (value !== undefined && value !== null && value !== '') query.set(key, String(value))
  }
  const suffix = query.size > 0 ? '?' + query.toString() : ''
  return api('/api/v1/resources/' + resource + suffix)
}
export async function loadResource(resource: ResourceName, id: number): Promise<ToirRecord> {
  const response = await api<{data:ToirRecord}>('/api/v1/resources/'+resource+'/'+id)
  return response.data
}
export async function createResource(resource: ResourceName, payload:Record<string,unknown>): Promise<ToirRecord> {
  const result = await api<{data:ToirRecord}>('/api/v1/resources/'+resource,{method:'POST',body:payload})
  return result.data
}
export async function updateResource(resource: ResourceName, id:number, payload:Record<string,unknown>):Promise<ToirRecord> {
  const result = await api<{data:ToirRecord}>('/api/v1/resources/'+resource+'/'+id,{method:'PATCH',body:payload})
  return result.data
}
export async function deleteResource(resource: ResourceName,id:number):Promise<void> {
  await api('/api/v1/resources/'+resource+'/'+id,{method:'DELETE'})
}
export async function loadOverview():Promise<Overview> {
  const result=await api<{data:Overview}>('/api/v1/overview')
  return result.data
}
export async function loadSchedule():Promise<ScheduleResponse> {
  const result=await api<{data:ScheduleResponse}>('/api/v1/schedule')
  return result.data
}

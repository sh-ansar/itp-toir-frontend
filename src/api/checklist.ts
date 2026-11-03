import { api } from './client'

export type StepKind = 'inspection'|'service'|'safety'|'measurement'
export type StepStatus = 'pending'|'done'|'skipped'
export interface TemplateStep {
  id:number
  company_id:number
  maintenance_plan_id:number
  position:number
  title:string
  instructions:string|null
  kind:StepKind
  is_required:boolean
  unit:string|null
}
export interface WorkStep extends Omit<TemplateStep,'maintenance_plan_id'> {
  work_order_id:number
  maintenance_step_id:number|null
  status:StepStatus
  numeric_value:string|null
  comment:string|null
  performed_by:number|null
  performed_at:string|null
  performer?:{id:number;name:string}|null
}
export interface StepDefinition {
  title:string
  kind:StepKind
  is_required:boolean
  unit:string|null
  instructions:string|null
}
export interface StepResult {
  status:StepStatus
  numeric_value:number|null
  comment:string|null
}
export async function getPlanSteps(id:number):Promise<TemplateStep[]>{
  return (await api<{data:TemplateStep[]}>('/api/v1/plans/'+id+'/checklist')).data
}
export async function createPlanStep(id:number,definition:StepDefinition):Promise<TemplateStep>{
  return (await api<{data:TemplateStep}>('/api/v1/plans/'+id+'/checklist',{
    method:'POST',body:definition,
  })).data
}
export async function updatePlanStep(id:number,stepId:number,definition:StepDefinition):Promise<TemplateStep>{
  return (await api<{data:TemplateStep}>('/api/v1/plans/'+id+'/checklist/'+stepId,{
    method:'PATCH',body:definition,
  })).data
}
export async function deletePlanStep(id:number,stepId:number):Promise<void>{
  await api('/api/v1/plans/'+id+'/checklist/'+stepId,{method:'DELETE'})
}
export async function getOrderSteps(id:number):Promise<WorkStep[]>{
  return (await api<{data:WorkStep[]}>('/api/v1/work-orders/'+id+'/checklist')).data
}
export async function recordWorkStep(id:number,stepId:number,data:StepResult):Promise<WorkStep>{
  return (await api<{data:WorkStep}>('/api/v1/work-orders/'+id+'/checklist/'+stepId,{
    method:'PATCH',body:data,
  })).data
}

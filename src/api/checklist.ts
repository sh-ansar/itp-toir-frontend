import { api } from './client'
import { usePreviewStore } from '../stores/preview'

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
const demoDefinitions:StepDefinition[]=[
  {title:'Проверить и подтвердить блокировку питания',kind:'safety',is_required:true,
    instructions:'Перед вскрытием узла убедитесь в безопасном отключении оборудования.',unit:null},
  {title:'Измерить вибрацию подшипников',kind:'measurement',is_required:true,
    instructions:'Измерить уровень вибрации в зоне крепления подшипников.',unit:'мм/с'},
  {title:'Очистить защитный кожух',kind:'service',is_required:false,
    instructions:'При необходимости удалить загрязнение с кожуха.',unit:null},
]
function demoTemplate(id:number):TemplateStep[]{
  return demoDefinitions.map((s,i)=>({...s,id:901+i,company_id:1,maintenance_plan_id:id,
    position:i+1}))
}
function demoWork(id:number):WorkStep[]{
  return demoDefinitions.map((s,i)=>({...s,id:951+i,company_id:1,work_order_id:id,
    position:i+1,maintenance_step_id:901+i,
    status:i===0?'done':'pending',numeric_value:null,
    comment:i===0?'Питание отключено, допуск подтверждён.':null,
    performed_by:i===0?101:null,performed_at:i===0?new Date().toISOString():null,
    performer:i===0?{id:101,name:'Александр Петров'}:null}))
}
function previewError(){throw new Error('В демонстрационном режиме данные не изменяются.')}

export async function getPlanSteps(id:number):Promise<TemplateStep[]>{
  if(usePreviewStore().enabled)return demoTemplate(id)
  return (await api<{data:TemplateStep[]}>('/api/v1/plans/'+id+'/checklist')).data
}
export async function createPlanStep(id:number,definition:StepDefinition):Promise<TemplateStep>{
  if(usePreviewStore().enabled)previewError()
  return (await api<{data:TemplateStep}>('/api/v1/plans/'+id+'/checklist',{
    method:'POST',body:definition,
  })).data
}
export async function updatePlanStep(id:number,stepId:number,definition:StepDefinition):Promise<TemplateStep>{
  if(usePreviewStore().enabled)previewError()
  return (await api<{data:TemplateStep}>('/api/v1/plans/'+id+'/checklist/'+stepId,{
    method:'PATCH',body:definition,
  })).data
}
export async function deletePlanStep(id:number,stepId:number):Promise<void>{
  if(usePreviewStore().enabled)previewError()
  await api('/api/v1/plans/'+id+'/checklist/'+stepId,{method:'DELETE'})
}
export async function getOrderSteps(id:number):Promise<WorkStep[]>{
  if(usePreviewStore().enabled)return demoWork(id)
  return (await api<{data:WorkStep[]}>('/api/v1/work-orders/'+id+'/checklist')).data
}
export async function recordWorkStep(id:number,stepId:number,data:StepResult):Promise<WorkStep>{
  if(usePreviewStore().enabled)previewError()
  return (await api<{data:WorkStep}>('/api/v1/work-orders/'+id+'/checklist/'+stepId,{
    method:'PATCH',body:data,
  })).data
}

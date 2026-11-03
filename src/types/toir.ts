export type ResourceName = 'assets' | 'employees' | 'projects' | 'work-orders' | 'plans' | 'supplies' | 'tenders'
export type RecordValue = string | number | boolean | null | undefined
export interface ToirRecord {
  id: number
  company_id: number
  user_id?: number | null
  maintenance_plan_id?: number | null
  scheduled_for?: string | null
  name?: string
  code?: string
  title?: string
  number?: string
  status?: string
  category?: string
  type?: string
  description?: string
  location?: string
  email?: string
  position?: string
  department?: string
  phone?: string
  manager_name?: string
  asset_id?: number
  employee_id?: number
  crew_id?: number | null
  project_id?: number
  parent_id?: number | null
  serial_number?: string
  manufacturer?: string
  model?: string
  commissioned_at?: string
  purchase_value?: string
  periodicity_days?: number
  duration_minutes?: number|null
  priority?: number
  interval_hours?: number|null
  next_due_hours?: number|null
  node_type?: string
  criticality?: number
  condition_score?: number|null
  operating_hours?: string|number
  work_instructions?: string
  safety_instructions?: string
  next_due_date?: string
  start_date?: string
  end_date?: string
  planned_start?: string
  planned_end?: string
  actual_start?: string
  actual_end?: string
  estimated_cost?: string
  requested_at?: string
  quantity?: string
  unit?: string
  unit_price?: string
  budget?: string
  deadline_at?: string
  asset?: ToirRecord | null
  employee?: ToirRecord | null
  crew?: ToirRecord | null
  project?: ToirRecord | null
  parent?: ToirRecord | null
  maintenance_plan?: ToirRecord | null
  events?: Array<{ id:number; action:string; message:string|null; changes:Record<string,unknown>|null; created_at:string }>
  created_at?: string
  updated_at?: string
  [key:string]: unknown
}
export interface PageMeta {
  total: number
  current_page: number
  last_page: number
  per_page: number
}
export interface RegistryResponse {
  data: ToirRecord[]
  meta: PageMeta
}
export interface Overview {
  assets: number; employees: number; projects: number; work_orders: number
  waiting: number; in_progress: number; overdue: number; closed: number
  plans: number; plans_overdue: number; supplies_requested: number; tenders: number
}
export interface ScheduleResponse {
  orders: ToirRecord[]
  plans: ToirRecord[]
}

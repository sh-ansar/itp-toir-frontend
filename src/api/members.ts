import { api } from './client'

export type MemberRole='owner'|'admin'|'manager'|'engineer'|'technician'|'viewer'
export interface CompanyMember {
  id:number
  name:string
  email:string
  role:MemberRole
  membership_active:boolean
  account_active:boolean
  email_verified:boolean
}
export async function listCompanyMembers():Promise<CompanyMember[]>{
  const r=await api<{data:CompanyMember[]}>('/api/v1/company/members')
  return r.data
}
export async function inviteCompanyMember(data:{name:string;email:string;role:MemberRole}):Promise<void>{
  await api('/api/v1/company/members',{method:'POST',body:data})
}
export async function changeCompanyMember(id:number,data:{role:MemberRole;membership_active:boolean}):Promise<void>{
  await api('/api/v1/company/members/'+id,{method:'PATCH',body:data})
}
export async function resendCompanyInvite(id:number):Promise<void>{
  await api('/api/v1/company/members/'+id+'/resend',{method:'POST',body:{}})
}

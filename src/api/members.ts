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
export async function getCompanyMailStatus():Promise<{delivery_enabled:boolean}>{
  const r=await api<{data:{delivery_enabled:boolean}}>('/api/v1/company/members/mail-status')
  return r.data
}
export async function listCompanyMembers():Promise<CompanyMember[]>{
  const r=await api<{data:CompanyMember[]}>('/api/v1/company/members')
  return r.data
}
export interface CompanyInvitationResult { email_sent:boolean; message:string }
export async function inviteCompanyMember(
  data:{name:string;email:string;role:MemberRole}
):Promise<CompanyInvitationResult>{
  const response=await api<{data?:{email_sent?:boolean};message?:string}>(
    '/api/v1/company/members',{method:'POST',body:data}
  )
  return {email_sent:response.data?.email_sent===true,message:response.message||''}
}
export async function changeCompanyMember(id:number,data:{role:MemberRole;membership_active:boolean}):Promise<void>{
  await api('/api/v1/company/members/'+id,{method:'PATCH',body:data})
}
export async function resendCompanyInvite(id:number):Promise<void>{
  await api('/api/v1/company/members/'+id+'/resend',{method:'POST',body:{}})
}

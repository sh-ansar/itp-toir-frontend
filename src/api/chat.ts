import { api } from './client'

export interface ChatMember {id:number;name:string;is_admin:boolean}
export interface ChatInfo {
  id:number;kind:'direct'|'channel';title:string;is_admin:boolean
  archived:boolean;members:ChatMember[];unread_count:number
  last_message:{body:string;created_at:string;user_id:number}|null
  updated_at:string
}
export interface ChatMessage {
  id:number;chat_id:number;user_id:number;sender_name:string;body:string
  reply_to_id:number|null;reply_preview:string|null
  deleted:boolean;edited_at:string|null;created_at:string
  total_recipients:number;delivered_count:number;read_count:number
}
export interface ChatUser {id:number;name:string}
export type ChatFilter='all'|'channels'|'direct'|'archived'

export async function listChats(filter:ChatFilter):Promise<ChatInfo[]> {
  const res=await api<{data:ChatInfo[]}>('/api/v1/chats?filter='+filter)
  return res.data
}
export async function getChatUsers():Promise<ChatUser[]>{
  return (await api<{data:ChatUser[]}>('/api/v1/chats/users')).data
}
export async function createChat(payload:{kind:'direct'|'channel';title?:string;user_id?:number;members?:number[]}):Promise<ChatInfo>{

  return (await api<{data:ChatInfo}>('/api/v1/chats',{method:'POST',body:payload})).data
}
export async function getChat(id:number):Promise<ChatInfo>{
  return (await api<{data:ChatInfo}>('/api/v1/chats/'+id)).data
}
export async function getMessages(id:number,after=0,before=0):Promise<ChatMessage[]>{
  const suffix=after?'?after='+after:before?'?before='+before:''
  return (await api<{data:ChatMessage[]}>('/api/v1/chats/'+id+'/messages'+suffix)).data
}
export async function sendTyping(id:number){

  return api('/api/v1/chats/'+id+'/typing',{method:'POST',body:{}})
}
export async function sendMessage(id:number,body:string,reply_to_id:number|null,client_token:string):Promise<ChatMessage>{

  return (await api<{data:ChatMessage}>('/api/v1/chats/'+id+'/messages',{
    method:'POST',body:{body,reply_to_id,client_token}
  })).data
}
export async function markMessages(id:number,kind:'delivered'|'read',messages:number[]){

  return api<{changed:number;unread_count:number}>('/api/v1/chats/'+id+'/receipts',{method:'POST',body:{kind,messages}})
}
export async function editMessage(id:number,messageId:number,body:string):Promise<ChatMessage>{
  return (await api<{data:ChatMessage}>('/api/v1/chats/'+id+'/messages/'+messageId,{method:'PATCH',body:{body}})).data
}
export async function deleteMessage(id:number,messageId:number):Promise<ChatMessage>{
  return (await api<{data:ChatMessage}>('/api/v1/chats/'+id+'/messages/'+messageId,{method:'DELETE'})).data
}
export async function archiveChat(id:number):Promise<boolean>{
  return (await api<{archived:boolean}>('/api/v1/chats/'+id+'/archive',{method:'POST',body:{}})).archived
}
export async function leaveChat(id:number){
  return api('/api/v1/chats/'+id+'/leave',{method:'POST',body:{}})
}
export async function addChatMember(id:number,user_id:number):Promise<ChatInfo>{
  return (await api<{data:ChatInfo}>('/api/v1/chats/'+id+'/members',{method:'POST',body:{user_id}})).data
}

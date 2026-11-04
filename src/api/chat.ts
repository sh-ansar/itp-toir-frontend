import { api } from './client'
import { usePreviewStore } from '../stores/preview'

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

const now=new Date().toISOString()
const sampleMembers=[{id:1,name:'Вы',is_admin:true},{id:2,name:'Александр Петров',is_admin:false},{id:3,name:'Дмитрий Ковалёв',is_admin:false}]
const sampleChats:ChatInfo[]=[
  {id:1,kind:'channel',title:'Ремонтная группа №1',is_admin:true,archived:false,members:sampleMembers,
    unread_count:2,last_message:{body:'Проверили состояние компрессора',created_at:now,user_id:2},updated_at:now},
  {id:2,kind:'direct',title:'Александр Петров',is_admin:true,archived:false,members:sampleMembers.slice(0,2),
    unread_count:0,last_message:{body:'Работы по плану готовы',created_at:now,user_id:1},updated_at:now},
  {id:3,kind:'channel',title:'Снабжение и запасные части',is_admin:true,archived:false,members:sampleMembers,
    unread_count:0,last_message:{body:'Подшипники поступили на склад',created_at:now,user_id:3},updated_at:now}
]
const sampleMessages:Record<number,ChatMessage[]> = {
  1:[
    {id:101,chat_id:1,user_id:2,sender_name:'Александр Петров',body:'Коллеги, сегодня проверяем компрессорную станцию.',
      reply_to_id:null,reply_preview:null,deleted:false,edited_at:null,created_at:now,total_recipients:2,delivered_count:2,read_count:1},
    {id:102,chat_id:1,user_id:1,sender_name:'Вы',body:'Прошу зафиксировать результат в наряде-задании.',
      reply_to_id:101,reply_preview:'Коллеги, сегодня проверяем компрессорную станцию.',deleted:false,edited_at:null,
      created_at:now,total_recipients:2,delivered_count:2,read_count:1},
    {id:103,chat_id:1,user_id:2,sender_name:'Александр Петров',body:'Проверили состояние компрессора. Осталось оформить акт.',
      reply_to_id:102,reply_preview:'Прошу зафиксировать результат в наряде-задании.',deleted:false,edited_at:null,
      created_at:now,total_recipients:2,delivered_count:1,read_count:0}
  ],
  2:[{id:201,chat_id:2,user_id:2,sender_name:'Александр Петров',body:'Добрый день, наряд выполнен.',
    reply_to_id:null,reply_preview:null,deleted:false,edited_at:null,created_at:now,total_recipients:1,delivered_count:1,read_count:1},
    {id:202,chat_id:2,user_id:1,sender_name:'Вы',body:'Работы по плану готовы, спасибо.',
      reply_to_id:null,reply_preview:null,deleted:false,edited_at:null,created_at:now,total_recipients:1,delivered_count:1,read_count:1}],
  3:[{id:301,chat_id:3,user_id:3,sender_name:'Дмитрий Ковалёв',body:'Подшипники поступили на склад.',
    reply_to_id:null,reply_preview:null,deleted:false,edited_at:null,created_at:now,total_recipients:2,delivered_count:1,read_count:0}]
}
const check=()=>{if(usePreviewStore().enabled)throw new Error('Демо-режим показывает только образец чата. Для отправки сообщений отключите просмотр макета.')}
export async function listChats(filter:ChatFilter):Promise<ChatInfo[]> {
  if(usePreviewStore().enabled)return sampleChats.filter(x=>filter==='archived'?x.archived:!x.archived&&(filter==='all'||filter==='channels'&&x.kind==='channel'||filter==='direct'&&x.kind==='direct'))
  const res=await api<{data:ChatInfo[]}>('/api/v1/chats?filter='+filter)
  return res.data
}
export async function getChatUsers():Promise<ChatUser[]>{
  if(usePreviewStore().enabled)return sampleMembers
  return (await api<{data:ChatUser[]}>('/api/v1/chats/users')).data
}
export async function createChat(payload:{kind:'direct'|'channel';title?:string;user_id?:number;members?:number[]}):Promise<ChatInfo>{
  check()
  return (await api<{data:ChatInfo}>('/api/v1/chats',{method:'POST',body:payload})).data
}
export async function getChat(id:number):Promise<ChatInfo>{
  if(usePreviewStore().enabled){const c=sampleChats.find(c=>c.id===id);if(!c)throw new Error('Чат не найден');return c}
  return (await api<{data:ChatInfo}>('/api/v1/chats/'+id)).data
}
export async function getMessages(id:number,after=0,before=0):Promise<ChatMessage[]>{
  if(usePreviewStore().enabled)return (sampleMessages[id]||[]).filter(x=>(!after||x.id>after)&&(!before||x.id<before))
  const suffix=after?'?after='+after:before?'?before='+before:''
  return (await api<{data:ChatMessage[]}>('/api/v1/chats/'+id+'/messages'+suffix)).data
}
export async function sendTyping(id:number){
  check()
  return api('/api/v1/chats/'+id+'/typing',{method:'POST',body:{}})
}
export async function sendMessage(id:number,body:string,reply_to_id:number|null,client_token:string):Promise<ChatMessage>{
  check()
  return (await api<{data:ChatMessage}>('/api/v1/chats/'+id+'/messages',{
    method:'POST',body:{body,reply_to_id,client_token}
  })).data
}
export async function markMessages(id:number,kind:'delivered'|'read',messages:number[]){
  check()
  return api<{changed:number;unread_count:number}>('/api/v1/chats/'+id+'/receipts',{method:'POST',body:{kind,messages}})
}
export async function editMessage(id:number,messageId:number,body:string):Promise<ChatMessage>{
  check();return (await api<{data:ChatMessage}>('/api/v1/chats/'+id+'/messages/'+messageId,{method:'PATCH',body:{body}})).data
}
export async function deleteMessage(id:number,messageId:number):Promise<ChatMessage>{
  check();return (await api<{data:ChatMessage}>('/api/v1/chats/'+id+'/messages/'+messageId,{method:'DELETE'})).data
}
export async function archiveChat(id:number):Promise<boolean>{
  check();return (await api<{archived:boolean}>('/api/v1/chats/'+id+'/archive',{method:'POST',body:{}})).archived
}
export async function leaveChat(id:number){
  check();return api('/api/v1/chats/'+id+'/leave',{method:'POST',body:{}})
}
export async function addChatMember(id:number,user_id:number):Promise<ChatInfo>{
  check();return (await api<{data:ChatInfo}>('/api/v1/chats/'+id+'/members',{method:'POST',body:{user_id}})).data
}

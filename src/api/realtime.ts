import { ref } from 'vue'
import Echo from 'laravel-echo'
import Pusher from 'pusher-js'
import { api } from './client'

export interface ChatSignal {
  company_id:number
  chat_id:number
  kind:string
  message_id:number|null
  metadata?:{user_id?:number;expires?:number;messages?:number[]}
}

type RealtimeSettings={
  enabled:boolean;key:string|null;path:string;host:string
  auth_endpoint:string;channel:string;presence_channel?:string
}

export const realtimeConnected=ref(false)
export const realtimeAvailable=ref(false)
export const onlineUsers=ref<Set<number>>(new Set())
let echo: Echo<'reverb'>|null=null
let pusher:Pusher|null=null
let currentChannel=''
let currentPresence=''
let generation=0
const observers=new Set<(event:ChatSignal)=>void>()
const reconnectObservers=new Set<()=>void>()

export function onChatSignal(fn:(event:ChatSignal)=>void):()=>void{
  observers.add(fn);return ()=>{observers.delete(fn)}
}
export function onChatReconnect(fn:()=>void):()=>void{
  reconnectObservers.add(fn);return ()=>{reconnectObservers.delete(fn)}
}

export function disconnectRealtime(){
  generation++
  if(echo&&currentChannel)echo.leave(currentChannel)
  if(echo&&currentPresence)echo.leave(currentPresence)
  echo?.disconnect()
  pusher?.disconnect()
  echo=null;pusher=null;currentChannel='';currentPresence=''
  onlineUsers.value=new Set()
  realtimeConnected.value=false
  realtimeAvailable.value=false
}

export async function connectRealtime():Promise<boolean>{
  disconnectRealtime()
  const myGeneration=generation
  let settings:RealtimeSettings
  try{settings=await api<RealtimeSettings>('/api/v1/realtime/config')}
  catch{return false}
  if(myGeneration!==generation)return false
  if(!settings.enabled||!settings.key||!settings.host||!settings.channel)return false
  realtimeAvailable.value=true
  try{
    const client=new Pusher(settings.key,{
      cluster:'mt1',
      wsHost:settings.host,
      wsPath:settings.path,
      wsPort:443,
      wssPort:443,
      forceTLS:true,
      enabledTransports:['ws','wss'],
      disableStats:true,
      channelAuthorization:{
        customHandler:(params,done)=>{
          api<{auth:string}>('/api/v1/broadcasting/auth',{
            method:'POST',body:{
              socket_id:params.socketId,
              channel_name:params.channelName
            }
          }).then(data=>done(null,data)).catch(error=>{
            done(error instanceof Error?error:new Error('Realtime channel authorization failed'),null)
          })
        }
      }
    })
    const connection=client.connection
    connection.bind('state_change',(e:{current:string})=>{
      const wasConnected=realtimeConnected.value
      realtimeConnected.value=e.current==='connected'
      if(!wasConnected&&realtimeConnected.value){
        for(const fn of reconnectObservers)fn()
      }
    })
    connection.bind('connected',()=>{realtimeConnected.value=true})
    connection.bind('disconnected',()=>{realtimeConnected.value=false})
    connection.bind('unavailable',()=>{realtimeConnected.value=false})
    connection.bind('failed',()=>{realtimeConnected.value=false})

    pusher=client
    echo=new Echo({broadcaster:'reverb',client,key:settings.key,wsHost:settings.host,
      wsPath:settings.path,wsPort:443,wssPort:443,forceTLS:true,
      enabledTransports:['ws','wss']})
    currentChannel=settings.channel
    if(settings.presence_channel){
      currentPresence=settings.presence_channel
      echo.join(currentPresence)
        .here((users:{id:number}[])=>{onlineUsers.value=new Set(users.map(u=>Number(u.id)))})
        .joining((user:{id:number})=>{
          onlineUsers.value=new Set([...onlineUsers.value,Number(user.id)])
        })
        .leaving((user:{id:number})=>{
          const next=new Set(onlineUsers.value);next.delete(Number(user.id))
          onlineUsers.value=next
        })
        .error(()=>{onlineUsers.value=new Set()})
    }
    echo.private(currentChannel).listen('.toir.chat.changed',(signal:ChatSignal)=>{
      if(signal&&signal.company_id&&Number.isFinite(signal.chat_id)){
        observers.forEach(listener=>listener(signal))
      }
    })
    return true
  }catch{
    disconnectRealtime()
    return false
  }
}

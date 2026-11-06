<script setup lang="ts">
import { Button as SharedButton, ChatLayout, ChatFilterTabs, ChatConversationItem, ChatHeader, ChatComposer, ChatMessageBubble, ActionMenu, ConfirmDialog, Drawer, TextInput } from '@itpmining/vue-basic-components'
import BaseSelect from '../../components/ui/BaseSelect.vue'
import BaseSearchField from '../../components/ui/BaseSearchField.vue'
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import {
  MessageCircle, Search, Plus, Send, Users, ChevronLeft, Check, CheckCheck,
  Reply, Pencil, Trash2, Archive, ArchiveRestore, LogOut,
  RefreshCcw, X, UserRound, ShieldCheck, UserPlus, Inbox
} from 'lucide-vue-next'
import BasePageHeading from '../../components/ui/BasePageHeading.vue'
import BaseButton from '../../components/ui/BaseButton.vue'
import BaseNotice from '../../components/ui/BaseNotice.vue'
import {
  listChats, getChatUsers, createChat, getChat, getMessages, sendMessage, sendTyping, markMessages,
  editMessage, deleteMessage, archiveChat, leaveChat, addChatMember,
  type ChatInfo, type ChatMessage, type ChatFilter, type ChatUser
} from '../../api/chat'
import { useSessionStore } from '../../stores/session'
import { connectRealtime, disconnectRealtime, onChatSignal, onChatReconnect,
  realtimeConnected, onlineUsers, type ChatSignal } from '../../api/realtime'

const session=useSessionStore()
const selfId=computed(()=>session.session?.user.id||0)
const active=ref<ChatInfo|null>(null)
const chats=ref<ChatInfo[]>([])
const people=ref<ChatUser[]>([])
const messages=ref<ChatMessage[]>([])
const search=ref('')
const filter=ref<ChatFilter>('all')
const busy=ref(false),sending=ref(false),error=ref(''),notice=ref('')
const chatBusy=ref(false),mobileConversation=ref(false)
const showNew=ref(false),showAddMember=ref(false)
const kind=ref<'direct'|'channel'>('direct')
const title=ref('')
const userId=ref<number|null>(null)
const selectedMembers=ref<number[]>([])
const draft=ref('')
const drafts=ref<Record<number,string>>({})
const replyTo=ref<ChatMessage|null>(null)
const editing=ref<ChatMessage|null>(null)
const timeline=ref<HTMLElement|null>(null)
const composer=ref<{focus:()=>void}|null>(null)
const messageSearchOpen=ref(false),messageSearch=ref('')
const deleteConfirmOpen=ref(false),leaveConfirmOpen=ref(false),confirmBusy=ref(false)
const pendingDelete=ref<ChatMessage|null>(null)
const readSeen=ref(new Set<number>())
const deliverySeen=ref(new Set<number>())
const typingName=ref('')
const loadingEarlier=ref(false)
const canLoadEarlier=ref(false)
let lastTypingSent=0
let typingTimer:ReturnType<typeof setTimeout>|null=null
let removeSignal:(()=>void)|null=null
let removeReconnect:(()=>void)|null=null
const filterOptions:{key:ChatFilter;label:string}[]=[
  {key:'all',label:'Все'},{key:'channels',label:'Каналы'},
  {key:'direct',label:'Личные'},{key:'archived',label:'Архив'}
]
const visibleChats=computed(()=>chats.value.filter(c=>(
  c.title+' '+c.members.map(m=>m.name).join(' ')
).toLocaleLowerCase('ru').includes(search.value.toLocaleLowerCase('ru'))))
const visibleMessages=computed(()=>messages.value.filter(m=>!messageSearchOpen.value||!messageSearch.value.trim()||((m.body||'')+' '+(m.sender_name||'')).toLocaleLowerCase('ru').includes(messageSearch.value.trim().toLocaleLowerCase('ru'))))
const availablePeople=computed(()=>people.value.filter(p=>p.id!==selfId.value))
const otherPeople=computed(()=>availablePeople.value.filter(p=>!active.value?.members.some(m=>m.id===p.id)))
let pollTimer:ReturnType<typeof setInterval>|null=null, ticket=0
const ago=(s:string)=>new Date(s).toLocaleTimeString('ru-RU',{hour:'2-digit',minute:'2-digit'})
const initials=(s:string)=>s.split(' ').slice(0,2).map(v=>v.charAt(0)).join('').toUpperCase()||'Ч'
async function refreshChats(){
  try{chats.value=await listChats(filter.value)}
  catch(e){error.value=e instanceof Error?e.message:'Не удалось загрузить список чатов'}
}
async function loadPeople(){
  try{people.value=await getChatUsers()}
  catch(e){error.value=e instanceof Error?e.message:'Не удалось загрузить сотрудников'}
}
async function openChat(chat:ChatInfo){
  if(active.value)drafts.value[active.value.id]=draft.value
  const t=++ticket
  active.value=chat
  draft.value=drafts.value[chat.id]||''
  replyTo.value=null;editing.value=null;messageSearchOpen.value=false;messageSearch.value='';mobileConversation.value=true
  messages.value=[];readSeen.value=new Set();deliverySeen.value=new Set()
  canLoadEarlier.value=false;typingName.value=''
  chatBusy.value=true;error.value=''
  try{
    const [detail,data]=await Promise.all([getChat(chat.id),getMessages(chat.id)])
    if(ticket!==t)return
    active.value=detail;messages.value=data
    canLoadEarlier.value=data.length===60
    await nextTick()
    if(timeline.value)timeline.value.scrollTop=timeline.value.scrollHeight
    await markVisible()
  }catch(e){if(ticket===t)error.value=e instanceof Error?e.message:'Не удалось открыть чат'}
  finally{if(ticket===t)chatBusy.value=false}
}
function closeChat(){
  if(active.value)drafts.value[active.value.id]=draft.value
  mobileConversation.value=false
  active.value=null
  messages.value=[];typingName.value='';messageSearchOpen.value=false;messageSearch.value=''
  ticket++
}
async function sync(){
  if(!active.value||document.hidden||chatBusy.value||sending.value)return
  const id=active.value.id
  try{
    const incoming=await getMessages(id)
    if(active.value?.id!==id)return
    const existing=new Map(messages.value.map(m=>[m.id,m]))
    for(const m of incoming)existing.set(m.id,m)
    const last=messages.value.at(-1)?.id||0
    messages.value=[...existing.values()].sort((a,b)=>a.id-b.id)
    if(messages.value.at(-1)?.id!==last){
      await nextTick()
      if(timeline.value && timeline.value.scrollHeight-timeline.value.clientHeight-timeline.value.scrollTop<220){
        timeline.value.scrollTop=timeline.value.scrollHeight
      }
    }
    await markVisible()
  }catch{ /* Offline / stale session: leave drafts and show existing messages. */ }
}
async function markVisible(){
  const id=active.value?.id
  if(!id||document.hidden||!document.hasFocus())return
  const container=timeline.value
  if(!container)return
  const viewport=container.getBoundingClientRect()
  const delivered:number[]=[]
  const read:number[]=[]
  for(const element of container.querySelectorAll<HTMLElement>('[data-chat-message-id]')){
    const mid=Number(element.dataset.chatMessageId)
    const m=messages.value.find(x=>x.id===mid)
    if(!m||m.user_id===selfId.value)continue
    if(!deliverySeen.value.has(mid))delivered.push(mid)
    const bounds=element.getBoundingClientRect()
    const height=Math.max(0,Math.min(bounds.bottom,viewport.bottom)-Math.max(bounds.top,viewport.top))
    if(height>=Math.min(bounds.height*.65,viewport.height*.65) && !readSeen.value.has(mid))read.push(mid)
  }
  if(delivered.length){
    try{await markMessages(id,'delivered',delivered.slice(0,100))
      delivered.forEach(mid=>deliverySeen.value.add(mid))}catch{ /* retry on next view */ }
  }
  if(read.length&&active.value?.id===id){
    try{await markMessages(id,'read',read.slice(0,100))
      read.forEach(mid=>readSeen.value.add(mid))
      if(active.value)active.value.unread_count=0
      void refreshChats()}catch{ /* retry on scroll */ }
  }
}
async function submit(){
  if(!active.value||sending.value)return
  const body=draft.value.trim()
  if(!body)return
  sending.value=true;error.value=''
  const id=active.value.id
  try{
    if(editing.value){
      await editMessage(id,editing.value.id,body)
    }else{
      await sendMessage(id,body,replyTo.value?.id||null,crypto.randomUUID())
    }
    draft.value='';drafts.value[id]='';replyTo.value=null;editing.value=null
    const data=await getMessages(id)
    if(active.value?.id===id){
      messages.value=data
      await nextTick()
      if(timeline.value)timeline.value.scrollTop=timeline.value.scrollHeight
    }
    await refreshChats()
  }catch(e){error.value=e instanceof Error?e.message:'Не удалось отправить сообщение'}
  finally{sending.value=false}
}
async function loadEarlier(){
  const chat=active.value
  if(!chat||loadingEarlier.value||!canLoadEarlier.value||!messages.value.length)return
  const el=timeline.value
  loadingEarlier.value=true
  try{
    const height=el?.scrollHeight||0
    const older=await getMessages(chat.id,0,messages.value[0].id)
    if(active.value?.id!==chat.id)return
    const current=new Map(messages.value.map(m=>[m.id,m]))
    for(const msg of older)current.set(msg.id,msg)
    messages.value=[...current.values()].sort((a,b)=>a.id-b.id)
    canLoadEarlier.value=older.length===60
    await nextTick()
    if(el)el.scrollTop=el.scrollHeight-height
  }catch(e){error.value=e instanceof Error?e.message:'Не удалось загрузить историю'}
  finally{loadingEarlier.value=false}
}
function scrollMessages(){
  if(timeline.value&&timeline.value.scrollTop<40)void loadEarlier()
  void markVisible()
}
function receivedSignal(signal:ChatSignal){
  if(signal.kind==='typing'&&active.value?.id===signal.chat_id&&
      signal.metadata?.user_id!==selfId.value){
    const user=active.value.members.find(m=>m.id===signal.metadata?.user_id)
    typingName.value=(user?.name||'Сотрудник')+' печатает…'
    if(typingTimer)clearTimeout(typingTimer)
    typingTimer=setTimeout(()=>{typingName.value=''},4000)
    return
  }
  if(active.value?.id===signal.chat_id)void sync()
  void refreshChats()
}
function setReply(m:ChatMessage){replyTo.value=m;editing.value=null;composer.value?.focus()}
function setEdit(m:ChatMessage){editing.value=m;replyTo.value=null;draft.value=m.body;composer.value?.focus()}
function cancelCompose(){draft.value='';editing.value=null;replyTo.value=null}
function removeMessage(m:ChatMessage){
  if(!active.value||!canModify(m))return
  pendingDelete.value=m
  deleteConfirmOpen.value=true
}
async function confirmRemoveMessage(){
  const message=pendingDelete.value,id=active.value?.id
  if(!message||!id||!canModify(message))return
  confirmBusy.value=true
  try{await deleteMessage(id,message.id);deleteConfirmOpen.value=false;pendingDelete.value=null;await sync()}
  catch(e){error.value=e instanceof Error?e.message:'Не удалось удалить сообщение'}
  finally{confirmBusy.value=false}
}
function messageStatus(m:ChatMessage){
  if(m.user_id!==selfId.value)return ''
  return m.total_recipients>0&&m.read_count>=m.total_recipients?'read':
    m.total_recipients>0&&m.delivered_count>=m.total_recipients?'delivered':'sent'
}
function messageActions(m:ChatMessage){
  return [{id:'reply',label:'Ответить'},
    ...(canModify(m)?[{id:'edit',label:'Редактировать'},{id:'delete',label:'Удалить',danger:true}]:[])]
}
function onMessageAction(m:ChatMessage,action:string){
  if(action==='reply')setReply(m)
  if(action==='edit'&&canModify(m))setEdit(m)
  if(action==='delete'&&canModify(m))removeMessage(m)
}
function canModify(m:ChatMessage){
  return m.user_id===selfId.value && !m.deleted &&
    (Date.now()-new Date(m.created_at).getTime())<15*60*1000
}
async function openCreate(){
  await loadPeople()
  kind.value='direct';title.value='';userId.value=null;selectedMembers.value=[];showNew.value=true
}
async function submitCreate(){
  if(kind.value==='direct'&&!userId.value)return
  if(kind.value==='channel'&&!title.value.trim())return
  busy.value=true;error.value=''
  try{
    const chat=await createChat(kind.value==='direct'
      ? {kind:'direct',user_id:Number(userId.value)}
      : {kind:'channel',title:title.value.trim(),members:selectedMembers.value})
    showNew.value=false;filter.value='all'
    await refreshChats()
    await openChat(chat)
  }catch(e){error.value=e instanceof Error?e.message:'Не удалось создать чат'}
  finally{busy.value=false}
}
async function toggleArchive(){
  if(!active.value)return
  const id=active.value.id
  try{await archiveChat(id);await refreshChats();closeChat()}
  catch(e){error.value=e instanceof Error?e.message:'Не удалось изменить архив'}
}
function leave(){
  if(!active.value||active.value.kind!=='channel')return
  leaveConfirmOpen.value=true
}
async function confirmLeave(){
  const id=active.value?.id
  if(!id||active.value?.kind!=='channel')return
  confirmBusy.value=true
  try{await leaveChat(id);leaveConfirmOpen.value=false;await refreshChats();closeChat()}
  catch(e){error.value=e instanceof Error?e.message:'Не удалось выйти из канала'}
  finally{confirmBusy.value=false}
}
async function addMember(){
  if(!active.value||!userId.value)return
  try{active.value=await addChatMember(active.value.id,userId.value);showAddMember.value=false;userId.value=null}
  catch(e){error.value=e instanceof Error?e.message:'Не удалось добавить участника'}
}
watch(filter,()=>void refreshChats())
watch(()=>session.session?.active_company_id,()=>{
  closeChat();disconnectRealtime()
  void connectRealtime()
  void refreshChats();void loadPeople()
})
watch(draft,v=>{
  if(active.value)drafts.value[active.value.id]=v
  if(!v.trim()||!active.value||!realtimeConnected.value)return
  if(Date.now()-lastTypingSent>2000){
    lastTypingSent=Date.now()
    void sendTyping(active.value.id).catch(()=>{})
  }
})
onMounted(()=>{
  void refreshChats();void loadPeople()
  removeSignal=onChatSignal(receivedSignal)
  removeReconnect=onChatReconnect(()=>{void sync();void refreshChats()})
  void connectRealtime()
  pollTimer=setInterval(()=>{if(!document.hidden){void sync();void refreshChats()}},6000)
  document.addEventListener('visibilitychange',onVisibility)
})
function onVisibility(){if(!document.hidden){void sync();void markVisible()}}
onBeforeUnmount(()=>{
  if(pollTimer)clearInterval(pollTimer)
  if(typingTimer)clearTimeout(typingTimer)
  removeSignal?.();removeReconnect?.();disconnectRealtime()
  document.removeEventListener('visibilitychange',onVisibility)
})
</script>

<template>
  <div class="chat-page toir-messenger">
    <BasePageHeading title="Чат" description="Личные сообщения и каналы сотрудников внутри ТОиР."/>
    <BaseNotice v-if="error" tone="error">{{error}}</BaseNotice>
    <BaseNotice v-if="notice" tone="info">{{notice}}</BaseNotice>
    <ChatLayout class="toir-shared-chat" :show-conversation="mobileConversation">
      <template #sidebar>
        <div class="messenger-sidebar">
          <header class="messenger-sidebar-head">
            <h2>Сообщения</h2>
            <SharedButton type="button" class="toolbar-icon" aria-label="Создать чат" title="Новый чат" @click="openCreate">
              <Plus :size="18" aria-hidden="true"/>
            </SharedButton>
          </header>
          <ChatFilterTabs :model-value="filter" :tabs="filterOptions.map(f=>({id:f.key,label:f.label}))"
            @update:model-value="filter=$event as ChatFilter"/>
          <div class="messenger-search-wrap">
            <BaseSearchField v-model="search" label="Поиск чатов" placeholder="Поиск чатов"/>
          </div>
          <div class="messenger-list" role="list">
            <ChatConversationItem v-for="chat in visibleChats" :key="chat.id"
              :title="chat.title" :subtitle="chat.last_message?.body || 'Нет сообщений'"
              :time="chat.last_message ? ago(chat.last_message.created_at) : ''"
              :initials="chat.kind==='channel' ? '#' : initials(chat.title)"
              :unread="chat.unread_count" :active="active?.id===chat.id"
              :online="chat.kind==='direct'&&chat.members.some(m=>m.id!==selfId&&onlineUsers.has(m.id))"
              @select="openChat(chat)"/>
            <div v-if="!visibleChats.length" class="messenger-list-empty">
              <Inbox :size="25" aria-hidden="true"/><strong>Чатов пока нет</strong>
              <small>Создайте личный чат или канал.</small>
            </div>
          </div>
          <footer class="messenger-sidebar-footer">
            <ShieldCheck :size="14" aria-hidden="true"/>
            <span>Чаты доступны только сотрудникам компании</span>
            <span class="messenger-network-state" :class="{connected:realtimeConnected}"
              :title="realtimeConnected?'Reverb подключён':'Восстанавливается подключение'">
              <span aria-hidden="true" class="messenger-network-dot"></span>
              {{realtimeConnected?'В сети':'Подключение'}}
            </span>
          </footer>
        </div>
      </template>
      <template #header>
        <div v-if="active" class="toir-chat-header-row">
          <ChatHeader class="toir-chat-header" :title="active.title"
            :subtitle="active.kind==='channel'
              ? active.members.length+' участников · '+active.members.filter(m=>onlineUsers.has(m.id)).length+' в сети'
              : 'Личный чат'"
            :online="active.kind==='direct' && active.members.some(m=>m.id!==selfId&&onlineUsers.has(m.id))"
            show-back :call-enabled="false" :show-video-call="false" :show-info="false"
            @back="closeChat" @search="messageSearchOpen=!messageSearchOpen;messageSearch=''"/>
          <div class="toir-chat-header-actions">
            <SharedButton v-if="active.kind==='channel'&&active.is_admin" class="toolbar-icon"
              type="button" title="Добавить участника" aria-label="Добавить участника"
              @click="userId=null;showAddMember=true"><UserPlus :size="17" aria-hidden="true"/></SharedButton>
            <SharedButton type="button" class="toolbar-icon"
              :title="active.archived?'Вернуть из архива':'Архивировать'" aria-label="Архив чата"
              @click="toggleArchive">
              <ArchiveRestore v-if="active.archived" :size="17" aria-hidden="true"/>
              <Archive v-else :size="17" aria-hidden="true"/>
            </SharedButton>
            <SharedButton v-if="active.kind==='channel'" class="toolbar-icon" type="button"
              title="Выйти из канала" aria-label="Выйти из канала" @click="leave">
              <LogOut :size="17" aria-hidden="true"/>
            </SharedButton>
          </div>
        </div>
        <div v-else class="toir-chat-header-placeholder">Выберите беседу</div>
      </template>
      <template #messages>
        <div v-if="active" class="toir-chat-messages-area">
          <div v-if="messageSearchOpen" class="toir-message-search">
            <BaseSearchField v-model="messageSearch" label="Поиск в переписке" placeholder="Найти в сообщениях"/>
            <SharedButton type="button" class="toolbar-icon" aria-label="Закрыть поиск"
              @click="messageSearchOpen=false;messageSearch=''"><X :size="16"/></SharedButton>
          </div>
          <div ref="timeline" class="messenger-messages" role="log" aria-label="Сообщения чата"
            @scroll.passive="scrollMessages">
            <p v-if="chatBusy" class="messenger-muted">Загрузка истории…</p>
            <p v-else-if="loadingEarlier" class="messenger-muted">Загрузка предыдущих сообщений…</p>
            <p v-else-if="!messages.length" class="messenger-muted">Сообщений пока нет. Напишите первое сообщение.</p>
            <p v-else-if="messageSearchOpen&&!visibleMessages.length" class="messenger-muted">По вашему запросу сообщений нет.</p>
            <div v-for="m in visibleMessages" :key="m.id" class="toir-message-entry" :data-chat-message-id="m.id">
              <ChatMessageBubble :author="active.kind==='channel'&&m.user_id!==selfId?m.sender_name:''"
                :text="m.deleted?'Сообщение удалено':m.body"
                :outgoing="m.user_id===selfId" :time="ago(m.created_at)"
                :reply-to="m.reply_preview||''" :edited="!!m.edited_at"
                :status="messageStatus(m)" :show-actions="false" :system="m.deleted"/>
              <ActionMenu v-if="!m.deleted" :label="'Действия с сообщением '+m.id"
                :items="messageActions(m)" @select="onMessageAction(m,String($event))"/>
            </div>
          </div>
        </div>
        <div v-else class="messenger-welcome">
          <MessageCircle :size="44" aria-hidden="true"/>
          <h2>Общайтесь внутри ТОиР</h2>
          <p>Выберите переписку или создайте новый чат. Личные и групповые беседы изолированы от Portal.</p>
          <BaseButton type="button" @click="openCreate"><Plus :size="16" aria-hidden="true"/>Создать чат</BaseButton>
        </div>
      </template>
      <template #composer>
        <div v-if="active" class="toir-chat-composer-area">
          <div v-if="editing" class="messenger-compose-reply">
            <span><strong>Редактирование сообщения</strong><small>{{editing.body}}</small></span>
            <SharedButton type="button" class="toolbar-icon" aria-label="Отменить редактирование"
              @click="cancelCompose"><X :size="17" aria-hidden="true"/></SharedButton>
          </div>
          <ChatComposer ref="composer" v-model="draft" :disabled="sending" :loading="sending"
            :max-length="2048" placeholder="Напишите сообщение…"
            :reply-text="replyTo?.body||''" @send="submit" @cancel-reply="cancelCompose"
            @attach="notice='Прикрепление файлов пока не поддерживается сервером ТОиР'"
            @voice="notice='Голосовые сообщения пока не поддерживаются сервером ТОиР'"/>
          <div class="messenger-sync-note">
            <span v-if="typingName" class="messenger-typing">{{typingName}} · </span>
            <span v-if="realtimeConnected" class="messenger-realtime-connected">В реальном времени · Reverb</span>
            <span v-else>Автоматическое обновление · соединение восстанавливается</span>
          </div>
        </div>
      </template>
    </ChatLayout>
    <ConfirmDialog v-model:open="deleteConfirmOpen" title="Удалить сообщение?"
      message="Удаление сообщения нельзя отменить." confirm-label="Удалить" cancel-label="Отмена"
      destructive :busy="confirmBusy" @confirm="confirmRemoveMessage" @cancel="deleteConfirmOpen=false"/>
    <ConfirmDialog v-model:open="leaveConfirmOpen" title="Выйти из канала?"
      message="Вы больше не будете видеть переписку канала." confirm-label="Выйти" cancel-label="Отмена"
      destructive :busy="confirmBusy" @confirm="confirmLeave" @cancel="leaveConfirmOpen=false"/>
        <Drawer :open="showNew" title="Новый чат"
      description="Создайте личный чат или канал для сотрудников текущей компании."
      width="medium" close-label="Закрыть" @close="!busy&&(showNew=false)">
      <form id="mro-new-chat-form" class="warehouse-form" @submit.prevent="submitCreate">
        <div class="switch-tabs" role="group" aria-label="Тип чата">
          <SharedButton type="button" :class="{active:kind==='direct'}" @click="kind='direct'">
            <UserRound :size="16" aria-hidden="true"/>Личный чат
          </SharedButton>
          <SharedButton type="button" :class="{active:kind==='channel'}" @click="kind='channel'">
            <Users :size="16" aria-hidden="true"/>Канал
          </SharedButton>
        </div>
        <label v-if="kind==='channel'">Название канала *
          <TextInput v-model.trim="title" maxlength="150" required
            placeholder="Например, Ремонтная группа №1"/>
        </label>
        <label v-if="kind==='direct'">Сотрудник *
          <BaseSelect v-model="userId" required>
            <option :value="null" disabled>Выберите сотрудника</option>
            <option v-for="u in availablePeople" :key="u.id" :value="u.id">{{u.name}}</option>
          </BaseSelect>
        </label>
        <label v-else>Участники
          <BaseSelect v-model="selectedMembers" multiple size="6">
            <option v-for="u in availablePeople" :key="u.id" :value="u.id">{{u.name}}</option>
          </BaseSelect>
        </label>
      </form>
      <template #footer>
        <div class="category-dialog-footer">
          <BaseButton type="button" variant="secondary" :disabled="busy" @click="showNew=false">Отмена</BaseButton>
          <BaseButton type="button" :disabled="busy||(kind==='direct'&&!userId)||(kind==='channel'&&!title.trim())"
            @click="submitCreate">Создать</BaseButton>
        </div>
      </template>
    </Drawer>
    <Drawer :open="showAddMember" title="Пригласить в канал"
      description="Доступ получит только сотрудник текущей компании."
      width="medium" close-label="Закрыть" @close="showAddMember=false">
      <form id="mro-member-add-form" class="warehouse-form" @submit.prevent="addMember">
        <label>Сотрудник
          <BaseSelect v-model="userId" required>
            <option :value="null" disabled>Выберите сотрудника</option>
            <option v-for="u in otherPeople" :key="u.id" :value="u.id">{{u.name}}</option>
          </BaseSelect>
        </label>
      </form>
      <template #footer>
        <div class="category-dialog-footer">
          <BaseButton type="button" variant="secondary" @click="showAddMember=false">Отмена</BaseButton>
          <BaseButton type="button" :disabled="!userId" @click="addMember">Добавить</BaseButton>
        </div>
      </template>
    </Drawer>
  </div>
</template>
<style scoped>
.toir-shared-chat{height:min(74dvh,760px);min-height:450px}
.messenger-sidebar{height:100%;background:var(--color-surface);overflow:hidden}
.toir-chat-header-row{display:flex;align-items:center;min-width:0}
.toir-chat-header{flex:1;min-width:0}
.toir-chat-header-actions{display:flex;align-items:center;gap:4px;flex:none;padding-right:8px}
.toir-chat-header-placeholder{padding:19px;color:var(--color-muted);font-size:13px}
.toir-chat-messages-area{display:flex;flex-direction:column;min-height:0;height:100%}
.toir-chat-messages-area .messenger-messages{display:flex;flex-direction:column;flex:1;min-height:0;overflow-y:auto;overflow-x:hidden;gap:12px}
.toir-message-search{display:flex;align-items:center;gap:8px;padding:8px 12px}
.toir-message-entry{display:flex;align-items:flex-end;gap:6px}
.toir-message-entry:has(.is-outgoing){flex-direction:row-reverse}
.toir-message-entry :deep(.itp-chat-message){min-width:0;flex:1}
.toir-message-entry :deep(.itp-chat-message__bubble){max-width:min(90%,540px)}
.toir-chat-composer-area{display:grid;gap:7px;min-width:0}
.toir-chat-composer-area :deep(.itp-chat-composer){width:100%}
.toir-chat-composer-area .messenger-sync-note{padding:0}
.toir-shared-chat :deep(.itp-chat-layout__messages){overflow:hidden;padding:0}
.toir-shared-chat :deep(.itp-chat-layout__composer){padding:8px 12px}
.toir-shared-chat :deep(.itp-chat-layout__header){min-height:56px}
.toir-shared-chat :deep(.itp-chat-header__icon[title="Назад к чатам"]){display:none}
@media(max-width:640px){
.toir-shared-chat{height:calc(100dvh - 205px);min-height:420px}
.toir-shared-chat :deep(.itp-chat-header__icon[title="Назад к чатам"]){display:grid}
.toir-message-entry :deep(.itp-chat-message__bubble){max-width:100%}
}
</style>

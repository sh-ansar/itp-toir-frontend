<script setup lang="ts">
import { Button as SharedButton } from "@itpmining/vue-basic-components";
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
const composer=ref<HTMLTextAreaElement|null>(null)
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
  replyTo.value=null;editing.value=null;mobileConversation.value=true
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
  messages.value=[];typingName.value=''
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
function handleComposer(e:KeyboardEvent){
  if(e.key==='Enter'&&!e.shiftKey&&!e.isComposing){e.preventDefault();void submit()}
}
function setReply(m:ChatMessage){replyTo.value=m;editing.value=null;composer.value?.focus()}
function setEdit(m:ChatMessage){editing.value=m;replyTo.value=null;draft.value=m.body;composer.value?.focus()}
function cancelCompose(){draft.value='';editing.value=null;replyTo.value=null}
async function removeMessage(m:ChatMessage){
  if(!active.value)return
  if(!window.confirm('Удалить сообщение? Действие нельзя отменить.'))return
  try{await deleteMessage(active.value.id,m.id);await sync()}
  catch(e){error.value=e instanceof Error?e.message:'Не удалось удалить сообщение'}
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
async function leave(){
  if(!active.value||active.value.kind!=='channel')return
  if(!window.confirm('Выйти из канала? Вы больше не будете видеть переписку.'))return
  const id=active.value.id
  try{await leaveChat(id);await refreshChats();closeChat()}
  catch(e){error.value=e instanceof Error?e.message:'Не удалось выйти из канала'}
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
    <BasePageHeading title="Чат" description="Личные сообщения и каналы сотрудников внутри ТОИР." />
    <BaseNotice v-if="error" tone="error">{{ error }}</BaseNotice>
    <BaseNotice v-if="notice" tone="success">{{ notice }}</BaseNotice>
    <div class="messenger-layout" :class="{'messenger-layout--conversation':mobileConversation}">
      <aside class="messenger-sidebar">
        <header class="messenger-sidebar-head">
          <h2>Сообщения</h2>
          <SharedButton class="toolbar-icon" type="button" aria-label="Создать чат" title="Новый чат" @click="openCreate">
            <Plus :size="18"/>
          </SharedButton>
        </header>
        <div class="messenger-filters">
          <button v-for="f in filterOptions" :key="f.key" type="button"
            :class="{active:filter===f.key}" @click="filter=f.key">{{ f.label }}</button>
        </div>
        <div class="messenger-search-wrap"><BaseSearchField v-model="search" label="Поиск чатов" placeholder="Поиск чатов" /></div>
        <div class="messenger-list" role="list">
          <button v-for="chat in visibleChats" :key="chat.id" type="button" role="listitem"
            class="messenger-conversation" :class="{active:active?.id===chat.id}" @click="openChat(chat)">
            <span class="messenger-avatar">{{ chat.kind==='channel'?'#':initials(chat.title) }}</span>
            <span class="messenger-conversation-body">
              <span class="messenger-title-row"><strong>{{ chat.title }}</strong>
                <small>{{ chat.last_message?ago(chat.last_message.created_at):'' }}</small></span>
              <span class="messenger-last-row">
                <span>{{ chat.last_message?.body||'Нет сообщений' }}</span>
                <em v-if="chat.unread_count">{{ chat.unread_count }}</em>
              </span>
            </span>
          </button>
          <div v-if="!visibleChats.length" class="messenger-list-empty"><Inbox :size="25"/>
            <strong>Чатов пока нет</strong><small>Создайте личный чат или канал.</small></div>
        </div>
        <footer class="messenger-sidebar-footer">
          <ShieldCheck :size="14"/>
          <span>Чаты доступны только сотрудникам компании</span>
          <span class="messenger-network-state" :class="{connected:realtimeConnected}"
            :title="realtimeConnected?'Reverb подключён':'Восстанавливается подключение'">
            <span aria-hidden="true" class="messenger-network-dot"></span>
            {{ realtimeConnected?'В сети':'Подключение' }}
          </span>
        </footer>
      </aside>
      <section class="messenger-main">
        <template v-if="active">
          <header class="messenger-chat-header">
            <button type="button" class="messenger-back" aria-label="Назад к чатам" @click="closeChat"><ChevronLeft :size="19"/></button>
            <span class="messenger-avatar messenger-avatar--small">{{ active.kind==='channel'?'#':initials(active.title) }}</span>
            <span class="messenger-chat-title"><strong>{{ active.title }}</strong>
              <small v-if="active.kind==='channel'">{{ active.members.length }} участников · {{ active.members.filter(m=>onlineUsers.has(m.id)).length }} в сети</small>
              <small v-else>{{ active.members.some(m=>m.id!==selfId&&onlineUsers.has(m.id))?'В сети':'Личный чат' }}</small>
            </span>
            <SharedButton v-if="active.kind==='channel'&&active.is_admin" type="button" class="toolbar-icon"
              title="Добавить участника" aria-label="Добавить участника" @click="userId=null;showAddMember=true"><UserPlus :size="17"/></SharedButton>
            <SharedButton type="button" class="toolbar-icon" :title="active.archived?'Вернуть из архива':'Архивировать'"
              aria-label="Архив чата" @click="toggleArchive">
              <ArchiveRestore v-if="active.archived" :size="17"/><Archive v-else :size="17"/></SharedButton>
            <SharedButton v-if="active.kind==='channel'" type="button" class="toolbar-icon" title="Выйти из канала"
              aria-label="Выйти из канала" @click="leave"><LogOut :size="17"/></SharedButton>
          </header>
          <div ref="timeline" class="messenger-messages" role="log" aria-label="Сообщения чата" @scroll.passive="scrollMessages">
            <p v-if="chatBusy" class="messenger-muted">Загрузка истории…</p>
            <p v-else-if="loadingEarlier" class="messenger-muted">Загрузка предыдущих сообщений…</p>
            <p v-else-if="!messages.length" class="messenger-muted">Сообщений пока нет. Напишите первое сообщение.</p>
            <div v-for="m in messages" :key="m.id" class="messenger-message-line" :class="{mine:m.user_id===selfId}">
              <div class="messenger-message" :class="{'messenger-message--deleted':m.deleted}"
                :data-chat-message-id="m.id">
                <strong v-if="active.kind==='channel'&&m.user_id!==selfId" class="messenger-sender">{{ m.sender_name }}</strong>
                <blockquote v-if="m.reply_preview" class="messenger-reply">{{ m.reply_preview }}</blockquote>
                <p>{{ m.deleted?'Сообщение удалено':m.body }}</p>
                <footer><span v-if="m.edited_at">изменено · </span><span>{{ ago(m.created_at) }}</span>
                  <span v-if="m.user_id===selfId"
                    :title="m.total_recipients>0&&m.read_count>=m.total_recipients?'Прочитано всеми':
                      m.total_recipients>0&&m.delivered_count>=m.total_recipients?'Доставлено всем':'Отправлено'">
                    <CheckCheck v-if="m.total_recipients>0&&m.read_count>=m.total_recipients" :size="15" class="receipt-read"/>
                    <CheckCheck v-else-if="m.total_recipients>0&&m.delivered_count>=m.total_recipients" :size="15"/>
                    <Check v-else :size="15"/>
                  </span></footer>
                <div v-if="!m.deleted" class="messenger-message-actions">
                  <button type="button" aria-label="Ответить" title="Ответить" @click="setReply(m)"><Reply :size="14"/></button>
                  <button v-if="canModify(m)" type="button" aria-label="Редактировать сообщение"
                    title="Редактировать" @click="setEdit(m)"><Pencil :size="14"/></button>
                  <button v-if="canModify(m)" type="button" aria-label="Удалить сообщение"
                    title="Удалить" @click="removeMessage(m)"><Trash2 :size="14"/></button>
                </div>
              </div>
            </div>
          </div>
          <div v-if="replyTo||editing" class="messenger-compose-reply">
            <span><strong>{{ editing?'Редактирование':'Ответ для '+replyTo?.sender_name }}</strong>
              <small>{{ editing?.body||replyTo?.body }}</small></span>
            <button type="button" aria-label="Отменить ответ" @click="cancelCompose"><X :size="17"/></button>
          </div>
          <form class="messenger-compose" @submit.prevent="submit">
            <textarea ref="composer" v-model="draft" maxlength="2048" rows="1"
              :disabled="sending" placeholder="Напишите сообщение…"
              aria-label="Текст сообщения" @keydown="handleComposer"></textarea>
            <BaseButton type="submit" :disabled="sending||!draft.trim()" icon-only>
              <Send :size="18"/><span class="visually-hidden">Отправить</span>
            </BaseButton>
          </form>
          <div class="messenger-sync-note">
            <span v-if="typingName" class="messenger-typing">{{ typingName }} · </span>
            <span v-if="realtimeConnected" class="messenger-realtime-connected">В реальном времени · Reverb</span>
            <span v-else>Автоматическое обновление · соединение восстанавливается</span>
          </div>
        </template>
        <div v-else class="messenger-welcome">
          <MessageCircle :size="44"/>
          <h2>Общайтесь внутри ТОИР</h2>
          <p>Выберите переписку или создайте новый чат. Личные и групповые беседы изолированы от Portal.</p>
          <BaseButton type="button" @click="openCreate"><Plus :size="16"/>Создать чат</BaseButton>
        </div>
      </section>
    </div>
    <Teleport to="body">
      <div v-if="showNew" class="category-backdrop" @click.self="!busy&&(showNew=false)">
        <section class="category-dialog messenger-dialog" role="dialog" aria-modal="true" aria-label="Создать чат">
          <header class="category-dialog-head"><div class="category-dialog-icon"><MessageCircle :size="19"/></div>
            <SharedButton type="button" class="drawer-close" aria-label="Закрыть" :disabled="busy" @click="showNew=false"><X :size="18"/></SharedButton></header>
          <h2>Новый чат</h2>
          <p>Создайте личный чат или канал только для сотрудников этой компании.</p>
          <form class="warehouse-form" @submit.prevent="submitCreate">
            <div class="switch-tabs" role="group" aria-label="Тип чата">
              <button type="button" :class="{active:kind==='direct'}" @click="kind='direct'"><UserRound :size="16"/>Личный чат</button>
              <button type="button" :class="{active:kind==='channel'}" @click="kind='channel'"><Users :size="16"/>Канал</button>
            </div>
            <label v-if="kind==='channel'">Название канала *
              <input v-model.trim="title" maxlength="150" required placeholder="Например, Ремонтная группа №1"/>
            </label>
            <label v-if="kind==='direct'">Сотрудник *
              <BaseSelect v-model="userId" required>
                <option :value="null" disabled>Выберите сотрудника</option>
                <option v-for="u in availablePeople" :key="u.id" :value="u.id">{{ u.name }}</option>
              </BaseSelect>
            </label>
            <label v-else>Участники (Ctrl / Cmd для выбора нескольких)
              <BaseSelect v-model="selectedMembers" multiple size="6">
                <option v-for="u in availablePeople" :key="u.id" :value="u.id">{{ u.name }}</option>
              </BaseSelect>
            </label>
            <div class="category-dialog-footer">
              <BaseButton type="button" variant="secondary" @click="showNew=false">Отмена</BaseButton>
              <BaseButton type="submit" :disabled="busy">Создать</BaseButton>
            </div>
          </form>
        </section>
      </div>
      <div v-if="showAddMember" class="category-backdrop" @click.self="showAddMember=false">
        <section class="category-dialog messenger-dialog" role="dialog" aria-modal="true" aria-label="Добавить участника">
          <header class="category-dialog-head"><div class="category-dialog-icon"><UserPlus :size="19"/></div>
            <SharedButton class="drawer-close" aria-label="Закрыть" type="button" @click="showAddMember=false"><X :size="18"/></SharedButton></header>
          <h2>Пригласить в канал</h2><p>Доступ получит только сотрудник текущей компании.</p>
          <form class="warehouse-form" @submit.prevent="addMember">
            <label>Сотрудник<BaseSelect v-model="userId" required>
              <option :value="null" disabled>Выберите сотрудника</option>
              <option v-for="u in otherPeople" :key="u.id" :value="u.id">{{ u.name }}</option></BaseSelect></label>
            <div class="category-dialog-footer">
              <BaseButton type="button" variant="secondary" @click="showAddMember=false">Отмена</BaseButton>
              <BaseButton type="submit" :disabled="!userId">Добавить</BaseButton>
            </div>
          </form>
        </section>
      </div>
    </Teleport>
  </div>
</template>

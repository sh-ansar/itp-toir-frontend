<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute } from 'vue-router'
import {
  Wrench, ClipboardList, CalendarDays, Users, FolderKanban,
  Boxes, Package, Warehouse, Hammer, Cog, Truck, Bell, MessageCircle,
  FileBarChart, Settings, ChevronDown, PanelLeftClose, PanelLeftOpen,
  X, LayoutDashboard, BriefcaseBusiness
} from 'lucide-vue-next'
import { usePreferencesStore } from '../../stores/preferences'
import { useSessionStore } from '../../stores/session'

defineProps<{mobileOpen:boolean}>()
const emit=defineEmits<{'update:mobileOpen':[v:boolean]}>()
const route=useRoute()
const ui=usePreferencesStore()
const session=useSessionStore()
const expanded=ref<Record<string,boolean>>({maintenance:true,assets:true,supplies:false,reports:false})
const groups=[
  {key:'maintenance',label:'Ремонт и обслуживание',icon:Wrench,children:[
    {label:'Наряд-задания',path:'/work-orders',icon:ClipboardList},
    {label:'Планирование',path:'/plans',icon:Cog},
    {label:'Расписание',path:'/schedule',icon:CalendarDays},
    {label:'Сотрудники',path:'/employees',icon:Users},
    {label:'Проекты',path:'/projects',icon:FolderKanban}
  ]},
  {key:'assets',label:'Активы',icon:Boxes,children:[
    {label:'Все активы',path:'/assets',icon:Package},
    {label:'Помещение',path:'/assets?category=premises',icon:Warehouse},
    {label:'Оборудование',path:'/assets?category=equipment',icon:Cog},
    {label:'Инструменты',path:'/assets?category=tools',icon:Hammer},
    {label:'Запчасти и расходные материалы',path:'/assets?category=materials',icon:Package}
  ]},
  {key:'supplies',label:'Поставки',icon:Truck,children:[
    {label:'Заявки на склад',path:'/supplies',icon:Package},
    {label:'Тендеры',path:'/tenders',icon:BriefcaseBusiness}
  ]},
  {key:'reports',label:'Отчеты',icon:FileBarChart,children:[
    {label:'По ремонтам',path:'/reports/repairs',icon:FileBarChart},
    {label:'Рейтинг сотрудников',path:'/reports/employees',icon:Users},
    {label:'Наличие запчастей на складе',path:'/reports/warehouse',icon:Package},
    {label:'По качеству ремонта',path:'/reports/quality',icon:Cog},
    {label:'История ремонта',path:'/reports/history',icon:ClipboardList}
  ]}
]
const pageKey=computed(()=>route.fullPath)
function close(){emit('update:mobileOpen',false)}
function isActive(path:string){
  if(path.includes('?'))return pageKey.value===path
  return route.path===path && (path!=='/assets'||!route.query.category)
}
function toggle(key:string){expanded.value[key]=!expanded.value[key]}
</script>

<template>
  <aside class="sidebar toir-sidebar" :class="{'toir-sidebar--collapsed':ui.sidebarCollapsed,'sidebar--open':mobileOpen}">
    <div class="toir-sidebar-head">
      <RouterLink to="/" class="brand-link" @click="close">
        <img src="/brand/itp-mark.svg" alt="ITP" width="45" height="34" />
        <span class="brand-copy"><strong>ТО и Р</strong><small>Техническое обслуживание</small></span>
      </RouterLink>
      <button class="sidebar-collapse-btn" type="button" :title="ui.sidebarCollapsed?'Развернуть меню':'Свернуть меню'"
        :aria-label="ui.sidebarCollapsed?'Развернуть меню':'Свернуть меню'"
        @click="ui.sidebarCollapsed=!ui.sidebarCollapsed">
        <PanelLeftOpen v-if="ui.sidebarCollapsed" :size="19" /><PanelLeftClose v-else :size="19" />
      </button>
      <button class="mobile-close-btn" type="button" aria-label="Закрыть меню" @click="close"><X :size="20" /></button>
    </div>
    <nav class="toir-nav" aria-label="Меню ТОИР">
      <RouterLink to="/" class="toir-nav-item" :class="{active:route.path==='/'}" title="Рабочий стол" @click="close">
        <LayoutDashboard :size="19" /><span>Рабочий стол</span>
      </RouterLink>
      <div class="nav-separator"></div>
      <div v-for="group in groups" :key="group.key" class="nav-group">
        <button type="button" class="group-toggle" :aria-expanded="!!expanded[group.key]"
          :title="group.label" @click="toggle(group.key)">
          <component :is="group.icon" :size="19" aria-hidden="true" />
          <span>{{ group.label }}</span>
          <ChevronDown class="group-chevron" :class="{up:expanded[group.key]}" :size="15" />
        </button>
        <div v-if="expanded[group.key]&&!ui.sidebarCollapsed" class="group-subnav">
          <RouterLink v-for="link in group.children" :key="link.path" :to="link.path" class="subnav-link"
            :class="{active:isActive(link.path)}" @click="close">{{ link.label }}</RouterLink>
        </div>
      </div>
      <div class="nav-separator"></div>
      <RouterLink to="/notifications" class="toir-nav-item" :class="{active:route.path==='/notifications'}" @click="close">
        <Bell :size="19" /><span>Уведомления</span>
      </RouterLink>
      <RouterLink to="/chat" class="toir-nav-item" :class="{active:route.path==='/chat'}" @click="close">
        <MessageCircle :size="19" /><span>Чат</span>
      </RouterLink>
      <RouterLink to="/settings" class="toir-nav-item" :class="{active:route.path==='/settings'}" @click="close">
        <Settings :size="19" /><span>Конфигурация</span>
      </RouterLink>
    </nav>
    <div class="toir-sidebar-foot">
      <div class="foot-logo"><Wrench :size="19" aria-hidden="true" /></div>
      <div class="sidebar-user-copy">
        <strong>{{ session.session?.user.name }}</strong>
        <small>{{ session.session?.user.email }}</small>
      </div>
    </div>
  </aside>
  <button v-if="mobileOpen" type="button" class="sidebar-shade" aria-label="Закрыть меню" @click="close"></button>
</template>

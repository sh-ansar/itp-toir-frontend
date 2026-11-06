<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute,useRouter } from 'vue-router'
import { AppSidebar as SharedAppSidebar } from '@itpmining/vue-basic-components'
import {
  Wrench, ClipboardList, CalendarDays, Users, FolderKanban,
  Boxes, Package, Warehouse, Hammer, Cog, Truck, Bell, MessageCircle,
  FileBarChart, Settings, ChevronDown,
  X, LayoutDashboard, BriefcaseBusiness, ShieldAlert, Network, UsersRound
} from 'lucide-vue-next'
import { usePreferencesStore } from '../../stores/preferences'
import { useSessionStore } from '../../stores/session'

const props=defineProps<{mobileOpen:boolean}>()
const emit=defineEmits<{'update:mobileOpen':[v:boolean]}>()
const route=useRoute()
const ui=usePreferencesStore()
const session=useSessionStore()
const expanded=ref<Record<string,boolean>>({maintenance:true,assets:true,supplies:false,reports:true})
const groups=[
  {key:'maintenance',label:'Ремонт и обслуживание',icon:Wrench,children:[
    {label:'Наряд-задания',path:'/work-orders',icon:ClipboardList},
    {label:'Планирование',path:'/plans',icon:Cog},
    {label:'Бригады и смены',path:'/crews',icon:UsersRound},
    {label:'Расписание',path:'/schedule',icon:CalendarDays},
    {label:'Сотрудники',path:'/employees',icon:Users},
    {label:'Проекты',path:'/projects',icon:FolderKanban}
  ]},
  {key:'assets',label:'Активы',icon:Boxes,children:[
    {label:'Все активы',path:'/assets',icon:Package},
    {label:'Цифровая структура',path:'/asset-tree',icon:Network},
    {label:'Помещение',path:'/assets?category=premises',icon:Warehouse},
    {label:'Оборудование',path:'/assets?category=equipment',icon:Cog},
    {label:'Инструменты',path:'/assets?category=tools',icon:Hammer},
    {label:'Запчасти и расходные материалы',path:'/assets?category=materials',icon:Package}
  ]},
  {key:'supplies',label:'Поставки',icon:Truck,children:[
    {label:'Заявки на склад',path:'/supplies',icon:Package},
    {label:'Склад и остатки',path:'/warehouse',icon:Warehouse},
    {label:'Тендеры',path:'/tenders',icon:BriefcaseBusiness}
  ]},
  {key:'reports',label:'Отчеты',icon:FileBarChart,children:[
    {label:'По ремонтам',path:'/reports/repairs',icon:FileBarChart},
    {label:'Рейтинг сотрудников',path:'/reports/employees',icon:Users},
    {label:'Наличие запчастей на складе',path:'/reports/warehouse',icon:Package},
    {label:'По качеству ремонта',path:'/reports/quality',icon:Cog},
    {label:'Риски оборудования',path:'/risk',icon:ShieldAlert},
    {label:'История ремонта',path:'/reports/history',icon:ClipboardList}
  ]}
]
const router=useRouter()
const activeId=computed(()=>{
  if(route.path==='/dashboard')return 'dashboard'
  return route.fullPath
})
const items=computed(()=>[
  {id:'dashboard',label:'Рабочий стол',href:router.resolve('/dashboard').href,iconComponent:LayoutDashboard},
  {id:'separator1',label:'',separator:true},
  ...groups.map(group=>({
    id:group.key,label:group.label,href:router.resolve(group.children[0].path).href,
    iconComponent:group.icon,
    children:group.children.map(link=>({
      id:link.path,label:link.label,href:router.resolve(link.path).href,iconComponent:link.icon
    }))
  })),
  {id:'separator2',label:'',separator:true},
  {id:'/notifications',label:'Уведомления',href:router.resolve('/notifications').href,iconComponent:Bell},
  {id:'/chat',label:'Чат',href:router.resolve('/chat').href,iconComponent:MessageCircle},
  {id:'/settings',label:'Конфигурация',href:router.resolve('/settings').href,iconComponent:Settings}
])
const logoSrc=import.meta.env.BASE_URL+'brand/toir-gear.svg'
function close(){emit('update:mobileOpen',false)}
function navigate(item:{id:string;href?:string},event:MouseEvent){
  event.preventDefault()
  if(!item.href)return
  if(ui.sidebarCollapsed&&!props.mobileOpen&&groups.some(group=>group.key===item.id)){
    ui.toggleSidebar();return
  }
  void router.push(item.href)
  close()
}
</script>
<template>
  <aside class="sidebar toir-sidebar" :class="{'toir-sidebar--collapsed':ui.sidebarCollapsed&&!mobileOpen,'sidebar--open':mobileOpen}">
    <SharedAppSidebar :items="items" :active-id="activeId" :collapsed="ui.sidebarCollapsed&&!mobileOpen"
      brand="ITP ТОиР" navigation-label="Меню ТОиР"
      collapse-label="Свернуть меню" expand-label="Развернуть меню"
      @toggle-collapse="ui.toggleSidebar()" @navigate="navigate">
      <template #brand>
        <RouterLink to="/dashboard" class="brand-link" title="ITP ТОиР" @click="close">
          <img class="toir-brand-icon" :src="logoSrc" alt="ITP ТОиР" width="42" height="42"/>
          <span v-if="!ui.sidebarCollapsed||mobileOpen" class="brand-copy"><strong>ITP ТОиР</strong></span>
        </RouterLink>

      </template>
      <template #icon="{item}">
        <component :is="item.iconComponent" :size="19" aria-hidden="true"/>
      </template>
      <template #footer>
        <div class="toir-sidebar-foot">
          <img :src="logoSrc" alt="" width="28" height="28" aria-hidden="true"/>
          <div v-if="!ui.sidebarCollapsed||mobileOpen" class="sidebar-user-copy">
            <strong>{{session.session?.user.name}}</strong>
            <small>{{session.session?.user.email}}</small>
          </div>
        </div>
      </template>
    </SharedAppSidebar>
  </aside>
  <button v-if="mobileOpen" type="button" class="sidebar-shade" aria-label="Закрыть меню" @click="close"></button>
</template>
<style scoped>
.toir-sidebar :deep(.itp-ui-sidebar){width:100%;min-height:100%;max-height:100dvh;overflow-y:auto}
.toir-sidebar :deep(.itp-ui-sidebar__brand){min-height:68px}
.brand-link{display:flex;align-items:center;gap:11px;min-width:0;color:inherit;text-decoration:none}
.toir-sidebar-foot{display:flex;align-items:center;gap:8px;min-width:0}
.sidebar-user-copy{display:grid;gap:2px;min-width:0}
.sidebar-user-copy>*{min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
</style>

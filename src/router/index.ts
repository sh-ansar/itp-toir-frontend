import { createRouter, createWebHistory } from 'vue-router'
import { useSessionStore } from '../stores/session'
import LoginView from '../views/LoginView.vue'
import ForgotPasswordView from '../views/ForgotPasswordView.vue'
import ResetPasswordView from '../views/ResetPasswordView.vue'
import HomeView from '../views/HomeView.vue'
import ProfileView from '../views/ProfileView.vue'
import NotFoundView from '../views/NotFoundView.vue'
import RegistryView from '../views/modules/RegistryView.vue'
import DetailView from '../views/modules/DetailView.vue'
import PlanningView from '../views/modules/PlanningView.vue'
import ScheduleView from '../views/modules/ScheduleView.vue'
import ReportsView from '../views/modules/ReportsView.vue'
import NotificationsView from '../views/modules/NotificationsView.vue'
import ChatView from '../views/modules/ChatView.vue'
import WarehouseView from '../views/modules/WarehouseView.vue'
import SettingsView from '../views/modules/SettingsView.vue'
import type { ResourceName } from '../types/toir'

const resourceRoutes = [
  { path:'/work-orders',resource:'work-orders'},
  { path:'/assets',resource:'assets'},
  { path:'/employees',resource:'employees'},
  { path:'/projects',resource:'projects'},
  { path:'/supplies',resource:'supplies'},
  { path:'/tenders',resource:'tenders'},
] as const

export const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    { path:'/',name:'home',component:HomeView,meta:{auth:true} },
    { path:'/profile',name:'profile',component:ProfileView,meta:{auth:true} },
    { path:'/login',name:'login',component:LoginView },
    { path:'/forgot-password',name:'forgot',component:ForgotPasswordView },
    { path:'/reset-password',name:'reset',component:ResetPasswordView },
    ...resourceRoutes.flatMap(item=>[
      {path:item.path,name:item.resource+'-list',component:RegistryView,
        props:{resource:item.resource as ResourceName},meta:{auth:true}},
      {path:item.path+'/:id',name:item.resource+'-detail',component:DetailView,
        props:(route:{params:Record<string,unknown>})=>({resource:item.resource as ResourceName,id:String(route.params.id)}),
        meta:{auth:true}}
    ]),
    {path:'/plans',name:'plans',component:PlanningView,meta:{auth:true}},
    {path:'/plans/list',name:'plans-list',component:RegistryView,props:{resource:'plans'},meta:{auth:true}},
    {path:'/plans/:id',name:'plan-detail',component:DetailView,
      props:(route:{params:Record<string,unknown>})=>({resource:'plans',id:String(route.params.id)}),meta:{auth:true}},
    {path:'/schedule',name:'schedule',component:ScheduleView,meta:{auth:true}},
    {path:'/reports/:report',name:'reports',component:ReportsView,
      props:(route:{params:Record<string,unknown>})=>({report:String(route.params.report)}),meta:{auth:true}},
    {path:'/reports',redirect:'/reports/repairs'},
    {path:'/notifications',name:'notifications',component:NotificationsView,meta:{auth:true}},
    {path:'/warehouse',name:'warehouse',component:WarehouseView,meta:{auth:true}},
    {path:'/chat',name:'chat',component:ChatView,meta:{auth:true}},
    {path:'/settings',name:'settings',component:SettingsView,meta:{auth:true}},
    {path:'/:pathMatch(.*)*',name:'404',component:NotFoundView },
  ]
})

router.beforeEach(async (to) => {
  if(!to.meta.auth)return true
  const store=useSessionStore()
  if(!store.checked)await store.refresh()
  if(store.session)return true
  return {name:'login',query:{redirect:to.fullPath}}
})

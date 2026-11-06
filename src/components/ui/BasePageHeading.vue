<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { PageHeader } from '@itpmining/vue-basic-components'
const props = withDefaults(defineProps<{ title:string; description?:string; eyebrow?:string }>(), {description:'',eyebrow:''})
const route=useRoute(),router=useRouter()
const pageTitles:Record<string,string>={
  dashboard:'Рабочий стол','work-orders':'Наряд-задания',assets:'Активы',
  'asset-tree':'Цифровая структура оборудования',employees:'Сотрудники',
  projects:'Проекты',supplies:'Поставки',tenders:'Тендеры',plans:'Планирование',
  crews:'Бригады и смены',schedule:'Расписание',risk:'Риски оборудования',
  reports:'Отчёты',warehouse:'Склад и остатки',settings:'Конфигурация',
  profile:'Профиль',notifications:'Уведомления',chat:'Чат',billing:'Оплата'
}
const breadcrumbs=computed(()=>{
  const parts=route.path.split('/').filter(Boolean)
  if(parts[0]==='dashboard')return [{label:'Рабочий стол'}]
  const list:Array<{label:string;href?:string}>=[{label:'Рабочий стол',href:router.resolve('/dashboard').href}]
  if(parts[0]==='asset-tree')list.push({label:'Активы',href:router.resolve('/assets').href})
  if(parts.length>1&&parts[0]!=='asset-tree')list.push({
    label:pageTitles[parts[0]]||parts[0],href:router.resolve('/'+parts[0]).href
  })
  list.push({label:props.title})
  return list
})
</script>
<template>
  <div class="base-page-heading">
    <span v-if="eyebrow" class="base-page-heading__eyebrow">{{eyebrow}}</span>
    <PageHeader :title="title" :description="description" :breadcrumbs="breadcrumbs" breadcrumbs-label="Навигация по страницам">
      <template v-if="$slots.default || $slots.info" #actions>
        <slot name="info"/><slot/>
      </template>
    </PageHeader>
  </div>
</template>
<style scoped>
.base-page-heading { min-width:0; width:100% }
.base-page-heading__eyebrow {display:block;color:var(--color-primary);font-size:12px;font-weight:500}
</style>

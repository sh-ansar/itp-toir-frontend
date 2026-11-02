import type { ResourceName } from '../types/toir'

export interface FieldConfig {
  key: string
  label: string
  type?: 'text'|'email'|'number'|'date'|'datetime-local'|'textarea'|'select'|'asset'|'employee'|'project'|'parent'
  required?: boolean
  options?: { value:string; label:string }[]
  width?: number
}
export interface ModuleSpec {
  resource: ResourceName
  title: string
  singular: string
  description: string
  breadcrumb: string
  columns: { key:string; label:string; width?:number }[]
  fields: FieldConfig[]
  tabs?:{key:string;label:string}[]
}

const statusOptions = (...values:string[]) => values.map(value=>({
  value, label: ({active:'Активен',maintenance:'На обслуживании',inactive:'Неактивен',retired:'Списан',
  waiting:'Ожидает',in_progress:'В работе',overdue:'Просрочено',closed:'Закрыто',
  planned:'Планируется',paused:'Приостановлено',completed:'Завершено',
  vacation:'В отпуске',requested:'Запрошено',ordered:'Заказано',delivered:'Поставлено',
  cancelled:'Отменено',draft:'Черновик',published:'Опубликован',evaluation:'На оценке'} as Record<string,string>)[value]||value
}))

export const specs:Record<ResourceName,ModuleSpec> = {
  'assets': {
    resource:'assets',title:'Список активов',singular:'Актив',
    description:'Единый реестр помещений, оборудования, инструментов и материалов',
    breadcrumb:'Активы / Все активы',
    columns:[{key:'name',label:'Наименование',width:230},{key:'location',label:'Местоположение',width:210},
      {key:'category',label:'Категория',width:190},{key:'code',label:'Внутренний номер',width:140},
      {key:'status',label:'Статус',width:115},{key:'purchase_value',label:'Стоимость',width:140}],
    fields:[
      {key:'name',label:'Наименование',required:true},
      {key:'code',label:'Внутренний номер',required:true},
      {key:'category',label:'Категория актива',type:'select',required:true,options:[
        {value:'premises',label:'Помещение'},{value:'equipment',label:'Оборудование'},
        {value:'tools',label:'Инструменты'},{value:'materials',label:'Запчасти и материалы'}]},
      {key:'parent_id',label:'Родительский актив',type:'parent'},
      {key:'status',label:'Состояние',type:'select',options:statusOptions('active','maintenance','inactive','retired')},
      {key:'location',label:'Местоположение'},
      {key:'manufacturer',label:'Производитель'},
      {key:'model',label:'Модель'},
      {key:'serial_number',label:'Серийный номер'},
      {key:'commissioned_at',label:'Дата ввода',type:'date'},
      {key:'purchase_value',label:'Первоначальная стоимость',type:'number'},
      {key:'description',label:'Описание',type:'textarea'}],
    tabs:[{key:'all',label:'Все активы'},{key:'premises',label:'Помещение'},
      {key:'equipment',label:'Оборудование'},{key:'tools',label:'Инструменты'},
      {key:'materials',label:'Запчасти и материалы'}]
  },
  'employees':{
    resource:'employees', title:'Список сотрудников',singular:'Сотрудник',
    description:'Исполнители, инженерные специалисты и рабочие группы',
    breadcrumb:'Ремонт и обслуживание / Сотрудники',
    columns:[{key:'name',label:'Фамилия и имя',width:235},{key:'position',label:'Должность',width:205},
      {key:'email',label:'Email',width:210},{key:'department',label:'Рабочая группа',width:190},
      {key:'status',label:'Статус',width:125}],
    fields:[{key:'name',label:'ФИО',required:true},{key:'email',label:'Email',type:'email'},
      {key:'position',label:'Должность'},{key:'department',label:'Рабочая группа'},
      {key:'phone',label:'Телефон'},
      {key:'status',label:'Статус',type:'select',options:statusOptions('active','vacation','inactive')}]
  },
  'projects':{
    resource:'projects',title:'Список проектов',singular:'Проект',
    description:'Технические проекты, капитальные ремонты и программы работ',
    breadcrumb:'Ремонт и обслуживание / Проекты',
    columns:[{key:'code',label:'Код',width:150},{key:'name',label:'Наименование',width:280},
      {key:'manager_name',label:'Руководитель',width:195},{key:'status',label:'Статус',width:150},
      {key:'start_date',label:'Начало',width:145},{key:'end_date',label:'Завершение',width:145}],
    fields:[{key:'name',label:'Наименование проекта',required:true},{key:'code',label:'Код проекта',required:true},
      {key:'manager_name',label:'Руководитель'},
      {key:'start_date',label:'Дата начала',type:'date'},
      {key:'end_date',label:'Дата завершения',type:'date'},
      {key:'status',label:'Статус',type:'select',options:statusOptions('planned','active','paused','completed')},
      {key:'description',label:'Описание',type:'textarea'}]
  },
  'work-orders':{
    resource:'work-orders',title:'Список наряд-заданий',singular:'Наряд-задание',
    description:'Управление плановыми и аварийными работами',
    breadcrumb:'Ремонт и обслуживание / Наряд-задания',
    columns:[{key:'number',label:'Номер',width:130},{key:'created_at',label:'Дата',width:150},
      {key:'asset',label:'Актив',width:200},{key:'title',label:'Описание',width:250},
      {key:'type',label:'Тип',width:125},{key:'status',label:'Статус',width:130},
      {key:'employee',label:'Исполнитель',width:200}],
    fields:[{key:'title',label:'Задание',required:true},
      {key:'asset_id',label:'Актив',type:'asset'},{key:'project_id',label:'Проект',type:'project'},
      {key:'type',label:'Тип работ',type:'select',options:[{value:'planned',label:'Плановая'},{value:'emergency',label:'Аварийная'}]},
      {key:'employee_id',label:'Исполнитель',type:'employee'},
      {key:'planned_start',label:'Плановое начало',type:'datetime-local'},
      {key:'planned_end',label:'Плановое завершение',type:'datetime-local'},
      {key:'estimated_cost',label:'Смета',type:'number'},
      {key:'description',label:'Описание работ',type:'textarea'}],
    tabs:[{key:'all',label:'Все'},{key:'waiting',label:'Ожидают'},
      {key:'overdue',label:'Просрочено'},{key:'in_progress',label:'В работе'},
      {key:'closed',label:'Закрытые'}]
  },
  'plans':{
    resource:'plans',title:'Планирование ТО',singular:'План ТО',
    description:'Планово-предупредительное обслуживание оборудования',
    breadcrumb:'Ремонт и обслуживание / Планирование',
    columns:[{key:'title',label:'Мероприятие',width:250},{key:'asset',label:'Актив',width:230},
      {key:'next_due_date',label:'Следующее ТО',width:160},{key:'periodicity_days',label:'Периодичность, дней',width:170},
      {key:'employee',label:'Исполнитель',width:175},{key:'status',label:'Статус',width:130}],
    fields:[{key:'title',label:'Название мероприятия',required:true},
      {key:'asset_id',label:'Актив',type:'asset',required:true},
      {key:'employee_id',label:'Ответственный',type:'employee'},
      {key:'start_date',label:'Дата начала',type:'date'},
      {key:'next_due_date',label:'Следующая дата ТО',type:'date',required:true},
      {key:'periodicity_days',label:'Периодичность (дней)',type:'number',required:true},
      {key:'status',label:'Статус',type:'select',options:statusOptions('planned','active','paused','completed')},
      {key:'description',label:'Описание',type:'textarea'}]
  },
  'supplies':{
    resource:'supplies',title:'Заявки на склад',singular:'Заявка на склад',
    description:'Материалы, запчасти, инструменты и обеспечение ремонтов',
    breadcrumb:'Поставки / Заявки на склад',
    columns:[{key:'name',label:'Номенклатура',width:250},{key:'category',label:'Категория',width:160},
      {key:'quantity',label:'Количество',width:130},{key:'unit',label:'Единица',width:110},
      {key:'unit_price',label:'Цена за единицу',width:155},{key:'status',label:'Статус',width:140}],
    fields:[{key:'name',label:'Наименование',required:true},
      {key:'asset_id',label:'Связанный актив',type:'asset'},
      {key:'category',label:'Категория',type:'select',options:[{value:'spares',label:'Запчасти'},{value:'materials',label:'Материалы'},{value:'tools',label:'Инструменты'}]},
      {key:'quantity',label:'Количество',type:'number'},
      {key:'unit',label:'Единица измерения'},
      {key:'unit_price',label:'Цена за единицу',type:'number'},
      {key:'status',label:'Статус',type:'select',options:statusOptions('requested','ordered','cancelled')},
      {key:'requested_at',label:'Дата запроса',type:'date'}]
  },
  'tenders':{
    resource:'tenders',title:'Список тендеров',singular:'Тендер',
    description:'Потребности в закупках для обслуживания оборудования',
    breadcrumb:'Поставки / Тендеры',
    columns:[{key:'number',label:'Номер',width:155},{key:'title',label:'Название',width:290},
      {key:'status',label:'Статус',width:150},{key:'budget',label:'Бюджет',width:160},
      {key:'deadline_at',label:'Срок',width:175}],
    fields:[{key:'title',label:'Название',required:true},
      {key:'number',label:'Номер',required:true},
      {key:'status',label:'Статус',type:'select',options:statusOptions('draft','published','evaluation','completed','cancelled')},
      {key:'budget',label:'Бюджет',type:'number'},
      {key:'deadline_at',label:'Срок',type:'date'},
      {key:'description',label:'Описание',type:'textarea'}]
  }
}
export const STATUS_LABELS:Record<string,string> = {
  ...Object.fromEntries(statusOptions('active','maintenance','inactive','retired','waiting','in_progress','overdue','closed',
    'planned','paused','completed','vacation','requested','ordered','delivered','cancelled','draft','published','evaluation').map(o=>[o.value,o.label])),
  equipment:'Оборудование',premises:'Помещение',tools:'Инструменты',materials:'Запчасти и материалы',
  emergency:'Аварийная',spares:'Запчасти'
}
export function canEdit(role:string|null|undefined,resource:ResourceName) {
  return ['owner','admin','manager'].includes(role||'') || (role==='engineer' && ['work-orders','plans','supplies'].includes(resource))
}

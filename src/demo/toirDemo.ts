import type { Overview, ResourceName, ScheduleResponse, ToirRecord } from '../types/toir'
import type { ResourceQuery } from '../api/resources'

// Only visual examples. They are never sent to or saved in the TOIR database.
const company_id = 1
const today = new Date()
today.setHours(12, 0, 0, 0)
const isoDay = (days = 0): string => {
  const date = new Date(today)
  date.setDate(date.getDate() + days)
  return date.toISOString().slice(0, 10)
}
const isoTime = (days = 0, hours = 9): string => isoDay(days) + 'T' + String(hours).padStart(2, '0') + ':00:00'

const rootAssets: Array<[string,string,string]> = [
  ['Цех № 1','P-01','Производственный комплекс'],
  ['Цех № 2','P-02','Производственный комплекс'],
  ['Компрессорная станция','P-03','Основная промплощадка'],
  ['Электрощитовая','P-04','Производственный комплекс']
]
const equipmentNames = [
  'Шкаф взрывозащищённый ТЕХ серия 619 120','Насос циркуляционный NCP-180',
  'Компрессор винтовой КВ-200','Электродвигатель АИР-160',
  'Теплообменник пластинчатый ТП-450','Редуктор привода РМ-500',
  'Вентиляционная установка ВУ-1200','Трансформатор силовой ТМГ',
  'Гидравлическая станция ГС-90','Насос дозировочный НД-50',
  'Конвейер ленточный ЛК-03','Станок токарный ТВ-7',
  'Датчик давления ДД-150','Шкаф автоматики ЩА-4',
  'Клапан предохранительный КП-12','Электрический щит ЭЩ-08'
]
const toolsNames = ['Набор слесарных ключей','Тестер электроизоляции','Перфоратор промышленный','Калибратор температуры']
const materialsNames = ['Подшипник 6205','Прокладка графитовая','Фильтр масляный','Муфта соединительная']
const assets:ToirRecord[] = [
  ...rootAssets.map(([name,code,location], index) => ({
    id:index+1, company_id, name,code,location,category:'premises',status:'active',
    purchase_value: String(22000000 + index * 1850000), description:'Производственный объект и обслуживаемые технологические зоны',
    created_at:isoTime(-230-index*4),
  })),
  ...equipmentNames.map((name,index)=>({
    id:index+5,company_id,name,code:'EQ-'+String(index+101),
    parent_id:(index%4)+1,category:'equipment',status:index===4?'maintenance':'active',
    location:rootAssets[index%4][0],manufacturer:['ТехМаш','ПромЭнерго','ЭлКонтроль'][index%3],
    model:'ТМ-'+(100+index),serial_number:'SN-26-'+String(1000+index),
    commissioned_at:isoDay(-800+index*13),purchase_value:String(1450000+index*115000),
    description:'Технологическое оборудование производственного участка. Регламентное обслуживание по плану.',
    created_at:isoTime(-210-index),
  })),
  ...toolsNames.map((name,index)=>({
    id:21+index,company_id,name,code:'TL-'+(101+index),category:'tools',status:'active',
    parent_id:2,location:'Цех № 2',purchase_value:String(85000+index*29000),
    description:'Инструмент ремонтной группы',created_at:isoTime(-100-index),
  })),
  ...materialsNames.map((name,index)=>({
    id:25+index,company_id,name,code:'MT-'+(101+index),category:'materials',status:'active',
    location:'Основной склад',purchase_value:String(14500+index*5200),
    description:'Комплектующее для ремонтных работ',created_at:isoTime(-50-index),
  })),
]
for (const asset of assets) {
  asset.parent = assets.find(parent=>parent.id===asset.parent_id)||null
}

const names = [
  'Александр Петров','Дмитрий Ковалёв','Максим Орлов','Сергей Соколов',
  'Виктор Смирнов','Николай Егоров','Андрей Волков','Иван Белов',
  'Руслан Иванов','Виталий Кузнецов','Антон Морозов','Алексей Данилов',
  'Михаил Лебедев','Павел Новиков','Евгений Попов'
]
const positions = ['Главный механик','Инженер по ремонту','Электромеханик','Слесарь-ремонтник','Мастер участка']
const employees:ToirRecord[] = names.map((name,index)=>({
  id:index+1,company_id,name,email:'specialist'+(index+1)+'@example.test',
  position:positions[index%positions.length],
  department:['Ремонтная группа № 1','Ремонтная группа № 2','Энергослужба'][index%3],
  phone:'+7 700 000 '+String(index+1).padStart(2,'0')+' '+String(index+1).padStart(2,'0'),
  status:index===8?'vacation':'active',
  created_at:isoTime(-150-index),
}))
const projects:ToirRecord[] = [
  'Капитальный ремонт насосного оборудования','Диагностика электродвигателей',
  'Модернизация электрощитовой','Плановое обслуживание компрессорной',
  'Техническое освидетельствование оборудования','Замена узлов транспортировки'
].map((name,index)=>({
  id:index+1,company_id,name,code:'PRJ-'+String(index+1).padStart(3,'0'),
  manager_name:names[index],status:index===0?'active':index===5?'completed':'planned',
  start_date:isoDay(-35+index*5),end_date:isoDay(20+index*12),
  description:'Программа мероприятий по повышению надёжности производственного оборудования.',
  created_at:isoTime(-90-index),
}))
const taskTitles = [
  'Ремонт динамического оборудования','Проверка электромеханических соединений',
  'Плановая диагностика насосной станции','Замена изношенного подшипника',
  'Проверка системы охлаждения','Ревизия контактных групп',
  'Техническое обслуживание шкафа автоматики','Проверка состояния теплообменника',
  'Смазка подвижных частей','Проверка заземления оборудования',
  'Калибровка датчиков давления','Регулировка приводного механизма',
]
const statusSequence = ['waiting','in_progress','closed','waiting','overdue','in_progress','closed','waiting','closed','in_progress','waiting','closed']
const orders:ToirRecord[]=Array.from({length:36},(_,index)=>{
  const asset = assets[4 + index%16]
  const employee = employees[index%employees.length]
  const project = projects[index%projects.length]
  const status=statusSequence[index%statusSequence.length]
  const plannedShift=(index%21)-9
  return {
    id:1000+index,company_id,number:'НЗ-'+String(112235+index),
    title:taskTitles[index%taskTitles.length],
    description:'Провести диагностику оборудования, проверить состояние узлов, выполнить работы согласно регламенту и оформить результаты.',
    type:index%8===0?'emergency':'planned',status,
    asset_id:asset.id,asset,
    employee_id:employee.id,employee,
    project_id:project.id,project,
    planned_start:isoTime(plannedShift,8+index%5),
    planned_end:isoTime(plannedShift+(index%4===0?2:0),15),
    actual_start:status==='closed'?isoTime(plannedShift,9):undefined,
    actual_end:status==='closed'?isoTime(plannedShift,14):undefined,
    estimated_cost:String(12500+(index%9)*6800),
    created_at:isoTime(-20-index,10),updated_at:isoTime(-index%7,16),
    events:[
      {id:3000+index*2,action:'created',message:'Создано наряд-задание',changes:{status:'waiting'},created_at:isoTime(-20-index)},
      {id:3001+index*2,action:'updated',message:status==='closed'?'Работы выполнены':'Статус обновлён',
        changes:{status},created_at:isoTime(-index%7,16)},
    ]
  }
})
const plans:ToirRecord[]=Array.from({length:18},(_,index)=>{
  const asset=assets[4+index%16]
  const employee=employees[index%employees.length]
  return {
    id:index+1,company_id,title:['Проверка заземления','Регламентное ТО','Замена фильтров','Ревизия электрооборудования','Смазка узлов','Проверка соединений'][index%6],
    asset_id:asset.id,asset,employee_id:employee.id,employee,
    periodicity_days:[7,30,90,180][index%4],
    status:index%7===0?'completed':index%4===0?'active':'planned',
    next_due_date:isoDay(index*2-12),start_date:isoDay(-120),
    description:'Планово-предупредительное техническое обслуживание.',
    created_at:isoTime(-140-index),
  }
})
const supplies:ToirRecord[]=Array.from({length:22},(_,index)=>{
  const asset=assets[4+index%16]
  return {
    id:index+1,company_id,name:[
      'Подшипник шариковый 6205','Комплект уплотнительных колец',
      'Фильтр воздушный ФВ-200','Масло техническое ISO VG 46',
      'Кабель силовой 4×2.5','Клапан обратный DN50',
      'Прокладка фланцевая','Контактор силовой'
    ][index%8],
    asset_id:asset.id,asset,
    category:index%5===0?'tools':index%2===0?'spares':'materials',
    quantity:String(2+(index*7)%21),unit:index%3===0?'м':'шт.',
    unit_price:String(4200+index*1700),
    status:['requested','ordered','delivered'][index%3],requested_at:isoDay(-7-index),
    created_at:isoTime(-7-index),
  }
})
const tenders:ToirRecord[]=Array.from({length:9},(_,index)=>({
  id:index+1,company_id,number:'ТН-'+String(2026001+index),
  title:[
    'Поставка подшипников и уплотнений','Ремонт приводов конвейерной линии',
    'Поставка электротехнических материалов','Закупка измерительного инструмента',
    'Плановая поставка фильтрующих элементов'
  ][index%5],
  status:['draft','published','evaluation','completed'][index%4],
  budget:String(150000+index*82000),deadline_at:isoDay(5+index*4),
  description:'Потребность подразделения в оборудовании и материалах.',
  created_at:isoTime(-18-index),
}))
const records: Record<ResourceName, ToirRecord[]> = {
  assets,employees,projects,'work-orders':orders,plans,supplies,tenders,
}

export function demoList(resource:ResourceName, query:ResourceQuery={}):{
  data:ToirRecord[], meta:{total:number;current_page:number;last_page:number;per_page:number}
} {
  let result = records[resource]
  if (query.search?.trim()){
    const needle=query.search.trim().toLocaleLowerCase('ru')
    result=result.filter(row=>[
      row.name,row.title,row.number,row.code,row.location,row.position,row.description,
      row.asset?.name,row.employee?.name,row.department,row.email
    ].some(value=>String(value||'').toLocaleLowerCase('ru').includes(needle)))
  }
  for(const key of ['status','category','asset_id','employee_id'] as const){
    const value=query[key]
    if(value!==undefined&&value!==null&&String(value)!==''){
      result=result.filter(row=>String(row[key]||'')===String(value))
    }
  }
  const page=Math.max(1,Math.floor(Number(query.page)||1))
  const size=Math.min(100,Math.max(1,Math.floor(Number(query.per_page)||15)))
  const total=result.length
  return {
    data:result.slice((page-1)*size,page*size),
    meta:{total,current_page:page,last_page:Math.max(1,Math.ceil(total/size)),per_page:size}
  }
}
export function demoFind(resource:ResourceName,id:number):ToirRecord{
  const row=records[resource].find(record=>record.id===id)
  if(!row)throw new Error('Демонстрационная запись не найдена')
  return row
}
export function demoOverview():Overview{
  const count=(status:string)=>orders.filter(r=>r.status===status).length
  return {
    assets:assets.length,employees:employees.length,projects:projects.length,
    work_orders:orders.length,
    waiting:count('waiting'),in_progress:count('in_progress'),
    overdue:count('overdue'),closed:count('closed'),plans:plans.length,
    plans_overdue:plans.filter(p=>p.next_due_date!<isoDay()&&p.status!=='completed').length,
    supplies_requested:supplies.filter(s=>s.status==='requested').length,
    tenders:tenders.length
  }
}
export function demoSchedule():ScheduleResponse {
  return {orders,plans}
}

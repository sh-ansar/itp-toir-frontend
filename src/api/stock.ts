import { api } from './client'
import { usePreviewStore } from '../stores/preview'
import type { PageMeta } from '../types/toir'

export interface StockItem {
  id:number
  company_id:number
  sku:string
  name:string
  unit:string
  quantity_on_hand:string
  quantity_reserved:string
  available_quantity?:string
  unit_cost:string
  minimum_quantity:string
  [key:string]:unknown
}
export interface StockMovement {
  id:number
  action:string
  quantity:string
  delta_on_hand:string
  delta_reserved:string
  unit_cost:string
  note:string|null
  work_order_id:number|null
  created_at:string
}
export interface OrderMaterial {
  id:number
  item:StockItem
  quantity_reserved:string
  quantity_used:string
  actual_cost:string
}
export interface StockList {data:StockItem[];meta:PageMeta}
export interface MaterialsList {data:OrderMaterial[];actual_material_cost:string}
export const sampleStock:StockItem[]=[
  ['BR-6205','Подшипник 6205','шт.','48.000','6.000','280.00'],
  ['SEAL-DN80','Уплотнитель DN80','шт.','22.000','4.000','1850.00'],
  ['OIL-46','Масло гидравлическое ISO 46','л','135.000','21.000','2650.00'],
  ['FLT-200','Фильтр компрессорный ФК-200','шт.','8.000','3.000','4300.00'],
  ['GSK-12','Прокладка термостойкая','шт.','3.000','2.000','690.00'],
  ['BELT-A34','Ремень приводной А34','шт.','16.000','0.000','1850.00'],
  ['BOLT-M12','Болт М12×50','шт.','450.000','70.000','78.00'],
  ['LUBE-EP2','Смазка EP-2','кг','33.000','4.000','3100.00'],
  ['SW-16','Ключ гаечный 16 мм','шт.','13.000','1.000','1500.00'],
  ['FUSE-25','Предохранитель 25А','шт.','41.000','7.000','320.00'],
].map(([sku,name,unit,quantity_on_hand,quantity_reserved,unit_cost],index)=>({
  id:index+1,company_id:1,sku,name,unit,quantity_on_hand,quantity_reserved,
  available_quantity:(Number(quantity_on_hand)-Number(quantity_reserved)).toFixed(3),
  unit_cost,minimum_quantity:index===4?'5.000':'3.000',
}))
const protect=()=>{
  if(usePreviewStore().enabled)throw new Error('В демо-режиме нельзя изменять склад. Отключите просмотр макета.')
}
export async function getStock(params:{search?:string;low_stock?:boolean;page?:number;per_page?:number}={}):Promise<StockList>{
  if(usePreviewStore().enabled){
    const filtered=sampleStock.filter(i=>(!params.search || (i.sku+' '+i.name).toLowerCase().includes(params.search.toLowerCase()))
      && (!params.low_stock||Number(i.available_quantity)<=Number(i.minimum_quantity)))
    const page=params.page||1,per=params.per_page||20
    return {data:filtered.slice((page-1)*per,page*per),
      meta:{total:filtered.length,current_page:page,last_page:Math.max(1,Math.ceil(filtered.length/per)),per_page:per}}
  }
  const search=new URLSearchParams()
  for(const [k,v] of Object.entries(params))if(v!==undefined&&v!=='')search.set(k,String(v))
  return api('/api/v1/stock/items?'+search.toString())
}
export async function createStockItem(payload:Record<string,string>){protect();return api<{data:StockItem}>('/api/v1/stock/items',{method:'POST',body:payload})}
export async function updateStockItem(id:number,payload:Record<string,string>){protect();return api<{data:StockItem}>('/api/v1/stock/items/'+id,{method:'PATCH',body:payload})}
export async function receiveStock(id:number,quantity:string,note:string){protect();return api<{data:StockItem}>('/api/v1/stock/items/'+id+'/receive',{method:'POST',body:{quantity,note}})}
export async function receiveSupply(supplyId:number,stock_item_id:number):Promise<{data:StockItem;created:boolean}>{
  protect()
  return api('/api/v1/supplies/'+supplyId+'/receive',{method:'POST',body:{stock_item_id}})
}
export async function getStockMovements(id:number):Promise<{data:StockMovement[];meta:PageMeta}>{
  if(usePreviewStore().enabled)return {data:[],meta:{total:0,current_page:1,last_page:1,per_page:40}}
  return api('/api/v1/stock/items/'+id+'/movements')
}
export async function getOrderMaterials(id:number):Promise<MaterialsList>{
  if(usePreviewStore().enabled){
    const lines=sampleStock.slice(0,3).map((item,index)=>({
      id:index+1,item,quantity_reserved:index===0?'2.000':'0.000',
      quantity_used:index===0?'1.000':index===1?'2.000':'0.000',
      actual_cost:index===0?'280.00':index===1?'3700.00':'0.00',
    }))
    return {data:lines,actual_material_cost:'3980.00'}
  }
  return api('/api/v1/work-orders/'+id+'/materials')
}
export async function operateMaterial(orderId:number,stock_item_id:number,action:'reserve'|'consume'|'release',quantity:string){
  protect()
  return api('/api/v1/work-orders/'+orderId+'/materials',{
    method:'POST',body:{stock_item_id,action,quantity}
  })
}

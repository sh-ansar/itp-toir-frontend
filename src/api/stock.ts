import { api } from './client'
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
export async function getStock(params:{search?:string;low_stock?:boolean;page?:number;per_page?:number}={}):Promise<StockList>{
  const search=new URLSearchParams()
  for(const [k,v] of Object.entries(params))if(v!==undefined&&v!=='')search.set(k,String(v))
  return api('/api/v1/stock/items?'+search.toString())
}
export async function createStockItem(payload:Record<string,string>){return api<{data:StockItem}>('/api/v1/stock/items',{method:'POST',body:payload})}
export async function updateStockItem(id:number,payload:Record<string,string>){return api<{data:StockItem}>('/api/v1/stock/items/'+id,{method:'PATCH',body:payload})}
export async function receiveStock(id:number,quantity:string,note:string){return api<{data:StockItem}>('/api/v1/stock/items/'+id+'/receive',{method:'POST',body:{quantity,note}})}
export async function receiveSupply(supplyId:number,stock_item_id:number):Promise<{data:StockItem;created:boolean}>{

  return api('/api/v1/supplies/'+supplyId+'/receive',{method:'POST',body:{stock_item_id}})
}
export async function getStockMovements(id:number):Promise<{data:StockMovement[];meta:PageMeta}>{
  return api('/api/v1/stock/items/'+id+'/movements')
}
export async function getOrderMaterials(id:number):Promise<MaterialsList>{
  return api('/api/v1/work-orders/'+id+'/materials')
}
export async function operateMaterial(orderId:number,stock_item_id:number,action:'reserve'|'consume'|'release',quantity:string){

  return api('/api/v1/work-orders/'+orderId+'/materials',{
    method:'POST',body:{stock_item_id,action,quantity}
  })
}

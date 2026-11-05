'use strict'
const fs=require('fs'),path=require('path')
const root=path.resolve(__dirname,'../src')
function walk(d){return fs.readdirSync(d,{withFileTypes:true}).flatMap(e=>e.isDirectory()?walk(path.join(d,e.name)):[path.join(d,e.name)])}
const sources=walk(root).filter(x=>/\.(vue|ts)$/.test(x))
const errors=[]
let baseSelectUses=0,nativeSelects=0
for(const file of sources){
 const source=fs.readFileSync(file,'utf8')
 const rel=path.relative(root,file).replace(/\\/g,'/')
 const used=(source.match(/<BaseSelect(?=[\s>])/g)||[]).length
 const native=(source.match(/<select(?=[\s>])/g)||[]).length
 baseSelectUses+=used;nativeSelects+=native
 if(/usePreviewStore|preview\.enabled|sampleStock|sampleChats|sampleMessages|Демо-режим|Демонстрационн/.test(source)){
  errors.push('Obsolete demo reference: '+rel)
 }
 if(native && rel!=='components/ui/BaseSelect.vue')errors.push('Unshared native select: '+rel)
 if(used && !source.includes("import BaseSelect from "))errors.push('BaseSelect import missing: '+rel)
 if(used!==(source.match(/<\/BaseSelect>/g)||[]).length)errors.push('Unclosed BaseSelect tags: '+rel)
}
if(fs.existsSync(path.join(root,'stores/preview.ts')))errors.push('Obsolete preview store still exists')
if(baseSelectUses!==23)errors.push('Expected 23 shared selects, found '+baseSelectUses)
if(nativeSelects!==1)errors.push('Expected one native select inside BaseSelect, found '+nativeSelects)
if(errors.length){console.error('TOIR_UI_CONTRACT_FAILED',JSON.stringify(errors));process.exit(1)}
console.log('TOIR_UI_CONTRACT_PASS',JSON.stringify({files:sources.length,sharedSelects:baseSelectUses,obsoleteDemoReferences:0}))

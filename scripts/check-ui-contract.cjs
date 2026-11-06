'use strict'
const fs=require('fs'),path=require('path')
const root=path.resolve(__dirname,'../src')
function walk(d){return fs.readdirSync(d,{withFileTypes:true}).flatMap(e=>e.isDirectory()?walk(path.join(d,e.name)):[path.join(d,e.name)])}
const files=walk(root).filter(x=>/\.(vue|ts)$/.test(x))
const errors=[]
let selects=0,tables=0,rawButtons=0
for(const file of files){
 const source=fs.readFileSync(file,'utf8')
 const rel=path.relative(root,file).replace(/\\/g,'/')
 const used=(source.match(/<BaseSelect(?=[\s>])/g)||[]).length
 const native=(source.match(/<select(?=[\s>])/g)||[]).length
 const localTables=(source.match(/<table(?=[\s>])/g)||[]).length
 const buttons=(source.match(/<button(?=[\s>])/g)||[]).length
 selects+=used;tables+=localTables;rawButtons+=buttons
 if(/usePreviewStore|preview\.enabled|sampleStock|sampleChats|sampleMessages|Демо-режим|Демонстрационн/.test(source))errors.push('Obsolete demo reference: '+rel)
 if(native)errors.push('Unshared native select: '+rel)
 if(localTables)errors.push('Unshared native table: '+rel)
 const oldGenericButtons=[...source.matchAll(/<button\\b[^>]*>/g)].filter(m=>/class=["'][^"']*\\b(toolbar-icon|drawer-close|toir-toolbar-btn|base-button)\\b/.test(m[0]))
 if(oldGenericButtons.length)errors.push('Unshared generic action button: '+rel+' ('+oldGenericButtons.length+')')
 if(used&&!source.includes("import BaseSelect from "))errors.push('BaseSelect import missing: '+rel)
 if(used!==(source.match(/<\/BaseSelect>/g)||[]).length)errors.push('Unclosed BaseSelect tags: '+rel)
}
if(fs.existsSync(path.join(root,'stores/preview.ts')))errors.push('Obsolete preview store still exists')
const required={
 'components/ui/BaseSelect.vue':['UnifiedSelect'],
 'components/ui/BaseSearchField.vue':['SearchBar'],
 'components/ui/BasePageHeading.vue':['PageHeader'],
 'components/ui/BaseNotice.vue':['Alert'],
 'components/ui/BaseStatusPill.vue':['Pill'],
 'components/layout/AppTopbar.vue':['SharedAppTopbar'],
 'components/layout/AppSidebar.vue':['SharedAppSidebar'],
 'components/layout/MroAccountMenu.vue':['AccountMenu','CompanySwitcher','AppSwitcher','Switch'],
 'views/modules/ChatView.vue':['ChatLayout','ChatHeader','ChatFilterTabs','ChatConversationItem','ChatComposer','ChatMessageBubble','ActionMenu','ConfirmDialog','Drawer'],
 'views/modules/ScheduleView.vue':['PeriodCalendar'],
 'views/modules/PlanningView.vue':['UiCheckbox'],
 'components/toir/ToirRegistryTable.vue':['DataTable'],
 'components/toir/ToirEditorDrawer.vue':['Drawer'],
 'views/modules/RegistryView.vue':['FilterToolbar','TableColumnPicker','ConfirmDialog'],
}
for(const [rel,names] of Object.entries(required)){
 const source=fs.readFileSync(path.join(root,rel),'utf8')
 for(const name of names)if(!source.includes(name))errors.push('Missing shared component '+name+': '+rel)
}
if(selects===0)errors.push('Shared selects not used')
if(errors.length){console.error('TOIR_UI_CONTRACT_FAILED',JSON.stringify(errors));process.exit(1)}
console.log('TOIR_UI_CONTRACT_PASS',JSON.stringify({files:files.length,sharedSelectUses:selects,nativeSelects:0,nativeTables:0,rawInteractiveButtons:rawButtons,obsoleteDemoReferences:0}))

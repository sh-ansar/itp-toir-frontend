<script setup lang="ts">
import { ref, watch } from 'vue'
import { X, Boxes } from 'lucide-vue-next'
import BaseButton from '../ui/BaseButton.vue'

const props=defineProps<{open:boolean}>()
const emit=defineEmits<{close:[];choose:[category:string]}>()
const selected=ref('equipment')
const choices=[
  {value:'premises',label:'Помещение',description:'Корпуса, цеха и зоны'},
  {value:'equipment',label:'Оборудование',description:'Производственные машины и узлы'},
  {value:'tools',label:'Инструменты',description:'Инструмент и принадлежности'},
  {value:'materials',label:'Запчасти и расходные материалы',description:'Номенклатура для обслуживания'}
]
watch(()=>props.open,(open)=>{if(open)selected.value='equipment'})
function submit(){emit('choose',selected.value)}
</script>

<template>
  <Teleport to="body">
    <div v-if="open" class="category-backdrop" @click.self="emit('close')" @keydown.esc="emit('close')">
      <section class="category-dialog" role="dialog" aria-modal="true" aria-label="Категория актива">
        <header class="category-dialog-head">
          <div class="category-dialog-icon"><Boxes :size="19" /></div>
          <button type="button" aria-label="Закрыть" class="drawer-close" @click="emit('close')"><X :size="18"/></button>
        </header>
        <h2>Категория актива</h2>
        <p>Для создания записи выберите категорию актива</p>
        <div class="category-options" role="radiogroup" aria-label="Категория актива">
          <label v-for="choice in choices" :key="choice.value"
            class="category-option" :class="{selected:selected===choice.value}">
            <input v-model="selected" type="radio" name="toir-category" :value="choice.value" />
            <span><strong>{{ choice.label }}</strong><small>{{ choice.description }}</small></span>
          </label>
        </div>
        <footer class="category-dialog-footer">
          <BaseButton type="button" variant="secondary" @click="emit('close')">Отмена</BaseButton>
          <BaseButton type="button" @click="submit">Продолжить</BaseButton>
        </footer>
      </section>
    </div>
  </Teleport>
</template>

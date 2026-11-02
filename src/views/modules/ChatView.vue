<script setup lang="ts">
import { MessageCircle, ShieldCheck } from 'lucide-vue-next'
import BasePageHeading from '../../components/ui/BasePageHeading.vue'
import BaseCard from '../../components/ui/BaseCard.vue'
</script>
<template>
  <div class="chat-page">
    <div class="toir-breadcrumb">Чат</div>
    <BasePageHeading title="Чат" description="Обсуждение ремонтных работ и нарядов" />
    <BaseCard><div class="blank-panel long">
      <MessageCircle :size="36" /><strong>Чат подключается следующим этапом</strong>
      <span>Обмен сообщениями и вложениями ещё не включён. История работ и изменения статусов сохраняются в нарядах.</span>
      <div class="security-note"><ShieldCheck :size="15"/>Сообщения не имитируются и не отправляются на сторонние сервисы.</div>
      <RouterLink class="blank-link" to="/work-orders">Открыть наряды-задания</RouterLink>
    </div></BaseCard>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { ShieldCheck, Building2, Users, Layers3, Settings2 } from 'lucide-vue-next'
import BasePageHeading from '../../components/ui/BasePageHeading.vue'
import BaseCard from '../../components/ui/BaseCard.vue'
import { useSessionStore } from '../../stores/session'
const session=useSessionStore()
const company=computed(()=>session.session?.companies.find(x=>x.id===session.session?.active_company_id))
</script>
<template>
  <div class="settings-page">
    <div class="toir-breadcrumb">Конфигурация</div>
    <BasePageHeading title="Конфигурация" description="Параметры компании и доступ к разделам ТОИР" />
    <div class="settings-grid">
      <BaseCard>
        <div class="card-section-heading"><Building2 :size="19"/><h2>Компания</h2></div>
        <dl class="detail-dl">
          <dt>Название</dt><dd>{{ company?.name||'—' }}</dd>
          <dt>Код</dt><dd>{{ company?.code||'—' }}</dd>
          <dt>Моя роль</dt><dd>{{ company?.role||'—' }}</dd>
        </dl>
      </BaseCard>
      <BaseCard>
        <div class="card-section-heading"><ShieldCheck :size="19"/><h2>Контроль доступа</h2></div>
        <p class="muted">Авторизация отделена от Portal. Каждый реестр изолирован по компании.</p>
        <p class="settings-info"><Users :size="17"/>Роли: owner, admin, manager, engineer, technician, viewer.</p>
        <RouterLink class="blank-link" to="/profile">Мой профиль и пароль</RouterLink>
      </BaseCard>
      <BaseCard>
        <div class="card-section-heading"><Layers3 :size="19"/><h2>Модули</h2></div>
        <p>Активы, заявки, планы, сотрудники, проекты, поставки, тендеры и отчёты.</p>
        <p class="muted">Настройка справочников и прав по отдельным операциям предусмотрена в следующем этапе.</p>
      </BaseCard>
      <BaseCard>
        <div class="card-section-heading"><Settings2 :size="19"/><h2>Интеграции</h2></div>
        <p class="muted">ТОИР работает на собственной базе данных. HRM, Inventory и Portal не подключены и не изменялись.</p>
      </BaseCard>
    </div>
  </div>
</template>

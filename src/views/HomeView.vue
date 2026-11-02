<script setup lang="ts">
import { Wrench, ClipboardList, Package, CalendarDays, CheckCircle2 } from 'lucide-vue-next'
import BaseCard from '../components/ui/BaseCard.vue'
import BasePageHeading from '../components/ui/BasePageHeading.vue'
import { useI18n } from '../i18n'
import { useSessionStore } from '../stores/session'

const { t } = useI18n()
const session = useSessionStore()
const modules = [
  { key: 'equipment' as const, icon: Package },
  { key: 'orders' as const, icon: ClipboardList },
  { key: 'plans' as const, icon: CalendarDays }
]
</script>

<template>
  <div class="page-body">
    <BasePageHeading :eyebrow="t('product')" :title="t('overview')" :description="t('overviewHint')" />
    <BaseCard v-if="!session.session?.active_company_id">
      <p class="muted">{{ t('noAccess') }}</p>
    </BaseCard>
    <BaseCard v-else>
      <div class="welcome-panel">
        <div class="welcome-symbol"><Wrench :size="27" aria-hidden="true" /></div>
        <div>
          <h2>{{ t('foundationTitle') }}</h2>
          <p class="muted">{{ t('foundationText') }}</p>
          <div class="ready-label"><CheckCircle2 :size="16" aria-hidden="true" />{{ session.session.companies.find(c => c.id === session.session?.active_company_id)?.name }}</div>
        </div>
      </div>
    </BaseCard>
    <div class="module-grid">
      <BaseCard v-for="mod in modules" :key="mod.key">
        <div class="module-icon"><component :is="mod.icon" :size="22" aria-hidden="true" /></div>
        <h3>{{ t(mod.key) }}</h3>
        <p>{{ t('emptyModules') }}</p>
        <span class="module-next">{{ t('later') }}</span>
      </BaseCard>
    </div>
  </div>
</template>

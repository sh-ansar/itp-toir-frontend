<script setup lang="ts">
import { useRoute } from 'vue-router'
import {
  LayoutDashboard, UserRound, ClipboardList, CalendarDays, Package,
  Wrench, PanelLeftClose, PanelLeftOpen, X
} from 'lucide-vue-next'
import { usePreferencesStore } from '../../stores/preferences'
import { useSessionStore } from '../../stores/session'
import { useI18n } from '../../i18n'

defineProps<{ mobileOpen: boolean }>()
const emit = defineEmits<{ 'update:mobileOpen': [value: boolean] }>()
const route = useRoute()
const ui = usePreferencesStore()
const session = useSessionStore()
const { t } = useI18n()

function close(): void { emit('update:mobileOpen', false) }
</script>

<template>
  <aside class="sidebar toir-sidebar" :class="{
    'toir-sidebar--collapsed': ui.sidebarCollapsed,
    'sidebar--open': mobileOpen
  }">
    <div class="toir-sidebar-head">
      <RouterLink to="/" class="brand-link" @click="close">
        <img src="/brand/itp-mark.svg" alt="ITP" width="49" height="37" />
        <span class="brand-copy"><strong>ТОИР</strong><small>{{ t('subtitle') }}</small></span>
      </RouterLink>
      <button class="sidebar-collapse-btn" type="button"
        :aria-label="ui.sidebarCollapsed ? 'Развернуть меню' : 'Свернуть меню'"
        @click="ui.sidebarCollapsed = !ui.sidebarCollapsed">
        <PanelLeftOpen v-if="ui.sidebarCollapsed" :size="20" aria-hidden="true" />
        <PanelLeftClose v-else :size="20" aria-hidden="true" />
      </button>
      <button class="mobile-close-btn" type="button" :aria-label="t('closeMenu')" @click="close">
        <X :size="20" aria-hidden="true" />
      </button>
    </div>
    <nav class="toir-nav" aria-label="Разделы ТОИР">
      <RouterLink class="toir-nav-item" :class="{active: route.path === '/'}" to="/"
        :title="t('main')" @click="close">
        <LayoutDashboard :size="20" aria-hidden="true" /><span>{{ t('main') }}</span>
      </RouterLink>
      <div class="nav-separator"></div>
      <span class="nav-caption">{{ t('later') }}</span>
      <div v-for="section in [
        { key: 'equipment' as const, icon: Package },
        { key: 'orders' as const, icon: ClipboardList },
        { key: 'plans' as const, icon: CalendarDays }
      ]" :key="section.key" class="toir-nav-item disabled-nav" aria-disabled="true"
        :title="t('later')">
        <component :is="section.icon" :size="20" aria-hidden="true" />
        <span>{{ t(section.key) }}</span>
      </div>
      <div class="nav-separator"></div>
      <RouterLink class="toir-nav-item" :class="{active: route.path === '/profile'}" to="/profile"
        :title="t('profile')" @click="close">
        <UserRound :size="20" aria-hidden="true" /><span>{{ t('profile') }}</span>
      </RouterLink>
    </nav>
    <div class="toir-sidebar-foot">
      <div class="foot-logo"><Wrench :size="19" aria-hidden="true" /></div>
      <div class="sidebar-user-copy">
        <strong>{{ session.session?.user.name }}</strong>
        <small>{{ session.session?.user.email }}</small>
      </div>
    </div>
  </aside>
  <button v-if="mobileOpen" type="button" class="sidebar-shade" :aria-label="t('closeMenu')"
    @click="close"></button>
</template>

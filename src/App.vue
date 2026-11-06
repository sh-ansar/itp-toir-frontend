<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute } from 'vue-router'
import { useSessionStore } from './stores/session'
import AppSidebar from './components/layout/AppSidebar.vue'
import AppTopbar from './components/layout/AppTopbar.vue'

const route = useRoute()
const session = useSessionStore()
const mobileOpen = ref(false)
const showShell = computed(() => !!route.meta.auth && !route.meta.admin && !!session.session)
</script>

<template>
  <div v-if="showShell" class="app-shell">
    <AppSidebar v-model:mobile-open="mobileOpen" />
    <div class="main">
      <AppTopbar @open-menu="mobileOpen = true" />
      <main id="main-content" class="content"><RouterView /></main>
    </div>
  </div>
  <RouterView v-else />
</template>

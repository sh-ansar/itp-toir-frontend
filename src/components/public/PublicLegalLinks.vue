<script setup>
import { useI18n } from 'vue-i18n'
const { t } = useI18n()
// Published legal document routes. Do not depend on a slow API call to display footer navigation.
const documents = [
  { type:'acceptable_use',slug:'acceptable-use' },
  { type:'offer',slug:'offer' },
  { type:'personal_data_consent',slug:'personal-data-consent' },
  { type:'privacy',slug:'privacy' },
  { type:'tariff_policy',slug:'tariff-policy' },
]
</script>
<template>
  <nav class="public-legal-links" :aria-label="t('adminPortal.documents')">
    <router-link v-for="doc in documents" :key="doc.type"
                 :to="'/legal/'+doc.slug">{{ t('publicPortal.legal_'+doc.type) }}</router-link>
    <router-link to="/legal">{{ t('adminPortal.documents') }}</router-link>
  </nav>
</template>
<style scoped>
.public-legal-links {display:flex;flex-direction:column;align-items:flex-start;gap:0;min-width:0;}
.public-legal-links a {color:inherit;text-decoration:none!important;font-size:13px;line-height:1.5;margin:7px 0;
  border:0!important;overflow-wrap:anywhere;transition:color .18s ease;}
.public-legal-links a:hover {color:#456878;text-decoration:none!important;}
.public-legal-links a:focus-visible {outline:2px solid #536e79;outline-offset:3px;border-radius:2px;}
</style>

import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { watch } from 'vue'
import { usePreferencesStore } from './stores/preferences'
import { makeMroPublicI18n } from './portal-i18n'
import App from './App.vue'
import { router } from './router'
import './styles/mro-public.scss'
import './styles/tokens.css'
import './styles/global.css'
import './styles/app.css'
import './styles/toir-modules.css'
import './styles/selects.css'

const pinia = createPinia()
const preferences = usePreferencesStore(pinia)
const portalI18n = makeMroPublicI18n(preferences.locale)
watch(() => preferences.locale, (value) => { portalI18n.global.locale.value = value })
createApp(App).use(pinia).use(portalI18n).use(router).mount('#app')

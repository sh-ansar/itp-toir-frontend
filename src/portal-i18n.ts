import { createI18n } from 'vue-i18n'
import ru from './portal-locales/ru.json'
import en from './portal-locales/en.json'
import ge from './portal-locales/ge.json'
import de from './portal-locales/de.json'
import fr from './portal-locales/fr.json'
import es from './portal-locales/es.json'
import type { Locale } from './stores/preferences'
const catalog = { ru, en, ge, ka: ge, de, fr, es }
const allowed = Object.keys(catalog)
export function makeMroPublicI18n(defaultLocale:Locale) {
  let selected:string = defaultLocale
  try {
    const stored=localStorage.getItem('mro-public-locale')
    if (stored && allowed.includes(stored)) selected = stored
  } catch { /* Storage can be disabled. */ }
  return createI18n({ legacy:false,globalInjection:true,locale:selected,fallbackLocale:'ru',messages:catalog })
}

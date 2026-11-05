'use strict'
/**
 * No-dependency MRO public hero contract. Run before npm install in CI.
 * This makes translation and "no screenshot" regressions visible even when
 * private GitHub Packages credentials are not available in a fork.
 */
const fs = require('node:fs')
const path = require('node:path')
const vm = require('node:vm')

const root = path.resolve(__dirname, '../src/components/public')
const hero = fs.readFileSync(path.join(root, 'LandingHeroExperience.vue'), 'utf8')
const component = fs.readFileSync(path.join(root, 'MroHeroLiveDemo.vue'), 'utf8')
const dictionary = fs.readFileSync(path.join(root, 'mroHeroDemoCopy.js'), 'utf8')
const errors = []

function check(value, message) {
  if (!value) errors.push(message)
}

check(hero.includes('<MroHeroLiveDemo />'), 'Hero must render the interactive Vue component')
check(!/(?:heroImage|landing-shape|mro-maintenance-panorama|<img\b|diamond)/i.test(hero),
  'Hero must not render screenshots or flying diamond overlays')
check(component.includes('data-mro-live-demo'), 'Interactive demo test hook is missing')
for (const name of ['structure', 'schedule', 'risks']) {
  check(component.includes('data-mro-demo-' + name), name + ' view is missing')
}
check(component.includes('@click="selectAsset(asset.id)"'), 'Equipment cannot be selected')
check(component.includes('@click="selectOrder(order)"'), 'Work order does not open equipment')
check(component.includes('orderFilter = f'), 'Work order filters cannot be changed')
check(component.includes('mro-live__screen-tabs'), 'Mobile screen switching is missing')
check(!/(?:fetch\s*\(|axios|from\s+['"][^'"]*\/api\/)/i.test(component),
  'Public demo must not request actual tenant information')

let languages = null
try {
  const runnable = dictionary.replace('export const mroHeroDemoCopy =', 'const mroHeroDemoCopy =')
  languages = vm.runInNewContext(runnable + '\n; mroHeroDemoCopy', {}, { timeout:1000 })
} catch (error) {
  errors.push('Translation source is invalid JavaScript: ' + error.message)
}
if (languages) {
  const keys = Object.keys(languages.ru || {})
  check(keys.length >= 60, 'Incomplete Russian public demonstration dictionary')
  for (const code of ['ru', 'en', 'ge', 'ka', 'de', 'fr', 'es']) {
    const value = languages[code]
    check(!!value, 'Missing locale: ' + code)
    if (!value) continue
    const names = Object.keys(value)
    check(names.length === keys.length, 'Key count mismatch in ' + code)
    for (const key of keys) {
      check(typeof value[key] === 'string' && value[key].trim().length > 0,
        code + ': missing translation: ' + key)
    }
  }
  const literal = [...component.matchAll(/\bcopy\.([A-Za-z]\w*)/g)].map(match => match[1])
  const dynamic = ['compressor','pump','generator','fan','shopA','shopB','status','next',
    'running','due','fault','normal','moderate','critical','new','inProgress','overdue',
    'planned','repair','inspect','replace','filterAll','filterActive','filterOverdue',
    'mon','tue','wed','thu','fri','equipment','overview','orders','structure','schedule','risks']
  for (const key of new Set([...literal,...dynamic])) {
    check(Object.hasOwn(languages.ru, key), 'Missing demo copy key: ' + key)
  }
}
if (errors.length) {
  console.error('MRO_HERO_CONTRACT_FAILED\n' + errors.join('\n'))
  process.exit(1)
}
console.log('MRO_HERO_CONTRACT_PASS', JSON.stringify({
  preview:'Vue, not static image', locales:7, localizedKeys:Object.keys(languages.ru).length,
  modes:['structure','schedule','risks'], mobileSwitcher:true,
  userActions:['select-equipment','filter-work-orders','open-work-order','reset-demo'],
}))

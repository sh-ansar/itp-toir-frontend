# ITP ТОиР — frontend

Автономное SPA технического обслуживания и ремонта: **Vue 3 + TypeScript + Vite 7 + Pinia + Vue Router**. Работает с отдельным Laravel backend ТОиР: [itp-toir-backend](https://github.com/sh-ansar/itp-toir-backend).
Текущий URL: https://platform.itpmining.kz/mro/

## Запуск на новом компьютере

Нужен **Node.js 22** и npm. Laravel должен работать отдельно на 127.0.0.1:8000 и иметь собственную локальную БД.

~~~powershell
npm ci
Copy-Item .env.example .env
npm run typecheck
npm run dev
~~~

Vite слушает 127.0.0.1:5173; проксирует /api и /sanctum на **VITE_BACKEND_ORIGIN** (по умолчанию http://127.0.0.1:8000).
Открывайте локальный frontend в браузере. Аутентификация сессионная: HttpOnly cookie + CSRF, без токенов localStorage.

Сборка для production под /mro/:

~~~powershell
$env:VITE_BASE_PATH = '/mro/'
npm run typecheck
npm run build
~~~

Результат находится в dist/; в Git dist не коммитится. В production API/SPA должны использовать один origin и согласованный префикс /mro/. Файл шрифта Golos Text сейчас загружается по отдельному статическому URL — проверьте его доступность после развёртывания.

## Структура проекта

- **src/router/** — маршруты и проверка сессии.
- **src/stores/session.ts** — активная учётная запись, компания, вход/выход.
- **src/api/client.ts** — общий клиент запросов с CSRF; **src/api/** — предметные API-адаптеры.
- **src/config/toirModules.ts** — поля и колонки основных реестров.
- **src/views/modules/** — рабочие страницы: активы, наряды, планирование, склад, чат, аналитика и настройки.
- **src/components/ui/** и **src/components/toir/** — базовые элементы и предметные компоненты.
- **src/styles/tokens.css** — дизайн-токены и типографика, **src/styles/** — глобальные стили.
- **src/i18n/index.ts** — языковые словари; перед релизом проверять RU/EN/GE.

Демо-источник данных удалён. **src/stores/preview.ts** оставлен как временный неактивный совместимый интерфейс: preview.enabled всегда false. Остаточные проверки preview в компонентах необходимо убрать отдельным PR, не восстанавливая демо.

## Проверки

~~~powershell
npm ci
npm run typecheck
npm run build
~~~

CI на feature/toir-foundation выполняет те же проверки. В проекте пока нет полноценной автоматической проверки ESLint/Prettier и отдельного набора Vue component tests — это зафиксировано как технический долг.

## Передача проекта

- [Frontend архитектура и UI-договор](docs/UI_ARCHITECTURE.md)
- [Общая архитектура](https://github.com/sh-ansar/itp-toir-backend/blob/feature/toir-foundation/docs/ARCHITECTURE.md)
- [Инструкция разработчику](https://github.com/sh-ansar/itp-toir-backend/blob/feature/toir-foundation/docs/DEVELOPER_GUIDE.md)
- [Эксплуатация и релиз](https://github.com/sh-ansar/itp-toir-backend/blob/feature/toir-foundation/docs/RUNBOOK.md)
- [Оставшиеся риски](https://github.com/sh-ansar/itp-toir-backend/blob/feature/toir-foundation/docs/QUALITY_AUDIT.md)

Для безопасности права доступа определяются **только backend**. Отсутствие кнопки в Vue не является серверной проверкой прав. Работа над другими системами ITP не должна включаться в задачи этого репозитория.

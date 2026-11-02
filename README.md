# ITP ТОИР · Frontend

Самостоятельная SPA (Vue 3, TypeScript, Vite, Pinia, Vue Router). До интеграции с Portal используется **собственная авторизация ТОИР** на HttpOnly-cookie без токенов в localStorage. Нет фейкового входа и демонстрационных паролей.

## Быстрый старт

\`npm ci\` (если package-lock уже создан), иначе \`npm install\`.

\`npm run typecheck\`
\`npm run build\`
\`npm run dev\`

Скопируйте \`.env.example\` в \`.env\`. По умолчанию dev-сервер Vite доступен на \`127.0.0.1:5173\`, а /api и /sanctum проксируются на \`127.0.0.1:8000\` (Laravel).

Production: размещайте frontend и backend на одном origin; SPA должен иметь history fallback на index.html, а /api и /sanctum должны идти на backend. Не раскрывайте APP_KEY и не копируйте cookies других продуктов. При размещении в подпапке установите VITE_BASE_PATH и настройте маршруты/статику вместе с reverse proxy.

## Переиспользованные компоненты HRM

Из \`sh-ansar/itp-hrm-frontend\` перенесены без визуальной переработки:
\`BaseButton\`, \`BaseCard\`, \`BaseFormField\`, \`BaseNotice\`, \`BasePageHeading\`, \`tokens.css\`, \`global.css\` и логотип ITP. Эти компоненты имеют семантические CSS-токены с поддержкой тёмной темы. Новые элементы обязаны использовать тот же набор переменных.

## Готовые маршруты

- /login — вход
- /forgot-password — запрос сброса (SMTP на backend)
- /reset-password — установка нового пароля по ссылке
- / — защищённый каркас ТОИР
- /profile — профиль, просмотр компаний, смена пароля
- 404 — неизвестные страницы

Оборудование/наряды/планы в меню пока недоступны: это сознательно, чтобы интерфейс не изображал рабочую бизнес-логику до её реализации. Все проверки прав на будущие CRUD выполняются на backend, не только в меню.

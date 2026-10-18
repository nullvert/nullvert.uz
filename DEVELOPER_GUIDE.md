# Руководство разработчика (Developer Guide) — Shirone Blog

Архитектурное руководство по разработке, расширению разделов и синхронизации данных персонального блога на базе темы `shirones`.

---

## 1. Стек технологий и архитектура

- **Движок**: [Astro 7](https://astro.build) (Static Site Generation, Swup SPA клиентские переходы).
- **UI-компоненты**: [Svelte 5](https://svelte.dev) (система реактивности Runes: `$props()`, `$state()`, `$derived()`, `$effect()`).
- **Стилизация**: [Tailwind 4](https://tailwindcss.com) + [Stylus](https://stylus-lang.com) + [Material 3 Expressive (M3E)](https://m3.material.io).
- **Иконки**: [@iconify/svelte](https://icon-sets.iconify.design) и `astro-icon` с локальными коллекциями (`material-symbols`, `fa6-solid`, `simple-icons`).
- **Синхронизация данных**: Node.js CLI-скрипты в `scripts/sync/` с запуском через GitHub Actions и локальный `.env`.

---

## 2. Структура каталогов: `src/` vs `shirones/`

Проект функционирует в режиме установленного npm-пакета (`shirones`). При сборке тема применяет систему оверлеев:

```
├── shirones/                     # Пользовательские данные и настройки темы
│   ├── config/                   # Конфигурации темы (siteConfig, navBarConfig, i18nConfig...)
│   └── content/                  # Markdown/MDX статьи, заметки, альбомы
│
├── src/                          # Кастомный код проекта (оверлеи и новые фичи)
│   ├── components/               # Атомы, молекулы и организмы (M3E)
│   │   ├── atoms/                # Базовые примитивы
│   │   ├── molecules/            # Каркасы, карточки каталогов (CatalogShell, MediaCard, BookCard)
│   │   └── organisms/            # Секции страниц (AnimeSection, BooksSection, Footer, TopAppBar)
│   ├── config/domains/           # Конфигурации новых доменов (booksConfig, cinemaConfig)
│   ├── data/snapshots/           # Локальные JSON-снапшоты каталогов (Hardcover, AniList, Simkl, InfiniteBacklog)
│   ├── layouts/                  # Лейауты страниц (MainGridLayout.astro)
│   ├── pages/                    # Astro-маршруты (/books, /cinema, /games, /anime, /compass)
│   ├── styles/                   # Пользовательские CSS стили (theme-custom.css)
│   └── utils/media/              # Логика доменов, сортеры, мапперы и i18n-лейблы
│
└── scripts/sync/                 # Автономные скрипты синхронизации данных (Node.js)
```

> **Важно**: В `shirones/config/` должны находиться **только** конфигурационные файлы, поддерживаемые базовой темой. Специфичные конфигурации модулей проекта размещаются в `src/config/domains/`.

---

## 3. Интернационализация (i18n)

Правило проекта: **никакого хардкода текста в шаблонах и TypeScript-коде**.
Все пользовательские строки локализуются через:
1. `shirones/config/i18nConfig.ts` — словарь переводов для каждого языка.
2. `src/utils/media/labels.ts` — хелпер `mediaLabel(key, fallback)` для динамических каталогов.
3. `@i18n/translation` (`i18n(...)`) и `@i18n/i18nKey` (`I18nKey.*`) для стандартных ключей темы.

---

## 4. Добавление нового медиа-раздела (Чек-лист)

Чтобы добавить новый каталог (например, «Музыка» или «Подкасты»):

1. **Создать снапшот и типы данных:**
   - Добавить файл снапшота в `src/data/snapshots/<name>.json`.
   - Описать TypeScript-интерфейс сущности в `src/utils/media/domains/<name>.ts`.
2. **Определить домен `MediaDomain<T>`:**
   - Реализовать функцию `toCard(item)`, поиск `searchFields`, статусы `statusMeta` и сортировки `sortOptions`.
   - Использовать `mediaLabel(...)` для всех подписей.
3. **Создать Svelte-организм секции:**
   - В `src/components/organisms/<Name>Section.svelte` подключить универсальный `<MediaCatalog domain={...} items={...} />`.
4. **Создать страницу Astro:**
   - В `src/pages/<name>.astro` подключить секцию внутри `<MainGridLayout page="<name>">`.
5. **Добавить пункт навигации:**
   - Зарегистрировать ссылку в `shirones/config/navBarConfig.ts`.
6. **Настроить синхронизацию (опционально):**
   - Добавить скрипт `scripts/sync/<name>-sync-<service>.mjs` с использованием утилит `scripts/sync/sync-common.mjs`.
   - Добавить npm-скрипт в `package.json` и шаг в `.github/workflows/sync-media.yml`.

---

## 5. Синхронизация данных через API

Скрипты синхронизации запускаются локально или по расписанию в GitHub Actions:

```bash
# Синхронизация всех медиа-каталогов
pnpm media:sync

# Синхронизация закладок Raindrop
pnpm compass:sync

# Полная синхронизация всего сайта
pnpm all:sync
```

Ключи API считываются из `.env` файла или переменных окружения:
- `ANILIST_USERNAME` — имя пользователя AniList
- `SIMKL_CLIENT_ID`, `SIMKL_USER_TOKEN` — авторизация Simkl
- `HARDCOVER_API_KEY` — токен Hardcover API (Книги)
- `INFINITEBACKLOG_SESSION`, `INFINITEBACKLOG_USERNAME` — сессия InfiniteBacklog (Игры)
- `RAINDROP_API_KEY` — токен доступа Raindrop (Закладки)

---

## 6. Проверка и сборка проекта

Перед коммитом убедитесь в отсутствии ошибок типов и предупреждений:

```bash
# Проверка типов Astro/TypeScript (должно быть 0 errors, 0 warnings)
pnpm type-check

# Тесты скриптов синхронизации
node --test scripts/sync/sync-common.test.mjs

# Сборка статического продакшн-бандла
pnpm build
```

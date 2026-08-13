# СОР · СОЧ · ФО — база школьных работ

Веб-приложение для хранения и поиска СОР, СОЧ и ФО (формативного оценивания)
для школ Казахстана: лента работ с фильтрами (предмет, класс, четверть, тип),
страница просмотра фото работы и админ-панель для загрузки/удаления работ.

## Стек

- **Next.js 16** (App Router) + **TypeScript**
- **Tailwind CSS v4**, компоненты в стиле shadcn/ui (Radix UI + CVA), `lucide-react`
- **Framer Motion** — анимации появления карточек
- **Supabase**: PostgreSQL (данные) + Storage (фото работ)
- Простая админ-авторизация по паролю (JWT-сессия в httpOnly cookie, `jose`)

## Структура проекта

```
src/
  app/
    page.tsx                 # главная: фильтры + лента работ
    work/[id]/page.tsx        # детальный просмотр работы + галерея
    admin/
      page.tsx                # админ-панель (защищена proxy.ts)
      login/page.tsx           # вход по паролю
      actions.ts               # server actions: login/logout/create/delete
    not-found.tsx
  components/
    ui/                       # button, input, select, badge, card, dialog
    admin/                    # login-form, upload-form, works-table, delete-button
    header.tsx, filters.tsx, work-card.tsx, work-grid.tsx, work-gallery.tsx, ...
  lib/
    supabase/                 # client.ts (browser), server.ts (anon), admin.ts (service role)
    works.ts                  # чтение данных (getWorks, getWorkById)
    auth.ts                   # выдача/проверка admin JWT
    constants.ts, types.ts
  proxy.ts                    # (бывший middleware) защищает /admin/*
supabase/
  schema.sql                  # DDL таблицы works + storage bucket + RLS-политики
```

## Настройка Supabase

1. Создайте проект на [supabase.com](https://supabase.com).
2. В **SQL Editor** выполните содержимое файла [`supabase/schema.sql`](supabase/schema.sql) —
   он создаст таблицу `works`, публичную политику чтения (RLS) и публичный
   Storage-бакет `work-photos` для фотографий.
3. В **Project Settings → API** скопируйте:
   - `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon public` ключ → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role` ключ → `SUPABASE_SERVICE_ROLE_KEY` (используется только на
     сервере в server actions для загрузки фото и записи в БД — **никогда**
     не должен попасть в браузер)

## Переменные окружения

Скопируйте `.env.example` в `.env.local` и заполните:

```bash
cp .env.example .env.local
```

| Переменная | Назначение |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | URL проекта Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | публичный anon-ключ (чтение работ на сайте) |
| `SUPABASE_SERVICE_ROLE_KEY` | сервисный ключ (загрузка фото и запись в БД из админки) |
| `ADMIN_PASSWORD` | пароль для входа в `/admin` |
| `ADMIN_JWT_SECRET` | случайная строка для подписи сессии админки, например `openssl rand -hex 32` |

## Запуск

```bash
npm install
npm run dev
```

Приложение откроется на `http://localhost:3000`. Админ-панель — `/admin`
(логин по паролю из `ADMIN_PASSWORD`).

## Продакшн-сборка

```bash
npm run build
npm start
```

## Как это работает

- **Главная (`/`)** — server component, читает `searchParams` и запрашивает
  `works` из Supabase с фильтрами по предмету/классу/четверти/типу работы.
  Фильтры (`src/components/filters.tsx`) — клиентский компонент, меняющий
  query-параметры URL, что триггерит серверный ре-фетч.
- **Страница работы (`/work/[id]`)** — показывает мета-информацию (балл и
  количество вариантов выводятся как «Неизвестно», если `null`), галерею с
  просмотром на весь экран, зумом и скачиванием фото (через `fetch` → `blob`,
  чтобы браузер не открывал файл вместо скачивания).
- **Админ-панель (`/admin`)** защищена `src/proxy.ts` — он проверяет JWT в
  cookie `admin_session` и редиректит на `/admin/login`, если сессии нет.
  Форма загрузки поддерживает drag-and-drop нескольких фото, чекбоксы
  «Неизвестно» для балла/вариантов и создаёт запись через server action,
  которая грузит фото в Supabase Storage (`work-photos`) сервисным ключом,
  затем вставляет строку в `works`. Удаление работы одновременно чистит
  файлы в Storage.

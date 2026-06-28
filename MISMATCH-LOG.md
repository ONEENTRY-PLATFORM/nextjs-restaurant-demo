# MISMATCH-LOG — расхождения вёрстки

Журнал расхождений между эталоном [static-html/](static-html/) (правило 1) и текущей Next.js-реализацией. Что чинится правкой кода в этом репо.

- **Раздел A** — массовые автоматические находки.
- **Раздел B** — ручная сверка по экранам.
- **Пробелы в данных OneEntry** (что нужно завести в админке `https://oe-restaurants.oneentry.cloud/`) — переехали в отдельный файл [ONEENTRY-ADMIN-TODO.md](ONEENTRY-ADMIN-TODO.md).

Заполняется по мере ручной сверки. Правила работы — см. [CLAUDE.md §3, §7](CLAUDE.md).

---

## Severity

- **P0** — структура DOM/функциональность сломана (нет блока, не работает кнопка).
- **P1** — заметный визуальный мискшоп (отступы/цвета на брендовых элементах, неправильные классы).
- **P2** — мелочи (px-токены вместо именованных, шрифты в hero, hover-эффекты).
- **P3** — косметика / гигиена кода (инлайн SVG → `components/icons/`, удалить закомментированное).

---

## Сводка

| Раздел | Открыто | P0 | P1 | P2 | P3 |
| --- | --- | --- | --- | --- | --- |
| A. Автоматические находки | 1 | 0 | 0 | 1 | 0 |
| B. Ручная сверка по экранам | 0 | — | — | — | — |
| D. Соответствие MCP/SDK (отложенные) | 4 | 0 | 0 | 2 | 2 |
| E. Роутинг / навигация (SSR, loading.tsx) | 1 | 0 | 0 | 1 | 0 |
| OneEntry Admin Setup | [ONEENTRY-ADMIN-TODO.md](ONEENTRY-ADMIN-TODO.md) | — | — | — | — |

---

## Раздел B. Ручная сверка по экранам

### B.8. Промо-детейл (`pk_promo_BIRTHDAY.html`, `pk_promo_day.html` ↔ `app/promotions/[handle]`)

- 🌐 Live: <http://localhost:3000/promotions/birthday_offer>

- 📄 Static:
  [pk_promo_BIRTHDAY.html](static-html/pk_promo_BIRTHDAY.html),
  [pk_promo_day.html](static-html/pk_promo_day.html)

- 📁 Файлы проекта: [app/promotions/[handle]/page.tsx](app/promotions/[handle]/page.tsx)

> ℹ️ Тот же плоский rich-text (`mt-3.75 font-normal text-base text-white`) ещё на `app/promotions/page.tsx`, `app/restaurants/[handle]/page.tsx`, `app/[handle]/page.tsx`, `app/support/page.tsx` — кандидаты на переход к `.cms_prose`, если контент там тоже многоуровневый.

## Раздел E. Роутинг / навигация (SSR, loading.tsx)

| # | Что не так | Файл | Severity |
|---|---|---|---|
| E.1 | **Soft-404 на `notFound()`-роутах под `loading.tsx`-границей.** Побочный эффект скелетонов: на динамических `[handle]`-роутах невалидный handle отдаёт soft-404 (HTTP **200** + not-found UI) вместо жёсткого 404 — Next успевает зафлашить 200-шелл скелетона раньше, чем разрешится `notFound()`. Затронуты `/[handle]`, `/shop/[handle]`, `/shop/category/[handle]`, **и `/shop/product/[handle]`** (+ ранее `restaurants/[handle]`, `promo/[handle]`). Изначально товар держал жёсткий 404 без `loading.tsx`, но `app/shop/loading.tsx` (каталожный скелетон) **протекает** на дочерний роут товара (у него не было своей `loading.tsx`): показывал не тот скелетон (сетка вместо карточки) и уже ронял 404 в soft. Чинено своей `app/shop/product/[handle]/loading.tsx` (`ProductSingleSkeleton`) — скелетон правильный, 404 остаётся soft (как у соседей). Механика — заметка памяти `next16_loading_forcestatic_soft404`. **Чтобы вернуть жёсткий 404 товару:** route-group `app/shop/(catalog)/…` для index/[handle]/category (их `loading.tsx` уезжает в группу и перестаёт накрывать `product`), товар — без `loading.tsx`, скелетон через in-page `<Suspense>` после `notFound()`. | [app/shop/product/[handle]/loading.tsx](app/shop/product/%5Bhandle%5D/loading.tsx), [app/[handle]/loading.tsx](app/%5Bhandle%5D/loading.tsx), [app/shop/[handle]/loading.tsx](app/shop/%5Bhandle%5D/loading.tsx), [app/shop/category/[handle]/loading.tsx](app/shop/category/%5Bhandle%5D/loading.tsx) | P2 |

## Раздел D. Соответствие MCP/SDK (отложенные code-fixable правки)

Найдено при сверке кода с последней версией OneEntry MCP (2026-06-19). Правки в **коде** (не вёрстка, не админка). Остаётся D.7 — заложен безопасный фундамент, нужен финальный флип источника UI. Остальные находки сверки уже были поправлены ранее (token-handling в `AuthContext`, config-id в `OrderReviewPopup`, типовая гигиена, централизация статус-маркеров в `constants.ts`).

**Аудит соответствия MCP.**

**Проход 2026-06-28.** основной флаг-роутинг остаётся открыт (P2) и упёрся в неполные флаги формы `user` в админке (см. [ONEENTRY-ADMIN-TODO.md](ONEENTRY-ADMIN-TODO.md)). Открыты в D: D.7, D.9 (P2) и D.8, D.10 (P3, фон).

| # | Что не так | Файл | Severity |
|---|---|---|---|
| D.7 | **Foundation + sync + merge-on-login (частично).** Добавлен централизованный [useServerCartSync](app/api/hooks/useServerCartSync.ts) (смонтирован [ServerCartSync](components/layout/ServerCartSync.tsx) под `AuthProvider`): зеркалит Redux-корзину → `Users.setCart` и favorites → `Users.setWishlist` (оптимистично/Redux-first, дебаунс 800мс, покрывает add/qty/remove). На логине мержит локальный (localStorage) гостевой стейт с серверной корзиной/вишлистом **юзера** (`Users.getCart/getWishlist`) и пушит объединение в серверный кэш юзера. Серверный гостевой кэш по guest-id не читается и не чистится: механизм `x-guest-id` предназначен для нативных приложений — в вебе гостевая корзина живёт только в localStorage, отдельной «корзины гостя» на сервере нет, поэтому шаг «read guest cart → clear guest id» неприменим (бывший no-op `setGuestId('')` убран). **Остаток (эффорт L):** флип источника UI — читать корзину/wishlist из серверного кэша, убрать `redux-persist`/`updateUserState`/`user.state.cart`. Redux вшит в reservations/animations — делать отдельно. | [useServerCartSync.ts](app/api/hooks/useServerCartSync.ts) | P2 |
| D.9 | **Auth-формы:** Открыт основной рефактор (P2): флаг-роутинг `authData`/`formData`/`notificationData` по auth-provider rule + валидаторы из схемы (меняет payload `signUp`/`updateUser` и контракт `FormFieldsSlice` — крупно, нужен E2E). **Блокер по данным:** флаги формы `user` в админке заполнены неполно (`isSignUp=true` только на `surname`; `isPassword` не стоит на `repeat_password`; `isNotificationEmail` на `email_notifications`, а не на `email`/`phone`) — пока флаги не поправят, роутинг по ним даст битую форму. Заведено в [ONEENTRY-ADMIN-TODO.md](ONEENTRY-ADMIN-TODO.md). | [SignUpForm.tsx](components/forms/SignUpForm.tsx), [ResetPasswordForm.tsx](components/forms/ResetPasswordForm.tsx), [enum.ts](app/types/enum.ts) | P2 |
| D.10 | **Остаток после Partially fixed (2026-06-28).** Открыто (фон): для `date/dateTime/time` значение в `FormFieldsSlice` хранится строкой, а SDK ждёт `{ fullDate, formattedValue, formatString }` — нужна трансформа value-shape + date-picker (таких полей в текущей схеме нет). | [FormInput.tsx](components/forms/inputs/FormInput.tsx) | P3 |

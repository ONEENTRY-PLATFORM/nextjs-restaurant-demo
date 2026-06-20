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
| B. Ручная сверка по экранам | см. ниже | — | — | — | — |
| D. Соответствие MCP/SDK (отложенные) | 1 | 0 | 0 | 1 | 0 |
| OneEntry Admin Setup | [ONEENTRY-ADMIN-TODO.md](ONEENTRY-ADMIN-TODO.md) | — | — | — | — |

---

## Раздел B. Ручная сверка по экранам

### B.7. Поддержка / Service (`service_support.html`, `service.html` ↔ `app/support`, `app/service`)

#### B.7a. ServicePage (`service.html`)

- 🌐 Live: <http://localhost:3000/service>

- 📄 Static:
  [service.html](static-html/service.html)
  <file:///d:/OneEntry/nextjs-restaurant/static-html/service.html>

- 📁 Файлы проекта: [app/service/page.tsx](app/service/page.tsx)

| # | Что не так | Файл | Severity |
|---|---|---|---|
| B.7.3 | CMS-атрибуты `service_logo`, `service_bg_image`, `service_primary_cta`, `service_primary_href`, `service_secondary_cta`, `service_secondary_href` — **существуют в OneEntry, но значения пусты** (см. §C.7.1). Используются хардкоды `'FOOD DELIVERY'`, `'BOOK A TABLE'`, `/shop`, `/reservation` — fallback работает. Действие на стороне админа | [app/service/page.tsx:40-48](app/service/page.tsx#L40-L48) | — |

### B.8. Промо (`pk_promo_BIRTHDAY.html`, `pk_promo_day.html` ↔ `app/promo/[handle]`)

- 🌐 Live: <http://localhost:3000/promo/birthday_offer> · <http://localhost:3000/promo/deal_of_the_day> · <http://localhost:3000/promo/business_lunch> _(заполненные blog-страницы из админки)_
- 📄 Static:
  - birthday: [pk_promo_BIRTHDAY.html](static-html/pk_promo_BIRTHDAY.html) · <file:///d:/OneEntry/nextjs-restaurant/static-html/pk_promo_BIRTHDAY.html>
  - day: [pk_promo_day.html](static-html/pk_promo_day.html) · <file:///d:/OneEntry/nextjs-restaurant/static-html/pk_promo_day.html>
- 📁 Файлы проекта: [app/promo/[handle]/page.tsx](app/promo/[handle]/page.tsx) · [components/promo/PromoCard.tsx](components/promo/PromoCard.tsx)

---

## Раздел D. Соответствие MCP/SDK (отложенные code-fixable правки)

Найдено при сверке кода с последней версией OneEntry MCP (2026-06-19). Правки в **коде** (не вёрстка, не админка). D.1–D.6 выполнены и удалены из таблицы (2026-06-20). Остаётся D.7 — заложен безопасный фундамент, нужен финальный флип источника UI. Остальные находки сверки уже были поправлены ранее (token-handling в `AuthContext`, config-id в `OrderReviewPopup`, типовая гигиена, централизация статус-маркеров в `constants.ts`).

| # | Что не так | Файл | Severity |
|---|---|---|---|
| D.7 | **Foundation + sync + merge-on-login (частично).** Добавлен централизованный [useServerCartSync](app/api/hooks/useServerCartSync.ts) (смонтирован [ServerCartSync](components/layout/ServerCartSync.tsx) под `AuthProvider`): зеркалит Redux-корзину → `Users.setCart` и favorites → `Users.setWishlist` (оптимистично/Redux-first, дебаунс 800мс, покрывает add/qty/remove). На логине пушит объединённый Redux-стейт (гостевые + восстановленные пользовательские позиции) в серверный кэш юзера и чистит `setGuestId('')` — результат эквивалентен «read guest cart → setCart merged → clear guest id». **Остаток (эффорт L):** флип источника UI — читать корзину/wishlist из серверного кэша, убрать `redux-persist`/`updateUserState`/`user.state.cart`. Redux вшит в reservations/animations — делать отдельно. | [useServerCartSync.ts](app/api/hooks/useServerCartSync.ts) | P2 |

---

## Раздел C. OneEntry Admin Setup → [ONEENTRY-ADMIN-TODO.md](ONEENTRY-ADMIN-TODO.md)

Задачи на стороне OneEntry admin (`https://oe-restaurants.oneentry.cloud/`) — что осталось завести в админке: страницы, атрибуты, формы, словарь `static_content`, related products, payment-accounts, статусы заказов. Переехали в отдельный файл [ONEENTRY-ADMIN-TODO.md](ONEENTRY-ADMIN-TODO.md), чтобы команда админа не листала code-debt разработчика.

Структура там — та же (C.2 Pages, C.3 Related products, C.4 Dictionary, C.5 Profile popup, C.6 Payments, C.7 Audit, C.9 Auth menu, C.10 Reservations history). Правила оформления — см. [CLAUDE.md §3](CLAUDE.md).


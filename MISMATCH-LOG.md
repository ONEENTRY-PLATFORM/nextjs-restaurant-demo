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
| D. Соответствие MCP/SDK (отложенные) | 7 | 0 | 1 | 5 | 1 |
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

## Раздел D. Соответствие MCP/SDK (отложенные code-fixable правки)

Найдено при сверке кода с последней версией OneEntry MCP (2026-06-19). Правки в **коде** (не вёрстка, не админка). D.1–D.6 выполнены и удалены из таблицы (2026-06-20). Остаётся D.7 — заложен безопасный фундамент, нужен финальный флип источника UI. Остальные находки сверки уже были поправлены ранее (token-handling в `AuthContext`, config-id в `OrderReviewPopup`, типовая гигиена, централизация статус-маркеров в `constants.ts`).

**Аудит соответствия MCP (2026-06-27).** Исправлено в этом проходе: унификация error-guard (`typeError` удалён, `isError` стал суперсетом по `statusCode` — ловит и `message: string[]` от валидаторов форм; 25 файлов + `api.ts` + доки); `isError`-guard добавлен в `changePassword` ([ResetPasswordForm](components/forms/ResetPasswordForm.tsx)) и в fallback-ветку [useSearchProducts](app/api/hooks/useSearchProducts.ts); централизация маркеров `review_form`/`blog` (`FORMS.reviewForm`, `FORM_MODULE_CONFIG_IDS`, `PAGES.blog`); `'use client'` на [logInUser](app/api/server/users/logInUser.ts) (явный fingerprint-контракт); диспетчеризация типа поля в [FormInput](components/forms/inputs/FormInput.tsx) по ключу enum (вместо подстроки маркера) + рендер `hint` из `additionalFields`; удалены 5× `any`. Остаются открытыми D.8–D.13 ниже.

| # | Что не так | Файл | Severity |
|---|---|---|---|
| D.7 | **Foundation + sync + merge-on-login (частично).** Добавлен централизованный [useServerCartSync](app/api/hooks/useServerCartSync.ts) (смонтирован [ServerCartSync](components/layout/ServerCartSync.tsx) под `AuthProvider`): зеркалит Redux-корзину → `Users.setCart` и favorites → `Users.setWishlist` (оптимистично/Redux-first, дебаунс 800мс, покрывает add/qty/remove). На логине пушит объединённый Redux-стейт (гостевые + восстановленные пользовательские позиции) в серверный кэш юзера и чистит `setGuestId('')` — результат эквивалентен «read guest cart → setCart merged → clear guest id». **Остаток (эффорт L):** флип источника UI — читать корзину/wishlist из серверного кэша, убрать `redux-persist`/`updateUserState`/`user.state.cart`. Redux вшит в reservations/animations — делать отдельно. | [useServerCartSync.ts](app/api/hooks/useServerCartSync.ts) | P2 |
| D.8 | **Платёжки: online/offline по хардкоду `identifier === 'cash'`.** Нет whitelist online-провайдеров; PayPal не отличается от Stripe, polling `getSessionByOrderId` не реализован (признано в комментарии). В брони при `paymentUrl: null` показывается success-экран на неоплаченном заказе — латентный P0 для async-гейтвеев (PayPal). Канон `orders.md`: различать по `identifier`, Stripe→`createSession`, PayPal→polling, cash→success. | [useCreateOrder.ts:149](app/api/hooks/useCreateOrder.ts#L149), [ReservationForm.tsx:248-264](components/reservation/ReservationForm.tsx#L248-L264) | P1 |
| D.9 | **Auth-формы не из Forms API.** Хардкод полей/маркеров вместо динамики: `SignUpForm` (список+порядок), `ResetPasswordForm` (самодельная схема `resetPasswordFormFields`), `ForgotPasswordForm` (маркер `email`), `UserForm` (маппинг в кастомные объекты с потерей `validators`/`additionalFields`). Канон: формы всегда из `getFormByMarker`. | [SignUpForm.tsx:53](components/forms/SignUpForm.tsx#L53), [ResetPasswordForm.tsx:17](components/forms/ResetPasswordForm.tsx#L17), [UserForm.tsx:45](components/forms/UserForm.tsx#L45) | P2 |
| D.10 | **`type` в payload схлопывается в `'string'`** вместо `attribute.type` — сломается при добавлении date/integer/phone-полей в эти формы. `ContactUsForm` (default-ветка, нет ветки `date`), `SignUpForm`, `UserForm`. | [ContactUsForm.tsx:78](components/forms/ContactUsForm.tsx#L78), [UserForm.tsx:45](components/forms/UserForm.tsx#L45) | P2 |
| D.11 | **Нет graceful-fallback в двух user-фетчерах.** `updateUserState` без try/catch и с проверкой `(as IError).statusCode` вместо `isError`; `logOutUser` не проверяет ответ `AuthProvider.logout` на IError-объект (ошибка просочится как успех). (`updateUserState` пишет в легаси `user.state.cart` — связано с D.7.) | [updateUserState.ts:48](app/api/server/users/updateUserState.ts#L48), [logOutUser.ts:18](app/api/server/users/logOutUser.ts#L18) | P2 |
| D.12 | **Валюта зашита в `CurrencyEnum.en = 'USD'`** (`UsePrice`), а `order.currency`/`preview.currency` из ответа до рендера сумм не доходит. Канон `orders.md`: `{order.currency \|\| ''}{...}`. | [utils.ts:34](components/utils.ts#L34), [enum.ts:11](app/types/enum.ts#L11) | P2 |
| D.13 | **Статусы истории по подстроке.** `BookingsContent` определяет «исторический» заказ эвристикой `includes()` по подстрокам (`cancel`/`complet`/…), а не картой `ORDER_HISTORY_STATUSES` из `constants.ts`. | [BookingsContent.tsx:24](components/profile/BookingsContent.tsx#L24) | P3 |

---

## Раздел C. OneEntry Admin Setup → [ONEENTRY-ADMIN-TODO.md](ONEENTRY-ADMIN-TODO.md)

Задачи на стороне OneEntry admin (`https://oe-restaurants.oneentry.cloud/`) — что осталось завести в админке: страницы, атрибуты, формы, словарь `static_content`, related products, payment-accounts, статусы заказов. Переехали в отдельный файл [ONEENTRY-ADMIN-TODO.md](ONEENTRY-ADMIN-TODO.md), чтобы команда админа не листала code-debt разработчика.

Структура там — та же (C.2 Pages, C.3 Related products, C.4 Dictionary, C.5 Profile popup, C.6 Payments, C.7 Audit, C.9 Auth menu, C.10 Reservations history). Правила оформления — см. [CLAUDE.md §3](CLAUDE.md).


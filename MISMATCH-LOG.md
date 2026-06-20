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
| D. Соответствие MCP/SDK (отложенные) | 7 | 0 | 2 | 5 | 0 |
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

Найдено при сверке кода с последней версией OneEntry MCP (2026-06-19). Правки в **коде** (не вёрстка, не админка). По решению владельца доставочный checkout-флоу пока не трогаем — фиксируем здесь. Остальные находки сверки уже поправлены в коде (token-handling в `AuthContext`, config-id в `OrderReviewPopup`, типовая гигиена, централизация статус-маркеров в `constants.ts`).

| # | Что не так | Файл | Severity |
|---|---|---|---|
| D.1 | Поля доставочной формы захардкожены, а не рендерятся динамически из Forms API (`getAllOrdersStorage` → `formIdentifier` → `getFormByMarker` → рендер по `attribute.type`/`position`). Маркер `delivery_order` зашит в `StepPayment`, `useCreateOrder`, `OrderSlice`. По `create-checkout` поля должны приходить из API. | [StepPayment.tsx:131-162](components/cart/steps/StepPayment.tsx#L131-L162) | P1 |
| D.2 | `timeInterval` трактуется как свободный ввод (`buildDeliveryTimeInterval` фабрикует слот из произвольных даты/времени), а не как список доступных слотов `[[startISO,endISO],...]` из `value` поля формы. `timeInterval.value` нигде не читается. | [scheduleTime.ts:36-54](components/cart/steps/step-payment/scheduleTime.ts#L36-L54) | P1 |
| D.3 | Способы оплаты в доставочном checkout берутся глобально (`useGetAccountsQuery({})`), без пересечения с `storage.paymentAccountIdentifiers`. В брони ([ReservationPaymentStep.tsx:59-72](components/reservation/ReservationPaymentStep.tsx#L59-L72)) сделано правильно — скопировать паттерн. | [StepPayment.tsx:113-114](components/cart/steps/StepPayment.tsx#L113-L114) | P2 |
| D.4 | Список заказов грузится по двум захардкоженным сторам (`FORMS.deliveryOrder`/`FORMS.bookingOrder`), а не через `getAllOrdersStorage()` → итерация по всем сторам. Новый стор в админке не появится в истории. | [OrdersList.tsx:52-56](components/profile/OrdersList.tsx#L52-L56), [BookingsContent.tsx:233](components/profile/BookingsContent.tsx#L233) | P2 |
| D.5 | Пред-чекаут тоталы считаются на клиенте по ценам Redux; `Orders.previewOrder` вызывается только при применённом купоне. Серверные скидки/бонусы/налоги не видны до создания заказа. | [StepOrder.tsx:65-73](components/cart/steps/StepOrder.tsx#L65-L73) | P2 |
| D.6 | `logInUser` строит `authData` с захардкоженными маркерами `'email'/'password'` вместо разбора по флагам `isLogin`/`isPassword` из `getFormByMarker`. Инспект подтвердил: у формы `user` поле `email` имеет `isLogin: true` — для текущего email-провайдера хардкод корректен, но ломается при переименовании/смене провайдера. | [logInUser.ts:21-25](app/api/server/users/logInUser.ts#L21-L25) | P2 |
| D.7 | **Серверная корзина/wishlist — миграция не завершена.** Заложен фундамент: `setGuestId` ([api.ts](app/api/api/api.ts)) и хуки `useServerCart`/`useServerWishlist` ([useServerCart.ts](app/api/hooks/useServerCart.ts)) поверх `Users.getCart/setCart/addCartItem/getWishlist` (работают для гостя через `x-guest-id` и для юзера). Живой UI всё ещё на Redux + `redux-persist` + `updateUserState`. Остаток (эффорт L): перевести `AddToCartButton`/`HeartCardButton`/cart-steps на серверную корзину с оптимистичными апдейтами и merge-on-login (читать гостевую корзину до `reDefine`, после — `setCart` объединённого, затем `setGuestId('')`). Redux вшит в reservations/animations — отдельная задача, не трогаем сейчас. UserActivity-трекинг для гостей уже работает (браузер авто-генерит `oneentry_guest_id`). | [useServerCart.ts](app/api/hooks/useServerCart.ts) | P2 |

---

## Раздел C. OneEntry Admin Setup → [ONEENTRY-ADMIN-TODO.md](ONEENTRY-ADMIN-TODO.md)

Задачи на стороне OneEntry admin (`https://oe-restaurants.oneentry.cloud/`) — что осталось завести в админке: страницы, атрибуты, формы, словарь `static_content`, related products, payment-accounts, статусы заказов. Переехали в отдельный файл [ONEENTRY-ADMIN-TODO.md](ONEENTRY-ADMIN-TODO.md), чтобы команда админа не листала code-debt разработчика.

Структура там — та же (C.2 Pages, C.3 Related products, C.4 Dictionary, C.5 Profile popup, C.6 Payments, C.7 Audit, C.9 Auth menu, C.10 Reservations history). Правила оформления — см. [CLAUDE.md §3](CLAUDE.md).


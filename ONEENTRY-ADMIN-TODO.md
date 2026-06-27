# OneEntry Admin Setup — что осталось завести в админке

Реестр задач **на стороне OneEntry admin** (`https://oe-restaurants.oneentry.cloud/`) для команды клиента / администратора CMS.

Правила оформления — см. [CLAUDE.md §3](CLAUDE.md) и [§7](CLAUDE.md):

- Поля атрибутов / форм оформляются **только** markdown-таблицей с колонками `marker | type | title` (минимум). По необходимости — `required` / `default` / `notes`.
- Закрытый клиентом пункт — отмечается `✅` рядом или удаляется.
- Вопросы клиенту — префикс `> ❓ **Уточнить у клиента:**`.

Ниже — только то, чего **нет** в админке и нужно для оставшихся функциональных пробелов.

---

## C.2.7. Статус-маркеры товаров/заказов — снять хардкод

- Временный фолбэк в коде: статус-маркеры вынесены в единый источник `PRODUCT_STATUSES` / `ORDER_STATUSES` / `ORDER_HISTORY_STATUSES` в [app/utils/constants.ts](app/utils/constants.ts). Значения: продукт — `out_of_stock`; заказы — `delivered`, `canceled`, `cancelled`, `rejected`, `booking_cancelled`.

Осталось:

1. Сверить order-статусы по сторам `delivery_order` / `booking_order` (см. C.10 #1, требует user-token) — особое внимание написанию `canceled` vs `cancelled` (код сейчас хеджирует оба, после сверки оставить один).
2. (минорно, не блокирует) `Events.getAllEvents` анонимно отдаёт **401** (сверено 2026-06-25; было 403) — открыть группе **Guests** право на `events/all`, чтобы список событий можно было сверять через `inspect-api`. На подписки товара не влияет — они уже работают (события `catalog_event` / `status_out_of_stock` / `product_price` заведены, subscribe/unsubscribe отвечают 204).

### C.2.8.2. `POST /api/content/user-activity/track` отдаёт 403 анониму (сверка SDK 2026-06-25)

Симптом: в консоли браузера на загрузке (страница товара — событие `product_view`) красная ошибка `POST https://oe-restaurants.oneentry.cloud/api/content/user-activity/track 403 (Forbidden)`. Это те самые события `UserActivity`, что питают рекомендательные блоки из C.2.8 (`recently_viewed` / `trending` / `personal_recommendations` / `cart_complement`).

Диагностика (`.claude/temp/check-user-activity.mjs`, app-token = как на SSR/в браузере у гостя):

- сырой `POST /api/content/user-activity/track` под **app-token** → **403** `{"statusCode":403,"message":"Permission data not found. Provide the permission for requested url"}`.
- то же с заголовком `x-guest-id` → **403** (та же ошибка). То есть гейт не в guest-id, а в правах группы на URL.
- Та же семья 403, что прежде была у `ProductStatuses` / similar-products / `review_form` (их клиент уже закрыл, см. C.2.7 / C.2.8 / C.8); из неё открыто только это и `Events` (память `oneentry_anon_apptoken_403_resources`).

Что нужно в админке OneEntry:

1. Открыть группе **Guests** право на `POST /api/content/user-activity/track` (эндпоинт `user-activity/track`), чтобы анонимные `product_view` / `search` / `add_to_cart` писались и питали рекомендации. Аналогично выдать право и группе авторизованных пользователей (события залогиненных тоже идут на этот URL).

**Влияние / код-фолбэк:** на UX **не влияет** — трекинг fire-and-forget, JS-ошибка глотается в [useTrackActivity.ts](app/api/hooks/useTrackActivity.ts) (`.catch(() => {})`). Сама красная строка в консоли — это лог сетевого слоя браузера, из JS его подавить нельзя; уйдёт только после выдачи права. Последствие 403: события активности не копятся → рекомендательные блоки не получают сигналов (закрыто каталог-фолбэками, см. C.2.8). Снять пункт после выдачи права и перепроверки `check-user-activity.mjs` (ожидаем 201/200 вместо 403).

> ⚠️ Побочное: SDK `UserActivity.trackUserActivity` под `isShell: true` возвращает `true` даже на 403 (ошибка не бросается, а возвращается, после чего метод игнорирует её и отдаёт `true`). Полагаться на его результат как на признак успеха нельзя — проверять статус сырым fetch.

### C.4.1. Завести новые маркеры в админке (атрибут-сет `static_content`)

Все ниже — `type: string`. Сгруппировано по экранам, чтобы заполнять было удобнее. `title` в таблице ниже — это и текст, который виден в админке как title маркера, и его `initialValue` (английский дефолт). После создания — прокинуть `dict?.<marker>?.value` в соответствующие компоненты (правка кода).

> **TODO (код):** placeholders для Street/House/Floor в попапе «My Profile» ([ProfilePopup.tsx:347](components/profile/ProfilePopup.tsx#L347)) сейчас хардкод (`«OneEntry»` / `«40»` / `«27»`). Подтянуть из `additionalFields` соответствующих атрибутов формы `delivery_order` (`delivery_address`, `floor`, `apartment_number`) — это канонический источник placeholder'ов и лейблов для полей форм в OneEntry. Не заводить отдельные dict-маркеры.

---

## C.6. Платежи

`PROJECT_URL/payments/accounts` — `cash` (оплата при доставке) и `stripe` (карты через hosted Stripe Checkout). Оба передаются в [StepPayment](components/cart/steps/StepPayment.tsx) через `addPaymentMethod`. Отдельная форма ввода карты в приложении не нужна — Stripe собирает реквизиты на своей странице.

### C.6.1. Форма `delivery_order` — обязательные поля

Через MCP подтверждено, что форма `delivery_order` имеет следующие атрибуты:

| marker             | type         | validator             | status |
|--------------------|--------------|-----------------------|--------|
| `delivery_address` | string       | required (strict)     | ✅     |
| `contact_phone`    | string       | required (strict)     | ✅     |
| `delivery_time`    | timeInterval | —                     | ✅     |
| `comment`          | string       | —                     | ✅     |
| `alt_phone`        | string       | —                     | ✅     |
| `addresses`        | json         | —                     | ❌     |

Как заполняется в коде:

- `delivery_address` — [StepPayment.tsx:136](components/cart/steps/StepPayment.tsx#L136), `addData` по нажатию Continue (адрес берётся из address-book юзера, см. C.5).
- `contact_phone` — [StepPayment.tsx:138](components/cart/steps/StepPayment.tsx#L138), берём `phone` / `phone_reg` / `contact_phone` из `user.formData`.
- `comment`, `alt_phone` — [StepPayment.tsx](components/cart/steps/StepPayment.tsx) (`alt_phone` — только если включён чекбокс «another person»).
- `delivery_time` — [StepPayment.tsx](components/cart/steps/StepPayment.tsx) собирает `[[startISO, endISO]]` через `buildDeliveryTimeInterval` ([deliverySlots.ts](components/cart/steps/step-payment/deliverySlots.ts)) и шлёт `addData({ marker: 'delivery_time', type: 'timeInterval', ... })`. **С D.2 (2026-06-20)** scheduled-режим больше не свободный ввод: доступные слоты читаются из `delivery_time.localizeInfos.intervals[].timeIntervals` (преднасчитанный список `[[startISO,endISO],…]`), извлекается time-of-day паттерн + покрытые weekdays и проецируется на ближайшие даты; пикер показывает чипы слотов. ASAP → start=now, end=now+45 мин; scheduled → выбранный слот (start..end из расписания).
- `addresses` — UI пока не собирает (см. C.5 про адресную книгу юзера).

  > ❓ **Уточнить у клиента (delivery_time schedule):** в `delivery_order` → `delivery_time` преднасчитанные `timeIntervals` покрывают окно 2025-05-01…2026-04-30 (на 2026-06-20 всё в прошлом), с рекуррентностью `inEveryWeek/inEveryMonth: true` и слотами 10:00–14:15 UTC, шаг 15 мин. Код интерпретирует это как «слоты доступны каждый день в эти часы (UTC)» и проецирует вперёд, **игнорируя** блок `external` (per-date `externalTimes`/`inFullDay`-оверрайды). Вопросы: (1) часы 10:00–14:15 заданы в UTC или должны трактоваться как локальное время ресторана? (2) нужны ли `external`-исключения (праздники/особые даты) на витрине, или базового недельного расписания достаточно? (3) стоит ли в админке обновить/продлить окно расписания, чтобы оно не было полностью в прошлом.

**Открытые задачи:**

- **Stripe payment в delivery-чекауте — сервер отдаёт «Your payment account is not connected».** Подтверждено 2026-05-09 на заказе #96: `Orders.createOrder` с `paymentAccountIdentifier: 'stripe'` проходит, но следом `Payments.createSession(id, 'session')` валится с этим текстом.

  🔁 **Повторная проверка 2026-06-25:** через SDK `Payments.getAccounts()` статус **не изменился** — у `stripe` (id=1) `testMode: true`, `settings.status: "not_connected"` (production), `testSettings.status: "connected"` (`stripeOnboardingComplete: true`, `stripeRedirectUrl: …/setup/s/acct_1TlmVbKILvMsGn2r/…`). Подключён только **test**-онбординг (он и раньше был `connected`), production-блок `settings` так и пуст/`not_connected`. Сервер валидирует именно `settings.status`, поэтому чекаут по-прежнему упадёт. Чтобы заработало — нужно пройти **production** Stripe Connect (live-ключи + KYC) до `settings.status: "connected"`, либо дождаться правки валидации на стороне OneEntry (см. вопрос в support ниже). Та же причина, что и для booking — Stripe-аккаунт в `Payments.getAccounts()` имеет `settings.status: "not_connected"` (production) при `testSettings.status: "connected"` и `testMode: true` (см. C.6.2 #1). Сервер OneEntry, судя по поведению, валидирует именно `settings.status` независимо от `testMode` — поэтому test-онбординг ситуацию не закрывает. После фикса в [useCreateOrder.ts](app/api/hooks/useCreateOrder.ts) ошибка теперь не глушится: wizard уходит на error-шаг с конкретным сообщением, заказ фиксируется в OneEntry, но редиректа на Stripe Checkout не происходит до закрытия пробела на стороне OneEntry/админки.

  > ❓ **Уточнить у OneEntry support:** при `testMode: true` сервер `Payments.createSession` должен валидировать `testSettings.status`, а не `settings.status`. Сейчас валидирует production-блок и отвечает `"Your payment account is not connected"`, хотя test-онбординг Stripe Connect завершён (`testSettings.stripeOnboardingComplete: true`, `testSettings.status: "connected"`). Воспроизведение — `Payments.createSession(<orderId>, 'session')` для проекта `oe-restaurants.oneentry.cloud`, account `stripe`. Запросить: либо чтобы на test-mode аккаунтах валидация шла по `testSettings`, либо чтобы сервер возвращал понятную ошибку «account is in testMode, but server requires production-connected account». Параллельно — клиент может временно пройти production Stripe Connect (live-ключи + KYC), это уберёт ошибку, но переведёт оплату на боевые карты.

### C.6.2. Booking-flow — payment + success (Figma 120:1875 / 120:2338)

[ReservationForm.tsx](components/reservation/ReservationForm.tsx) теперь работает как мульти-шаговый визард: `form` → `payment` → `success`. Шаг `payment` использует [ReservationPaymentStep.tsx](components/reservation/ReservationPaymentStep.tsx), `success` — [ReservationSuccess.tsx](components/reservation/ReservationSuccess.tsx).

**Поведение payment-шага:**

- Аккаунты тянутся через `useGetAccountsQuery` (= `Payments.getAccounts()`), фильтр `isVisible && isUsed`, **дополнительно пересекаются** с `storage.paymentAccountIdentifiers` из `useGetOrderStorageByMarkerQuery({ marker: 'booking_order' })` — иначе при выборе непривязанного к storage аккаунта `createOrder` валится в 400 «Your payment account is not connected». Если у storage нет привязанных аккаунтов — fallback на полный список (плюс предупреждение в UI), как написано в `orders.md` rule.

**Поведение createOrder/payment:**

- `paymentAccountIdentifier === 'cash'` → success-экран в попапе.
- иначе → `Payments.createSession(orderId, 'session')` → `window.location.href = paymentUrl`. Если `paymentUrl` не пришёл (PayPal-async, ошибка) — fallback на success в попапе.

**Открытые задачи на стороне клиента/админки:**

1. **Stripe payment-account — сервер валидирует `settings.status`, игнорируя `testMode`.** На 2026-05-07 storage `booking_order` корректно содержит `cash` и `Stripe` в `paymentAccountIdentifiers` (подтверждено скриншотом админки), но `createOrder` с `paymentAccountIdentifier: 'stripe'` валится в `400 "Your payment account is not connected."`. Подтверждено через SDK-инспекцию `Payments.getAccounts()` (2026-05-11):

   ```text
   cash:    testMode: true,  settings.status: "connected",     testSettings.status: "connected"   → работает
   stripe:  testMode: true,  settings.status: "not_connected", testSettings.status: "connected"   → 403
   ```

   `testMode: true` и `settings.status` — независимы (у cash оба статуса `connected` при том же `testMode`). У Stripe выполнен только test-онбординг (`testSettings.stripeOnboardingComplete: true`, `pk_test_...`, незавершённый `stripeRedirectUrl: .../setup/s/<account>/...` — это setup-link от Stripe для админа аккаунта, **не** checkout-URL покупателя). Сервер OneEntry, судя по поведению, при `createSession` валидирует именно `settings.status`, игнорируя `testMode`.

   > ❓ **Уточнить у OneEntry support:** должна ли валидация `Payments.createSession` при `testMode: true` смотреть на `testSettings.status` вместо `settings.status`? Воспроизведение — проект `oe-restaurants.oneentry.cloud`, account `stripe` (id=1): `testMode: true`, `testSettings.status: "connected"`, `settings.status: "not_connected"` → `Payments.createSession(<orderId>, 'session')` → `400 "Your payment account is not connected"`. Запрос: либо корректировать валидацию на test-mode аккаунтах (смотреть `testSettings`), либо возвращать понятную ошибку (`"account is in testMode but server requires production-connected account"`).

   **Альтернатива на стороне клиента:** Payment accounts → Stripe → пройти **production**-онбординг Stripe Connect (live-ключи + KYC), `settings.status` станет `connected` и оплата заработает на реальных картах. Подходит, если проект не должен оставаться в test-mode.

   Cash работает потому, что у него оба статуса `connected`. Код [ReservationPaymentStep.tsx](components/reservation/ReservationPaymentStep.tsx) дополнительно фильтрует список аккаунтов по `storage.paymentAccountIdentifiers` (если массив пустой — UI показывает все + предупреждение «storage has no configured payment methods»), но это не закрывает Stripe-not-connected.
1. **Stripe success-redirect URL.** После оплаты Stripe возвращает юзера на success-URL, заданный в OneEntry payments config. Сейчас такого URL нет — после оплаты юзер вернётся на главную или на ошибку. ❓ **Уточнить у клиента:** какой URL использовать (например, `/reservation/success?orderId=…` — потребует роут на нашей стороне), и обернуть его в текст success-экрана из Figma 120:2338.

### C.6.3. Бонусная программа / лояльность (сверка MCP 2026-06-19)

Последняя версия SDK добавила бонусы на модуле **Discounts**: `getBonusBalance()` → `{ balance }` и `getBonusHistory(...)` → транзакции (обе требуют авторизации). Код подключён: баланс + история показываются в профиле ([BonusSection.tsx](components/profile/BonusSection.tsx)) через RTK-эндпоинты `useGetBonusBalanceQuery` / `useGetBonusHistoryQuery`. Пока программа не настроена, вызовы отдают 403/пусто — секция деградирует до `balance: 0` и «No bonus transactions yet» (graceful, не баг).

🔁 **Повторная проверка 2026-06-26

**программа заведена и баланс работает** — профиль покажет «Bonus balance: 50». Но эндпоинт истории (`GET …/bonus-balance/history`, метод `Discounts.getBonusHistory`) отдаёт 403 из той же семьи permission-гейтов, что и `user-activity/track` (C.2.8.2). `BonusSection` это переживает: баланс показывается, при раскрытии истории список деградирует до «No bonus transactions yet» — код-фикс не нужен.

Что нужно в админке OneEntry:

1. Открыть права на эндпоинт **истории бонусов** `GET /bonus-balance/history` (`Discounts.getBonusHistory`) для группы авторизованных пользователей — сейчас **403** «Permission data not found. Provide the permission for requested url». До выдачи права секция истории в профиле пуста, хотя баланс ненулевой. Снять пункт после перепроверки (ожидаем массив транзакций вместо 403).
1. ✅ ~~(Опционально) списание бонусов на чекауте~~ — **реализовано в коде 2026-06-26**. Сервер списание поддерживает (проверено через SDK: `previewOrder({ bonusAmount: 50 })` на заказе $16.50 → `bonusApplied: 16.5`, `totalDue: 0`; сервер сам капит до суммы к оплате). В доставочном чекауте добавлен тумблер «Pay with bonuses» в [StepOrder.tsx](components/cart/steps/StepOrder.tsx) (виден, только если `getBonusBalance().balance > 0`): включение шлёт весь баланс как `bonusAmount` в [useOrderPreview.ts](app/api/hooks/useOrderPreview.ts) (превью отражает `bonusApplied`/`totalDue`, в тотализаторе появляется строка «Bonuses») и в `createOrder` через [useCreateOrder.ts](app/api/hooks/useCreateOrder.ts). Состояние — `bonusAmount` в `OrderSlice` (сбрасывается в `removeOrder`). **Осталось на админке (опц.):** если нужен лимит — выставить `maxBonusPaymentPercent` / `minBonusAmount` в программе (сейчас бонусами можно закрыть 100% заказа).

## C.7. Аудит соответствия полей коду (inspect-api)

### C.7.5. Inline LQIP-превью изображений — не у всех ассетов (сверка SDK 2026-06-27)

OneEntry для сжатых на сервере изображений отдаёт готовый base64-плейсхолдер прямо в значении атрибута: `images.value[0].previewLink[defaultPreview]` = `[ "data:image/webp;base64,…", "<preview-sized URL>" ]`. Код теперь читает его через `getProductBlurDataURL(attrs)` ([useAttributesData.ts](app/api/hooks/useAttributesData.ts)) и подставляет в `placeholder="blur"` без `sharp`/скачивания ассета ([getProductBlurMap.ts](app/api/lqip/getProductBlurMap.ts), [ProductCover.tsx](components/layout/product/product-single/ProductCover.tsx)).

✅ **Товары — закрыто (сверено 2026-06-27, `.claude/temp/verify-c7-5-previewlink.mjs`):** все **121/121** товаров теперь отдают inline `previewLink` (прежние 25 «дырок» закрыты, изображения перезалиты). Фолбэк на `sharp` для товаров больше не нужен.

Где `previewLink` **ещё отсутствует** (фолбэк на генерацию через `lqip-modern`/`sharp` сохранён, всё работает, но медленнее и грузит билд):

- **Баннеры (страницы `blog/*`, атрибуты `bg_image`/`banner`)** — частично закрыто (сверка 2026-06-27): `birthday_offer` (id 22) — `previewLink` есть и у `bg_image`, и у `banner` ✅; `business_lunch` (id 40) — есть у `bg_image`, **нет у `banner`**; `deal_of_the_day` (id 39) — **нет ни у `bg_image`, ни у `banner`**. Перезалить `banner` у id 40 и оба изображения у id 39.
- **Фото ресторанов (дочерние страницы `restaurants/*`, атрибут `photos`)** — `previewLink` отсутствует у **всех** изображений всех 3 ресторанов (`burj_lumiere` 5 фото, `skyline_pavilion` 5, `petit_jardin` 3; сверка SDK 2026-06-27 — без изменений): значение содержит только `[size, filename, contentType, downloadLink]`. Галерея ([RestaurantPhotoGallery.tsx](components/restaurants/RestaurantPhotoGallery.tsx)) и листинг ([restaurants/page.tsx](app/restaurants/page.tsx)) получают `placeholder="blur"` через серверный фолбэк [getPhotosBlurMap.ts](app/api/lqip/getPhotosBlurMap.ts) (`lqip-modern`/`sharp`).

**Действие для админки:** пере-сохранить/перезалить оставшиеся изображения баннеров (`banner` у `business_lunch`, оба у `deal_of_the_day`) и все изображения в атрибуте `photos` всех ресторанов, чтобы OneEntry сгенерировал `previewLink` (сжатую копию + base64-плейсхолдер). После этого фолбэк на `sharp` для них перестанет срабатывать. Не блокирует релиз — фолбэк закрывает пробел.

---

## C.10. Профиль — Reservations history (Figma 78:1293)

**Открытое для клиента:**

1. **Order statuses для booking_order**. ❓ Какие markers статусов завести в OneEntry admin → Orders → Statuses → Storage `booking_order`? По Figma минимум `Reserved` (default) + `Canceled`. Хорошо бы ещё `InProgress` и `Completed`. Без этого `BookingsPopup` фильтрует Active/History по дефолтному списку (`HISTORY_STATUSES = {delivered, canceled, cancelled, completed, rejected}`) — могут быть mis-classifications.

1. **Status colors / labels** — построить map `{ statusIdentifier → label, color }` на клиенте, как в `OrdersList.tsx` (см. правило `orders.md`).

### C.10.2. Возвраты (refunds) — сверка MCP 2026-06-19

SDK поддерживает заявки на возврат на модуле **Orders**: `getRefunds(id)`, `createRefundRequest(id, { products, note? })`, `cancelRefundRequest(id)`. Код-фундамент готов — хук [useRefunds.ts](app/api/hooks/useRefunds.ts) (`list`/`create`/`cancel`, graceful). UI на карточке заказа ([OrderCard.tsx](components/profile/orders/OrderCard.tsx)) пока не добавлен — это остаток.

Что нужно в админке OneEntry:

1. Настроить **статусы возврата** (refund statuses) и правила: для каких статусов заказа разрешён возврат, какие статусы проходит заявка (requested → approved/rejected → refunded). Без этого `getRefunds` отдаёт пусто, а `createRefundRequest` может валиться.
2. После настройки — построить на клиенте map `{ refundStatus → label, color }` (как для заказов) и добавить кнопку «Request refund» + модалку выбора товаров/количеств в `OrderCard` поверх `useRefunds`.

**Новые dictionary-ключи для C.4.1:**

| marker                       | type   | title                                                       |
|------------------------------|--------|-------------------------------------------------------------|
| `active_reservation_title`   | string | Active reservation |
| `reservation_history_title`  | string | Reservation History |
| `cancel_reservation_button`  | string | Cancel |
| `edit_reservation_button`    | string | Edit |
| `reservation_status_reserved`| string | Reserved |
| `reservation_status_canceled`| string | Canceled |
| `no_active_reservations`     | string | You have no active reservations. |
| `no_reservation_history`     | string | You have no past reservations yet. |
| `booking_cancel_confirm`     | string | Cancel reservation #{id}?                                   |
| `booking_cancelled_toast`    | string | Reservation cancelled.                                      |
| `booking_cancel_failed`      | string | Failed to cancel reservation.                               |
| `booking_updated_toast`      | string | Reservation updated.                                        |

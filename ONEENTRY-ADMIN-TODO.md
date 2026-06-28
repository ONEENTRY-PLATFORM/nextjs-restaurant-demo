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

Что нужно в админке OneEntry:

1. Открыть группе **Guests** право на `POST /api/content/user-activity/track` (эндпоинт `user-activity/track`), чтобы анонимные `product_view` / `search` / `add_to_cart` писались и питали рекомендации. Аналогично выдать право и группе авторизованных пользователей (события залогиненных тоже идут на этот URL).

**Влияние / код-фолбэк:** на UX **не влияет** — трекинг fire-and-forget, JS-ошибка глотается в [useTrackActivity.ts](app/api/hooks/useTrackActivity.ts) (`.catch(() => {})`). Сама красная строка в консоли — это лог сетевого слоя браузера, из JS его подавить нельзя; уйдёт только после выдачи права. Последствие 403: события активности не копятся → рекомендательные блоки не получают сигналов (закрыто каталог-фолбэками, см. C.2.8). Снять пункт после выдачи права и перепроверки `check-user-activity.mjs` (ожидаем 201/200 вместо 403).

> ⚠️ Побочное: SDK `UserActivity.trackUserActivity` под `isShell: true` возвращает `true` даже на 403 (ошибка не бросается, а возвращается, после чего метод игнорирует её и отдаёт `true`). Полагаться на его результат как на признак успеха нельзя — проверять статус сырым fetch.

### C.4.1. Завести новые маркеры в админке (атрибут-сет `static_content`)

Все ниже — `type: string` (для длинных предложений — `text`). Сгруппировано по экранам, чтобы заполнять было удобнее. `title` в таблице — это и текст, который виден в админке как title маркера, и его `initialValue` (английский дефолт). После создания — прокинуть `dict?.<marker>?.value` (через `t()` / `useT()` / `dictText`) в соответствующие компоненты (правка кода).

> **Это сводный реестр** всех непереведённых фраз сайта (аудит 2026-06-28). Сюда **сведены** прежние разрозненные таблицы из C.6.2 (payment_*) и C.10 (reservation/booking) — там оставлены ссылки на этот раздел.
>
> - **en_US:** `initialValue` заполнен у **175/177** маркеров → английский UI берётся из словаря (код-фолбэк срабатывает только у 2 пустых + у ещё не созданных маркеров из таблиц ниже).
> - **ru_RU:** `value` пустой **И** `initialValue = null` у **всех 177** → русской локализации фактически нет; её и нужно наполнить (через `value` либо ru-`initialValue`).
> - `localizeInfos.title` (напр. «Incorrect fields text») — это **заголовок атрибута для админки**, а не контент-значение (контент — `initialValue`, напр. «Some fields incorrect»); приложение `localizeInfos` не читает (ни `fetchDictionary`, ни `dictText` — только цепочку `value`→`initialValue`).
>
> Итого «наполнить» нужно прежде всего **ru**; en уже приходит из словаря. Раздел ниже — про **отсутствующие** маркеры (что «ещё создать»).

> **Формы — не через словарь (важно):** placeholder'ы и лейблы полей OneEntry-форм берутся из `additionalFields` соответствующего form-атрибута (память `feedback_form_placeholders_from_additionalfields`), а сообщения валидации — из `validators` поля формы. В словарь их **не заводить**. Конкретно:
>
> - placeholders Street/House/Floor в «My Profile» ([ProfilePopup.tsx:347](components/profile/ProfilePopup.tsx#L347)) — хардкод (`«OneEntry»` / `«40»` / `«27»`) → `additionalFields` атрибутов формы `delivery_order` (`delivery_address`, `floor`, `apartment_number`).
> - placeholder инпута расписания в [TimeRow.tsx:80](components/cart/steps/step-payment/TimeRow.tsx#L80) — уже тянется из `additionalFields` атрибута `delivery_time` (готово).
> - сообщения валидации формы бронирования ([reservationFormUtils.ts](components/reservation/reservationFormUtils.ts)) — код сейчас зовёт несуществующие dict-маркеры `validation_required` / `validation_email` / `validation_mask` / `validation_string_length`. **Не создавать их в словаре** — переключить на `validators` соответствующих полей OneEntry-формы (в словаре уже есть легаси `required_default_error` / `email_default_error`, но канон — валидаторы поля).

#### A. Каталог / товар / поиск / фильтр

| marker | type | title |
| --- | --- | --- |
| `units_text` | string | units |
| `product_image_alt` | string | Product image |
| `load_more_label` | string | Load more |
| `clear_search_label` | string | Clear search |
| `no_products_found_text` | string | No products found |
| `products_not_found_title` | string | Products not found |
| `products_not_found_text` | text | Try adjusting your filters or search query - nothing matched this combination. |
| `reset_filters_button` | string | Reset & browse all |
| `category_label` | string | Category |
| `filter_panel_title` | string | Filter |
| `quantity_label` | string | Quantity |
| `add_to_cart_aria_template` | string | Add {title} to cart |
| `out_of_stock_aria_template` | string | {title} is out of stock |

#### B. Отзывы (product reviews)

| marker | type | title |
| --- | --- | --- |
| `no_reviews_text` | text | No reviews yet — be the first to share your experience. |
| `prev_review_label` | string | Previous review |
| `next_review_label` | string | Next review |
| `review_placeholder` | string | Review |
| `review_submitted_text` | string | Thanks for your review! |
| `please_signin_review_text` | string | Please sign in to leave a review. |
| `please_leave_review_text` | string | Please, leave a review! |
| `rating_out_of_text` | string | out of |

#### C. Корзина / чекаут (delivery)

| marker | type | title |
| --- | --- | --- |
| `promo_code_text` | string | Promo Code |
| `applying_text` | string | Applying |
| `apply_code_button` | string | Apply Code |
| `remove_button` | string | Remove |
| `coupon_text` | string | Coupon |
| `coupon_applied_suffix` | string | applied |
| `discount_text` | string | Discount |
| `undo_button` | string | Undo |
| `select_item_aria_template` | string | Select {title} |
| `delivery_asap_text` | string | 40-45 min |
| `get_delivery_by_text` | string | Get delivery by: |
| `order_error_title` | string | Something went wrong. |
| `order_error_message` | string | Please try again. |
| `item_fallback_text` | string | Item |
| `proceed_payment_button` | string | APPLY |
| `no_saved_addresses_text` | string | No saved addresses |
| `change_address_text` | string | Change address |
| `date_text` | string | Date |

#### D. Оплата — success/cancel (сведено из C.6.2)

| marker | type | title |
| --- | --- | --- |
| `payment_success_title` | text | Order Confirmed |
| `payment_success_message` | text | Your order has been placed successfully |
| `payment_success_outro` | text | See you soon! |
| `payment_success_cta` | text | View my orders |
| `payment_cancel_title` | text | Payment cancelled |
| `payment_cancel_message` | text | Your payment was not completed. You can try again from your cart. |
| `payment_cancel_cta` | text | Back to cart |
| `payment_back_home` | text | Back to home |

#### E. Бронирование столика (сведено из C.10)

| marker | type | title |
| --- | --- | --- |
| `active_reservation_title` | string | Active reservation |
| `reservation_history_title` | string | Reservation History |
| `no_active_reservations` | string | You have no active reservations. |
| `no_reservation_history` | string | No past reservations yet. |
| `cancel_reservation_button` | string | Cancel |
| `edit_reservation_button` | string | Edit |
| `reservation_status_reserved` | string | Reserved |
| `reservation_status_canceled` | string | Cancelled |
| `booking_cancel_confirm` | string | Cancel reservation #{id}? |
| `booking_cancelled_toast` | string | Reservation cancelled. |
| `booking_cancel_failed` | string | Failed to cancel reservation. |
| `booking_updated_toast` | string | Reservation updated. |
| `booking_deposit_text` | string | Deposit is required to confirm your booking |
| `promo_go_to_selection` | string | Go to selection |

#### F. Профиль / заказы

| marker | type | title |
| --- | --- | --- |
| `personal_title` | string | Personal |
| `orders_title` | string | Orders |
| `my_account_title` | string | My Account |
| `in_cart_label` | string | In cart |
| `repeat_order_added_text` | string | Items from your previous order added to cart |
| `repeat_order_all_unavailable` | string | All items from this order are out of stock |

#### G. Поддержка / auth / прочее

| marker | type | title |
| --- | --- | --- |
| `support_title` | string | Support |
| `calendar_title` | string | Calendar |
| `sign_up_subtitle` | text | Sign in or create account to quickly manage order |
| `send_text` | string | Send code |
| `submit_failed_text` | string | Submit failed |
| `signing_in_text` | string | Signing you in… |
| `hero_slogan_line1` | string | Excellent taste |
| `hero_slogan_line2` | string | in every bite |
| `home_metadata_title` | string | Restaurant — Excellent taste in every bite |
| `home_metadata_description` | text | Restaurant ordering platform built with Next.js + OneEntry CMS |

> `hero_slogan_line2` — в разметке ([header/index.tsx:97](components/layout/header/index.tsx#L97)) выводится как `in <span class="text-brand">every bite</span>`; при локализации либо разбить на два маркера, либо вынести как HTML/rich-text.

#### H. Страницы ресторанов (`/restaurants`, `/restaurants/[handle]`)

| marker | type | title |
| --- | --- | --- |
| `restaurants_back_link` | string | ← All restaurants |
| `restaurant_more_button` | string | More about restaurant |
| `cuisine_label` | string | Cuisine |
| `parking_label` | string | Parking |
| `booking_policy_label` | string | Booking policy |
| `live_events_label` | string | Live events |
| `contacts_title` | string | Contacts |
| `whatsapp_label` | string | WhatsApp: |
| `email_label` | string | Email: |
| `instagram_label` | string | Instagram: |
| `opening_hours_title` | string | Opening hours |
| `map_unavailable_text` | string | Map unavailable |
| `restaurants_title_fallback` | string | Welcome to our restaurant chain |

#### I. ✅ Хардкод → `t()` существующим маркером — закрыто (2026-06-28)

Все фразы из этого раздела уже обёрнуты в `t()` с каноническим маркером. Проверено grep'ом по коду + диагностикой TypeScript: ни одного хардкода и ни одного «почти-дубликата» маркера в коде не осталось.

Переключённые «почти-дубликаты» (код звал левый маркер → канон): `profile_text`→`profile_label`, `repeat_order_button`→`repeat_order`, `contact_courier_button`→`contact_courier`, `add_address_text`→`add_address_button`, `change_password_text`→`change_password_button`, `new_password_desc`→`new_password_label`, `filters_text`→`preferences_text`, `verification`→`verification_text`.

> ⚠️ Принцип на будущее: при «почти-дубликате» маркера — **переключать код на существующий маркер**, а не плодить второй. Отдельный маркер заводить, только если по смыслу нужен другой текст (напр. `apply_code_button` «Apply Code» vs существующий `apply_code` «Apply code text»).

#### J. Не для словаря (dev/SEO-тексты — оставить как есть или вынести позже)

- [restaurants/page.tsx:111](app/restaurants/page.tsx#L111) — «No restaurants configured yet. Add child pages under restaurants…» — подсказка администратору, не клиентский текст.
- [[handle]/page.tsx:42](app/[handle]/page.tsx#L42) — «This page has no content yet. Configure attribute description…» — подсказка администратору.
- [shop/category/[handle]/page.tsx:41](app/shop/category/[handle]/page.tsx#L41) — «Home» / «Shop» в JSON-LD breadcrumbs (structured data, не видимый UI).
- Декоративные `alt`-кандидаты: «delivery» ([DeliveryRow.tsx:26](components/layout/cart/delivery-table/DeliveryRow.tsx#L26)), «cart» ([CenterCartButton.tsx:54](components/layout/bottom-menu/components/CenterCartButton.tsx#L54)), «star» ([products-grid/.../ProductCard.tsx:73](components/layout/products-grid/components/product-card/ProductCard.tsx#L73)), «Oasis» ([mobile-menu/index.tsx:62](components/layout/mobile-menu/index.tsx#L62)) — лучше пустой `alt=""` (декор), а не dict-маркер.

---

## C.6. Платежи

`PROJECT_URL/payments/accounts` — `cash` (оплата при доставке) и `stripe` (карты через hosted Stripe Checkout). Оба передаются в [StepPayment](components/cart/steps/StepPayment.tsx) через `addPaymentMethod`.

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

**Поведение createOrder/payment (обновлено 2026-06-28, D.8):**

- Online/offline определяется классификатором [isOnlinePaymentAccount](app/api/hooks/paymentAccountKind.ts) (`type==='stripe'` + whitelist online-`custom`), а не хардкодом `=== 'cash'`.
- Offline-аккаунт (cash / pay-on-site) → success-экран в попапе.
- Online → `Payments.createSession(orderId, 'session')` → `window.location.href = paymentUrl`. Если `paymentUrl` не пришёл (PayPal-async без polling, неподключённый/мисконфиг-гейтвей) — теперь **ошибка** (`ok:false`), а НЕ success: латентный P0 (success на неоплаченном заказе) закрыт. PayPal `getSessionByOrderId` polling остаётся отложенным (D.8a).

**Открытые задачи на стороне клиента/админки:**

1. **Stripe payment-account — сервер валидирует `settings.status`, игнорируя `testMode`.** На 2026-05-07 storage `booking_order` корректно содержит `cash` и `Stripe` в `paymentAccountIdentifiers` (подтверждено скриншотом админки), но `createOrder` с `paymentAccountIdentifier: 'stripe'` валится в `400 "Your payment account is not connected."`. Подтверждено через SDK-инспекцию `Payments.getAccounts()` (2026-05-11):

   ```text
   cash:    testMode: true,  settings.status: "connected",     testSettings.status: "connected"   → работает
   stripe:  testMode: true,  settings.status: "not_connected", testSettings.status: "connected"   → 403
   ```

   `testMode: true` и `settings.status` — независимы (у cash оба статуса `connected` при том же `testMode`). У Stripe выполнен только test-онбординг (`testSettings.stripeOnboardingComplete: true`, `pk_test_...`, незавершённый `stripeRedirectUrl: .../setup/s/<account>/...` — это setup-link от Stripe для админа аккаунта, **не** checkout-URL покупателя). Сервер OneEntry, судя по поведению, при `createSession` валидирует именно `settings.status`, игнорируя `testMode`.

   > ❓ **Уточнить у OneEntry support:** должна ли валидация `Payments.createSession` при `testMode: true` смотреть на `testSettings.status` вместо `settings.status`? Воспроизведение — проект `oe-restaurants.oneentry.cloud`, account `stripe` (id=1): `testMode: true`, `testSettings.status: "connected"`, `settings.status: "not_connected"` → `Payments.createSession(<orderId>, 'session')` → `400 "Your payment account is not connected"`. Запрос: либо корректировать валидацию на test-mode аккаунтах (смотреть `testSettings`), либо возвращать понятную ошибку (`"account is in testMode but server requires production-connected account"`).

   Cash работает потому, что у него оба статуса `connected`. Код [ReservationPaymentStep.tsx](components/reservation/ReservationPaymentStep.tsx) дополнительно фильтрует список аккаунтов по `storage.paymentAccountIdentifiers` (если массив пустой — UI показывает все + предупреждение «storage has no configured payment methods»), но это не закрывает Stripe-not-connected.
1. **Stripe success/cancel redirect URLs.** ✅ Роуты на стороне сайта созданы: `/payment/success` и `/payment/cancel` ([app/payment/success/page.tsx](app/payment/success/page.tsx), [app/payment/cancel/page.tsx](app/payment/cancel/page.tsx), общий [PaymentResult.tsx](components/payment/PaymentResult.tsx)). Success-экран повторяет карточку из Figma 120:2338 (`cart_PAYMENT_masseges.html`); id заказа берётся из query (`?orderId=`), т.к. Redux `lastOrderId` не переживает полный перезагруз со Stripe. Общий URL на платёжный аккаунт — годится и для доставки, и для брони. **Осталось на админке:** в OneEntry payments config (Stripe-аккаунт) прописать:

   - success URL → `https://<host>/payment/success?orderId=<id>` (если подстановка id шаблоном не поддерживается — просто `/payment/success`, экран деградирует до подтверждения без номера);
   - cancel URL → `https://<host>/payment/cancel`.

   > ⚠️ Корзина чистится **до** редиректа на Stripe ([useCreateOrder.ts](app/api/hooks/useCreateOrder.ts) — `clearCheckoutState()` перед возвратом `paymentUrl`), поэтому при отмене оплаты позиции уже потеряны. Восстановление корзины на cancel — отдельная задача (связано с D.8 в [MISMATCH-LOG.md](MISMATCH-LOG.md)).

   Тексты экранов читаются из словаря `static_content` с англ.-фолбэками (graceful, без ключей работает). Маркеры для локализации (`payment_success_*` / `payment_cancel_*` / `payment_back_home`) **сведены в сводную таблицу C.4.1, раздел D**.

### C.6.3. Бонусная программа / лояльность (сверка MCP 2026-06-19)

Последняя версия SDK добавила бонусы на модуле **Discounts**: `getBonusBalance()` → `{ balance }` и `getBonusHistory(...)` → транзакции (обе требуют авторизации). Код подключён: баланс + история показываются в профиле ([BonusSection.tsx](components/profile/BonusSection.tsx)) через RTK-эндпоинты `useGetBonusBalanceQuery` / `useGetBonusHistoryQuery`.

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

### C.7.6. Форма `user` — неполные флаги полей (`isSignUp`/`isPassword`/`isNotification*`) (сверка SDK 2026-06-28)

Основной рефактор auth-форм (MISMATCH-LOG **D.9**: флаг-роутинг `authData`/`formData`/`notificationData`) должен выводить роль каждого поля из его флагов в форме `user`, а не из хардкод-списков в коде. Сверка живой схемы показала, что флаги проставлены непоследовательно — роутинг по ним сейчас даст битую форму (например, на регистрации окажется только `surname`).

**Текущее состояние и что требуется** (форма `user`, formIdentifier email-провайдера):

| marker              | type   | title           | текущие флаги                | требуется проставить                         |
|---------------------|--------|-----------------|------------------------------|----------------------------------------------|
| `email`             | string | Email           | `isLogin`                    | + `isSignUp`                                  |
| `username`          | string | Name            | —                            | `isSignUp`                                    |
| `surname`           | string | Surname         | `isSignUp`                   | `isSignUp` (ок)                               |
| `phone`             | string | Phone           | —                            | `isSignUp` (+ см. вопрос про notifications)   |
| `password`          | string | Password        | `isPassword`                 | + `isSignUp`                                  |
| `repeat_password`   | string | Repeat password | —                            | `isPassword`                                  |
| `email_notifications` | string | email_notifications | `isNotificationEmail`   | см. вопрос про notifications                  |

> ❓ **Ask the client:** как роутить `notificationData`? Код сейчас шлёт уведомления на `email` + `phone` (`isNotificationEmail` логично на `email`, `isNotificationPhoneSMS`/`isNotificationPhonePush` — на `phone`). Но в схеме `isNotificationEmail` стоит на отдельном поле `email_notifications`, которое UI не использует. Нужно решить: уведомления идут по `email`/`phone` (тогда перенести флаги) или `email_notifications` — это отдельный канал/настройка (тогда оставить и завести UI).

**Фолбэк (что временно закрыло пробел):** две безопасные подзадачи D.9 уже сделаны без флагов — `SignUpForm` отбирает поля по явному набору маркеров и сортирует по `position`; `repeat_password` маскируется через переименованный член `FormFieldsEnum`. Приложение работает; флаги нужны только для основного флаг-роутинга D.9. Не блокирует релиз.

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

**Новые dictionary-ключи для бронирования (`active_reservation_title` / `reservation_history_title` / `cancel_reservation_button` / `edit_reservation_button` / `reservation_status_*` / `no_active_reservations` / `no_reservation_history` / `booking_cancel_*` / `booking_cancelled_toast` / `booking_updated_toast` / `promo_go_to_selection`) сведены в сводную таблицу C.4.1, раздел E.**

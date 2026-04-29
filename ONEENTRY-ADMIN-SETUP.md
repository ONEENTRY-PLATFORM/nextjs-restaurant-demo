# OneEntry Admin Setup — Что осталось сделать

Админка: `https://oe-restaurants.oneentry.cloud/`

Код уже подключён к существующим сущностям (`services`, `bookings`, `filters`, `menu`, `restaurants`, `blog`, `delivery_order`, `booking_order`, `user`, attribute set `dish` с `cover/weight/rating/cooking_time/price/...`, attribute set `restaurant`, attribute set `catalog_page`). Ниже — только то, чего **нет** в админке и нужно для оставшихся функциональных пробелов.

---

## 1. Недостающие формы

### 1.1. `contact_us` — форма поддержки

Нужна для [components/forms/ContactUsForm.tsx](components/forms/ContactUsForm.tsx) + [app/support/page.tsx](app/support/page.tsx).

| marker    | type   | title       |
|-----------|--------|-------------|
| `name`    | string | Your name   |
| `email`   | email  | Your email  |
| `message` | text   | Message     |
| `spam`    | spam   | reCAPTCHA   |

> ❓ **Уточнить у клиента:** в вёрстке [static-html/service_support.html](static-html/service_support.html) на этом экране нет формы с полями — только два блока с быстрыми контактами (WhatsApp / звонок). Что должно быть на странице поддержки: классическая форма обратной связи (текущая реализация), блок с контактами как в макете, или оба варианта? Пока оставляем форму, ждём решение.

### 1.2. `delivery_order` — добавить поля

В форму заказа доставки [StepPayment.tsx](components/cart/steps/StepPayment.tsx) добавлены 2 поля per `cart_PAYMENT.html` («Comments to the order» + «order taken by another person» → phone). В `delivery_order` нужны соответствующие маркеры:

| marker      | type   | title                                     | required |
|-------------|--------|-------------------------------------------|----------|
| `comment`   | text   | Comments to the order                     | no       |
| `alt_phone` | string | Phone of the alternate receiver           | no       |

Сейчас `addData({ marker: 'comment' / 'alt_phone' })` отправит их при сабмите заказа — без полей в OneEntry значения отправятся, но не сохранятся.

### 1.3. `delivery_review_form` — отзыв о доставке

Используется в drawer-е [components/reviews/OrderReviewsPanel.tsx](components/reviews/OrderReviewsPanel.tsx) (вёрстка [static-html/index_rewiews.html](static-html/index_rewiews.html)) для последней «Delivery»-строки в списке отзывов по заказу. Сейчас заглушка [submitDeliveryReview](app/actions/review.ts) возвращает `{ ok: true }`, но в админке формы пока нет — отзыв о курьере никуда не сохраняется.

| marker            | type   | title              | required |
|-------------------|--------|--------------------|----------|
| `review_rating`   | int    | Rating             | yes      |
| `review_text`     | text   | Review body        | yes      |
| `delivery_status` | string | Delivery condition | no       |

После создания формы нужно поправить `submitDeliveryReview` так же, как `submitReview`: читать схему через `Forms.getFormByMarker('delivery_review_form')`, постить через `FormData.postFormsData` с `moduleEntityIdentifier=String(orderId)`.

> ❓ **Уточнить у клиента:** должна ли «Delivery»-строка отзыва быть гейтом пока заказ не помечен как доставленный? В вёрстке drawer виден при статусе «In delivery», но обычно отзыв собирается уже после `delivered`.

---

## 2. Недостающие страницы

### 2.1. `support`

- pageUrl: `support`
- Используется в [app/support/page.tsx](app/support/page.tsx).
- Attribute set с полями:

  | marker                 | type   | title          |
  |------------------------|--------|----------------|
  | `support_title`        | string | Title          |
  | `support_description`  | text   | Description    |
  | `support_phone`        | string | Phone          |
  | `support_whatsapp_url` | string | WhatsApp URL   |
  | `support_email`        | email  | Email          |

### 2.3. Дочерние страницы под `blog` (акции)

В админке: `birthday_offer`, `birthday_offer_copy4`, `business_lunch`, `deal_of_the_day`. В вёрстке также упоминаются `kids_menu`, `happy_monday`, `dinner_fix_price` — создать недостающие child-pages под `blog`. Реальный attribute set `blog_page` (по результату [inspect-api](.claude/temp/inspect-blog.mjs)):

| marker          | type  | title          |
|-----------------|-------|----------------|
| `bg_image`      | image | Desktop banner |
| `banner`        | image | Mobile banner  |
| `description`   | text  | Description    |
| `action_type`   | list  | Action type    |

- `bg_image` — десктоп-баннер на `/`, `/cart`, `/profile/orders` ([getBlogBanners](app/api/server/pages/getBlogBanners.ts)). И как hero на `/promo/[handle]`.
- `banner` — мобильный баннер в горизонтальном скролле на `/` и fallback для hero на детальной странице, если `bg_image` пуст.
- `description` — markdown/HTML текст под заголовком (используется в `[handle]/page.tsx` через `htmlValue`).
- `action_type` — list-атрибут; `[0].title` идёт в CTA-кнопку. Сейчас у всех страниц пустой → используется fallback (`Order now` / `Learn more`).

Заголовок (title) идёт из `localizeInfos.title` страницы — отдельного `title`/`promo_title` атрибута в `blog_page` нет.

Состояние данных (на момент проверки):

| pageUrl                 | bg_image | banner | description | action_type |
|-------------------------|----------|--------|-------------|-------------|
| `birthday_offer`        | ✅       | ✅     | ✅          | ❌ пусто    |
| `birthday_offer_copy4`  | ❌ пусто | ✅     | ✅          | ❌ пусто    |
| `business_lunch`        | ❌ пусто | ✅     | ✅          | ❌ пусто    |
| `deal_of_the_day`       | ✅       | ✅     | ✅          | ❌ пусто    |

> ❓ **Уточнить у клиента:** заполнить `bg_image` у `birthday_offer_copy4` и `business_lunch` (иначе они не попадут в десктоп-сайдбары `/cart` / `/profile/orders`). Также — наполнить `action_type` (list-options) для CTA-кнопок в карточках и на детальной странице.

Десктоп-баннер берётся через [getBlogBanners](app/api/server/pages/getBlogBanners.ts) (`bg_image`), мобильный — через тот же fetcher (`banner`). Пока у дочерних страниц `blog` нет `bg_image` — десктопный hero на `/` не покажется (graceful fallback), а сайдбар `/cart` / `/profile/orders` будет пустым.

---

## 2.4. Атрибут `preferences` (list) на attribute set `dish`

[components/layout/header/CategoriesScroller.tsx](components/layout/header/CategoriesScroller.tsx) теперь рендерит горизонтальный фильтр-скроллер по значениям атрибута `preferences` (list-type) у блюд. Каждый чип — Link на `/shop?preferences=<value>`, фильтр прокидывается в `Products.getProducts` через [app/api/utils/getSearchParams.ts](app/api/utils/getSearchParams.ts) (`attributeMarker: 'preferences', conditionMarker: 'in'`).

| marker        | type | title       |
|---------------|------|-------------|
| `preferences` | list | Preferences |

- listTitles задаются в админке (например: `Meat`, `Fish`, `Vegetable`, `Sugar Free`, `Gluten free`, `Vegetarian`, `Spicy dish`, `Diabetic`, …) — те же значения, что в [components/static/FilterBottom.tsx](components/static/FilterBottom.tsx).
- Атрибут уже используется на product detail ([ProductDetails.tsx:45](components/layout/product/product-single/ProductDetails.tsx#L45)) — если listTitles пустые, scroller рендерится пустым (graceful fallback).
- Каждое блюдо должно иметь выбранные значения `preferences`, иначе фильтр `preferences in <value>` вернёт пусто.

> ❓ **Уточнить у клиента:** сейчас в `listTitles` атрибута `preferences` есть две записи с одинаковым `value = "Dinner"` — React ругается на дубликат ключа в [CategoriesScroller.tsx:52](components/layout/header/CategoriesScroller.tsx#L52). Временно дедуплицируем по `value` в [components/layout/header/index.tsx](components/layout/header/index.tsx) (первое вхождение побеждает). Убрать один из дубликатов в админке (или поменять `value` второму, если это разные смыслы) — после этого можно убрать дедуп.

---

## 3. Похожие товары (related products)

Страница [app/shop/product/[handle]/page.tsx](app/shop/product/[handle]/page.tsx) рендерит секцию «Featured objects» через [components/layout/product/RelatedItems.tsx](components/layout/product/RelatedItems.tsx) → SDK `Products.getRelatedProductsById`. Чтобы секция реально что-то показывала:

- В админке для каждого блюда открыть карточку товара и привязать минимум 4–6 «похожих» через стандартный механизм OneEntry «Related products». Без этого `getRelatedProductsById` возвращает пустой список и секция не рендерится (graceful fallback).
- (Опционально) Заголовок секции — берётся из `static_content.featured_objects` (string), fallback `"Featured objects"`. Если хочется локализованный заголовок — добавить атрибут:

  | marker              | type   | title             |
  |---------------------|--------|-------------------|
  | `featured_objects`  | string | Featured objects  |

---

## 4. Словарь `static_content` — что осталось

Словарь подгружается через [app/dictionaries.ts](app/dictionaries.ts) (атрибут-сет `static_content`, нормализован в `Record<marker, attr>`, `value` = `initialValue` если локализация не заполнена). В админке уже есть 59 маркеров. Все обращения в коде переведены на существующие маркеры — несуществующие маркеры удалены из кода (использованы ближайшие по смыслу из 59):

- [RelatedItems.tsx](components/layout/product/RelatedItems.tsx) — `featured_objects` → хардкод `'Featured objects'` (нет подходящего маркера).
- [ReservationForm.tsx](components/reservation/ReservationForm.tsx) — `reservation_submit_text` → `submit_text`, `reservation_success_title` → `info_text`, `reservation_success_text` → `reservation_confirmed`.
- [UserForm.tsx](components/forms/UserForm.tsx) — `save_button_text` → `submit_text`.
- [PhoneAuthForm.tsx](components/forms/PhoneAuthForm.tsx) — `sign_in_phone_label` → хардкод `'Phone number'` (нет подходящего маркера).

Хардкод-фразы, которые ждут wiring (компонент пока не получает `dict` сверху, нужен мини-рефактор для проброса):

- [components/static/FilterBottom.tsx](components/static/FilterBottom.tsx): «Order waiting time» → `order_waiting_time`, «Preferences» → `preferences_text`, «Clear all filters» (если есть) → `clear_all_filters_text`.
- [components/reviews/ReviewForm.tsx](components/reviews/ReviewForm.tsx): «Leave a review» → `leave_review`, «Your review» → `your_review`, «Your rating» → `your_rating`, «Share experience» → `share_experience`, «Camera» → `camera_text`, «Gallery» → `gallery_text`.
- [components/profile/FavoritesPopup.tsx](components/profile/FavoritesPopup.tsx): aria-label «Add to cart» → `add_to_cart`.
- [components/cart/steps/StepPayment.tsx](components/cart/steps/StepPayment.tsx): «Pay with» (PayPal label) → нет маркера (хардкод), «Credit & Debit Cards» → нет маркера (хардкод), «The order will be taken by another person» → нет маркера (хардкод), placeholder «phone number» под чекбоксом → нет маркера (хардкод). Wired: `select_payment_text`, `pay_cash_text`, `comment_order`.
- [components/cart/CartWizard.tsx](components/cart/CartWizard.tsx) — STEP_TITLES уже подцеплены к `sign_in_text`/`verification_text`/`address_text`/`select_payment_text`. «Cart», «Select time», «Success», «Error» — нет соответствующих маркеров, оставлены хардкодом.

---

## 5. Профиль — попап «My Profile» (детальный personal/payment/address)

[components/profile/ProfilePopup.tsx](components/profile/ProfilePopup.tsx) — порт верстки [static-html/details_personal.html](static-html/details_personal.html). Открывается из иконки пользователя в шапке. Сейчас:

- **Personal** — поля First Name / Second Name / Phone / E-mail / Password префилятся из `AuthContext.user.formData` (`name`, `second_name`/`lastname`, `phone`, `email`). Кнопка **Edit** не сохраняет — нужно подключить `api.Users.updateUser` по образцу [components/forms/UserForm.tsx](components/forms/UserForm.tsx) (form-marker `user`).
- **Payment** — список карт, Add Card (номер/MM-YY/CVC), Delete. **Всё локально** (`useState`), не персистится. Нужно решение:

  > ❓ **Уточнить у клиента:** где хранить сохранённые карты пользователя? Варианты: (а) custom attribute `saved_cards` (json/text) у `user` form, (б) отдельная сущность через OneEntry `state` пользователя, (в) сторонний платёжный gateway (Stripe customer + payment methods). Пока — UI без сохранения.

- **Address** — список адресов (street/house/floor) + map preview (`/images/picture/maps.png` static), Add/Delete/Apply. **Локально**, не персистится. Нужно:

  > ❓ **Уточнить у клиента:** адреса доставки — отдельная коллекция в OneEntry или поле `addresses` (json) в `user` form? Сейчас в `delivery_order` форме адрес собирается заново на каждом заказе ([StepAddress.tsx](components/cart/steps/StepAddress.tsx)) — должна ли «адресная книга» из попапа автоматически предлагать сохранённые адреса в чекауте?

- **Map preview** — статичный PNG. Если нужна интерактивная карта (Google Maps / Yandex / Mapbox) — задача отдельная.

Когда ответы получены — таски на код:

1. Edit → `api.Users.updateUser({ formIdentifier, formData, authData, notificationData, state })`.
2. Cards: persist в выбранное хранилище + load в `useEffect` из `AuthContext.user`.
3. Addresses: persist + загружать в чекаут как `<select>` сохранённых.

---

## 6. Платежи

`PROJECT_URL/payments/accounts` — аккаунт `cash` (оплата при доставке). PayPal/cash работают через `addPaymentMethod`; карточная оплата теперь активна в UI ([StepPayment](components/cart/steps/StepPayment.tsx) → [StepAddCard](components/cart/steps/StepAddCard.tsx) per `cart_add_card.html`), но завершает заказ синтетическим `card:<id>` — нужно создать `card`-payment-account и подключить реальный gateway, иначе платёж в OneEntry не пройдёт.

Дополнительно: [StepOrder](components/cart/steps/StepOrder.tsx) (per `cart_Order.html`) показывает поле «Promo Code» с кнопкой «Apply Code» — обработчик пока no-op. Уточнить:

> ❓ **Уточнить у клиента:** есть ли в OneEntry/бэкенде механизм промокодов (скидка % / фикс / free delivery)? Если да — какой API/marker и как привязывать к заказу. Пока кнопка не делает ничего и поле декоративное.

---

## 7. Аудит соответствия полей коду (inspect-api)

Проверка проведена через `oneentry` SDK напрямую к проекту `oe-restaurants.oneentry.cloud` (lang=`en_US`). Зафиксировано на момент проверки.

### 7.1. Pages — реальные атрибуты

- **`home_web`** — атрибутов нет (контент рендерится через blocks).
- **`support`** — атрибутов нет вообще. Код читает `support_title`, `support_description`, `support_phone`, `support_whatsapp_url`, `support_email` — всё фолбэчится. См. 2.1.
- **`services`** — `icon`, `service_logo`, `service_bg_image`, `service_primary_cta`, `service_primary_href`, `service_secondary_cta`, `service_secondary_href` существуют, но **значения пусты** → используются хардкоды [app/service/page.tsx](app/service/page.tsx).
- **`bookings`** — только `menu_icon`. Код раньше читал `reservation_hero_image`, `reservation_title`, `reservation_description` — **исправлено**: hero теперь берётся из `restaurants.photos[0]`, `restaurants.description`, `localizeInfos.title`.
- **`restaurants`** — `address`, `lat`, `long`, `description` (text), `photos` (groupOfImages), `comforts` (list), `schedule` (timeInterval), `menu_icon`, `phone`. Раньше читался `parent.attributeValues.title.value` — **исправлено** на `parent.localizeInfos.title`.
- **`restaurants/*`** (`restaurant_1/2/3`) — те же что у `restaurants`. Маркер `restaurant_address` — **нет**, исправлено: используется `address`.
- **`menu/*`** (`appetizers`, `dinner`, `soup`, `fresh_juice`, …) — `icon` (заполнен), `service_*` (пустые, унаследовано из шаблона).
- **`filters`** — `cooking_time_filters` (json), `preferences_filters` (json), `price_filters` (string).
- **`blog/*`** — `bg_image`, `banner`, `description`, `action_type`. См. 2.3. `title`, `promo_image`, `promo_title`, `promo_subtitle`, `promo_cta` — **исправлено** в предыдущем раунде.

### 7.2. Product (attribute set `dish`)

Реальные атрибуты у первого продукта (id=13):
`weight` (integer), `calorrage` (integer), `cooking_time` (integer), `preferences` (list), `ingredients` (string), `price` (integer), `currency` (string), `rating` (float), `sku` (string), `cover` (image).

- **`pic`** — ❌ нет. Удалён fallback из всех мест: [ProductImage](components/layout/products-grid/components/product-card/ProductImage.tsx), [cart ProductCard](components/layout/cart/components/ProductCard.tsx), [FavoritesGrid](components/profile/FavoritesGrid.tsx), [FavoritesPopup](components/profile/FavoritesPopup.tsx), [StepOrder](components/cart/steps/StepOrder.tsx), [shop/product/[handle]](app/shop/product/[handle]/page.tsx), [ProductImageGallery](components/layout/product/product-single/ProductImageGallery.tsx).
- **`portion`** — ❌ нет. Удалён fallback в [ProductCard](components/layout/products-grid/components/product-card/ProductCard.tsx), [FavoritesGrid](components/profile/FavoritesGrid.tsx), [FavoritesPopup](components/profile/FavoritesPopup.tsx).
- **`time`, `delivery_time`** — ❌ нет. Удалён fallback в [ProductCard](components/layout/products-grid/components/product-card/ProductCard.tsx).
- **`stars`** — ❌ нет. Удалён fallback в [ProductCard](components/layout/products-grid/components/product-card/ProductCard.tsx).
- **`more_pic`** — ❌ нет. Оставлено (для будущего расширения, [ProductImageGallery](components/layout/product/product-single/ProductImageGallery.tsx)).
- **`sale`** — ❌ нет в `dish` set. Оставлено (graceful fallback к 0 → отображается обычная цена). При появлении распродаж — добавить в админке.
- **`units_product`** — ❌ нет. Оставлено (graceful fallback к 0 → нет лимита по складу).
- **`description`** — ❌ нет на продукте. Читается в [ProductDetails](components/layout/product/product-single/ProductDetails.tsx) и [shop/product/[handle]](app/shop/product/[handle]/page.tsx) — текстовое тело продукта пустое. Добавить в админке если нужно описание.
- **`stickers`** — ❌ нет. [Stickers.tsx](components/layout/products-grid/components/product-card/Stickers.tsx) ничего не рендерит. Добавить в админке для бейджей «Хит/Новинка/Скидка».

> ❓ **Уточнить у клиента:** добавить ли в `dish` атрибуты `sale`, `units_product`, `description`, `stickers`, `more_pic`? Без них соответствующая логика молча падает в no-op (нет распродаж / нет лимита склада / нет описания / нет бейджей / одна картинка вместо галереи).

### 7.3. Forms

- **`user`** — ✅ есть, 10 атрибутов: `username`, `surname`, `email`, `phone`, `password`, `repeat_password`, `user_address`, `email_notifications`, `user_flat`, `user_floor`. Используется в [SignInForm](components/forms/SignInForm.tsx), [SignUpForm](components/forms/SignUpForm.tsx), [UserForm](components/forms/UserForm.tsx).
- **`booking_order`** — ✅ есть: `restaurant`, `time_slot`, `surname`, `phone`, `name`, `people_count`, `user_preferences`. Используется в [ReservationForm](components/reservation/ReservationForm.tsx).
- **`delivery_order`** — ✅ существует (используется через `getAllOrdersByMarker`, [OrdersList](components/profile/OrdersList.tsx), `StepPayment` submit).
- **`contact_us`** — ❌ нет. Используется в [ContactUsForm](components/forms/ContactUsForm.tsx) — fetch упадёт, см. 1.1.
- **`reservation`** — ❌ нет. В коде не используется (используется `booking_order`).
- **`reviews`** — ❌ нет. Используется в [ReviewForm](components/reviews/ReviewForm.tsx) — fetch упадёт.

### 7.4. Blocks (home_web)

3 блока с identifier'ами `home_promo`, `recommended`, `home_categories`. У всех блоков **нет атрибутов**. Код использует только `block.identifier` как позиционный якорь для рендера — это работает.

[components/layout/product/ProductsGroup.tsx:32](components/layout/product/ProductsGroup.tsx) читает `block.attributeValues?.together_title?.value` для блока `together` (related products) — соответствующий блок в админке надо проверить отдельно (если есть).

### 7.5. Dictionary (`static_content`) — что код читает, но в CMS нет

- **`go_to_pay_placeholder`** → ✅ добавлен в `static_content` (initial `Go to pay`). [DeliveryForm.tsx](components/layout/cart/delivery-table/DeliveryForm.tsx) уже читал этот маркер с fallback'ом на `Go to payment` — кода менять не пришлось.
- **`reset_descr`, `send_text`** ([ForgotPasswordForm.tsx](components/forms/ForgotPasswordForm.tsx)) — нет.

> ❓ **Уточнить у клиента:** надо ли расширять `static_content` под все эти UI-строки (для локализации) или достаточно текущих 59 + хардкоды?

---

## 8. Auth Providers

### 8.1. `google` (OAuth) — нужен на шаге `signin` корзины

В админке провайдер уже есть (`identifier: "google"`, `type: "oauth"`, `isActive: true`, `userGroupIdentifier: "guest"`), но:

- **`config.oauthAuthUrl`** — сейчас **`null`**. Заполнить значением `https://accounts.google.com/o/oauth2/v2/auth` (или оставить null — тогда client редиректит на этот URL хардкодом из [StepSignIn.tsx](components/cart/steps/StepSignIn.tsx)).
- **Google Cloud Console → OAuth 2.0 Client IDs.** Создать клиента, добавить в Authorized redirect URIs:
  - `http://localhost:3000/auth/callback/google` (dev)
  - `https://<vercel-host>/auth/callback/google` (prod)
- **`.env.local`** дописать:

  ```env
  NEXT_PUBLIC_GOOGLE_CLIENT_ID=<client_id из Google Cloud Console>
  GOOGLE_CLIENT_SECRET=<client_secret>
  ```

  Используется в [StepSignIn.tsx](components/cart/steps/StepSignIn.tsx) (редирект на Google) и [oauthLogIn.ts](app/api/server/users/oauthLogIn.ts) (server-only обмен code → token через `api.AuthProvider.oauth('google', ...)`). Без `NEXT_PUBLIC_GOOGLE_CLIENT_ID` кнопка «Login With Google» молча падает в email-fallback (открывает обычную email/phone-форму).

> ❓ **Уточнить у клиента:** должны ли пользователи, зашедшие через Google, попадать в группу `guest` (как сейчас в `userGroupIdentifier`) или в `user`? И нужен ли отдельный auth-провайдер `facebook` (в верстке `cart_login.html` / `pk_login.html` он есть, но в проекте по решению клиента оставлены только Email + Google).

---

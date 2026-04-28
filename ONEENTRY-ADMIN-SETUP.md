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

### 2.2. Иконки категорий (`menu` → child pages)

Атрибут `icon` (image) у дочерних страниц `menu` уже определён в attribute set, но **значения не загружены** для большинства категорий. Используется в [components/static/CategoryFilter.tsx](components/static/CategoryFilter.tsx) (левый drawer категорий) и потенциально в `CategoriesScroller`. Сейчас при пустом `icon` есть fallback на файл `/public/images/icons/<pageUrl>.svg`, но это временный костыль — для админ-управляемой вёрстки иконки должны жить в CMS.

| pageUrl          | состояние `icon`   |
|------------------|--------------------|
| `appetizers`     | ✅ загружено       |
| `kids_menu`      | ✅ загружено       |
| `snacks`         | ✅ загружено       |
| `dinner`         | ✅ загружено       |
| `fresh_juice`    | ✅ загружено       |
| `soup`           | ✅ загружено       |
| `hot_meals`      | ✅ загружено       |
| `meat`           | ✅ загружено       |
| `fish`           | ✅ загружено       |
| `lunch`          | ✅ загружено       |
| `breakfast`      | ✅ загружено       |
| `salads`         | ✅ загружено       |
| `desserts`       | ✅ загружено       |
| `cold_beverages` | ✅ загружено       |
| `first_courses`  | ✅ загружено       |
| `pizza`          | ✅ загружено       |

- Для категорий без атрибута — добавить `icon` (тип `image`) в attribute set дочерних страниц `menu`.
- Для категорий с пустым атрибутом — загрузить иконку. Источник — `static-html/public/images/icons/<pageUrl>.svg` (`first_courses.svg`, `main_courses.svg`, `salads.svg`, `snackes.svg`, `hot_beverages.svg`, `fresh_juice.svg`, `dessert.svg`, `appetizers.svg`, `kids_menu.svg`, `booking_table.svg`).

### 2.3. Дочерние страницы под `blog` (акции)

В админке только `birthday_offer`. В верстке также нужны: `business_lunch`, `deal_of_the_day`, `kids_menu`, `happy_monday`, `dinner_fix_price` — создать child-pages под `blog` с attribute set `blog_page`:

| marker          | type   | title         |
|-----------------|--------|---------------|
| `promo_image`   | image  | Promo image   |
| `promo_title`   | string | Title         |
| `promo_subtitle`| string | Subtitle      |
| `promo_cta`     | string | CTA label     |

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
- [components/profile/FavoritesList.tsx](components/profile/FavoritesList.tsx): aria-label «Add to cart» → `add_to_cart`.
- [components/cart/steps/StepPayment.tsx](components/cart/steps/StepPayment.tsx): «Pay with cash» → `pay_cash_text`, «Pay with stripe» → `pay_stripe_text`, «Comment to the order» → `comment_order`, «Subtotal»/«Delivery»/«Total amount» → `subtotal_text`/`delivery_text`/`total_amount_text`.
- [components/cart/CartWizard.tsx](components/cart/CartWizard.tsx) — STEP_TITLES уже подцеплены к `sign_in_text`/`verification_text`/`address_text`/`select_payment_text`. «Cart», «Select time», «Success», «Error» — нет соответствующих маркеров, оставлены хардкодом.

---

## 5. Платежи

`PROJECT_URL/payments/accounts` — аккаунт `cash` (оплата при доставке). PayPal/cash работают через `addPaymentMethod`; карточная оплата теперь активна в UI ([StepPayment](components/cart/steps/StepPayment.tsx) → [StepAddCard](components/cart/steps/StepAddCard.tsx) per `cart_add_card.html`), но завершает заказ синтетическим `card:<id>` — нужно создать `card`-payment-account и подключить реальный gateway, иначе платёж в OneEntry не пройдёт.

Дополнительно: [StepOrder](components/cart/steps/StepOrder.tsx) (per `cart_Order.html`) показывает поле «Promo Code» с кнопкой «Apply Code» — обработчик пока no-op. Уточнить:

> ❓ **Уточнить у клиента:** есть ли в OneEntry/бэкенде механизм промокодов (скидка % / фикс / free delivery)? Если да — какой API/marker и как привязывать к заказу. Пока кнопка не делает ничего и поле декоративное.

---

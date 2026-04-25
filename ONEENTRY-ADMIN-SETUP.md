# OneEntry Admin Setup — Что осталось сделать

Админка: `https://oe-restaurants.oneentry.cloud/`

Код уже подключён к существующим сущностям (`services`, `bookings`, `filters`, `menu`, `restaurants`, `blog`, `delivery_order`, `booking_order`, `user`, attribute set `dish` с `cover/weight/rating/cooking_time/price/...`, attribute set `restaurant`, attribute set `catalog_page`). Ниже — только то, чего **нет** в админке и нужно для оставшихся функциональных пробелов.

---

## 1. Permissions ✅

`PROJECT_URL/users/groups/edit-group/1` (Guests) и Users — read без ограничений для: Pages, Menus, Products, Blocks, Attributes Sets, Forms, Auth Providers, Product Statuses; create — FormsData + Orders (Users). Подтверждено клиентом — все группы выставлены, fallback `"Resource is closed"` не наблюдается.

---

## 2. Недостающие формы

### 2.1. `review` — отзыв на товар

Нужна для [components/reviews/ReviewForm.tsx](components/reviews/ReviewForm.tsx) + [app/actions/review.ts](app/actions/review.ts).

| marker              | type    | title                 |
|---------------------|---------|-----------------------|
| `review_rating`     | integer | Rating (1–5)          |
| `review_text`       | text    | Your review           |
| `review_author`     | string  | Your name             |
| `review_product_id` | integer | Product ID (hidden)   |
| `spam`              | spam    | reCAPTCHA             |

### 2.2. `contact_us` — форма поддержки

Нужна для [components/forms/ContactUsForm.tsx](components/forms/ContactUsForm.tsx) + [app/support/page.tsx](app/support/page.tsx).

| marker    | type   | title       |
|-----------|--------|-------------|
| `name`    | string | Your name   |
| `email`   | email  | Your email  |
| `message` | text   | Message     |
| `spam`    | spam   | reCAPTCHA   |

> ❓ **Уточнить у клиента:** в вёрстке [static-html/service_support.html](static-html/service_support.html) на этом экране нет формы с полями — только два блока с быстрыми контактами (WhatsApp / звонок). Что должно быть на странице поддержки: классическая форма обратной связи (текущая реализация), блок с контактами как в макете, или оба варианта? Пока оставляем форму, ждём решение.

---

## 3. Недостающие страницы

### 3.1. `support`

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

### 3.2. Недостающие дочерние категории под `menu`

В админке есть: `salads/kids_menu/desserts/cold_beverages/first_courses/snacks/pizza/hot_beverages/main_courses`.

В верстке упоминаются также: `breakfast`, `lunch`, `dinner`, `fish`, `meat`, `hot_meals`, `soup`, `appetizers`, `fresh_juice`. Добавить child-pages у `menu` по мере необходимости — без них секции главной падают в fallback (`getProducts` возвращает все товары).

### 3.3. Дочерние страницы под `blog` (акции)

В админке только `birthday_offer`. В верстке также нужны: `business_lunch`, `deal_of_the_day`, `kids_menu`, `happy_monday`, `dinner_fix_price` — создать child-pages под `blog` с attribute set `blog_page`:

| marker          | type   | title         |
|-----------------|--------|---------------|
| `promo_image`   | image  | Promo image   |
| `promo_title`   | string | Title         |
| `promo_subtitle`| string | Subtitle      |
| `promo_cta`     | string | CTA label     |

---

## 4. Платежи

`PROJECT_URL/payments/accounts` — аккаунт `cash` (оплата при доставке). Карточная оплата отключена в UI, отдельный `card`-аккаунт пока не нужен.

---

## 5. Локализация (опционально)

Если нужен `fr_FR` — добавить локаль в `PROJECT_URL/locales` и заполнить `localizeInfos.fr_FR.*` на сущностях. Маршрутизация `[locale]` в Next.js пока не реализована — включать по мере надобности.

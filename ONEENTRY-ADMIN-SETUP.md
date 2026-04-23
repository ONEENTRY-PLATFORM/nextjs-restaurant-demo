# OneEntry Admin Setup Checklist

Список всего, что нужно создать и настроить в OneEntry admin panel, чтобы функционал, реализованный в коде (Stages A–F + новая верстка), начал работать. Без этих настроек API возвращает `"Resource is closed"` и CMS-зависимые фичи отдают graceful fallback (логи в консоли + пустой рендер).

Админ-панель: `https://oe-restaurants.oneentry.cloud/`

> **Про семантику:** проект создавался на базе шаблона для салонов, но это ресторан. Везде, где в коде встречается термин `salon`/`master` — это наследие шаблона; актуальная семантика — `restaurant`/`branch`.

---

## 0. Permissions (базовое — СНАЧАЛА)

`PROJECT_URL/users/groups/edit-group/1?tab` (группа **Guests**) — и то же самое для группы **Users**, если будет авторизация:

| Сущность       | Read                               | Create        |
|----------------|------------------------------------|---------------|
| Pages          | ✅ без ограничений                 | —             |
| Menus          | ✅ без ограничений                 | —             |
| Products       | ✅ без ограничений                 | —             |
| Blocks         | ✅ без ограничений                 | —             |
| Attributes Sets| ✅ без ограничений                 | —             |
| Forms          | ✅ без ограничений                 | —             |
| FormsData      | —                                  | ✅ разрешить   |
| Orders         | ✅ без ограничений (Users)         | ✅ (Users)     |
| Product Statuses | ✅ без ограничений               | —             |
| Auth Providers | ✅ без ограничений                 | —             |

Без этого **весь сайт** будет работать в fallback-режиме (пустые блоки + warnings).

---

## 1. Service entry-point (`/service`)

Главная точка входа: Logo + 2 CTA → доставка vs бронь столика (верстка: `service.html`).

### 1.1. Страница `service`

- **pageUrl**: `service`
- **templateIdentifier**: любой
- **localizeInfos.title**: `Restaurant — Delivery & Reservation`
- Attributes:
  - `service_logo` (image) — логотип на экране выбора
  - `service_bg_image` (image) — фон-картинка (иначе фолбэк `/img/picture/bg_service.png`)
  - `service_primary_cta` (string) — текст главной кнопки (по умолчанию `FOOD DELIVERY`)
  - `service_primary_href` (string) — куда ведёт (по умолчанию `/shop`)
  - `service_secondary_cta` (string) — текст второй кнопки (по умолчанию `BOOK A TABLE`)
  - `service_secondary_href` (string) — по умолчанию `/reservation`

**Где используется**: [app/service/page.tsx](app/service/page.tsx).

---

## 2. Reservation (бронь столиков) + рестораны-филиалы

Источник верстки: `service_table.html`, `about_reservation.html`.

### 2.1. Родительская страница `restaurants`

- **pageUrl**: `restaurants` (родитель филиалов)
- **localizeInfos.title**: `Our restaurants`

### 2.2. Дочерние страницы (филиалы)

Создать child pages у `restaurants` — каждая представляет отдельный ресторан. Пример из верстки:

| pageUrl         | Attribute values                                                |
|-----------------|-----------------------------------------------------------------|
| `london_str40`  | `restaurant_address: "London, ONEENTRY. str, 40"`, `restaurant_phone: "+44..."` |
| `london_str30`  | `restaurant_address: "London, ONEENTRY. str, 30"`, ...          |
| `london_str20`  | `restaurant_address: "London, ONEENTRY. str, 20"`, ...          |
| `london_str10`  | `restaurant_address: "London, ONEENTRY. str, 10"`, ...          |

Attribute set для филиалов:

| marker                  | type   | Назначение                                  |
|-------------------------|--------|---------------------------------------------|
| `restaurant_address`    | string | Адрес филиала (показывается в dropdown'е)   |
| `restaurant_phone`      | string | Телефон филиала                             |
| `restaurant_hours`      | string | Часы работы (опционально)                   |
| `restaurant_bg_image`   | image  | Фото/баннер филиала                         |

**Где используется**: [app/reservation/page.tsx](app/reservation/page.tsx) (dropdown) и компонент [RestaurantSelect.tsx](components/reservation/RestaurantSelect.tsx).

### 2.3. Страница `reservation`

- **pageUrl**: `reservation`
- **localizeInfos.title**: `Book a table`
- Attributes:
  - `reservation_title` (string) — заголовок hero
  - `reservation_description` (text) — описание (htmlValue + plainValue)
  - `reservation_hero_image` (image) — баннер
  - `reservation_submit_text` (string) — текст кнопки (по умолчанию `Book`)

### 2.4. Форма `reservation`

`PROJECT_URL/forms` → Add form:

- **identifier**: `reservation`
- **localizeInfos.title**: `Reservation`

Поля (маркеры важны — компонент `ReservationForm` размещает их в 2-column grid по этим маркерам):

| position | marker                     | type    | title (localizeInfos)  | Примечание                   |
|----------|----------------------------|---------|------------------------|------------------------------|
| 1        | `reservation_restaurant`   | string  | Restaurant             | dropdown заполняется из §2.2 |
| 2        | `reservation_name`         | string  | Your name              | uppercase input              |
| 3        | `reservation_surname`      | string  | Surname                | uppercase input              |
| 4        | `reservation_phone`        | string  | Phone                  | → `<input type="tel">`       |
| 5        | `guests_count`             | integer | How many people        |                              |
| 6        | `reservation_date`         | date    | Select date            | → `<input type="date">`      |
| 7        | `reservation_time`         | string  | What time              |                              |
| 8        | `reservation_notes`        | text    | Preferences            | textarea, full width         |
| 9        | `spam`                     | spam    | —                      | reCAPTCHA v3 Enterprise      |

**Где используется**: [components/reservation/ReservationForm.tsx](components/reservation/ReservationForm.tsx), [app/actions/reservation.ts](app/actions/reservation.ts).

---

## 3. Promo / Blog (акции)

Источник верстки: `index.html` (promo-баннер), `pk_promo_BIRTHDAY.html`, `pk_promo_day.html`.

### 3.1. Родительская страница `blog`

- **pageUrl**: `blog`
- **localizeInfos.title**: `Actions` / `Акции`

### 3.2. Дочерние страницы (акции)

Из верстки:

| pageUrl             | Заголовок               | Картинка из `static-html/img/promo/` |
|---------------------|-------------------------|--------------------------------------|
| `birthday`          | Happy Birthday          | `Happy Birthday.png`                 |
| `business_lunch`    | Business Lunch          | `Business Lunch.png`                 |
| `deal_of_the_day`   | Deal of the Day         | `Deal of the Day.png`                |
| `kids_menu`         | Kids Menu               | `Kids_menu.png`                      |
| `happy_monday`      | Happy Monday            | `Happy_monday.png`                   |
| `dinner_fix_price`  | Dinner Fix Price        | `Dinner_Fix_price.png`               |

### 3.3. Attribute set

| marker             | type   | Назначение                                  |
|--------------------|--------|---------------------------------------------|
| `promo_image`      | image  | Основная картинка баннера                   |
| `promo_title`      | string | Заголовок                                   |
| `promo_subtitle`   | text   | Описание                                    |
| `promo_cta`        | string | Текст кнопки (дефолт `"Order now"`)         |
| `promo_color`      | string | Опционально, HEX акцентного цвета           |

**Где используется**: [components/promo/PromoCard.tsx](components/promo/PromoCard.tsx), [app/promo/[handle]/page.tsx](app/promo/%5Bhandle%5D/page.tsx).

---

## 4. Reviews (отзывы / рейтинги)

Источник верстки: `about_reviews.html` (fixed-bottom slide-up панель).

### 4.1. Форма `review`

| position | marker              | type    | title                 |
|----------|---------------------|---------|-----------------------|
| 1        | `review_rating`     | integer | Rating (1–5)          |
| 2        | `review_text`       | text    | Your review           |
| 3        | `review_author`     | string  | Your name             |
| 4        | `review_product_id` | integer | Product ID (hidden)   |
| 5        | `spam`              | spam    | —                     |

### 4.2. Блок `reviews_carousel` (опционально)

Для карусели отзывов на главной: identifier `reviews_carousel`, привязать к `home_web`.

**Где используется**: [components/reviews/StarRating.tsx](components/reviews/StarRating.tsx), [components/reviews/ReviewForm.tsx](components/reviews/ReviewForm.tsx), [components/reviews/ReviewsSlideUpPanel.tsx](components/reviews/ReviewsSlideUpPanel.tsx), [app/actions/review.ts](app/actions/review.ts).

---

## 5. Cart multi-step wizard

Источник верстки: `cart.html`, `cart_Order.html`, `cart_time.html`, `cart_Sign_in.html`, `cart_Verification.html`, `cart_add_card.html`, `cart_PAYMENT.html`, `cart_PAYMENT_masseges.html`, `cart_error_masseges.html`.

### 5.1. Order storage `orders`

`PROJECT_URL/orders/storage` → создать storage object с маркером `orders`.

### 5.2. Order form (уже используется в `/api`-слое)

Форма `order` с полями:

| marker          | type    | Примечание                                |
|-----------------|---------|-------------------------------------------|
| `order_address` | string  | Адрес доставки (step `address`)           |
| `date`          | date    | Дата доставки (step `time`)               |
| `time`          | string  | Время доставки (step `time`)              |
| `phone`         | string  | Телефон (опц.)                            |

### 5.3. Payment methods

`PROJECT_URL/payments/accounts` — создать два аккаунта:
- identifier `cash` (оплата при доставке)
- identifier `card` (карта — для step `add_card`)

Код [StepPayment.tsx](components/cart/steps/StepPayment.tsx) пока хардкодит эти 2 метода; после настройки можно подтянуть через `api.Payments.getAccounts()`.

**Где используется**: [components/cart/CartWizard.tsx](components/cart/CartWizard.tsx) и все `components/cart/steps/*`.

---

## 6. Profile / Support

### 6.1. Страница `profile`

- **pageUrl**: `profile` — используется в `app/[handle]/page.tsx` switch + отдельный роут `/profile`.

### 6.2. Страница `support`

- **pageUrl**: `support`
- **localizeInfos.title**: `Support`
- Attributes:
  - `support_title` (string)
  - `support_description` (text)
  - `support_phone` (string) — для `tel:` ссылки
  - `support_whatsapp_url` (string) — deep-link `https://wa.me/...`
  - `support_email` (string) — для `mailto:` ссылки

### 6.3. Форма `contact_us` (уже существует)

Используется в [ContactUsForm.tsx](components/forms/ContactUsForm.tsx) + [app/support/page.tsx](app/support/page.tsx).

---

## 7. Базовый каталог / навигация

### 7.1. Меню (markers)

| marker      | Где используется                                 |
|-------------|--------------------------------------------------|
| `user_menu` | [NavGroup.tsx](components/layout/header/nav/NavGroup.tsx) (desktop header) |
| `bottom_web`| [bottom-menu/index.tsx](components/layout/bottom-menu/index.tsx) (mobile bottom nav) |

### 7.2. Главная страница

- **pageUrl**: `home_web`
- Блок `recommended_web` (для секции "Recommended")
- Блок `promo_grid` (для сетки акций — опционально; компонент и так фетчит `blog/*`)
- Блок `reviews_carousel` (для карусели отзывов — опционально)

### 7.3. Категории меню

Дочерние страницы у родителя `menu` (используется в `getChildPagesByParentUrl('menu')`). Из верстки — горизонтальный список категорий (`#menuItems`):

- `breakfast`
- `lunch`
- `dinner`
- `dessert`
- `main_course`
- `fish`
- `pizza`
- `meat`
- `beverages`
- `hot_meals`
- `first_courses` / `soup`
- `salads`
- `appetizers`
- `fresh_juice`

Иконки для категорий — `static-html/img/icons/*.svg` (appetizers, dessert, fresh_juice, hot_beverages, kids_menu, main_courses, salads, snackes, first_courses). Можно хранить в attribute `category_icon` (image) на каждой странице категории.

---

## 8. Per-page фоны (опционально)

Верстка использует разные фоны на страницах (`bg_service.png`, `bg_cart.png`, `bg-mobile.png`, `about_bg.png`). Уже скопированы в `public/img/picture/`. Если хочешь управлять через CMS:

- Добавить attribute `page_bg_image` (image) на attribute set базовых страниц.
- В коде страниц читать `page.attributeValues.page_bg_image.value` и проставлять `style={{backgroundImage: url}}` (уже так сделано в `/service`).

---

## 9. Локализация (опционально)

В проекте декларированы `en_US` и `fr_FR` (`app/types/enum.ts`). Чтобы `fr_FR` работал:

1. `PROJECT_URL/locales` → добавить `fr_FR`.
2. Для каждой сущности добавить `localizeInfos.fr_FR.title` и т.д.
3. В коде — прокинуть `locale` через Next.js params (`[locale]` routing пока не реализован).

---

## Порядок настройки (рекомендация)

1. **Permissions** (§0) — сразу, иначе ничего не заработает.
2. Проверить базу (§7) — главная + меню + категории.
3. **Service entry** (§1) — 1 страница, мгновенно видно `/service`.
4. **Promo** (§3) — parent `blog` + 6 акций → главная страница получит promo-сетку.
5. **Reservation** (§2) — parent `restaurants` + филиалы + страница `reservation` + форма → `/reservation` оживёт.
6. **Reviews** (§4) — форма `review` → заработают `ReviewForm` + `ReviewsSlideUpPanel`.
7. **Cart wizard** (§5) — order storage + формa order + payment accounts → `/cart` станет полным wizard'ом.
8. **Profile/Support** (§6) — страница support + order storage → `/profile/*` и `/support`.

---

## Deprecated / removed (от старого шаблона)

- ~~Parent `salons`~~ → заменён на `restaurants` (§2.1)
- ~~Attributes `salon_address/salon_phone/salon_phone_formatted`~~ → заменены на `restaurant_address/restaurant_phone/restaurant_hours`
- ~~Компонент `SalonsGrid.tsx`~~ → удалён (был dead code, не импортировался)
- Упоминания `master` / `masters` в коде (`CartSlice.servicesData.master`, `ProductRow.tsx`) — реликты шаблона, при наличии времени можно почистить, но они не ломают функционал.

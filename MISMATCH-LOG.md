# MISMATCH-LOG — расхождения вёрстки и пробелы в OneEntry

Единый журнал, объединяющий:

- **Раздел B** — ручная сверка вёрстки `static-html/` ↔ Next.js (что чинится правкой кода в этом репо).
- **Раздел C** — пробелы в данных OneEntry (что нужно завести в админке `https://oe-restaurants.oneentry.cloud/`).

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
| C. OneEntry Admin Setup | см. ниже | — | — | — | — |

---

### A.4. Arbitrary px-значения `[Npx]` (правило 3.1.1 — переводить в шкалу)

**Severity: P2.** Остаток: **64 вхождения в 39 файлах**. Большинство — одноразовые значения, которые по §3.1.1 допускается оставлять `[...]`. Топ остатков:

| Файл | Кол-во |
|---|---|
| [components/layout/product/product-single/ProductDetails.tsx](components/layout/product/product-single/ProductDetails.tsx) | 6 |
| [components/reviews/ProductReviewsList.tsx](components/reviews/ProductReviewsList.tsx) | 5 |
| [components/cart/steps/StepResult.tsx](components/cart/steps/StepResult.tsx) | 5 |
| [app/support/page.tsx](app/support/page.tsx) | 4 |
| [components/support/SupportPopup.tsx](components/support/SupportPopup.tsx) | 3 |
| [components/layout/filter/FilterBottom.tsx](components/layout/filter/FilterBottom.tsx) | 3 |

> Действие: следить за §3.1.1 — если какое-то arbitrary-значение начнёт встречаться в 3+ местах (`text-[18px]`, `text-[17px]`, `[8px]`), добавить токен.

---

## Раздел B. Ручная сверка по экранам

### B.1. Главная (`static-html/index.html` ↔ `app/page.tsx` + components)

- 🌐 Live: <http://localhost:3000/>
- 📄 Static: [static-html/index.html](static-html/index.html) · <file:///d:/OneEntry/nextjs-restaurant/static-html/index.html>
- 📁 Файлы проекта:
[app/page.tsx](app/page.tsx)
[components/home/HomePromo.tsx](components/home/HomePromo.tsx)
[components/home/CategoriesSection.tsx](components/home/CategoriesSection.tsx)
[components/home/HomeCategoriesSection.tsx](components/home/HomeCategoriesSection.tsx)
[components/layout/header/index.tsx](components/layout/header/index.tsx)

### B.2. Карточка товара (`pk_product_details.html` ↔ `app/shop/product/[handle]`)

- 🌐 Live: <http://localhost:3000/shop/product/13> _(заменить `13` на любой реальный product id, например через `/shop`)_
- 📄 Static: [static-html/pk_product_details.html](static-html/pk_product_details.html) · <file:///d:/OneEntry/nextjs-restaurant/static-html/pk_product_details.html>
- 📁 Файлы проекта:
[app/shop/product/[handle]/page.tsx](app/shop/product/[handle]/page.tsx)
[components/layout/product/index.tsx](components/layout/product/index.tsx)
[components/layout/product/product-single/ProductDetails.tsx](components/layout/product/product-single/ProductDetails.tsx)
[components/layout/product/product-single/ProductCover.tsx](components/layout/product/product-single/ProductCover.tsx)
[components/layout/product/components/AddToCartButton.tsx](components/layout/product/components/AddToCartButton.tsx)

### B.3. Каталог / категория (`index_category.html` ↔ `app/shop/...`)

- 🌐 Live: <http://localhost:3000/shop> · <http://localhost:3000/shop/category/dinner> _(подставить реальный category handle)_
- 📄 Static: [static-html/index_category.html](static-html/index_category.html) · <file:///d:/OneEntry/nextjs-restaurant/static-html/index_category.html>
- 📁 Файлы проекта:
[app/shop/page.tsx](app/shop/page.tsx)
[app/shop/category/[handle]/page.tsx](app/shop/category/[handle]/page.tsx)
[components/layout/filter/CategoryFilter.tsx](components/layout/filter/CategoryFilter.tsx)
[components/layout/filter/FilterModal.tsx](components/layout/filter/FilterModal.tsx)
[components/layout/products-grid/components/product-card/ProductCard.tsx](components/layout/products-grid/components/product-card/ProductCard.tsx)

### B.4. Корзина и чекаут (`cart_*.html` / `pk_cart.html` ↔ `components/cart/CartWizard.tsx` + steps)

- 🌐 Live: <http://localhost:3000/cart>
- 📄 Static (по шагам визарда):
  - cart: [pk_cart.html](static-html/pk_cart.html) · <file:///d:/OneEntry/nextjs-restaurant/static-html/pk_cart.html> · mobile [cart_cart.html](static-html/cart_cart.html) · <file:///d:/OneEntry/nextjs-restaurant/static-html/cart_cart.html>
  - time: [cart_time.html](static-html/cart_time.html) · <file:///d:/OneEntry/nextjs-restaurant/static-html/cart_time.html>
  - signin: [pk_login.html](static-html/pk_login.html) · <file:///d:/OneEntry/nextjs-restaurant/static-html/pk_login.html> · [cart_login.html](static-html/cart_login.html) · <file:///d:/OneEntry/nextjs-restaurant/static-html/cart_login.html>
  - verification: [pk_verif.html](static-html/pk_verif.html) · <file:///d:/OneEntry/nextjs-restaurant/static-html/pk_verif.html> · [cart_Verification.html](static-html/cart_Verification.html) · <file:///d:/OneEntry/nextjs-restaurant/static-html/cart_Verification.html>
  - order: [pk_order.html](static-html/pk_order.html) · <file:///d:/OneEntry/nextjs-restaurant/static-html/pk_order.html> · [cart_Order.html](static-html/cart_Order.html) · <file:///d:/OneEntry/nextjs-restaurant/static-html/cart_Order.html>
  - payment: [cart_PAYMENT.html](static-html/cart_PAYMENT.html) · <file:///d:/OneEntry/nextjs-restaurant/static-html/cart_PAYMENT.html>
  - error: [cart_error_masseges.html](static-html/cart_error_masseges.html) · <file:///d:/OneEntry/nextjs-restaurant/static-html/cart_error_masseges.html>
- 📁 Файлы проекта:
[app/cart/page.tsx](app/cart/page.tsx)
[components/cart/CartWizard.tsx](components/cart/CartWizard.tsx)
[components/cart/steps/StepOrder.tsx](components/cart/steps/StepOrder.tsx)
[components/cart/steps/StepPayment.tsx](components/cart/steps/StepPayment.tsx)
[components/cart/steps/StepResult.tsx](components/cart/steps/StepResult.tsx)
- Auth-шаги (sign-in / verification) рендерятся через канонический [Modal](components/layout/modal/index.tsx) + [AuthProviderSelect](components/forms/AuthProviderSelect.tsx) — отдельных wizard-шагов больше нет.

### B.5. Профиль и попапы (`m_profile.html`, `pk_active_orders.html` ↔ `app/profile/*`, `components/profile/*`)

- 🌐 Live: <http://localhost:3000/profile> · <http://localhost:3000/profile/orders> · <http://localhost:3000/profile/favorites> · <http://localhost:3000/profile/bookings>
- 📄 Static:
  - personal/profile: [m_profile.html](static-html/m_profile.html) · <file:///d:/OneEntry/nextjs-restaurant/static-html/m_profile.html> · [mob_about_profile.html](static-html/mob_about_profile.html) · <file:///d:/OneEntry/nextjs-restaurant/static-html/mob_about_profile.html>
  - active orders: [pk_active_orders.html](static-html/pk_active_orders.html) · <file:///d:/OneEntry/nextjs-restaurant/static-html/pk_active_orders.html> · [details_active_orders.html](static-html/details_active_orders.html) · <file:///d:/OneEntry/nextjs-restaurant/static-html/details_active_orders.html>
  - favorites: [m_favorites.html](static-html/m_favorites.html) · <file:///d:/OneEntry/nextjs-restaurant/static-html/m_favorites.html> · [pk_favorites.html](static-html/pk_favorites.html) · <file:///d:/OneEntry/nextjs-restaurant/static-html/pk_favorites.html>
  - reviews drawer: [m_rewiews.html](static-html/m_rewiews.html) · <file:///d:/OneEntry/nextjs-restaurant/static-html/m_rewiews.html>
  - profile details popup: [mob_about.html](static-html/mob_about.html) · <file:///d:/OneEntry/nextjs-restaurant/static-html/mob_about.html>
- 📁 Файлы проекта:
[app/profile/layout.tsx](app/profile/layout.tsx)
[app/profile/page.tsx](app/profile/page.tsx)
[app/profile/orders/page.tsx](app/profile/orders/page.tsx)
[app/profile/favorites/page.tsx](app/profile/favorites/page.tsx)
[components/profile/ProfileTabs.tsx](components/profile/ProfileTabs.tsx)
[components/profile/ProfilePopup.tsx](components/profile/ProfilePopup.tsx)
[components/profile/FavoritesPopup.tsx](components/profile/FavoritesPopup.tsx)
[components/profile/FavoritesGrid.tsx](components/profile/FavoritesGrid.tsx)
[components/profile/OrdersList.tsx](components/profile/OrdersList.tsx)

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

#### B.7b. SupportPage (`service_support.html`)

- 🌐 Live: <http://localhost:3000/support>
- 📄 Static:
  [service_support.html](static-html/service_support.html)
  <file:///d:/OneEntry/nextjs-restaurant/static-html/service_support.html>
  [m_support.html](static-html/m_support.html)
  <file:///d:/OneEntry/nextjs-restaurant/static-html/m_support.html>

- 📁 Файлы проекта:
  [app/support/page.tsx](app/support/page.tsx)
  [components/forms/ContactUsForm.tsx](components/forms/ContactUsForm.tsx)

| # | Что не так | Файл | Severity |
|---|---|---|---|
| B.7.5 | Остался `md:text-[32px]` на h1 (одноразовое значение — оставить `[...]` по §3.1.1, либо завести `--text-display` если повторится в 3+ местах). | [app/support/page.tsx:39](app/support/page.tsx#L39) | P3 |

### B.8. Промо (`pk_promo_BIRTHDAY.html`, `pk_promo_day.html` ↔ `app/promo/[handle]`)

- 🌐 Live: <http://localhost:3000/promo/birthday_offer> · <http://localhost:3000/promo/deal_of_the_day> · <http://localhost:3000/promo/business_lunch> _(заполненные blog-страницы из админки)_
- 📄 Static:
  - birthday: [pk_promo_BIRTHDAY.html](static-html/pk_promo_BIRTHDAY.html) · <file:///d:/OneEntry/nextjs-restaurant/static-html/pk_promo_BIRTHDAY.html>
  - day: [pk_promo_day.html](static-html/pk_promo_day.html) · <file:///d:/OneEntry/nextjs-restaurant/static-html/pk_promo_day.html>
- 📁 Файлы проекта: [app/promo/[handle]/page.tsx](app/promo/[handle]/page.tsx) · [components/promo/PromoCard.tsx](components/promo/PromoCard.tsx)

---

## Раздел C. OneEntry Admin Setup — что осталось завести в админке

Админка: `https://oe-restaurants.oneentry.cloud/`

Код уже подключён к существующим сущностям (`services`, `bookings`, `filters`, `menu`, `restaurants`, `blog`, `delivery_order`, `booking_order`, `user`, attribute set `dish` с `cover/weight/rating/cooking_time/price/...`, attribute set `restaurant`, attribute set `catalog_page`). Ниже — только то, чего **нет** в админке и нужно для оставшихся функциональных пробелов.

### C.2. Недостающие страницы

#### C.2.3. Дочерние страницы под `blog` (акции)

В админке: `birthday_offer`, `business_lunch`, `deal_of_the_day`. В вёрстке также упоминаются `kids_menu`, `happy_monday`, `dinner_fix_price` — создать недостающие child-pages под `blog`. Реальный attribute set `blog_page` (по результату [inspect-api](.claude/temp/inspect-blog.mjs)):

| marker          | type  | title          |
|-----------------|-------|----------------|
| `bg_image`      | image | Desktop banner |
| `banner`        | image | Mobile banner  |
| `description`   | text  | Description    |
| `action_type`   | list  | Action type    |

- `bg_image` — десктоп-баннер на `/` ([getBlogBanners](app/api/server/pages/getBlogBanners.ts)) и hero на `/promo/[handle]`.
- `banner` — мобильный/портретный баннер: горизонтальный скролл на `/`, сайдбар на `/cart` и `/profile/orders`, нижний блок «соседних промо» на `/promo/[handle]` (другие дочерние `blog`, исключая текущий handle, первые два с непустым `banner`), а также fallback для hero на детальной странице, если `bg_image` пуст.
- `description` — markdown/HTML текст под заголовком (используется в `[handle]/page.tsx` через `htmlValue`).
- `action_type` — list-атрибут; на `/promo/[handle]` больше не используется (CTA-кнопка удалена в соответствии с Figma `АКЦИЯ_DEAL OF THA DAY` / `static-html/pk_promo_day.html`). Если останется нужным для карточек — пересмотреть применение.

Заголовок (title) идёт из `localizeInfos.title` страницы — отдельного `title`/`promo_title` атрибута в `blog_page` нет.

Состояние данных (на момент проверки):

| pageUrl                 | bg_image | banner | description | action_type |
|-------------------------|----------|--------|-------------|-------------|
| `birthday_offer`        | ✅       | ✅     | ✅          | ❌ пусто    |
| `business_lunch`        | ✅       | ✅     | ✅          | ❌ пусто    |
| `deal_of_the_day`       | ✅       | ✅     | ✅          | ❌ пусто    |

наполнить `action_type` (list-options) для CTA-кнопок в карточках и на детальной странице.

Десктоп-баннер берётся через [getBlogBanners](app/api/server/pages/getBlogBanners.ts) (`bg_image`), мобильный — через тот же fetcher (`banner`). Пока у дочерних страниц `blog` нет `bg_image` — десктопный hero на `/` не покажется (graceful fallback), а сайдбар `/cart` / `/profile/orders` будет пустым.

### C.3. Похожие товары (related products)

Страница [app/shop/product/[handle]/page.tsx](app/shop/product/[handle]/page.tsx) рендерит секцию «Featured objects» через [components/layout/product/RelatedItems.tsx](components/layout/product/RelatedItems.tsx) → SDK `Products.getRelatedProductsById`. Чтобы секция реально что-то показывала:

- В админке для каждого блюда открыть карточку товара и привязать минимум 4–6 «похожих» через стандартный механизм OneEntry «Related products». Без этого `getRelatedProductsById` возвращает пустой список и секция не рендерится (graceful fallback).
- (Опционально) Заголовок секции — берётся из `static_content.featured_objects` (string), fallback `"Featured objects"`. Если хочется локализованный заголовок — добавить атрибут:

  | marker              | type   | title             |
  |---------------------|--------|-------------------|
  | `featured_objects`  | string | Featured objects  |

### C.4. Словарь `static_content` — что осталось

Словарь подгружается через [app/dictionaries.ts](app/dictionaries.ts) (атрибут-сет `static_content`, нормализован в `Record<marker, attr>`, `value` = `initialValue` если локализация не заполнена). В админке уже **77 маркеров**.

#### C.4.1. Завести новые маркеры в админке (атрибут-сет `static_content`)

Все ниже — `type: string`. Сгруппировано по экранам, чтобы заполнять было удобнее. `title` в таблице ниже — это и текст, который виден в админке как title маркера, и его `initialValue` (английский дефолт). После создания — прокинуть `dict?.<marker>?.value` в соответствующие компоненты (правка кода).

##### Reservation booking — auth + payment + success step

Новые маркеры для мульти-шагового флоу бронирования (Figma 120:1875 + 120:2338, плюс auth-шаг для незалогиненных). Используется в [components/reservation/ReservationAuthStep.tsx](components/reservation/ReservationAuthStep.tsx), [components/reservation/ReservationPaymentStep.tsx](components/reservation/ReservationPaymentStep.tsx) и [components/reservation/ReservationSuccess.tsx](components/reservation/ReservationSuccess.tsx). Сейчас все ключи рендерятся через `useT(key, fallback)` — пока не созданы в админке, UI отдаст английский fallback.

| marker                      | type   | title                                                       |
|-----------------------------|--------|-------------------------------------------------------------|
| `continue_text`             | string | Continue                                                    |
| `back_text`                 | string | Back                                                        |
| `apply_text`                | string | Apply                                                       |
| `loading_text`              | string | Loading…                                                    |
| `booking_deposit_text`      | string | 30% deposit is required to confirm your booking             |
| `booking_pay_with`          | string | Pay with                                                    |
| `booking_credit_cards`      | string | Credit & Debit Cards                                        |
| `no_payment_methods`        | string | No payment methods are configured. Please contact support.  |
| `booking_confirmed_message` | string | Your reservation has been confirmed.\nSee you soon!         |
| `booking_signin_prompt`     | string | Please sign in to confirm your booking.                     |
| `email_label`               | string | Email                                                       |
| `password_label`            | string | Password                                                    |
| `signed_in_toast`           | string | You signed in!                                              |

##### ProfileTabs — вкладки попапа профиля

Используется в: [components/profile/ProfileTabs.tsx](components/profile/ProfileTabs.tsx).

| marker          | type   | title     |
|-----------------|--------|-----------|
| `personal_tab`  | string | Personal  |
| `orders_tab`    | string | Orders    |
| `favorites_tab` | string | Favorites |

##### StepPayment — дополнительные фразы

Используется в: [components/cart/steps/StepPayment.tsx](components/cart/steps/StepPayment.tsx).

| marker                    | type   | title                                                         |
|---------------------------|--------|---------------------------------------------------------------|
| `loading_payment_text`    | string | Loading payment methods…                                      |
| `no_payment_methods_text` | string | No payment methods are configured. Please contact support.    |
| `processing_text`         | string | Processing...                                                 |
| `apply_coupon_button`     | string | APPLY                                                         |
| `pay_with_label`          | string | Pay with                                                      |
| `credit_debit_label`      | string | Credit & Debit Cards                                          |
| `phone_placeholder`       | string | phone number                                                  |

##### CartWizard — пропущенный шаг «Order»

Используется в: [components/cart/CartWizard.tsx](components/cart/CartWizard.tsx) (STEP_TITLES, шаг перед Payment).

| marker            | type   | title |
|-------------------|--------|-------|
| `order_step_text` | string | Order |

##### ReservationForm — лейбл «Preferences»

Используется в: [components/reservation/ReservationForm.tsx](components/reservation/ReservationForm.tsx) (fallback-лейбл поля гостевых предпочтений).

| marker               | type   | title       |
|----------------------|--------|-------------|
| `preferences_label`  | string | Preferences |

##### FilterBottom — префиксы инпутов цены

Используется в: [components/layout/filter/FilterBottom.tsx](components/layout/filter/FilterBottom.tsx) (префикс-лейблы рядом с инпутами min/max цены в фильтре).

| marker             | type   | title |
|--------------------|--------|-------|
| `price_from_text`  | string | from  |
| `price_under_text` | string | Under |

##### ProductDetails — fallback при пустом рейтинге

Используется в: [components/layout/product/product-single/ProductDetails.tsx](components/layout/product/product-single/ProductDetails.tsx). Рейтинг товара читается из top-level `product.rating.value` (SDK тип `IRating`), а не из `attributeValues.rating` (это рудимент). Если `rating.value` отсутствует — в строке метрик вместо «звезда + число» рендерится текст ниже.

| marker               | type   | title                  |
|----------------------|--------|------------------------|
| `rating_not_formed`  | string | Rating not yet formed  |

##### Хедер / навигация / общие (aria-label, кнопки)

Прошлись по проекту, нашли хардкод user-facing-фраз, не покрытых выше. Часть — `aria-label` для иконочных кнопок (важно для скринридеров), часть — короткие лейблы и тосты, видимые в UI.

Используется в: [components/layout/header/](components/layout/header/), [components/layout/bottom-menu/](components/layout/bottom-menu/), [components/layout/filter/](components/layout/filter/), [components/layout/mobile-menu/](components/layout/mobile-menu/), [components/layout/modal/](components/layout/modal/), [components/cart/CartPopup.tsx](components/cart/CartPopup.tsx), [components/shared/ClosePopupButton.tsx](components/shared/ClosePopupButton.tsx).

| marker                        | type   | title                                 |
|-------------------------------|--------|---------------------------------------|
| `open_menu_label`             | string | Open menu                             |
| `close_menu_label`            | string | Close menu                            |
| `open_cart_label`             | string | Open cart                             |
| `close_cart_label`            | string | Close cart                            |
| `open_categories_label`       | string | Open categories                       |
| `close_search_results_label`  | string | Close search results                  |
| `close_label`                 | string | Close                                 |
| `go_back_label`               | string | Go back                               |
| `decrease_quantity_label`     | string | Decrease quantity                     |
| `increase_quantity_label`     | string | Increase quantity                     |
| `delete_item_label`           | string | Delete item                           |
| `add_to_favorites_label`      | string | Add to favorites                      |
| `remove_from_favorites_label` | string | Remove from favorites                 |
| `cart_label`                  | string | Cart                                  |
| `favorites_label`             | string | Favorites                             |
| `profile_label`               | string | Profile                               |
| `home_label`                  | string | Home                                  |
| `menu_label`                  | string | Menu                                  |
| `search_placeholder_text`     | string | Search                                |
| `view_all_text`               | string | View all ({count})                    |
| `return_home_button`          | string | Return home                           |
| `captcha_loading_text`        | string | Please wait while captcha is loading. |
| `rating_prefix`               | string | Rating:                               |

Места, где эти маркеры встретились:

- [FilterButton.tsx:27](components/layout/filter/FilterButton.tsx#L27) — `Open filters` (уже учтён выше как `open_filters_button`).
- [CategoryButton.tsx](components/layout/header/CategoryButton.tsx) — `Open categories` → `open_categories_label`.
- [CloseSearch.tsx](components/layout/header/search/CloseSearch.tsx) — `Close search results` → `close_search_results_label`.
- [layout/mobile-menu/components/CloseModal.tsx](components/layout/mobile-menu/components/CloseModal.tsx), [layout/modal/components/CloseModal.tsx](components/layout/modal/components/CloseModal.tsx), [shared/ClosePopupButton.tsx](components/shared/ClosePopupButton.tsx), [bottom-menu/components/CenterCloseButton.tsx](components/layout/bottom-menu/components/CenterCloseButton.tsx) — `Close` / `close menu` → `close_label` / `close_menu_label`.
- [bottom-menu/components/CenterCartButton.tsx](components/layout/bottom-menu/components/CenterCartButton.tsx), [cart/CartPopup.tsx](components/cart/CartPopup.tsx) — `Open cart` / `Close cart` → `open_cart_label` / `close_cart_label`.
- [filter/components/header/HistoryBack.tsx](components/layout/filter/components/header/HistoryBack.tsx) — `Go back` → `go_back_label`.
- [layout/product/components/DecreaseButton.tsx](components/layout/product/components/DecreaseButton.tsx), [IncreaseButton.tsx](components/layout/product/components/IncreaseButton.tsx) — `Decrease quantity` / `Increase quantity`.
- [layout/cart/components/DeleteButton.tsx](components/layout/cart/components/DeleteButton.tsx) — `Delete item`.
- [layout/product/product-single/FavoritesButton.tsx](components/layout/product/product-single/FavoritesButton.tsx), [layout/products-grid/components/product-card/HeartCardButton.tsx](components/layout/products-grid/components/product-card/HeartCardButton.tsx) — `Add to favorites` / `Remove from favorites`.
- [header/nav/NavItemCart.tsx](components/layout/header/nav/NavItemCart.tsx), [NavItemFavorites.tsx](components/layout/header/nav/NavItemFavorites.tsx), [NavItemProfile.tsx](components/layout/header/nav/NavItemProfile.tsx), [bottom-menu/components/NavItemFavorites.tsx](components/layout/bottom-menu/components/NavItemFavorites.tsx) — `Cart` / `Favorites` / `Profile` / `Sign In`.
- [header/index.tsx](components/layout/header/index.tsx) — `Search` (placeholder), `Home` (link).
- [home/CategoriesSection.tsx](components/home/CategoriesSection.tsx) — `View all (N)` → `view_all_text` с плейсхолдером `{count}`.
- [app/not-found.tsx](app/not-found.tsx) — `Return home` → `return_home_button`.
- [forms/ContactUsForm.tsx](components/forms/ContactUsForm.tsx) — `Please wait while captcha is loading.` → `captcha_loading_text`.
- [reviews/StarRating.tsx](components/reviews/StarRating.tsx) — `Rating:` → `rating_prefix`. `aria-label` `N stars` (динамический множественный) пока оставить хардкодом — без полноценной i18n с pluralization подмена через словарь даст некрасивые формы.

> **TODO (код):** placeholders для Street/House/Floor в попапе «My Profile» ([ProfilePopup.tsx:347](components/profile/ProfilePopup.tsx#L347)) сейчас хардкод (`«OneEntry»` / `«40»` / `«27»`). Подтянуть из `additionalFields` соответствующих атрибутов формы `delivery_order` (`delivery_address`, `floor`, `apartment_number`) — это канонический источник placeholder'ов и лейблов для полей форм в OneEntry. Не заводить отдельные dict-маркеры.

### C.5. Профиль — попап «My Profile» (детальный personal/payment/address)

[components/profile/ProfilePopup.tsx](components/profile/ProfilePopup.tsx) — порт верстки [static-html/details_personal.html](static-html/details_personal.html). Открывается из иконки пользователя в шапке. Сейчас:

- **Map preview** — статичный PNG. Если нужна интерактивная карта (Google Maps / Yandex / Mapbox) — задача отдельная.

Когда ответы получены — таски на код:

1. Cards: persist в выбранное хранилище + load в `useEffect` из `AuthContext.user`.
2. Addresses: persist + загружать в чекаут как `<select>` сохранённых.

### C.6. Платежи

`PROJECT_URL/payments/accounts` — `cash` (оплата при доставке) и `stripe` (карты через hosted Stripe Checkout). Оба передаются в [StepPayment](components/cart/steps/StepPayment.tsx) через `addPaymentMethod`. Отдельная форма ввода карты в приложении не нужна — Stripe собирает реквизиты на своей странице.

#### C.6.1. Форма `delivery_order` — обязательные поля

Через MCP подтверждено, что форма `delivery_order` имеет следующие атрибуты:

| marker             | type         | validator             | status |
|--------------------|--------------|-----------------------|--------|
| `delivery_address` | string       | required (strict)     | ✅     |
| `contact_phone`    | string       | required (strict)     | ✅     |
| `floor`            | string       | required (без strict) | ❌     |
| `delivery_time`    | timeInterval | —                     | ✅     |
| `comment`          | string       | —                     | ✅     |
| `apartment_number` | string       | —                     | ❌     |
| `alt_phone`        | string       | —                     | ✅     |
| `addresses`        | json         | —                     | ❌     |

Как заполняется в коде:

- `delivery_address` — [StepAddress.tsx:80](components/cart/steps/StepAddress.tsx#L80), `addData` по нажатию Continue.
- `contact_phone` — [StepAddress.tsx:84](components/cart/steps/StepAddress.tsx#L84), берём `phone` / `phone_reg` / `contact_phone` из `user.formData`.
- `comment`, `alt_phone` — [StepPayment.tsx](components/cart/steps/StepPayment.tsx) (`alt_phone` — только если включён чекбокс «another person»).
- `delivery_time` — [StepPayment.tsx](components/cart/steps/StepPayment.tsx) собирает `[[startISO, endISO]]` через `buildDeliveryTimeInterval` и шлёт `addData({ marker: 'delivery_time', type: 'timeInterval', ... })`. ASAP → start=now, end=now+45 мин; scheduled → start=parsed `DD.MM.YY HH.MM`, end=start+1 ч.
- `floor`, `apartment_number`, `addresses` — UI пока не собирает (см. C.5 про адресную книгу юзера).

**Открытые задачи:**

- `floor` — добавить поле в [StepAddress.tsx](components/cart/steps/StepAddress.tsx) рядом со street (или брать из адресной книги юзера, см. C.5). Иначе при `requiredValidator: { strict: true }` (если клиент его выставит) — будет 400 после `contact_phone`.
- `apartment_number` — опциональное поле, можно добавить рядом с floor.
- **Stripe payment в delivery-чекауте — сервер отдаёт «Your payment account is not connected».** Подтверждено 2026-05-09 на заказе #96: `Orders.createOrder` с `paymentAccountIdentifier: 'stripe'` проходит, но следом `Payments.createSession(id, 'session')` валится с этим текстом. Та же причина, что и для booking — Stripe-аккаунт в `Payments.getAccounts()` имеет `settings.status: "not_connected"` (production) при `testSettings.status: "connected"` и `testMode: true` (см. C.6.2 #1). Сервер OneEntry, судя по поведению, валидирует именно `settings.status` независимо от `testMode` — поэтому test-онбординг ситуацию не закрывает. После фикса в [useCreateOrder.ts](app/api/hooks/useCreateOrder.ts) ошибка теперь не глушится: wizard уходит на error-шаг с конкретным сообщением, заказ фиксируется в OneEntry, но редиректа на Stripe Checkout не происходит до закрытия пробела на стороне OneEntry/админки.

  > ❓ **Уточнить у OneEntry support:** при `testMode: true` сервер `Payments.createSession` должен валидировать `testSettings.status`, а не `settings.status`. Сейчас валидирует production-блок и отвечает `"Your payment account is not connected"`, хотя test-онбординг Stripe Connect завершён (`testSettings.stripeOnboardingComplete: true`, `testSettings.status: "connected"`). Воспроизведение — `Payments.createSession(<orderId>, 'session')` для проекта `oe-restaurants.oneentry.cloud`, account `stripe`. Запросить: либо чтобы на test-mode аккаунтах валидация шла по `testSettings`, либо чтобы сервер возвращал понятную ошибку «account is in testMode, but server requires production-connected account». Параллельно — клиент может временно пройти production Stripe Connect (live-ключи + KYC), это уберёт ошибку, но переведёт оплату на боевые карты.

> ❓ **Уточнить у клиента:** хотим ли мы реально сохранять `floor` / `apartment_number` в заказе (для курьера), или эти поля можно убрать из формы `delivery_order` в админке?

#### C.6.2. Booking-flow — payment + success (Figma 120:1875 / 120:2338)

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
2. **30% deposit — dictionary key `booking_deposit_text`.** Сейчас текст хардкод-fallback'ом `«30% deposit is required to confirm your booking»`. ❓ **Уточнить у клиента:** депозит реально 30% или другая ставка? Реализуется ли через preview/discount/promo на стороне OneEntry или это только UI-уведомление?
3. **Stripe success-redirect URL.** После оплаты Stripe возвращает юзера на success-URL, заданный в OneEntry payments config. Сейчас такого URL нет — после оплаты юзер вернётся на главную или на ошибку. ❓ **Уточнить у клиента:** какой URL использовать (например, `/reservation/success?orderId=…` — потребует роут на нашей стороне), и обернуть его в текст success-экрана из Figma 120:2338.

### C.7. Аудит соответствия полей коду (inspect-api)

Проверка проведена через `oneentry` SDK напрямую к проекту `oe-restaurants.oneentry.cloud` (lang=`en_US`). Зафиксировано на момент проверки.

#### C.7.1. Pages — реальные атрибуты

- **`menu/*`** (`appetizers`, `dinner`, `soup`, `fresh_juice`, …) — `icon` (заполнен), `service_*` (пустые, унаследовано из шаблона).
- **`filters`** — `cooking_time_filters` (json), `preferences_filters` (json), `price_filters` (string).
- **`blog/*`** — `bg_image`, `banner`, `description`, `action_type`. См. C.2.3.

#### C.7.2. Product (attribute set `dish`)

Реальные атрибуты у первого продукта (id=13):
`weight` (integer), `calorrage` (integer), `cooking_time` (integer), `preferences` (list), `ingredients` (string), `price` (integer), `currency` (string), `rating` (float), `sku` (string), `cover` (image).

- **`statusIdentifier`** — у всех товаров `null` (статус не назначен). Код блокирует покупку только при явном `statusIdentifier === 'out_of_stock'` ([AddToCartButton.tsx:62-65](components/layout/product/components/AddToCartButton.tsx#L62-L65), [JSON-LD availability](app/shop/product/%5Bhandle%5D/page.tsx#L56-L59)). ❓ **Уточнить у клиента:** проставлять ли в админке статусам товаров `in_stock` (для аналитики/SEO) — в текущей логике `null` уже работает как «доступно».

#### C.7.3. Blocks (home_web)

3 блока с identifier'ами `home_promo`, `recommended`, `home_categories`. У всех блоков **нет атрибутов**. Код использует только `block.identifier` как позиционный якорь для рендера — это работает.

[components/layout/product/ProductsGroup.tsx:32](components/layout/product/ProductsGroup.tsx) читает `block.attributeValues?.together_title?.value` для блока `together` (related products) — соответствующий блок в админке надо проверить отдельно (если есть).

#### C.7.4. Dictionary (`static_content`) — что код читает, но в CMS нет

- **`reset_descr`, `send_text`** ([ForgotPasswordForm.tsx](components/forms/ForgotPasswordForm.tsx)) — нет.

> ❓ **Уточнить у клиента:** надо ли расширять `static_content` под все эти UI-строки (для локализации) или достаточно текущих 59 + хардкоды?

### C.9. Меню `user_menu` — routing-формат

⚠️ **Routing-формат — открыт.** В коде линки строятся как `/${page.pageUrl}` (см. [NavItemProfile.tsx](components/layout/header/nav/NavItemProfile.tsx)). Сейчас `pageUrl` в CMS — flat (`orders`, `favorites`, `bookings`), а реальные Next.js-маршруты — `/profile/orders`, `/profile/favorites`, `/profile/bookings`. Варианты: (a) переименовать `pageUrl` в CMS на полные пути `profile/orders` и т.п.; (b) переименовать роуты в `app/` под flat-структуру (`app/orders`, `app/favorites`) и тогда `pageUrl: orders`/`favorites` совпадут; (c) маппить в коде. Решение за командой админки.

### C.10. Профиль — Reservations history (Figma 78:1293)

Отдельный экран в зоне профиля: «Active reservation» (одна оранжево-обведённая карточка с № и датой) + «Reservation History» (список карточек со статусами `Canceled` / `Reserved` / и т.п.). Сейчас в проекте такого экрана нет — нужно завести роут `/profile/reservations` (или сделать линком из `user_menu`, см. C.9) и компонент, аналогичный [OrdersList.tsx](components/profile/OrdersList.tsx).

Источник данных — `Orders.getAllOrdersByMarker('booking_order')`, фильтр по `statusIdentifier`:

- **Active** = `statusIdentifier in (<все «активные» маркеры>)` — обычно «inProgress», «reserved» и т.п. Точные маркеры зависят от настройки в OneEntry admin → Orders → Statuses.
- **History** = всё остальное (Canceled, Completed, прошедшие даты).

✅ **Cancel-flow.** Эмпирически проверено (2026-05-11): SDK `Orders.updateOrderByMarkerAndId` пропускает поле `statusIdentifier` на сервер, и сервер его применяет, даже несмотря на отсутствие в типе `IOrderData`. Кнопка `Cancel` теперь делает реальный update с `statusIdentifier: 'booking_cancelled'` (см. [BookingsContent.tsx](components/profile/BookingsContent.tsx) `onCancel`), и заказ после ответа сервера локально перекладывается в Reservation History через `isHistoryOrder` (теперь матчит по подстрокам `cancel`/`complet`/`deliver`/`reject`/`refund`, чтобы покрыть admin-specific маркеры вроде `booking_cancelled`/`booking_completed`). После рефреша попапа отменённая бронь продолжает быть в History (статус закреплён на сервере).

**Открытое для клиента:**

1. **Order statuses для booking_order**. ❓ Какие markers статусов завести в OneEntry admin → Orders → Statuses → Storage `booking_order`? По Figma минимум `Reserved` (default) + `Canceled`. Хорошо бы ещё `InProgress` и `Completed`. Без этого `BookingsPopup` фильтрует Active/History по дефолтному списку (`HISTORY_STATUSES = {delivered, canceled, cancelled, completed, rejected}`) — могут быть mis-classifications.
2. ✅ **Cancel — настоящий API.** Закрыто 2026-05-11: server-side подтверждено принимает `statusIdentifier` в body `updateOrderByMarkerAndId` (см. ✅ выше). В админке настроен `booking_cancelled` (британское написание, не `booking_canceled`).
3. **Edit ограничения.** Сейчас edit отдаёт `products: [{ productId: 34, quantity: 1 }]` (тот же placeholder, что и в `createOrder` — см. C.6.2). Если депозит привязан к product 34, при update это останется без изменений. ❓ Корректно ли или edit-флоу должен иметь другую логику по продуктам?
4. **Status colors / labels** — построить map `{ statusIdentifier → label, color }` на клиенте, как в `OrdersList.tsx` (см. правило `orders.md`).

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
| `booking_cancel_unavailable` | string | This booking cannot be cancelled.                           |
| `booking_edit_unavailable`   | string | This booking cannot be edited.                              |
| `booking_updated_toast`      | string | Reservation updated.                                        |

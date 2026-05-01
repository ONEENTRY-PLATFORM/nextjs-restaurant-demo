# MISMATCH-LOG — расхождения вёрстки и пробелы в OneEntry

Единый журнал, объединяющий:

- **Раздел A** — автоматические находки (закомментированный код, arbitrary px-значения).
- **Раздел B** — ручная сверка вёрстки `static-html/` ↔ Next.js (что чинится правкой кода в этом репо).
- **Раздел C** — пробелы в данных OneEntry (что нужно завести в админке `https://oe-restaurants.oneentry.cloud/`).

Заполняется по мере ручной сверки. Правила работы — см. [CLAUDE.md §3, §7](CLAUDE.md).

## Сводка (на 2026-04-30)

| Раздел | Файлов | P0 | P1 | P2 | P3 |
|---|---|---|---|---|---|
| A. Автоматические находки | — | — | — | ~25 | ~190 |
| B.1 Главная | 5 | — | — | — | — |
| B.2 Карточка товара | 5 | — | — | — | — |
| B.3 Каталог/категория | 6 | — | — | — | — |
| B.4 Корзина и чекаут | 9 | — | — | — | 2 |
| B.5 Профиль и попапы | 6 | — | — | — | 2 |
| B.6 Резервация | 4 | — | — | 1 | — |
| B.7 Поддержка/Service | 6 | — | — | — | 2 |
| B.8 Промо | 3 | — | — | — | — |
| C. OneEntry Admin Setup | — | — | — | — | — |

### Топ-приоритет (P0/P1) — фиксить первыми

_Активных P0/P1 пунктов нет._

---

## Severity
- **P0** — структура DOM/функциональность сломана (нет блока, не работает кнопка).
- **P1** — заметный визуальный мискшоп (отступы/цвета на брендовых элементах, неправильные классы).
- **P2** — мелочи (px-токены вместо именованных, шрифты в hero, hover-эффекты).
- **P3** — косметика / гигиена кода (инлайн SVG → `components/icons/`, удалить закомментированное).

---

### A.3. Закомментированный код (правило 3.2 — удалить)

| Файл | Строки | Что |
|---|---|---|
| [app/store/providers/StoreProvider.tsx](app/store/providers/StoreProvider.tsx) | 8 | `// import type { AppStore }` |
| [app/store/providers/AuthContext.tsx](app/store/providers/AuthContext.tsx) | 15, 24, 80 | `// import updateUserState`, `// addFavorites,`, `// const favoritesVersion` |
| [components/forms/UserForm.tsx](components/forms/UserForm.tsx) | 17, 105 | `// import AuthError`, `// return <AuthError ... />` |
| [components/forms/inputs/FormCaptcha.tsx](components/forms/inputs/FormCaptcha.tsx) | 16, 27–45 | блок `recaptcha.enterprise` закомментирован — либо включить, либо удалить |
| [components/layout/mobile-menu/components/MobileMenu.tsx](components/layout/mobile-menu/components/MobileMenu.tsx) | 1 | `// 'use client';` |
| [components/layout/cart/components/DeleteButton.tsx](components/layout/cart/components/DeleteButton.tsx) | 8, 26 | `// removeProduct`, `// dispatch(removeProduct(...))` |

### A.4. Arbitrary px-значения `[Npx]` (правило 3.1.1 — переводить в шкалу)

**Severity: P2/P3.** 176 вхождений в 63 файлах. Топ-кандидаты на чистку:

| Файл | Кол-во |
|---|---|
| [components/profile/ProfilePopup.tsx](components/profile/ProfilePopup.tsx) | 13 |
| [components/cart/steps/StepResult.tsx](components/cart/steps/StepResult.tsx) | 9 |
| [components/cart/steps/StepOrder.tsx](components/cart/steps/StepOrder.tsx) | 8 |
| [components/layout/product/product-single/ProductDetails.tsx](components/layout/product/product-single/ProductDetails.tsx) | 8 |
| [components/cart/steps/StepAddCard.tsx](components/cart/steps/StepAddCard.tsx) | 7 |
| [components/profile/OrdersList.tsx](components/profile/OrdersList.tsx) | 6 |
| [components/reviews/ReviewsSlideUpPanel.tsx](components/reviews/ReviewsSlideUpPanel.tsx) | 6 |
| [components/static/FilterBottom.tsx](components/static/FilterBottom.tsx) | 6 |
| [components/reservation/ReservationForm.tsx](components/reservation/ReservationForm.tsx) | 6 |
| [components/reviews/OrderReviewsPanel.tsx](components/reviews/OrderReviewsPanel.tsx) | 6 |

> Действие: проходом по компоненту смотреть `value_px / 4 = N` → `*-N` или `*-N.MM`. Если значение часто повторяется (в 3+ местах) — добавлять токен в `@theme inline`.

---

## Раздел B. Ручная сверка по экранам

### B.1. Главная (`static-html/index.html` ↔ `app/page.tsx` + components)

- 🌐 Live: <http://localhost:3000/>
- 📄 Static: [static-html/index.html](static-html/index.html) · <file:///d:/OneEntry/nextjs-restaurant/static-html/index.html>
- 📁 Файлы проекта: [app/page.tsx](app/page.tsx) · [components/home/HomePromo.tsx](components/home/HomePromo.tsx) · [components/home/CategoriesSection.tsx](components/home/CategoriesSection.tsx) · [components/home/HomeCategoriesSection.tsx](components/home/HomeCategoriesSection.tsx) · [components/layout/header/index.tsx](components/layout/header/index.tsx)

### B.2. Карточка товара (`pk_product_details.html` ↔ `app/shop/product/[handle]`)

- 🌐 Live: <http://localhost:3000/shop/product/13> _(заменить `13` на любой реальный product id, например через `/shop`)_
- 📄 Static: [static-html/pk_product_details.html](static-html/pk_product_details.html) · <file:///d:/OneEntry/nextjs-restaurant/static-html/pk_product_details.html>
- 📁 Файлы проекта: [app/shop/product/[handle]/page.tsx](app/shop/product/[handle]/page.tsx) · [components/layout/product/index.tsx](components/layout/product/index.tsx) · [components/layout/product/product-single/ProductDetails.tsx](components/layout/product/product-single/ProductDetails.tsx) · [components/layout/product/product-single/ProductCover.tsx](components/layout/product/product-single/ProductCover.tsx) · [components/layout/product/components/AddToCartButton.tsx](components/layout/product/components/AddToCartButton.tsx)

### B.3. Каталог / категория (`index_category.html` ↔ `app/shop/...`)

- 🌐 Live: <http://localhost:3000/shop> · <http://localhost:3000/shop/category/dinner> _(подставить реальный category handle)_
- 📄 Static: [static-html/index_category.html](static-html/index_category.html) · <file:///d:/OneEntry/nextjs-restaurant/static-html/index_category.html>
- 📁 Файлы проекта: [app/shop/page.tsx](app/shop/page.tsx) · [app/shop/category/[handle]/page.tsx](app/shop/category/[handle]/page.tsx) · [components/static/CategoryFilter.tsx](components/static/CategoryFilter.tsx) · [components/layout/filter/FilterModal.tsx](components/layout/filter/FilterModal.tsx) · [components/layout/products-grid/components/product-card/ProductCard.tsx](components/layout/products-grid/components/product-card/ProductCard.tsx)

_Открытых пунктов нет._

### B.4. Корзина и чекаут (`cart_*.html` / `pk_cart.html` ↔ `components/cart/CartWizard.tsx` + steps)

- 🌐 Live: <http://localhost:3000/cart>
- 📄 Static (по шагам визарда):
  - cart: [pk_cart.html](static-html/pk_cart.html) · <file:///d:/OneEntry/nextjs-restaurant/static-html/pk_cart.html> · mobile [cart_cart.html](static-html/cart_cart.html) · <file:///d:/OneEntry/nextjs-restaurant/static-html/cart_cart.html>
  - time: [cart_time.html](static-html/cart_time.html) · <file:///d:/OneEntry/nextjs-restaurant/static-html/cart_time.html>
  - signin: [pk_login.html](static-html/pk_login.html) · <file:///d:/OneEntry/nextjs-restaurant/static-html/pk_login.html> · [cart_login.html](static-html/cart_login.html) · <file:///d:/OneEntry/nextjs-restaurant/static-html/cart_login.html>
  - verification: [pk_verif.html](static-html/pk_verif.html) · <file:///d:/OneEntry/nextjs-restaurant/static-html/pk_verif.html> · [cart_Verification.html](static-html/cart_Verification.html) · <file:///d:/OneEntry/nextjs-restaurant/static-html/cart_Verification.html>
  - order: [pk_order.html](static-html/pk_order.html) · <file:///d:/OneEntry/nextjs-restaurant/static-html/pk_order.html> · [cart_Order.html](static-html/cart_Order.html) · <file:///d:/OneEntry/nextjs-restaurant/static-html/cart_Order.html>
  - payment: [cart_PAYMENT.html](static-html/cart_PAYMENT.html) · <file:///d:/OneEntry/nextjs-restaurant/static-html/cart_PAYMENT.html>
  - add_card: [cart_add_card.html](static-html/cart_add_card.html) · <file:///d:/OneEntry/nextjs-restaurant/static-html/cart_add_card.html>
  - error: [cart_error_masseges.html](static-html/cart_error_masseges.html) · <file:///d:/OneEntry/nextjs-restaurant/static-html/cart_error_masseges.html>
- 📁 Файлы проекта: [app/cart/page.tsx](app/cart/page.tsx) · [components/cart/CartWizard.tsx](components/cart/CartWizard.tsx) · [components/cart/steps/StepTime.tsx](components/cart/steps/StepTime.tsx) · [components/cart/steps/StepSignIn.tsx](components/cart/steps/StepSignIn.tsx) · [components/cart/steps/StepVerification.tsx](components/cart/steps/StepVerification.tsx) · [components/cart/steps/StepAddress.tsx](components/cart/steps/StepAddress.tsx) · [components/cart/steps/StepOrder.tsx](components/cart/steps/StepOrder.tsx) · [components/cart/steps/StepPayment.tsx](components/cart/steps/StepPayment.tsx) · [components/cart/steps/StepAddCard.tsx](components/cart/steps/StepAddCard.tsx) · [components/cart/steps/StepResult.tsx](components/cart/steps/StepResult.tsx)

| # | Что не так | Файл | Severity |
|---|---|---|---|
| B.4.9 | `auth-попап` в `CartWizard` рендерит `signin`/`verification` шаги поверх корзины как центрированный popup. Проверить, что `pk_login.html` / `pk_verif.html` подтверждают этот паттерн (на десктопе — popup поверх cart, на мобиле — fullscreen popup, корзина скрыта) | [components/cart/CartWizard.tsx:36-43,80-104](components/cart/CartWizard.tsx#L80-L104) | — (требует визуала) |
| B.4.10 | `<BurgerOrangeIcon />` в шапке корзины-мобильной — это иконка из набора в `components/icons/`. В `static-html/cart_cart.html` справа должен быть бургер-меню или иконка переключения между mobile/desktop макетами. Сверить, что иконка совпадает | [components/cart/CartWizard.tsx:166](components/cart/CartWizard.tsx#L166) | — (требует визуала) |
| B.4.11 | Хардкод-строки без маркеров в OneEntry: `'Cart'`, `'Select time'`, `'Success'`, `'Error'` в STEP_TITLES + строка `'Cart'` в шапке мобильной корзины и хлебных крошках. Завести `cart_text` / `select_time_text` / `success_text` / `error_text` в `static_content` и подцепить через `dict` | [components/cart/CartWizard.tsx:48-61,164,181-186](components/cart/CartWizard.tsx#L48-L61) | P3 |
| B.4.12 | StepPayment: хардкод `'Pay with'` (PayPal label, line 103), `'Credit & Debit Cards'`, placeholder `'phone number'` (line 196) — нет соответствующих маркеров в `static_content`. Wired: `select_payment_text`, `pay_cash_text`, `comment_order`, `another_person_text` | [components/cart/steps/StepPayment.tsx:103,196](components/cart/steps/StepPayment.tsx#L103) | P3 |

### B.5. Профиль и попапы (`m_profile.html`, `pk_active_orders.html` ↔ `app/profile/*`, `components/profile/*`)

- 🌐 Live: <http://localhost:3000/profile> · <http://localhost:3000/profile/orders> · <http://localhost:3000/profile/favorites>
- 📄 Static:
  - personal/profile: [m_profile.html](static-html/m_profile.html) · <file:///d:/OneEntry/nextjs-restaurant/static-html/m_profile.html> · [mob_about_profile.html](static-html/mob_about_profile.html) · <file:///d:/OneEntry/nextjs-restaurant/static-html/mob_about_profile.html>
  - active orders: [pk_active_orders.html](static-html/pk_active_orders.html) · <file:///d:/OneEntry/nextjs-restaurant/static-html/pk_active_orders.html> · [details_active_orders.html](static-html/details_active_orders.html) · <file:///d:/OneEntry/nextjs-restaurant/static-html/details_active_orders.html>
  - favorites: [m_favorites.html](static-html/m_favorites.html) · <file:///d:/OneEntry/nextjs-restaurant/static-html/m_favorites.html> · [pk_favorites.html](static-html/pk_favorites.html) · <file:///d:/OneEntry/nextjs-restaurant/static-html/pk_favorites.html>
  - reviews drawer: [m_rewiews.html](static-html/m_rewiews.html) · <file:///d:/OneEntry/nextjs-restaurant/static-html/m_rewiews.html>
  - profile details popup: [mob_about.html](static-html/mob_about.html) · <file:///d:/OneEntry/nextjs-restaurant/static-html/mob_about.html>
- 📁 Файлы проекта: [app/profile/layout.tsx](app/profile/layout.tsx) · [app/profile/page.tsx](app/profile/page.tsx) · [app/profile/orders/page.tsx](app/profile/orders/page.tsx) · [app/profile/favorites/page.tsx](app/profile/favorites/page.tsx) · [components/profile/ProfileTabs.tsx](components/profile/ProfileTabs.tsx) · [components/profile/ProfilePopup.tsx](components/profile/ProfilePopup.tsx) · [components/profile/FavoritesPopup.tsx](components/profile/FavoritesPopup.tsx) · [components/profile/FavoritesGrid.tsx](components/profile/FavoritesGrid.tsx) · [components/profile/OrdersList.tsx](components/profile/OrdersList.tsx)

| # | Что не так | Файл | Severity |
|---|---|---|---|
| B.5.1 | `text-[24px] md:text-[32px]` на h1 — `text-2xl md:text-3xl` (24px = `text-2xl`, 30px = `text-3xl`; 32px ближе к `text-3xl` но не совпадает точно). 24px один-в-один. **Сверить значение 32px со static** | [app/profile/layout.tsx:15](app/profile/layout.tsx#L15) | P3 |
| B.5.6 | Хардкод-вёрстка адресов в ProfilePopup: `initialAddresses` с `id: 'a1', street: 'OneEntry', house: '40', floor: '27'`. По CLAUDE.md правилу 2 это легитимный мок, но в §C.5 уже есть открытый вопрос «где хранить адреса». **Не баг — задокументировано** | [components/profile/ProfilePopup.tsx:26-28](components/profile/ProfilePopup.tsx#L26-L28) | — |
| B.5.7 | `HIDDEN_PROFILE_MARKERS` исключает `user_address`, `user_flat`, `user_floor` — но в `static-html/details_personal.html` блок Address НЕ показывает эти поля под секцией Personal (они в отдельной секции Address). Логика верна, но комментарий стоило бы расширить | [components/profile/ProfilePopup.tsx:32-39](components/profile/ProfilePopup.tsx#L32-L39) | — |

### B.6. Резервация (`service_table.html`, `service_date.html`, `service_time.html` ↔ `app/reservation`)

- 🌐 Live: <http://localhost:3000/reservation>
- 📄 Static:
  - main form: [service_table.html](static-html/service_table.html) · <file:///d:/OneEntry/nextjs-restaurant/static-html/service_table.html>
  - date picker: [service_date.html](static-html/service_date.html) · <file:///d:/OneEntry/nextjs-restaurant/static-html/service_date.html>
  - time picker: [service_time.html](static-html/service_time.html) · <file:///d:/OneEntry/nextjs-restaurant/static-html/service_time.html>
  - sign-up: [service_Sign_up.html](static-html/service_Sign_up.html) · <file:///d:/OneEntry/nextjs-restaurant/static-html/service_Sign_up.html>
  - reservation about: [mob_about_reservation.html](static-html/mob_about_reservation.html) · <file:///d:/OneEntry/nextjs-restaurant/static-html/mob_about_reservation.html>
- 📁 Файлы проекта: [app/reservation/page.tsx](app/reservation/page.tsx) · [components/reservation/ReservationForm.tsx](components/reservation/ReservationForm.tsx) · [components/reservation/RestaurantSelect.tsx](components/reservation/RestaurantSelect.tsx) · [components/ui/DatePickerSheet.tsx](components/ui/DatePickerSheet.tsx) · [components/ui/TimePickerSheet.tsx](components/ui/TimePickerSheet.tsx)

| # | Что не так | Файл | Severity |
|---|---|---|---|
| B.6.5 | `bg-[url('/images/picture/bg_cart.png')] ... md:bg-none` — на md+ фон убирается. Сверить со static-html — там градиентная подложка может быть на всех брейкпоинтах. Заглянуть в `service_table.html` | [app/reservation/page.tsx:63](app/reservation/page.tsx#L63) | — (требует визуала) |
| B.6.6 | `RestaurantSelect.label` берётся из `address` или `localizeInfos.title`. В `static-html/service_table.html` дропдаун ресторана показывает скорее всего читаемое название («Restaurant 1» / название локации), а не адрес. Сейчас приоритет адреса — может выглядеть избыточно длинной строкой | [app/reservation/page.tsx:34-42](app/reservation/page.tsx#L34) | P2 |
| B.6.7 | Дата/время — bottom-sheet пикеры ([DatePickerSheet](components/ui/DatePickerSheet.tsx), [TimePickerSheet](components/ui/TimePickerSheet.tsx)) вместо нативного `<input type="date">`. Это намеренно (соответствует `service_date.html` / `service_time.html`). **В плюс — задокументировано в JSDoc** | [components/reservation/ReservationForm.tsx:64-67](components/reservation/ReservationForm.tsx#L64-L67) | — |

### B.7. Поддержка / Service (`service_support.html`, `service.html` ↔ `app/support`, `app/service`)

#### B.7a. ServicePage (`service.html`)

- 🌐 Live: <http://localhost:3000/service>
- 📄 Static: [service.html](static-html/service.html) · <file:///d:/OneEntry/nextjs-restaurant/static-html/service.html>
- 📁 Файлы проекта: [app/service/page.tsx](app/service/page.tsx)

| # | Что не так | Файл | Severity |
|---|---|---|---|
| B.7.1 | Соответствие со static — высокое: `max-w-98.25 px-5` ↔ `max-w-[393px] px-[20px]` ✓; кнопки `h-15 w-full mt-42.5` ↔ `h-[60px] w-full mt-[170px]` ✓; brand-текст `text-brand` правильно использует токен (в static был `text-[#ec722b]` — проект уже исправил). **В плюс** | [app/service/page.tsx](app/service/page.tsx) | — |
| B.7.2 | `text-[17px]` — нестандартный размер, не на дефолтной шкале (16/18/20). 17/4=4.25 — `text-[17px]` остаётся как есть, либо ввести токен `--text-cta-button: 17px` если повторяется | [app/service/page.tsx:72,78](app/service/page.tsx#L72) | P3 |
| B.7.3 | CMS-атрибуты `service_logo`, `service_bg_image`, `service_primary_cta`, `service_primary_href`, `service_secondary_cta`, `service_secondary_href` — **существуют в OneEntry, но значения пусты** (см. §C.7.1). Используются хардкоды `'FOOD DELIVERY'`, `'BOOK A TABLE'`, `/shop`, `/reservation` — fallback работает. Действие на стороне админа | [app/service/page.tsx:40-48](app/service/page.tsx#L40-L48) | — |

#### B.7b. SupportPage (`service_support.html`)

- 🌐 Live: <http://localhost:3000/support>
- 📄 Static: [service_support.html](static-html/service_support.html) · <file:///d:/OneEntry/nextjs-restaurant/static-html/service_support.html> · [m_support.html](static-html/m_support.html) · <file:///d:/OneEntry/nextjs-restaurant/static-html/m_support.html>
- 📁 Файлы проекта: [app/support/page.tsx](app/support/page.tsx) · [components/forms/ContactUsForm.tsx](components/forms/ContactUsForm.tsx)

| # | Что не так | Файл | Severity |
|---|---|---|---|
| B.7.5 | `text-[24px] md:text-[32px]` на h1 — повтор паттерна (B.5.1, B.6.3) | [app/support/page.tsx:31](app/support/page.tsx#L31) | P3 |
| B.7.9 | `static-html/service_support.html` НЕ содержит формы Contact-Us — только два контактных блока. В проекте форма всё ещё есть. С клиентом форма подтверждена как нужна (`contact_us` создан в админке), но это значит макет support-страницы **отличается от static-html** — ✅ намеренно | [app/support/page.tsx:70-75](app/support/page.tsx#L70-L75) | — |

### B.8. Промо (`pk_promo_BIRTHDAY.html`, `pk_promo_day.html` ↔ `app/promo/[handle]`)

- 🌐 Live: <http://localhost:3000/promo/birthday_offer> · <http://localhost:3000/promo/deal_of_the_day> · <http://localhost:3000/promo/business_lunch> _(заполненные blog-страницы из админки)_
- 📄 Static:
  - birthday: [pk_promo_BIRTHDAY.html](static-html/pk_promo_BIRTHDAY.html) · <file:///d:/OneEntry/nextjs-restaurant/static-html/pk_promo_BIRTHDAY.html>
  - day: [pk_promo_day.html](static-html/pk_promo_day.html) · <file:///d:/OneEntry/nextjs-restaurant/static-html/pk_promo_day.html>
- 📁 Файлы проекта: [app/promo/[handle]/page.tsx](app/promo/[handle]/page.tsx) · [components/promo/PromoCard.tsx](components/promo/PromoCard.tsx)

| # | Что не так | Файл | Severity |
|---|---|---|---|

---

## Раздел C. OneEntry Admin Setup — что осталось завести в админке

Админка: `https://oe-restaurants.oneentry.cloud/`

Код уже подключён к существующим сущностям (`services`, `bookings`, `filters`, `menu`, `restaurants`, `blog`, `delivery_order`, `booking_order`, `user`, attribute set `dish` с `cover/weight/rating/cooking_time/price/...`, attribute set `restaurant`, attribute set `catalog_page`). Ниже — только то, чего **нет** в админке и нужно для оставшихся функциональных пробелов.

### C.1. Недостающие формы

#### C.1.3. `delivery_review_form` — отзыв о доставке

Используется в drawer-е [components/reviews/OrderReviewsPanel.tsx](components/reviews/OrderReviewsPanel.tsx) (вёрстка [static-html/index_rewiews.html](static-html/index_rewiews.html)) для последней «Delivery»-строки в списке отзывов по заказу. Сейчас заглушка [submitDeliveryReview](app/actions/review.ts) возвращает `{ ok: true }`, но в админке формы пока нет — отзыв о курьере никуда не сохраняется.

| marker            | type   | title              | required |
|-------------------|--------|--------------------|----------|
| `review_rating`   | int    | Rating             | yes      |
| `review_text`     | text   | Review body        | yes      |
| `delivery_status` | string | Delivery condition | no       |

После создания формы нужно поправить `submitDeliveryReview` так же, как `submitReview`: читать схему через `Forms.getFormByMarker('delivery_review_form')`, постить через `FormData.postFormsData` с `moduleEntityIdentifier=String(orderId)`.

> ❓ **Уточнить у клиента:** должна ли «Delivery»-строка отзыва быть гейтом пока заказ не помечен как доставленный? В вёрстке drawer виден при статусе «In delivery», но обычно отзыв собирается уже после `delivered`.

### C.2. Недостающие страницы

#### C.2.3. Дочерние страницы под `blog` (акции)

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
| `business_lunch`        | ✅       | ✅     | ✅          | ❌ пусто    |
| `deal_of_the_day`       | ✅       | ✅     | ✅          | ❌ пусто    |

наполнить `action_type` (list-options) для CTA-кнопок в карточках и на детальной странице.

Десктоп-баннер берётся через [getBlogBanners](app/api/server/pages/getBlogBanners.ts) (`bg_image`), мобильный — через тот же fetcher (`banner`). Пока у дочерних страниц `blog` нет `bg_image` — десктопный hero на `/` не покажется (graceful fallback), а сайдбар `/cart` / `/profile/orders` будет пустым.

#### C.2.4. Атрибут `preferences` (list) на attribute set `dish`

[components/layout/header/CategoriesScroller.tsx](components/layout/header/CategoriesScroller.tsx) теперь рендерит горизонтальный фильтр-скроллер по значениям атрибута `preferences` (list-type) у блюд. Каждый чип — Link на `/shop?preferences=<value>`, фильтр прокидывается в `Products.getProducts` через [app/api/utils/getSearchParams.ts](app/api/utils/getSearchParams.ts) (`attributeMarker: 'preferences', conditionMarker: 'in'`).

| marker        | type | title       |
|---------------|------|-------------|
| `preferences` | list | Preferences |

- listTitles задаются в админке (например: `Meat`, `Fish`, `Vegetable`, `Sugar Free`, `Gluten free`, `Vegetarian`, `Spicy dish`, `Diabetic`, …) — те же значения, что в [components/static/FilterBottom.tsx](components/static/FilterBottom.tsx).
- Атрибут уже используется на product detail ([ProductDetails.tsx:45](components/layout/product/product-single/ProductDetails.tsx#L45)) — если listTitles пустые, scroller рендерится пустым (graceful fallback).
- Каждое блюдо должно иметь выбранные значения `preferences`, иначе фильтр `preferences in <value>` вернёт пусто.

> ❓ **Уточнить у клиента:** сейчас в `listTitles` атрибута `preferences` есть две записи с одинаковым `value = "Dinner"` — React ругается на дубликат ключа в [CategoriesScroller.tsx:52](components/layout/header/CategoriesScroller.tsx#L52). Временно дедуплицируем по `value` в [components/layout/header/index.tsx](components/layout/header/index.tsx) (первое вхождение побеждает). Убрать один из дубликатов в админке (или поменять `value` второму, если это разные смыслы) — после этого можно убрать дедуп.

### C.3. Похожие товары (related products)

Страница [app/shop/product/[handle]/page.tsx](app/shop/product/[handle]/page.tsx) рендерит секцию «Featured objects» через [components/layout/product/RelatedItems.tsx](components/layout/product/RelatedItems.tsx) → SDK `Products.getRelatedProductsById`. Чтобы секция реально что-то показывала:

- В админке для каждого блюда открыть карточку товара и привязать минимум 4–6 «похожих» через стандартный механизм OneEntry «Related products». Без этого `getRelatedProductsById` возвращает пустой список и секция не рендерится (graceful fallback).
- (Опционально) Заголовок секции — берётся из `static_content.featured_objects` (string), fallback `"Featured objects"`. Если хочется локализованный заголовок — добавить атрибут:

  | marker              | type   | title             |
  |---------------------|--------|-------------------|
  | `featured_objects`  | string | Featured objects  |

### C.4. Словарь `static_content` — что осталось

Словарь подгружается через [app/dictionaries.ts](app/dictionaries.ts) (атрибут-сет `static_content`, нормализован в `Record<marker, attr>`, `value` = `initialValue` если локализация не заполнена). В админке уже есть 59 маркеров. Все обращения в коде переведены на существующие маркеры — несуществующие маркеры удалены из кода (использованы ближайшие по смыслу из 59):

- [ReservationForm.tsx](components/reservation/ReservationForm.tsx) — `reservation_submit_text` → `submit_text`, `reservation_success_title` → `info_text`, `reservation_success_text` → `reservation_confirmed`.
- [UserForm.tsx](components/forms/UserForm.tsx) — `save_button_text` → `submit_text`.

Хардкод-фразы:

- [components/static/FilterBottom.tsx](components/static/FilterBottom.tsx): ✅ wired — `order_waiting_time`, `preferences_text`, `clear_all_filters_text` (через проп `dict` из [Header](components/layout/header/index.tsx)).
- [components/reviews/ReviewForm.tsx](components/reviews/ReviewForm.tsx): ✅ wired — `leave_review` (через проп `dict`). «Your review» / «Your rating» / «Share experience» / «Camera» / «Gallery» — этих фраз в текущем UI нет (упрощённая форма: rating + textarea), маркеры зарезервированы на случай расширения.
- [components/profile/FavoritesPopup.tsx](components/profile/FavoritesPopup.tsx): ✅ wired — aria-label `add_to_cart` (через проп `dict` из [layout.tsx](app/layout.tsx)).
- [components/cart/steps/StepPayment.tsx](components/cart/steps/StepPayment.tsx): wired — `select_payment_text`, `pay_cash_text`, `comment_order`, `another_person_text`. Хардкод (нет маркера): «Pay with» (PayPal label), «Credit & Debit Cards», placeholder «phone number» под чекбоксом.
- [components/cart/CartWizard.tsx](components/cart/CartWizard.tsx) — STEP_TITLES уже подцеплены к `sign_in_text`/`verification_text`/`address_text`/`select_payment_text`. «Cart», «Select time», «Success», «Error» — нет соответствующих маркеров, оставлены хардкодом.

### C.5. Профиль — попап «My Profile» (детальный personal/payment/address)

[components/profile/ProfilePopup.tsx](components/profile/ProfilePopup.tsx) — порт верстки [static-html/details_personal.html](static-html/details_personal.html). Открывается из иконки пользователя в шапке. Сейчас:

- **Personal** ✅ — поля First Name / Second Name / Phone / E-mail / Password префилятся из `AuthContext.user.formData` (`name`, `second_name`/`lastname`, `phone`, `email`). Кнопка **Edit** (`type="submit"`) сохраняет через `api.Users.updateUser` по паттерну [components/forms/UserForm.tsx](components/forms/UserForm.tsx) (form-marker `user`): `formData` собирается из видимых атрибутов формы кроме password-полей; `authData` отправляется только если введён новый password; `notificationData.email`/`phoneSMS` берутся из соответствующих edits/`user.formData`. После успеха — `refreshUser()` + toast «Data saved!». См. [components/profile/ProfilePopup.tsx:109-141](components/profile/ProfilePopup.tsx#L109-L141).

- **Address** — список адресов (street/house/floor) + map preview (`/images/picture/maps.png` static), Add/Delete/Apply. **Локально**, не персистится. Нужно завести в `user`-форме атрибут:

  | marker      | type | title                    | notes                                                        |
  |-------------|------|--------------------------|--------------------------------------------------------------|
  | `addresses` | json | Saved delivery addresses | Массив `{ id, street, house, floor }` — адресная книга юзера |

  Чекаут ([StepAddress.tsx](components/cart/steps/StepAddress.tsx)) должен предлагать сохранённые адреса из `user.formData.addresses` как `<select>` (вместо ввода с нуля); попап «My Profile» — читать/писать тот же атрибут через `api.Users.updateUser`.

- **Map preview** — статичный PNG. Если нужна интерактивная карта (Google Maps / Yandex / Mapbox) — задача отдельная.

Когда ответы получены — таски на код:

1. ✅ Edit → `api.Users.updateUser({ formIdentifier, formData, authData, notificationData, state })` — реализовано в [components/profile/ProfilePopup.tsx:109-141](components/profile/ProfilePopup.tsx#L109-L141).
2. Cards: persist в выбранное хранилище + load в `useEffect` из `AuthContext.user`.
3. Addresses: persist + загружать в чекаут как `<select>` сохранённых.

### C.6. Платежи

`PROJECT_URL/payments/accounts` — аккаунт `cash` (оплата при доставке). PayPal/cash работают через `addPaymentMethod`; карточная оплата теперь активна в UI ([StepPayment](components/cart/steps/StepPayment.tsx) → [StepAddCard](components/cart/steps/StepAddCard.tsx) per `cart_add_card.html`), но завершает заказ синтетическим `card:<id>` — нужно создать `card`-payment-account и подключить реальный gateway, иначе платёж в OneEntry не пройдёт.

Дополнительно: ✅ Промокоды в [StepOrder](components/cart/steps/StepOrder.tsx) (per `cart_Order.html`) подключены через OneEntry Discounts API. Кнопка «Apply Code» вызывает `api.Orders.previewOrder({ products, couponCode })` ([useApplyCoupon](app/api/hooks/useApplyCoupon.ts)) — сервер сам валидирует код и считает реальную скидку с учётом всех условий (`MIN_CART_AMOUNT`, `applicability: TO_PRODUCT | TO_ORDER`, `discountType: PERCENT | FIXED_AMOUNT`, `maxAmount`). Применённый код хранится в `OrderSlice.appliedCoupon`, отображается строкой «Discount: −X» и пробрасывается в `Orders.createOrder({ couponCode })` ([useCreateOrder.ts](app/api/hooks/useCreateOrder.ts)).

Что нужно настроить в админке OneEntry для работающего промо:

1. **Discounts → создать `DISCOUNT`** с `discountValue: { applicability, discountType, value, maxAmount? }`. Например, `applicability: TO_ORDER`, `discountType: PERCENT`, `value: 10` — 10% на заказ.
2. **Conditions** (опционально): `MIN_CART_AMOUNT`, `PRODUCT_IN_CART`, `CATEGORY_IN_CART` и т.д. — определяют, когда купон применим. Если не выполнились — `previewOrder` вернёт `totalSumWithDiscount === totalSum`, UI покажет «Coupon does not apply to this cart».
3. **Coupons → сгенерировать код** (`isReusable: true/false`) и привязать к нужному `DISCOUNT`. Юзер вводит этот код в поле «Promo Code».
4. Бонусные баллы (`BONUS` / `PERSONAL_DISCOUNT`) и `additionalDiscountsMarkers` — отдельная задача, в UI пока не выведены.

### C.7. Аудит соответствия полей коду (inspect-api)

Проверка проведена через `oneentry` SDK напрямую к проекту `oe-restaurants.oneentry.cloud` (lang=`en_US`). Зафиксировано на момент проверки.

#### C.7.1. Pages — реальные атрибуты

- **`support`** — ✅ атрибуты добавлены и заполнены в `en_US`: `support_title` (string), `support_description` (text), `support_phone` (string), `support_whatsapp_url` (string), `support_email` (string). Код в [app/support/page.tsx](app/support/page.tsx) читает их напрямую без fallback'ов на dictionary. ⚠️ В `ru_RU` атрибуты пустые — нужно перевести (или подтвердить, что en-only).
- **`services`** — ✅ кроме `service_secondary_href` (пусто). Хардкоды/dict-фолбэки убраны из [app/service/page.tsx](app/service/page.tsx) — все поля читаются напрямую. Заполнено в `en_US`: `service_logo` (SVG), `service_bg_image` (PNG), `service_primary_cta` = `FOOD DELIVERY`, `service_primary_href` = `/shop`, `service_secondary_cta` = `BOOK A TABLE`. Осталось: `service_secondary_href` = `/reservation` — без него вторая кнопка «BOOK A TABLE» не рендерится (graceful fallback).

- **`bookings`** — только `menu_icon`. Код раньше читал `reservation_hero_image`, `reservation_title`, `reservation_description` — **исправлено**: hero теперь берётся из `restaurants.photos[0]`, `restaurants.description`, `localizeInfos.title`.
- **`restaurants`** — `address`, `lat`, `long`, `description` (text), `photos` (groupOfImages), `comforts` (list), `schedule` (timeInterval), `menu_icon`, `phone`. Раньше читался `parent.attributeValues.title.value` — **исправлено** на `parent.localizeInfos.title`.
- **`restaurants/*`** (`restaurant_1/2/3`) — те же что у `restaurants`. Маркер `restaurant_address` — **нет**, исправлено: используется `address`.
- **`menu/*`** (`appetizers`, `dinner`, `soup`, `fresh_juice`, …) — `icon` (заполнен), `service_*` (пустые, унаследовано из шаблона).
- **`filters`** — `cooking_time_filters` (json), `preferences_filters` (json), `price_filters` (string).
- **`blog/*`** — `bg_image`, `banner`, `description`, `action_type`. См. C.2.3. `title`, `promo_image`, `promo_title`, `promo_subtitle`, `promo_cta` — **исправлено** в предыдущем раунде.

#### C.7.2. Product (attribute set `dish`)

Реальные атрибуты у первого продукта (id=13):
`weight` (integer), `calorrage` (integer), `cooking_time` (integer), `preferences` (list), `ingredients` (string), `price` (integer), `currency` (string), `rating` (float), `sku` (string), `cover` (image).

- **`time`, `delivery_time`** — ❌ нет. Удалён fallback в [ProductCard](components/layout/products-grid/components/product-card/ProductCard.tsx).
- **`stars`** — ❌ нет. Удалён fallback в [ProductCard](components/layout/products-grid/components/product-card/ProductCard.tsx).
- **`statusIdentifier`** — у всех товаров `null` (статус не назначен). Код раньше трактовал `statusIdentifier !== 'in_stock'` как «out of stock» → CTA «Add to cart» подменялся подписью «Out of stock» на каждом товаре. **Исправлено**: [AddToCartButton.tsx:62-65](components/layout/product/components/AddToCartButton.tsx#L62-L65) и [JSON-LD availability](app/shop/product/%5Bhandle%5D/page.tsx#L56-L59) теперь блокируют покупку только при явном `statusIdentifier === 'out_of_stock'`. ❓ **Уточнить у клиента:** проставлять ли в админке статусам товаров `in_stock` (для аналитики/SEO) — в текущей логике `null` уже работает как «доступно».

#### C.7.3. Blocks (home_web)

3 блока с identifier'ами `home_promo`, `recommended`, `home_categories`. У всех блоков **нет атрибутов**. Код использует только `block.identifier` как позиционный якорь для рендера — это работает.

[components/layout/product/ProductsGroup.tsx:32](components/layout/product/ProductsGroup.tsx) читает `block.attributeValues?.together_title?.value` для блока `together` (related products) — соответствующий блок в админке надо проверить отдельно (если есть).

#### C.7.4. Dictionary (`static_content`) — что код читает, но в CMS нет

- **`reset_descr`, `send_text`** ([ForgotPasswordForm.tsx](components/forms/ForgotPasswordForm.tsx)) — нет.

> ❓ **Уточнить у клиента:** надо ли расширять `static_content` под все эти UI-строки (для локализации) или достаточно текущих 59 + хардкоды?

### C.8. Auth Providers

#### C.8.1. `google` (OAuth) — нужен на шаге `signin` корзины

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

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

### A.3. Закомментированный код (правило 3.2 — удалить)

| Файл | Строки | Что |
|---|---|---|
| [app/store/providers/StoreProvider.tsx](app/store/providers/StoreProvider.tsx) | 8 | `// import type { AppStore }` |
| [app/store/providers/AuthContext.tsx](app/store/providers/AuthContext.tsx) | 15, 24, 80 | `// import updateUserState`, `// addFavorites,`, `// const favoritesVersion` |
| [components/forms/UserForm.tsx](components/forms/UserForm.tsx) | 17, 105 | `// import AuthError`, `// return <AuthError ... />` |
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
| [components/profile/OrdersList.tsx](components/profile/OrdersList.tsx) | 6 |
| [components/reviews/ReviewsSlideUpPanel.tsx](components/reviews/ReviewsSlideUpPanel.tsx) | 6 |
| [components/static/FilterBottom.tsx](components/static/FilterBottom.tsx) | 6 |
| [components/reservation/ReservationForm.tsx](components/reservation/ReservationForm.tsx) | 6 |

> Действие: проходом по компоненту смотреть `value_px / 4 = N` → `*-N` или `*-N.MM`. Если значение часто повторяется (в 3+ местах) — добавлять токен в `@theme inline`.

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
[components/static/CategoryFilter.tsx](components/static/CategoryFilter.tsx)
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
[components/cart/steps/StepTime.tsx](components/cart/steps/StepTime.tsx)
[components/cart/steps/StepSignIn.tsx](components/cart/steps/StepSignIn.tsx)
[components/cart/steps/StepVerification.tsx](components/cart/steps/StepVerification.tsx)
[components/cart/steps/StepAddress.tsx](components/cart/steps/StepAddress.tsx)
[components/cart/steps/StepOrder.tsx](components/cart/steps/StepOrder.tsx)
[components/cart/steps/StepPayment.tsx](components/cart/steps/StepPayment.tsx)
[components/cart/steps/StepResult.tsx](components/cart/steps/StepResult.tsx)

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

### B.6. Резервация (`service_table.html`, `service_date.html`, `service_time.html` ↔ `app/reservation`)

- 🌐 Live: <http://localhost:3000/reservation>
- 📄 Static:
  - main form:
  [service_table.html](static-html/service_table.html)
  <file:///d:/OneEntry/nextjs-restaurant/static-html/service_table.html>

  - date picker:
  [service_date.html](static-html/service_date.html)
  <file:///d:/OneEntry/nextjs-restaurant/static-html/service_date.html>

  - time picker:
  [service_time.html](static-html/service_time.html)
  <file:///d:/OneEntry/nextjs-restaurant/static-html/service_time.html>

  - sign-up:
  [service_Sign_up.html](static-html/service_Sign_up.html)
  <file:///d:/OneEntry/nextjs-restaurant/static-html/service_Sign_up.html>

  - reservation about:
  [mob_about_reservation.html](static-html/mob_about_reservation.html)
  <file:///d:/OneEntry/nextjs-restaurant/static-html/mob_about_reservation.html>

- 📁 Файлы проекта:
[app/reservation/page.tsx](app/reservation/page.tsx)
[components/reservation/ReservationForm.tsx](components/reservation/ReservationForm.tsx)
[components/reservation/RestaurantSelect.tsx](components/reservation/RestaurantSelect.tsx)
[components/ui/DatePickerSheet.tsx](components/ui/DatePickerSheet.tsx)
[components/ui/TimePickerSheet.tsx](components/ui/TimePickerSheet.tsx)

| # | Что не так | Файл | Severity |
|---|---|---|---|
| B.6.5 | `bg-[url('/images/picture/bg_cart.png')] ... md:bg-none` — на md+ фон убирается. Сверить со static-html — там градиентная подложка может быть на всех брейкпоинтах. Заглянуть в `service_table.html` | [app/reservation/page.tsx:63](app/reservation/page.tsx#L63) | — (требует визуала) |
| B.6.6 | `RestaurantSelect.label` берётся из `address` или `localizeInfos.title`. В `static-html/service_table.html` дропдаун ресторана показывает скорее всего читаемое название («Restaurant 1» / название локации), а не адрес. Сейчас приоритет адреса — может выглядеть избыточно длинной строкой | [app/reservation/page.tsx:34-42](app/reservation/page.tsx#L34) | P2 |

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

#### C.1.4. `review_form` — сабмит отвергает авторизованного юзера

Сабмит отзыва из [components/reviews/ReviewForm.tsx](components/reviews/ReviewForm.tsx) → `getApi().FormData.postFormsData({ formIdentifier: 'review_form', formModuleConfigId: 2, moduleEntityIdentifier: String(productId), formData: [...] })` стабильно возвращает `400 "You must authorize to send data"` **даже с валидным user-`accessToken`** в заголовке `Authorization: Bearer ...`.

Воспроизведено в [.claude/temp/test-review-with-user.mjs](.claude/temp/test-review-with-user.mjs) (логин `kvasssukr.net@gmail.com`, JWT свежий, fetch перехвачен — header уходит):

```text
postFormsData → 400 "You must authorize to send data"
```

Сервер реально проверяет токен — на любом сломанном теле он возвращает осмысленные field-ошибки (`empty form data section`, `wrong form's attribute type`, `Incorrect formIdentifier for provided config`). Generic `"You must authorize to send data"` приходит **только** когда тело прошло field-валидацию — значит, после валидации полей выполняется ещё одна permission-проверка, и она режет нашего юзера.

Текущее состояние формы (через `Forms.getFormByMarker('review_form')`):

- `id: 5`, `type: 'rating'`, `processingType: 'script'`
- `moduleFormConfigs[0]`: `id: 2`, `moduleIdentifier: 'catalog'`, `isAnonymous: false`, `commentOnlyUserData: false`, `viewOnlyUserData: false`, `isClosed: false`
- `entityIdentifiers: [{ id: "menu", isNested: true }, { id: 37, isNested: false }]`

User `kvasssukr.net@gmail.com` (id 31, `groups: [7]`) — прав, видимо, не хватает.

> ❓ **Уточнить у клиента / поправить в админке:**
>
> 1. Открыть `Forms → review_form → Script tab`. `processingType: 'script'` означает, что после field-валидации запускается серверный скрипт — он, вероятно, и возвращает `"You must authorize to send data"`. Проверить, что в скрипте нет проверки роли/группы, которой нет у обычного зарегистрированного user-а.
> 2. Permissions группы `7` (или дефолтной user-группы) для модуля `catalog` / форм типа `rating` — должно быть «can submit».
> 3. Альтернатива: `entityIdentifiers[0].id` сейчас строка `"menu"` (pageUrl-маркер). В части OneEntry-проектов сюда ждут numeric page id (для menu это `1`). Если script сверяется по `id`-числу — строка `"menu"` его не пройдёт. Попробовать заменить на `{ id: 1, isNested: true }` либо явно перечислить sub-pages (`{ id: 8, isNested: false }` — main_courses, и т.п.).
>
> На стороне кода фикса не требуется — `ReviewForm.tsx` шлёт корректное тело и валидный Bearer (см. логи fetch в `.claude/temp/test-review-with-user.mjs`). Как только админская конфигурация позволит сабмит — пометить ✅ и удалить пункт.

### C.2. Недостающие страницы

#### C.2.3. Дочерние страницы под `blog` (акции)

В админке: `birthday_offer`, `business_lunch`, `deal_of_the_day`. В вёрстке также упоминаются `kids_menu`, `happy_monday`, `dinner_fix_price` — создать недостающие child-pages под `blog`. Реальный attribute set `blog_page` (по результату [inspect-api](.claude/temp/inspect-blog.mjs)):

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

### C.3. Похожие товары (related products)

Страница [app/shop/product/[handle]/page.tsx](app/shop/product/[handle]/page.tsx) рендерит секцию «Featured objects» через [components/layout/product/RelatedItems.tsx](components/layout/product/RelatedItems.tsx) → SDK `Products.getRelatedProductsById`. Чтобы секция реально что-то показывала:

- В админке для каждого блюда открыть карточку товара и привязать минимум 4–6 «похожих» через стандартный механизм OneEntry «Related products». Без этого `getRelatedProductsById` возвращает пустой список и секция не рендерится (graceful fallback).
- (Опционально) Заголовок секции — берётся из `static_content.featured_objects` (string), fallback `"Featured objects"`. Если хочется локализованный заголовок — добавить атрибут:

  | marker              | type   | title             |
  |---------------------|--------|-------------------|
  | `featured_objects`  | string | Featured objects  |

### C.4. Словарь `static_content` — что осталось

Словарь подгружается через [app/dictionaries.ts](app/dictionaries.ts) (атрибут-сет `static_content`, нормализован в `Record<marker, attr>`, `value` = `initialValue` если локализация не заполнена). В админке уже **77 маркеров**. Все обращения в коде переведены на существующие маркеры — несуществующие удалены/перепривязаны:

- [ReservationForm.tsx](components/reservation/ReservationForm.tsx) — `reservation_submit_text` → `submit_text`, `reservation_success_title` → `info_text`, `reservation_success_text` → `reservation_confirmed`.
- [UserForm.tsx](components/forms/UserForm.tsx) — `save_button_text` → `submit_text`.

Хардкод-фразы (старые находки):

- [components/cart/steps/StepPayment.tsx](components/cart/steps/StepPayment.tsx): wired — `select_payment_text`, `pay_cash_text`, `comment_order`, `another_person_text`. Хардкод (нет маркера): «Pay with» (PayPal label), «Credit & Debit Cards», placeholder «phone number» под чекбоксом.
- [components/cart/CartWizard.tsx](components/cart/CartWizard.tsx) — STEP_TITLES уже подцеплены к `sign_in_text`/`verification_text`/`address_text`/`select_payment_text`. «Cart», «Select time», «Success», «Error» — нет соответствующих маркеров, оставлены хардкодом.

#### C.4.1. Завести новые маркеры в админке (атрибут-сет `static_content`)

Все ниже — `type: string`. Сгруппировано по экранам, чтобы заполнять было удобнее. `title` в таблице ниже — это и текст, который виден в админке как title маркера, и его `initialValue` (английский дефолт). После создания — прокинуть `dict?.<marker>?.value` в соответствующие компоненты (правка кода).

##### Профиль / аккаунт

Используется в: [components/profile/ProfilePopup.tsx](components/profile/ProfilePopup.tsx), [components/forms/UserForm.tsx](components/forms/UserForm.tsx), [components/profile/ProfileTabs.tsx](components/profile/ProfileTabs.tsx), [components/layout/header/nav/user-menu/LogoutMenuItem.tsx](components/layout/header/nav/user-menu/LogoutMenuItem.tsx).

| marker                  | type   | title         |
|-------------------------|--------|---------------|
| `my_profile_title`      | string | My Profile    |
| `profile_tab_personal`  | string | Personal      |
| `profile_tab_orders`    | string | Orders        |
| `profile_tab_favorites` | string | Favorites     |
| `logout_text`           | string | Logout        |
| `edit_button`           | string | Edit          |
| `delete_button`         | string | Delete        |
| `add_address_button`    | string | + Add Address |
| `street_label`          | string | Street        |
| `house_label`           | string | House         |
| `floor_label`           | string | Floor         |
| `data_saved_toast`      | string | Data saved!   |

##### Заказы (страница `/profile/orders`)

Используется в: [components/profile/OrdersList.tsx](components/profile/OrdersList.tsx). Все ключи из таблицы прокинуты через проп `dict` (см. [app/profile/orders/page.tsx](app/profile/orders/page.tsx)) — до создания маркеров в админке UI отрендерит fallback-литералы.

| marker                     | type   | title                                |
|----------------------------|--------|--------------------------------------|
| `contact_courier_button`   | string | Contact with the courier             |
| `repeat_order_button`      | string | Repeat order                         |
| `loading_orders_text`      | string | Loading orders...                    |
| `no_orders_text`           | string | You have no orders yet.              |
| `go_shopping_button`       | string | Go to shopping                       |
| `active_orders_title`      | string | Active orders                        |
| `no_active_orders_text`    | string | You have no active orders.           |
| `orders_history_title`     | string | Orders History                       |
| `no_history_orders_text`   | string | You have no past orders yet.         |
| `orders_load_error_prefix` | string | Unable to load orders:               |
| `orders_signin_prompt`     | string | Please sign in to view your orders.  |
| `leave_review_button`      | string | Leave a review                       |
| `cancel_review_button`     | string | Cancel review                        |

##### Избранное (страница `/profile/favorites`)

Используется в: [components/profile/FavoritesGrid.tsx](components/profile/FavoritesGrid.tsx).

| marker              | type   | title                      |
|---------------------|--------|----------------------------|
| `no_favorites_text` | string | You have no favorites yet. |

##### Корзина — пустое состояние

Используется в: [components/layout/cart/components/EmptyCart.tsx](components/layout/cart/components/EmptyCart.tsx). Существующий `empty_cart_text` («Your cart is empty») — тёплое предложение, остаётся для inline-состояний; `empty_cart_title` — короткий heading.

| marker              | type   | title      |
|---------------------|--------|------------|
| `empty_cart_title`  | string | Empty cart |
| `go_to_shop_button` | string | Go to shop |

##### Cart wizard / шаги

Используется в: [components/cart/CartWizard.tsx](components/cart/CartWizard.tsx) (STEP_TITLES).

| marker             | type   | title       |
|--------------------|--------|-------------|
| `cart_step_text`   | string | Cart        |
| `select_time_text` | string | Select time |
| `success_text`     | string | Success     |
| `error_text`       | string | Error       |

##### Toasts: cart / favorites (с плейсхолдером `{title}`)

Используется в: [components/layout/product/components/AddToCartButton.tsx](components/layout/product/components/AddToCartButton.tsx), [components/layout/product/components/DecreaseButton.tsx](components/layout/product/components/DecreaseButton.tsx), [components/layout/product/product-single/FavoritesButton.tsx](components/layout/product/product-single/FavoritesButton.tsx), [components/layout/products-grid/components/product-card/CartButton.tsx](components/layout/products-grid/components/product-card/CartButton.tsx), [components/layout/products-grid/components/product-card/HeartCardButton.tsx](components/layout/products-grid/components/product-card/HeartCardButton.tsx). Шаблон `{title}` подменяется в коде на название блюда (`String.replace` / template-literal).

| marker                            | type   | title                                       |
|-----------------------------------|--------|---------------------------------------------|
| `product_added_cart_toast`        | string | Product {title} added to cart!              |
| `product_removed_cart_toast`      | string | Product {title} removed from cart!          |
| `product_added_favorites_toast`   | string | Product {title} added to Favorites!         |
| `product_removed_favorites_toast` | string | Product {title} removed from Favorites!     |
| `auth_error_prefix`               | string | Auth error!                                 |

##### Auth / формы

Используется в: [components/forms/PhoneAuthForm.tsx](components/forms/PhoneAuthForm.tsx), [components/forms/ResetPasswordForm.tsx](components/forms/ResetPasswordForm.tsx).

| marker                   | type   | title                                       |
|--------------------------|--------|---------------------------------------------|
| `phone_required_error`   | string | Please enter your phone number.             |
| `code_send_error`        | string | Could not send the code. Please try again.  |
| `new_password_label`     | string | New password                                |
| `change_password_button` | string | Change password                             |

##### Календарь / выбор даты-времени

Используется в: [components/forms/CalendarForm.tsx](components/forms/CalendarForm.tsx), [components/reservation/ReservationForm.tsx](components/reservation/ReservationForm.tsx).

| marker                        | type   | title              |
|-------------------------------|--------|--------------------|
| `date_label`                  | string | Date               |
| `select_date_placeholder`     | string | Select date        |
| `select_time_placeholder`     | string | Select time        |
| `select_datetime_placeholder` | string | Select date & time |

##### Резервация (страница `/reservation`)

Используется в: [components/reservation/ReservationForm.tsx](components/reservation/ReservationForm.tsx). `book_button` отделён от `submit_text` (default «Submit»), потому что в этой форме CTA — именно «Book».

| marker                   | type   | title               |
|--------------------------|--------|---------------------|
| `restaurant_placeholder` | string | Restaurant choosing |
| `book_button`            | string | Book                |

##### Поддержка (страница `/support`)

Используется в: [app/support/page.tsx](app/support/page.tsx).

| marker                    | type   | title                                |
|---------------------------|--------|--------------------------------------|
| `support_call_prompt`     | string | Would you like to call?              |
| `support_question_prompt` | string | Would you like to ask a question?    |

##### Главная

Используется в: [components/home/HomePromo.tsx](components/home/HomePromo.tsx).

| marker             | type   | title      |
|--------------------|--------|------------|
| `promotions_title` | string | Promotions |

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
- [MenuButton.tsx](components/layout/header/nav/MenuButton.tsx) — `Open menu` → `open_menu_label`.
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

> ❓ **Уточнить у клиента:** для toast-фраз с `{title}` (5 маркеров в подразделе «Toasts») — устраивает ли формат с плейсхолдером `{title}` (код подменяет на название блюда), либо проще держать раздельные префикс/суффикс маркеры (e.g. `added_to_cart_suffix = " added to cart!"`)? Шаблон с `{title}` гибче для переводов («Блюдо X добавлено» vs «X added»), но требует подмены в рантайме.
>
> ❓ **Уточнить у клиента:** placeholder поля Street в попапе «My Profile» сейчас захардкожен как «OneEntry» ([ProfilePopup.tsx:347](components/profile/ProfilePopup.tsx#L347)) — похоже на тестовый стаб. Оставить пустым (`""`), заменить на пример (`«ул. Тверская»` / `«Main St»`) или завести под маркер? То же с примерами «40»/«27» для House/Floor.

### C.5. Профиль — попап «My Profile» (детальный personal/payment/address)

[components/profile/ProfilePopup.tsx](components/profile/ProfilePopup.tsx) — порт верстки [static-html/details_personal.html](static-html/details_personal.html). Открывается из иконки пользователя в шапке. Сейчас:

- **Address** — список адресов (street/house/floor) + map preview (`/images/picture/maps.png` static), Add/Delete/Apply. **Локально**, не персистится. Нужно завести в `user`-форме атрибут:

  | marker      | type | title                    | notes                                                        |
  |-------------|------|--------------------------|--------------------------------------------------------------|
  | `addresses` | json | Saved delivery addresses | Массив `{ id, street, house, floor }` — адресная книга юзера |

  Чекаут ([StepAddress.tsx](components/cart/steps/StepAddress.tsx)) должен предлагать сохранённые адреса из `user.formData.addresses` как `<select>` (вместо ввода с нуля); попап «My Profile» — читать/писать тот же атрибут через `api.Users.updateUser`.

- **Map preview** — статичный PNG. Если нужна интерактивная карта (Google Maps / Yandex / Mapbox) — задача отдельная.

Когда ответы получены — таски на код:

1. Cards: persist в выбранное хранилище + load в `useEffect` из `AuthContext.user`.
2. Addresses: persist + загружать в чекаут как `<select>` сохранённых.

### C.6. Платежи

`PROJECT_URL/payments/accounts` — `cash` (оплата при доставке) и `stripe` (карты через hosted Stripe Checkout). Оба передаются в [StepPayment](components/cart/steps/StepPayment.tsx) через `addPaymentMethod`. Отдельная форма ввода карты в приложении не нужна — Stripe собирает реквизиты на своей странице. ✅ Локальный `card:<id>` поток (бывший `StepAddCard` / `cart_add_card.html`) удалён.

> ✅ **Подтверждено через `/api/content/payments/accounts` 2026-05-03:** `cash` (id=2) теперь имеет `isUsed: true` — клиент привязал аккаунт к orders-storage `delivery_order` в админке. `createOrder` с `paymentAccountIdentifier: 'cash'` проходит без 400.

#### C.6.1. Форма `delivery_order` — обязательные поля

Через MCP подтверждено, что форма `delivery_order` имеет следующие атрибуты:

| marker             | type         | validator             | status |
|--------------------|--------------|-----------------------|--------|
| `delivery_address` | string       | required (strict)     | ✅     |
| `contact_phone`    | string       | required (strict)     | ✅     |
| `floor`            | string       | required (без strict) | ❌     |
| `delivery_time`    | timeInterval | —                     | ❌     |
| `comment`          | string       | —                     | ✅     |
| `apartment_number` | string       | —                     | ❌     |
| `alt_phone`        | string       | —                     | ✅     |
| `addresses`        | json         | —                     | ❌     |

Как заполняется в коде:

- `delivery_address` — [StepAddress.tsx:80](components/cart/steps/StepAddress.tsx#L80), `addData` по нажатию Continue.
- `contact_phone` — [StepAddress.tsx:84](components/cart/steps/StepAddress.tsx#L84), берём `phone` / `phone_reg` / `contact_phone` из `user.formData`.
- `comment`, `alt_phone` — [StepPayment.tsx](components/cart/steps/StepPayment.tsx) (`alt_phone` — только если включён чекбокс «another person»).
- `delivery_time` — кодом отправляется маркер `time` (cart slice), а не `delivery_time` — поле игнорируется. [useCreateOrder.ts:87](app/api/hooks/useCreateOrder.ts#L87) фильтрует `time` из formData.
- `floor`, `apartment_number`, `addresses` — UI пока не собирает (см. C.5 про адресную книгу юзера).

**Открытые задачи:**

- `floor` — добавить поле в [StepAddress.tsx](components/cart/steps/StepAddress.tsx) рядом со street (или брать из адресной книги юзера, см. C.5). Иначе при `requiredValidator: { strict: true }` (если клиент его выставит) — будет 400 после `contact_phone`.
- `delivery_time` — пробрасывать выбранный slot/datetime в `addData({ marker: 'delivery_time', type: 'timeInterval', value: <ISO range> })`. Сейчас «40-45 min» / scheduled-input нигде не сохраняются в OneEntry, только в локальном Redux.
- `apartment_number` — опциональное поле, можно добавить рядом с floor.

> ❓ **Уточнить у клиента:** хотим ли мы реально сохранять `floor` / `apartment_number` / `delivery_time` в заказе (для курьера), или эти поля можно убрать из формы `delivery_order` в админке?

Дополнительно:

Что нужно настроить в админке OneEntry для работающего промо:

1. **Discounts → создать `DISCOUNT`** с `discountValue: { applicability, discountType, value, maxAmount? }`. Например, `applicability: TO_ORDER`, `discountType: PERCENT`, `value: 10` — 10% на заказ.
2. **Conditions** (опционально): `MIN_CART_AMOUNT`, `PRODUCT_IN_CART`, `CATEGORY_IN_CART` и т.д. — определяют, когда купон применим. Если не выполнились — `previewOrder` вернёт `totalSumWithDiscount === totalSum`, UI покажет «Coupon does not apply to this cart».
3. **Coupons → сгенерировать код** (`isReusable: true/false`) и привязать к нужному `DISCOUNT`. Юзер вводит этот код в поле «Promo Code».
4. Бонусные баллы (`BONUS` / `PERSONAL_DISCOUNT`) и `additionalDiscountsMarkers` — отдельная задача, в UI пока не выведены.

### C.7. Аудит соответствия полей коду (inspect-api)

Проверка проведена через `oneentry` SDK напрямую к проекту `oe-restaurants.oneentry.cloud` (lang=`en_US`). Зафиксировано на момент проверки.

#### C.7.1. Pages — реальные атрибуты

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

### C.8.2. Auth-формы вне CMS (PhoneAuthForm удалён, Reset/Verification — фронт-only)

Подтверждено клиентом 2026-05-04: auth-flow формы НЕ должны быть `getFormByMarker`-формами из админки. Они напрямую дёргают SDK с фиксированной сигнатурой:

| Форма / экран | SDK метод | Статус |
|---|---|---|
| `PhoneAuthForm` | — | ❌ удалён, не нужен. Phone-провайдер из `getAuthProviders()` теперь падает в `SignInForm` (тот же email/login flow). |
| `ResetPasswordForm` | `AuthProvider.changePassword('email', login, 'otp', 1, code, newPwd, repeatPwd)` | ✅ статическая фронт-форма (нет в админке) — корректно |
| `VerificationForm` | `AuthProvider.checkCode('email', login, 'otp', code)` или `activateUser(...)` после регистрации | ✅ статический OTP-input — корректно |
| `ForgotPasswordForm` | `AuthProvider.generateCode('email', login, 'reset_password')` | ✅ корректно |

MCP-правило «Forms ALWAYS dynamic» (`getFormByMarker` + рендер по `attribute.type`) применяется только к контентным формам (Contact Us, Sign Up, Reservation, заказ — те, что собираются админом в CMS). Auth-flow методы с зафиксированной SDK-сигнатурой остаются обычными React-формами; динамика тут не нужна и привела бы к избыточному API-вызову `getFormByMarker` без новых данных.

### C.9. Меню `user_menu` — пункты профильного дропдауна

[components/layout/header/nav/NavItemProfile.tsx](components/layout/header/nav/NavItemProfile.tsx) теперь рендерит выпадающее меню под иконкой профиля для авторизованных юзеров — пункты тянутся из CMS-меню с маркером `user_menu`. На десктопе это меню заменило табы `Personal / Orders / Favorites` (последние удалены из [app/profile/layout.tsx](app/profile/layout.tsx) — табов в дизайне нет).

Сейчас в админке `user_menu` уже создан, но содержит **не те** пункты:

> ⚠️ В коде сейчас линки строятся как `/${page.pageUrl}` (см. [NavItemProfile.tsx](components/layout/header/nav/NavItemProfile.tsx)). Это значит, что для совпадения с реальными Next.js-маршрутами `pageUrl` в CMS должен быть **полным** путём без ведущего `/` — например, `profile/orders`, а не просто `orders`. Если такой формат не подходит OneEntry — альтернатива: переименовать роуты в `app/` под flat-структуру (`app/orders`, `app/favorites`) и тогда `pageUrl: orders`/`favorites` будут совпадать. Решение за командой админки.

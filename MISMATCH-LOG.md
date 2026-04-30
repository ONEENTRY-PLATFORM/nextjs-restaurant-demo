# MISMATCH-LOG — расхождения вёрстки и проекта

Журнал расхождений между `static-html/` (эталон, правило 1) и Next.js-реализацией.
Заполняется по мере ручной сверки.

## Сводка (на 2026-04-30)

| Раздел | Файлов | P0 | P1 | P2 | P3 |
|---|---|---|---|---|---|
| A. Автоматические находки | — | — | 1 | ~25 | ~190 |
| B.1 Главная | 5 | — | 3 | 3 | 1 |
| B.2 Карточка товара | 5 | — | 1 | 2 | 1 |
| B.3 Каталог/категория | 6 | — | — | — | — |
| B.4 Корзина и чекаут | 9 | — | 2 | 1 | 2 |
| B.5 Профиль и попапы | 6 | — | — | 3 | 3 |
| B.6 Резервация | 4 | — | 1 | 3 | 1 |
| B.7 Поддержка/Service | 6 | — | 2 | 3 | 2 |
| B.8 Промо | 3 | — | 1 | 2 | 1 |

### Топ-приоритет (P0/P1) — фиксить первыми

1. **B.7.6 / B.7.7** — Support: эмодзи вместо SVG-иконок, DOM-структура страницы поддержки не совпадает со static (форма vs два контактных блока).
2. **B.1.1** — `console.log(banners)` в проде ([HomePromo.tsx:23](components/home/HomePromo.tsx#L23)).

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

| # | Что не так | Файл | Severity |
|---|---|---|---|

| B.1.7 | `lg:max-w-120` (= 480px) на h1 — в `static-html` `lg:max-w-[440px]`, должно быть `lg:max-w-110` | [components/layout/header/index.tsx:87](components/layout/header/index.tsx#L87) | P2 |

### B.2. Карточка товара (`pk_product_details.html` ↔ `app/shop/product/[handle]`)

- 🌐 Live: <http://localhost:3000/shop/product/13> _(заменить `13` на любой реальный product id, например через `/shop`)_
- 📄 Static: [static-html/pk_product_details.html](static-html/pk_product_details.html) · <file:///d:/OneEntry/nextjs-restaurant/static-html/pk_product_details.html>
- 📁 Файлы проекта: [app/shop/product/[handle]/page.tsx](app/shop/product/[handle]/page.tsx) · [components/layout/product/index.tsx](components/layout/product/index.tsx) · [components/layout/product/product-single/ProductDetails.tsx](components/layout/product/product-single/ProductDetails.tsx) · [components/layout/product/product-single/ProductCover.tsx](components/layout/product/product-single/ProductCover.tsx) · [components/layout/product/components/AddToCartButton.tsx](components/layout/product/components/AddToCartButton.tsx)

| # | Что не так | Файл | Severity |
|---|---|---|---|

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
| B.4.1 | `attrs.sale?.value` читается в 2 местах для расчёта unit-цены, хотя `sale` подтверждён как ненужный (см. чат). Граceful fallback к `price` работает, но кода стало бы меньше без `sale` | [components/cart/steps/StepOrder.tsx:53,70-74](components/cart/steps/StepOrder.tsx#L53-L74) | P3 |
| B.4.6 | Поле «Promo Code» — кнопка «Apply Code» сейчас no-op. Согласно `ONEENTRY-ADMIN-SETUP.md §6` это известный пробел (нужен бэкенд механизм промокодов). **Не баг — задокументировано** | [components/cart/steps/StepOrder.tsx:118-133](components/cart/steps/StepOrder.tsx#L118-L133) | — |
| B.4.8 | StepPayment добавляет `alt_phone` через `addData`, но поле ещё не существует в `delivery_order` (см. ONEENTRY-ADMIN-SETUP §1.2). Сабмит не упадёт, но значение не сохранится — действие на стороне админа | [components/cart/steps/StepPayment.tsx:44-52](components/cart/steps/StepPayment.tsx#L44-L52) | P2 |
| B.4.9 | `auth-попап` в `CartWizard` рендерит `signin`/`verification` шаги поверх корзины как центрированный popup. Проверить, что `pk_login.html` / `pk_verif.html` подтверждают этот паттерн (на десктопе — popup поверх cart, на мобиле — fullscreen popup, корзина скрыта) | [components/cart/CartWizard.tsx:36-43,80-104](components/cart/CartWizard.tsx#L80-L104) | — (требует визуала) |
| B.4.10 | `<BurgerOrangeIcon />` в шапке корзины-мобильной — это иконка из набора в `components/icons/`. В `static-html/cart_cart.html` справа должен быть бургер-меню или иконка переключения между mobile/desktop макетами. Сверить, что иконка совпадает | [components/cart/CartWizard.tsx:166](components/cart/CartWizard.tsx#L166) | — (требует визуала) |

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
| B.5.2 | Хардкод-английские строки: `Loading...`, `Please sign in to view your profile.` — должны идти через `static_content` словарь для локализации | [app/profile/page.tsx:21,27](app/profile/page.tsx#L21) | P2 |
| B.5.3 | `bg-ink/60`, `text-paper/80`, `text-paper/90` — корректное использование токенов с alpha (Tailwind v4). **В плюс** | [app/profile/page.tsx:21,26](app/profile/page.tsx#L21) | — |
| B.5.4 | В FavoritesPopup для карточки товара `md:w-[calc(50%-30px)]` — arbitrary calc. Если эта формула повторяется (для grid из 2 колонок с gap=60px), вынести в утилитарный класс или token. Проверить статикой `m_favorites.html` / `pk_favorites.html` | [components/profile/FavoritesPopup.tsx:122](components/profile/FavoritesPopup.tsx#L122) | P3 |
| B.5.5 | `border-gray-300` в карточке избранного — нет такого токена в `@theme`. Если у проекта стандартный border — `border-paper/30` или ввести `--color-border-soft` | [components/profile/FavoritesPopup.tsx:122](components/profile/FavoritesPopup.tsx#L122) | P2 |
| B.5.6 | Хардкод-вёрстка адресов в ProfilePopup: `initialAddresses` с `id: 'a1', street: 'OneEntry', house: '40', floor: '27'`. По CLAUDE.md правилу 2 это легитимный мок, но в `ONEENTRY-ADMIN-SETUP.md §5` уже есть открытый вопрос «где хранить адреса». **Не баг — задокументировано** | [components/profile/ProfilePopup.tsx:26-28](components/profile/ProfilePopup.tsx#L26-L28) | — |
| B.5.7 | `HIDDEN_PROFILE_MARKERS` исключает `user_address`, `user_flat`, `user_floor` — но в `static-html/details_personal.html` блок Address НЕ показывает эти поля под секцией Personal (они в отдельной секции Address). Логика верна, но комментарий стоило бы расширить | [components/profile/ProfilePopup.tsx:32-39](components/profile/ProfilePopup.tsx#L32-L39) | — |
| B.5.8 | OrdersList дублирует `formatDate` хелпер с `app/page.tsx:47` — оба файла имеют идентичный код (см. JSDoc-комментарий). Вынести в `app/utils/formatDate.ts` | [components/profile/OrdersList.tsx:31-39](components/profile/OrdersList.tsx#L31-L39), [app/page.tsx:47-55](app/page.tsx#L47-L55) | P2 |

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
| B.6.1 | Hero-картинка ресторана рендерится через `<img>` с `eslint-disable-next-line @next/next/no-img-element`. URL приходит из OneEntry `photos` — может быть `next/image` с `width/height/sizes`, чтобы получить оптимизацию + lazy-load. Текущий `<img>` блокирует image optimization | [app/reservation/page.tsx:67-72](app/reservation/page.tsx#L67-L72) | P2 |
| B.6.3 | `text-[24px] md:text-[32px]` на h1 — повтор паттерна (B.5.1). Заменить на `text-2xl md:text-3xl` или ввести токен `--text-page-heading` | [app/reservation/page.tsx:75](app/reservation/page.tsx#L75) | P3 |
| B.6.4 | Английский хардкод сообщений: `Book a table` (fallback title), `Reservation form is not available...`, `Please configure...`. Все должны идти через `static_content` словарь для локализации | [app/reservation/page.tsx:56,89-90,112,115](app/reservation/page.tsx#L56) | P2 |
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
| B.7.3 | CMS-атрибуты `service_logo`, `service_bg_image`, `service_primary_cta`, `service_primary_href`, `service_secondary_cta`, `service_secondary_href` — **существуют в OneEntry, но значения пусты** (см. `ONEENTRY-ADMIN-SETUP.md §7.1`). Используются хардкоды `'FOOD DELIVERY'`, `'BOOK A TABLE'`, `/shop`, `/reservation` — fallback работает. Действие на стороне админа | [app/service/page.tsx:40-48](app/service/page.tsx#L40-L48) | — |
| B.7.4 | `Restaurant — Delivery & Reservation` — английский хардкод title в metadata. Маркер из словаря был бы предпочтителен | [app/service/page.tsx:96,99](app/service/page.tsx#L96) | P2 |

#### B.7b. SupportPage (`service_support.html`)

- 🌐 Live: <http://localhost:3000/support>
- 📄 Static: [service_support.html](static-html/service_support.html) · <file:///d:/OneEntry/nextjs-restaurant/static-html/service_support.html> · [m_support.html](static-html/m_support.html) · <file:///d:/OneEntry/nextjs-restaurant/static-html/m_support.html>
- 📁 Файлы проекта: [app/support/page.tsx](app/support/page.tsx) · [components/forms/ContactUsForm.tsx](components/forms/ContactUsForm.tsx)

| # | Что не так | Файл | Severity |
|---|---|---|---|
| B.7.5 | `text-[24px] md:text-[32px]` на h1 — повтор паттерна (B.5.1, B.6.3) | [app/support/page.tsx:31](app/support/page.tsx#L31) | P3 |
| B.7.6 | Эмодзи в ссылках: `📞 {phone}`, `✉ {email}`. В `static-html/service_support.html` используются SVG-иконки `watsap.svg` / `call.svg`. Заменить эмодзи на SVG-иконки из `components/icons/` | [app/support/page.tsx:47,65](app/support/page.tsx#L47) | P1 |
| B.7.7 | `static-html/service_support.html` показывает блочный layout с двумя карточками («Would you like to call?» / «Would you like to ask a question?») и круглыми иконками WhatsApp+phone. Текущая реализация — одна горизонтальная полоса 3 кнопок (phone/WhatsApp/email). Структура DOM не совпадает с макетом | [app/support/page.tsx:41-68](app/support/page.tsx#L41-L68) | P1 |
| B.7.8 | Хардкод `Write to us`, `Contact support`, `Support` (fallback). Должны идти через `static_content` | [app/support/page.tsx:20,73,92](app/support/page.tsx#L20) | P2 |
| B.7.9 | `static-html/service_support.html` НЕ содержит формы Contact-Us — только два контактных блока. В проекте форма всё ещё есть (см. удалённую секцию 1.1 ONEENTRY-ADMIN-SETUP). С клиентом форма подтверждена как нужна (`contact_us` создан в админке), но это значит макет support-страницы **отличается от static-html** — ✅ намеренно | [app/support/page.tsx:70-75](app/support/page.tsx#L70-L75) | — |

### B.8. Промо (`pk_promo_BIRTHDAY.html`, `pk_promo_day.html` ↔ `app/promo/[handle]`)

- 🌐 Live: <http://localhost:3000/promo/birthday_offer> · <http://localhost:3000/promo/deal_of_the_day> · <http://localhost:3000/promo/business_lunch> _(заполненные blog-страницы из админки)_
- 📄 Static:
  - birthday: [pk_promo_BIRTHDAY.html](static-html/pk_promo_BIRTHDAY.html) · <file:///d:/OneEntry/nextjs-restaurant/static-html/pk_promo_BIRTHDAY.html>
  - day: [pk_promo_day.html](static-html/pk_promo_day.html) · <file:///d:/OneEntry/nextjs-restaurant/static-html/pk_promo_day.html>
- 📁 Файлы проекта: [app/promo/[handle]/page.tsx](app/promo/[handle]/page.tsx) · [components/promo/PromoCard.tsx](components/promo/PromoCard.tsx)

| # | Что не так | Файл | Severity |
|---|---|---|---|
| B.8.2 | h1 вместо h2 — в `static-html/pk_promo_BIRTHDAY.html:103` использован `<h2>`. h1 семантически правильнее (это главный заголовок страницы), но не 1:1 со static. Уточнить у дизайнера | [app/promo/[handle]/page.tsx:68](app/promo/[handle]/page.tsx#L68) | P2 |
| B.8.4 | `mt-8` (=32px) на CTA-кнопке. В static-html `mt-[50px]` (=50px). Должно быть `mt-12.5` или ввести токен | [app/promo/[handle]/page.tsx:79](app/promo/[handle]/page.tsx#L79) | P1 |
| B.8.5 | `<img>` через `eslint-disable @next/next/no-img-element` — то же что B.6.1, потеря image optimization | [app/promo/[handle]/page.tsx:64-65](app/promo/[handle]/page.tsx#L64-L65) | P2 |
| B.8.6 | Хардкод `'Promo'` (fallback в metadata), `'Order now'` (fallback CTA). Должны идти через `static_content` | [app/promo/[handle]/page.tsx:58,102,105](app/promo/[handle]/page.tsx#L58) | P2 |
| B.8.7 | `text-[16px]` на CTA-кнопке — `text-base` (16px стандартный) | [app/promo/[handle]/page.tsx:79](app/promo/[handle]/page.tsx#L79) | P3 |
| B.8.8 | h1 размер `text-[20px]` соответствует static, цвет `text-brand` правильно использует токен (в static был `text-[#ec722b]` — проект уже исправил). **В плюс** | [app/promo/[handle]/page.tsx:68](app/promo/[handle]/page.tsx#L68) | — |

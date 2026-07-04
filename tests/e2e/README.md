# E2E-тесты (Playwright)

Карта покрытия и конвенции для `tests/e2e/`. Полные правила — [CLAUDE.md §7](../../CLAUDE.md).

## Запуск

```bash
npm run test:e2e:prod           # прод-сборка (next build + start), все проекты — как в CI
npx playwright test <file> --project=chromium   # быстрый прогон против запущенного `next dev` (:3000)
npx playwright test <file> --project=mobile-chrome  # мобильные (bottom-menu / дроверы)
npx playwright test --ui        # интерактивный режим
```

Проекты: `chromium`, `firefox`, `webkit`, `mobile-chrome` (Pixel 7). Env — `E2E_USER_EMAIL` / `E2E_USER_PASSWORD` + `NEXT_PUBLIC_PROJECT_URL` / `NEXT_PUBLIC_APP_TOKEN` (из `.env.local`). CI: [.github/workflows/e2e.yml](../../.github/workflows/e2e.yml).

## Карта покрытия

### Главная / навигация / хедер

- [home.spec.ts](home.spec.ts) — слоган, лого, «View all» категорий, отсутствие multipart-артефактов.
- [header-search.spec.ts](header-search.spec.ts) — SearchBar, зеркалирование `?search=` на `/shop`, «No products found».
- [search-dropdown.spec.ts](search-dropdown.spec.ts) — дропдаун результатов на не-shop роутах, клик по строке → товар.
- [categories-scroller.spec.ts](categories-scroller.spec.ts) — preferences-чипсы (`?preferences=`).
- [bottom-menu.spec.ts](bottom-menu.spec.ts) — мобильное нижнее меню (catalog/favorites/profile). **mobile-only**.
- [not-found.spec.ts](not-found.spec.ts) — 404 / return-home.

### Каталог / товар / фильтры

- [catalog.spec.ts](catalog.spec.ts) — сетка `/shop`, карточка, открытие товара, 404.
- [shop-pagination.spec.ts](shop-pagination.spec.ts) — LoadMore (`?page=`), страница категории, JSON-LD.
- [product-single.spec.ts](product-single.spec.ts) — страница товара, JSON-LD/OG, add-to-cart, избранное, количество.
- [product-blocks.spec.ts](product-blocks.spec.ts) — related / recently viewed / buy-together (условные → skip).
- [filter-popups.spec.ts](filter-popups.spec.ts) — CategoryFilter drawer, FilterBottom (время/цена/preferences).

### Корзина / чекаут

- [cart.spec.ts](cart.spec.ts) — пустая, добавление, APPLY гостя → auth.
- [cart-quantity.spec.ts](cart-quantity.spec.ts) — количество/удаление/undo/чекбокс на `/cart` (guest).
- [cart-persistence.spec.ts](cart-persistence.spec.ts) — персист через reload + мерж гостевой корзины при логине.
- [cart-popup.spec.ts](cart-popup.spec.ts) — CartPopup-дровер. **mobile-only**.
- [cart-order-step.spec.ts](cart-order-step.spec.ts) — промокод apply/remove/error + тумблер бонусов + totals. **auth**.
- [delivery-checkout.spec.ts](delivery-checkout.spec.ts) — полный cash-флоу до Success + time-picker + выбор оплаты. **auth**.
- [checkout-error.spec.ts](checkout-error.spec.ts) — online без checkout URL → error-экран. **auth**.
- [checkout-payment-details.spec.ts](checkout-payment-details.spec.ts) — «another person»→alt-phone, change-address dropdown. **auth**.

### Оплата (Stripe / результат)

- [payment-stripe.spec.ts](payment-stripe.spec.ts) — живой Stripe-чекаут доставки. **auth**, **за флагом `E2E_STRIPE=1`**.
- [reservation-stripe.spec.ts](reservation-stripe.spec.ts) — живой Stripe-чекаут бронирования (редирект на hosted Checkout). **auth**, **за флагом `E2E_STRIPE=1`**, desktop-only.
- [payment-result.spec.ts](payment-result.spec.ts) — `/payment/success` и `/payment/cancel`.

### Профиль

- [auth.spec.ts](auth.spec.ts) — auth-модалка гостя (провайдеры, валидация, регистрация).
- [auth-flow.spec.ts](auth-flow.spec.ts) — логин, меню профиля, `/profile`, orders, bookings. **auth**.
- [logout.spec.ts](logout.spec.ts) — логаут → гостевое состояние. **auth**.
- [profile-edit.spec.ts](profile-edit.spec.ts) — My Profile save, адресная книга, бонус-секция. **auth**.
- [orders-actions.spec.ts](orders-actions.spec.ts) — repeat order / leave review / contact courier. **auth**, **data-dependent**.
- [review-submit.spec.ts](review-submit.spec.ts) — отправка отзыва (рейтинг+текст→Apply). **auth**, **data-dependent**.
- [bookings-cancel.spec.ts](bookings-cancel.spec.ts) — отмена/edit брони. **auth**, **data-dependent**.
- [booking-edit.spec.ts](booking-edit.spec.ts) — edit брони → PUT update. **auth**, **data-dependent**.
- [subscriptions.spec.ts](subscriptions.spec.ts) — сетевые `Events.subscribe` при add-to-favorites. **auth**.

### Промо / рестораны / бронирование

- [promotions.spec.ts](promotions.spec.ts) — список промо, баннеры → деталь.
- [restaurants.spec.ts](restaurants.spec.ts) — индекс + деталь, Book a table, hard-404.
- [restaurant-gallery.spec.ts](restaurant-gallery.spec.ts) — лайтбокс фото. **desktop-only**.
- [reservation.spec.ts](reservation.spec.ts) — booking-визард (форма→auth→cash-заказ через route-mock).
- [forms.spec.ts](forms.spec.ts) — ContactUsForm, ForgotPasswordForm.

### Кросс-каттинг

- [seo.spec.ts](seo.spec.ts) — robots.txt, sitemap.xml, noindex faceted `/shop`, hard vs soft 404.
- [a11y.spec.ts](a11y.spec.ts) — axe-core скан ключевых страниц (нет критических нарушений WCAG).

## Конвенции

- **Auth-тесты** (`**auth**`) логинятся через `signInAsTestUser` (не storageState — см. ниже), обёрнуты в `test.describe.serial`, скипаются без `E2E_USER_*`.
- **Data-dependent** тесты скипаются (не падают), если у тест-юзера нет нужных данных (заказ `delivered`, активная бронь). Сидинг данных не автоматизирован (создаёт реальные записи на общем бэкенде).
- **Мутации** (createOrder / updateUser / updateOrder / review) перехватываются через `page.route(...).fulfill()` — тесты не пишут в реальный OneEntry. Точки перехвата — рядом с действием в каждом файле.
- **Хелперы** — [fixtures/helpers.ts](fixtures/helpers.ts) (`signInAsTestUser`, `openOrderStep`/`openPaymentStep`, `addInStockProductToCart`, `waitForAuthedHeader`, …).
- Грабли (peer-hidden radios, dict-driven лейблы, `/form-data` endpoint, webkit-toast, storageState, мобильный auth) — в персональной памяти проекта.

## Известные ограничения

- **Auth работает и на `mobile-chrome`** — `signInAsTestUser`/`openAuthModal`/`waitForAuthedHeader` мобиле-совместимы (на мобиле дровер после логина свапается на ProfilePopup, а не закрывается; десктоп-хедер `display:none` → гейт по `toBeAttached`). Desktop-only остаются лишь явно gated тесты (`delivery-checkout` мутирующий, `checkout-error`, Stripe, `restaurant-gallery`-лайтбокс).
- **storageState-переиспользование сессии не работает** с OneEntry (сервер отвергает восстановленный `refresh-token`) — каждый auth-файл логинится сам.
- **Stripe** нельзя завершить на дробной сумме (серверный баг OneEntry); полную оплату на hosted-странице не автоматизируем (живая форма меняет поля по гео, ре-инициализируется) — Stripe-тесты за флагом `E2E_STRIPE=1` проверяют редирект на checkout.stripe.com.

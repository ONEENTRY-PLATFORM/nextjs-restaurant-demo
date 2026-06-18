# OneEntry Admin Setup — что осталось завести в админке

Реестр задач **на стороне OneEntry admin** (`https://oe-restaurants.oneentry.cloud/`) для команды клиента / администратора CMS.

Правила оформления — см. [CLAUDE.md §3](CLAUDE.md) и [§7](CLAUDE.md):

- Поля атрибутов / форм оформляются **только** markdown-таблицей с колонками `marker | type | title` (минимум). По необходимости — `required` / `default` / `notes`.
- Закрытый клиентом пункт — отмечается `✅` рядом или удаляется.
- Вопросы клиенту — префикс `> ❓ **Уточнить у клиента:**`.

Код уже подключён к существующим сущностям (`services`, `bookings`, `filters`, `menu`, `restaurants`, `blog`, `delivery_order`, `booking_order`, `user`, attribute set `dish` с `images/weight/calories/cooking_time/price/preferences/filter/ingredients/...`, attribute set `restaurant`, attribute set `catalog_page`). Ниже — только то, чего **нет** в админке и нужно для оставшихся функциональных пробелов.

---

## C.2.5. Блоки страницы `home_web` отвязаны

На 2026-05-28 `getBlocksByPageUrl('home_web')` возвращает `[]`, и `page.blocks` тоже пустой (страница id=28 существует, тип `common_page`). Из-за этого код в [app/page.tsx](app/page.tsx) не находит ни одного блока для рендера.

Что нужно в админке: на странице `home_web` снова привязать три блока с identifier'ами `home_promo`, `recommended`, `home_categories` (именно в этом порядке через `block.position`). Они уже существуют в CMS (используются на других экранах) — нужно только восстановить привязку к странице.

Временный фолбэк в коде: если CMS вернёт пустой список — рендерим `HOME_BLOCK_ORDER` (`home_promo` → `recommended` → `home_categories`) хардкодом, чтобы главная не схлопывалась. После восстановления привязки фолбэк перестанет срабатывать сам собой (CMS-порядок имеет приоритет). После проверки через MCP — отметить `✅`.

## C.2.6. Закрыты права на product/page-scoped запросы

На 2026-05-28 ряд публичных эндпоинтов отвечают **403 `Permission data not found. Provide the permission for requested url`**. Это блокирует категории, блок `recommended`, фильтры и теги на всех листингах. Диагностика через SDK (с `NEXT_PUBLIC_ONEENTRY_TOKEN`):

| Запрос                                                       | Статус               |
| ------------------------------------------------------------ | -------------------- |
| `Products.getProducts` (глобально)                           | ✅ 200, 123 товара    |
| `Products.getProductsByPageUrl('menu', id=1)`                | ❌ 403                |
| `Products.getProductsByPageUrl('soups', id=167)`             | ❌ 403                |
| `Products.getProductsByPageUrl(<any menu child>)`            | ❌ 403                |
| `Blocks.getBlockByMarker('recommended')` → `similarProducts` | ❌ 403 в теле ответа  |
| `Pages.getPageByUrl(...)` (метаданные страниц)               | ✅ 200                |

Что закрылось на UI как следствие:

- **Главная** — секции категорий ([HomeCategoriesSection](components/home/HomeCategoriesSection.tsx)) и `Recommended` ([HomeBlockServer](components/home/HomeBlockServer.tsx)) пустые (graceful fallback на `null`), потому что `getProductsByPageUrl` и `similarProducts` возвращают 403.
- **Категорийные страницы** (`/shop/category/*`, `/shop/[handle]`) — нет товаров, нет тегов/чипов и панели фильтров.
- **HomePromo** — на `getBlogBanners`, к этим правам не относится, отображается.

Что нужно в админке OneEntry: открыть публичные права на чтение для:

1. `Products.getProductsByPageUrl` — для страницы `menu` (id=1) **и всех 8 её дочерних** (`soups` id=167, `main-courses` id=168, `appetizers` id=169, `hot-drinks` id=170, `cold-drinks` id=171, `salads` id=172, `desserts` id=173, `kids-menu` id=174).
2. `similar_products_block` — чтобы блок `recommended` (id=1) отдавал `similarProducts` без 403.
3. Чтение фильтров (`Products.getFilters` / facets) на тех же страницах.

После открытия прав — проверить через `inspect-api` (или MCP `inspect-api`), что все три ручки выше отвечают 200, и снять этот пункт. До тех пор главная и категорийные страницы рендерятся «пусто» по этим секциям — это не баг кода, а пустой ответ CMS.

## C.2.4. Иконки страниц `menu/*` (атрибут `menu_icon`) ✅

Атрибут переименован: `icon` → `menu_icon` (image). На странице `attributeValues.menu_icon.value` приходит **массивом** объектов с `downloadLink`. Ридеры обновлены: [CategoryFilter](components/layout/filter/CategoryFilter.tsx), [NavGenericIcon](components/layout/header/nav/NavGroup.tsx), [shop/[handle]/page.tsx](app/shop/[handle]/page.tsx) (OG). Локальный fallback на файлы `public/images/icons/categories/*.svg` удалён — если иконки нет в CMS, тайл рисует пустой кружок.

На 2026-05-26 у всех 8 страниц `menu/*` (`kids-menu`, `desserts`, `salads`, `cold-drinks`, `hot-drinks`, `appetizers`, `main-courses`, `soups`) `menu_icon` заполнен. Пункт закрыт.

> ⚠️ При первом запросе после изменения админ-конфига API может вернуть `value: []` (CDN/index lag, наблюдалось эмпирически). Повторный запрос через несколько минут отдаёт корректный массив.

## C.3. Похожие товары (related products)

- В админке привязать минимум 4–6 «похожих» через стандартный механизм OneEntry **Product Links**. Без этого `getRelatedProductsById` возвращает пустой список и секция не рендерится (graceful fallback).

---

## C.4. Словарь `static_content` — что осталось

Словарь подгружается через [app/dictionaries.ts](app/dictionaries.ts) (атрибут-сет `static_content`, нормализован в `Record<marker, attr>`, `value` = `initialValue` если локализация не заполнена). В админке уже **77 маркеров**.

### C.4.1. Завести новые маркеры в админке (атрибут-сет `static_content`)

Все ниже — `type: string`. Сгруппировано по экранам, чтобы заполнять было удобнее. `title` в таблице ниже — это и текст, который виден в админке как title маркера, и его `initialValue` (английский дефолт). После создания — прокинуть `dict?.<marker>?.value` в соответствующие компоненты (правка кода).

#### StepPayment — дополнительные фразы

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

#### CartWizard — пропущенный шаг «Order»

Используется в: [components/cart/CartWizard.tsx](components/cart/CartWizard.tsx) (STEP_TITLES, шаг перед Payment).

| marker            | type   | title |
|-------------------|--------|-------|
| `order_step_text` | string | Order |

#### Cart APPLY — гостевая CTA вместо APPLY

Используется в: [components/layout/cart/index.tsx](components/layout/cart/index.tsx) (нижняя кнопка шага `cart`) и [components/cart/steps/StepOrder.tsx](components/cart/steps/StepOrder.tsx) (нижняя кнопка шага `order`). Для незалогиненных вместо «APPLY» открывается `AuthProviderSelect` и показывается приглашение войти.

| marker               | type   | title                |
|----------------------|--------|----------------------|
| `login_to_continue`  | string | Sign in to continue  |

#### ReservationForm — лейбл «Preferences»

Используется в: [components/reservation/ReservationForm.tsx](components/reservation/ReservationForm.tsx) (fallback-лейбл поля гостевых предпочтений).

| marker               | type   | title       |
|----------------------|--------|-------------|
| `preferences_label`  | string | Preferences |

#### FilterBottom — префиксы инпутов цены

Используется в: [components/layout/filter/FilterBottom.tsx](components/layout/filter/FilterBottom.tsx) (префикс-лейблы рядом с инпутами min/max цены в фильтре).

| marker             | type   | title |
|--------------------|--------|-------|
| `price_from_text`  | string | from  |
| `price_under_text` | string | Under |

#### ProductDetails — fallback при пустом рейтинге

Используется в: [components/layout/product/product-single/ProductDetails.tsx](components/layout/product/product-single/ProductDetails.tsx). Рейтинг товара читается из top-level `product.rating.value` (SDK тип `IRating`), а не из `attributeValues.rating` (это рудимент). Если `rating.value` отсутствует — в строке метрик вместо «звезда + число» рендерится текст ниже.

| marker               | type   | title                  |
|----------------------|--------|------------------------|
| `rating_not_formed`  | string | Rating not yet formed  |

#### Хедер / навигация / общие (aria-label, кнопки)

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

---

## C.6. Платежи

`PROJECT_URL/payments/accounts` — `cash` (оплата при доставке) и `stripe` (карты через hosted Stripe Checkout). Оба передаются в [StepPayment](components/cart/steps/StepPayment.tsx) через `addPaymentMethod`. Отдельная форма ввода карты в приложении не нужна — Stripe собирает реквизиты на своей странице.

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
- `delivery_time` — [StepPayment.tsx](components/cart/steps/StepPayment.tsx) собирает `[[startISO, endISO]]` через `buildDeliveryTimeInterval` и шлёт `addData({ marker: 'delivery_time', type: 'timeInterval', ... })`. ASAP → start=now, end=now+45 мин; scheduled → start=parsed `DD.MM.YY HH.MM`, end=start+1 ч.
- `addresses` — UI пока не собирает (см. C.5 про адресную книгу юзера).

**Открытые задачи:**

- **Stripe payment в delivery-чекауте — сервер отдаёт «Your payment account is not connected».** Подтверждено 2026-05-09 на заказе #96: `Orders.createOrder` с `paymentAccountIdentifier: 'stripe'` проходит, но следом `Payments.createSession(id, 'session')` валится с этим текстом. Та же причина, что и для booking — Stripe-аккаунт в `Payments.getAccounts()` имеет `settings.status: "not_connected"` (production) при `testSettings.status: "connected"` и `testMode: true` (см. C.6.2 #1). Сервер OneEntry, судя по поведению, валидирует именно `settings.status` независимо от `testMode` — поэтому test-онбординг ситуацию не закрывает. После фикса в [useCreateOrder.ts](app/api/hooks/useCreateOrder.ts) ошибка теперь не глушится: wizard уходит на error-шаг с конкретным сообщением, заказ фиксируется в OneEntry, но редиректа на Stripe Checkout не происходит до закрытия пробела на стороне OneEntry/админки.

  > ❓ **Уточнить у OneEntry support:** при `testMode: true` сервер `Payments.createSession` должен валидировать `testSettings.status`, а не `settings.status`. Сейчас валидирует production-блок и отвечает `"Your payment account is not connected"`, хотя test-онбординг Stripe Connect завершён (`testSettings.stripeOnboardingComplete: true`, `testSettings.status: "connected"`). Воспроизведение — `Payments.createSession(<orderId>, 'session')` для проекта `oe-restaurants.oneentry.cloud`, account `stripe`. Запросить: либо чтобы на test-mode аккаунтах валидация шла по `testSettings`, либо чтобы сервер возвращал понятную ошибку «account is in testMode, but server requires production-connected account». Параллельно — клиент может временно пройти production Stripe Connect (live-ключи + KYC), это уберёт ошибку, но переведёт оплату на боевые карты.

### C.6.2. Booking-flow — payment + success (Figma 120:1875 / 120:2338)

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
3. **Stripe success-redirect URL.** После оплаты Stripe возвращает юзера на success-URL, заданный в OneEntry payments config. Сейчас такого URL нет — после оплаты юзер вернётся на главную или на ошибку. ❓ **Уточнить у клиента:** какой URL использовать (например, `/reservation/success?orderId=…` — потребует роут на нашей стороне), и обернуть его в текст success-экрана из Figma 120:2338.

---

## C.7. Аудит соответствия полей коду (inspect-api)

Проверка проведена через `oneentry` SDK напрямую к проекту `oe-restaurants.oneentry.cloud` (lang=`en_US`). Зафиксировано на момент проверки.

### C.7.1. Pages — реальные атрибуты

- **`menu/*`** (`appetizers`, `dinner`, `soup`, `fresh_juice`, …) — `icon` (заполнен), `service_*` (пустые, унаследовано из шаблона).
- **`filters`** — `cooking_time_filters` (json), `preferences_filters` (json), `price_filters` (string).
- **`blog/*`** — `bg_image`, `banner`, `description`, `action_type`. См. C.2.3.

### C.7.2. Product (attribute set `dish`)

Реальные атрибуты товара (на 2026-05-26, проверено через `inspect-api`):
`dish_name` (string), `sku` (string), `category` (string), `ingredients` (**list** `Array<{title,value}>`), `cooking_time` (integer), `weight` (integer), `calories` (integer), `price` (float), `currency` (string), `preferences` (list), **`filter` (list)** — новые маркеры курса/типа блюда для фильтрации (Breakfast/Lunch/Dinner/Soup/…), **`images` (groupOfImages)** — основное изображение(я).

Что изменилось в схеме (миграция уже отражена в коде):

- `cover` (image) → **`images` (groupOfImages)**. Все ридеры идут через `getProductImageUrl(attrs)` ([app/api/hooks/useAttributesData.ts](app/api/hooks/useAttributesData.ts)).
- `calorrage` → **`calories`** (опечатка в маркере исправлена в админке, использовалось в [ProductDetails.tsx](components/layout/product/product-single/ProductDetails.tsx)).
- `ingredients` (string) → **list** `Array<{title,value}>`; рендер на странице товара берёт `title` и склеивает через запятую.
- Добавлен **`filter` (list)** — `listTitles` в attribute set `dish`. Подключён в `?filter=…` ([getSearchParams.ts](app/api/utils/getSearchParams.ts)) и UI-секцию в [FilterBottom.tsx](components/layout/filter/FilterBottom.tsx). OR-семантика мульти-селекта обрабатывается в [getProducts.ts](app/api/server/products/getProducts.ts) / [getProductsByPageUrl.ts](app/api/server/products/getProductsByPageUrl.ts).

- **`statusIdentifier`** — у всех товаров `null` (статус не назначен). Код блокирует покупку только при явном `statusIdentifier === 'out_of_stock'` ([AddToCartButton.tsx:62-65](components/layout/product/components/AddToCartButton.tsx#L62-L65), [JSON-LD availability](app/shop/product/%5Bhandle%5D/page.tsx#L56-L59)). ❓ **Уточнить у клиента:** проставлять ли в админке статусам товаров `in_stock` (для аналитики/SEO) — в текущей логике `null` уже работает как «доступно».

### C.7.4. Dictionary (`static_content`) — что код читает, но в CMS нет

- **`reset_descr`, `send_text`** ([ForgotPasswordForm.tsx](components/forms/ForgotPasswordForm.tsx)) — нет.

> ❓ **Уточнить у клиента:** надо ли расширять `static_content` под все эти UI-строки (для локализации) или достаточно текущих 59 + хардкоды?

---

## C.10. Профиль — Reservations history (Figma 78:1293)

**Открытое для клиента:**

1. **Order statuses для booking_order**. ❓ Какие markers статусов завести в OneEntry admin → Orders → Statuses → Storage `booking_order`? По Figma минимум `Reserved` (default) + `Canceled`. Хорошо бы ещё `InProgress` и `Completed`. Без этого `BookingsPopup` фильтрует Active/History по дефолтному списку (`HISTORY_STATUSES = {delivered, canceled, cancelled, completed, rejected}`) — могут быть mis-classifications.

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
| `booking_updated_toast`      | string | Reservation updated.                                        |

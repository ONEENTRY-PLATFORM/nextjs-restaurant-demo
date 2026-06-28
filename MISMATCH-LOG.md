# MISMATCH-LOG — расхождения вёрстки

Журнал расхождений между эталоном [static-html/](static-html/) (правило 1) и текущей Next.js-реализацией. Что чинится правкой кода в этом репо.

- **Раздел A** — массовые автоматические находки.
- **Раздел B** — ручная сверка по экранам.
- **Пробелы в данных OneEntry** (что нужно завести в админке `https://oe-restaurants.oneentry.cloud/`) — переехали в отдельный файл [ONEENTRY-ADMIN-TODO.md](ONEENTRY-ADMIN-TODO.md).

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
| D. Соответствие MCP/SDK (отложенные) | 2 | 0 | 0 | 2 | 0 |
| E. Роутинг / навигация (SSR, loading.tsx) | 1 | 0 | 0 | 1 | 0 |
| OneEntry Admin Setup | [ONEENTRY-ADMIN-TODO.md](ONEENTRY-ADMIN-TODO.md) | — | — | — | — |

---

## Раздел B. Ручная сверка по экранам

### B.8. Промо-детейл (`pk_promo_BIRTHDAY.html`, `pk_promo_day.html` ↔ `app/promo/[handle]`)

- 🌐 Live: <http://localhost:3000/promo/birthday_offer>

- 📄 Static:
  [pk_promo_BIRTHDAY.html](static-html/pk_promo_BIRTHDAY.html),
  [pk_promo_day.html](static-html/pk_promo_day.html)

- 📁 Файлы проекта: [app/promo/[handle]/page.tsx](app/promo/[handle]/page.tsx)

| # | Что не так | Файл | Severity |
|---|---|---|---|
| B.8.2 | **Fixed (2026-06-28)** — у промо без привязанных товаров грид теперь рендерит CTA-кнопку **«go to selection»** (`<Link href="/shop">`, стиль из `pk_promo_BIRTHDAY.html`) вместо пустого «Products not found». Сделано через новый опциональный проп `emptyFallback` у `ProductsGridLayout`: пустой результат без ошибки (`!isError && total < 1`) → fallback, реальная SDK-ошибка → `<ProductsNotFound />`. Лейбл — `t('promo_go_to_selection', 'Go to selection')` (англ. фолбэк гарантирован). | [components/layout/products-grid/index.tsx](components/layout/products-grid/index.tsx), [app/promo/[handle]/page.tsx](app/promo/%5Bhandle%5D/page.tsx) | — |

> ℹ️ Тот же плоский rich-text (`mt-3.75 font-normal text-base text-white`) ещё на `app/blog/page.tsx`, `app/restaurants/[handle]/page.tsx`, `app/[handle]/page.tsx`, `app/support/page.tsx` — кандидаты на переход к `.cms_prose`, если контент там тоже многоуровневый.

## Раздел E. Роутинг / навигация (SSR, loading.tsx)

Код-уровневые заметки о поведении переходов и SSR. Правки в **коде** (не вёрстка, не админка).

- 🌐 Симптом: при переходе между страницами (напр. главная → каталог) «всё исчезает и висит пустое место, пока не загрузится страница». `next-transition-router` ([app/animations/TransitionProvider.tsx](app/animations/TransitionProvider.tsx)) гасит текущую страницу в `opacity:0` **до** старта навигации; пока сервер-компонент целевого роута `await`-ит данные наверху, рендерить нечего → пустой экран.

| # | Что не так | Файл | Severity |
|---|---|---|---|
| E.1 | **Soft-404 на `notFound()`-роутах под `loading.tsx`-границей.** Побочный эффект скелетонов: на динамических `[handle]`-роутах невалидный handle отдаёт soft-404 (HTTP **200** + not-found UI) вместо жёсткого 404 — Next успевает зафлашить 200-шелл скелетона раньше, чем разрешится `notFound()`. Затронуты `/[handle]`, `/shop/[handle]`, `/shop/category/[handle]`, **и `/shop/product/[handle]`** (+ ранее `restaurants/[handle]`, `promo/[handle]`). Изначально товар держал жёсткий 404 без `loading.tsx`, но `app/shop/loading.tsx` (каталожный скелетон) **протекает** на дочерний роут товара (у него не было своей `loading.tsx`): показывал не тот скелетон (сетка вместо карточки) и уже ронял 404 в soft. Чинено своей `app/shop/product/[handle]/loading.tsx` (`ProductSingleSkeleton`) — скелетон правильный, 404 остаётся soft (как у соседей). Механика — заметка памяти `next16_loading_forcestatic_soft404`. **Чтобы вернуть жёсткий 404 товару:** route-group `app/shop/(catalog)/…` для index/[handle]/category (их `loading.tsx` уезжает в группу и перестаёт накрывать `product`), товар — без `loading.tsx`, скелетон через in-page `<Suspense>` после `notFound()`. | [app/shop/product/[handle]/loading.tsx](app/shop/product/%5Bhandle%5D/loading.tsx), [app/[handle]/loading.tsx](app/%5Bhandle%5D/loading.tsx), [app/shop/[handle]/loading.tsx](app/shop/%5Bhandle%5D/loading.tsx), [app/shop/category/[handle]/loading.tsx](app/shop/category/%5Bhandle%5D/loading.tsx) | P2 |

## Раздел D. Соответствие MCP/SDK (отложенные code-fixable правки)

Найдено при сверке кода с последней версией OneEntry MCP (2026-06-19). Правки в **коде** (не вёрстка, не админка). D.1–D.6 выполнены и удалены из таблицы (2026-06-20). Остаётся D.7 — заложен безопасный фундамент, нужен финальный флип источника UI. Остальные находки сверки уже были поправлены ранее (token-handling в `AuthContext`, config-id в `OrderReviewPopup`, типовая гигиена, централизация статус-маркеров в `constants.ts`).

**Аудит соответствия MCP (2026-06-27).** Исправлено в этом проходе: унификация error-guard (`typeError` удалён, `isError` стал суперсетом по `statusCode` — ловит и `message: string[]` от валидаторов форм; 25 файлов + `api.ts` + доки); `isError`-guard добавлен в `changePassword` ([ResetPasswordForm](components/forms/ResetPasswordForm.tsx)) и в fallback-ветку [useSearchProducts](app/api/hooks/useSearchProducts.ts); централизация маркеров `review_form`/`blog` (`FORMS.reviewForm`, `FORM_MODULE_CONFIG_IDS`, `PAGES.blog`); `'use client'` + перенос [logInUser](app/api/client/logInUser.ts) из `server/` в `client/` (явный fingerprint-контракт); диспетчеризация типа поля в [FormInput](components/forms/inputs/FormInput.tsx) по ключу enum (вместо подстроки маркера) + рендер `hint` из `additionalFields`; удалены 5× `any`. Остаются открытыми D.8–D.13 ниже.

**Проход 2026-06-28.** Закрыты D.8, D.10, D.11, D.12, D.13 (см. ниже, Severity `—`). D.9 пересмотрен по факту SDK: маркеров `sign_up`/`reset_password`/`forgot_password`/`user_form` в OneEntry НЕТ — есть единственная форма `user` (formIdentifier email-провайдера); основной рефактор остаётся открыт (P2), две безопасные подзадачи описаны в строке. Открыты в D: D.7 и D.9.

| # | Что не так | Файл | Severity |
|---|---|---|---|
| D.7 | **Foundation + sync + merge-on-login (частично).** Добавлен централизованный [useServerCartSync](app/api/hooks/useServerCartSync.ts) (смонтирован [ServerCartSync](components/layout/ServerCartSync.tsx) под `AuthProvider`): зеркалит Redux-корзину → `Users.setCart` и favorites → `Users.setWishlist` (оптимистично/Redux-first, дебаунс 800мс, покрывает add/qty/remove). На логине пушит объединённый Redux-стейт (гостевые + восстановленные пользовательские позиции) в серверный кэш юзера и чистит `setGuestId('')` — результат эквивалентен «read guest cart → setCart merged → clear guest id». **Остаток (эффорт L):** флип источника UI — читать корзину/wishlist из серверного кэша, убрать `redux-persist`/`updateUserState`/`user.state.cart`. Redux вшит в reservations/animations — делать отдельно. | [useServerCartSync.ts](app/api/hooks/useServerCartSync.ts) | P2 |
| D.8 | **Improved (2026-06-28).** Хардкод `identifier === 'cash'` заменён общим классификатором [isOnlinePaymentAccount](app/api/hooks/paymentAccountKind.ts) (`type==='stripe'` + whitelist online-`custom`, т.к. SDK не даёт булева `online`), подключён в `useCreateOrder` и `useSubmitReservation`; тип аккаунта прокинут из обоих UI (StepPayment, ReservationPaymentStep→ReservationForm). **Латентный P0 закрыт:** бронь с online-аккаунтом без `paymentUrl` теперь возвращает `ok:false` (ошибка), а не success-экран на неоплаченном заказе. **Остаток (D.8a, фон):** PayPal `getSessionByOrderId` polling не реализован — PayPal-бронь сейчас отдаёт ошибку вместо success-без-оплаты; whitelist расширять при заведении нового online-гейтвея. | [paymentAccountKind.ts](app/api/hooks/paymentAccountKind.ts), [useCreateOrder.ts](app/api/hooks/useCreateOrder.ts), [useSubmitReservation.ts](app/api/hooks/useSubmitReservation.ts) | — |
| D.9 | **Auth-формы не из Forms API (пересмотрено 2026-06-28).** Факт по SDK: маркеров `sign_up`/`reset_password`/`forgot_password`/`user_form` НЕТ — есть единственная форма `user` (formIdentifier email-провайдера). Все формы должны читать `user`. Остаётся открытым основной рефактор: флаг-роутинг `authData`/`formData`/`notificationData` по auth-provider rule + валидаторы/порядок из схемы (меняет payload `signUp`/`updateUser` и контракт `FormFieldsSlice` — крупно, нужен E2E). Две безопасные подзадачи (ещё НЕ сделаны): (1) порядок полей `SignUpForm` из `position` схемы вместо хардкод-массива; (2) удалить мёртвую `resetPasswordFormFields` и брать поля паролей из `user` (заодно фикс маркера `password_confirm`→`repeat_password`). | [SignUpForm.tsx:59](components/forms/SignUpForm.tsx#L59), [ResetPasswordForm.tsx:17](components/forms/ResetPasswordForm.tsx#L17), [UserForm.tsx:45](components/forms/UserForm.tsx#L45) | P2 |
| D.10 | **Partially fixed (2026-06-28).** `type` в payload больше не схлопывается в `'string'` — пробрасывается реальный `attribute.type` в `ContactUsForm` (default-ветка), `UserForm` (`field.type`) и `SignUpForm` (join к `data.attributes`, т.к. там хардкод-список маркеров). На текущей схеме (только string/text) payload байт-в-байт прежний — это защита от добавления numeric/date-полей. **Остаток (фон):** для `date/dateTime/time` значение в `FormFieldsSlice` хранится как строка, а SDK ждёт `{ fullDate, formattedValue, formatString }` — трансформа value-shape + date-picker остаётся отдельной задачей. | [ContactUsForm.tsx:78](components/forms/ContactUsForm.tsx#L78), [UserForm.tsx:53](components/forms/UserForm.tsx#L53), [SignUpForm.tsx:69](components/forms/SignUpForm.tsx#L69) | — |
| D.11 | **Fixed (2026-06-28).** Оба фетчера используют `isError()` и try/catch: `updateUserState` оборачивает `getUser`/`updateUser`, возвращает `false` на брошенной ошибке/403; `logOutUser` на IError-теле `AuthProvider.logout` возвращает `{ error }` вместо утечки как `{ data }`. Легаси-запись `state.cart` оставлена (трекается в D.7). | [updateUserState.ts](app/api/server/users/updateUserState.ts), [logOutUser.ts](app/api/server/users/logOutUser.ts) | — |
| D.12 | **Partial fix (2026-06-28).** `UsePrice` принимает опциональный `currency` (непустой ISO-код переопределяет, иначе фолбэк `CurrencyEnum.en='USD'`; `trim()`-гард против пустой строки → не падает `Intl.NumberFormat`). Реальная валюта прокинута в итогах заказа (`OrderCard`→`order.currency`), позициях (`OrderLineItem`) и сводке чекаута (`StepOrder`←`ServerOrderTotals.currency` из preview). **Остаток (фон):** каталог/корзина/избранное/страница товара по-прежнему на USD-фолбэке — там нет канонической валюты на уровне заказа; нужен проектный источник валюты или верифицированный продуктовый атрибут `currency`. | [utils.ts:34](components/utils.ts#L34), [OrderCard.tsx](components/profile/orders/OrderCard.tsx), [StepOrder.tsx](components/cart/steps/StepOrder.tsx) | — |
| D.13 | **Fixed (2026-06-28).** `BookingsContent.isHistoryOrder` теперь матчит `statusIdentifier` точным членством в `new Set([...ORDER_HISTORY_STATUSES, ORDER_STATUSES.bookingCancelled])` (case-insensitive), как `orderUtils.ts`; подстрочная эвристика `HISTORY_STATUS_KEYWORDS` удалена, фолбэки `isCompleted` и past-date сохранены. | [BookingsContent.tsx:24](components/profile/BookingsContent.tsx#L24) | — |

---

## Раздел C. OneEntry Admin Setup → [ONEENTRY-ADMIN-TODO.md](ONEENTRY-ADMIN-TODO.md)

Задачи на стороне OneEntry admin (`https://oe-restaurants.oneentry.cloud/`) — что осталось завести в админке: страницы, атрибуты, формы, словарь `static_content`, related products, payment-accounts, статусы заказов. Переехали в отдельный файл [ONEENTRY-ADMIN-TODO.md](ONEENTRY-ADMIN-TODO.md), чтобы команда админа не листала code-debt разработчика.

Структура там — та же (C.2 Pages, C.3 Related products, C.4 Dictionary, C.5 Profile popup, C.6 Payments, C.7 Audit, C.9 Auth menu, C.10 Reservations history). Правила оформления — см. [CLAUDE.md §3](CLAUDE.md).


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
| OneEntry Admin Setup | [ONEENTRY-ADMIN-TODO.md](ONEENTRY-ADMIN-TODO.md) | — | — | — | — |

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

## Раздел C. OneEntry Admin Setup → [ONEENTRY-ADMIN-TODO.md](ONEENTRY-ADMIN-TODO.md)

Задачи на стороне OneEntry admin (`https://oe-restaurants.oneentry.cloud/`) — что осталось завести в админке: страницы, атрибуты, формы, словарь `static_content`, related products, payment-accounts, статусы заказов. Переехали в отдельный файл [ONEENTRY-ADMIN-TODO.md](ONEENTRY-ADMIN-TODO.md), чтобы команда админа не листала code-debt разработчика.

Структура там — та же (C.2 Pages, C.3 Related products, C.4 Dictionary, C.5 Profile popup, C.6 Payments, C.7 Audit, C.9 Auth menu, C.10 Reservations history). Правила оформления — см. [CLAUDE.md §3](CLAUDE.md).


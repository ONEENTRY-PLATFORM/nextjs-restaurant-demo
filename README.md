<img src="https://oneentry.cloud/img/git/oneenrty_light.png" alt="OneEntry Platform" width="200" />

# OneEntry Next.js Restaurant

[![License: Apache 2.0](https://img.shields.io/badge/License-Apache_2.0-blue.svg)](LICENSE)
[![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=white)](https://react.dev/)
[![OneEntry SDK](https://img.shields.io/badge/OneEntry-SDK-3b82f6)](https://www.npmjs.com/package/oneentry)
[![Join our Discord](https://img.shields.io/badge/Discord-Join%20Community-blue?logo=discord&logoColor=white)](https://discord.gg/sM7vFmFaQz)

A reference restaurant storefront built on **Next.js 16** and **React 19**, fully integrated with the [OneEntry](https://oneentry.cloud) headless CMS.

It demonstrates how a content-managed restaurant site — menu, product catalog, cart and checkout, table reservations, user profile, promo pages — can be assembled from CMS data backed by `https://oe-restaurants.oneentry.cloud/` and managed entirely from the OneEntry admin panel.

> This is a **reference implementation / template**. It is intended for learning, prototyping, and as a starting point for hospitality projects on OneEntry — clone it, point it at your workspace, and customize.

---

## Table of Contents

- [Project Goals](#project-goals)
- [Key Features](#key-features)
- [Tech Stack](#tech-stack)
- [Getting Started with OneEntry](#getting-started-with-oneentry)
- [Environment Variables](#environment-variables)
- [Project Constants](#project-constants)
- [Run Locally](#run-locally)
- [Scripts](#scripts)
- [Project Structure](#project-structure)
- [Testing](#testing)
- [Development Tools](#development-tools)
- [Documentation](#documentation)
- [Contributing](#contributing)
- [Security](#security)
- [License](#license)
- [Community & Support](#community--support)

---

## Project Goals

1. **Showcase OneEntry's Capabilities for Hospitality.** A clear example of how OneEntry can drive a full restaurant site — menu, ordering, reservations — with everything editable from the admin panel, without code changes.
2. **Speed Up Front-End Delivery.** A ready foundation for studios and teams launching restaurant or food-service projects on top of OneEntry. Adapt the design, plug in your brand, ship.
3. **Reference Implementation.** Production patterns for the OneEntry SDK on the App Router — server fetchers for SSR, RTK Query hooks for client-side data, and MCP-driven diagnostics for content-shape verification.

## Key Features

- **Full Control via Admin Panel.** Menu items, categories, promo blocks, profile fields, and reservation forms are all driven from the OneEntry admin.
- **Flexible Content Management.** Titles, descriptions, weights, prices, allergens, gallery images — managed entirely through OneEntry. No deploy required to update content.
- **Quick Start & Easy Adaptation.** Built on top of a static HTML/CSS mockup and a Figma desktop reference. Styling, components, and grid are wired with Tailwind v4 and a documented token system.
- **Scalability.** SSR via the App Router plus an RTK Query cache on the client. Suitable for both single-location restaurants and multi-location chains.

## Tech Stack

- **Framework:** Next.js 16 (App Router) + React 19
- **Language:** TypeScript (strict)
- **State:** Redux Toolkit + `redux-persist` (cart, favorites, form-field memory)
- **Data:** OneEntry SDK — server fetchers for SSR and RTK Query for client-side data
- **Auth:** Email and Google OAuth sign-in providers with code-based account activation
- **Payments:** Stripe redirect flow via the OneEntry Orders API
- **Styling:** Tailwind v4 with `@theme inline { … }` tokens (no SCSS)
- **Animations:** GSAP + `@gsap/react`
- **Testing:** Jest (unit) + live-SDK integration + Playwright (e2e)

### Detailed Feature List

- **OneEntry SDK integration:** server fetchers (`app/api/server/*`) for SSR and RTK Query hooks (`app/api/api/RTKApi.ts`) for client-side data.
- **User authentication:** email and Google OAuth sign-in providers, with code-based account activation.
- **State management:** Redux Toolkit plus `redux-persist` for cart, favorites, and form-field memory.
- **Menu & catalog:** dynamic product catalog with filtering, pagination (`SHOP_PAGE_LIMIT` in [app/utils/constants.ts](app/utils/constants.ts)), and category pages.
- **Cart & checkout:** delivery line driven by `DELIVERY_PRODUCT_ID` (see [app/utils/constants.ts](app/utils/constants.ts)); order creation via the OneEntry Orders API; Stripe-based payment redirects.
- **Reservations:** table-booking form backed by a OneEntry form marker; booking history in the user profile.
- **Promo & editable content:** every section is wired to a OneEntry block; no hardcoded copy.
- **Animations:** GSAP + `@gsap/react` for transitions, scroll-triggered reveals, and card hover behavior.
- **Styling:** Tailwind v4 with `@theme inline { ... }` tokens in `app/globals.css` and component classes in `app/styles/main.css`. No SCSS.
- **TypeScript:** strict typing across SDK responses, slices, and components.
- **JSDoc:** every exported function / component carries a JSDoc block (per [docs/rules/jsdoc.md](docs/rules/jsdoc.md)).

## Getting Started with OneEntry

Before running the project locally, you need a OneEntry workspace and an app token.

### 1. Create a OneEntry Workspace

If you don't have an account yet, sign up here 👉 <https://oneentry.cloud/>.

Create a workspace — this will be the backend for the storefront.

### 2. Generate an App Token

Inside the admin panel:

1. Navigate to **Project → API**.
2. Create an **App Token**.
3. Copy the generated token — you'll need it in `.env.local`.
4. (Optional) Configure access scopes depending on your use case.

### 3. Seed Content for Import

Ready-to-import content for populating a fresh OneEntry workspace lives in [public/content/](public/content/):

- [public/content/dishes_catalog.xlsx](public/content/dishes_catalog.xlsx) — product catalog (titles, weights, prices, descriptions, category mapping) for bulk import into OneEntry.
- [public/content/images/](public/content/images/) — dish photos referenced by the catalog (filenames match the SKU column).
- [public/content/categories/](public/content/categories/) — category icons (`appetizers.svg`, `dessert.svg`, `main_courses.svg`, …) used as icon attributes on category pages.

Upload the spreadsheet via the admin panel's import tool, then attach the matching image/icon assets. After import, the storefront picks them up automatically — no code changes needed.

Useful links:

- [OneEntry documentation](https://doc.oneentry.cloud/)
- [oneentry npm package](https://www.npmjs.com/package/oneentry)
- [SDK reference](https://js-sdk.oneentry.cloud/docs/index/)

## Environment Variables

To run this project, copy `.env.example` to `.env.local` and fill in the values:

```bash
cp .env.example .env.local
```

| Variable | Purpose |
| --- | --- |
| `NEXT_PUBLIC_ONEENTRY_URL` | Project URL on OneEntry Cloud (e.g. `https://oe-restaurants.oneentry.cloud`). |
| `NEXT_PUBLIC_ONEENTRY_TOKEN` | App token from OneEntry admin → Project → API. |
| `NEXT_PUBLIC_VERCEL_URL` | Public origin used in absolute URLs (canonical, OG, Stripe redirects). |
| `NEXT_PUBLIC_GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | Google OAuth (sign-in provider). Optional during local UI work. |
| `E2E_USER_EMAIL` / `E2E_USER_PASSWORD` | Test-user credentials for the authenticated Playwright specs. Local only — do not commit. |

> Tunable, non-sensitive values (page size, delivery/booking product ids) are **not** environment variables — they live in [app/utils/constants.ts](app/utils/constants.ts). See [Project Constants](#project-constants).

## Project Constants

Values that are project-wide but **not** sensitive (so they don't belong in `.env`) live in [app/utils/constants.ts](app/utils/constants.ts). Two kinds:

**1. Numeric constants** — tunable behaviour:

| Constant | Purpose |
| --- | --- |
| `SHOP_PAGE_LIMIT` | Product cards per catalog page (`/shop`, `/shop/category/*`, `/shop/[handle]`, `/promotions/[handle]`). |
| `DELIVERY_PRODUCT_ID` | Id of the OneEntry product that represents delivery cost. Hidden from the cart list, added as a separate line to totals and to `orderProducts` on order creation. |
| `BOOKING_PRODUCT_ID` | Id of the OneEntry product that represents a table reservation. Sent as the order product when a booking order is created. |

**2. OneEntry markers** — string identifiers that mirror what is configured in the OneEntry admin panel. Centralised so a renamed page/form/attribute is a one-line edit, not a project-wide grep. Use these everywhere instead of inline string literals.

| Map | Used by | Members |
| --- | --- | --- |
| `PAGES` | `getPageByUrl` / `getChildPagesByParentUrl` / `getBlocksByPageUrl` / `getProductsByPageUrl`; also matched against `page.pageUrl` returned by the Menus API in navigation dispatchers | `home`, `support`, `notFound`, `promotions`, `restaurants`, `services`, `filters`, `menu`, `profile`, `cart`, `favorites`, `bookings` |
| `MENUS` | `getMenuByMarker` | `bottomWeb`, `userMenu` |
| `FORMS` | `getFormByMarker`, `postFormsData` (`formIdentifier`), `Orders.getAllOrdersByMarker`, `Orders.createOrder`, `Orders.updateOrderByMarkerAndId` | `contactUs`, `user`, `deliveryOrder`, `bookingOrder`, `reviewForm` |
| `FORM_MODULE_CONFIG_IDS` | fallback `moduleFormConfigs[0].id` per form, used only when the live value from `getFormByMarker` is unavailable | `reviewForm` |
| `ATTR_SETS` | `setMarker` of `getSingleAttributeByMarkerSet` | `dish`, `product` |
| `PRODUCT_ATTRS` | keys into a product's `attributeValues`; `attributeMarker` for `getSingleAttributeByMarkerSet` and product `IFilterParams` (search, preferences, filter, price) | `dishName`, `category`, `description`, `images`, `morePic`, `sku`, `price`, `currency`, `sale`, `weight`, `calories`, `cookingTime`, `ingredients`, `preferences`, `filter` |
| `ATTRS` | `attributeMarker` for non-product attributes | `staticContent` |
| `CONTENT_FILTERS` | `Filters.getFilterByMarker` (curated grouped filter trees) | `dishes` |
| `BLOCKS` | matched against `block.identifier` from `getBlocksByPageUrl`; passed as marker to `Blocks.getBlockByMarker` / `getBlockProducts` | `homePromo`, `recommended`, `homeCategories`, `similarDishes`, `cartComplement`, `recentlyViewed`, `trending`, `personalRecommendations` |
| `PRODUCT_STATUSES` | `product.statusIdentifier` fallback default (live via `getProductStatuses()` / `useOutOfStockMarker()`) | `outOfStock` |
| `ORDER_STATUSES` | `order.statusIdentifier`; feed the `ORDER_HISTORY_STATUSES` / `BOOKING_HISTORY_STATUSES` tab-routing arrays | `delivered`, `canceled`, `cancelled`, `rejected`, `bookingAccepted`, `bookingCancelled`, `bookingSuccess` |

> Orders share the form's marker — that's why `FORMS.deliveryOrder` is used both for `useGetFormByMarkerQuery({ marker })` and for `getAllOrdersByMarker({ marker })`.

When adding new content in the OneEntry admin (a new page, form, menu, attribute set, or attribute), append the marker here first and import from `@/app/utils/constants` at the call site. If the admin rename happens later, only this file changes.

Per-form **field markers** (e.g. `email`, `password`, `delivery_address`, `comment` inside `delivery_order`, or the field markers inside `authData[]` payloads) are intentionally kept inline next to their form — they're part of that form's contract, not a project-wide concept.

**Auth provider identifiers** (`email`, `google`, …) are intentionally NOT in this file. They come from OneEntry admin via `AuthProvider.getAuthProviders()` and the forms thread the active provider's `identifier` through to each API call — see [components/forms/authProviders.ts](components/forms/authProviders.ts) (`sortActiveAuthProviders`, `useEmailAuthProviderMarker`). Hardcoding them in `constants.ts` would give a false impression that the project owns the list.

## Run Locally

> **Node version:** this repo pins Node to `>=20.9.0 <20.19.0 || >=22.0.0 <22.15.0` (see `engines` in [package.json](package.json)). Newer Node breaks Playwright 1.61 — stay within the supported range.

Clone the project:

```bash
git clone https://github.com/ONEENTRY-PLATFORM/nextjs-restaurant.git
```

Go to the project directory:

```bash
cd nextjs-restaurant
```

Install dependencies:

```bash
npm install
```

Start the dev server:

```bash
npm run dev
```

Build the app:

```bash
npm run build
```

Open <http://localhost:3000> with your browser to see the result.

## Scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | Next.js dev server. |
| `npm run build` | Production build. Runs `npm test` first via the `prebuild` hook. |
| `npm run start` | Serve the production build. |
| `npm run lint` | ESLint over the whole repo. |
| `npm run lint-fix` | ESLint with `--fix`. |
| `npm run tsc` | One-shot TypeScript check (`tsc --noEmit`). |
| `npm test` | Jest unit / component tests. |
| `npm run test:watch` | Jest in watch mode. |
| `npm run test:integration` | Live-SDK integration tests (real network, separate config — not run on build). |
| `npm run test:e2e:prod` | Playwright against a production build (`next build` + `next start` on port 3100) — the full-suite entry point. |
| `npm run test:e2e:ui` | Playwright in interactive UI mode (against `next dev` on 3000). |
| `npm run test:e2e:headed` | Playwright with a visible browser (against `next dev` on 3000). |
| `npm run test:e2e:report` | Open the last Playwright HTML report. |

## Project Structure

```text
app/                Next.js App Router — pages, layouts, route handlers, server actions
app/api/            OneEntry SDK wrappers (server fetchers, client hooks, RTK Query, utils)
app/store/          Redux Toolkit slices, providers, persistence config
app/styles/         Component-level CSS (Tailwind v4 + custom classes)
app/globals.css     Tailwind theme tokens (@theme inline { ... })
components/         All UI — cart, profile, reservation, layout, icons, …
public/             Static assets (images, fonts, icons)
public/content/     Seed content for OneEntry import (xlsx, images, icons)
static-html/        Design-team HTML/CSS mockup (read-only reference)
docs/rules/         Extended working rules referenced from CLAUDE.md
tests/              Unit (tests/jest), live-SDK (tests/integration), browser (tests/e2e)
```

### Important files and folders

| File(s) / Folder(s) | Description |
| --- | --- |
| `.env.local` | OneEntry project URL + app token (copied from `.env.example`) |
| `.mcp.json` | OneEntry and Playwright MCP server config |
| `app/layout.tsx` | Root layout |
| `app/dictionaries.ts` | Locale dictionaries |
| `app/animations/` | GSAP transition providers |
| `app/api/` | OneEntry SDK wrappers and RTK Query |
| `app/store/` | Redux Toolkit reducers and providers |
| `app/utils/constants.ts` | Numeric constants + OneEntry marker maps |
| `components/` | All UI components |
| `components/icons/` | SVG icons (via SVGR) and state-driven `.tsx` icons |
| `components/layout/` | Header, modal, mobile menu, products grid, filters |
| `public/content/` | Seed content for OneEntry import (xlsx, images, icons) |
| `static-html/` | Design-team HTML/CSS mockup (reference) |
| `docs/rules/` | Working rules (styles, icons, JSDoc, data fetching) |

## Testing

Every test lives under [tests/](tests/) (no co-located `__tests__/` folders), split into three sibling buckets — each with its own runner and config:

| Layer | Runner | Where | Config |
| --- | --- | --- | --- |
| Unit / Component | Jest + jsdom | [tests/jest/](tests/jest/) | [jest.config.mjs](jest.config.mjs) |
| Integration (live SDK) | Jest + node | [tests/integration/](tests/integration/) | [jest.integration.config.mjs](jest.integration.config.mjs) |
| End-to-end | Playwright (4 projects) | [tests/e2e/](tests/e2e/) | [playwright.config.ts](playwright.config.ts) |

Unit tests import source via the `@/` alias (they are not co-located with the source). Integration tests sign in and create real test-mode orders / Stripe sessions, so they are deliberately excluded from `npm test` / `prebuild` and run only on demand.

### Unit tests (Jest)

```bash
npm test            # run once (also runs on prebuild)
npm run test:watch  # watch mode
```

34 suites. Files live in [tests/jest/](tests/jest/) and import source via `@/`.

| Suite | Under test |
| --- | --- |
| [CartSlice.test.ts](tests/jest/CartSlice.test.ts) | `cartSlice` — add / remove / increase / decrease / setQty / clear |
| [FavoritesSlice.test.ts](tests/jest/FavoritesSlice.test.ts) | `favoritesSlice` — add / dedupe / remove / version / selector |
| [OrderSlice.test.ts](tests/jest/OrderSlice.test.ts) | `orderSlice` — checkout flow: products, currency, payment, steps, coupon, reset |
| [AnimationsSlice.test.ts](tests/jest/AnimationsSlice.test.ts) | `animationsSlice` — `readyState` flag and selector |
| [FormFieldsSlice.test.ts](tests/jest/FormFieldsSlice.test.ts) | `formFieldsSlice` — `addField` keyed by marker |
| [api.test.ts](tests/jest/api.test.ts) | SDK helpers — `isError`, `getImageUrl` |
| [validators.test.ts](tests/jest/validators.test.ts) | Form-field validators (`required`, `email`, masks, …) |
| [compileRegex.test.ts](tests/jest/compileRegex.test.ts) | `compileRegex` — mask-token → RegExp |
| [getSearchParams.test.ts](tests/jest/getSearchParams.test.ts) | `getSearchParams` — catalog filter URL → SDK filter array |
| [formatDate.test.ts](tests/jest/formatDate.test.ts) | `formatDate`, `toLocalIsoDate` |
| [errorHandler.test.ts](tests/jest/errorHandler.test.ts) | `ApiError`, `formatErrorMessage`, `handleApiError`, `isIError`, `useApiErrorHandler` |
| [generatePageMetadata.test.ts](tests/jest/generatePageMetadata.test.ts) | `generatePageMetadata` — title, description, canonical, OG |
| [headerAnimState.test.ts](tests/jest/headerAnimState.test.ts) | One-shot header-anim flag and listener semantics |
| [utils.test.ts](tests/jest/utils.test.ts) | Shared utils — `UsePrice`, `dictText`, `flatMenuToNested`, `normalizePhoneE164`, `shuffleArray`, sorts |
| [authProviders.test.ts](tests/jest/authProviders.test.ts) | `getProviderMeta`, `sortActiveAuthProviders` |
| [orderUtils.test.ts](tests/jest/orderUtils.test.ts) | `computeTotals`, `formatOrderNumber`, `statusLabel`, `isHistoryOrder` |
| [userFields.test.ts](tests/jest/userFields.test.ts) | `findUserField` priority resolution over user profile data |
| [scheduleTime.test.ts](tests/jest/scheduleTime.test.ts) | `formatScheduleAt`, `parseScheduleAt`, `buildDeliveryTimeInterval` |
| [savedAddress.test.ts](tests/jest/savedAddress.test.ts) | `formatAddressLine`, `parseSavedAddresses`, `pickSelectedAddress` |
| [reservationFormUtils.test.ts](tests/jest/reservationFormUtils.test.ts) | `buildFormRows`, `buildTimeIntervalValue`, `formatBookingSummary`, `getAvailableSlotsForDate`, `validateField`, `resolveInputType`, … |
| [reservationOAuthResumeState.test.ts](tests/jest/reservationOAuthResumeState.test.ts) | `set/peek/consume/clearPendingReservationResume` (sessionStorage) |
| [reservationEditState.test.ts](tests/jest/reservationEditState.test.ts) | Module-scoped pending-edit slot (isolated reloads) |
| [deliverySlots.test.ts](tests/jest/deliverySlots.test.ts) | `parseDeliverySchedule`, `makeGetSlots`, `buildDeliveryTimeInterval` — ASAP and scheduled delivery slots |
| [deliveryFields.test.ts](tests/jest/deliveryFields.test.ts) | `inputTypeForAttribute`, `selectGenericFields` — delivery form field assembly |
| [checkout.utils.test.ts](tests/jest/checkout.utils.test.ts) | `filterAllowedAccounts`, `derivePreviewTotals` — payment-account filtering and order-preview totals |
| [checkoutAccounts.test.ts](tests/jest/checkoutAccounts.test.ts) | `filterAllowedAccounts` — account visibility and storage-whitelist intersection |
| [paymentAccountKind.test.ts](tests/jest/paymentAccountKind.test.ts) | `isOnlinePaymentAccount` — Stripe, custom gateways, guards |
| [serverCartSync.utils.test.ts](tests/jest/serverCartSync.utils.test.ts) | `planCartMerge` / `planWishlistMerge` and cart/wishlist content keys — guest ↔ server sync |
| [errorGuard.test.ts](tests/jest/errorGuard.test.ts) | `isMissingProductsError`, `errorGuard` — pruning stale product ids on `setCart` / `setWishlist` |
| [getAllOrdersAcrossStorages.test.ts](tests/jest/getAllOrdersAcrossStorages.test.ts) | Order-storage routing between delivery and booking flows (`isBookingStorageMarker`) |
| [constants.test.ts](tests/jest/constants.test.ts) | `isBookingStorageMarker` and marker-map invariants |
| [authMarkers.test.ts](tests/jest/authMarkers.test.ts) | `pickAuthMarkers` — auth form field-role routing |
| [shopCrawlMeta.test.ts](tests/jest/shopCrawlMeta.test.ts) | `isFilteredShopView`, `shopCrawlMeta` — robots/canonical metadata for catalog views |
| [statsUtils.test.ts](tests/jest/statsUtils.test.ts) | `computeStats`, `bucketFor`, `formatMs`, `formatBytes` — api-test diagnostics helpers |

### Integration tests (live SDK)

```bash
npm run test:integration
```

Run against the real OneEntry / Stripe SDKs (no mocks, real network), in a `node` environment. They sign in and create real test-mode orders / Stripe sessions, so they are kept out of `npm test` / `prebuild`. Naming: `*.integration.test.ts`.

| Suite | Under test |
| --- | --- |
| [stripePayment.integration.test.ts](tests/integration/stripePayment.integration.test.ts) | Live Stripe payment session flow via the OneEntry Orders / Payments SDK |

### End-to-end tests (Playwright)

```bash
npm run test:e2e:prod        # full suite against a production build
npm run test:e2e:ui          # interactive UI mode (dev server)
npm run test:e2e:headed      # visible browser (dev server)
npm run test:e2e:report      # open the last HTML report
```

17 spec files × 4 projects (chromium, firefox, webkit, mobile-chrome `Pixel 7`). `npm run test:e2e:prod` builds and serves a production app on port 3100 (stable memory for the full run); a bare `npx playwright test` — and `:ui` / `:headed` — runs against `next dev` on 3000 and reuses an already-running dev server outside CI. Setting `PLAYWRIGHT_BASE_URL` skips the managed server and targets that origin.

| Spec | What it covers |
| --- | --- |
| [home.spec.ts](tests/e2e/home.spec.ts) | Home page renders, header + logo, navigation to catalog, no console errors, no Next 16 multipart prerender artifacts in the DOM |
| [catalog.spec.ts](tests/e2e/catalog.spec.ts) | `/shop` grid renders cards with title / price / cooking time / weight / rating / add button; card click opens product; nonexistent id → 404 |
| [categories-scroller.spec.ts](tests/e2e/categories-scroller.spec.ts) | Preferences chips on home — render, click → `/shop?preferences=…`, active highlight, multi-select via comma, scroller is horizontally scrollable |
| [filter-popups.spec.ts](tests/e2e/filter-popups.spec.ts) | Category drawer and Filter popup — open/close, tile navigation, waiting time / price / preferences → URL params, reset, BOOKING TABLE → `/restaurants` |
| [product-single.spec.ts](tests/e2e/product-single.spec.ts) | Product page — title + CTA, JSON-LD `Product` schema, OG-image, breadcrumb / preference pill navigation, Add to cart → QuantitySelector, Heart → favorites, related blocks |
| [cart.spec.ts](tests/e2e/cart.spec.ts) | Empty-state, add from card swaps to counter, add from product page, persists into `/cart`, guest APPLY → auth modal |
| [favorites.spec.ts](tests/e2e/favorites.spec.ts) | Empty Favorites popup, add from home → appears in popup, badge count, `/profile/favorites` page, toggle off removes |
| [forms.spec.ts](tests/e2e/forms.spec.ts) | `/support` ContactUs form — schema render, required asterisks, persisted state, HTML5 email validation; Reset-password flow (open from sign-in, generate code) |
| [auth.spec.ts](tests/e2e/auth.spec.ts) | Auth modal — open from header / bottom menu, Email provider form, empty / invalid submits, switch to Create account, registration email validation, modal close |
| [auth-flow.spec.ts](tests/e2e/auth-flow.spec.ts) | Authenticated flow against a real OneEntry test user — sign in → Profile, `/profile`, `/profile/orders`, `/profile/bookings`, expand/collapse, booking row interaction |
| [header-search.spec.ts](tests/e2e/header-search.spec.ts) | Header search bar — visible input, dropdown opens off-listing, Enter → `/shop?search=`, debounced mirror into `?search=` on `/shop` (no dropdown there), URL ↔ input sync, no-match message, clear closes |
| [reservation.spec.ts](tests/e2e/reservation.spec.ts) | Booking form — opens from a restaurant page, required-field guard, guest fill advances to the auth step, authed payment submit posts a booking order with the booking product |
| [not-found.spec.ts](tests/e2e/not-found.spec.ts) | Unknown top-level slug renders the not-found view and offers a working return-home link |
| [shop-pagination.spec.ts](tests/e2e/shop-pagination.spec.ts) | LoadMore appends `?page=2` and grows the grid; category page injects BreadcrumbList JSON-LD; unknown category handle → not-found view |
| [promotions.spec.ts](tests/e2e/promotions.spec.ts) | Promotions list — breadcrumb + non-empty title, Home link, promo banners link to `/promotions/<handle>` and open the detail page |
| [restaurants.spec.ts](tests/e2e/restaurants.spec.ts) | Restaurants index — title + cards, unknown handle → 404; restaurant detail shows the Contacts block and a back link to the index |
| [payment-stripe.spec.ts](tests/e2e/payment-stripe.spec.ts) | Live Stripe delivery checkout — redirect to the hosted Stripe Checkout, `4242` test card → `/payment/success`. Gated behind `E2E_STRIPE=1` (creates real test-mode orders). |

Shared helpers (header / bottom-menu triggers, cookie banner dismissal, sign-in) live in [tests/e2e/fixtures/helpers.ts](tests/e2e/fixtures/helpers.ts); [tests/e2e/fixtures/loadEnv.ts](tests/e2e/fixtures/loadEnv.ts) reads `.env.local` so specs can pick up `E2E_USER_EMAIL` / `E2E_USER_PASSWORD` for `auth-flow`.

### Browser verification (Playwright MCP)

In addition to the scripted suite above, the Playwright **MCP server** (`@playwright/mcp`) is wired in [.mcp.json](.mcp.json) for ad-hoc, in-browser checks of the live UI — navigation, clicks, screenshots, console/network inspection — directly from the assistant loop during development.

## Development Tools

- **MCP-first diagnostics:** the OneEntry MCP (`@oneentry/mcp-server`) and Playwright MCP (`@playwright/mcp`) are wired in [.mcp.json](.mcp.json). The canonical diagnostic order for OneEntry data is **MCP → SDK script → curl** (see [CLAUDE.md §5.3](CLAUDE.md)).
- **Linting:** ESLint with the Next.js, React, Tailwind, JSDoc and `simple-import-sort` plugins.
- **TypeScript:** `npm run tsc` for a one-shot check; the IDE Language Server handles continuous diagnostics.
- **Style tokens:** all design tokens live in `@theme inline { ... }` in [app/globals.css](app/globals.css) — see [docs/rules/styles.md](docs/rules/styles.md).
- **Icon storage:** three forms — decorative `public/images/icons/*.svg`, inline SVG via SVGR, and state-driven `*.tsx` components. See [docs/rules/icons.md](docs/rules/icons.md).
- **Environment variables:** keep `.env.local` aligned with `.env.example` for project URL, app token, and runtime knobs.

## Documentation

This is a [Next.js](https://nextjs.org/) project. Backend and admin panel are provided by OneEntry:

- [Ready-to-use backend and Admin panel](https://doc.oneentry.cloud/ 'Documentation OneEntry Platform')
- [oneentry npm package](https://www.npmjs.com/package/oneentry 'oneentry npm package')
- [SDK reference](https://js-sdk.oneentry.cloud/docs/index/)

For repository-specific guidance, see the in-repo working rules:

- [CLAUDE.md](CLAUDE.md) — working rules, data-fetching conventions, style guide, icon storage, JSDoc contract.
- [docs/rules/data-fetching.md](docs/rules/data-fetching.md) — server fetcher vs RTK Query vs custom hook decision tree.
- [docs/rules/styles.md](docs/rules/styles.md) — Tailwind v4 tokens, theme, content padding scheme.
- [docs/rules/icons.md](docs/rules/icons.md) — three icon storage forms and selection rules.
- [docs/rules/jsdoc.md](docs/rules/jsdoc.md) — JSDoc contract for components, hooks, utilities.
- [docs/rules/performance.md](docs/rules/performance.md) — ISR, `unstable_cache`, lazy popups, prefetch, parallelism.

## Contributing

Contributions are welcome! Please read [CONTRIBUTING.md](CONTRIBUTING.md) for the guidelines and [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md) for community standards.

Good first issues are labeled [`good first issue`](https://github.com/ONEENTRY-PLATFORM/nextjs-restaurant/labels/good%20first%20issue) and [`help wanted`](https://github.com/ONEENTRY-PLATFORM/nextjs-restaurant/labels/help%20wanted).

## Security

Found a security issue? Please follow our [responsible disclosure policy](SECURITY.md) — **do not open a public Issue**.

## License

This project is licensed under the **Apache License 2.0** — see [LICENSE](LICENSE) for details.

## Community & Support

- 💬 [Discord community](https://discord.gg/sM7vFmFaQz)
- 🗨️ [GitHub Discussions](https://github.com/orgs/ONEENTRY-PLATFORM/discussions)
- 📖 [OneEntry documentation](https://doc.oneentry.cloud/)
- 🌐 [oneentry.cloud](https://oneentry.cloud/)

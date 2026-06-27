<img src="https://oneentry.cloud/img/git/oneenrty_light.png" alt="OneEntry Platform" width="200" />

# OneEntry Next.js Restaurant

[![Join our Discord](https://img.shields.io/badge/Discord-Join%20Community-blue?logo=discord&logoColor=white)](https://discord.gg/sM7vFmFaQz)

# OneEntry Platform Restaurant Template

This project is a restaurant storefront built on Next.js 16 and React 19, fully integrated with the [OneEntry](https://oneentry.cloud) headless CMS. It demonstrates how a content-managed restaurant site — menu, product catalog, cart and checkout, table reservations, user profile, promo pages — can be assembled from CMS data backed by `https://oe-restaurants.oneentry.cloud/`.

## Project Goals

1. **Showcase OneEntry’s Capabilities for Hospitality**: A clear example of how OneEntry can drive a full restaurant site — menu, ordering, reservations — with everything editable from the admin panel, without code changes.

2. **Speed Up Front-End Delivery**: A ready foundation for studios and teams launching restaurant or food-service projects on top of OneEntry. Adapt the design, plug in your brand, ship.

3. **Reference Implementation**: Demonstrates production patterns for the OneEntry SDK on the App Router — server fetchers for SSR, RTK Query hooks for client-side data, and MCP-driven diagnostics for content shape verification.

## Key Features

- **Full Control via Admin Panel**: Menu items, categories, promo blocks, profile fields, and reservation forms are all driven from the OneEntry admin.

- **Flexible Content Management**: Titles, descriptions, weights, prices, allergens, gallery images — managed entirely through OneEntry. No deploy required to update content.

- **Quick Start & Easy Adaptation**: Built on top of a static HTML/CSS mockup and a Figma desktop reference. Styling, components, and grid are wired with Tailwind v4 and a documented token system.

- **Scalability**: SSR via the App Router plus an RTK Query cache on the client. Suitable for both small single-location restaurants and multi-location chains.

## Usage

This project targets teams building a restaurant or food-service front-end on OneEntry. It serves as a starting point for a custom storefront with minimal infrastructure setup — clone, point at your OneEntry workspace, customize.

## Features

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

## Project Documentation

This is a [Next.js](https://nextjs.org/) project.

[Ready-to-use backend and Admin panel](https://doc.oneentry.cloud/ 'Documentation OneEntry Platform')

[NPM SDK](https://www.npmjs.com/package/oneentry 'oneentry npm package')

[SDK reference](https://js-sdk.oneentry.cloud/docs/index/)

For repository-specific guidance, see:

- [CLAUDE.md](CLAUDE.md) — working rules, data-fetching conventions, style guide, icon storage, JSDoc contract.
- [docs/rules/data-fetching.md](docs/rules/data-fetching.md) — server fetcher vs RTK Query vs custom hook decision tree.
- [docs/rules/styles.md](docs/rules/styles.md) — Tailwind v4 tokens, theme, content padding scheme.
- [docs/rules/icons.md](docs/rules/icons.md) — three icon storage forms and selection rules.
- [docs/rules/jsdoc.md](docs/rules/jsdoc.md) — JSDoc contract for components, hooks, utilities.
- [MISMATCH-LOG.md](MISMATCH-LOG.md) — running journal of design ↔ implementation gaps.
- [ONEENTRY-ADMIN-TODO.md](ONEENTRY-ADMIN-TODO.md) — backlog of admin-panel content tasks.
- [products-mismatch.md](products-mismatch.md) — seed catalog (titles, weights, prices, image links).
- [GIT-SETUP.md](GIT-SETUP.md) — local git setup.

## Getting Started with OneEntry

Before running the project locally, you need a OneEntry workspace and an app token.

### 1. Create a OneEntry Workspace

If you don’t have an account yet, sign up here
👉 <https://oneentry.cloud/>

Create a workspace — this will be the backend for the storefront.

### 2. Generate an App Token

Inside the admin panel:

1. Navigate to **Project → API**.
2. Create an **App Token**.
3. Copy the generated token — you’ll need it in `.env.local`.
4. (Optional) Configure access scopes depending on your use case.

### 3. Seed Content for Import

Ready-to-import content for populating a fresh OneEntry workspace lives in [public/content/](public/content/):

- [public/content/dishes_catalog.xlsx](public/content/dishes_catalog.xlsx) — product catalog (titles, weights, prices, descriptions, category mapping) for bulk import into OneEntry.
- [public/content/images/](public/content/images/) — dish photos referenced by the catalog (filenames match the SKU column).
- [public/content/categories/](public/content/categories/) — category icons (`appetizers.svg`, `dessert.svg`, `main_courses.svg`, …) used as icon attributes on category pages.

Upload the spreadsheet via the admin panel's import tool, then attach the matching image/icon assets. After import, the storefront picks them up automatically — no code changes needed.

## Environment Variables

To run this project you will need to copy `.env.example` to `.env.local` and fill in the values:

```bash
cp .env.example .env.local
```

| Variable | Purpose |
| --- | --- |
| `NEXT_PUBLIC_ONEENTRY_URL` | Project URL on OneEntry Cloud (e.g. `https://oe-restaurants.oneentry.cloud`). |
| `NEXT_PUBLIC_ONEENTRY_TOKEN` | App token from OneEntry admin → Project → API. |
| `NEXT_PUBLIC_VERCEL_URL` | Public origin used in absolute URLs (canonical, OG, Stripe redirects). |
| `NEXT_PUBLIC_GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | Google OAuth (sign-in provider). Optional during local UI work. |

## Project Constants

Values that are project-wide but **not** sensitive (so they don't belong in `.env`) live in [app/utils/constants.ts](app/utils/constants.ts). Two kinds:

**1. Numeric constants** — tunable behaviour:

| Constant | Purpose |
| --- | --- |
| `SHOP_PAGE_LIMIT` | Product cards per catalog page (`/shop`, `/shop/category/*`, `/shop/[handle]`, `/promo/[handle]`). |
| `DELIVERY_PRODUCT_ID` | Id of the OneEntry product that represents delivery cost. Hidden from the cart list, added as a separate line to totals and to `orderProducts` on order creation. |

**2. OneEntry markers** — string identifiers that mirror what is configured in the OneEntry admin panel. Centralised so a renamed page/form/attribute is a one-line edit, not a project-wide grep. Use these everywhere instead of inline string literals.

| Map | Used by | Members |
| --- | --- | --- |
| `PAGES` | `getPageByUrl` / `getChildPagesByParentUrl` / `getBlocksByPageUrl` / `getProductsByPageUrl`; also matched against `page.pageUrl` returned by the Menus API in navigation dispatchers | `home`, `support`, `notFound`, `blog`, `restaurants`, `services`, `filters`, `menu`, `profile`, `cart`, `favorites`, `bookings` |
| `MENUS` | `getMenuByMarker` | `bottomWeb`, `userMenu` |
| `FORMS` | `getFormByMarker`, `postFormsData` (`formIdentifier`), `Orders.getAllOrdersByMarker`, `Orders.createOrder`, `Orders.updateOrderByMarkerAndId` | `contactUs`, `user`, `deliveryOrder`, `bookingOrder` |
| `ATTR_SETS` | `setMarker` of `getSingleAttributeByMarkerSet` | `dish`, `product` |
| `ATTRS` | `attributeMarker` field on attribute / filter requests | `preferences`, `staticContent`, `sku`, `price`, `cookingTime` |
| `BLOCKS` | matched against `block.identifier` from `getBlocksByPageUrl`; passed as marker to `Blocks.getBlockByMarker` / `getBlockProducts` | `homePromo`, `recommended`, `homeCategories`, `similarDishes` |

> Orders share the form's marker — that's why `FORMS.deliveryOrder` is used both for `useGetFormByMarkerQuery({ marker })` and for `getAllOrdersByMarker({ marker })`.

When adding new content in the OneEntry admin (a new page, form, menu, attribute set, or attribute), append the marker here first and import from `@/app/utils/constants` at the call site. If the admin rename happens later, only this file changes.

Per-form **field markers** (e.g. `email`, `password`, `delivery_address`, `comment` inside `delivery_order`, or the field markers inside `authData[]` payloads) are intentionally kept inline next to their form — they're part of that form's contract, not a project-wide concept.

**Auth provider identifiers** (`email`, `google`, …) are intentionally NOT in this file. They come from OneEntry admin via `AuthProvider.getAuthProviders()` and the forms thread the active provider's `identifier` through to each API call — see [components/forms/authProviders.ts](components/forms/authProviders.ts) (`sortActiveAuthProviders`, `useEmailAuthProviderMarker`). Hardcoding them in `constants.ts` would have given a false impression that the project owns the list.

## Run Locally

Clone the project

```bash
  git clone https://github.com/ONEENTRY-PLATFORM/nextjs-restaurant.git
```

Go to the project directory

```bash
  cd nextjs-restaurant
```

Install dependencies

```bash
  npm install
```

Start the dev server

```bash
  npm run dev
```

Build the app

```bash
  npm run build
```

Open <http://localhost:3000> with your browser to see the result.

## Scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | Next.js dev server. |
| `npm run build` | Production build. |
| `npm run start` | Serve the production build. |
| `npm run lint` | ESLint over the whole repo. |
| `npm run lint-fix` | ESLint with `--fix`. |
| `npm run tsc` | One-shot TypeScript check (`tsc --noEmit`). |
| `npm test` | Jest unit / component tests. |
| `npm run test:watch` | Jest in watch mode. |
| `npm run test:e2e` | Playwright end-to-end suite (auto-starts `npm run dev` if no `PLAYWRIGHT_BASE_URL`). |
| `npm run test:e2e:ui` | Playwright in interactive UI mode. |
| `npm run test:e2e:headed` | Playwright with a visible browser. |
| `npm run test:e2e:report` | Open the last Playwright HTML report. |

## Project Structure

`app`: Next.js App Router — pages, layouts, route handlers, server actions.
`app/api`: OneEntry SDK wrappers (server fetchers, client hooks, RTK Query, utils).
`app/store`: Redux Toolkit slices, providers, persistence config.
`app/styles`: Component-level CSS (Tailwind v4 + custom classes).
`app/globals.css`: Tailwind theme tokens (`@theme inline { ... }`).
`components`: All UI — cart, profile, reservation, layout, icons, …
`public`: Static assets (images, fonts, icons).
`static-html`: Design-team HTML/CSS mockup (read-only reference).
`docs/rules`: Extended working rules referenced from `CLAUDE.md`.

## Testing

Two suites: pure-logic and component-level tests run under Jest, browser-level flows run under Playwright. There is no overlap — anything that needs a real DOM/network is in `e2e/`, anything else lives next to the source.

| Layer | Runner | Where | Config |
| --- | --- | --- | --- |
| Unit / Component | Jest + jsdom | `app/**/__tests__/`, `components/**/__tests__/` | [jest.config.mjs](jest.config.mjs) |
| End-to-end | Playwright (4 projects) | [e2e/](e2e/) | [playwright.config.ts](playwright.config.ts) |

### Unit tests (Jest)

```bash
npm test            # run once
npm run test:watch  # watch mode
```

22 suites, ~296 cases. Files live next to the source in `__tests__/` folders.

| Suite | Under test |
| --- | --- |
| [CartSlice.test.ts](app/store/reducers/__tests__/CartSlice.test.ts) | `cartSlice` — add / remove / increase / decrease / setQty / clear |
| [FavoritesSlice.test.ts](app/store/reducers/__tests__/FavoritesSlice.test.ts) | `favoritesSlice` — add / dedupe / remove / version / selector |
| [OrderSlice.test.ts](app/store/reducers/__tests__/OrderSlice.test.ts) | `orderSlice` — checkout flow: products, currency, payment, steps, coupon, reset |
| [AnimationsSlice.test.ts](app/store/reducers/__tests__/AnimationsSlice.test.ts) | `animationsSlice` — `readyState` flag and selector |
| [FormFieldsSlice.test.ts](app/store/reducers/__tests__/FormFieldsSlice.test.ts) | `formFieldsSlice` — `addField` keyed by marker |
| [api.test.ts](app/api/api/__tests__/api.test.ts) | SDK helpers — `isError`, `getImageUrl` |
| [validators.test.ts](app/api/utils/__tests__/validators.test.ts) | Form-field validators (`required`, `email`, masks, …) |
| [compileRegex.test.ts](app/api/utils/__tests__/compileRegex.test.ts) | `compileRegex` — mask-token → RegExp |
| [getSearchParams.test.ts](app/api/utils/__tests__/getSearchParams.test.ts) | `getSearchParams` — catalog filter URL → SDK filter array |
| [formatDate.test.ts](app/utils/__tests__/formatDate.test.ts) | `formatDate`, `toLocalIsoDate` |
| [errorHandler.test.ts](app/utils/__tests__/errorHandler.test.ts) | `ApiError`, `formatErrorMessage`, `handleApiError`, `isIError`, `useApiErrorHandler` |
| [generatePageMetadata.test.ts](app/utils/__tests__/generatePageMetadata.test.ts) | `generatePageMetadata` — title, description, canonical, OG |
| [headerAnimState.test.ts](app/animations/__tests__/headerAnimState.test.ts) | One-shot header-anim flag and listener semantics |
| [utils.test.ts](components/__tests__/utils.test.ts) | Shared utils — `UsePrice`, `dictText`, `flatMenuToNested`, `normalizePhoneE164`, `shuffleArray`, sorts |
| [authProviders.test.ts](components/forms/__tests__/authProviders.test.ts) | `getProviderMeta`, `sortActiveAuthProviders` |
| [orderUtils.test.ts](components/profile/orders/__tests__/orderUtils.test.ts) | `computeTotals`, `formatOrderNumber`, `statusLabel`, `isHistoryOrder` |
| [userFields.test.ts](components/cart/steps/step-payment/__tests__/userFields.test.ts) | `findUserField` priority resolution over user profile data |
| [scheduleTime.test.ts](components/cart/steps/step-payment/__tests__/scheduleTime.test.ts) | `formatScheduleAt`, `parseScheduleAt`, `buildDeliveryTimeInterval` |
| [savedAddress.test.ts](components/cart/steps/step-payment/__tests__/savedAddress.test.ts) | `formatAddressLine`, `parseSavedAddresses`, `pickSelectedAddress` |
| [reservationFormUtils.test.ts](components/reservation/__tests__/reservationFormUtils.test.ts) | `buildFormRows`, `buildTimeIntervalValue`, `formatBookingSummary`, `getAvailableSlotsForDate`, `validateField`, `resolveInputType`, … |
| [reservationOAuthResumeState.test.ts](components/reservation/__tests__/reservationOAuthResumeState.test.ts) | `set/peek/consume/clearPendingReservationResume` (sessionStorage) |
| [reservationEditState.test.ts](components/reservation/__tests__/reservationEditState.test.ts) | Module-scoped pending-edit slot (isolated reloads) |

### End-to-end tests (Playwright)

```bash
npm run test:e2e             # run the full suite
npm run test:e2e:ui          # interactive UI mode
npm run test:e2e:headed      # visible browser
npm run test:e2e:report      # open the last HTML report
```

10 spec files, 66 cases × 4 projects (chromium, firefox, webkit, mobile-chrome `Pixel 7`). The config auto-starts `npm run dev` unless `PLAYWRIGHT_BASE_URL` is set, and reuses an already-running dev server outside CI.

| Spec | What it covers |
| --- | --- |
| [home.spec.ts](e2e/home.spec.ts) | Home page renders, header + logo, navigation to catalog, no console errors, no Next 16.2.6 multipart prerender artifacts in the DOM |
| [catalog.spec.ts](e2e/catalog.spec.ts) | `/shop` grid renders cards with title / price / cooking time / weight / rating / add button; card click opens product; nonexistent id → 404 |
| [categories-scroller.spec.ts](e2e/categories-scroller.spec.ts) | Preferences chips on home — render, click → `/shop?preferences=…`, active highlight, multi-select via comma, scroller is horizontally scrollable |
| [filter-popups.spec.ts](e2e/filter-popups.spec.ts) | Category drawer and Filter popup — open/close, tile navigation, waiting time / price / preferences → URL params, reset, BOOKING TABLE → `/restaurants` |
| [product-single.spec.ts](e2e/product-single.spec.ts) | Product page — title + CTA, JSON-LD `Product` schema, OG-image, breadcrumb / preference pill navigation, Add to cart → QuantitySelector, Heart → favorites, related blocks |
| [cart.spec.ts](e2e/cart.spec.ts) | Empty-state, add from card swaps to counter, add from product page, persists into `/cart`, guest APPLY → auth modal |
| [favorites.spec.ts](e2e/favorites.spec.ts) | Empty Favorites popup, add from home → appears in popup, badge count, `/profile/favorites` page, toggle off removes |
| [forms.spec.ts](e2e/forms.spec.ts) | `/support` ContactUs form — schema render, required asterisks, persisted state, HTML5 email validation; Reset-password flow (open from sign-in, generate code) |
| [auth.spec.ts](e2e/auth.spec.ts) | Auth modal — open from header / bottom menu, Email provider form, empty / invalid submits, switch to Create account, registration email validation, modal close |
| [auth-flow.spec.ts](e2e/auth-flow.spec.ts) | Authenticated flow against a real OneEntry test user — sign in → Profile, `/profile`, `/profile/orders`, `/profile/bookings`, expand/collapse, booking row interaction |

Shared helpers (header / bottom-menu triggers, cookie banner dismissal, sign-in) live in [e2e/fixtures/helpers.ts](e2e/fixtures/helpers.ts); [e2e/fixtures/loadEnv.ts](e2e/fixtures/loadEnv.ts) reads `.env.local` so specs can pick up `PLAYWRIGHT_TEST_USER_EMAIL` / `…_PASSWORD` for `auth-flow`.

### Browser verification (Playwright MCP)

In addition to the scripted suite above, the Playwright **MCP server** (`@playwright/mcp`) is wired in [.mcp.json](.mcp.json) for ad-hoc, in-browser checks of the live UI — navigation, clicks, screenshots, console/network inspection — directly from the assistant loop during development.

## Development Tools

- **MCP-first diagnostics:** the OneEntry MCP (`@oneentry/mcp-server`) and Playwright MCP (`@playwright/mcp`) are wired in [.mcp.json](.mcp.json). The canonical diagnostic order for OneEntry data is **MCP → SDK script → curl** (see [CLAUDE.md §5.3](CLAUDE.md)).
- **Linting:** ESLint with the Next.js, React, Tailwind, JSDoc and `simple-import-sort` plugins.
- **TypeScript:** `npm run tsc` for a one-shot check; the IDE Language Server handles continuous diagnostics.
- **Style tokens:** all design tokens live in `@theme inline { ... }` in [app/globals.css](app/globals.css) — see [docs/rules/styles.md](docs/rules/styles.md).
- **Icon storage:** three forms — decorative `public/images/icons/*.svg`, inline SVG via SVGR, and state-driven `*.tsx` components. See [docs/rules/icons.md](docs/rules/icons.md).
- **Environment variables:** keep `.env.local` aligned with `.env.example` for project URL, app token, and runtime knobs.

### Important files and folders

| File(s) / Folder(s)         | Description                                                   |
| --------------------------- | ------------------------------------------------------------- |
| `.env.local`                | OneEntry project URL + app token (copied from `.env.example`) |
| `.mcp.json`                 | OneEntry and Playwright MCP server config                     |
|                             |                                                               |
| `app/`                      | Next.js App Router entry points                               |
| `app/layout.tsx`            | Root layout                                                   |
| `app/dictionaries.ts`       | Locale dictionaries                                           |
| `app/animations/`           | GSAP transition providers                                     |
| `app/api/`                  | OneEntry SDK wrappers and RTK Query                           |
| `app/store/`                | Redux Toolkit reducers and providers                          |
|                             |                                                               |
| `components/`               | All UI components                                             |
| `components/icons/`         | SVG icons (via SVGR) and state-driven `.tsx` icons            |
| `components/layout/`        | Header, modal, mobile menu, products grid, filters            |
|                             |                                                               |
| `public/`                   | Static assets                                                 |
| `public/content/`           | Seed content for OneEntry import (xlsx, images, icons)        |
| `static-html/`              | Design-team HTML/CSS mockup (reference)                       |
| `docs/rules/`               | Working rules (styles, icons, JSDoc, data fetching)           |

## Detailed Docs

This is the central hub for the in-repo working rules and operational journals.

### Working Rules

- [CLAUDE.md](CLAUDE.md)
- Top-level working rules for contributors.

### Data Fetching

- [docs/rules/data-fetching.md](docs/rules/data-fetching.md)
- Server fetcher vs RTK Query vs custom hook decision tree.

### Styles

- [docs/rules/styles.md](docs/rules/styles.md)
- Tailwind v4 tokens, theme, content padding scheme.

### Icons

- [docs/rules/icons.md](docs/rules/icons.md)
- Three icon storage forms and selection rules.

### JSDoc

- [docs/rules/jsdoc.md](docs/rules/jsdoc.md)
- JSDoc contract for components, hooks, utilities.

### Mismatch Journal

- [MISMATCH-LOG.md](MISMATCH-LOG.md)
- Design ↔ implementation gaps, severity P0–P3.

### Admin Backlog

- [ONEENTRY-ADMIN-TODO.md](ONEENTRY-ADMIN-TODO.md)
- Admin-panel content tasks (pages, dictionary markers, forms, payments).

---

In case of any issues or questions, you can post:
[GitHub discussions for OneEntry templates](https://github.com/orgs/ONEENTRY-PLATFORM/discussions)

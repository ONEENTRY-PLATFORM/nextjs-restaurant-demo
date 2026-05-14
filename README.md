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
- **Menu & catalog:** dynamic product catalog with filtering, pagination (`NEXT_PUBLIC_SHOP_PAGE_LIMIT`), and category pages.
- **Cart & checkout:** delivery line driven by `NEXT_PUBLIC_DELIVERY_PRODUCT_ID`; order creation via the OneEntry Orders API; Stripe-based payment redirects.
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
| `NEXT_PUBLIC_SHOP_PAGE_LIMIT` | Product cards per catalog page. Default `8`. |
| `NEXT_PUBLIC_DELIVERY_PRODUCT_ID` | OneEntry product id representing delivery cost (not shown in the cart list; added to order totals). Default `33`. |

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

The project uses Jest + Testing Library for unit and component tests.

| Layer            | Tool                   | Scope                                                |
|------------------|------------------------|------------------------------------------------------|
| Unit / Component | Jest + Testing Library | Redux slices, utility functions, UI components       |

### Unit tests (Jest)

```bash
npm test            # run once
npm run test:watch  # watch mode
```

Test files live next to the source in `__tests__/` folders (e.g. `app/api/utils/__tests__/`, `app/store/reducers/__tests__/`, `components/**/__tests__/`).

### Browser verification (Playwright MCP)

End-to-end tests are **not** wired as a Playwright test suite in this repo. Instead, the Playwright **MCP server** (`@playwright/mcp`) is configured in [.mcp.json](.mcp.json) and is used for ad-hoc, in-browser checks of the live UI — navigation, clicks, screenshots, console/network inspection — directly from the assistant loop during development.

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

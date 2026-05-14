# nextjs-restaurant

Next.js 16 + React 19 storefront for a restaurant, powered by the [OneEntry](https://oneentry.cloud) headless CMS. Renders the menu, product catalog, cart and checkout, reservations, user profile, and promo pages from CMS data (`https://oe-restaurants.oneentry.cloud/`).

The repository tracks two parallel sources for the UI:

- **[static-html/](static-html/)** — the design-team HTML/CSS mockup. Source of truth for DOM structure, class names, and assets.
- **Figma** — `https://www.figma.com/design/l8tkFOn0DQ7tjvoMr15Fno/Rest_desktop`. Source of truth for sizes, gaps, paddings and breakpoints. On size conflicts, Figma wins.

Rules for working in this repo are documented in [CLAUDE.md](CLAUDE.md); the running journal of design/data mismatches lives in [MISMATCH-LOG.md](MISMATCH-LOG.md).

---

## Stack

- **Framework** — Next.js 16 (App Router) with React 19.
- **CMS** — OneEntry SDK ([`oneentry`](https://www.npmjs.com/package/oneentry) npm package), wired through `app/api/server/*` (server fetchers) and `app/api/hooks/*` (client hooks).
- **State** — Redux Toolkit + RTK Query (`app/api/api/RTKApi.ts`), plus `redux-persist` for cart, favorites, and form-field memory.
- **Styling** — Tailwind v4 (`@theme inline { ... }` in [app/globals.css](app/globals.css)) and component CSS in [app/styles/main.css](app/styles/main.css). No SCSS.
- **Animations** — GSAP + `@gsap/react`.
- **Icons** — three storage forms, see [CLAUDE.md §3.3](CLAUDE.md): `public/images/icons/*.svg` (decorative, static), `components/icons/*.svg` (inline via SVGR), `components/icons/*.tsx` (state-driven).
- **MCP** — OneEntry MCP server is wired in [.mcp.json](.mcp.json). Diagnostic order is **MCP → SDK script → curl** (see [CLAUDE.md §5.1](CLAUDE.md)).

---

## Getting started

```bash
npm install
cp .env.example .env.local   # then fill the values
npm run dev
```

Open <http://localhost:3000>.

### Required env vars

See [.env.example](.env.example) for the full list. The minimum to boot:

| Variable | Purpose |
| --- | --- |
| `NEXT_PUBLIC_ONEENTRY_URL` | Project URL on OneEntry Cloud (e.g. `https://oe-restaurants.oneentry.cloud`). |
| `NEXT_PUBLIC_ONEENTRY_TOKEN` | App token from OneEntry admin → Project → API. |
| `NEXT_PUBLIC_VERCEL_URL` | Public origin used in absolute URLs (canonical, OG, Stripe redirects). |
| `NEXT_PUBLIC_GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | Google OAuth (sign-in provider). Optional during local UI work. |
| `NEXT_PUBLIC_SHOP_PAGE_LIMIT` | Product cards per catalog page. Default `8`. |
| `NEXT_PUBLIC_DELIVERY_PRODUCT_ID` | OneEntry product id representing delivery cost (not shown in the cart list; added to order totals). Default `33`. |

---

## Scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | Next.js dev server. |
| `npm run build` | Production build. |
| `npm run start` | Serve the production build. |
| `npm run lint` | ESLint over the whole repo. |
| `npm run lint-fix` | ESLint with `--fix`. |
| `npm run tsc` | One-shot TypeScript check (`tsc --noEmit`). |

---

## Project layout

```text
app/                Next.js App Router pages, layouts, route handlers.
  api/              SDK wrappers (server fetchers, hooks, RTK Query, utils).
  store/            Redux slices and providers.
  styles/           Component-level CSS (Tailwind v4 + custom classes).
  globals.css       Tailwind theme tokens (@theme inline { ... }).
components/         All UI. Split by feature: cart, profile, reservation, ...
  icons/            SVG/TSX icon components.
  layout/           Header, modal, mobile menu, products grid, filters, ...
public/             Static assets (images, fonts, icons).
static-html/        Design-team HTML/CSS mockup (read-only reference).
.claude/            Claude Code workspace (rules, temp inspect scripts).
CLAUDE.md           Working rules for contributors and for Claude.
MISMATCH-LOG.md     Running journal of design ↔ implementation gaps.
products-mismatch.md Seed product data for the OneEntry admin (reference).
```

---

## Documentation map

- [CLAUDE.md](CLAUDE.md) — coding rules, data-fetching conventions, style guide, icon-storage policy, JSDoc contract.
- [docs/rules/](docs/rules/) — extended versions of the style, icon and JSDoc rules referenced from CLAUDE.md.
- [MISMATCH-LOG.md](MISMATCH-LOG.md) — design ↔ implementation mismatches (sections A and B).
- [ONEENTRY-ADMIN-TODO.md](ONEENTRY-ADMIN-TODO.md) — tasks for the OneEntry admin (pages, dictionary markers, payment accounts, …).
- [products-mismatch.md](products-mismatch.md) — seed catalog for the OneEntry admin (titles, weights, prices, image links).
- [GIT-SETUP.md](GIT-SETUP.md) — local git setup.

OneEntry SDK reference: <https://js-sdk.oneentry.cloud/docs/index/>.

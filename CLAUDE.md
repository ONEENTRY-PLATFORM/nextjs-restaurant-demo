# Claude Rules — nextjs-restaurant

Rules for how Claude works in this project. Follow strictly. Update this file as new agreements with the user emerge (rule 4).

---

## 1. Markup sources — [static-html/](static-html/) + Figma (sizes take priority)

The [static-html/](static-html/) folder contains a ready HTML/CSS markup that needs to be ported into a full Next.js application backed by OneEntry CMS (project: `https://oe-restaurants.oneentry.cloud/`). The desktop Figma is at `https://www.figma.com/design/l8tkFOn0DQ7tjvoMr15Fno/Rest_desktop`.

- **Static-html is the truth for DOM structure**: classes, tags, element order, text placeholders, assets. When implementing any component, first look at the matching `.html` in [static-html/](static-html/).
- **Figma is the truth for sizes** (gap, padding, max-width, card widths/heights, distances between sections). On a numeric-size conflict between static-html and Figma — **Figma wins** (static-html does not always keep up with mockup updates). Example: card row gap = `xl:gap-15` (60px) per Figma, even if `static-html/index.html` says `gap-5` (20px).
- Do not "improve" the markup to your own taste (do not change tags, do not reorder blocks, do not rename classes) without an explicit user request.
- Pull CSS/assets from [static-html/](static-html/) (already partially copied to [public/](public/) and [app/styles/](app/styles/)). If something is missing — port it over from `static-html`, don't regenerate from scratch.

## 2. OneEntry integration or mocks — right away, no "stubs for later"

When implementing each component:

1. **First try to pull data from OneEntry** via MCP (rule 5) and the server API wrappers in [app/api/](app/api/).
2. **If OneEntry doesn't have the data yet** — use mock data shaped to match the real OneEntry response (so a later swap is trivial). The mock goes next to the component in a `mock*.ts` file (see the existing pattern [components/home/mockMenuData.ts](components/home/mockMenuData.ts)).
3. **Don't leave components empty** or with `TODO: hook up data later`. Either OneEntry or a mock — always a working render.
4. The mock must visually match the markup (rule 1): if `index.html` has 8 dish cards in a section — the mock returns 8 too.

## 3.1. Styles, theme, and code hygiene → [docs/rules/styles.md](docs/rules/styles.md)

Full rules for working with styles (Tailwind v4, `@theme` tokens, arbitrary values, content side padding, cleanup of commented-out blocks) — in [docs/rules/styles.md](docs/rules/styles.md).

**tl;dr:**

- Design tokens live only in `@theme inline { ... }` in [app/globals.css](app/globals.css), not in [tailwind.config.js](tailwind.config.js).
- Component classes (`.menu_item`, `.cart_btn`, …) — in [app/styles/main.css](app/styles/main.css), wired via `@import` (not `@reference`).
- Before writing `className="…[18px]…"` first look for a ready-made theme class (e.g. `h-4.5`). Arbitrary `[...]` — only when no token exists; if it repeats in 3+ places — introduce a token.
- Any root page wrapper — `px-4` + the scheme `max-w-85 xs:max-w-none md:max-w-175 lg:max-w-250 xl:max-w-323`. Content must not stick to the viewport edge.
- Commented `import`s and JSX `{/* <X /> */}` — delete on the spot when editing the file, don't carry them along.

## 3.3. Icons → [docs/rules/icons.md](docs/rules/icons.md)

Three storage forms for icons and selection rules — in [docs/rules/icons.md](docs/rules/icons.md).

**tl;dr:**

- `public/images/icons/*.svg` — a decorative icon with hard-coded colors, loaded as `<img>` via `next/image`. Default for new ones.
- `components/icons/*.svg` (via SVGR) — when an inline SVG in the DOM is needed (parent CSS on `path`, `class="hover-target"`, `currentColor`).
- `components/icons/*.tsx` — when the icon has props that change the render (`filled`, `active`, `size`, `variant`).
- Inline `<svg>` directly in feature components — not allowed. Duplicates — check [components/icons/](components/icons/) and [public/images/icons/](public/images/icons/) first.

## 3.5. Performance — SSR caching, lazy, parallelism → [docs/rules/performance.md](docs/rules/performance.md)

Full rules: ISR (`force-static` + `revalidate`), `unstable_cache` over server fetchers, lazy-mount popups via `PopupRoot` + prefetch on hover, IntersectionObserver gate for images, deferred loading via `requestIdleCallback`, parallelizing layout fetches via a Promise prop with React 19 `use()` — in [docs/rules/performance.md](docs/rules/performance.md).

**tl;dr:**

- Content pages — `export const dynamic = 'force-static'; export const revalidate = 300;`. Never `force-dynamic` without justification.
- Every `useSearchParams()` in the page tree — wrapped in `<Suspense>`, otherwise ISR silently switches off.
- Server fetcher = `unstable_cache(impl, [keyParts], { revalidate, tags })` wrapped in React `cache()`. It's composition, not an alternative.
- In one server component, independent fetches — `Promise.all`. Listing fetch per item — `Promise.all(items.map(...))`. No for-await waterfalls.
- Popups (Cart/Profile/Reservation/Modal) are mounted only via [PopupRoot](components/layout/PopupRoot.tsx). A loader is added to [popupRegistry.ts](components/layout/popupRegistry.ts). On the trigger button — `onPointerEnter={() => prefetchPopup('CartPopup')}`.
- Heavy libs (lightbox/charts) — separate module with a static CSS import, `dynamic({ ssr: false })`, `mounted` state. Turbopack does NOT support dynamic import of CSS.
- Repeating product images — gate via `useNearViewport({ rootMargin: '300px' })` on top of `<Image loading="lazy">`.
- `<Link>` in listings — `prefetch={false}` for product cards.

## 3.4. JSDoc → [docs/rules/jsdoc.md](docs/rules/jsdoc.md)

Full JSDoc contract (structure, alignment, examples for components / async fetchers / utilities) — in [docs/rules/jsdoc.md](docs/rules/jsdoc.md).

**tl;dr:**

- JSDoc is mandatory above **every** declared function: React component, hook, utility, server action, handler.
- All `@param` — with a type in curly braces (deliberate duplication of TS types for IDE tooltips).
- `@returns` — **without** a type, description only.
- Between the summary line and `@param` only a **flow paragraph** is allowed (sequence of actions / conditional branches / mobile vs desktop). Rationale, usage context, historical notes, cross-references to callers — **not allowed**: the place for such comments is the PR description / commit message, not JSDoc.
- Destructured props — chain notation: first `props` (`{object}`), then each field `props.foo` with its own type.
- Inner callbacks (`useEffect`, `map`, `onClick={() => …}`) — no JSDoc.
- This rule **overrides** the default "no comments": JSDoc is part of a function's contract.

## 4. Iterative updates to these rules

When the user gives a new directive that changes or extends how to work on the project (code style, tools, constraints, priorities) — extend this `CLAUDE.md` with a new item or refine an existing one. Rules evolve together with the project.

- Short agreements about response/communication style — into personal memory (`~/.claude/projects/...`).
- Project rules (how to implement features, where to fetch data from, where to write) — here, in `CLAUDE.md`.

## 5. OneEntry — data, MCP, diagnostics

### 5.1. Where to fetch data → [docs/rules/data-fetching.md](docs/rules/data-fetching.md)

Server fetcher ([app/api/server/](app/api/server/)) for SSR, RTK Query (`useGet*Query` via [RTKApi.ts](app/api/api/RTKApi.ts)) for client-side GET with auto-cache, custom hook ([app/api/hooks/](app/api/hooks/)) for mutations with side effects. Full rules, patterns, and decision tree — in [docs/rules/data-fetching.md](docs/rules/data-fetching.md).

### 5.2. MCP OneEntry — canonical source of truth

Strictly follow the rules and patterns of the OneEntry MCP server (`@oneentry/mcp-server`, configured in [.mcp.json](.mcp.json)), unless explicitly overridden by these rules.

- Before implementing any CMS-driven feature, call `mcp__oneentry__load-context` / `mcp__oneentry__get-skill` / `mcp__oneentry__get-project-config` and follow the returned recommendations (request structure, naming, argument order, error handling).
- Use the exact SDK methods and signatures the MCP prescribes — do not invent your own `fetch` wrappers when MCP recommends the `oneentry` npm package.
- OneEntry response types (Products / Pages / Blocks / Forms / Orders / Attributes) must be brought to the shape MCP dictates (SDK types and interfaces), not an arbitrary one.
- Graceful fallback on `"Resource is closed"` and empty collections is mandatory.
- If an MCP recommendation contradicts the local rules (1–4), the local rules win — but such a conflict must be raised as a question to the user, not resolved silently.

### 5.3. OneEntry diagnostics — first via MCP/SDK, not curl

When you need to inspect real OneEntry data (forms, pages, products, orders, attributes), the order is strictly:

1. **First MCP** — `mcp__oneentry__inspect-api`, `get-skill`, `load-context`, `get-rule` — this is the canonical source.
2. **If MCP doesn't cover the case** — a temporary node script via the SDK (`defineOneEntry(...)`) in `.claude/temp/`, as described in the `inspect-api` skill. The script is deleted after inspection.
3. **Curl is the last resort**, and only if neither MCP nor the SDK script is available for some reason.

**Why exactly this order:**

- The SDK normalizes responses (`additionalFields` array → `Record<marker, field>`, `attributeValues` by locale, etc.). Curl returns raw data that **does NOT match** what the SDK delivers to the app — code written against raw data will break.
- The SDK sets headers correctly (`x-app-token`, `x-device-metadata`, `Authorization` after auth). If you set `Authorization: Bearer <APP_TOKEN>` manually — the SDK expects `x-app-token`, and the server returns `403 "Resource is closed"` even for an entirely public resource. That same 403 gets caught in a curl request and is easily mistaken for "the resource is closed in the admin", though the actual issue is the wrong header.
- Real configuration IDs (`moduleFormConfigs[0].id`, `moduleEntityIdentifier`, `formIdentifier`) come only from the SDK response to `getFormByMarker`. Hardcoding such IDs "by default" is not allowed — they diverge between projects and silently break `postFormsData`.

**When the user complains "it doesn't work":** don't guess the cause. Reproduce the request via an MCP/SDK script, look at the response, and only then fix the code. Without a confirmed server response, any fix is guesswork.

## 6. Don't run `npm run lint` / `npm run build` automatically

These commands are launched by the user after their own edits. Claude **must not** proactively run `npm run lint`, `npm run build`, `next build`, `tsc --noEmit`, etc. — even after mass replacements or refactors. If you want a check at the end of work — just tell the user "done, you can run lint/build".

- **Why:** the build can take minutes, it adds noise to chat, and the user keeps a dev server running in parallel and wants to control the verification timing themselves.
- **Exception:** only if the user explicitly asks ("run lint", "check the build").
- **IDE TypeScript diagnostics** already flow through hooks and land in context automatically — this covers a basic sanity check without explicitly running `tsc`.

## 7. Tests — all under `tests/`, split into three

Every test lives under [tests/](tests/) (no co-located `__tests__/` folders). Three sibling buckets, each with its own runner/config:

| Folder | Kind | Env | Config | Run |
| --- | --- | --- | --- | --- |
| [tests/jest/](tests/jest/) | Unit (pure helpers, reducers, utils) | jsdom | [jest.config.mjs](jest.config.mjs) | `npm test` (also on `prebuild`) |
| [tests/integration/](tests/integration/) | Live OneEntry/Stripe SDK (real network, no mocks) | node | [jest.integration.config.mjs](jest.integration.config.mjs) | `npm run test:integration` |
| [tests/e2e/](tests/e2e/) | Playwright (`*.spec.ts` + `fixtures/`) | browser | [playwright.config.ts](playwright.config.ts) | `npm run test:e2e:prod` / `npx playwright test` |

- **Unit tests import source via the `@/` alias** (e.g. `@/app/store/reducers/CartSlice`), never relative paths — they are not co-located with the source.
- **Integration tests are deliberately excluded from `npm test` / `prebuild`** (separate folder + config): they sign in and create real test-mode orders / Stripe sessions, which must not run on every build. Naming: `*.integration.test.ts`.
- **Don't reintroduce `__tests__/`** next to source; add new unit tests to `tests/jest/`, new live-SDK tests to `tests/integration/`, new browser flows to `tests/e2e/`.
- The "real data, no SDK mocks" convention still holds (see personal memory): API-layer behaviour is covered by `tests/integration/`, pure helpers by `tests/jest/`.

---

## Quick pre-commit check

- [ ] The component visually matches the corresponding `.html` from [static-html/](static-html/).
- [ ] Data: OneEntry (via the MCP-compatible layer) or a mock of the right shape — not empty.
- [ ] Lint/build: the user runs them themselves (rule 6).

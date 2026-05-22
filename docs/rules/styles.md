# Styles — Tailwind v4, theme tokens, padding conventions, comment hygiene

Full rules for working with styles. Short tl;dr — in [CLAUDE.md §3.1](../../CLAUDE.md).

---

## 3.1. Styles: theme vs CSS (Tailwind v4)

- **The single source of truth for design tokens is `@theme inline { ... }` in [app/globals.css](../../app/globals.css)** (colors `--color-*`, gradients `--background-image-*`, fonts `--font-*`, line-height `--leading-*`, breakpoints `--breakpoint-*`, width/spacing formulas `--spacing-*`). This is v4 idiom — from here Tailwind automatically generates the `bg-*`, `text-*`, `leading-*`, `font-*` utilities, responsive prefixes, etc. **Do not duplicate** tokens in [tailwind.config.js](../../tailwind.config.js) — the config stays minimal: only `content` and the `.no-scrollbar` plugin (the thing that can't be expressed via `@theme`/`@utility` in CSS as of v4.2).
- Tailwind utilities from the markup (`md:pt-[62px]`, `gap-[38px]`, etc.) **must not be copied** from `static-html/public/styles.css` into `main.css` — Tailwind v4 rebuilds them from `className`.
- Component-level custom classes (`.menu_item`, `.list_item`, `.category_item`, `.heart_card`, `.cart_btn`, `.keyb`, `.filter_btn`, `.header_mobile`, etc.) live in [app/styles/main.css](../../app/styles/main.css).
- **Wire `main.css` into `globals.css` strictly via `@import`, not `@reference`.** `@reference` in Tailwind v4 only provides context for `@apply`/tokens but **does not emit CSS rules** from the file — i.e. all `.menu_item {...}` quietly disappear from the bundle. This bug occurred and was fixed at `globals.css:2`.
- Remove anything from the theme that duplicates Tailwind v4 defaults (e.g. `spacing.2.5: '10px'`, `margin.7.5: '30px'`, `margin.-11.25: '-45px'` — these are already in the default scale `calc(var(--spacing) * N)`), and also utilities that match built-ins (`.resize-none`, `.overflow-x-hidden`).

### 3.1.1. Tailwind v4: use theme tokens, not arbitrary values

When writing `className` **always first look for a ready-made class from the theme**, and only if it doesn't exist — use square brackets `[...]`. The Tailwind v4 default scale + tokens from `@theme inline { ... }` in [app/globals.css](../../app/globals.css) already cover practically everything that appears in `static-html`.

- **Spacing / sizing.** The default scale is `calc(var(--spacing) * N)` with step `0.25` (`--spacing: 0.25rem` = `4px`). Therefore:
  - `h-[18px]` → `h-4.5` (4.5 × 4 = 18)
  - `gap-[10px]` → `gap-2.5`
  - `mt-[15px]` → `mt-3.75`
  - `w-[615px]` → `w-153.75` (if the value repeats often — add a named `--spacing-*` token in `@theme`)
  - Check: `value_px / 4 = N` → use `*-N` or `*-N.MM`. If it doesn't fit exactly — leave `[...]`.
- **Colors.** Brand colors and the legacy palette are already in `@theme inline` (`--color-brand`, `--color-paper`, `--color-ink`, `--color-muted`, `--color-custom_*`). Therefore:
  - `text-[#EC722B]` / `bg-[#ec722b]` → `text-brand` / `bg-brand`
  - `stroke-[#4C4D56]` → `stroke-ink`
  - `text-[#dfe9f9]` / `text-white` (for design text) → `text-paper`
  - `text-[#969696]` — no custom token; either add a `--color-*` to `@theme`, or leave `[...]`. Don't breed duplicates (`text-[#EC722B]` next to `text-brand` in the same file).
- **Gradients.** `--background-image-custom-gradient` / `--background-image-gradient-to-r-hover` → classes `bg-custom-gradient` and `bg-gradient-to-r-hover`. **Do not write** `bg-[linear-gradient(...)]`.
- **Fonts / line-height / breakpoints.** `font-main`, `leading-mobile`, `leading-150`, `xs:`, `mobile_wide:`, `md_wide:` — all already defined. Use named classes, not arbitrary.
- **When to add a new token to `@theme`.** If the same arbitrary value appears in **3+ places** (or it's an obvious design token — color, spacing grid, signature size), add `--color-*` / `--spacing-*` / `--leading-*` in `app/globals.css` and use a named class everywhere. A one-off value — leave `[...]`.
- **Anti-pattern:** copying `className` 1:1 from `static-html` with a pile of `[18px]`/`[#EC722B]`. This hurts readability and duplicates tokens that already exist. Converting to named classes is a mandatory part of porting markup (rule 1).

## 3.1.2. Content must not stick to the edge — side padding is required everywhere

On any page the root content wrapper **must have horizontal padding** at all breakpoints. Content must not touch the viewport edge — and this applies not only to mobile. The project convention is `px-4` on the root wrapper (`<section>` / `<article>` / `<div>` with the scheme `mx-auto w-full max-w-85 xs:max-w-none md:max-w-175 lg:max-w-250 xl:max-w-323`). Without `px-4` mobile becomes edge-to-edge, and at xl viewport 1280–1291px content with `xl:max-w-323` (1292px) breaks horizontally.

Width breakpoints:

- **default (< xs / 480px)** — `max-w-85` (340px). On the smallest phones (320–360px) content is centered and doesn't sprawl across the full width.
- **xs (480px+)** — `xs:max-w-none` (no cap): from 480 to 768px content occupies the full available width minus `px-4`.
- **md (768px+) / lg (1024px+) / xl (1280px+)** — `md:max-w-175` / `lg:max-w-250` / `xl:max-w-323` (700 / 1000 / 1292px).

- **Anti-pattern:** `mx-auto box-border flex w-full md:max-w-175 lg:max-w-250 xl:max-w-323 ...` without `px-4` and without `max-w-85` (at 320–360px content sticks to the edge; at >480px — no problem, at <480px — looks "edge-to-edge").
- **Correct:** add `max-w-85 xs:max-w-none` and `px-4` to that same wrapper (see [app/[handle]/page.tsx](../../app/[handle]/page.tsx), [app/cart/page.tsx](../../app/cart/page.tsx), [app/not-found.tsx](../../app/not-found.tsx); component classes `.section_layout` / `.shop_section` / `.products_grid_layout` in [app/styles/main.css](../../app/styles/main.css) already encapsulate this scheme).
- **Exception:** "full-width" sections with backgrounds (promo banner, hero) whose background itself should go from edge to edge — they put `px-4` and `max-w-*` on the inner content container, not on the background. Also mobile horizontal scrollers (categories, card rails) — they use `w-full` without a cap so the scroll occupies the full width.

## 3.2. Code hygiene — remove commented-out junk

Commented-out `import`s, JSX fragments `{/* <X /> */}` and similar that are no longer needed — delete immediately, don't drag them along. Don't leave them "just in case" — git keeps the history.

- **Why:** the repo historically accumulated `// import NavigationMenu...` / `{/* <CategoryModal /> */}` / `// const IntroAnimations = ...`, which clutter component reading and obscure the current structure.
- **How to apply:** when editing any file — if you stumble on a commented-out import/block and from context it's clear it's no longer used (name not in JSX, not in logic, module doesn't exist or was replaced) — delete in the same commit. If unsure whether it was removed intentionally — leave it and ask the user.
- **Exception:** TODO comments with meaningful text ("// TODO: replace with X after OneEntry block Y is live") — keep, they carry information.

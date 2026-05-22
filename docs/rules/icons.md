# Icons — three storage forms

Full rule for icon storage and wiring. Short tl;dr — in [CLAUDE.md §3.3](../../CLAUDE.md).

---

## 3.3. Icons: where to put them and in what form

Three storage forms, chosen by **what the icon does in the DOM**:

1. **`public/images/icons/*.svg` (static URL asset)** — for **fully decorative** icons with **hard-coded** `fill`/`stroke` colors, with no CSS styling from the parent and no `path`-level hover effects. Loaded via `next/image`:

   ```tsx
   import Image from 'next/image';
   <Image src="/images/icons/flame.svg" alt="" width={15} height={20} />
   ```

   There's no SVGR here, the icon becomes an `<img>` (replaced element) — parent styles (`group:hover`, `currentColor`) **do not affect** the inner `path`. In return you get delivery optimization (immutable cache in [next.config.ts](../../next.config.ts) `headers()`), and the JS bundle doesn't bloat. This is the default for new decorative icons.

2. **`components/icons/*.svg` (SVGR — inline SVG in the DOM)** — when the icon needs to be **inline** in the DOM so its `path` is hit by a parent's CSS selector (`.hover-target path { fill: var(--color-brand) }` from [app/styles/main.css](../../app/styles/main.css)) or so that `class="hover-target"` works inside the SVG. SVGR is configured in [next.config.ts](../../next.config.ts) (`@svgr/webpack`, `icon: false, titleProp: true`), the TS declaration is in [app/types/svg.d.ts](../../app/types/svg.d.ts), Tailwind v4 content-glob is extended to `*.svg` in [tailwind.config.js](../../tailwind.config.js). Import **always with explicit extension**:

   ```tsx
   import CloseXBoldIcon from '@/components/icons/close-x-bold.svg';
   <CloseXBoldIcon className="hover-target" />
   ```

   Inside the `.svg` write `class="..."` (not `className`) and `stroke-width=`/`fill-rule=` with a dash — SVGR converts them into JSX names.

3. **`components/icons/*.tsx` (React component)** — when the icon has props that change the **render**: `active`, `filled`, `size`, `variant`, conditional logic, merging a fixed className with a user one. Examples: [heart-card.tsx](../../components/icons/heart-card.tsx) (filled), [house.tsx](../../components/icons/house.tsx) (size), [clock-circle.tsx](../../components/icons/clock-circle.tsx) (variant), [star-card.tsx](../../components/icons/star-card.tsx) (size+filled).

**Selection rule when adding a new icon:**

1. Colors are hard-coded, nothing reacts to a parent hover, no internal classes like `hover-target` → **`public/images/icons/*.svg`**.
2. The icon must be inline in the DOM (parent CSS styling of `path`, `class="hover-target"` inside, `currentColor`) → **`components/icons/*.svg`**.
3. The icon switches by state (filled/outlined, active, disabled) or accepts a discriminating prop → **`components/icons/*.tsx`**.

**Never:**

- Don't leave inline `<svg>` directly in feature components. Any inline SVG longer than 1 path — move it either to `public/images/icons/` or to `components/icons/` (rule 3.2 on code hygiene).
- Don't duplicate an existing icon under a different name. First check [components/icons/](../../components/icons/) and [public/images/icons/](../../public/images/icons/).
- Don't put an SVG with `class="hover-target"` (or any other CSS dependency on a parent) into `public/images/icons/` — internal styles will be lost because `<img>` doesn't propagate parent CSS into its shadow DOM. Such an SVG must live in `components/icons/` and be imported via SVGR.

**Tailwind classes inside `components/icons/*.svg`:** the content-glob already includes `*.svg`, so `class="fill-[#EC722B] hover-target"` inside an SVG file will be scanned and generated. If classes aren't applying — the first thing to check is that the file path falls under `content` in [tailwind.config.js](../../tailwind.config.js). For `public/images/icons/*.svg`, Tailwind classes inside **don't work** (the file doesn't pass through the bundler).

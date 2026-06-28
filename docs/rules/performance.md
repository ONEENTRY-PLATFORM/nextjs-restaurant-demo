# Performance — SSR caching, lazy loading, parallelism

Rules for keeping the first load within sane limits: SSR cache, lazy chunk loading, parallel fetches. They complement [data-fetching.md](data-fetching.md) — that one is "where to fetch from", this one is "how not to pay for it twice".

Apply to every new page / component built on OneEntry. If a page doesn't follow at least one of these rules — that's a regression.

---

## 1. Home / content pages — `force-static` + `revalidate`

**Rule.** Any page whose data comes only from OneEntry CMS and doesn't depend on the user session must use **ISR**, not `force-dynamic`. At minimum — `revalidate`, preferably with `force-static` as a runtime safety net.

```typescript
// app/page.tsx, app/shop/page.tsx, app/promotions/[handle]/page.tsx — pattern
export const dynamic = 'force-static';
export const revalidate = 300; // or 60 for fast-moving listings
```

**Why.**

- `force-dynamic` = SSR on every request → every user pays for the entire OneEntry chain (3–8 seconds cold). CMS-driven content doesn't change on every click — pure waste.
- `force-static` + `revalidate` = the first request does SSR + puts the HTML in `.next` cache; everyone else gets cached HTML in ~10–50 ms. After the revalidate window, regeneration happens in the background (stale-while-revalidate), the user always gets instant HTML.
- `force-static` throws a build error if anything in the tree is still dynamic (`cookies()`, `headers()`, an unwrapped `useSearchParams`) — an early warning instead of silent degradation.

**How to apply.**

- Home, category listings, restaurant page, promotions pages — `force-static`, `revalidate=300`.
- Catalog with filters (`/shop`) — `revalidate=60` (URL params are handled separately via RTK Query / Suspense, see rule 2).
- DO NOT apply to: `/profile`, `/cart`, `/auth/*` — those have per-request personalization.

> Example: [app/page.tsx](../../app/page.tsx#L11-L20).

---

## 2. Suspense around `useSearchParams()` — mandatory

**Rule.** Any client component using `useSearchParams()`, `usePathname()`, or other dynamic-API hooks **must** be wrapped in `<Suspense>` **from the caller's side**.

```tsx
// ❌ Without Suspense — the whole page falls into dynamic rendering
<FilterBottom filters={filterOptions} />

// ✅ With Suspense — useSearchParams is isolated
<Suspense fallback={null}>
  <FilterBottom filters={filterOptions} />
</Suspense>
```

**Why.** When Next.js detects an unwrapped `useSearchParams()` in the page tree, it automatically switches **the entire** page to dynamic rendering — ISR and `revalidate` silently stop working. This is the most common source of "why is the page slow again".

`force-static` (rule 1) catches this at build time, but it's cheaper to just wrap it.

**How to apply.**

- All client components with `useSearchParams` are findable via `Grep useSearchParams` in `components/`. After adding a new one — immediately wrap it in Suspense at the caller.
- Fallback is usually `null` (or a skeleton, if the component is above the fold).
- Before committing: `next build` — if a `force-static` page complains "Static generation failed due to dynamic usage", an unwrapped usage has appeared.

> Example: [components/layout/header/index.tsx](../../components/layout/header/index.tsx#L130-L132) — `FilterBottom` got wrapped after it was discovered in the layout chain tree.

---

## 3. `unstable_cache` on top of server fetchers

**Rule.** A server fetcher in [app/api/server/](../../app/api/server/) must compose `unstable_cache` (cross-request) **on top of** React `cache()` (in-render dedup). Not one or the other — both.

```typescript
import { unstable_cache } from 'next/cache';
import { cache } from 'react';

const fetchImpl = unstable_cache(
  async (url: string): Promise<Result> => {
    try {
      const data = await getApi().Pages.getPageByUrl(url);
      if (isError(data)) return { isError: true, error: data };
      return { isError: false, page: data };
    } catch (e) {
      return { isError: true, error: e as IError };
    }
  },
  ['oneentry-getPageByUrl'],          // keyParts — namespace
  { revalidate: 60, tags: ['oneentry', 'oneentry-pages'] }
);

export const getPageByUrl = cache(
  async (url: string): Promise<Result> => fetchImpl(url)
);
```

**Why.**

- React `cache()` deduplicates **within a single render** — if `getPageByUrl('home')` is called from layout AND header AND page, only one SDK request is sent.
- Next.js `unstable_cache` deduplicates **across requests** — on cache hit the response is read from Next.js Data Cache (in-memory + optionally persistent on Vercel), no SDK call, no network.
- Together: on cold start the first render pays for the SDK call, subsequent renders within the TTL window do not. Even with route-level ISR this matters: one page may render 2–3 times per minute (preview, bot, pre-emptive regeneration).

**TTL by data type:**

| Type | TTL | Tags |
|---|---|---|
| Pages, blocks, product listings | 60s | `oneentry-pages` / `oneentry-blocks` / `oneentry-products` |
| Menus, attributes (`static_content`, `preferences`) | 300s | `oneentry-menus` / `oneentry-attributes` |
| Categories, promo banners | 60s | `oneentry-pages` |

**Cache key.** A function's arguments automatically become part of the key. For functions with an **object** argument — serialize into a stable string (`buildKey()` in [getProductsByPageUrl.ts](../../app/api/server/products/getProductsByPageUrl.ts#L32-L53)) and pass it as a separate first parameter: otherwise a different object key order = a different cache.

**Tags.** Always at least two — a generic `'oneentry'` (for global invalidation on an admin update) and a topical one. This makes a later `revalidateTag('oneentry-pages')` from a webhook possible.

> Examples: [getPageByUrl.ts](../../app/api/server/pages/getPageByUrl.ts), [getMenuByMarker.ts](../../app/api/server/menus/getMenuByMarker.ts), [getProductsByPageUrl.ts](../../app/api/server/products/getProductsByPageUrl.ts).

---

## 4. Parallelize layout fetches via a Promise prop

**Rule.** `RootLayout` must NOT `await` data before rendering children. If a value is needed by a client provider — forward a **Promise** and unwrap it on the provider side via React 19 `use()`.

```tsx
// ❌ Layout waits for getDictionary before rendering Header / page → serial
export default async function RootLayout({ children }) {
  const dict = await getDictionary();
  return (
    <DictProvider value={dict}>
      <Header />     {/* starts only after dict */}
      {children}
    </DictProvider>
  );
}

// ✅ Promise is forwarded to the provider, Header/children start immediately
export default function RootLayout({ children }) {
  const dictPromise = getDictionary();
  return (
    <DictProvider value={dictPromise}>
      <Header />     {/* starts immediately, its t() shares the same promise via React cache() */}
      {children}
    </DictProvider>
  );
}
```

DictProvider:

```tsx
'use client';
import { use } from 'react';

export const DictProvider = ({ value, children }) => {
  const resolved = isPromise(value) ? use(value) : value;
  return <DictContext.Provider value={resolved}>{children}</DictContext.Provider>;
};
```

**Why.** An async server component returns JSX only after all awaits. Child server components (Header, page) don't start their fetches until the layout has returned. Serial: `total = await(layout) + max(header, page)`. Parallel: `total = max(layout, header, page)`.

Compatible with rule 3: `getDictionary()` is wrapped in React `cache()`, so Header's `t()` and layout get **the same in-flight promise**.

**How to apply.**

- Any server fetcher function called from both the layout and nested components — forward the promise through a client provider with `use()`.
- DO NOT apply if the value is needed for conditional rendering at the layout level itself (then await is unavoidable).

> Example: [app/layout.tsx](../../app/layout.tsx#L66-L86) + [DictProvider.tsx](../../app/store/providers/DictProvider.tsx).

---

## 5. Parallel fetches inside a single server component

**Rule.** Inside one server component all independent fetches go through `Promise.all`. Sequential `await` — only if the next request depends on the previous result.

```typescript
// ❌ Waterfall — each request waits for the previous one
const { pages } = await getChildPagesByParentUrl('menu');
const { page: supportPage } = await getPageByUrl('support');
const priceRange = await getProductsPriceRange();

// ✅ Parallel — total = max(N), not sum(N)
const [{ pages }, { page: supportPage }, priceRange] = await Promise.all([
  getChildPagesByParentUrl('menu'),
  getPageByUrl('support'),
  getProductsPriceRange(),
]);
```

**N+1 pattern** — a separate case. If a fetch is performed for each item in a loop (e.g. products per category), that's `Promise.all(items.map(async ...))`:

```typescript
// ❌ Sequential — N×latency
const sections = [];
for (const page of visiblePages) {
  sections.push({ page, products: await getProductsByPageUrl(...) });
}

// ✅ Parallel — max(latency)
const sections = await Promise.all(
  visiblePages.map(async page => ({
    page,
    products: await getProductsByPageUrl(...),
  }))
);
```

> Examples: [components/layout/header/index.tsx](../../components/layout/header/index.tsx#L32-L43), [components/home/HomeCategoriesSection.tsx](../../components/home/HomeCategoriesSection.tsx#L26-L40), [app/page.tsx](../../app/page.tsx#L25-L29).

---

## 6. Lazy mounting popups through a single entry point

**Rule.** Popups (`CartPopup`, `FavoritesPopup`, `ProfilePopup`, `ReservationPopup`, etc.) and `Modal` are NOT mounted directly in `app/layout.tsx`. They are mounted through a single [PopupRoot](../../components/layout/PopupRoot.tsx) that subscribes to `OpenDrawerContext` and renders **only the active** popup.

```tsx
// ❌ All 7 popups in the layout tree — their dynamic() chunks fly in on initial load
<CartPopup />
<FavoritesPopup />
<ProfilePopup />
<BookingsPopup />
<ReservationPopup />
<OrderReviewPopup />
<Modal />

// ✅ One PopupRoot → one chunk per open popup
<PopupRoot />
```

**Why.** `dynamic(() => import('./CartPopup'))` creates a code-split, but the chunk loads **when the parent renders the component** — even when it `return <></>`s while `!isOpen`. With 7 popups in the layout that's 7 chunks in the first wave, ~150–300 KB JS.

**Adding a new popup:**

1. Create the component with an `if (!open || component !== 'NewPopup') return <></>` gate inside.
2. Add a loader to [popupRegistry.ts](../../components/layout/popupRegistry.ts):
   ```typescript
   export const popupLoaders = {
     // ...
     NewPopup: () => import('@/components/path/to/NewPopup'),
   };
   ```
3. Add a branch to [PopupRoot.tsx](../../components/layout/PopupRoot.tsx):
   ```tsx
   if (component === 'NewPopup') return <NewPopup />;
   ```
4. If the popup is a form inside Modal, nothing extra needs to be added to PopupRoot (Modal is already there and will pick it up).

---

## 7. Prefetch the popup on the trigger button's hover

**Rule.** Any button/icon that opens a popup must preload its chunk on `onPointerEnter` + `onFocus`.

```tsx
import { prefetchPopup } from '@/components/layout/popupRegistry';

<button
  onClick={() => {
    setComponent('CartPopup');
    setOpen(true);
  }}
  onPointerEnter={() => prefetchPopup('CartPopup')}
  onFocus={() => prefetchPopup('CartPopup')}
>
  ...
</button>
```

**Why.** Over the ~50–200 ms between hover and click the chunk has time to arrive — the opening feels instant. `prefetchPopup` is idempotent (Set by name), failures are swallowed, on touchscreens it's harmless (there's simply no hover event).

For forms (`'SignInForm'`, `'AuthProviderSelect'`, …) `prefetchPopup` automatically pulls the `Modal` chunk.

> Examples: [NavItemFavorites.tsx](../../components/layout/header/nav/NavItemFavorites.tsx), [CenterCartButton.tsx](../../components/layout/bottom-menu/components/CenterCartButton.tsx), [BookATableButton.tsx](../../components/reservation/BookATableButton.tsx).

---

## 8. Heavy third-party libraries — into a separate lazy chunk

**Rule.** If a library (`yet-another-react-lightbox`, `react-toastify`, etc.) is only needed after a user action — move it **with all its CSS** into a separate wrapper component, import via `dynamic({ ssr: false })`, and gate mounting with state.

```tsx
// components/restaurants/RestaurantLightbox.tsx — eager imports, into its own chunk
'use client';
import 'yet-another-react-lightbox/styles.css';
import 'yet-another-react-lightbox/plugins/counter.css';
import Lightbox from 'yet-another-react-lightbox';
// ... plugins

const RestaurantLightbox = ({ open, ... }) => <Lightbox open={open} ... />;
export default RestaurantLightbox;

// components/restaurants/RestaurantPhotoGallery.tsx — dynamic + sticky mount
const RestaurantLightbox = dynamic(() => import('./RestaurantLightbox'), { ssr: false });

const [lightboxMounted, setLightboxMounted] = useState(false);
const [lightboxOpen, setLightboxOpen] = useState(false);

const openLightbox = () => {
  setLightboxMounted(true);   // mounted once
  setLightboxOpen(true);
};

return (
  <>
    {/* ... gallery markup */}
    {lightboxMounted && <RestaurantLightbox open={lightboxOpen} ... />}
  </>
);
```

**Why.**

- `dynamic(import)` code-splits, but `ssr: false` guarantees the chunk doesn't land in the SSR HTML.
- The `lightboxMounted` state doesn't reset on close → after the first open, subsequent ones are instant (chunk already cached).
- CSS is imported **statically** inside the lazy wrapper → lands in the same chunk, not in the layout CSS.
- **Turbopack does NOT support dynamic `import()` of CSS** — `await import('lib/styles.css')` is forbidden. Only static import inside a separate module.

**How to apply.**

- Lightbox / lightgallery / lightboxes → lazy, mount on the first click.
- Toast container (`react-toastify`) → lazy + `requestIdleCallback` (see rule 9).
- Charts (Recharts, Chart.js), editors (Monaco, CodeMirror), maps (mapbox, leaflet) — mandatory lazy on the page where they are visible.
- Swiper / other sliders for a **visible** gallery — eager (it's content itself above the fold).

> Examples: [RestaurantLightbox.tsx](../../components/restaurants/RestaurantLightbox.tsx) + [RestaurantPhotoGallery.tsx](../../components/restaurants/RestaurantPhotoGallery.tsx), [LazyToastContainer.tsx](../../components/shared/LazyToastContainer.tsx).

---

## 9. Deferred loading of non-critical UI: `requestIdleCallback`

**Rule.** A UI component that is NOT needed for the first paint and bloats the bundle (toaster, analytics, chat widgets) — mounted via `requestIdleCallback` with a `setTimeout(1500)` fallback.

```tsx
'use client';
import dynamic from 'next/dynamic';
import { useEffect, useState } from 'react';

const LazyToastContainer = dynamic(() => import('./LazyToastContainer'), { ssr: false });

const ResponsiveToastContainer = () => {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const win = window as Window & {
      requestIdleCallback?: (cb: () => void, opts?: { timeout: number }) => number;
    };
    if (typeof win.requestIdleCallback === 'function') {
      win.requestIdleCallback(() => setReady(true), { timeout: 2000 });
      return;
    }
    const id = window.setTimeout(() => setReady(true), 1500);
    return () => window.clearTimeout(id);
  }, []);

  if (!ready) return null;
  return <LazyToastContainer />;
};
```

**Why.** `dynamic()` by itself creates a code-split, but the chunk still starts loading right after parent render. `requestIdleCallback` defers it to the moment the browser is actually idle (LCP/FID metrics already captured).

> Example: [ResponsiveToastContainer.tsx](../../components/shared/ResponsiveToastContainer.tsx).

---

## 10. IntersectionObserver gate for off-screen images

**Rule.** Images in product cards (repeating, potentially 20+ per page) are mounted **only** after they intersect the viewport with a margin. Browser-native `loading="lazy"` is not enough — it starts fetching hundreds of pixels before the card is actually visible.

```tsx
import { useNearViewport } from '@/app/hooks/useNearViewport';

const ProductImage = ({ src, alt }) => {
  const ref = useRef<HTMLDivElement>(null);
  const isNear = useNearViewport(ref, { rootMargin: '300px' });

  return (
    <div ref={ref} className="relative aspect-square w-full overflow-hidden">
      {isNear ? (
        <Image src={src} alt={alt} ... loading="lazy" />
      ) : null}
    </div>
  );
};
```

[useNearViewport](../../app/hooks/useNearViewport.ts) — sticky observer: returns `false` until intersection, after the first hit stays `true` forever and disconnects itself. Without an observer (SSR / old browsers) → `true` (graceful degradation to eager).

**Why.** Every mounted `<Image>` immediately pings the Next.js image optimizer (`/image?url=…`), even with `loading="lazy"`. 20–30 cards = 20–30 requests in the first wave. With the gate — only 4–8 (visible + nearest).

**How to apply.**

- Repeating product/article cards → mandatory.
- Hero / above-the-fold → eager (`priority` + no gate).
- Images inside popups → unnecessary (the popup itself is already lazy via PopupRoot).

> Example: [ProductImage.tsx](../../components/layout/products-grid/components/product-card/ProductImage.tsx).

---

## 11. `<Link>` prefetch — targeted, not default

**Rule.** Next.js `<Link>` by default prefetches the RSC payload for every link in the viewport. On a catalog page with 20+ ProductCard that's 20+ extra requests. Set `prefetch={false}` by default for:

- Product cards in listings.
- Navigation icons in the header (Logo, NavItem*, Search results).

Keep `prefetch={true}` (default) only for:

- The main CTA tiles (1–2 above the fold).
- Pagination (next/prev — the user clicks them often).
- Links inside popups (once the popup is open, the user likely will follow them).

> Example: [ProductCard.tsx](../../components/layout/products-grid/components/product-card/ProductCard.tsx#L77-L81), [Logo.tsx](../../components/layout/header/Logo.tsx#L15).

---

## 12. `next/font` fonts — no cartesian product

**Rule.** If italic is used in the design for only one weight, DO NOT declare `style: ['normal', 'italic']` on top of an array of 3+ weights — that would create 6+ @font-faces. Split into **two** `next/font` instances.

```typescript
// ❌ 6 files (3 weights × 2 styles)
const lato = Lato({
  weight: ['300', '400', '700'],
  style: ['normal', 'italic'],
  preload: true,
});

// ✅ 3 + 1 = 4 files
const lato = Lato({
  weight: ['300', '400', '700'],
  style: ['normal'],
  preload: true,
  variable: '--font-lato',
});

const latoItalic = Lato({
  weight: ['700'],          // italic is only needed at bold
  style: ['italic'],
  preload: false,           // not above the fold — no preload
  variable: '--font-lato-italic',
});
```

In the component where italic is needed — via a CSS variable:

```tsx
<h1 style={{ fontFamily: 'var(--font-lato-italic)' }} className="italic font-bold">
  Excellent taste
</h1>
```

> Example: [app/layout.tsx](../../app/layout.tsx#L28-L48), [components/layout/header/index.tsx](../../components/layout/header/index.tsx#L73-L77).

---

## 13. GSAP plugins — register at the use site

**Rule.** GSAP plugins needed only for specific events are registered **lazily** in the module where they're used, not globally in `RegisterGSAP`.

```typescript
// ❌ Globally in layout — ScrollToPlugin ships for everyone
// app/animations/RegisterGSAP.tsx
import { ScrollToPlugin } from 'gsap/dist/ScrollToPlugin';
gsap.registerPlugin(ScrollToPlugin);

// ✅ Lazy on first navigation
// app/animations/TransitionProvider.tsx
let registered = false;
let registerPromise: Promise<void> | null = null;
const ensureScrollToPlugin = () => {
  if (registered) return Promise.resolve();
  if (!registerPromise) {
    registerPromise = import('gsap/dist/ScrollToPlugin').then(mod => {
      gsap.registerPlugin(mod.ScrollToPlugin);
      registered = true;
    });
  }
  return registerPromise;
};
```

**Why.** `ScrollTrigger` is needed on the home page for product-grid animations → eager. `ScrollToPlugin` is only needed for smooth-scroll on route transition → lazy, with graceful fallback to native `window.scrollTo` if the plugin hasn't loaded yet.

> Example: [TransitionProvider.tsx](../../app/animations/TransitionProvider.tsx).

---

## 14. RTK Query `pollingInterval` — sane defaults

**Rule.** `pollingInterval` in RTK Query — NO LESS than 30 seconds. Less only with a concrete justification (real-time chat, quotes).

```typescript
// ❌ 3000 = 20 requests/min/tab
useLazyGetMeQuery({ pollingInterval: isAuth ? 3000 : 0 });

// ✅ 60000 = 1 request/min — keepalive is enough
useLazyGetMeQuery({ pollingInterval: isAuth ? 60000 : 0 });
```

> Example: [AuthContext.tsx](../../app/store/providers/AuthContext.tsx#L61).

---

## Antipatterns

- **`force-dynamic` without justification.** Any page that doesn't use `cookies()`/`headers()` and doesn't have `useSearchParams` without Suspense — must not be dynamic.
- **`fetch(url, { cache: 'no-store' })` for the sake of "freshness".** On content pages = killing ISR + unstable_cache. Use `revalidateTag()` from a webhook instead of disabling cache.
- **`useEffect(() => fetch(...))` in home-page components.** If it can be server-rendered — server-render it (rule 5 + server fetcher). useEffect-fetch = double work: SSR + client-fetch + hydration mismatch.
- **`dynamic()` of a component without conditional rendering at the caller.** Code-split without gating = only bundle splitting, not lazy loading. Need `{condition && <LazyComponent />}` (see rule 6).
- **Dynamic `import('./styles.css')` in Turbopack.** Doesn't work. Only static import inside a lazy wrapper (see rule 8).
- **`<Image>` without dimensions (`width`/`height` or `fill`+`sizes`).** Every such image = CLS + extra layout shift = bad LCP.

---

## Checklist before committing a new page / feature

- [ ] `export const dynamic = 'force-static'` + `revalidate` (rule 1) if the content is CMS-driven.
- [ ] All `useSearchParams` are wrapped in `Suspense` (rule 2).
- [ ] New server fetchers use `unstable_cache + cache()` (rule 3).
- [ ] Layout does not `await` data that's only needed by a client provider (rule 4).
- [ ] Independent fetches in a server component go through `Promise.all` (rule 5).
- [ ] Popups are added via `popupLoaders` + `PopupRoot` (rule 6).
- [ ] Popup trigger buttons have `prefetchPopup` on hover/focus (rule 7).
- [ ] Heavy libs (lightbox, charts, …) are moved into a lazy wrapper (rule 8).
- [ ] Non-critical widgets deferred via `requestIdleCallback` (rule 9).
- [ ] Repeating product images use `useNearViewport` (rule 10).
- [ ] `<Link>` in listings has `prefetch={false}` (rule 11).
- [ ] Fonts have no cartesian product (rule 12).
- [ ] RTK Query polling >= 30 sec (rule 14).

# Data fetching — RTK Query vs server fetcher vs custom hook

Where to fetch OneEntry data from and in which layer. Short tl;dr — in [CLAUDE.md §5](../../CLAUDE.md).

The project has three parallel ways of talking to OneEntry. This is a **deliberate** separation by scenario; the choice depends on where and why the data is needed.

---

## Layers

### 1. Server fetchers — [app/api/server/](../../app/api/server/)

Async functions wrapping `getApi()` SDK with React `cache()` (deduplication within a single render).

**When to use:**

- Server Components (`page.tsx`, `layout.tsx` without `'use client'`).
- `generateMetadata()` for SEO.
- Route handlers (`app/.../route.ts`).
- Anywhere data is needed on the server and can be rendered into HTML without hydration.

**Pattern** (see [app/api/server/pages/getPageByUrl.ts](../../app/api/server/pages/getPageByUrl.ts)):

```typescript
import { cache } from 'react';
import { getApi, isError } from '@/app/api';

export const getPageByUrl = cache(async (url: string) => {
  try {
    const data = await getApi().Pages.getPageByUrl(url);
    if (isError(data)) return { isError: true, error: data };
    return { isError: false, page: data };
  } catch (e) {
    return { isError: true, error: e as IError };
  }
});
```

Return a discriminated union `{ isError, error?, page? }` — graceful fallback, **don't** throw (rule 5: graceful fallback on `"Resource is closed"` and empty collections is mandatory).

### 2. RTK Query — [app/api/api/RTKApi.ts](../../app/api/api/RTKApi.ts)

One centralized `createApi()` with `fakeBaseQuery()`. All query/mutation endpoints are collected in a single file and exported as `useGet*Query` / `useLazyGet*Query` via [app/api/index.ts](../../app/api/index.ts).

**When to use:**

- Client Components that need data **on the fly** (opening a popup, switching filters, search-as-you-type).
- When you need automatic request deduplication, invalidation via `tagTypes`, and shared cache across components.
- When loader/error are displayed directly in the UI (`isLoading`, `isError` come for free).

**Pattern** (see [RTKApi.ts](../../app/api/api/RTKApi.ts) — `getBlocksByPageUrl`):

```typescript
getBlocksByPageUrl: build.query<IPositionBlock[], { pageUrl: string }>({
  queryFn: async ({ pageUrl }) => {
    const result = await getApi().Pages.getBlocksByPageUrl(pageUrl);
    if (isError(result)) return { error: result };
    return { data: result as IPositionBlock[] };
  },
  providesTags: ['Blocks'],
  keepUnusedDataFor: 600,
}),
```

Usage in a component:

```tsx
const { data: blocks, isLoading } = useGetBlocksByPageUrlQuery({ pageUrl: 'home' });
```

`tagTypes` (`['Products', 'Pages', 'Blocks', 'Forms', 'Orders', 'User', 'Accounts', 'Sessions']`) — for cross-endpoint invalidation. After a mutation (e.g. `Orders.createOrder`) — `invalidatesTags: ['Orders']` will refetch the orders list.

### 3. Custom hooks — [app/api/hooks/](../../app/api/hooks/)

Thin client-side hooks **over** `getApi()` or RTK Query, encapsulating specific logic (mutation + state, search with debounce, coordination of several calls).

**When to use:**

- Mutations with side effects (create an order → clear the cart → redirect to Stripe).
- Logic that doesn't fit into an RTK Query `build.mutation`: branching on `paymentAccountIdentifier === 'cash'` vs Stripe redirect, error mapping, toasts (see [useCreateOrder.ts](../../app/api/hooks/useCreateOrder.ts)).
- Search with debounce on top of `Products.getProducts` (see [useSearchProducts.ts](../../app/api/hooks/useSearchProducts.ts)).

**Pattern** (see [useCreateOrder.ts](../../app/api/hooks/useCreateOrder.ts)):

```typescript
'use client';

export const useCreateOrder = (): UseCreateOrderApi => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const dispatch = useAppDispatch();

  const onConfirmOrder = async (args: ConfirmOrderArgs): Promise<ConfirmOrderResult> => {
    setIsLoading(true);
    try {
      const res = await getApi().Orders.createOrder(...);
      if (isError(res)) return { ok: false, error: ... };
      // ... mutate Redux state, return result
      return { ok: true, orderId: res.id };
    } finally {
      setIsLoading(false);
    }
  };

  return { onConfirmOrder, isLoading, error };
};
```

They return **action callbacks**, not data — the component decides when to invoke them.

---

## Decision tree

```text
Where is the data needed?
├── Server Component / generateMetadata / route handler
│   └── server fetcher from app/api/server/
│
└── Client Component
    ├── GET for display (with loading/error in the UI)
    │   ├── Endpoint already exists in RTKApi.ts
    │   │   └── useGet*Query / useLazyGet*Query
    │   └── No endpoint — add to RTKApi.ts (build.query)
    │
    ├── Mutation + redux side-effects / branching / toasts
    │   └── Custom hook in app/api/hooks/ over getApi()
    │
    └── One-off call without redux/UI state
        └── Direct getApi() in a callback (no hook)
```

---

## Anti-patterns

- **Server fetcher in a Client Component.** Server fetchers (`getPageByUrl`, `getProducts`, ...) can be imported into a client, but on first render the browser will make the API call from the client, losing the SSR benefit. If client-side loading is needed — use RTK Query.

- **`getApi()` directly in a Client Component without a wrapper.** Acceptable only for a one-off callback-style call without redux dependency (e.g. `onClick={async () => { await getApi().Events.subscribe(id); }}`). If a loading/error state or reuse appears — that's a signal to create a custom hook or an RTK endpoint.

- **Duplicating the same request across several layers.** For example, `getProductById` exists both in `server/` and in `RTKApi` (`useGetProductByIdQuery`) — that's fine, because one is used on the SSR product page, the other for highlighting a product in a popup. But don't create a **third** wrapper ("custom hook around useGetProductByIdQuery") if there's no specific logic.

- **Hard-coding markers / pageUrls.** Any `getApi().Pages.getPageByUrl('home')` or `Orders.getAllOrdersByMarker('delivery_order')` — that's a **marker**, not a Next.js route. Don't substitute `params.handle` here without verification (see [CLAUDE.md MCP glossary](../../CLAUDE.md), §5).

- **Throwing from a server fetcher.** The server must return `{ isError: true, error }`, not `throw`. Otherwise the graceful fallback on `"Resource is closed"` breaks.

---

## Current inventory

- **Server fetchers** — `getPageByUrl`, `getProducts`, `getProductById`, `getProductStatuses` / `getOutOfStockMarker`, `getBlocks`, `getBlockProducts`, `getBlocksByPageUrl`, `getMenuByMarker`, `getFormByMarker`, `getAllOrdersByMarker`, `updateOrderByMarkerAndId`, `getBlogBanners`, `getChildPagesByParentUrl`, `getPagesByIds`, `getProductsByPageUrl`, `getProductsPriceRange`, `getRelatedProductsById`, `getProductReviews`, `getAdminsInfo`, `getSingleAttributeByMarkerSet`, `logInUser`, `logOutUser`, `oauthLogIn`, `updateUserState` — see [app/api/index.ts](../../app/api/index.ts).
- **RTK Query endpoints** — `useGetAccountsQuery`, `useGetAuthProvidersQuery`, `useGetBlockByMarkerQuery`, `useGetBlocksByPageUrlQuery`, `useGetChildPagesByParentUrlQuery`, `useGetFormByMarkerQuery`, `useGetMenuByMarkerQuery`, `useGetOrderStorageByMarkerQuery`, `useGetPageByIdQuery`, `useGetPaymentSessionByIdQuery`, `useGetProductByIdQuery`, `useGetProductsByIdsQuery`, `useGetProductsByPageUrlQuery`, `useGetProductsQuery`, `useGetSingleOrderQuery`, `useLazyGetMeQuery`, `useLazyGetPaymentSessionByIdQuery`.
- **Custom hooks** — `useApplyCoupon`, `useCreateOrder`, `useSearchProducts`, `useSetForm`, `useAttributesData`, `useEvents`.

# Data fetching — RTK Query vs server fetcher vs custom hook

Где брать данные из OneEntry и в каком слое. Краткое tl;dr — в [CLAUDE.md §5](../../CLAUDE.md).

В проекте три параллельных способа обращения к OneEntry. Это **сознательное** разделение по сценарию; выбор зависит от того, где и зачем нужны данные.

---

## Слои

### 1. Server fetchers — [app/api/server/](../../app/api/server/)

Async-функции, обёртки над `getApi()` SDK с `cache()` от React (deduplication внутри одного рендера).

**Когда использовать:**

- Server Components (`page.tsx`, `layout.tsx` без `'use client'`).
- `generateMetadata()` для SEO.
- Route handlers (`app/.../route.ts`).
- Везде, где данные нужны на сервере и могут быть отрисованы в HTML без гидратации.

**Паттерн** (см. [app/api/server/pages/getPageByUrl.ts](../../app/api/server/pages/getPageByUrl.ts)):

```typescript
import { cache } from 'react';
import { getApi } from '@/app/api';
import { typeError } from '@/components/utils';

export const getPageByUrl = cache(async (url: string) => {
  try {
    const data = await getApi().Pages.getPageByUrl(url);
    if (typeError(data)) return { isError: true, error: data };
    return { isError: false, page: data };
  } catch (e) {
    return { isError: true, error: e as IError };
  }
});
```

Возвращаем discriminated union `{ isError, error?, page? }` — graceful fallback, **не** бросаем (правило 5: graceful fallback на `"Resource is closed"` и пустые коллекции обязателен).

### 2. RTK Query — [app/api/api/RTKApi.ts](../../app/api/api/RTKApi.ts)

Один централизованный `createApi()` с `fakeBaseQuery()`. Все query/mutation endpoints собраны в одном файле, экспортируются как `useGet*Query` / `useLazyGet*Query` через [app/api/index.ts](../../app/api/index.ts).

**Когда использовать:**

- Client Components, которым нужны данные **на лету** (открытие попапа, переключение фильтров, search-as-you-type).
- Когда нужна автоматическая дедупликация запросов, инвалидация по `tagTypes`, и shared cache между компонентами.
- Когда отображается лоадер/ошибка прямо в UI (`isLoading`, `isError` приходят бесплатно).

**Паттерн** (см. [RTKApi.ts](../../app/api/api/RTKApi.ts) — `getBlocksByPageUrl`):

```typescript
getBlocksByPageUrl: build.query<IPositionBlock[], { pageUrl: string }>({
  queryFn: async ({ pageUrl }) => {
    const result = await getApi().Pages.getBlocksByPageUrl(pageUrl);
    if (typeError(result)) return { error: result };
    return { data: result as IPositionBlock[] };
  },
  providesTags: ['Blocks'],
  keepUnusedDataFor: 600,
}),
```

Использование в компоненте:

```tsx
const { data: blocks, isLoading } = useGetBlocksByPageUrlQuery({ pageUrl: 'home' });
```

`tagTypes` (`['Products', 'Pages', 'Blocks', 'Forms', 'Orders', 'User', 'Accounts', 'Sessions']`) — для cross-endpoint инвалидации. После мутации (например, `Orders.createOrder`) — `invalidatesTags: ['Orders']` пересоберёт список заказов.

### 3. Custom hooks — [app/api/hooks/](../../app/api/hooks/)

Тонкие client-side хуки **поверх** `getApi()` или RTK Query, инкапсулирующие специфическую логику (мутация + state, поиск с debounce, координация нескольких вызовов).

**Когда использовать:**

- Мутации с побочными эффектами (создать заказ → очистить корзину → редирект на Stripe).
- Логика, которая не ложится в `build.mutation` RTK Query: ветвление на `paymentAccountIdentifier === 'cash'` vs Stripe-redirect, error mapping, toast'ы (см. [useCreateOrder.ts](../../app/api/hooks/useCreateOrder.ts)).
- Search с debounce, поверх `Products.getProducts` (см. [useSearchProducts.ts](../../app/api/hooks/useSearchProducts.ts)).

**Паттерн** (см. [useCreateOrder.ts](../../app/api/hooks/useCreateOrder.ts)):

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

Возвращают **action callbacks**, а не данные — компонент сам решает, когда вызвать.

---

## Decision tree

```text
Где нужны данные?
├── Server Component / generateMetadata / route handler
│   └── server fetcher из app/api/server/
│
└── Client Component
    ├── GET для отображения (с loading/error в UI)
    │   ├── Эндпоинт уже есть в RTKApi.ts
    │   │   └── useGet*Query / useLazyGet*Query
    │   └── Нет эндпоинта — добавить в RTKApi.ts (build.query)
    │
    ├── Мутация + redux side-effects / branching / toasts
    │   └── Custom hook в app/api/hooks/ поверх getApi()
    │
    └── One-off вызов без redux/UI state
        └── Прямой getApi() в коллбэке (без хука)
```

---

## Anti-patterns

- **Server fetcher в Client Component.** Server fetchers (`getPageByUrl`, `getProducts`, ...) могут импортироваться в client, но при первом рендере браузер сделает API-вызов из клиента, теряя SSR-преимущества. Если нужна client-side подгрузка — используй RTK Query.

- **`getApi()` напрямую в Client Component без обёртки.** Допустимо только для одноразового coll-back-style вызова без redux-зависимости (например, `onClick={async () => { await getApi().Events.subscribe(id); }}`). Если появляется loading/error state или повторное использование — это сигнал завести custom hook или эндпоинт в RTK.

- **Дублирование одного и того же запроса в нескольких слоях.** Например, `getProductById` существует и в `server/` и в `RTKApi` (`useGetProductByIdQuery`) — это норма, потому что один используется на SSR-странице товара, другой — для подсветки товара в попапе. Но не заводи **третью** обёртку («custom hook вокруг useGetProductByIdQuery»), если нет специфической логики.

- **Хардкод markers / pageUrls.** Любой `getApi().Pages.getPageByUrl('home')` или `Orders.getAllOrdersByMarker('delivery_order')` — это **marker**, не Next.js route. Не подставляй сюда `params.handle` без проверки (см. [CLAUDE.md глоссарий MCP](../../CLAUDE.md), §5).

- **Бросать ошибку из server fetcher.** Сервер должен возвращать `{ isError: true, error }`, не `throw`. Иначе ломается graceful fallback на `"Resource is closed"`.

---

## Текущий inventory

- **Server fetchers** — `getPageByUrl`, `getProducts`, `getProductById`, `getBlocks`, `getBlockProducts`, `getBlocksByPageUrl`, `getMenuByMarker`, `getFormByMarker`, `getAllOrdersByMarker`, `updateOrderByMarkerAndId`, `getBlogBanners`, `getChildPagesByParentUrl`, `getPagesByIds`, `getProductsByPageUrl`, `getProductsPriceRange`, `getRelatedProductsById`, `getProductReviews`, `getAdminsInfo`, `getSingleAttributeByMarkerSet`, `logInUser`, `logOutUser`, `oauthLogIn`, `updateUserState` — см. [app/api/index.ts](../../app/api/index.ts).
- **RTK Query endpoints** — `useGetAccountsQuery`, `useGetAuthProvidersQuery`, `useGetBlockByMarkerQuery`, `useGetBlocksByPageUrlQuery`, `useGetChildPagesByParentUrlQuery`, `useGetFormByMarkerQuery`, `useGetMenuByMarkerQuery`, `useGetOrderStorageByMarkerQuery`, `useGetPageByIdQuery`, `useGetPaymentSessionByIdQuery`, `useGetProductByIdQuery`, `useGetProductsByIdsQuery`, `useGetProductsByPageUrlQuery`, `useGetProductsQuery`, `useGetSingleOrderQuery`, `useLazyGetMeQuery`, `useLazyGetPaymentSessionByIdQuery`.
- **Custom hooks** — `useApplyCoupon`, `useCreateOrder`, `useSearchProducts`, `useSetForm`, `useAttributesData`, `useEvents`.

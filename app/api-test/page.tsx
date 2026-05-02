import type { JSX } from 'react';

import ApiTestClient from './ApiTestClient';

// Отключаем статический prerender — общая цепочка layout-ов включает
// `useSearchParams()` (поисковая строка / bottom sheet фильтра), который Next.js
// требует оборачивать в Suspense для статической генерации. Динамический рендер
// обходит prerender-time bailout (тот же подход, что и на home-странице).
// ВАЖНО: route segment configs (`export const dynamic`) работают только в
// server-компонентах, поэтому страница оставлена серверной, а вся клиентская
// логика вынесена в `ApiTestClient`.
export const dynamic = 'force-dynamic';

export default function ApiTestPage(): JSX.Element {
  return <ApiTestClient />;
}

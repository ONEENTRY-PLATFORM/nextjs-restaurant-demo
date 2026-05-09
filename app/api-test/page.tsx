import type { JSX } from 'react';

import ApiTestClient from './ApiTestClient';

// Force-dynamic: цепочка layout-ов содержит `useSearchParams()` (см. home-страницу).
// Route segment configs работают только в server-компонентах, поэтому клиентская логика — в `ApiTestClient`.
export const dynamic = 'force-dynamic';

export default function ApiTestPage(): JSX.Element {
  return <ApiTestClient />;
}

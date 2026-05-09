import type { JSX } from 'react';

import ApiTestClient from './ApiTestClient';

// Force-dynamic: the layout chain uses `useSearchParams()` (see the home page).
// Route segment configs only work in server components, so the client logic lives in `ApiTestClient`.
export const dynamic = 'force-dynamic';

export default function ApiTestPage(): JSX.Element {
  return <ApiTestClient />;
}

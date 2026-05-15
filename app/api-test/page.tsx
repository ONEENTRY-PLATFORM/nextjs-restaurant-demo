import { notFound } from 'next/navigation';
import type { JSX } from 'react';

import ApiTestClient from './ApiTestClient';

// Force-dynamic: the layout chain uses `useSearchParams()` (see the home page).
// Route segment configs only work in server components, so the client logic lives in `ApiTestClient`.
export const dynamic = 'force-dynamic';

/**
 * ApiTestPage — dev-only performance dashboard for the OneEntry API.
 *
 * @returns JSX of the test dashboard, or triggers `notFound()` on prod.
 */
export default function ApiTestPage(): JSX.Element {
  if (process.env.NODE_ENV === 'production') notFound();
  return <ApiTestClient />;
}

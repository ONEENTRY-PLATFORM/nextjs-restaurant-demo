import { notFound } from 'next/navigation';
import type { JSX } from 'react';

import ApiTestClient from './ApiTestClient';

// Force-dynamic: the layout chain uses `useSearchParams()` (see the home page),
// and the dashboard is dev-only — there's nothing to pre-render anyway.
export const dynamic = 'force-dynamic';

/**
 * ApiTestPage — dev-only performance dashboard for the OneEntry API.
 *
 * Gates the route on `NODE_ENV`: in production the page triggers `notFound()`
 * so the dashboard never ships to end users; in dev/preview the client benchmark
 * is rendered.
 *
 * @returns JSX of the dashboard, or never returns (triggers `notFound()`) in prod.
 */
export default function ApiTestPage(): JSX.Element {
  if (process.env.NODE_ENV === 'production') {
    notFound();
  }
  return <ApiTestClient />;
}

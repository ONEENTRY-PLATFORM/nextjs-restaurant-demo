import type { JSX } from 'react';
import { Suspense } from 'react';

import GoogleAuthCallbackInner from './GoogleAuthCallbackInner';

// OAuth-callback dynamic: prerender is pointless (we only parse `?code`) and
// bails out because of `useSearchParams()` in the client part under Turbopack.
export const dynamic = 'force-dynamic';

const GoogleAuthCallback = (): JSX.Element => (
  <Suspense
    fallback={
      <div className="flex min-h-screen items-center justify-center bg-black text-paper">
        Signing you in…
      </div>
    }
  >
    <GoogleAuthCallbackInner />
  </Suspense>
);

export default GoogleAuthCallback;

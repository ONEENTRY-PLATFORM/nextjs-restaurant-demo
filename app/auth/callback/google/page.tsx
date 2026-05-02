import type { JSX } from 'react';
import { Suspense } from 'react';

import GoogleAuthCallbackInner from './GoogleAuthCallbackInner';

// OAuth-callback существует только для разбора `?code` от Google и редиректа.
// Статический prerender бессмысленен и при сборке Turbopack бейлится из-за
// `useSearchParams()` в клиентской части (Suspense сам по себе фазу build не
// спасает). Делаем страницу dynamic, чтобы не бейлилось на prerender.
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

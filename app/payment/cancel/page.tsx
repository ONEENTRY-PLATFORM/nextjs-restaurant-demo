import type { Metadata } from 'next';
import type { JSX } from 'react';
import { Suspense } from 'react';

import PaymentResult from '@/components/payment/PaymentResult';

// Force-dynamic: reads `searchParams` (order id) on the client and the shared
// layout chain uses `useSearchParams()` — prerender would need Suspense wrapping.
export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Payment cancelled',
  robots: { index: false, follow: false },
};

/**
 * PaymentCancelPage — `/payment/cancel` landing for the Stripe cancel redirect.
 *
 * Configure this URL (e.g. `https://<host>/payment/cancel?orderId=…`) as the cancel
 * URL of the Stripe payment account in the OneEntry admin panel.
 *
 * @returns JSX of the cancel landing page.
 */
const PaymentCancelPage = (): JSX.Element => {
  return (
    <section className="flex min-h-[70vh] items-center justify-center bg-black px-4 py-10">
      <Suspense fallback={<div className="min-h-75 w-full max-w-97.5" />}>
        <PaymentResult variant="cancel" />
      </Suspense>
    </section>
  );
};

export default PaymentCancelPage;

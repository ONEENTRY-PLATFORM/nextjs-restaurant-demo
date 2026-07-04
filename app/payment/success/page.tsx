import type { Metadata } from 'next';
import type { JSX } from 'react';
import { Suspense } from 'react';

import PaymentCartRecovery from '@/components/payment/PaymentCartRecovery';
import PaymentResult from '@/components/payment/PaymentResult';

// Force-dynamic: reads `searchParams` (order id) on the client and the shared
// layout chain uses `useSearchParams()` — prerender would need Suspense wrapping.
export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Order Confirmed',
  robots: { index: false, follow: false },
};

/**
 * PaymentSuccessPage — `/payment/success` landing for the Stripe success redirect.
 *
 * Configure this URL (e.g. `https://<host>/payment/success?orderId=…`) as the success
 * URL of the Stripe payment account in the OneEntry admin panel.
 *
 * @returns JSX of the success landing page.
 */
const PaymentSuccessPage = (): JSX.Element => {
  return (
    <section className="flex min-h-[70vh] items-center justify-center bg-black px-4 py-10">
      <PaymentCartRecovery variant="success" />
      <Suspense fallback={<div className="min-h-75 w-full max-w-97.5" />}>
        <PaymentResult variant="success" />
      </Suspense>
    </section>
  );
};

export default PaymentSuccessPage;

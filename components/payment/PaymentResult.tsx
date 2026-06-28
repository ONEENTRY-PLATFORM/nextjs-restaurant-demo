'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import type { JSX } from 'react';

import { useT } from '@/app/store/providers/DictProvider';

type PaymentResultProps = {
  /** Which landing to render — Stripe redirects here via the success/cancel URLs in the OneEntry payments config. */
  variant: 'success' | 'cancel';
};

/**
 * PaymentResult — landing screen after the external Stripe checkout returns to the app.
 *
 * Stripe triggers a full page reload, so the in-popup `StepResult` / `ReservationSuccess`
 * state is gone and the Redux `lastOrderId` (not in the persist whitelist) is lost — the
 * order id is therefore read from the URL query (`orderId` / `order_id` / `id`). The screen
 * is purely presentational: the cart/checkout state is already cleared at order-creation
 * time ([useCreateOrder]), and this URL is shared by the delivery and reservation flows, so
 * mutating the cart here could wipe an unrelated delivery cart after a reservation payment.
 * The success variant renders the confirmation card from Figma 120:2338 (mirrors the cash
 * `StepResult` screen); the cancel variant shows a retry message instead.
 *
 * @param   {PaymentResultProps} props         - Component props.
 * @param   {'success'|'cancel'} props.variant - Landing to render.
 * @returns JSX of the payment result card.
 */
const PaymentResult = ({ variant }: PaymentResultProps): JSX.Element => {
  const t = useT();
  const searchParams = useSearchParams();
  const orderId =
    searchParams.get('orderId') ?? searchParams.get('order_id') ?? searchParams.get('id') ?? '';

  if (variant === 'success') {
    return (
      <div className="mx-auto flex w-full max-w-97.5 flex-col gap-6.25 rounded-[20px] bg-ink/80 p-5 backdrop-blur-card">
        {orderId ? <p className="mx-auto text-xl font-medium text-brand">№ {orderId}</p> : null}

        <div className="mx-auto h-px w-56.25 bg-brand" />

        <p className="text-center text-[27px] font-semibold text-brand">
          {t('payment_success_title', 'Order Confirmed')}
        </p>
        <p className="text-center text-[18px] font-light text-paper">
          {t('payment_success_message', 'Your order has been placed successfully')}
        </p>
        <p className="text-center text-[23px] font-normal text-brand">
          {t('payment_success_outro', 'See you soon!')}
        </p>

        <Link href="/profile/orders" className="cart_btn">
          {t('payment_success_cta', 'View my orders')}
        </Link>
        <Link
          href="/"
          className="text-center text-base font-normal text-paper/80 transition-colors hover:text-brand"
        >
          {t('payment_back_home', 'Back to home')}
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-97.5 flex-col gap-6.25 rounded-[20px] bg-ink/80 p-5 backdrop-blur-card">
      <p className="text-center text-[27px] font-semibold text-brand">
        {t('payment_cancel_title', 'Payment cancelled')}
      </p>
      <p className="text-center text-[18px] font-light text-paper">
        {t(
          'payment_cancel_message',
          'Your payment was not completed. You can try again from your cart.'
        )}
      </p>

      <Link href="/cart" className="cart_btn">
        {t('payment_cancel_cta', 'Back to cart')}
      </Link>
      <Link
        href="/"
        className="text-center text-base font-normal text-paper/80 transition-colors hover:text-brand"
      >
        {t('payment_back_home', 'Back to home')}
      </Link>
    </div>
  );
};

export default PaymentResult;

'use client';

import type { JSX } from 'react';

import { useT } from '@/app/store/providers/DictProvider';
import type { OrderTotalsDisplay } from '@/components/cart/steps/stepOrderUtils';
import { UsePrice } from '@/components/utils';

type OrderTotalsProps = {
  display: OrderTotalsDisplay;
  displayCurrency?: string | undefined;
};

/**
 * OrderTotals — order summary box (subtotal / delivery / discount / bonuses / total).
 *
 * Discount and bonus rows are hidden when their amount is zero.
 *
 * @param   {OrderTotalsProps}    props                   - Component props.
 * @param   {OrderTotalsDisplay}  props.display           - Resolved totals (server preview or client fallback).
 * @param   {string}              [props.displayCurrency] - Currency from the server preview (project default otherwise).
 * @returns JSX of the totals box.
 */
const OrderTotals = ({ display, displayCurrency }: OrderTotalsProps): JSX.Element => {
  const t = useT();
  return (
    <div className="step-order-row mt-10 rounded-card border border-brand p-2.5">
      <div className="flex gap-1.25 text-white">
        <p>{t('subtotal_text', 'Subtotal')}:</p>
        <p>{UsePrice({ amount: display.subtotal, currency: displayCurrency })}</p>
      </div>
      <div className="flex gap-1.25 text-brand">
        <p>{t('delivery_text', 'Delivery')}:</p>
        <p>{UsePrice({ amount: display.delivery, currency: displayCurrency })}</p>
      </div>
      {display.discount > 0 ? (
        <div className="flex gap-1.25 text-brand">
          <p>{t('discount_text', 'Discount')}:</p>
          <p>{UsePrice({ amount: display.discount, currency: displayCurrency })}</p>
        </div>
      ) : null}
      {display.bonusApplied > 0 ? (
        <div className="flex gap-1.25 text-brand">
          <p>{t('bonus_applied_text', 'Bonuses')}:</p>
          <p>−{UsePrice({ amount: display.bonusApplied, currency: displayCurrency })}</p>
        </div>
      ) : null}
      <div className="flex gap-1.25 text-white">
        <p>{t('total_amount_text', 'Total Amount')}:</p>
        <p>{UsePrice({ amount: display.total, currency: displayCurrency })}</p>
      </div>
    </div>
  );
};

export default OrderTotals;

'use client';

import { useEffect } from 'react';

import { useAppDispatch } from '@/app/store/hooks';
import { restoreCartProducts } from '@/app/store/reducers/CartSlice';
import {
  clearCheckoutCartSnapshot,
  takeCheckoutCartSnapshot,
} from '@/app/utils/checkoutCartSnapshot';

type PaymentCartRecoveryProps = {
  /** Landing this effect runs on: `cancel` restores the snapshot, `success` discards it. */
  variant: 'success' | 'cancel';
};

/**
 * PaymentCartRecovery — invisible effect that reconciles the pre-redirect cart snapshot after Stripe returns.
 *
 * On the cancel landing it consumes the snapshot saved by [useCreateOrder] and
 * puts the entries back into the Redux cart (no-op when no snapshot exists —
 * e.g. after a reservation payment, which never wipes the products cart). On
 * the success landing it only discards the snapshot so a later unrelated
 * cancel cannot resurrect an already-paid cart.
 *
 * @param   {PaymentCartRecoveryProps} props         - Component props.
 * @param   {'success'|'cancel'}       props.variant - Landing the component is mounted on.
 * @returns Nothing rendered — side-effect only.
 */
const PaymentCartRecovery = ({ variant }: PaymentCartRecoveryProps): null => {
  const dispatch = useAppDispatch();

  useEffect(() => {
    if (variant === 'success') {
      clearCheckoutCartSnapshot();
      return;
    }
    const items = takeCheckoutCartSnapshot();
    if (items) {
      dispatch(restoreCartProducts(items));
    }
  }, [variant, dispatch]);

  return null;
};

export default PaymentCartRecovery;

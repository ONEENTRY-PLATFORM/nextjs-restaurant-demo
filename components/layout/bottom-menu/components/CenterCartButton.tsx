'use client';

/* eslint-disable @next/next/no-img-element */
import { type JSX, useContext, useSyncExternalStore } from 'react';

import { useAppDispatch, useAppSelector } from '@/app/store/hooks';
import { useT } from '@/app/store/providers/DictProvider';
import { OpenDrawerContext } from '@/app/store/providers/OpenDrawerContext';
import { resetCheckout } from '@/app/store/reducers/OrderSlice';
import { prefetchPopup } from '@/components/layout/popupRegistry';

/**
 * CenterCartButton — central protruding cart button; opens the `CartPopup` drawer, crossfades with `CenterCloseButton`.
 *
 * @returns JSX of the centered cart button with rehydrated count badge.
 */
const CenterCartButton = (): JSX.Element => {
  const t = useT();
  const { open, transition, setOpen, setComponent } = useContext(OpenDrawerContext);
  const dispatch = useAppDispatch();
  const count = useAppSelector(state => state.cartReducer.productsData?.length ?? 0);
  // Persisted Redux slice rehydrates on the client — gate the badge via a mount-gate.
  const mounted = useSyncExternalStore(
    cb => {
      cb();
      return () => {};
    },
    () => true,
    () => false
  );

  const hidden = open && transition !== 'close';

  return (
    <button
      type="button"
      onClick={() => {
        dispatch(resetCheckout());
        setComponent('CartPopup');
        setOpen(true);
      }}
      onPointerEnter={() => prefetchPopup('CartPopup')}
      onFocus={() => prefetchPopup('CartPopup')}
      aria-label={t('open_cart_label', 'Open cart')}
      aria-hidden={hidden}
      tabIndex={hidden ? -1 : 0}
      className={
        'absolute inset-0 flex items-center justify-center rounded-full bg-brand hover:bg-brand-hover transition-all duration-300 ease-out ' +
        (hidden
          ? 'pointer-events-none scale-50 rotate-90 opacity-0'
          : 'scale-100 rotate-0 opacity-100')
      }
    >
      <img className="w-6.25 h-5.75" src="/images/icons/cart_black.svg" alt="cart" />
      {mounted && count > 0 && (
        <div className="absolute -top-1 -right-1 min-w-4 h-4 px-1 flex items-center justify-center rounded-full bg-white border border-brand">
          <p className="font-bold text-[10px] leading-none text-black">{count}</p>
        </div>
      )}
    </button>
  );
};

export default CenterCartButton;

'use client';

/* eslint-disable @next/next/no-img-element */
import { type JSX, useContext, useSyncExternalStore } from 'react';

import { useAppSelector } from '@/app/store/hooks';
import { OpenDrawerContext } from '@/app/store/providers/OpenDrawerContext';

/** Central protruding cart button — opens the `CartPopup` drawer; crossfades with `CenterCloseButton`. */
const CenterCartButton = (): JSX.Element => {
  const { open, setOpen, setComponent } = useContext(OpenDrawerContext);
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

  const hidden = open;

  return (
    <button
      type="button"
      onClick={() => {
        setComponent('CartPopup');
        setOpen(true);
      }}
      aria-label="Open cart"
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

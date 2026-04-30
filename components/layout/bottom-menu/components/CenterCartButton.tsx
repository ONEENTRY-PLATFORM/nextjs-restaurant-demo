'use client';

/* eslint-disable @next/next/no-img-element */
import { type JSX, useContext, useSyncExternalStore } from 'react';

import { useAppSelector } from '@/app/store/hooks';
import { OpenDrawerContext } from '@/app/store/providers/OpenDrawerContext';

/**
 * Центральная выступающая кнопка корзины — 1:1 порт оранжевого шарика из
 * `static-html/.../MenuBottom`. Открывает drawer корзины через `OpenDrawerContext`
 * (`component === 'CartPopup'`) — тот же паттерн drawer, что и у фильтра.
 * Скрывается, пока открыт любой drawer, чтобы не перекрывать открытую панель.
 * Бейдж замаунтен через mount-gate, чтобы избежать рассинхрона hydration при
 * клиентской регидратации persisted-корзины.
 */
const CenterCartButton = (): JSX.Element | null => {
  const { open, setOpen, setComponent } = useContext(OpenDrawerContext);
  const count = useAppSelector(
    (state) => state.cartReducer.productsData?.length ?? 0,
  );
  // Persisted Redux-слайс регидратится на клиенте — гейтим бейдж через
  // useSyncExternalStore, чтобы серверная и клиентская разметка совпадали.
  const mounted = useSyncExternalStore(
    (cb) => {
      cb();
      return () => {};
    },
    () => true,
    () => false,
  );

  if (open) {
    return null;
  }

  return (
    <button
      type="button"
      onClick={() => {
        setComponent('CartPopup');
        setOpen(true);
      }}
      aria-label="Open cart"
      className="bg-[#ec722b] hover:bg-[#EB4B0E] w-11.5 h-11.5 flex justify-center items-center rounded-full -mt-2.5 relative"
    >
      <img
        className="w-6.25 h-5.75"
        src="/images/icons/cart_black.svg"
        alt="cart"
      />
      {mounted && count > 0 && (
        <div className="absolute -top-1 -right-1 min-w-4 h-4 px-1 flex items-center justify-center rounded-full bg-white border border-[#ec722b]">
          <p className="font-bold text-[10px] leading-none text-black">
            {count}
          </p>
        </div>
      )}
    </button>
  );
};

export default CenterCartButton;

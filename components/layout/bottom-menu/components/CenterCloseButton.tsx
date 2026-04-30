'use client';

import type { JSX } from 'react';
import { useContext } from 'react';

import { OpenDrawerContext } from '@/app/store/providers/OpenDrawerContext';
import CloseXMiniIcon from '@/components/icons/close-x-mini';

/**
 * Центральная outlined-кнопка закрытия — видна только пока открыт drawer
 * (попап корзины, фильтр, модалка входа и т.п.). Заменяет выступающую кнопку
 * корзины на время drawer'а. Делает dispatch `setTransition('close')`, чтобы
 * GSAP-анимация reverse drawer'а проигралась до размонтирования.
 */
const CenterCloseButton = (): JSX.Element | null => {
  const { open, setTransition } = useContext(OpenDrawerContext);

  if (!open) {
    return null;
  }

  return (
    <button
      type="button"
      aria-label="close"
      onClick={() => setTransition('close')}
      className="bg-transparent border w-11.5 h-11.5 flex justify-center items-center rounded-full -mt-2.5 hover:border-[#EC722B] group"
    >
      <CloseXMiniIcon />
    </button>
  );
};

export default CenterCloseButton;

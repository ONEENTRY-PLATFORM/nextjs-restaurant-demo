'use client';

import type { JSX } from 'react';
import { useContext } from 'react';

import { OpenDrawerContext } from '@/app/store/providers/OpenDrawerContext';
import CloseXMiniIcon from '@/components/icons/close-x-mini';

/** Центральная outlined-кнопка закрытия — видна, когда открыт drawer; делает `setTransition('close')` для reverse-анимации. */
const CenterCloseButton = (): JSX.Element => {
  const { open, setTransition } = useContext(OpenDrawerContext);
  const hidden = !open;

  return (
    <button
      type="button"
      aria-label="close"
      onClick={() => setTransition('close')}
      aria-hidden={hidden}
      tabIndex={hidden ? -1 : 0}
      className={
        'group absolute inset-0 flex items-center backdrop-blur-md justify-center rounded-full border bg-transparent hover:border-brand transition-all duration-300 ease-out ' +
        (hidden
          ? 'pointer-events-none scale-50 -rotate-90 opacity-0'
          : 'scale-100 rotate-0 opacity-100')
      }
    >
      <CloseXMiniIcon />
    </button>
  );
};

export default CenterCloseButton;

import { useContext } from 'react';

import { OpenDrawerContext } from '@/app/store/providers/OpenDrawerContext';

/** Кнопка закрытия модалки мобильного меню. */
const CloseModal = () => {
  const { setTransition } = useContext(OpenDrawerContext);
  return (
    <button
      aria-label="Close menu"
      onClick={() => {
        setTransition('close');
      }}
      className="absolute right-4 top-6 flex aspect-square size-12 shrink-0 items-center justify-center rounded-full border border-paper/40 text-xl text-paper hover:border-brand hover:text-brand"
    >
      &#10005;
    </button>
  );
};

export default CloseModal;

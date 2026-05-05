'use client';

import type { JSX } from 'react';
import { useContext, useRef } from 'react';

import { OpenDrawerContext } from '@/app/store/providers/OpenDrawerContext';
import ModalBackdrop from '@/components/layout/modal/components/ModalBackdrop';
import ClosePopupButton from '@/components/shared/ClosePopupButton';
import { useSwipeToClose } from '@/components/shared/useSwipeToClose';

import ProfilePopupAnimations from './animations/ProfilePopupAnimations';
import ProfileSections from './ProfileSections';

/**
 * Drawer-попап профиля — порт оверлея профиля из
 * `static-html/details_personal.html`, открывается по иконке пользователя
 * в глобальном хедере. Содержимое (My Profile + Address) общее со
 * страницей `/profile` и вынесено в {@link ProfileSections}; здесь только
 * drawer-фрейм, анимации и кнопки закрытия.
 * @returns {JSX.Element} JSX drawer-а профиля.
 */
const ProfilePopup = (): JSX.Element => {
  const { open, component, setOpen, setTransition } = useContext(OpenDrawerContext);
  const isOpen = open && component === 'ProfilePopup';
  const sheetRef = useRef<HTMLDivElement | null>(null);
  // Свайп вниз закрывает напрямую — минуем GSAP-reverse, чтобы
  // inline-transform от хука не перебивался `yPercent`-tween-ом.
  useSwipeToClose(sheetRef, () => setOpen(false));

  const close = () => setTransition('close');

  if (!isOpen) {
    return <></>;
  }

  return (
    <ProfilePopupAnimations>
      <div
        id="modalBody"
        ref={sheetRef}
        className="fixed bottom-0 top-0 left-0 right-0 z-20 h-dvh overflow-y-auto rounded-t-[20px] bg-ink/80 px-5 pt-7.25 backdrop-blur-[10px] shadow-xl md:bottom-auto md:left-auto md:right-0 md:top-37.5 md:h-auto md:max-h-screen md:max-w-100 md:rounded-l-[20px] md:rounded-tr-none md:pb-7.25 lg:top-37.5 xl:top-46.25"
      >
        <div className="hidden w-full md:flex justify-end">
          <ClosePopupButton
            onClose={close}
            ariaLabel="Close profile"
            className="hidden -mt-2.5 md:flex"
          />
        </div>

        <div className="mx-auto h-full max-w-87.5 overflow-y-auto pb-25 no-scrollbar md:pb-0">
          <div className="mt-5 md:mt-0">
            <ProfileSections />
          </div>

          {/* Кнопка закрытия для мобилы внизу */}
          <div className="mt-7.5 mb-5 flex justify-center md:hidden">
            <ClosePopupButton onClose={close} ariaLabel="Close profile" />
          </div>

          <div className="h-25 bg-transparent md:hidden" />
        </div>
      </div>
      <ModalBackdrop />
    </ProfilePopupAnimations>
  );
};

export default ProfilePopup;

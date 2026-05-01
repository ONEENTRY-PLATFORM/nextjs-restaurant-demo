'use client';

import type { IAttributeValues } from 'oneentry/dist/base/utils';
import type { JSX } from 'react';
import { useContext, useRef } from 'react';

import { OpenDrawerContext } from '@/app/store/providers/OpenDrawerContext';
import * as forms from '@/components/forms';
import ArrowBackIcon from '@/components/icons/arrow-back';
import ModalAnimations from '@/components/layout/modal/animations/ModalAnimations';
import { useSwipeToClose } from '@/components/shared/useSwipeToClose';

import CloseModal from './components/CloseModal';
import ModalBackdrop from './components/ModalBackdrop';

/**
 * Компонент модалки
 */
const useTitleData = ({
  dict,
  component,
}: {
  dict: IAttributeValues | undefined;
  component: string;
}) => {
  const {
    sign_in_text,
    sign_up_text,
    reset_password_text,
    forgot_password_text,
    verification,
  } = dict ?? ({} as IAttributeValues);

  const titlesData = [
    {
      component: 'CalendarForm',
      value: 'Calendar',
    },
    {
      component: 'ForgotPasswordForm',
      value: forgot_password_text?.value,
    },
    {
      component: 'ResetPasswordForm',
      value: reset_password_text?.value,
    },
    {
      component: 'SignInForm',
      value: sign_in_text?.value,
    },
    {
      component: 'SignUpForm',
      value: sign_up_text?.value,
    },
    {
      component: 'VerificationForm',
      value: verification?.value,
    },
  ];
  const title = titlesData.find((t) => t.component === component);

  return title?.value;
};

/**
 * Компонент модалки форм
 */
const Modal = ({
  dict,
}: {
  dict: IAttributeValues | undefined;
}): JSX.Element => {
  const { component, setTransition, setOpen } = useContext(OpenDrawerContext);

  // выбираем компонент формы по имени компонента
  const Form = forms[component as keyof typeof forms] || null;

  const title = useTitleData({ dict, component });
  const sheetRef = useRef<HTMLDivElement | null>(null);
  // Свайп закрывает напрямую, минуя GSAP-reverse, чтобы inline-transform
  // от хука не перебивался tween-ом open/close-анимации.
  useSwipeToClose(sheetRef, () => setOpen(false));

  if (!Form) {
    return <></>;
  }

  return (
    <ModalAnimations component={component}>
      <div
        id="modalBody"
        ref={sheetRef}
        className="fixed bottom-0 left-0 right-0 z-20 flex max-h-[90vh] min-h-[60vh] w-full flex-col overflow-y-auto rounded-t-[20px] bg-ink/80 backdrop-blur-[10px] p-6 px-16 pt-24 pb-19 shadow-xl max-sm:px-8 sm:px-16 md:bottom-auto md:left-1/2 md:right-auto md:top-1/2 md:max-w-full md:-translate-x-1/2 md:-translate-y-1/2 md:overflow-hidden md:rounded-[20px] md:pb-6 md:pt-24 lg:h-auto lg:w-137.5 lg:p-10 lg:px-24 lg:pt-24 xl:px-24"
      >
        {/* Шапка попапа — back / title / close. Повторяет паттерн
            `static-html/pk_sing_in.html` (десктоп) и `cart_Sign_in_tel.html`
            (мобила): стрелка назад слева, заголовок по центру (brand-цвет,
            semibold, 24px), круглая X-кнопка справа. Back закрывает модалку
            (отдельной истории шагов внутри Modal нет — навигация внутри
            форм идёт через `setComponent` из родителя). */}
        <header className="absolute left-0 top-0 flex w-full items-center justify-between gap-5 px-16 py-6 max-sm:px-8 lg:px-24">
          <button
            type="button"
            onClick={() => setTransition('close')}
            aria-label="Back"
            className="group flex items-center justify-center"
          >
            <ArrowBackIcon className="hover-target text-paper" />
          </button>
          <p className="font-semibold text-[24px] text-brand">
            {title as string | undefined}
          </p>
          <CloseModal />
        </header>
        <Form className={''} dict={dict ?? {}} isActive={true} />
      </div>
      <ModalBackdrop />
    </ModalAnimations>
  );
};

export default Modal;

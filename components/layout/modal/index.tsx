'use client';

import type { IAttributeValues } from 'oneentry/dist/base/utils';
import type { JSX } from 'react';
import { useContext, useRef } from 'react';

import { OpenDrawerContext } from '@/app/store/providers/OpenDrawerContext';
import * as forms from '@/components/forms';
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
  const { component, setOpen } = useContext(OpenDrawerContext);

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
        className="fixed bottom-0 left-0 right-0 z-20 flex max-h-[90vh] min-h-[60vh] w-full flex-col overflow-y-auto rounded-t-[20px] bg-[rgba(76,77,86,0.8)] backdrop-blur-[10px] p-6 px-16 pt-32 pb-19 shadow-xl max-sm:px-8 sm:px-16 md:bottom-auto md:left-1/2 md:right-auto md:top-1/2 md:max-w-full md:-translate-x-1/2 md:-translate-y-1/2 md:overflow-hidden md:rounded-[20px] md:pb-6 lg:h-auto lg:w-137.5 lg:p-10 lg:px-24 lg:pt-32 xl:px-24"
      >
        <header className="bg-gradient-2 absolute left-0 top-0 flex w-full items-start gap-5 px-16 py-6 pr-6 text-4xl leading-8 text-white max-sm:px-8 lg:pl-24">
          <div className="mt-8 flex-auto self-end text-[32px] leading-10 max-sm:mt-0 xl:text-[42px]">
            {title as string | undefined}
          </div>
          <CloseModal />
        </header>
        <Form className={''} dict={dict ?? {}} isActive={true} />
      </div>
      <ModalBackdrop />
    </ModalAnimations>
  );
};

export default Modal;

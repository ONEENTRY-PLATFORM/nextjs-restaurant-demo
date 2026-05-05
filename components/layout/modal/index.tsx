'use client';

import type { ComponentType, JSX } from 'react';
import { useContext, useRef } from 'react';

import { useT } from '@/app/store/providers/DictProvider';
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
const useTitleData = (component: string): string => {
  const t = useT();
  const titlesData: Record<string, string> = {
    AuthProviderSelect: '',
    CalendarForm: 'Calendar',
    ForgotPasswordForm: t('forgot_password_text', ''),
    ResetPasswordForm: t('reset_password_text', ''),
    SignInForm: t('sign_in_text', ''),
    SignUpForm: t('sign_up_text', ''),
    VerificationForm: t('verification', ''),
  };
  return titlesData[component] ?? '';
};

// Подшаги auth-флоу, у которых первый шаг — AuthProviderSelect. Из них
// «назад» возвращает на выбор провайдера, а не закрывает попап.
const AUTH_FLOW_SUB_STEPS = new Set([
  'SignInForm',
  'SignUpForm',
  'ForgotPasswordForm',
  'ResetPasswordForm',
  'VerificationForm',
]);

/**
 * Компонент модалки форм
 */
const Modal = (): JSX.Element => {
  const { component, setComponent, setTransition, setOpen } = useContext(OpenDrawerContext);

  // выбираем компонент формы по имени компонента. Каст к общему типу,
  // потому что forms[component] — union с разнородными props (часть форм
  // не принимает className/isActive); они их просто игнорируют.
  const Form = (forms[component as keyof typeof forms] || null) as ComponentType<{
    className?: string;
    isActive?: boolean;
  }> | null;

  const title = useTitleData(component);
  const sheetRef = useRef<HTMLDivElement | null>(null);
  useSwipeToClose(sheetRef, () => setOpen(false));

  const isAuthSubStep = AUTH_FLOW_SUB_STEPS.has(component);
  const handleBack = () => {
    if (isAuthSubStep) {
      setComponent('AuthProviderSelect');
      return;
    }
    setTransition('close');
  };

  if (!Form) {
    return <></>;
  }

  return (
    <ModalAnimations component={component}>
      <div
        id="modalBody"
        ref={sheetRef}
        className="fixed bottom-0 left-0 right-0 z-20 flex max-h-[90vh] min-h-140 w-full flex-col overflow-y-auto rounded-t-[20px] bg-ink/80 backdrop-blur-[10px] p-6 px-16 pt-24 pb-19 shadow-xl max-sm:px-8 sm:px-16 md:bottom-auto md:left-1/2 md:right-auto md:top-1/2 md:max-w-full md:-translate-x-1/2 md:-translate-y-1/2 md:overflow-hidden md:rounded-[20px] md:pb-6 md:pt-24 lg:h-auto lg:w-137.5 lg:p-10 lg:px-24 lg:pt-24 xl:px-24"
      >
        {/* Шапка попапа — back / title / close. Повторяет паттерн
            `static-html/pk_sing_in.html` (десктоп) и `cart_Sign_in_tel.html`
            (мобила): стрелка назад слева, заголовок по центру (brand-цвет,
            semibold, 24px), круглая X-кнопка справа. На подшагах auth-флоу
            (SignInForm / SignUpForm / Forgot / Reset /
            Verification) Back возвращает на первый шаг — выбор провайдера
            (AuthProviderSelect). На самом первом шаге и в не-auth формах
            (CalendarForm и т.п.) Back закрывает модалку. */}
        <header className="absolute left-0 top-0 flex w-full items-center justify-between gap-5 px-16 py-6 max-sm:px-8 lg:px-24">
          <button
            type="button"
            onClick={handleBack}
            aria-label="Back"
            className="group flex items-center justify-center"
          >
            <ArrowBackIcon className="hover-target text-paper" />
          </button>
          <p className="font-semibold text-[24px] text-brand">{title}</p>
          <CloseModal />
        </header>
        <Form className={''} isActive={true} />
      </div>
      <ModalBackdrop />
    </ModalAnimations>
  );
};

export default Modal;

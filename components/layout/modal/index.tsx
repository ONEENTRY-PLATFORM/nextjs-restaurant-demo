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

/** Modal title resolved by form component name. */
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

// Auth-flow sub-steps: "back" returns to AuthProviderSelect instead of closing the popup.
const AUTH_FLOW_SUB_STEPS = new Set([
  'SignInForm',
  'SignUpForm',
  'ForgotPasswordForm',
  'ResetPasswordForm',
  'VerificationForm',
]);

/** Modal — popup for auth / calendar forms. */
const Modal = (): JSX.Element => {
  const { component, setComponent, setTransition, setOpen } = useContext(OpenDrawerContext);

  // Cast to a common type: `forms[component]` is a union with heterogeneous props,
  // some forms ignore className/isActive.
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
        className="fixed bottom-0 left-0 right-0 z-20 flex max-h-[90vh] min-h-140 w-full flex-col overflow-y-auto rounded-t-[20px] bg-ink/80 backdrop-blur-[10px] p-6 px-16 pt-24 pb-25 shadow-xl max-sm:px-8 sm:px-16 md:bottom-auto md:left-1/2 md:right-auto md:top-1/2 md:w-182.5 md:max-w-[95vw] md:-translate-x-1/2 md:-translate-y-1/2 md:rounded-[20px] md:pb-6 md:pt-24 lg:h-auto lg:p-10 lg:px-33.5 lg:pt-24"
      >
        {/* Popup header: back / title / close. */}
        <header className="absolute left-0 top-0 flex w-full items-center justify-between gap-5 px-8 py-6 max-sm:px-8 lg:px-12">
          {isAuthSubStep ? (
            <button
              type="button"
              onClick={handleBack}
              aria-label="Back"
              className="group flex items-center justify-center"
            >
              <ArrowBackIcon className="hover-target text-paper" />
            </button>
          ) : (
            <div className="size-7" />
          )}
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

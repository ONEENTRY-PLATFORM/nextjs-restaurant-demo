'use client';

import type { ComponentType, JSX } from 'react';
import { useContext, useRef } from 'react';

import { useT } from '@/app/store/providers/DictProvider';
import { OpenDrawerContext } from '@/app/store/providers/OpenDrawerContext';
import AuthProviderSelect from '@/components/forms/AuthProviderSelect';
import CalendarForm from '@/components/forms/CalendarForm';
import ContactUsForm from '@/components/forms/ContactUsForm';
import ForgotPasswordForm from '@/components/forms/ForgotPasswordForm';
import ResetPasswordForm from '@/components/forms/ResetPasswordForm';
import SignInForm from '@/components/forms/SignInForm';
import SignUpForm from '@/components/forms/SignUpForm';
import VerificationForm from '@/components/forms/VerificationForm';
import ArrowBackIcon from '@/components/icons/arrow-back';
import ModalAnimations from '@/components/layout/modal/animations/ModalAnimations';
import ModalScreenSwap from '@/components/layout/modal/animations/ModalScreenSwap';
import { useSwipeToClose } from '@/components/shared/useSwipeToClose';

const FORMS = {
  AuthProviderSelect,
  CalendarForm,
  ContactUsForm,
  ForgotPasswordForm,
  ResetPasswordForm,
  SignInForm,
  SignUpForm,
  VerificationForm,
};

import CloseModal from './components/CloseModal';
import ModalBackdrop from './components/ModalBackdrop';

/**
 * useTitleData — resolves the modal title from the active form component name.
 *
 * @param   {string} component - Active form component identifier (e.g. `SignInForm`, `CalendarForm`).
 * @returns Localized title string for the modal header.
 */
const useTitleData = (component: string): string => {
  const t = useT();
  const titlesData: Record<string, string> = {
    AuthProviderSelect: '',
    CalendarForm: t('calendar_title', 'Calendar'),
    ForgotPasswordForm: t('forgot_password_text', ''),
    ResetPasswordForm: t('reset_password_text', ''),
    SignInForm: t('sign_in_text', ''),
    SignUpForm: t('sign_up_text', ''),
    VerificationForm: t('verification_text', ''),
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

/**
 * Modal — popup container for auth / calendar forms driven by {@link OpenDrawerContext}.
 *
 * @returns JSX of the centered modal (with mobile bottom-sheet behaviour) rendering the active form.
 */
const Modal = (): JSX.Element => {
  const { component, setComponent, setTransition, setOpen } = useContext(OpenDrawerContext);
  const t = useT();

  // Form components have heterogeneous props (some ignore className/isActive); cast to a
  // common subset for the screen-swap container, which only forwards className/isActive.
  const formsByName = FORMS as unknown as Record<
    string,
    ComponentType<{ className?: string; isActive?: boolean }> | undefined
  >;
  const hasForm = Boolean(formsByName[component]);

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

  if (!hasForm) {
    return <></>;
  }

  return (
    <ModalAnimations component={component}>
      <div
        id="modalBody"
        ref={sheetRef}
        className="no-scrollbar fixed inset-x-0 bottom-0 z-20 flex max-h-dvh min-h-140 w-full flex-col overflow-y-auto rounded-t-[20px] bg-ink/80 p-6 px-16 pt-24 pb-25 shadow-xl backdrop-blur-card max-sm:px-8 sm:px-16 md:top-1/2 md:right-auto md:bottom-auto md:left-1/2 md:max-h-[90vh] md:w-182.5 md:max-w-[95vw] md:-translate-1/2 md:rounded-[20px] md:pt-24 md:pb-6 lg:h-auto lg:p-10 lg:px-33.5 lg:pt-24"
      >
        {/* Popup header: back / title / close. */}
        <header className="absolute top-0 left-0 flex w-full items-center justify-between gap-5 px-8 py-6 max-sm:px-8 lg:px-12">
          {isAuthSubStep ? (
            <button
              type="button"
              onClick={handleBack}
              aria-label={t('back_text', 'Back')}
              className="group flex items-center justify-center"
            >
              <ArrowBackIcon className="hover-target text-paper" />
            </button>
          ) : (
            <div className="size-7" />
          )}
          <p className="text-2xl font-semibold text-brand">{title}</p>
          {/* Close lives in the bottom-menu on mobile (CenterCloseButton); show only md+. */}
          <CloseModal className="max-md:hidden" />
          <span aria-hidden="true" className="size-12.5 md:hidden" />
        </header>
        <ModalScreenSwap component={component} forms={formsByName} />
      </div>
      <ModalBackdrop />
    </ModalAnimations>
  );
};

export default Modal;

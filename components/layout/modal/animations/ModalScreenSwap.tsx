'use client';

import { useGSAP } from '@gsap/react';
import { gsap } from 'gsap';
import type { ComponentType, JSX } from 'react';
import { useEffect, useRef, useState } from 'react';

import { FormFieldAnimationsSkipContext } from '@/components/forms/animations/FormFieldAnimations';

type FormProps = { className?: string; isActive?: boolean };

/**
 * SCREEN_LEVELS — depth of each auth-popup screen in the wizard.
 *
 * A transition toward a deeper level slides forward; a transition back toward the root slides backward.
 */
const SCREEN_LEVELS: Record<string, number> = {
  AuthProviderSelect: 0,
  SignInForm: 1,
  ForgotPasswordForm: 1,
  SignUpForm: 2,
  ResetPasswordForm: 2,
  VerificationForm: 2,
};

/**
 * ModalScreenSwap — slides between two auth-popup forms when the active `component` changes.
 *
 * On a `component` change the previous form is kept mounted in an absolutely-positioned
 * overlay and the new form (rendered in the in-flow slot) is offset off-screen vertically;
 * both are then animated along the y-axis at the same time so the two screens slide together.
 * After the timeline completes the overlay is dropped and the new form keeps the same React
 * instance it had during the transition — no remount.
 *
 * @param   {object}                                                 props           - Component props.
 * @param   {string}                                                 props.component - Target form identifier (e.g. `'SignInForm'`).
 * @param   {Record<string, ComponentType<FormProps> | undefined>}   props.forms     - Map of identifier → form component.
 * @returns JSX of the active form, plus the outgoing form as an overlay during a transition.
 */
const ModalScreenSwap = ({
  component,
  forms,
}: {
  component: string;
  forms: Record<string, ComponentType<FormProps> | undefined>;
}): JSX.Element => {
  const [previous, setPrevious] = useState<string | null>(null);
  const [direction, setDirection] = useState<1 | -1>(1);
  const lastComponentRef = useRef<string>(component);
  const currentRef = useRef<HTMLDivElement>(null);
  const previousRef = useRef<HTMLDivElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (lastComponentRef.current === component) return;
    const fromLevel = SCREEN_LEVELS[lastComponentRef.current] ?? 0;
    const toLevel = SCREEN_LEVELS[component] ?? 0;
    setDirection(toLevel >= fromLevel ? 1 : -1);
    setPrevious(lastComponentRef.current);
    lastComponentRef.current = component;
  }, [component]);

  useGSAP(
    () => {
      if (previous === null) return undefined;
      const cur = currentRef.current;
      const prev = previousRef.current;
      if (!cur || !prev) return undefined;

      const offset = direction === 1 ? 100 : -100;
      gsap.set(cur, { yPercent: offset, autoAlpha: 0 });
      gsap.set(prev, { yPercent: 0, autoAlpha: 1 });

      const tl = gsap.timeline({
        onComplete: () => {
          gsap.set(cur, { clearProps: 'all' });
          setPrevious(null);
        },
      });
      tl.to(
        cur,
        {
          yPercent: 0,
          autoAlpha: 1,
          duration: 0.45,
          ease: 'power2.inOut',
        },
        0
      ).to(
        prev,
        {
          yPercent: -offset,
          autoAlpha: 0,
          duration: 0.45,
          ease: 'power2.inOut',
        },
        0
      );

      return () => {
        tl.kill();
      };
    },
    { scope: wrapperRef, dependencies: [previous, direction] }
  );

  const Current = forms[component];
  const Previous = previous ? forms[previous] : null;

  if (!Current) return <></>;

  return (
    <div ref={wrapperRef} className="relative w-full overflow-hidden">
      <div ref={currentRef}>
        <Current className="" isActive={previous === null} />
      </div>
      {Previous && (
        <div ref={previousRef} className="pointer-events-none absolute inset-x-0 top-0">
          <FormFieldAnimationsSkipContext.Provider value={true}>
            <Previous className="" isActive={false} />
          </FormFieldAnimationsSkipContext.Provider>
        </div>
      )}
    </div>
  );
};

export default ModalScreenSwap;

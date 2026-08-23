'use client';

import Image from 'next/image';
import type { IAuthProvidersEntity } from 'oneentry/types';
import type { JSX } from 'react';
import { useContext } from 'react';

import { useGetAuthProvidersQuery } from '@/app/api';
import { OpenDrawerContext } from '@/app/store/providers/OpenDrawerContext';
import FormAnimations from '@/components/forms/animations/FormAnimations';
import FormFieldAnimations from '@/components/forms/animations/FormFieldAnimations';
import {
  getProviderMeta,
  sortActiveAuthProviders,
  startGoogleOAuth,
} from '@/components/forms/authProviders';
import LogoIcon from '@/components/icons/logo';

/**
 * redirectToOAuth — full-page redirect to an OAuth provider's authorization URL.
 *
 * @param   {string} url - Authorization URL to navigate to.
 * @returns
 */
const redirectToOAuth = (url: string) => {
  window.location.href = url;
};

/**
 * AuthProviderSelect — first auth step (provider picker).
 *
 * @param   {object}  props           - Component props.
 * @param   {string}  props.className - Wrapper class merged onto the animated form root.
 * @param   {boolean} props.isActive  - Whether the step is the active step in the auth wizard (drives animations).
 * @returns JSX of the provider list (logo + buttons).
 */
const AuthProviderSelect = ({
  className,
  isActive,
}: {
  className: string;
  isActive: boolean;
}): JSX.Element => {
  const { setComponent } = useContext(OpenDrawerContext);
  const { data: providers, isLoading } = useGetAuthProvidersQuery('');

  const onProviderClick = (p: IAuthProvidersEntity) => {
    if (p.identifier === 'email' || p.identifier === 'phone') {
      // Route the phone provider through the same email/login flow in SignInForm
      // (a dedicated PhoneAuthForm is not used).
      setComponent('SignInForm');
      return;
    }
    if (p.identifier === 'google') {
      startGoogleOAuth(p);
      return;
    }
    if (p.type === 'oauth' && p.config?.oauthAuthUrl) {
      redirectToOAuth(p.config.oauthAuthUrl);
      return;
    }
    setComponent('SignInForm');
  };

  const active = sortActiveAuthProviders(providers ?? []);

  return (
    <FormAnimations isLoading={isLoading} className={className} isActive={isActive}>
      <div className="mx-auto flex w-full flex-col">
        <FormFieldAnimations index={0} from="above" className="mx-auto">
          <LogoIcon fill="#FFFFFF" className="mx-auto block w-42.5" />
        </FormFieldAnimations>
        <div className="mt-10 flex flex-col">
          {active.map((p, i) => {
            const meta = getProviderMeta(p);
            const isEmail = p.identifier === 'email';
            return (
              <FormFieldAnimations key={p.id} index={i + 1} from="above" className="w-full">
                <button
                  type="button"
                  onClick={() => onProviderClick(p)}
                  className={`mt-6.5 flex h-14 w-full items-center justify-center gap-6.25 rounded-panel border-none ${isEmail ? 'bg-brand' : 'bg-disabled-bg'} text-center text-[17px] font-semibold text-white backdrop-blur-card transition-all duration-700 hover:bg-brand active:bg-brand-active disabled:bg-disabled-bg-soft disabled:text-ink`}
                >
                  <div className="flex w-50 items-center justify-start gap-5 text-base font-bold">
                    <Image src={meta.icon} alt="" width={meta.iconWidth} height={meta.iconHeight} />
                    <span>{meta.label}</span>
                  </div>
                </button>
              </FormFieldAnimations>
            );
          })}
        </div>
      </div>
    </FormAnimations>
  );
};

export default AuthProviderSelect;

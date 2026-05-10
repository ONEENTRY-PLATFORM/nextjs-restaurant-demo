'use client';

import Image from 'next/image';
import type { IAuthProvidersEntity } from 'oneentry/dist/auth-provider/authProvidersInterfaces';
import type { JSX } from 'react';
import { useContext } from 'react';

import { useGetAuthProvidersQuery } from '@/app/api';
import { OpenDrawerContext } from '@/app/store/providers/OpenDrawerContext';
import FormAnimations from '@/components/forms/animations/FormAnimations';
import {
  getProviderMeta,
  sortActiveAuthProviders,
  startGoogleOAuth,
} from '@/components/forms/authProviders';

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
      // (a dedicated PhoneAuthForm is not used - see MISMATCH-LOG.md §C.8.2).
      setComponent('SignInForm');
      return;
    }
    if (p.identifier === 'google') {
      startGoogleOAuth(p.config?.oauthAuthUrl);
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
        <Image
          src="/images/logo.svg"
          alt="OneEntry Restaurant"
          width={171}
          height={143}
          className="mx-auto h-auto w-42.5"
          priority
        />
        <div className="mt-10 flex flex-col">
          {active.map(p => {
            const meta = getProviderMeta(p);
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => onProviderClick(p)}
                className="mt-6.5 flex h-14 w-full items-center justify-center gap-6.25 rounded-panel border-none bg-disabled-bg backdrop-blur-card text-center font-semibold text-[17px] text-white transition-all duration-700 hover:bg-brand active:bg-brand-active disabled:bg-disabled-bg-soft disabled:text-ink"
              >
                <div className="flex w-50 items-center justify-start gap-5 font-bold text-base">
                  <Image src={meta.icon} alt="" width={meta.iconWidth} height={meta.iconHeight} />
                  <span>{meta.label}</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </FormAnimations>
  );
};

export default AuthProviderSelect;

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

const redirectToOAuth = (url: string) => {
  window.location.href = url;
};

/**
 * Первый шаг авторизации — выбор провайдера. Список провайдеров берётся из
 * OneEntry (`AuthProvider.getAuthProviders`), фильтруется по `isActive`. Email
 * открывают соответствующие формы AuthForm внутри
 * того же попапа. Google запускает OAuth-редирект; прочие OAuth-провайдеры —
 * `config.oauthAuthUrl` напрямую.
 *
 * Дизайн — `pk_login.html` / `cart_login.html` / Figma 2383:2799: лого по центру
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
      // Phone-провайдер пускаем тем же email/login flow в SignInForm
      // (отдельная PhoneAuthForm не используется — см. MISMATCH-LOG.md §C.8.2).
      setComponent('SignInForm');
      return;
    }
    if (p.identifier === 'google') {
      if (!startGoogleOAuth()) {
        // Google OAuth ещё не сконфигурирован (см. MISMATCH-LOG.md §C.8.1).
        // Падаем в email, чтобы у пользователя был рабочий путь логина.
        setComponent('SignInForm');
      }
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
          {active.map((p, idx) => {
            const meta = getProviderMeta(p);
            const isPrimary = idx === 0;
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => onProviderClick(p)}
                className={
                  isPrimary
                    ? 'mt-6.5 flex h-14 w-full items-center justify-center gap-6.25 rounded-[10px] border-none bg-custom_btnorange text-center font-semibold text-[17px] text-white transition-all duration-700 hover:bg-brand-hover'
                    : 'cart_btn'
                }
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

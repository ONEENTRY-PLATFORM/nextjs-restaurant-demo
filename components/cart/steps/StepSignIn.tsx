'use client';

import Image from 'next/image';
import type { IAuthProvidersEntity } from 'oneentry/dist/auth-provider/authProvidersInterfaces';
import type { JSX } from 'react';
import { useContext, useEffect } from 'react';

import { useGetAuthProvidersQuery } from '@/app/api';
import { useAppDispatch } from '@/app/store/hooks';
import { AuthContext } from '@/app/store/providers/AuthContext';
import { OpenDrawerContext } from '@/app/store/providers/OpenDrawerContext';
import { setStep } from '@/app/store/reducers/OrderSlice';
import {
  getProviderMeta,
  sortActiveAuthProviders,
  startGoogleOAuth,
} from '@/components/forms/authProviders';

const redirectToOAuth = (url: string) => {
  window.location.href = url;
};

/**
 * Шаг checkout — auth-гейт.
 *
 * Если пользователь уже авторизован, авто-переходит на `address`.
 * Иначе рендерит выбор провайдера из OneEntry
 * (`AuthProvider.getAuthProviders`, фильтр по `isActive`) — тот же набор,
 * что и в попапе авторизации (см. AuthProviderSelect).
 *
 * - Email/Phone открывает drawer SignInForm (phone — тот же email/login flow,
 *   отдельной PhoneAuthForm нет; см. MISMATCH-LOG.md §C.8.2).
 * - Google делает top-window редирект на OAuth-эндпоинт Google;
 *   колбэк в `app/auth/callback/google/page.tsx` обменивает
 *   код через `oauthLogIn` → `api.AuthProvider.oauth('google', …)`.
 * - Прочие OAuth-провайдеры → `config.oauthAuthUrl`.
 *
 * Дизайн — `static-html/cart_login.html`.
 *
 * @returns {JSX.Element} JSX шага.
 */
const StepSignIn = (): JSX.Element => {
  const { isAuth, isLoading: isAuthLoading } = useContext(AuthContext);
  const { setOpen, setComponent } = useContext(OpenDrawerContext);
  const dispatch = useAppDispatch();
  const { data: providers, isLoading: isProvidersLoading } = useGetAuthProvidersQuery('');

  useEffect(() => {
    if (isAuth) {
      dispatch(setStep('payment'));
    }
  }, [isAuth, dispatch]);

  if (isAuthLoading || isProvidersLoading) {
    return <div className="text-center text-paper/80">Loading...</div>;
  }

  const onProviderClick = (p: IAuthProvidersEntity) => {
    if (p.identifier === 'email' || p.identifier === 'phone') {
      setComponent('SignInForm');
      setOpen(true);
      return;
    }
    if (p.identifier === 'google') {
      if (!startGoogleOAuth()) {
        // Google OAuth ещё не сконфигурирован (см. MISMATCH-LOG.md §C.8.1).
        // Падаем в email, чтобы у пользователя был рабочий путь логина.
        setComponent('SignInForm');
        setOpen(true);
      }
      return;
    }
    if (p.type === 'oauth' && p.config?.oauthAuthUrl) {
      redirectToOAuth(p.config.oauthAuthUrl);
      return;
    }
    setComponent('SignInForm');
    setOpen(true);
  };

  const active = sortActiveAuthProviders(providers ?? []);

  return (
    <div className="mx-auto flex w-full max-w-115 flex-col">
      <Image
        src="/images/logo.svg"
        alt="OneEntry Restaurant"
        width={171}
        height={143}
        className="mx-auto h-auto w-42.5"
        priority
      />
      {active.map(p => {
        const meta = getProviderMeta(p);
        return (
          <button key={p.id} type="button" onClick={() => onProviderClick(p)} className="cart_btn">
            <div className="flex w-50 items-center justify-start gap-5 font-bold text-base">
              <Image src={meta.icon} alt="" width={meta.iconWidth} height={meta.iconHeight} />
              {meta.label}
            </div>
          </button>
        );
      })}
    </div>
  );
};

export default StepSignIn;

'use client';

import type { FormEvent, JSX } from 'react';
import { useContext, useState } from 'react';
import { toast } from 'react-toastify';

import { logInUser } from '@/app/api';
import { AuthContext } from '@/app/store/providers/AuthContext';
import { useT } from '@/app/store/providers/DictProvider';
import ErrorMessage from '@/components/forms/inputs/ErrorMessage';

type ReservationAuthStepProps = {
  /**
   * Колбэк при успешной авторизации. Вызывающий код переключит шаг
   * визарда на `payment` (форма уже валидирована и payload собран).
   */
  onAuthSuccess: () => void;
  onBack: () => void;
};

/**
 * Шаг авторизации внутри попапа бронирования. Появляется, когда юзер
 * нажал Continue на форме, но не залогинен — `Orders.createOrder`
 * требует user-token, иначе SDK вернёт 401 («You must authorize to send
 * data»).
 *
 * Реализован inline, без глобального `OpenDrawerContext.setComponent`,
 * чтобы не уничтожать смонтированный `ReservationPopup` (это бы стёрло
 * собранные значения формы). Используется обычный email/password логин;
 * Google/SignUp вынесены в общий auth-flow и здесь не дублируются —
 * для них юзер закроет попап и пройдёт обычным путём из header'а.
 * @param   {ReservationAuthStepProps} props - Пропсы шага.
 * @returns {JSX.Element}                    JSX шага авторизации.
 */
const ReservationAuthStep = ({ onAuthSuccess, onBack }: ReservationAuthStepProps): JSX.Element => {
  const t = useT();
  const { authenticate } = useContext(AuthContext);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!email || !password) return;

    setLoading(true);
    setError('');
    try {
      const result = await logInUser({ method: 'email', login: email, password });
      if (result?.error) {
        throw new Error(result.error);
      }
      authenticate();
      toast(t('signed_in_toast', 'You signed in!'));
      onAuthSuccess();
    } catch (err) {
      setError((err as { message?: string })?.message ?? 'Sign-in failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={onSubmit} className="flex w-full flex-col gap-5 px-5 md:px-19">
      <p className="text-center font-normal text-[16px] leading-5 text-paper">
        {t('booking_signin_prompt', 'Please sign in to confirm your booking.')}
      </p>

      <div className="flex flex-col border-b border-b-muted">
        <label htmlFor="reservation-auth-email" className="font-normal text-[16px] text-paper">
          {t('email_label', 'Email')}
        </label>
        <input
          type="email"
          id="reservation-auth-email"
          name="email"
          autoComplete="email"
          value={email}
          onChange={ev => setEmail(ev.currentTarget.value)}
          className="cart_input"
          required
        />
      </div>

      <div className="flex flex-col border-b border-b-muted">
        <label htmlFor="reservation-auth-password" className="font-normal text-[16px] text-paper">
          {t('password_label', 'Password')}
        </label>
        <input
          type="password"
          id="reservation-auth-password"
          name="password"
          autoComplete="current-password"
          value={password}
          onChange={ev => setPassword(ev.currentTarget.value)}
          className="cart_input"
          required
        />
      </div>

      {error ? <ErrorMessage error={error} /> : null}

      <div className="mt-2.5 flex items-center justify-center gap-3.75">
        <button
          type="button"
          onClick={onBack}
          className="flex h-9 items-center justify-center rounded-[5px] border border-paper px-5 font-normal text-[16px] text-paper hover:opacity-80"
        >
          {t('back_text', 'Back')}
        </button>
        <button
          type="submit"
          disabled={loading || !email || !password}
          className="flex h-9 min-w-25 items-center justify-center rounded-[5px] border border-brand px-5 font-normal text-[16px] text-brand hover:bg-brand/10 disabled:opacity-60"
        >
          {loading ? '...' : t('sign_in_text', 'Sign in')}
        </button>
      </div>
    </form>
  );
};

export default ReservationAuthStep;

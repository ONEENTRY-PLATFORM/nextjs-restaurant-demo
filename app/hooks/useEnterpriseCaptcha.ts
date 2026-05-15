import { useEffect, useState } from 'react';

// `Window.grecaptcha` declared globally in `app/types/global.d.ts`.

export interface CaptchaValidationObject {
  event: {
    token: string;
    siteKey: string;
  };
}

/**
 * useEnterpriseCaptcha — loads Google reCAPTCHA Enterprise for the given `siteKey` and runs `grecaptcha.enterprise.execute(...)`, returning the validation object that OneEntry expects in the `value` of a `spam`-type field.
 *
 * Injects `<script src="...enterprise.js?render=KEY">`, subscribes to `load`, fires `ready` → `execute`, and removes the subscription on unmount.
 *
 * @param   {string | undefined}                 siteKey - Public Google reCAPTCHA Enterprise key (settings.captcha.key on the spam field).
 * @param   {string}                             action  - Action used for scoring (defaults to `'login'`; in OneEntry — settings.captcha.action).
 * @returns `{ event: { token, siteKey } }` after a successful `execute`, otherwise `null`.
 */
export function useEnterpriseCaptcha(
  siteKey: string | undefined,
  action: string = 'login'
): CaptchaValidationObject | null {
  const [validation, setValidation] = useState<CaptchaValidationObject | null>(null);

  useEffect(() => {
    if (!siteKey) return;

    const handleLoaded = () => {
      window.grecaptcha?.enterprise.ready(() => {
        window.grecaptcha?.enterprise
          .execute(siteKey, { action })
          .then(token => setValidation({ event: { token, siteKey } }))
          .catch(() => {});
      });
    };

    const script = document.createElement('script');
    script.src = `https://www.google.com/recaptcha/enterprise.js?render=${siteKey}`;
    script.addEventListener('load', handleLoaded);
    document.body.appendChild(script);

    return () => {
      script.removeEventListener('load', handleLoaded);
      script.remove();
    };
  }, [siteKey, action]);

  return validation;
}

import { useEffect, useState } from 'react';

// `Window.grecaptcha` declared globally в `app/types/global.d.ts`.

export interface CaptchaValidationObject {
  event: {
    token: string;
    siteKey: string;
  };
}

/**
 * Загружает Google reCAPTCHA Enterprise для указанного `siteKey` и
 * выполняет `grecaptcha.enterprise.execute(...)`, возвращая объект
 * валидации, который OneEntry ожидает в `value` поля типа `spam`:
 *
 * ```json
 * { "event": { "token": "...", "siteKey": "..." } }
 * ```
 *
 * Hook сам инжектит `<script src="...enterprise.js?render=KEY">`,
 * подписывается на `load`, запускает `ready` → `execute` и снимает
 * подписку на размонтировании. Если `siteKey` пустой — ничего не
 * делает и возвращает `null`.
 * @param   {string} siteKey - Публичный ключ Google reCAPTCHA Enterprise (settings.captcha.key поля spam).
 * @param   {string} action  - Действие для скоринга (по умолчанию `'login'`, в OneEntry — settings.captcha.action).
 * @returns {CaptchaValidationObject | null} Объект `{ event: { token, siteKey } }` после успешного `execute`, иначе `null`.
 */
export function useEnterpriseCaptcha(
  siteKey: string | undefined,
  action: string = 'login',
): CaptchaValidationObject | null {
  const [validation, setValidation] = useState<CaptchaValidationObject | null>(
    null,
  );

  useEffect(() => {
    if (!siteKey) return;

    const handleLoaded = () => {
      window.grecaptcha?.enterprise.ready(() => {
        window.grecaptcha?.enterprise
          .execute(siteKey, { action })
          .then((token) => setValidation({ event: { token, siteKey } }))
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

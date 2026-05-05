'use client';

import type { IAttributeValues } from 'oneentry/dist/base/utils';
import type { JSX, ReactNode } from 'react';
import { createContext, useCallback, useContext } from 'react';

import { dictText } from '@/components/utils';

const DictContext = createContext<IAttributeValues | undefined>(undefined);

/**
 * Провайдер словаря `static_content`. Кладёт нормализованную мапу
 * (см. [app/dictionaries.ts](app/dictionaries.ts)) в Context, чтобы
 * client-компоненты могли читать строки через {@link useT} без
 * прокидывания `dict` через пропсы.
 */
export const DictProvider = ({
  value,
  children,
}: {
  value: IAttributeValues | undefined;
  children: ReactNode;
}): JSX.Element => <DictContext.Provider value={value}>{children}</DictContext.Provider>;

/**
 * Возвращает функцию `t(marker, fallback)`, которая читает строку из
 * dict-контекста через {@link dictText}. Хук, поэтому используется
 * только в client-компонентах. Server-компоненты продолжают вызывать
 * `dictText(dict, marker, fallback)` напрямую с результатом
 * `getDictionary()`.
 *
 * @example
 *   const t = useT();
 *   <p>{t('subtotal_text', 'Subtotal')}</p>
 */
export const useT = (): ((marker: string, fallback: string) => string) => {
  const dict = useContext(DictContext);
  return useCallback(
    (marker: string, fallback: string) => dictText(dict, marker, fallback),
    [dict]
  );
};

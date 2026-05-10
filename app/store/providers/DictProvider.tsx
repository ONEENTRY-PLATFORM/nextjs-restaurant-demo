'use client';

import type { IAttributeValues } from 'oneentry/dist/base/utils';
import type { JSX, ReactNode } from 'react';
import { createContext, useCallback, useContext } from 'react';

import { dictText } from '@/components/utils';

const DictContext = createContext<IAttributeValues | undefined>(undefined);

/**
 * DictProvider — provider for the `static_content` dictionary. Puts the normalized
 * map (see [app/dictionaries.ts](app/dictionaries.ts)) into Context so that
 * client components can read strings through {@link useT} without
 * threading `dict` through props.
 *
 * @param   {object}                          props          - Component props.
 * @param   {IAttributeValues | undefined}    props.value    - Dictionary map keyed by attribute marker.
 * @param   {ReactNode}                       props.children - Subtree that consumes the dictionary context.
 * @returns {JSX.Element}                                    JSX provider wrapping children with the dictionary context value.
 */
export const DictProvider = ({
  value,
  children,
}: {
  value: IAttributeValues | undefined;
  children: ReactNode;
}): JSX.Element => <DictContext.Provider value={value}>{children}</DictContext.Provider>;

/**
 * useT — returns a `t(marker, fallback)` function that reads a string from
 * the dict context via {@link dictText}. It's a hook, so it's only used
 * in client components. Server components keep calling
 * `dictText(dict, marker, fallback)` directly with the result of
 * `getDictionary()`.
 *
 * @example
 *   const t = useT();
 *   <p>{t('subtotal_text', 'Subtotal')}</p>
 *
 * @returns {(marker: string, fallback: string) => string} `t(marker, fallback)` reader bound to the current dictionary context.
 */
export const useT = (): ((marker: string, fallback: string) => string) => {
  const dict = useContext(DictContext);
  return useCallback(
    (marker: string, fallback: string) => dictText(dict, marker, fallback),
    [dict]
  );
};

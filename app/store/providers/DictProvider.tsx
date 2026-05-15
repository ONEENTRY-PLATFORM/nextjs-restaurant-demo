'use client';

import type { IAttributeValues } from 'oneentry/dist/base/utils';
import type { JSX, ReactNode } from 'react';
import { createContext, useCallback, useContext } from 'react';

import { dictText } from '@/components/utils';

const DictContext = createContext<IAttributeValues | undefined>(undefined);

/**
 * DictProvider — provider for the `static_content` dictionary.
 *
 * @param   {object}                          props          - Component props.
 * @param   {IAttributeValues | undefined}    props.value    - Dictionary map keyed by attribute marker.
 * @param   {ReactNode}                       props.children - Subtree that consumes the dictionary context.
 * @returns JSX provider wrapping children with the dictionary context value.
 */
export const DictProvider = ({
  value,
  children,
}: {
  value: IAttributeValues | undefined;
  children: ReactNode;
}): JSX.Element => <DictContext.Provider value={value}>{children}</DictContext.Provider>;

/**
 * useT — returns a `t(marker, fallback)` function that reads a string from the dict context via {@link dictText}.
 *
 * @example
 *   const t = useT();
 *   <p>{t('subtotal_text', 'Subtotal')}</p>
 *
 * @returns `t(marker, fallback)` reader bound to the current dictionary context.
 */
export const useT = (): ((marker: string, fallback: string) => string) => {
  const dict = useContext(DictContext);
  return useCallback(
    (marker: string, fallback: string) => dictText(dict, marker, fallback),
    [dict]
  );
};

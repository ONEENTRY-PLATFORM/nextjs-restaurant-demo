'use client';

import type { IAttributeValues } from 'oneentry/types';
import type { JSX, ReactNode } from 'react';
import { createContext, use, useCallback, useContext } from 'react';

import { dictText } from '@/components/utils';

const DictContext = createContext<IAttributeValues | undefined>(undefined);

type DictProviderProps = {
  /**
   * Either a resolved dictionary or a promise that resolves to one. Passing a
   * promise lets the layout start the dictionary fetch in parallel with every
   * other server component (`use()` suspends until it lands instead of
   * blocking the whole layout await chain).
   */
  value: IAttributeValues | Promise<IAttributeValues> | undefined;
  children: ReactNode;
};

const isPromise = (v: unknown): v is Promise<IAttributeValues> =>
  typeof v === 'object' && v !== null && typeof (v as { then?: unknown }).then === 'function';

/**
 * DictProvider — provider for the `static_content` dictionary.
 *
 * Accepts either the resolved dictionary or a pending promise. When given a
 * promise, `use()` unwraps it so the layout can fire `getDictionary()` without
 * awaiting — Header / page server components start their fetches in parallel
 * with the dictionary fetch instead of waiting for it.
 *
 * @param   {DictProviderProps} props          - Component props.
 * @param   {IAttributeValues | Promise<IAttributeValues> | undefined} props.value - Resolved dictionary or a promise to one.
 * @param   {ReactNode}         props.children - Subtree that consumes the dictionary context.
 * @returns JSX provider wrapping children with the dictionary context value.
 */
export const DictProvider = ({ value, children }: DictProviderProps): JSX.Element => {
  const resolved = isPromise(value) ? use(value) : value;
  return <DictContext.Provider value={resolved}>{children}</DictContext.Provider>;
};

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

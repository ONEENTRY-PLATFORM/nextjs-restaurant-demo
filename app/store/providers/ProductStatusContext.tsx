'use client';

import type { JSX, ReactNode } from 'react';
import { createContext, use, useContext } from 'react';

import { PRODUCT_STATUSES } from '@/app/utils/constants';

const OutOfStockMarkerContext = createContext<string | undefined>(undefined);

type ProductStatusProviderProps = {
  value: string | Promise<string> | undefined;
  children: ReactNode;
};

const isPromise = (v: unknown): v is Promise<string> =>
  typeof v === 'object' && v !== null && typeof (v as { then?: unknown }).then === 'function';

/**
 * ProductStatusProvider — provider for the live out-of-stock status marker.
 *
 * @param   {ProductStatusProviderProps}            props          - Component props.
 * @param   {string | Promise<string> | undefined}  props.value    - Resolved out-of-stock marker or a promise to one.
 * @param   {ReactNode}                             props.children - Subtree that consumes the marker context.
 * @returns JSX provider wrapping children with the out-of-stock marker context value.
 */
export const ProductStatusProvider = ({
  value,
  children,
}: ProductStatusProviderProps): JSX.Element => {
  const resolved = isPromise(value) ? use(value) : value;
  return (
    <OutOfStockMarkerContext.Provider value={resolved}>{children}</OutOfStockMarkerContext.Provider>
  );
};

/**
 * useOutOfStockMarker — the live out-of-stock status marker from context.
 *
 * @returns The out-of-stock status identifier to compare `product.statusIdentifier` against.
 */
export const useOutOfStockMarker = (): string =>
  useContext(OutOfStockMarkerContext) || PRODUCT_STATUSES.outOfStock;

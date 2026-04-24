/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import Link from 'next/link';
import type { IPagesEntity } from 'oneentry/dist/pages/pagesInterfaces';
import type { JSX } from 'react';

import { useAppDispatch, useAppSelector } from '@/app/store/hooks';
import {
  addReservationToCart,
  selectReservationId,
} from '@/app/store/reducers/CartSlice';

/**
 * Row renderer for search results — links to product page and records the
 * product as the active reservation entry (used by cart/price selectors).
 * @param   {object}        props          - Component props.
 * @param   {any}           props.pageData - Parent page data (category).
 * @param   {any}           props.product  - Product entity from search.
 * @param   {any}           props.setState - External state setter to close search modal.
 * @returns {JSX.Element}                  Row JSX.
 */
const ProductRow = ({
  pageData,
  product,
  setState,
}: {
  pageData: any;
  product: any;
  setState: any;
}): JSX.Element => {
  const dispatch = useAppDispatch();
  const reservationId = useAppSelector(selectReservationId);

  const onApplyHandle = () => {
    setState(false);
    dispatch(
      addReservationToCart({
        id: reservationId,
        product,
        restaurant: (pageData ?? {}) as IPagesEntity,
      }),
    );
  };

  return (
    <Link
      prefetch={false}
      href={`/shop/${pageData?.pageUrl || ''}`}
      onClick={() => onApplyHandle()}
      className="flex w-full py-2 text-paper hover:text-brand"
    >
      {product.localizeInfos?.title}
    </Link>
  );
};

export default ProductRow;

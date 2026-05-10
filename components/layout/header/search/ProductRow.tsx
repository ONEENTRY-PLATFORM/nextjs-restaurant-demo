'use client';

import Link from 'next/link';
import type { IPagesEntity } from 'oneentry/dist/pages/pagesInterfaces';
import type { IProductsEntity } from 'oneentry/dist/products/productsInterfaces';
import type { Dispatch, JSX, SetStateAction } from 'react';

import { useAppDispatch, useAppSelector } from '@/app/store/hooks';
import { addReservationToCart, selectReservationId } from '@/app/store/reducers/CartSlice';

/**
 * ProductRow — single search-result row; navigates to the product page and adds it to the active reservation.
 *
 * @param   {object}                              props          - Component props.
 * @param   {IPagesEntity | undefined}            props.pageData - Optional page entity used to enrich the reservation snapshot.
 * @param   {IProductsEntity}                     props.product  - Product entity for the row.
 * @param   {Dispatch<SetStateAction<boolean>>}   props.setState - Setter that closes the search results panel after navigation.
 * @returns {JSX.Element} JSX of the search-result row link.
 */
const ProductRow = ({
  pageData,
  product,
  setState,
}: {
  pageData: IPagesEntity | undefined;
  product: IProductsEntity;
  setState: Dispatch<SetStateAction<boolean>>;
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
      })
    );
  };

  return (
    <Link
      prefetch={false}
      href={`/shop/product/${product.id}`}
      onClick={() => onApplyHandle()}
      className="flex w-full py-2 text-paper hover:text-brand"
    >
      {product.localizeInfos?.title}
    </Link>
  );
};

export default ProductRow;

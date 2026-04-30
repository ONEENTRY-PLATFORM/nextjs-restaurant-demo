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
 * Рендерер строки результатов поиска — ссылка на страницу продукта; записывает
 * продукт как активную запись reservation (используется селекторами cart/price).
 * @param   {object}        props          - Пропсы компонента.
 * @param   {any}           props.pageData - Данные родительской страницы (категории).
 * @param   {any}           props.product  - Сущность продукта из поиска.
 * @param   {any}           props.setState - Внешний setter state для закрытия модалки поиска.
 * @returns {JSX.Element}                  JSX строки.
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

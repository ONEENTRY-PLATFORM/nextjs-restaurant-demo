/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import Link from 'next/link';
import type { IAdminEntity } from 'oneentry/dist/admins/adminsInterfaces';
import type { IPagesEntity } from 'oneentry/dist/pages/pagesInterfaces';
import type { FC } from 'react';

import { useAppDispatch, useAppSelector } from '@/app/store/hooks';
import {
  addServiceToCart,
  selectServiceId,
  // setTabsState,
} from '@/app/store/reducers/CartSlice';

const ProductRow: FC<{ pageData: any; product: any; setState: any }> = ({
  pageData,
  product,
  setState,
}) => {
  const dispatch = useAppDispatch();
  const serviceId = useAppSelector(selectServiceId);

  const onApplyHandle = () => {
    setState(false);
    // add product
    dispatch(
      addServiceToCart({
        id: serviceId,
        product,
        service: pageData || ({} as IPagesEntity),
        salon: {} as IPagesEntity,
        master: {} as IAdminEntity,
      }),
    );
    // dispatch(setTabsState({ key: 'products', value: true }));
    // dispatch(setTabsState({ key: 'services', value: true }));
  };

  return (
    <Link
      prefetch={false}
      href={`/shop/${pageData?.pageUrl || ''}`}
      onClick={() => onApplyHandle()}
      className="flex w-full py-2 text-black hover:text-orange-500"
    >
      {product.localizeInfos?.title}
    </Link>
  );
};

export default ProductRow;

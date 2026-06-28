'use client';

import Image from 'next/image';
import Link from 'next/link';
import type { JSX } from 'react';

import FadeTransition from '@/app/animations/FadeTransition';
import { useT } from '@/app/store/providers/DictProvider';

/**
 * EmptyCart — empty-state shown when the cart has no products (icon + heading + go-to-shop link).
 *
 * @returns JSX of the empty cart fade-in card.
 */
const EmptyCart = (): JSX.Element => {
  const t = useT();
  return (
    <FadeTransition
      className="relative box-border flex shrink-0 flex-col items-center text-center text-paper/90"
      index={2}
    >
      <Image
        width={100}
        height={100}
        src={'/images/icons/cart.svg'}
        alt={'empty_cart'}
        className="mb-5 size-20 opacity-20"
      />
      <h1 className="mb-5 text-lg font-bold text-brand uppercase">
        {t('empty_cart_title', 'Empty cart')}
      </h1>
      <Link
        href={'/shop/'}
        className="hover_btn_brand rounded-card border border-brand px-4 py-2 font-normal text-brand"
      >
        {t('go_to_shop', 'Go to shop')}
      </Link>
    </FadeTransition>
  );
};

export default EmptyCart;

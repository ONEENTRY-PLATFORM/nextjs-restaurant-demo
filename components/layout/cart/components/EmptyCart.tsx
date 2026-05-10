import Image from 'next/image';
import Link from 'next/link';
import type { JSX } from 'react';

import FadeTransition from '@/app/animations/FadeTransition';

/** Empty cart state. */
const EmptyCart = (): JSX.Element => {
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
      <h1 className="mb-5 text-lg font-bold uppercase text-brand">Empty cart</h1>
      <Link
        prefetch={true}
        href={'/shop/'}
        className="rounded-card border border-brand text-brand font-normal px-4 py-2 hover_btn_white"
      >
        Go to shop
      </Link>
    </FadeTransition>
  );
};

export default EmptyCart;

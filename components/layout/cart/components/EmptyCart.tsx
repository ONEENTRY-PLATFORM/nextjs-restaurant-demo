import Image from 'next/image';
import Link from 'next/link';
import type { FC } from 'react';

import FadeTransition from '@/app/animations/FadeTransition';

/**
 * Empty cart page
 * @param lang Current language shortcode
 *
 * @returns
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const EmptyCart: FC<{ dict: any }> = () => {
  return (
    <FadeTransition
      className="relative box-border flex shrink-0 flex-col items-center text-center text-slate-800"
      index={2}
    >
      <Image
        width={100}
        height={100}
        src={'/icons/cart.svg'}
        alt={'empty_cart'}
        className="mb-5 size-20 opacity-20"
      />
      <h1 className="mb-5 text-lg font-bold uppercase text-slate-600">
        Empty cart
      </h1>
      <Link
        prefetch={true}
        href={'/shop/'}
        className="btn btn-sm btn-o btn-o-primary"
      >
        Go to shop
      </Link>
    </FadeTransition>
  );
};

export default EmptyCart;

import Image from 'next/image';
import { type JSX } from 'react';

/**
 * ProductsNotFound
 */
const ProductsNotFound = async (): Promise<JSX.Element> => {
  return (
    <div className="text-center">
      <Image
        width={100}
        height={100}
        src={'/icons/cart.svg'}
        alt="..."
        className="mx-auto mb-5 size-20"
      />
      <div className="text-center text-lg">Products not found</div>
    </div>
  );
};

export default ProductsNotFound;

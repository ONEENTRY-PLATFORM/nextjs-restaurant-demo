import type { IProductsEntity } from 'oneentry/dist/products/productsInterfaces';
import type { JSX } from 'react';

import { getProductById } from '@/app/api';
import { ServerProvider } from '@/app/store/providers/ServerProvider';
import CartWizard from '@/components/cart/CartWizard';

import { getDictionary } from '../dictionaries';

/** Define the response type */
type ProductResponse = {
  isError: boolean;
  error?: {
    statusCode: number;
    message: string;
  };
  product?: IProductsEntity;
};

/**
 * Cart page layout component that renders the shopping cart page
 *
 * This async server component fetches dictionary data for internationalization
 * and delivery product data, then renders the cart page with sidebar layout.
 * @returns {Promise<JSX.Element>}              Cart page layout JSX.Element
 * @see {@link https://nextjs.org/docs/app/api-reference/file-conventions/page Next.js docs}
 */
const CartPageLayout = async (): Promise<JSX.Element> => {
  /** Get dictionary and set to server provider */
  const [dict] = ServerProvider('dict', await getDictionary());

  /** Get delivery(product) data by product id */
  const response = await getProductById(83);

  /** Check if response has error */
  const deliveryData = response.isError
    ? undefined
    : (response as ProductResponse).product;

  /** Cart layout — mobile-centric `max-w-[390px]` flow per static-html/cart*.html */
  return (
    <section
      className="min-h-screen bg-black bg-cover bg-no-repeat"
      style={{ backgroundImage: "url('/images/picture/bg_cart.png')" }}
    >
      <div className="max-w-97.5 mx-auto">
        <CartWizard
          dict={dict}
          deliveryData={deliveryData as IProductsEntity}
        />
      </div>
    </section>
  );
};

export default CartPageLayout;

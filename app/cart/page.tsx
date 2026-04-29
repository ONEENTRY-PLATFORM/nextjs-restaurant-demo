import type { IProductsEntity } from 'oneentry/dist/products/productsInterfaces';
import type { JSX } from 'react';

import { getBlogBanners, getProductById } from '@/app/api';
import { ServerProvider } from '@/app/store/providers/ServerProvider';
import CartPromoSidebar from '@/components/cart/CartPromoSidebar';
import CartWizard from '@/components/cart/CartWizard';

import { getDictionary } from '../dictionaries';

// Opt out of static prerender — the shared layout chain includes
// `useSearchParams()` (search bar / filter bottom sheet) which Next.js
// requires to be wrapped in Suspense for static generation. Rendering
// dynamically sidesteps the prerender-time bailout (same approach as the
// home page).
export const dynamic = 'force-dynamic';

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

  /** Promo banners from OneEntry `blog` (desktop sidebar). */
  const banners = await getBlogBanners();

  /**
   * Cart layout — mobile flow from `cart_cart.html` (max-w 390px), desktop
   * 2-column flow from `pk_cart.html` (md:700 / lg:1000 / xl:1292).
   */
  return (
    <section className="min-h-screen bg-black bg-[url('/images/picture/bg_cart.png')] bg-cover bg-no-repeat md:bg-none">
      <div className="mx-auto w-full max-w-97.5 px-4 md:max-w-175 lg:max-w-250 xl:max-w-323">
        <CartWizard
          dict={dict}
          deliveryData={deliveryData as IProductsEntity}
          promoSidebar={<CartPromoSidebar banners={banners} />}
        />
      </div>
    </section>
  );
};

export default CartPageLayout;

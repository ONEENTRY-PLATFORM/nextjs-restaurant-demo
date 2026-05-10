import type { IProductsEntity } from 'oneentry/dist/products/productsInterfaces';
import type { JSX } from 'react';

import { getBlogBanners, getProductById } from '@/app/api';
import { DELIVERY_PRODUCT_ID } from '@/app/utils/constants';
import CartPromoSidebar from '@/components/cart/CartPromoSidebar';
import CartWizard from '@/components/cart/CartWizard';

// Force-dynamic: the layout chain uses `useSearchParams()`, which would
// otherwise require Suspense wrapping for prerender.
export const dynamic = 'force-dynamic';

type ProductResponse = {
  isError: boolean;
  error?: {
    statusCode: number;
    message: string;
  };
  product?: IProductsEntity;
};

/**
 * CartPageLayout — server-rendered `/cart` page; loads delivery product, promo banners, and renders `<CartWizard />`.
 *
 * @returns {Promise<JSX.Element>} Promise resolving to JSX of the cart page layout (wizard with promo sidebar).
 */
const CartPageLayout = async (): Promise<JSX.Element> => {
  const response = await getProductById(DELIVERY_PRODUCT_ID);
  const deliveryData = response.isError ? undefined : (response as ProductResponse).product;
  const banners = await getBlogBanners();

  return (
    <section className="min-h-screen bg-black">
      <div className="mx-auto w-full max-w-85 px-4 xs:max-w-none md:max-w-175 lg:max-w-250 xl:max-w-323">
        <CartWizard
          deliveryData={deliveryData as IProductsEntity}
          promoSidebar={<CartPromoSidebar banners={banners} />}
        />
      </div>
    </section>
  );
};

export default CartPageLayout;

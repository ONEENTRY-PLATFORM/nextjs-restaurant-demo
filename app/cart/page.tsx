import type { IProductsEntity } from 'oneentry/dist/products/productsInterfaces';
import type { JSX } from 'react';

import { getBlogBanners, getProductById } from '@/app/api';
import { DELIVERY_PRODUCT_ID } from '@/app/utils/constants';
import CartPromoSidebar from '@/components/cart/CartPromoSidebar';
import CartWizard from '@/components/cart/CartWizard';

// Force-dynamic: цепочка layout-ов содержит `useSearchParams()`, который иначе
// требует оборачивать в Suspense для prerender.
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
 * CartPageLayout — серверная страница `/cart`, грузит deliveryData/баннеры и рендерит wizard.
 * @returns {Promise<JSX.Element>} JSX layout-а страницы корзины.
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

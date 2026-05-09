import type { IProductsEntity } from 'oneentry/dist/products/productsInterfaces';
import type { JSX } from 'react';

import { getBlogBanners, getProductById } from '@/app/api';
import { DELIVERY_PRODUCT_ID } from '@/app/utils/constants';
import CartPromoSidebar from '@/components/cart/CartPromoSidebar';
import CartWizard from '@/components/cart/CartWizard';

// Отключаем статический prerender — общая цепочка layout-ов включает
// `useSearchParams()` (поисковая строка / bottom sheet фильтра), который Next.js
// требует оборачивать в Suspense для статической генерации. Динамический рендер
// обходит prerender-time bailout (тот же подход, что и на home-странице).
export const dynamic = 'force-dynamic';

/** Определяет тип ответа */
type ProductResponse = {
  isError: boolean;
  error?: {
    statusCode: number;
    message: string;
  };
  product?: IProductsEntity;
};

/**
 * Компонент layout-а страницы корзины, рендерящий страницу корзины.
 *
 * Этот асинхронный server-компонент загружает данные словаря для интернационализации
 * и данные продукта-доставки, затем рендерит страницу корзины с layout-ом sidebar.
 * @returns {Promise<JSX.Element>}              JSX.Element layout-а страницы корзины.
 * @see {@link https://nextjs.org/docs/app/api-reference/file-conventions/page Next.js docs}
 */
const CartPageLayout = async (): Promise<JSX.Element> => {
  /** Получаем данные доставки (продукта) по id продукта */
  const response = await getProductById(DELIVERY_PRODUCT_ID);

  /** Проверяем, есть ли в ответе ошибка */
  const deliveryData = response.isError ? undefined : (response as ProductResponse).product;

  /** Промо-баннеры из OneEntry `blog` (десктопный sidebar). */
  const banners = await getBlogBanners();

  /**
   * Cart layout — мобильный флоу из `cart_cart.html` (max-w 390px), десктопный
   * 2-колоночный флоу из `pk_cart.html` (md:700 / lg:1000 / xl:1292).
   */
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

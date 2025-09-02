import type { IProductsEntity } from 'oneentry/dist/products/productsInterfaces';
import type { FC } from 'react';

import WithSidebar from '@/app/[lang]/[page]/WithSidebar';
import { getProductById } from '@/app/api';
import { ServerProvider } from '@/app/store/providers/ServerProvider';
import CartPage from '@/components/layout/cart';

import { getDictionary } from '../dictionaries';

/**
 * Cart page
 * @async server component
 * @param params
 * @see {@link https://nextjs.org/docs/app/api-reference/file-conventions/page Next.js docs}
 * @returns Cart page layout JSX.Element
 */
const CartPageLayout: FC<any> = async ({ params }) => {
  const { lang } = await params;
  // Get delivery(product) data by product id
  const { product } = await getProductById(83);

  return (
    <section className="relative mx-auto box-border flex min-h-80 w-full max-w-screen-xl shrink-0 grow flex-col self-stretch">
      <div className="flex w-full flex-col items-center gap-5 bg-white">
        <WithSidebar dict={dict}>
          <CartPage
            dict={dict}
            deliveryData={product as IProductsEntity}
          />
        </WithSidebar>
      </div>
    </section>
  );
};

export default CartPageLayout;
